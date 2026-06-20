"""Unit tests for RoE policy, sandbox-tenant attestation & out-of-band kill-switch (roadmap P3).

Pure logic, no DB/network/OPA. Verifies deny-by-default semantics, attestation requirements, the
live kill-switch, the combined launch gate, and that a denied launch fails closed (RoEDenied).
"""
import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from autosentinx.gateway import GatewayDenied
from autosentinx.roe import (
    AlwaysClear,
    Decision,
    KillSwitch,
    RoEDenied,
    RoEManifest,
    SandboxAttestation,
    decide_launch,
    evaluate,
    gateway_roe,
)

OP = "operator-1"
TGT = "https://aarav.example/sandbox"


def _manifest(**kw):
    base = dict(operator=OP, target_id=TGT, allowed_techniques={"crescendo", "pair"})
    base.update(kw)
    return RoEManifest(**base)


def _attest(**kw):
    base = dict(target_id=TGT, dialing_disabled=True, sms_disabled=True, crm_disabled=True,
                pii_lookup_disabled=True, attested_by="tenant-admin")
    base.update(kw)
    return SandboxAttestation(**base)


# --- policy (deny-by-default) ------------------------------------------------

def test_evaluate_allows_authorized_request():
    d = evaluate(_manifest(), operator=OP, target_id=TGT, technique="crescendo")
    assert d.allow and d.reason == "ok"


def test_evaluate_denies_wrong_operator_target_and_technique():
    m = _manifest()
    assert not evaluate(m, operator="intruder", target_id=TGT, technique="crescendo").allow
    assert not evaluate(m, operator=OP, target_id="https://prod.example", technique="crescendo").allow
    assert not evaluate(m, operator=OP, target_id=TGT, technique="not-allowed").allow


def test_evaluate_denies_expired_window():
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    d = evaluate(_manifest(expires_at=past), operator=OP, target_id=TGT, technique="pair")
    assert not d.allow and "expired" in d.reason


# --- sandbox attestation -----------------------------------------------------

def test_attestation_requires_all_channels_disabled():
    ok, _ = _attest().verify(target_id=TGT)
    assert ok
    bad, why = _attest(sms_disabled=False).verify(target_id=TGT)
    assert not bad and "sms" in why


def test_attestation_rejects_wrong_target_and_missing_authority():
    assert not _attest().verify(target_id="other")[0]
    assert not _attest(attested_by="").verify(target_id=TGT)[0]


# --- kill-switch (out of band, live) ----------------------------------------

def test_kill_switch_engage_clear(tmp_path):
    ks = KillSwitch(str(tmp_path / "kill"))
    assert ks.engaged() is False
    ks.engage()
    assert ks.engaged() is True
    ks.clear()
    assert ks.engaged() is False


# --- combined launch gate ----------------------------------------------------

def test_decide_launch_allows_when_all_clear():
    d = decide_launch(_manifest(), _attest(), AlwaysClear(), operator=OP, target_id=TGT,
                      technique="crescendo")
    assert d.allow


def test_decide_launch_killswitch_short_circuits(tmp_path):
    ks = KillSwitch(str(tmp_path / "kill")); ks.engage()
    d = decide_launch(_manifest(), _attest(), ks, operator=OP, target_id=TGT)
    assert not d.allow and "kill-switch" in d.reason


def test_decide_launch_blocks_on_bad_attestation():
    d = decide_launch(_manifest(), _attest(crm_disabled=False), AlwaysClear(), operator=OP, target_id=TGT)
    assert not d.allow and "attestation" in d.reason


# --- gateway_roe: fail-closed launch + live kill-switch on the gateway -------

def test_gateway_roe_raises_when_launch_denied():
    with pytest.raises(RoEDenied):
        gateway_roe(_manifest(), _attest(pii_lookup_disabled=False), AlwaysClear(),
                    run_id="r1", operator=OP, target_id=TGT)


def test_gateway_roe_produces_live_killswitch_guard(tmp_path):
    ks = KillSwitch(str(tmp_path / "kill"))
    roe = gateway_roe(_manifest(), _attest(), ks, run_id="r1", operator=OP, target_id=TGT)
    ok, _ = roe.validate()
    assert ok                                   # clear → allowed
    ks.engage()                                 # trip it AFTER building the RoE
    bad, why = roe.validate()
    assert not bad and "kill-switch" in why      # re-read live → now denied
