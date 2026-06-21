"""AutoSentinx POC — FastAPI API (Phase 1: the attacker).

  GET  /health                 — Gemini · AARAV signed-card · Neon
  POST /scan?modes=&ids=&limit= — launch a campaign (recon + multi-turn Hinglish attacks) as a background task
  GET  /runs                   — list campaigns
  GET  /runs/{id}              — campaign + attempts + turns (raw)
  GET  /runs/{id}/transcript   — readable transcripts per objective
"""
import asyncio
import collections
import json
import os
import subprocess
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from autosentinx.audit import append_event, verify_chain
from autosentinx.catalog import Catalog
from autosentinx.config import get_settings
from autosentinx.console import ConsoleView
from autosentinx.coverage import build_archive
from autosentinx.db import SessionLocal
from autosentinx.ingestion import ingest
from autosentinx.library import Library, enumerate_runs
from autosentinx.llm import make_llm
from autosentinx.models import Run, User, _now
from autosentinx.runner import Runner
from autosentinx.security import _decode, authenticate, create_access_token, create_user, current_user
from autosentinx.selection import Selector
from autosentinx.store import SqlModelStore
from autosentinx.target import AaravTarget
from autosentinx.web import LANDING_HTML


@asynccontextmanager
async def lifespan(app: FastAPI):
    # schema is managed by Alembic — apply any pending migrations on startup
    await asyncio.to_thread(
        subprocess.run, [sys.executable, "-m", "alembic", "upgrade", "head"], check=False
    )
    yield


app = FastAPI(title="AutoSentinx", version="1.0.0", lifespan=lifespan)
store = SqlModelStore()

# --- auth gate: every path except the open set requires a valid bearer token ---
_OPEN_PATHS = {"/", "/health", "/auth/signup", "/auth/login", "/docs", "/redoc",
               "/openapi.json", "/favicon.ico"}


@app.middleware("http")
async def require_auth(request: Request, call_next):
    path = request.url.path
    if path in _OPEN_PATHS or path.startswith(("/docs", "/redoc", "/static")):
        return await call_next(request)
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return JSONResponse({"detail": "not authenticated — log in at / and send a Bearer token"}, status_code=401)
    try:
        _decode(auth.split(" ", 1)[1])
    except HTTPException as e:
        return JSONResponse({"detail": e.detail}, status_code=e.status_code)
    return await call_next(request)


class Credentials(BaseModel):
    email: str
    password: str


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing():
    return LANDING_HTML


@app.post("/auth/signup")
async def signup(body: Credentials):
    if len(body.password) < 8:
        raise HTTPException(400, "password must be at least 8 characters")
    user = await create_user(body.email, body.password)
    return {"access_token": create_access_token(user.email), "token_type": "bearer", "email": user.email}


@app.post("/auth/login")
async def login(body: Credentials):
    user = await authenticate(body.email, body.password)
    return {"access_token": create_access_token(user.email), "token_type": "bearer", "email": user.email}


@app.get("/auth/me")
async def me(user: User = Depends(current_user)):
    return {"email": user.email, "created_at": user.created_at.isoformat()}


@app.get("/health")
async def health():
    out: dict = {"ok": True, "checks": {}}
    try:
        out["checks"]["llm"] = bool(await make_llm().generate("Reply with the single word: ok"))
    except Exception as e:  # noqa: BLE001
        out["checks"]["llm"] = f"ERROR: {e}"; out["ok"] = False
    try:
        s = get_settings(); t = AaravTarget()
        if s.aarav_verify_card:
            await t.discover_and_verify()
            out["checks"]["aarav"] = "card-verified"
        else:
            r = await t._client.get(f"{t.base}/.well-known/agent-card.json")
            out["checks"]["aarav"] = f"reachable (card unverified, HTTP {r.status_code})"
        await t.aclose()
    except Exception as e:  # noqa: BLE001
        out["checks"]["aarav"] = f"ERROR: {e}"; out["ok"] = False
    try:
        await store.list_runs(); out["checks"]["neon_db"] = True
    except Exception as e:  # noqa: BLE001
        out["checks"]["neon_db"] = f"ERROR: {e}"; out["ok"] = False
    return out


