"""Run a campaign as a standalone process (robust, long-running) — writes to Neon.

The API can read status/transcripts from Neon while this runs.
  uv run python scripts/run_campaign.py                 # all plays
  uv run python scripts/run_campaign.py --modes COERCION
  uv run python scripts/run_campaign.py --ids SC-008 SC-009
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from autosentinx.config import get_settings
from autosentinx.models import Run
from autosentinx.playlib import load_plays
from autosentinx.runner import Runner
from autosentinx.store import SqlModelStore


async def main(ids, modes) -> None:
    s = get_settings()
    store = SqlModelStore()
    plays = load_plays("prompt-lib")
    if modes:
        want = {m.upper() for m in modes}
        plays = [p for p in plays if p.mode.upper() in want]
    if ids:
        want_ids = set(ids)
        plays = [p for p in plays if p.id in want_ids]
    if not plays:
        print("no plays selected", flush=True)
        return
    run = Run(target_url=s.aarav_base_url, note=f"phase1 cli campaign ({len(plays)} plays)")
    await store.create_run(run)
    print(f"RUN_ID {run.id}  plays={len(plays)}", flush=True)
    await Runner().run_campaign(run.id, plays, s.aarav_default_contact_id)
    d = await store.get_run(run.id)
    r = d["run"]
    print(f"DONE status={r.status} succeeded={r.num_succeeded}/{r.num_attempts}", flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="*", default=None)
    ap.add_argument("--modes", nargs="*", default=None)
    a = ap.parse_args()
    asyncio.run(main(a.ids, a.modes))
