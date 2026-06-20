"""Per-finding recipe suppression (roadmap P9, decision 11 dual-use guard / one-way doors).

A finding is dual-use: its *evidence* (hazard, verdict, breached clause, redacted transcript) is what a
regulator needs, but its *recipe* (the exact primitive chain, mutated payload, attacker turns, strategy
buffer) is a reusable playbook for building a harassment/scam agent. So:

- **`public_view`** — what standard reports & per-finding console views show: hazard + verdict + matched
  clause + framework mappings + redacted evidence, with every reconstructable-recipe field removed and
  the technique abstracted to a category. Never contains a runnable recipe.
- **`recipe_detail`** — the full recipe, returned ONLY behind an access grant; the access is audited and
  the result is marked non-exportable.
- **`assert_export_safe`** — gate any export path; rejects anything still carrying recipe fields.

Pure logic (audit sink injected) — unit-testable with no DB.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional

# Fields that can reconstruct an attack — never in a public/exportable view.
SENSITIVE_KEYS = frozenset({
    "primitive_chain", "mutated_payload", "attack_prompt", "attacker_turns",
    "strategy_buffer", "technique_params", "dsl_recipe", "raw_turns",
})

# Fields safe to surface (regulator-facing evidence).
PUBLIC_KEYS = frozenset({
    "finding_id", "hazard_mode", "verdict", "score", "policy_clause",
    "framework_mappings", "redacted_evidence", "severity",
})


def public_view(finding: dict) -> dict:
    """Regulator-facing view: only PUBLIC_KEYS, plus the technique abstracted to a category label.
    Strips all SENSITIVE_KEYS so no reconstructable recipe leaks."""
    view = {k: finding[k] for k in PUBLIC_KEYS if k in finding}
    # technique: show the *category*, never the parameterized chain
    tech = finding.get("technique") or finding.get("technique_slug")
    if tech:
        view["technique_category"] = _category(str(tech))
    return view


def technique_category(technique: str) -> str:
    """Public: coarse technique family (no params/chain) — used by report recipe-redaction."""
    return _category(technique)


def _category(technique: str) -> str:
    """Abstract a technique slug to a coarse family (no parameters / chain)."""
    t = technique.lower()
    for needle, cat in (("crescendo", "gradual-escalation"), ("pair", "iterative-refinement"),
                        ("tap", "tree-search"), ("goat", "adaptive-agent"),
                        ("xteam", "adaptive-agent"), ("fuzz", "mutation"),
                        ("sandwich", "code-switch"), ("actor", "role-play"),
                        ("opposite", "role-play"), ("foot", "incremental-commitment")):
        if needle in t:
            return cat
    return "other"


def assert_export_safe(view: dict) -> tuple[bool, str]:
    """True only if `view` carries no reconstructable-recipe field (gate every export path)."""
    leaked = SENSITIVE_KEYS & set(view)
    if leaked:
        return False, f"export blocked — view carries recipe fields: {', '.join(sorted(leaked))}"
    return True, "ok"


@dataclass
class AccessGrant:
    """An authorized request to view full recipe detail (who + why). `allowed=False` ⇒ fail-closed."""

    principal: str
    reason: str
    allowed: bool = False


# audit_sink(event_type, *, run_id, actor, detail) -> Awaitable
AuditSink = Callable[..., Awaitable[Any]]


async def _default_audit_sink(event_type: str, *, run_id: str, actor: str, detail: dict) -> Any:
    from .audit import append_event

    return await append_event(event_type, run_id=run_id, actor=actor, detail=detail)


async def recipe_detail(finding: dict, *, grant: AccessGrant, run_id: str = "",
                        audit_sink: Optional[AuditSink] = None) -> dict:
    """Return the full recipe ONLY when `grant.allowed`; the access is audit-logged either way.
    The returned dict is flagged `_non_exportable` so an export path can reject it."""
    sink = audit_sink or _default_audit_sink
    if not grant.allowed:
        await sink("recipe.access_denied", run_id=run_id, actor=grant.principal,
                   detail={"finding_id": finding.get("finding_id"), "reason": grant.reason})
        raise PermissionError("recipe detail access not granted")
    await sink("recipe.access_granted", run_id=run_id, actor=grant.principal,
               detail={"finding_id": finding.get("finding_id"), "reason": grant.reason})
    detail = {k: finding[k] for k in SENSITIVE_KEYS if k in finding}
    detail["_non_exportable"] = True
    detail["finding_id"] = finding.get("finding_id")
    return detail
