"""Run a campaign as a standalone process (robust, long-running) — writes to Neon.

A run = Objective × Technique × Persona [× CSRT]. The API can read status/transcripts from Neon while
this runs.
  uv run python scripts/run_campaign.py                                    # all active objectives × techniques
  uv run python scripts/run_campaign.py --objectives disclosure.undisclosed-ai
  uv run python scripts/run_campaign.py --modes COERCION --techniques actor-attack crescendo
  uv run python scripts/run_campaign.py --objectives disclosure.undisclosed-ai --csrt both
  uv run python scripts/run_campaign.py --n 2 --limit 20
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from autosentinx.catalog import Catalog
from autosentinx.config import get_settings
from autosentinx.library import Library, enumerate_runs
from autosentinx.models import Run
from autosentinx.runner import Runner
from autosentinx.store import SqlModelStore


async def main(args) -> None:
    s = get_settings()
    store = SqlModelStore()
    catalog = await Catalog.load()
    library = await Library.load()
    runspecs = enumerate_runs(
        catalog, library, objective_slugs=args.objectives, modes=args.modes,
        technique_slugs=args.techniques, include_draft=args.include_draft,
        n_per_objective=args.n, csrt_mode=args.csrt,
    )
    if args.limit:
        runspecs = runspecs[: args.limit]
    if not runspecs:
        print("no runs selected", flush=True)
        return
    run = Run(target_url=s.aarav_base_url, note=f"phase4 cli campaign ({len(runspecs)} runs)")
    await store.create_run(run)
    print(f"RUN_ID {run.id}  runs={len(runspecs)}", flush=True)
    for rs in runspecs[:40]:
        print("  -", rs.label, "| persona:", rs.persona_slug, flush=True)
    await Runner().run_campaign(run.id, runspecs)
    d = await store.get_run(run.id)
    r = d["run"]
    print(f"DONE status={r.status} succeeded={r.num_succeeded}/{r.num_attempts}", flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--objectives", nargs="*", default=None, help="objective slugs")
    ap.add_argument("--modes", nargs="*", default=None, help="spine modes")
    ap.add_argument("--techniques", nargs="*", default=None, help="technique slugs")
    ap.add_argument("--n", type=int, default=None, help="cap techniques per objective")
    ap.add_argument("--csrt", default="off", choices=["off", "on", "both"])
    ap.add_argument("--include-draft", action="store_true")
    ap.add_argument("--limit", type=int, default=None, help="cap total runs")
    asyncio.run(main(ap.parse_args()))
