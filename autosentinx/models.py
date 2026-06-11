"""SQLModel tables. Campaign = Run → Attempts (one per objective/play) → Turns.

Phase 3 adds the Objective catalog (ADR 0011): the decoupled Objective registry + framework controls
+ the many-to-many STRM crosswalk, plus empty Technique stubs that Phase 4 (A3 library) fills in.
"""
from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field

from .spine import SPINE_VERSION


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC (matches Neon column)


def _uid() -> str:
    return uuid.uuid4().hex


class Run(SQLModel, table=True):
    """A scan campaign."""
    id: str = Field(default_factory=_uid, primary_key=True)
    target_url: str
    status: str = "running"  # running | completed | failed
    note: str = ""
    num_attempts: int = 0
    num_succeeded: int = 0
    created_at: datetime = Field(default_factory=_now)


class Attempt(SQLModel, table=True):
    """One objective/play run against the target within a campaign."""
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(foreign_key="run.id", index=True)
    objective_id: str  # play/scenario id, e.g. SC-020 (the technique used)
    objective_slug: str = Field(default="", index=True)  # catalog objective tested (Phase 3)
    mode: str
    rule: str = ""
    persona: str = ""
    contact_id: int = 0
    contact_name: str = ""
    outcome: str = "defended"  # SUCCEEDED/DEFENDED/UNKNOWN from the Phase-2 panel (authoritative)
    verdict_score: float = 0.0  # mean StrongREJECT specificity across surviving judges
    judge_votes: str = ""       # JSON list of per-judge verdicts
    detector_hits: str = ""     # JSON list of deterministic detector hits (evidence)
    num_turns: int = 0
    error: str = ""
    created_at: datetime = Field(default_factory=_now)


class Turn(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: int = Field(foreign_key="attempt.id", index=True)
    idx: int
    phase: str = ""
    attacker_intent: str = ""
    attacker_line: str = ""
    target_reply: str = ""
    label: str = ""  # Comply | Refusal | Unknown | Succeed
    compliance_clean: Optional[bool] = None  # AARAV's own self-report
    violations: str = ""  # JSON-encoded list (AARAV's own gate)


# --- Objective catalog (Phase 3, ADR 0011) ------------------------------------------------------

class Objective(SQLModel, table=True):
    """The 'what we test for' — one specific, testable proposition within a spine mode.

    Authored from scratch; the judge reads `success_definition` to rule on it. Loaded from the
    committed git-YAML seed into Postgres; cached in memory at runtime (see catalog.py).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)        # namespaced, e.g. disclosure.undisclosed-ai
    title: str
    description: str                                  # the concrete agent behavior that would violate
    family: str                                       # spine Family
    mode: str = Field(index=True)                     # spine Mode
    primary_pillar: str = Field(index=True)           # compliance | security
    severity: str = "medium"                          # low | medium | high | critical
    testability: str = "drive"                        # drive | probe | config-audit
    channel: str = "voice"
    language: str = "hi-en"                           # Hinglish
    success_definition: str                           # what the judge looks for (feeds the oracle)
    oracle_hint: str = ""
    status: str = Field(default="active", index=True)  # active | draft | deprecated
    version: str = "1.0.0"                            # per-objective semver
    source: str = "authored"                          # authored | ingested
    provenance: str = ""                              # citation / rationale (free-text for now)
    tags: str = ""                                    # JSON list of open-layer tags (undisclosed-AI, …)
    spine_version: str = SPINE_VERSION
    created_at: datetime = Field(default_factory=_now)


class FrameworkControl(SQLModel, table=True):
    """A control/clause in an external framework (RBI-FPC / DPDP / OWASP-LLM / MITRE-ATLAS / NIST …)."""
    __table_args__ = (UniqueConstraint("framework", "control_id", name="uq_framework_control"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    framework: str = Field(index=True)
    control_id: str = Field(index=True)               # e.g. LLM06, FPC-7, DPDP-8, AML.T0051
    title: str
    citation: str = ""
    version: str = ""


class ObjectiveControlMap(SQLModel, table=True):
    """The many-to-many crosswalk edge (STRM/OLIR): objective ↔ framework control.

    One objective maps to many controls and one control to many objectives. Grade once at the
    finding level, project at read-time; severity per-edge, never averaged.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    objective_slug: str = Field(index=True)
    framework: str = Field(index=True)
    control_id: str = Field(index=True)
    relation: str = "intersects"                      # equal | subset | superset | intersects
    strength: int = 5                                 # 1–10
    rationale: str = ""


class Technique(SQLModel, table=True):
    """A3 technique registry — STUB (Phase 4 fills it). Created now so the link table has a target."""
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title: str = ""
    technique_class: str = ""                         # drive | probe | elicitation | …
    note: str = ""


class ObjectiveTechniqueMap(SQLModel, table=True):
    """M:N objective ↔ technique link — STUB (Phase 4 populates; selection reads this)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    objective_slug: str = Field(index=True)
    technique_slug: str = Field(index=True)
    modifiers: str = ""                               # JSON: CSRT/phonetic/persona-variation/voice
