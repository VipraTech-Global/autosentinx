"""Audited gateway — the SOLE egress to a target (roadmap P4, keystone #3).

Every turn that reaches the target MUST pass through this gateway, which enforces, per send:
  1. RoE revalidation   — authorized, in-scope, unexpired *at send time* (fail-closed),
  2. governed bound      — a per-campaign turn ceiling (RoE scope, NOT a metered cost budget),
  3. audit append        — a hash-chained record of the send (and of any denial),
then forwards to the wrapped target. A denial is fail-closed: the target is never called.

The gateway is the only object that holds the real `Target`; attack providers receive the gateway,
never the raw target — so "no direct provider→target egress" is enforced in code (the network
allowlist pointing at the gateway, not the target host, is the matching deploy-layer control).

Pure-logic core: `audit_sink`, `roe_validate`, and `Budget` are injected, so the decision logic is
unit-testable with no DB / network. The default `audit_sink` lazily binds the real hash-chain.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Optional, Protocol


class GatewayDenied(Exception):
    """A send was refused (RoE invalid or bound exhausted). Fail-closed: the target was NOT called."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


@dataclass
class Budget:
    """A governed campaign bound: a ceiling on turns for a run (RoE scope, not cost). `None` = the
    bound is enforced elsewhere; here we still count. Charging past the ceiling fails closed."""

    granted: Optional[int] = None
    spent: int = 0

    def remaining(self) -> Optional[int]:
        return None if self.granted is None else max(0, self.granted - self.spent)

    def charge(self) -> None:
        if self.granted is not None and self.spent >= self.granted:
            raise GatewayDenied(f"governed turn bound exhausted ({self.spent}/{self.granted})")
        self.spent += 1


@dataclass
class RoE:
    """Minimal Rules-of-Engagement context the gateway revalidates on every send. (The full OPA/Rego
    policy + sandbox-tenant attestation is P3; this is the per-send guard the gateway always applies.)"""

    run_id: str
    authorized: bool = False                 # default fail-closed: no authorization → deny
    in_scope: bool = True
    expires_at: Optional[datetime] = None
    # bool OR a zero-arg callable → re-read LIVE each send (an out-of-band kill-switch, see roe.py)
    kill_switch_engaged: Any = False

    def validate(self, *, now: Optional[datetime] = None) -> tuple[bool, str]:
        now = now or datetime.now(timezone.utc)
        ks = self.kill_switch_engaged
        if (ks() if callable(ks) else ks):
            return False, "kill-switch engaged"
        if not self.authorized:
            return False, "RoE not authorized"
        if not self.in_scope:
            return False, "target out of RoE scope"
        if self.expires_at is not None and now >= self.expires_at:
            return False, "RoE authorization expired"
        return True, "ok"


# audit_sink(event_type, *, run_id, actor, detail) -> Awaitable
AuditSink = Callable[..., Awaitable[Any]]


async def _default_audit_sink(event_type: str, *, run_id: str, actor: str, detail: dict) -> Any:
    """Bind the real hash-chained audit log lazily (keeps the gateway importable without the DB)."""
    from .audit import append_event

    return await append_event(event_type, run_id=run_id, actor=actor, detail=detail)


class _TargetLike(Protocol):
    async def start_session(self, contact_id: int) -> dict: ...
    async def send_turn(self, session_id: str, message: str) -> dict: ...
    async def end_session(self, session_id: str) -> dict: ...
    async def aclose(self) -> None: ...


@dataclass
class AuditedGateway:
    """Wraps a target; is the only caller of `target.send_turn`. Mirrors the Target interface so it's
    a drop-in: hand the gateway (never the raw target) to the runner/providers."""

    target: _TargetLike
    roe: RoE
    budget: Budget = field(default_factory=Budget)
    audit_sink: AuditSink = _default_audit_sink
    actor: str = "gateway"

    async def _guard(self, action: str, detail: dict) -> None:
        """Revalidate RoE + charge the bound, auditing the outcome. Fail-closed on any denial."""
        ok, reason = self.roe.validate()
        if not ok:
            await self.audit_sink("gateway.deny", run_id=self.roe.run_id, actor=self.actor,
                                  detail={"action": action, "reason": reason, **detail})
            raise GatewayDenied(reason)
        try:
            self.budget.charge()
        except GatewayDenied as e:
            await self.audit_sink("gateway.deny", run_id=self.roe.run_id, actor=self.actor,
                                  detail={"action": action, "reason": e.reason, **detail})
            raise

    async def connect(self) -> dict:
        """Pass through target setup (e.g. AaravTarget agent-card verification). Audited, not gated —
        no borrower egress happens here; the RoE/bound guard applies at send_turn."""
        await self.audit_sink("gateway.connect", run_id=self.roe.run_id, actor=self.actor, detail={})
        connect = getattr(self.target, "connect", None)
        return await connect() if connect else {}

    async def discover_and_verify(self) -> dict:
        return await self.target.discover_and_verify()

    async def start_session(self, contact_id: int) -> dict:
        # opening a session against a target is itself egress — guard it like a send (fail-closed)
        await self._guard("start_session", {"contact_id": contact_id})
        await self.audit_sink("gateway.start_session", run_id=self.roe.run_id, actor=self.actor,
                              detail={"contact_id": contact_id})
        return await self.target.start_session(contact_id)

    async def send_turn(self, session_id: str, message: str) -> dict:
        # revalidate + charge + audit BEFORE the target is ever touched (fail-closed)
        await self._guard("send_turn", {"session_id": session_id, "chars": len(message)})
        await self.audit_sink("gateway.send_turn", run_id=self.roe.run_id, actor=self.actor,
                              detail={"session_id": session_id, "spent": self.budget.spent,
                                      "remaining": self.budget.remaining()})
        return await self.target.send_turn(session_id, message)

    async def end_session(self, session_id: str) -> dict:
        await self.audit_sink("gateway.end_session", run_id=self.roe.run_id, actor=self.actor,
                              detail={"session_id": session_id})
        return await self.target.end_session(session_id)

    async def aclose(self) -> None:
        await self.target.aclose()
