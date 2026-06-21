"""Technique library — in-memory read cache over the Postgres technique/persona/map tables (Phase 4).

Mirrors catalog.py: load once, serve runtime composition from memory. `TechniqueSpec` is an abstract,
objective-agnostic attack strategy; `PersonaSpec` is an orthogonal modifier; `RunSpec` is one composed
unit = objective × technique × persona × csrt. `enumerate_runs` builds the N-per-objective gated set.
"""
from __future__ import annotations

import json
from typing import Optional

from pydantic import BaseModel
from sqlmodel import select

from .catalog import Catalog
from .db import SessionLocal
from .models import ObjectiveTechniqueMap, Persona, Technique


class TechPhase(BaseModel):
    name: str
    intent: str
    advance_when: str = ""


class TechniqueSpec(BaseModel):
    slug: str
    title: str
    technique_class: str = "drive"
    provider: str = "native"              # P6 attack-provider seam: native | pyrit | deepteam | …
    strategy: str = ""
    phase_plan: list[TechPhase] = []
    applicable_modes: list[str] = []      # [] or ["*"] or explicit modes
    modifiers: list[str] = []
    provenance: str = ""
    status: str = "active"

    def applies_to_mode(self, mode: str) -> bool:
        return "*" in self.applicable_modes or mode in self.applicable_modes


class PersonaSpec(BaseModel):
    slug: str
    title: str
    description: str = ""
    attributes: dict = {}
    status: str = "active"


class RunSpec(BaseModel):
    """One composed attack unit: objective × technique × persona (× csrt modifier)."""
    objective_slug: str
    technique_slug: str
    persona_slug: str
    csrt: bool = False

    @property
    def label(self) -> str:
        return f"{self.technique_slug}{'+csrt' if self.csrt else ''}→{self.objective_slug}"


class Library:
    def __init__(self, techniques: dict[str, TechniqueSpec], personas: dict[str, PersonaSpec],
                 obj_to_techs: dict[str, list[str]]) -> None:
        self._t = techniques
        self._p = personas
        self._map = obj_to_techs   # objective_slug -> [technique_slug, …] (materialized M:N)

    @classmethod
    async def load(cls) -> "Library":
        async with SessionLocal() as s:
            techs = list((await s.execute(select(Technique))).scalars().all())
            personas = list((await s.execute(select(Persona))).scalars().all())
            links = list((await s.execute(select(ObjectiveTechniqueMap))).scalars().all())
        tspecs = {
            t.slug: TechniqueSpec(
                slug=t.slug, title=t.title, technique_class=t.technique_class, strategy=t.strategy,
                provider=getattr(t, "provider", None) or "native",
                phase_plan=[TechPhase(**p) for p in (json.loads(t.phase_plan) if t.phase_plan else [])],
                applicable_modes=json.loads(t.applicable_modes) if t.applicable_modes else [],
                modifiers=json.loads(t.modifiers) if t.modifiers else [],
                provenance=t.provenance, status=t.status,
            )
            for t in techs
        }
        pspecs = {
            p.slug: PersonaSpec(
                slug=p.slug, title=p.title, description=p.description,
                attributes=json.loads(p.attributes) if p.attributes else {}, status=p.status,
            )
            for p in personas
        }
        obj_to_techs: dict[str, list[str]] = {}
        for lk in links:
            obj_to_techs.setdefault(lk.objective_slug, []).append(lk.technique_slug)
        return cls(tspecs, pspecs, obj_to_techs)

    # ---- reads ----
    def technique(self, slug: str) -> Optional[TechniqueSpec]:
        return self._t.get(slug)

    def persona(self, slug: str) -> Optional[PersonaSpec]:
        return self._p.get(slug)

    def techniques(self) -> list[TechniqueSpec]:
        return list(self._t.values())

    def personas(self) -> list[PersonaSpec]:
        return [p for p in self._p.values() if p.status == "active"]

    def techniques_for(self, objective_slug: str) -> list[str]:
        return self._map.get(objective_slug, [])


def enumerate_runs(
    catalog: Catalog, library: Library, *,
    objective_slugs: Optional[list[str]] = None,
    technique_slugs: Optional[list[str]] = None,
    modes: Optional[list[str]] = None,
    include_draft: bool = False,
    n_per_objective: Optional[int] = None,
    csrt_mode: str = "off",            # off | on | both
    persona_slug: Optional[str] = None,
) -> list[RunSpec]:
    """N-per-objective (gated) enumeration of objective × technique × persona [× csrt]."""
    objs = catalog.all()
    objs = [o for o in objs if o.mode != "FAIRNESS_VIOLATION"]  # fairness = paired flow (run_fairness)
    if not include_draft:
        objs = [o for o in objs if o.status == "active"]
    if objective_slugs:
        want = set(objective_slugs)
        objs = [o for o in objs if o.slug in want]
    if modes:
        want_m = {m.upper() for m in modes}
        objs = [o for o in objs if o.mode.upper() in want_m]

    personas = library.personas()
    runs: list[RunSpec] = []
    for i, o in enumerate(objs):
        techs = library.techniques_for(o.slug)
        if technique_slugs:
            keep = set(technique_slugs)
            techs = [t for t in techs if t in keep]
        if n_per_objective:
            techs = techs[:n_per_objective]
        for j, tslug in enumerate(techs):
            pslug = persona_slug or (personas[(i + j) % len(personas)].slug if personas else "")
            csrt_flags = {"off": [False], "on": [True], "both": [False, True]}.get(csrt_mode, [False])
            for c in csrt_flags:
                runs.append(RunSpec(objective_slug=o.slug, technique_slug=tslug, persona_slug=pslug, csrt=c))
    return runs
