"""SQLModel tables (Phase 1). Campaign = Run → Attempts (one per objective/play) → Turns."""
from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlmodel import SQLModel, Field


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
    objective_id: str  # SC-xxx
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
