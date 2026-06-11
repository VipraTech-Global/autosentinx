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
import subprocess
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query

from autosentinx.catalog import Catalog
from autosentinx.config import get_settings
from autosentinx.llm import make_llm
from autosentinx.models import Run
from autosentinx.playlib import load_plays
from autosentinx.runner import Runner
from autosentinx.store import SqlModelStore
from autosentinx.target import AaravTarget


@asynccontextmanager
async def lifespan(app: FastAPI):
    # schema is managed by Alembic — apply any pending migrations on startup
    await asyncio.to_thread(
        subprocess.run, [sys.executable, "-m", "alembic", "upgrade", "head"], check=False
    )
    yield


app = FastAPI(title="autosentinx-poc", version="0.2.0", lifespan=lifespan)
store = SqlModelStore()


@app.get("/health")
async def health():
    out: dict = {"ok": True, "checks": {}}
    try:
        out["checks"]["llm"] = bool(await make_llm().generate("Reply with the single word: ok"))
    except Exception as e:  # noqa: BLE001
        out["checks"]["llm"] = f"ERROR: {e}"; out["ok"] = False
    try:
        t = AaravTarget(); await t.discover_and_verify(); await t.aclose()
        out["checks"]["aarav_card_verified"] = True
    except Exception as e:  # noqa: BLE001
        out["checks"]["aarav_card_verified"] = f"ERROR: {e}"; out["ok"] = False
    try:
        await store.list_runs(); out["checks"]["neon_db"] = True
    except Exception as e:  # noqa: BLE001
        out["checks"]["neon_db"] = f"ERROR: {e}"; out["ok"] = False
    return out


@app.post("/scan")
async def scan(
    background: BackgroundTasks,
    modes: Optional[list[str]] = Query(None, description="filter by mode, e.g. COERCION"),
    ids: Optional[list[str]] = Query(None, description="specific scenario ids, e.g. SC-008"),
    limit: Optional[int] = Query(None, description="cap number of plays"),
):
    s = get_settings()
    plays = load_plays("prompt-lib")
    if modes:  # plays no longer carry mode — resolve it via the catalog (objective_slug → mode)
        cat = await Catalog.load()
        want = {m.upper() for m in modes}
        plays = [p for p in plays
                 if (sp := cat.get(p.objective_slug)) and sp.mode.upper() in want]
    if ids:
        want_ids = set(ids)
        plays = [p for p in plays if p.id in want_ids]
    if limit:
        plays = plays[:limit]
    if not plays:
        raise HTTPException(status_code=400, detail="no plays match the selection")

    run = Run(target_url=s.aarav_base_url, note=f"phase1 campaign ({len(plays)} plays)")
    await store.create_run(run)
    runner = Runner()
    # dispatch seam — BackgroundTask now; swap to arq+Redis at deploy
    background.add_task(runner.run_campaign, run.id, plays, s.aarav_default_contact_id)
    return {"run_id": run.id, "num_plays": len(plays), "plays": [p.id for p in plays], "status": "running"}


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
    """Which objectives/modes have >=1 play, and which are gradeable today vs draft (Phase-6 oracle)."""
    cat = await Catalog.load()
    plays = load_plays("prompt-lib")
    play_slugs = collections.Counter(p.objective_slug for p in plays)
    by_mode: dict = {}
    objectives = []
    for o in cat.all():
        n = play_slugs.get(o.slug, 0)
        objectives.append({
            "slug": o.slug, "mode": o.mode, "status": o.status, "gradeable": o.gradeable,
            "num_plays": n,
        })
        m = by_mode.setdefault(o.mode, {"objectives": 0, "with_plays": 0, "plays": 0, "draft": 0})
        m["objectives"] += 1
        m["with_plays"] += 1 if n else 0
        m["plays"] += n
        m["draft"] += 1 if o.status == "draft" else 0
    return {
        "spine": "spine-v1.0",
        "totals": {
            "objectives": len(cat), "modes": len(by_mode),
            "objectives_with_plays": sum(1 for o in objectives if o["num_plays"]),
            "gradeable": sum(1 for o in objectives if o["gradeable"]),
            "draft": sum(1 for o in objectives if o["status"] == "draft"),
            "plays_mapped": sum(play_slugs.values()),
        },
        "by_mode": by_mode,
        "objectives": sorted(objectives, key=lambda x: (-x["num_plays"], x["mode"])),
    }


@app.get("/catalog/{slug}")
async def catalog_objective(slug: str):
    cat = await Catalog.load()
    o = cat.get(slug)
    if not o:
        raise HTTPException(status_code=404, detail="objective not found")
    plays = [p.id for p in load_plays("prompt-lib") if p.objective_slug == slug]
    return {
        "slug": o.slug, "title": o.title, "description": o.goal, "mode": o.mode, "family": o.family,
        "pillar": o.primary_pillar, "severity": o.severity, "status": o.status,
        "testability": o.testability, "gradeable": o.gradeable, "tags": o.tags,
        "success_definition": o.success_definition, "rule": o.rule,
        "crosswalk": [e.model_dump() for e in o.crosswalk],
        "plays": plays,
    }


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
            "mode": att.mode, "outcome": att.outcome,
            "verdict_score": att.verdict_score, "rule": att.rule, "persona": att.persona,
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
