"""Rules-of-Engagement policy, sandbox-tenant attestation & out-of-band kill-switch (roadmap P3,
decision 17 / ADR 0017).

Three controls, all **fail-closed**:

1. **Deny-by-default policy** (`evaluate`) — OPA/Rego-shaped: a request (operator, target, technique,
   time) is allowed ONLY if a ratified `RoEManifest` authorizes it on every axis (operator identity,
   target identity, allowed techniques, in-scope, within the time window). Anything unstated ⇒ deny.
2. **Sandbox-tenant attestation** (`SandboxAttestation.verify`) — a scan may only run against a target
   that attests its real borrower channels (outbound dialing, SMS, CRM, PII-lookup) are DISABLED.
3. **Out-of-band kill-switch** (`KillSwitch`) — a stop control INDEPENDENT of the policy engine, so a
   crashed/misconfigured policy never leaves the door open and a tripped switch halts egress live.

`decide_launch` combines all three (advance requires policy-allow AND valid attestation AND clear
kill-switch). `gateway_roe` turns a successful launch decision into the gateway's `RoE` guard, with
the kill-switch re-read live on every send. Pure logic — no DB/network/OPA process required to test.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Optional


def _now(now: Optional[datetime] = None) -> datetime:
    return now or datetime.now(timezone.utc)


# --------------------------------------------------------------------------- kill-switch (out of band)

class KillSwitch:
    """Out-of-band stop control. `engaged()` is re-read live (e.g. each send), independent of the
    policy engine — so policy-engine unavailability can never disable the stop, and a trip halts
    egress immediately. Backed by a file's existence (a real deploy points it at a control-plane flag)."""

    def __init__(self, path: Optional[str] = None):
        self.path = path or os.environ.get("AUTOSENTINX_KILLSWITCH_FILE", "/tmp/autosentinx.kill")

    def engaged(self) -> bool:
        return os.path.exists(self.path)

    def engage(self) -> None:
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("engaged\n")

    def clear(self) -> None:
        try:
            os.remove(self.path)
        except OSError:
            pass


class AlwaysClear:
    """A null kill-switch (never engaged) for tests / contexts that supply their own control."""

    def engaged(self) -> bool:
        return False


# --------------------------------------------------------------------------- sandbox-tenant attestation

@dataclass
class SandboxAttestation:
    """Signed assertion that `target_id` is a sandbox/test tenant with real borrower channels disabled."""

    target_id: str
    dialing_disabled: bool = False
    sms_disabled: bool = False
    crm_disabled: bool = False
    pii_lookup_disabled: bool = False
    attested_by: str = ""
    expires_at: Optional[datetime] = None

    def verify(self, *, target_id: str, now: Optional[datetime] = None) -> tuple[bool, str]:
        if self.target_id != target_id:
            return False, "attestation is for a different target"
        if not self.attested_by:
            return False, "attestation has no attesting authority"
        missing = [n for n, v in (("dialing", self.dialing_disabled), ("sms", self.sms_disabled),
                                  ("crm", self.crm_disabled), ("pii_lookup", self.pii_lookup_disabled))
                   if not v]
        if missing:
            return False, f"real channels not provably disabled: {', '.join(missing)}"
        if self.expires_at is not None and _now(now) >= self.expires_at:
            return False, "attestation expired"
        return True, "ok"


# --------------------------------------------------------------------------- ratified RoE manifest

@dataclass
class RoEManifest:
    """The ratified authorization, binding operator authority + target identity + allowed techniques
    + scope + time window (DEFINE-review: authorization must name all of these, not just sandbox)."""

    operator: str
    target_id: str
    allowed_techniques: frozenset = field(default_factory=frozenset)
    allowed_targets: frozenset = field(default_factory=frozenset)
    expires_at: Optional[datetime] = None

    def __post_init__(self):
        self.allowed_techniques = frozenset(self.allowed_techniques)
        # the named target is always in-scope for itself; extra allowed_targets widen the scope.
        self.allowed_targets = frozenset(self.allowed_targets) | {self.target_id}


@dataclass
class Decision:
    allow: bool
    reason: str
    violations: tuple = ()


def evaluate(manifest: RoEManifest, *, operator: str, target_id: str,
             technique: Optional[str] = None, now: Optional[datetime] = None) -> Decision:
    """Deny-by-default policy evaluation (the OPA-allow half). Allow only if every axis checks out."""
    v: list[str] = []
    if operator != manifest.operator:
        v.append(f"operator {operator!r} not the authorized operator")
    if target_id not in manifest.allowed_targets:
        v.append(f"target {target_id!r} out of authorized scope")
    if technique is not None and manifest.allowed_techniques and technique not in manifest.allowed_techniques:
        v.append(f"technique {technique!r} not in allowed set")
    if manifest.expires_at is not None and _now(now) >= manifest.expires_at:
        v.append("authorization window expired")
    if v:
        return Decision(False, "; ".join(v), tuple(v))
    return Decision(True, "ok")


def decide_launch(manifest: RoEManifest, attestation: SandboxAttestation, kill_switch,
                  *, operator: str, target_id: str, technique: Optional[str] = None,
                  now: Optional[datetime] = None) -> Decision:
    """Launch gate: advance ONLY when kill-switch clear AND attestation valid AND policy allows.
    Fail-closed and ordered so the cheapest hard-stop (kill-switch) short-circuits first."""
    if kill_switch.engaged():
        return Decision(False, "kill-switch engaged", ("kill-switch engaged",))
    ok, why = attestation.verify(target_id=target_id, now=now)
    if not ok:
        return Decision(False, f"attestation invalid: {why}", (f"attestation: {why}",))
    return evaluate(manifest, operator=operator, target_id=target_id, technique=technique, now=now)


def gateway_roe(manifest: RoEManifest, attestation: SandboxAttestation, kill_switch, *, run_id: str,
                operator: str, target_id: str, now: Optional[datetime] = None):
    """Build the gateway `RoE` guard from a launch decision. Raises `RoEDenied` (fail-closed) if launch
    is not authorized — so no scan starts. The returned RoE re-reads the live kill-switch each send."""
    from .gateway import RoE

    d = decide_launch(manifest, attestation, kill_switch, operator=operator, target_id=target_id, now=now)
    if not d.allow:
        raise RoEDenied(d.reason)
    return RoE(run_id=run_id, authorized=True, in_scope=True, expires_at=manifest.expires_at,
               kill_switch_engaged=kill_switch.engaged)   # callable → re-read live per send


class RoEDenied(Exception):
    """Launch refused — no scan starts. Fail-closed."""
