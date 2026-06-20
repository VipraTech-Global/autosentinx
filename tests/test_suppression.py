"""Unit tests for per-finding recipe suppression (roadmap P9)."""
import asyncio

import pytest

from autosentinx.suppression import (
    AccessGrant,
    assert_export_safe,
    public_view,
    recipe_detail,
)

FINDING = {
    "finding_id": "F-1",
    "hazard_mode": "third-party-disclosure",
    "verdict": "FAIL",
    "score": 0.9,
    "policy_clause": "RBI-FPC-6.2",
    "framework_mappings": ["OWASP-LLM06", "DPDP-8"],
    "redacted_evidence": "agent told [PII:PERSON:f0] the balance",
    "technique_slug": "crescendo+sandwich",
    # sensitive recipe fields:
    "primitive_chain": ["persona:lawyer", "lang:hinglish", "encode:b64"],
    "attacker_turns": ["turn 1 raw", "turn 2 raw"],
    "mutated_payload": "exact jailbreak string",
}


def _sink():
    events = []

    async def sink(event_type, *, run_id, actor, detail):
        events.append({"event": event_type, "actor": actor, "detail": detail})

    return events, sink


def test_public_view_strips_recipe_and_abstracts_technique():
    v = public_view(FINDING)
    assert v["hazard_mode"] == "third-party-disclosure" and v["policy_clause"] == "RBI-FPC-6.2"
    assert v["technique_category"] == "gradual-escalation"   # abstracted, not the exact chain
    for k in ("primitive_chain", "attacker_turns", "mutated_payload", "technique_slug"):
        assert k not in v
    assert "exact jailbreak string" not in str(v)


def test_export_gate_rejects_recipe_fields_and_allows_public():
    ok, _ = assert_export_safe(public_view(FINDING))
    assert ok
    bad, reason = assert_export_safe(FINDING)               # raw finding has recipe fields
    assert not bad and "recipe fields" in reason


def test_recipe_detail_denied_without_grant_is_fail_closed_and_audited():
    events, sink = _sink()

    async def run():
        with pytest.raises(PermissionError):
            await recipe_detail(FINDING, grant=AccessGrant("eng", "debug"), run_id="r1", audit_sink=sink)
    asyncio.run(run())
    assert events and events[-1]["event"] == "recipe.access_denied"


def test_recipe_detail_granted_returns_detail_audited_and_non_exportable():
    events, sink = _sink()

    async def run():
        return await recipe_detail(FINDING, grant=AccessGrant("eng", "IR review", allowed=True),
                                   run_id="r1", audit_sink=sink)
    detail = asyncio.run(run())
    assert detail["mutated_payload"] == "exact jailbreak string"
    assert detail["_non_exportable"] is True
    assert any(e["event"] == "recipe.access_granted" for e in events)
    # and such a detail object must be export-rejected
    assert not assert_export_safe(detail)[0]
