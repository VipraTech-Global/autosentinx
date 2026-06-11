"""Load the committed technique + persona seed into Postgres, and MATERIALIZE the objective↔technique
M:N map from the gating rule (technique.applicable_modes ⊇ objective.mode, or "*").

Idempotent: clears OUR technique/persona/map tables and reloads.
  uv run python scripts/load_techniques.py            # load
  uv run python scripts/load_techniques.py --check    # validate only
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

import yaml
from sqlalchemy import delete
from sqlmodel import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from autosentinx.db import SessionLocal  # noqa: E402
from autosentinx.models import Objective, ObjectiveTechniqueMap, Persona, Technique  # noqa: E402
from autosentinx.spine import Mode  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def validate(techs: list[dict], personas: list[dict]) -> list[str]:
    errs: list[str] = []
    modes = {m.value for m in Mode}
    slugs = set()
    for t in techs:
        slug = t.get("slug", "<missing>")
        if slug in slugs:
            errs.append(f"duplicate technique slug {slug}")
        slugs.add(slug)
        if t.get("technique_class") not in ("drive", "probe"):
            errs.append(f"{slug}: bad technique_class {t.get('technique_class')!r}")
        am = t.get("applicable_modes")
        if am != "*" and not (isinstance(am, list) and all(m in modes for m in am)):
            errs.append(f"{slug}: applicable_modes must be '*' or a list of spine modes (got {am!r})")
        if not t.get("strategy", "").strip():
            errs.append(f"{slug}: empty strategy")
        if not t.get("phase_plan"):
            errs.append(f"{slug}: empty phase_plan")
    pslugs = set()
    for p in personas:
        if not p.get("slug") or not p.get("description", "").strip():
            errs.append(f"persona {p.get('slug')!r}: missing slug/description")
        pslugs.add(p.get("slug"))
    return errs


def _applicable_modes_json(am) -> str:
    return json.dumps(["*"] if am == "*" else am)


async def load(techs: list[dict], personas: list[dict]) -> tuple[int, int]:
    async with SessionLocal() as s:
        await s.execute(delete(ObjectiveTechniqueMap))
        await s.execute(delete(Technique))
        await s.execute(delete(Persona))
        await s.commit()
        for t in techs:
            s.add(Technique(
                slug=t["slug"], title=t["title"], technique_class=t["technique_class"],
                strategy=t["strategy"].strip(), phase_plan=json.dumps(t["phase_plan"]),
                applicable_modes=_applicable_modes_json(t["applicable_modes"]),
                modifiers=json.dumps(t.get("modifiers", [])), provenance=t.get("provenance", ""),
                status=t.get("status", "active"),
            ))
        for p in personas:
            s.add(Persona(
                slug=p["slug"], title=p.get("title", p["slug"]), description=p["description"].strip(),
                attributes=json.dumps(p.get("attributes", {})), status=p.get("status", "active"),
            ))
        await s.commit()

        # materialize the M:N map from the gating rule against the catalog objectives
        objs = list((await s.execute(select(Objective))).scalars().all())
        n_edges = 0
        for t in techs:
            am = t["applicable_modes"]
            star = am == "*"
            allowed = set(am) if not star else None
            for o in objs:
                if star or o.mode in allowed:
                    s.add(ObjectiveTechniqueMap(objective_slug=o.slug, technique_slug=t["slug"]))
                    n_edges += 1
        await s.commit()
        return len(techs), n_edges


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    techs = yaml.safe_load(open(os.path.join(ROOT, "technique-seed", "techniques.yaml"), encoding="utf-8"))["techniques"]
    personas = yaml.safe_load(open(os.path.join(ROOT, "persona-seed", "personas.yaml"), encoding="utf-8"))["personas"]
    errs = validate(techs, personas)
    if errs:
        print(f"VALIDATION FAILED ({len(errs)}):")
        for e in errs:
            print("  -", e)
        return 1
    print(f"validated OK: {len(techs)} techniques, {len(personas)} personas")
    if args.check:
        return 0
    nt, ne = asyncio.run(load(techs, personas))
    print(f"loaded {nt} techniques + {len(personas)} personas; materialized {ne} objective↔technique edges")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
