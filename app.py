"""AutoSentinx POC — FastAPI API (Phase 1: the attacker).

  GET  /health                 — Gemini · AARAV signed-card · Neon
  POST /scan?modes=&ids=&limit= — launch a campaign (recon + multi-turn Hinglish attacks) as a background task
  GET  /runs                   — list campaigns
  GET  /runs/{id}              — campaign + attempts + turns (raw)
  GET  /runs/{id}/transcript   — readable transcripts per objective
"""
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query

from autosentinx.config import get_settings
from autosentinx.db import init_db
from autosentinx.llm import GeminiLLM
from autosentinx.models import Run
from autosentinx.playlib import load_plays
from autosentinx.runner import Runner
from autosentinx.store import SqlModelStore
from autosentinx.target import AaravTarget


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="autosentinx-poc", version="0.2.0", lifespan=lifespan)
store = SqlModelStore()


@app.get("/health")
async def health():
    out: dict = {"ok": True, "checks": {}}
    try:
        out["checks"]["gemini"] = bool(await GeminiLLM().generate("Reply with the single word: ok"))
    except Exception as e:  # noqa: BLE001
        out["checks"]["gemini"] = f"ERROR: {e}"; out["ok"] = False
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
    if modes:
        want = {m.upper() for m in modes}
        plays = [p for p in plays if p.mode.upper() in want]
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
    out = {
        "run_id": run_id, "status": run.status,
        "num_attempts": run.num_attempts, "num_succeeded": run.num_succeeded,
        "attempts": [],
    }
    for a in d["attempts"]:
        att = a["attempt"]
        out["attempts"].append({
            "objective": att.objective_id, "mode": att.mode, "outcome": att.outcome,
            "rule": att.rule, "persona": att.persona, "error": att.error,
            "transcript": [
                {
                    "turn": t.idx, "phase": t.phase, "attacker": t.attacker_line,
                    "agent": t.target_reply, "label": t.label,
                    "aarav_clean": t.compliance_clean, "aarav_violations": t.violations,
                }
                for t in a["turns"]
            ],
        })
    return out
