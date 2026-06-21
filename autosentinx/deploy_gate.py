"""Deploy-verification release gate + SHIP one-way door (roadmap P11, decision 20 deferral note + SHIP).

Before conferring legitimacy on a deployment, verify the running stack is actually serving:
- the FastAPI API on Cloud Run (asia-southeast1),
- the Next.js console on Cloud Run,
- Neon Postgres reachable,
- judge/provider/target backend identities resolving from env/secret config (none hardcoded).

`verify_deploy` runs injected checks (so it unit-tests without live infra) and fails the gate on ANY
failure. `ship_gate` is the final one-way door: it advances ONLY on an explicit human approval token —
never automatically (mirrors corrobai's SHIP discipline). The actual `gcloud run deploy` stays an
operator action; this is the gate that guards it.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

REGION = "asia-southeast1"

# a check returns (name, ok, detail). Injected so the gate is testable without live infra.
Check = Callable[[], "CheckResult"]


@dataclass(frozen=True)
class CheckResult:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class DeployResult:
    checks: list = field(default_factory=list)         # list[CheckResult]

    @property
    def ok(self) -> bool:
        return bool(self.checks) and all(c.ok for c in self.checks)

    @property
    def failures(self) -> list:
        return [c for c in self.checks if not c.ok]


def verify_deploy(checks: list) -> DeployResult:
    """Run all release checks; the gate passes only if every check passes (fail-closed)."""
    return DeployResult(checks=[c() for c in checks])


# --- default checks (live; swapped for fakes in tests) -----------------------

def api_alive_check(api_url: str, http_get) -> CheckResult:
    try:
        ok = http_get(f"{api_url.rstrip('/')}/health") == 200
    except Exception as e:  # noqa: BLE001
        return CheckResult("api_alive", False, str(e)[:80])
    return CheckResult("api_alive", ok, f"GET /health on {api_url}")


def console_alive_check(console_url: str, http_get) -> CheckResult:
    try:
        ok = http_get(console_url) in (200, 307, 308)
    except Exception as e:  # noqa: BLE001
        return CheckResult("console_alive", False, str(e)[:80])
    return CheckResult("console_alive", ok, console_url)


def region_check(region: str) -> CheckResult:
    return CheckResult("region", region == REGION, f"expected {REGION}, got {region}")


def backends_from_env_check(resolved: dict) -> CheckResult:
    """`resolved` = {role: identity-or-None}. Pass iff every required backend resolved from config."""
    missing = [r for r, v in resolved.items() if not v]
    return CheckResult("backends_resolved", not missing,
                       "all resolved" if not missing else f"unresolved: {', '.join(missing)}")


def neon_reachable_check(reachable: bool) -> CheckResult:
    return CheckResult("neon_reachable", bool(reachable), "Neon Postgres connectivity")


class ShipDenied(Exception):
    """The SHIP gate was not granted an explicit human approval — fail-closed."""


def ship_gate(deploy: DeployResult, *, human_approved: bool, approver: str = "") -> dict:
    """The final one-way door. Advances ONLY when the deploy verification passed AND a human explicitly
    approved (never automatic). Returns the signed-ish decision; raises ShipDenied otherwise."""
    if not deploy.ok:
        raise ShipDenied(f"deploy verification failed: {[c.name for c in deploy.failures]}")
    if not human_approved or not approver:
        raise ShipDenied("SHIP requires an explicit human approval (approver) — fail-closed")
    return {"shipped": True, "approver": approver, "checks": [c.name for c in deploy.checks]}
