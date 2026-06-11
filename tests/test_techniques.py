"""Technique/persona seed + enumerator integrity (offline — YAML + in-memory specs, no DB)."""
import os

import yaml

from autosentinx.catalog import Catalog, ObjectiveSpec
from autosentinx.library import (
    Library, PersonaSpec, RunSpec, TechniqueSpec, TechPhase, enumerate_runs,
)
from autosentinx.spine import Mode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _techs():
    return yaml.safe_load(open(os.path.join(ROOT, "technique-seed", "techniques.yaml"), encoding="utf-8"))["techniques"]


def _personas():
    return yaml.safe_load(open(os.path.join(ROOT, "persona-seed", "personas.yaml"), encoding="utf-8"))["personas"]


def test_technique_seed_valid():
    modes = {m.value for m in Mode}
    slugs = set()
    for t in _techs():
        assert t["slug"] not in slugs
        slugs.add(t["slug"])
        assert t["technique_class"] in ("drive", "probe")
        assert t["strategy"].strip()
        assert t["phase_plan"] and all("name" in p and "intent" in p for p in t["phase_plan"])
        am = t["applicable_modes"]
        assert am == "*" or (isinstance(am, list) and all(m in modes for m in am))


def test_persona_seed_valid():
    for p in _personas():
        assert p["slug"] and p["description"].strip()


def _mini_catalog():
    def obj(slug, mode, status="active"):
        return ObjectiveSpec(slug=slug, title=slug, mode=mode, family="x", primary_pillar="security",
                             severity="high", status=status, testability="drive", goal="g",
                             success_definition="s")
    return Catalog({
        "o.data": obj("o.data", Mode.DATA_BREACH.value),
        "o.coerce": obj("o.coerce", Mode.COERCION.value),
        "o.draft": obj("o.draft", Mode.FAIRNESS_VIOLATION.value, status="draft"),
    })


def _mini_library():
    t_any = TechniqueSpec(slug="any", title="any", applicable_modes=["*"],
                          phase_plan=[TechPhase(name="p", intent="i")])
    t_inj = TechniqueSpec(slug="inj", title="inj", applicable_modes=[Mode.DATA_BREACH.value],
                          phase_plan=[TechPhase(name="p", intent="i")])
    persona = PersonaSpec(slug="distressed", title="Distressed")
    # materialized map: "any" applies to all 3, "inj" only to DATA_BREACH
    obj_to_techs = {"o.data": ["any", "inj"], "o.coerce": ["any"], "o.draft": ["any"]}
    return Library({"any": t_any, "inj": t_inj}, {"distressed": persona}, obj_to_techs)


def test_enumerate_gates_and_skips_draft():
    cat, lib = _mini_catalog(), _mini_library()
    runs = enumerate_runs(cat, lib)
    # active objectives only (draft excluded), data-breach gets both techniques, coercion gets one
    labels = {r.label for r in runs}
    assert "inj→o.data" in labels
    assert "any→o.data" in labels
    assert "any→o.coerce" in labels
    assert not any("o.draft" in r.objective_slug for r in runs)        # draft excluded by default
    assert not any(r.technique_slug == "inj" and r.objective_slug == "o.coerce" for r in runs)  # gated


def test_enumerate_csrt_both_and_n_cap():
    cat, lib = _mini_catalog(), _mini_library()
    both = enumerate_runs(cat, lib, csrt_mode="both", objective_slugs=["o.data"])
    assert sorted(r.csrt for r in both) == [False, False, True, True]   # 2 techniques × {off,on}
    capped = enumerate_runs(cat, lib, n_per_objective=1, objective_slugs=["o.data"])
    assert len(capped) == 1


def test_enumerate_include_draft():
    cat, lib = _mini_catalog(), _mini_library()
    runs = enumerate_runs(cat, lib, include_draft=True)
    assert any("o.draft" in r.objective_slug for r in runs)