async def _roe_launch_check(run_id: str, roe: dict, operator: str) -> None:
    """Launch-time RoE policy gate (P3, decision 17). Builds the manifest from the approved request,
    evaluates operator/target/scope + sandbox-tenant attestation, and audits the decision. ADVISORY by
    default (logs + proceeds); set ROE_ENFORCE=1 to fail-closed (raise RoEDenied before any egress).

    Until /scan collects a sandbox attestation, the attestation is empty → the check records an advisory
    'target not attested as a sandbox tenant' finding without blocking the scan."""
    from autosentinx.roe import (AlwaysClear, RoEDenied, RoEManifest, SandboxAttestation,
                                 decide_launch)
    tgt = roe.get("target") or ""
    # build the attestation from what /scan recorded: when the operator attested a sandbox tenant,
    # all four real channels are asserted disabled; otherwise an empty attestation → advisory deny.
    attested = bool(roe.get("sandbox_attested"))
    attestation = SandboxAttestation(
        target_id=tgt, dialing_disabled=attested, sms_disabled=attested, crm_disabled=attested,
        pii_lookup_disabled=attested, attested_by=(roe.get("attested_by") or operator) if attested else "",
    )
    decision = decide_launch(
        RoEManifest(operator=operator, target_id=tgt, allowed_techniques=set(roe.get("techniques") or [])),
        attestation, AlwaysClear(), operator=operator, target_id=tgt,
    )
    enforce = os.environ.get("ROE_ENFORCE") in ("1", "true", "True")
    await append_event("roe.launch_checked", run_id=run_id, actor=operator,
                       detail={"allow": decision.allow, "reason": decision.reason,
                               "enforce": enforce, "target": tgt})
    if not decision.allow:
        if enforce:
            raise RoEDenied(decision.reason)        # fail-closed before any egress
        print(f"[roe] advisory: launch check '{decision.reason}' "
              f"(set ROE_ENFORCE=1 to block)", file=sys.stderr)


async def _run_approved(run_id: str, roe: dict, operator: str = "operator") -> None:
    """Governance-gated dispatch: audit started → RoE launch check → run the campaign → audit completed."""
    await append_event("scan.started", run_id=run_id, detail={"strategy": roe.get("strategy")})
    try:
        await _roe_launch_check(run_id, roe, operator)
    except Exception as e:  # noqa: BLE001  — RoEDenied (enforce mode) aborts fail-closed before egress
        await store.set_run_status(run_id, "failed", 0, 0)
        await append_event("scan.blocked", run_id=run_id, actor=operator, detail={"reason": str(e)[:200]})
        return
    runner = Runner()
    strat = roe.get("strategy", "ucb")
    csrt_on = roe.get("csrt", "off") in ("on", "both")
    tgt = roe.get("target")  # exact target URL recorded at /scan time
    try:
        if strat == "fairness":
            await runner.run_fairness(run_id, target_base=tgt)
        elif strat in ("ucb", "random"):
            await runner.run_budget(run_id, roe.get("objectives"), roe.get("budget", 40), strat,
                                    roe.get("modes"), csrt_on, target_base=tgt)
        else:  # exhaustive
            catalog = await Catalog.load(); library = await Library.load()
            runspecs = enumerate_runs(
                catalog, library, objective_slugs=roe.get("objectives"), modes=roe.get("modes"),
                technique_slugs=roe.get("techniques"), include_draft=roe.get("include_draft", False),
                n_per_objective=roe.get("n_per_objective"), csrt_mode=roe.get("csrt", "off"),
            )
            if roe.get("limit"):
                runspecs = runspecs[: roe["limit"]]
            await runner.run_campaign(run_id, runspecs, target_base=tgt)
    finally:
        d = await store.get_run(run_id)
        r = d["run"] if d else None
        await append_event("scan.completed", run_id=run_id,
                           detail={"status": r.status if r else "?",
                                   "succeeded": r.num_succeeded if r else 0,
                                   "attempts": r.num_attempts if r else 0})


