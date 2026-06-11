"""Objective catalog — in-memory read cache over the Postgres tables (ADR 0011).

The catalog is small + mostly-static reference data, so we load it ONCE into memory and serve runtime
objective selection from a dict (zero DB round-trips, microseconds). Postgres stays the source of truth
(loaded from the committed git-YAML seed); this is just the read cache. `ObjectiveSpec` is the resolved
view the attacker / judge consume — the play references an objective by `slug`, the catalog resolves it.
"""
from __future__ import annotations

import json
from typing import Optional

from pydantic import BaseModel
from sqlmodel import select

from .db import SessionLocal
from .models import FrameworkControl, Objective, ObjectiveControlMap


class CrosswalkEdge(BaseModel):
    framework: str
    control_id: str
    relation: str
    strength: int
    rationale: str = ""
    control_title: str = ""


class ObjectiveSpec(BaseModel):
    """Resolved objective the attacker + judge run against (decoupled from the play/technique)."""
    slug: str
    title: str
    mode: str
    family: str
    primary_pillar: str
    severity: str
    status: str
    testability: str
    goal: str                 # = objective.description (the behavior that would violate)
    success_definition: str   # what the judge looks for
    tags: list[str] = []
    crosswalk: list[CrosswalkEdge] = []

    @property
    def rule(self) -> str:
        """A short rule string for the judge prompt — the objective + its strongest control."""
        if self.crosswalk:
            top = max(self.crosswalk, key=lambda e: e.strength)
            ref = top.control_title or f"{top.framework} {top.control_id}"
            return f"{self.title} ({top.framework} {top.control_id}: {ref})"
        return self.title

    @property
    def gradeable(self) -> bool:
        """Active + has a transcript-judgeable oracle today (draft modes await Phase-6 oracles)."""
        return self.status == "active" and self.testability in ("drive", "probe")


class Catalog:
    def __init__(self, specs: dict[str, ObjectiveSpec]) -> None:
        self._by_slug = specs

    # ---- construction ----
    @classmethod
    async def load(cls) -> "Catalog":
        async with SessionLocal() as s:
            objs = list((await s.execute(select(Objective))).scalars().all())
            edges = list((await s.execute(select(ObjectiveControlMap))).scalars().all())
            controls = list((await s.execute(select(FrameworkControl))).scalars().all())
        title_by_key = {(c.framework, c.control_id): c.title for c in controls}
        edges_by_slug: dict[str, list[CrosswalkEdge]] = {}
        for e in edges:
            edges_by_slug.setdefault(e.objective_slug, []).append(CrosswalkEdge(
                framework=e.framework, control_id=e.control_id, relation=e.relation,
                strength=e.strength, rationale=e.rationale,
                control_title=title_by_key.get((e.framework, e.control_id), ""),
            ))
        specs: dict[str, ObjectiveSpec] = {}
        for o in objs:
            specs[o.slug] = ObjectiveSpec(
                slug=o.slug, title=o.title, mode=o.mode, family=o.family,
                primary_pillar=o.primary_pillar, severity=o.severity, status=o.status,
                testability=o.testability, goal=o.description,
                success_definition=o.success_definition,
                tags=json.loads(o.tags) if o.tags else [],
                crosswalk=edges_by_slug.get(o.slug, []),
            )
        return cls(specs)

    # ---- runtime reads (in-memory, no DB) ----
    def get(self, slug: str) -> Optional[ObjectiveSpec]:
        return self._by_slug.get(slug)

    def require(self, slug: str) -> ObjectiveSpec:
        spec = self._by_slug.get(slug)
        if spec is None:
            raise KeyError(f"objective slug not in catalog: {slug!r}")
        return spec

    def all(self) -> list[ObjectiveSpec]:
        return list(self._by_slug.values())

    def by_mode(self, mode: str) -> list[ObjectiveSpec]:
        return [s for s in self._by_slug.values() if s.mode == mode]

    def __len__(self) -> int:
        return len(self._by_slug)
