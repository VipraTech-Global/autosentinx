"""Load the committed YAML catalog seed into Postgres (validate against spine-v1.0, then upsert).

Idempotent: clears OUR catalog tables (objective / frameworkcontrol / objectivecontrolmap) and reloads.
  uv run python scripts/load_catalog.py            # load catalog-seed/
  uv run python scripts/load_catalog.py --check    # validate only, no DB writes
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

import yaml
from sqlalchemy import delete

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from autosentinx.db import SessionLocal  # noqa: E402
from autosentinx.models import FrameworkControl, Objective, ObjectiveControlMap  # noqa: E402
from autosentinx.spine import (  # noqa: E402
    SPINE_VERSION, Family, Framework, MODE_FAMILY, Mode, Pillar, Relation, Severity, Testability,
    is_draft,
)

SEED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "catalog-seed")


def _enum_values(enum_cls) -> set[str]:
    return {e.value for e in enum_cls}


def validate(frameworks: dict, objectives: dict) -> tuple[list[dict], list[dict], list[str]]:
    """Return (controls, objectives, errors)."""
    errs: list[str] = []
    controls = frameworks.get("controls", [])
    control_keys = set()
    fw_values = _enum_values(Framework)
    for c in controls:
        if c["framework"] not in fw_values:
            errs.append(f"control {c.get('control_id')}: unknown framework {c['framework']!r}")
        control_keys.add((c["framework"], c["control_id"]))

    objs = objectives.get("objectives", [])
    slugs = set()
    for o in objs:
        slug = o.get("slug", "<missing>")
        if slug in slugs:
            errs.append(f"duplicate slug {slug!r}")
        slugs.add(slug)
        # mode + family
        try:
            mode = Mode(o["mode"])
        except (KeyError, ValueError):
            errs.append(f"{slug}: invalid/missing mode {o.get('mode')!r}")
            continue
        fam = o.get("family")
        if fam != MODE_FAMILY[mode].value:
            errs.append(f"{slug}: family {fam!r} != spine family {MODE_FAMILY[mode].value!r} for {mode.value}")
        # enums
        if o.get("primary_pillar") not in _enum_values(Pillar):
            errs.append(f"{slug}: invalid primary_pillar {o.get('primary_pillar')!r}")
        if o.get("severity", "medium") not in _enum_values(Severity):
            errs.append(f"{slug}: invalid severity {o.get('severity')!r}")
        if o.get("testability", "drive") not in _enum_values(Testability):
            errs.append(f"{slug}: invalid testability {o.get('testability')!r}")
        if o.get("status", "active") not in ("active", "draft", "deprecated"):
            errs.append(f"{slug}: invalid status {o.get('status')!r}")
        # (Phase 6 built the consumer-protection oracles, so draft modes may now be active.)
        if not o.get("success_definition", "").strip():
            errs.append(f"{slug}: empty success_definition")
        # crosswalk
        xs = o.get("crosswalk", [])
        if not xs:
            errs.append(f"{slug}: no crosswalk edges (every objective needs >=1)")
        for e in xs:
            if e.get("relation") not in _enum_values(Relation):
                errs.append(f"{slug}: invalid relation {e.get('relation')!r}")
            if not (1 <= int(e.get("strength", 0)) <= 10):
                errs.append(f"{slug}: strength out of 1-10 ({e.get('strength')})")
            key = (e.get("framework"), e.get("control_id"))
            if key not in control_keys:
                errs.append(f"{slug}: crosswalk to unknown control {key}")
    return controls, objs, errs


async def load(controls: list[dict], objs: list[dict]) -> None:
    async with SessionLocal() as s:
        # idempotent: clear only AUTHORED catalog rows, then reinsert — preserve ingested objectives
        # (source=ingested) and their crosswalk so a seed reload doesn't wipe Phase-7 ingestion.
        from sqlmodel import select as _sel
        ingested_slugs = set((await s.execute(
            _sel(Objective.slug).where(Objective.source == "ingested"))).scalars().all())
        if ingested_slugs:
            await s.execute(delete(ObjectiveControlMap).where(
                ObjectiveControlMap.objective_slug.notin_(ingested_slugs)))
        else:
            await s.execute(delete(ObjectiveControlMap))
        await s.execute(delete(Objective).where(Objective.source != "ingested"))
        await s.execute(delete(FrameworkControl))
        await s.commit()
        for c in controls:
            s.add(FrameworkControl(
                framework=c["framework"], control_id=c["control_id"], title=c["title"],
                citation=c.get("citation", ""), version=str(c.get("version", "")),
            ))
        for o in objs:
            mode = Mode(o["mode"])
            s.add(Objective(
                slug=o["slug"], title=o["title"], description=o["description"],
                family=MODE_FAMILY[mode].value, mode=mode.value,
                primary_pillar=o["primary_pillar"], severity=o.get("severity", "medium"),
                testability=o.get("testability", "drive"), channel=o.get("channel", "voice"),
                language=o.get("language", "hi-en"), success_definition=o["success_definition"].strip(),
                oracle_hint=o.get("oracle_hint", ""), status=o.get("status", "active"),
                version=str(o.get("version", "1.0.0")), source="authored",
                provenance=o.get("provenance", ""), tags=json.dumps(o.get("tags", [])),
                spine_version=SPINE_VERSION,
            ))
            for e in o.get("crosswalk", []):
                s.add(ObjectiveControlMap(
                    objective_slug=o["slug"], framework=e["framework"], control_id=e["control_id"],
                    relation=e["relation"], strength=int(e["strength"]), rationale=e.get("rationale", ""),
                ))
        await s.commit()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only, no DB writes")
    args = ap.parse_args()

    with open(os.path.join(SEED_DIR, "frameworks.yaml"), encoding="utf-8") as f:
        frameworks = yaml.safe_load(f)
    with open(os.path.join(SEED_DIR, "objectives.yaml"), encoding="utf-8") as f:
        objectives = yaml.safe_load(f)

    controls, objs, errs = validate(frameworks, objectives)
    if errs:
        print(f"VALIDATION FAILED ({len(errs)} errors):")
        for e in errs:
            print("  -", e)
        return 1
    print(f"validated OK: {len(controls)} controls, {len(objs)} objectives, spine={SPINE_VERSION}")
    if args.check:
        return 0
    asyncio.run(load(controls, objs))
    print(f"loaded {len(objs)} objectives + {sum(len(o.get('crosswalk', [])) for o in objs)} crosswalk edges into Postgres")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