@app.post("/scan")
async def scan(
    target: str = Query(..., description="the target agent's API base URL to scan (required)"),
    strategy: str = Query("ucb", description="ucb | random | exhaustive | fairness"),
    budget: int = Query(40, description="number of attacks (ucb/random)"),
    objectives: Optional[list[str]] = Query(None),
    modes: Optional[list[str]] = Query(None),
    techniques: Optional[list[str]] = Query(None),
    n_per_objective: Optional[int] = Query(None),
    csrt: str = Query("off"),
    include_draft: bool = Query(False),
    limit: Optional[int] = Query(None),
    sandbox_attested: bool = Query(
        False, description="operator attests the target is a sandbox/test tenant with real borrower "
                           "channels (dialing/SMS/CRM/PII-lookup) DISABLED — required for the RoE launch "
                           "check to pass (advisory unless ROE_ENFORCE=1)"),
    attested_by: Optional[str] = Query(None, description="attesting authority for the sandbox attestation"),
):
    """Request a scan. Governance (Phase 7): the run is created PENDING_APPROVAL and does NOT run until
    POST /runs/{id}/approve. The RoE (scope + params) is recorded; an audit event is chained.

    The scan runs against the exact `target` URL supplied here (any AARAV-compatible agent), so the same
    console can red-team different NBFC agents — the target is no longer read from the environment."""
    from urllib.parse import urlparse
    tgt = (target or "").strip().rstrip("/")
    parsed = urlparse(tgt)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400,
                            detail="target must be a valid http(s) URL, e.g. https://agent.example.com")
    roe = {"strategy": strategy, "budget": budget, "objectives": objectives, "modes": modes,
           "techniques": techniques, "n_per_objective": n_per_objective, "csrt": csrt,
           "include_draft": include_draft, "limit": limit, "target": tgt,
           "sandbox_attested": sandbox_attested, "attested_by": attested_by}
    run = Run(target_url=tgt, status="pending_approval", note=f"{strategy} scan (pending approval)",
              roe=json.dumps(roe))
    await store.create_run(run)
    await append_event("scan.created", run_id=run.id, detail={"strategy": strategy, "roe": roe})
    return {"run_id": run.id, "status": "pending_approval",
            "message": "RoE recorded. POST /runs/{id}/approve to run.", "roe": roe}


@app.post("/runs/{run_id}/approve")
async def approve_run(run_id: str, background: BackgroundTasks, approver: str = Query("operator")):
    """Approve a pending scan → it runs within its recorded RoE (Phase 7 governance gate)."""
    d = await store.get_run(run_id)
    if not d:
        raise HTTPException(status_code=404, detail="run not found")
    run = d["run"]
    if run.status != "pending_approval":
        raise HTTPException(status_code=409, detail=f"run is {run.status}, not pending_approval")
    roe = json.loads(run.roe or "{}")
    async with SessionLocal() as sess:
        r = await sess.get(Run, run_id)
        r.status = "running"; r.approved_by = approver; r.approved_at = _now()
        sess.add(r); await sess.commit()
    await append_event("scan.approved", run_id=run_id, actor=approver, detail={"strategy": roe.get("strategy")})
    background.add_task(_run_approved, run_id, roe, approver)
    return {"run_id": run_id, "status": "running", "approved_by": approver}


@app.get("/catalog")
async def catalog(
    family: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    pillar: Optional[str] = Query(None),
    framework: Optional[str] = Query(None),
):
    """List objectives, optionally filtered by family / mode / pillar / framework."""
    cat = await Catalog.load()
    out = cat.all()
    if family:
        out = [o for o in out if o.family == family]
    if mode:
        out = [o for o in out if o.mode.upper() == mode.upper()]
    if pillar:
        out = [o for o in out if o.primary_pillar == pillar.lower()]
    if framework:
        out = [o for o in out if any(e.framework == framework for e in o.crosswalk)]
    return {
        "count": len(out), "spine": "spine-v1.0",
        "objectives": [
            {
                "slug": o.slug, "title": o.title, "mode": o.mode, "family": o.family,
                "pillar": o.primary_pillar, "severity": o.severity, "status": o.status,
                "gradeable": o.gradeable,
                "frameworks": sorted({e.framework for e in o.crosswalk}),
            }
            for o in out
        ],
    }


