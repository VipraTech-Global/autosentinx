"""Catalog seed + hard-cut integrity (offline — reads the committed YAML + spine, no DB)."""
import glob
import os

import yaml

from autosentinx.playlib import load_plays
from autosentinx.spine import (
    MODE_FAMILY, Mode, Pillar, Relation, Severity, is_draft,
)
from autosentinx.spine import Testability as _Testability  # aliased: avoid pytest test-class collection

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, "catalog-seed")


def _objectives():
    return yaml.safe_load(open(os.path.join(SEED, "objectives.yaml"), encoding="utf-8"))["objectives"]


def _controls():
    return yaml.safe_load(open(os.path.join(SEED, "frameworks.yaml"), encoding="utf-8"))["controls"]


def test_every_objective_valid_and_has_crosswalk():
    control_keys = {(c["framework"], c["control_id"]) for c in _controls()}
    slugs = set()
    for o in _objectives():
        slug = o["slug"]
        assert slug not in slugs, f"duplicate slug {slug}"
        slugs.add(slug)
        mode = Mode(o["mode"])                                  # valid spine mode
        assert o["family"] == MODE_FAMILY[mode].value           # family matches spine
        assert o["primary_pillar"] in {p.value for p in Pillar}
        assert o.get("severity", "medium") in {s.value for s in Severity}
        assert o.get("testability", "drive") in {t.value for t in _Testability}
        assert o.get("success_definition", "").strip()
        edges = o.get("crosswalk", [])
        assert edges, f"{slug}: needs >=1 crosswalk edge"
        for e in edges:
            assert e["relation"] in {r.value for r in Relation}
            assert 1 <= int(e["strength"]) <= 10
            assert (e["framework"], e["control_id"]) in control_keys, f"{slug}: bad control {e}"


def test_all_16_modes_covered():
    covered = {Mode(o["mode"]) for o in _objectives()}
    assert covered == set(Mode), f"missing modes: {set(Mode) - covered}"


def test_consumer_protection_modes_now_active():
    # Phase 6 built the 3 special oracles, so these modes flipped draft → active.
    for o in _objectives():
        if is_draft(Mode(o["mode"])):
            assert o.get("status") == "active", f"{o['slug']}: should be active once its Phase-6 oracle exists"


def test_every_play_maps_to_a_known_objective():
    """The Phase-3 hard cut: every play references a real catalog objective_slug."""
    known = {o["slug"] for o in _objectives()}
    plays = load_plays(os.path.join(ROOT, "prompt-lib"))
    assert plays, "no plays found"
    for p in plays:
        assert p.objective_slug in known, f"{p.id}: unknown objective_slug {p.objective_slug!r}"
