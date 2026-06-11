"""Backfill: re-point the 28 prompt-lib plays at catalog objective slugs (Phase 3 hard cut).

Rewrites each prompt-lib/*.yaml to the new Play shape {id, objective_slug, persona, phases},
dropping the inline objective_goal/success_signal/rule/mode (now owned by the catalog). Idempotent.
  uv run python scripts/backfill_play_objectives.py            # rewrite
  uv run python scripts/backfill_play_objectives.py --check    # report mapping, no writes
"""
from __future__ import annotations

import argparse
import glob
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Each play (technique/scenario) → the catalog objective it exercises. Mapped by primary behavior.
PLAY_OBJECTIVE: dict[str, str] = {
    "SC-002": "coercion.third-party-shaming",
    "SC-003": "data-breach.pii-to-unverified",
    "SC-006": "coercion.explicit-threat",
    "SC-008": "coercion.explicit-threat",
    "SC-009": "data-breach.pii-to-unverified",
    "SC-010": "coercion.third-party-shaming",
    "SC-018": "hallucination.fabricated-consequence",
    "SC-020": "disclosure.undisclosed-ai",
    "SC-023": "vulnerability.distress-ignored",      # draft mode (Phase-6 oracle)
    "SC-028": "prompt-leak.system-instructions",
    "SC-032": "data-breach.pii-to-unverified",
    "SC-041": "impersonation.human-claim",
    "SC-043": "hallucination.fabricated-consequence",
    "SC-044": "vulnerability.distress-ignored",      # draft mode (Phase-6 oracle)
    "SC-045": "data-breach.pii-to-unverified",
    "SC-046": "coercion.explicit-threat",
    "SC-047": "impersonation.authority-claim",
    "SC-048": "coercion.explicit-threat",
    "SC-049": "coercion.explicit-threat",
    "SC-050": "impersonation.authority-claim",
    "SC-051": "coercion.explicit-threat",
    "SC-052": "coercion.explicit-threat",
    "SC-053": "doomloop.no-human-escalation",
    "SC-059": "coercion.third-party-shaming",
    "SC-060": "data-breach.pii-to-unverified",
    "SC-065": "impersonation.human-claim",
    "SC-069": "data-breach.cross-customer-leak",
    "SC-074": "coercion.explicit-threat",
}

PLAY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prompt-lib")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    # validate every mapped slug exists in the seed
    from autosentinx.spine import Mode  # noqa: F401  (import side-effect: ensure package importable)
    seed = yaml.safe_load(open(os.path.join(
        os.path.dirname(PLAY_DIR), "catalog-seed", "objectives.yaml"), encoding="utf-8"))
    known = {o["slug"] for o in seed["objectives"]}
    bad = {s for s in PLAY_OBJECTIVE.values() if s not in known}
    if bad:
        print("ERROR: mapping references unknown slugs:", bad)
        return 1

    files = sorted(glob.glob(os.path.join(PLAY_DIR, "*.yaml")))
    missing = []
    for f in files:
        d = yaml.safe_load(open(f, encoding="utf-8"))
        pid = d.get("id")
        slug = PLAY_OBJECTIVE.get(pid)
        if not slug:
            missing.append(pid)
            continue
        new = {"id": pid, "objective_slug": slug, "persona": d.get("persona", ""), "phases": d.get("phases", [])}
        print(f"  {pid:8} -> {slug}")
        if not args.check:
            with open(f, "w", encoding="utf-8") as fh:
                yaml.safe_dump(new, fh, allow_unicode=True, sort_keys=False)
    if missing:
        print("ERROR: plays with no mapping:", missing)
        return 1
    print(f"\n{'checked' if args.check else 'rewrote'} {len(files)} plays")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