@app.get("/catalog/coverage")
async def catalog_coverage():
    """Objective × Technique coverage grid: how many techniques apply per objective/mode, gradeable vs draft."""
    cat = await Catalog.load()
    lib = await Library.load()
    by_mode: dict = {}
    objectives = []
    for o in cat.all():
        techs = lib.techniques_for(o.slug)
        objectives.append({
            "slug": o.slug, "mode": o.mode, "status": o.status, "gradeable": o.gradeable,
            "num_techniques": len(techs), "techniques": techs,
        })
        m = by_mode.setdefault(o.mode, {"objectives": 0, "with_techniques": 0, "pairs": 0, "draft": 0})
        m["objectives"] += 1
        m["with_techniques"] += 1 if techs else 0
        m["pairs"] += len(techs)
        m["draft"] += 1 if o.status == "draft" else 0
    return {
        "spine": "spine-v1.0", "techniques": [t.slug for t in lib.techniques()],
        "personas": [p.slug for p in lib.personas()],
        "totals": {
            "objectives": len(cat), "modes": len(by_mode),
            "objectives_with_techniques": sum(1 for o in objectives if o["num_techniques"]),
            "gradeable": sum(1 for o in objectives if o["gradeable"]),
            "draft": sum(1 for o in objectives if o["status"] == "draft"),
            "objective_technique_pairs": sum(o["num_techniques"] for o in objectives),
        },
        "by_mode": by_mode,
        "objectives": sorted(objectives, key=lambda x: (-x["num_techniques"], x["mode"])),
    }


@app.get("/catalog/{slug}")
async def catalog_objective(slug: str):
    cat = await Catalog.load()
    lib = await Library.load()
    o = cat.get(slug)
    if not o:
        raise HTTPException(status_code=404, detail="objective not found")
    return {
        "slug": o.slug, "title": o.title, "description": o.goal, "mode": o.mode, "family": o.family,
        "pillar": o.primary_pillar, "severity": o.severity, "status": o.status,
        "testability": o.testability, "gradeable": o.gradeable, "tags": o.tags,
        "success_definition": o.success_definition, "rule": o.rule,
        "crosswalk": [e.model_dump() for e in o.crosswalk],
        "techniques": lib.techniques_for(slug),
    }


@app.get("/techniques")
async def techniques():
    lib = await Library.load()
    return {
        "count": len(lib.techniques()),
        "techniques": [
            {
                "slug": t.slug, "title": t.title, "class": t.technique_class,
                "applicable_modes": t.applicable_modes, "modifiers": t.modifiers,
                "provenance": t.provenance, "status": t.status,
                "phases": [p.name for p in t.phase_plan],
            }
            for t in lib.techniques()
        ],
        "personas": [{"slug": p.slug, "title": p.title, "attributes": p.attributes} for p in lib.personas()],
    }


@app.get("/techniques/{slug}")
async def technique_detail(slug: str):
    lib = await Library.load()
    t = lib.technique(slug)
    if not t:
        raise HTTPException(status_code=404, detail="technique not found")
    return {
        "slug": t.slug, "title": t.title, "class": t.technique_class, "strategy": t.strategy,
        "applicable_modes": t.applicable_modes, "modifiers": t.modifiers, "provenance": t.provenance,
        "phase_plan": [p.model_dump() for p in t.phase_plan],
    }


@app.get("/coverage")
async def coverage(run_id: Optional[str] = Query(None, description="scope to one run; omit = all runs")):
    """MAP-Elites coverage archive + QD-Score + gap register (Phase 5 H2)."""
    if run_id:
        d = await store.get_run(run_id)
        if not d:
            raise HTTPException(status_code=404, detail="run not found")
        attempts = [a["attempt"] for a in d["attempts"]]
    else:
        attempts = await store.all_attempts()
    return {"run_id": run_id, **build_archive(attempts)}


@app.get("/selection/stats")
async def selection_stats():
    """The Discounted-UCB bandit value table per (objective, technique) — Phase 5 H1."""
    catalog = await Catalog.load()
    selector = await Selector.load(catalog)
    return {"stats": selector.stats_table()}


