"""Durable-orchestration primitives (roadmap P8, DEFINE-review).

A minutes-long campaign on Cloud Run must survive instance restarts and not double-run work, so the
orchestration is NOT stateless. These are the durable-execution primitives:

- **Idempotent resume** (`remaining_runspecs`): on (re)start, skip runspecs that already produced a
  non-error attempt for the run — so a restart resumes rather than restarts, and a redelivered task
  doesn't duplicate plays.
- **Lease** (`Lease`): a single worker holds a time-bounded, renewable lease on a run so concurrent
  instances don't both drive it; an expired lease is reclaimable (crash recovery).

Pure logic — wires into the runner/store (and a Cloud Tasks/queue trigger) without new query paths.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional


def completed_labels(attempts) -> set:
    """runspec labels (objective_id) that already produced a non-error/blocked attempt for this run."""
    return {getattr(a, "objective_id", None) for a in attempts
            if getattr(a, "outcome", "") not in ("error", "blocked", "sample")}


def remaining_runspecs(runspecs, attempts) -> list:
    """The runspecs still to do — idempotent resume: a restart/redelivery skips already-done work."""
    done = completed_labels(attempts)
    return [rs for rs in runspecs if getattr(rs, "label", None) not in done]


@dataclass
class Lease:
    """A renewable, time-bounded claim on a run, so one worker drives it at a time. An expired lease is
    reclaimable (the holder crashed) — fail-safe, not fail-stuck."""

    run_id: str
    owner: str
    expires_at: datetime
    ttl_seconds: int = 120

    def valid(self, *, now: Optional[datetime] = None) -> bool:
        return (now or datetime.now(timezone.utc)) < self.expires_at

    def renew(self, *, now: Optional[datetime] = None) -> "Lease":
        base = now or datetime.now(timezone.utc)
        self.expires_at = base + timedelta(seconds=self.ttl_seconds)
        return self

    def reclaimable_by(self, other_owner: str, *, now: Optional[datetime] = None) -> bool:
        """Another worker may take over only once this lease has expired (the holder is presumed dead)."""
        return other_owner != self.owner and not self.valid(now=now)


def acquire(run_id: str, owner: str, current: Optional[Lease] = None,
            *, ttl_seconds: int = 120, now: Optional[datetime] = None) -> Optional[Lease]:
    """Grant a lease iff none is held, the caller already holds it, or the existing one has expired."""
    base = now or datetime.now(timezone.utc)
    if current is not None and current.valid(now=base) and current.owner != owner:
        return None                                   # someone else is actively driving the run
    return Lease(run_id=run_id, owner=owner, expires_at=base + timedelta(seconds=ttl_seconds),
                 ttl_seconds=ttl_seconds)
