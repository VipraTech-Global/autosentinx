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


class User(SQLModel, table=True):
    """An application user (Phase: auth). Login/signup via /auth/*; protects the API with a JWT."""
    id: str = Field(default_factory=_uid, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=_now)


class Run(SQLModel, table=True):
    """A scan campaign."""
    id: str = Field(default_factory=_uid, primary_key=True)
    target_url: str
    status: str = "running"  # pending_approval | running | completed | failed
    note: str = ""
    num_attempts: int = 0
    num_succeeded: int = 0
    # governance (Phase 7) — approval gate + Rules of Engagement (recorded; light enforcement)
    roe: str = ""               # JSON: {objectives|modes, budget, strategy, target}
    approved_by: str = ""
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_now)


class AuditEvent(SQLModel, table=True):
    """Hash-chained, append-only governance audit log (Phase 7, ADR 0002).

    Each entry hashes the previous one (entry_hash = sha256(prev_hash | fields)), so altering any past
    row breaks the chain — tamper-evident. id order IS the chain order.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(default="", index=True)
    event_type: str = Field(index=True)   # scan.created | scan.approved | scan.started | scan.completed | ingest.*
    actor: str = "operator"
    detail: str = ""                      # JSON
    prev_hash: str = ""
    entry_hash: str = ""
    created_at: datetime = Field(default_factory=_now)


class IngestionRecord(SQLModel, table=True):
    """Provenance of an autonomously-ingested catalog objective (Phase 7)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    objective_slug: str = Field(index=True)
    source_type: str = ""                 # regulation | research | web | file | text
    source_ref: str = ""                  # URL / filename / "paste"
    quote: str = ""                       # anchored verbatim provenance
    created_at: datetime = Field(default_factory=_now)


class Attempt(SQLModel, table=True):
    """One objective/play run against the target within a campaign."""
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(foreign_key="run.id", index=True)
    objective_id: str  # human run label, e.g. "actor-attack→disclosure.undisclosed-ai"
    objective_slug: str = Field(default="", index=True)  # catalog objective tested (Phase 3)
    technique_slug: str = Field(default="", index=True)  # technique used (Phase 4)
    persona_slug: str = Field(default="")                # persona modifier (Phase 4)
    csrt: bool = False                                   # CSRT code-switch modifier applied (Phase 4)
    mode: str
    rule: str = ""
    persona: str = ""
    contact_id: int = 0
    contact_name: str = ""
    outcome: str = "defended"  # SUCCEEDED/DEFENDED/UNKNOWN from the Phase-2 panel (authoritative)
    verdict_score: float = 0.0  # mean StrongREJECT specificity across surviving judges
    judge_votes: str = ""       # JSON list of per-judge verdicts
    detector_hits: str = ""     # JSON list of deterministic detector hits (evidence)
    domain_findings: str = ""   # P7 SHADOW: JSON regex-tier domain candidates (advisory; never gates outcome)
    policy_mode: str = "off"    # P7 rollout: off | shadow | enforced (DOMAIN_FINDINGS env)
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
    """A3 technique registry (Phase 4) — an abstract, objective-agnostic attack strategy.

    The composable engine builds an attack from technique.strategy + technique.phase_plan + the resolved
    objective goal + a persona modifier. One technique drives many objectives (gated by applicable_modes).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title: str = ""
    technique_class: str = "drive"                    # drive | probe
    provider: str = "native"                          # P6 attack-provider seam: native | pyrit | deepteam | …
    strategy: str = ""                                # objective-agnostic strategy (system-prompt fragment)
    phase_plan: str = ""                              # JSON list of {name, intent, advance_when}
    applicable_modes: str = ""                        # JSON list of spine modes, or "*"
    modifiers: str = ""                               # JSON list of compatible modifiers (e.g. csrt)
    provenance: str = ""                              # PLAGUE / ActorAttack / Crescendo / …
    status: str = Field(default="active", index=True)


class Persona(SQLModel, table=True):
    """A reusable Hinglish caller persona — an orthogonal strategy-modifier (ADR 0011 §4)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title: str = ""
    description: str = ""
    attributes: str = ""                              # JSON tags (register/gender/region) — for fairness later
    status: str = Field(default="active", index=True)


class ObjectiveTechniqueMap(SQLModel, table=True):
    """M:N objective ↔ technique link (Phase 4 materializes it; Phase 5 selection reads it)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    objective_slug: str = Field(index=True)
    technique_slug: str = Field(index=True)
    modifiers: str = ""                               # JSON: CSRT/phonetic/persona-variation/voice


class TechniqueStat(SQLModel, table=True):
    """Discounted-UCB bandit memory per (objective, technique) — Phase 5 H1.

    Persists across campaigns (the seed of the deferred lifecycle/H3). `n_disc`/`s_disc` are the
    γ-discounted pull-count and reward-sum (value = s_disc/n_disc); `raw_*` are undiscounted, for ASR
    reporting. AutoRedTeamer-style memory, upgraded to a real bandit.
    """
    __table_args__ = (UniqueConstraint("objective_slug", "technique_slug", name="uq_objtech_stat"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    objective_slug: str = Field(index=True)
    technique_slug: str = Field(index=True)
    n_disc: float = 0.0            # discounted pull count
    s_disc: float = 0.0            # discounted reward sum
    raw_count: int = 0             # total pulls (reporting)
    raw_successes: int = 0         # total SUCCEEDED (reporting / ASR)
    updated_at: datetime = Field(default_factory=_now)