@app.post("/ingest")
async def ingest_source(
    source_type: str = Query(..., description="regulation | research | web | file | text"),
    content: str = Query(..., description="pasted text, a URL, or a file path"),
):
    """Autonomously ingest a source → extract → dedup → integrate into the catalog (Phase 7)."""
    result = await ingest(source_type, content)
    await append_event("ingest.completed", detail={
        "source_type": source_type, "integrated": [o["slug"] for o in result["integrated"]],
        "skipped": len(result["skipped"]),
    })
    return result


@app.get("/audit")
async def audit(run_id: Optional[str] = Query(None, description="scope to one run; omit = all")):
    """The hash-chained governance audit log + chain verification (Phase 7)."""
    return await verify_chain(run_id)


@app.get("/console/runs")
async def console_runs():
    """Run list in the frontend (sentinx-web) view-model shape."""
    catalog = await Catalog.load()
    cv = ConsoleView(catalog)
    runs = await store.list_runs()
    return {"runs": [cv.run_summary(r) for r in runs]}


@app.get("/console/runs/{run_id}")
async def console_run(
    run_id: str,
    redact_recipe: bool = Query(True, description="P9 dual-use guard: when true (default) the report "
                                                  "abstracts the reconstructable attacker recipe. Pass "
                                                  "false to view full recipe detail — that access is "
                                                  "audit-logged."),
    viewer: str = Query("operator", description="who is viewing (recorded when full recipe is requested)"),
):
    """One run + observations in the frontend view-model shape (catalog-joined, D8 split, fairness grouped).

    Recipe suppression (P9): standard views abstract the attacker probe + technique; requesting the full
    recipe (redact_recipe=false) is the access-gated, audit-logged detail path."""
    d = await store.get_run(run_id)
    if not d:
        raise HTTPException(status_code=404, detail="run not found")
    if not redact_recipe:  # access-gated full recipe → audit the access (P9)
        await append_event("recipe.detail_viewed", run_id=run_id, actor=viewer, detail={"run_id": run_id})
    catalog = await Catalog.load()
    return ConsoleView(catalog).run_full(d["run"], d["attempts"], redact_recipe=redact_recipe)


@app.get("/runs")
async def list_runs():
    return await store.list_runs()


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    d = await store.get_run(run_id)
    if not d:
        raise HTTPException(status_code=404, detail="run not found")
    return d


@app.get("/runs/{run_id}/transcript")
async def transcript(run_id: str):
    d = await store.get_run(run_id)
    if not d:
        raise HTTPException(status_code=404, detail="run not found")
    run = d["run"]
    atts = [a["attempt"] for a in d["attempts"]]
    judged = [a for a in atts if a.outcome in ("succeeded", "defended")]
    succ = [a for a in judged if a.outcome == "succeeded"]
    by_mode: dict = {}
    for a in atts:
        by_mode.setdefault(a.mode, collections.Counter())[a.outcome] += 1
    out = {
        "run_id": run_id, "status": run.status,
        "summary": {
            "asr1": round(len(succ) / len(judged), 3) if judged else 0.0,  # succeeded / judged
            "judged": len(judged), "succeeded": len(succ),
            "blocked": sum(a.outcome == "blocked" for a in atts),
            "errors": sum(a.outcome == "error" for a in atts),
            "by_mode": {m: dict(c) for m, c in by_mode.items()},
        },
        "attempts": [],
    }
    for a in d["attempts"]:
        att = a["attempt"]
        out["attempts"].append({
            "objective": att.objective_id, "objective_slug": att.objective_slug,
            "technique": att.technique_slug, "persona": att.persona_slug, "csrt": att.csrt,
            "mode": att.mode, "outcome": att.outcome,
            "verdict_score": att.verdict_score, "rule": att.rule,
            "error": att.error,
            "judge_votes": json.loads(att.judge_votes or "[]"),
            "detector_hits": json.loads(att.detector_hits or "[]"),
            "transcript": [
                {
                    "turn": t.idx, "phase": t.phase, "attacker": t.attacker_line,
                    "agent": t.target_reply, "incall_label": t.label,
                    "aarav_clean": t.compliance_clean, "aarav_violations": t.violations,
                }
                for t in a["turns"]
            ],
        })
    return out
