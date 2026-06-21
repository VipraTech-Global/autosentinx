"""P11: deploy-verification release gate + SHIP one-way door."""
import pytest

from autosentinx.deploy_gate import (CheckResult, ShipDenied, api_alive_check, backends_from_env_check,
                                     console_alive_check, neon_reachable_check, region_check,
                                     ship_gate, verify_deploy)


def test_verify_deploy_fails_closed_on_any_check():
    ok = lambda: CheckResult("x", True)
    bad = lambda: CheckResult("y", False, "down")
    assert verify_deploy([ok, ok]).ok is True
    r = verify_deploy([ok, bad])
    assert r.ok is False and [c.name for c in r.failures] == ["y"]
    assert verify_deploy([]).ok is False                  # no checks → not verified


def test_default_checks():
    assert api_alive_check("https://api", lambda u: 200).ok
    assert not api_alive_check("https://api", lambda u: 500).ok
    assert console_alive_check("https://c", lambda u: 307).ok
    assert region_check("asia-southeast1").ok and not region_check("asia-south1").ok
    assert backends_from_env_check({"judge": "g", "target": "a"}).ok
    assert not backends_from_env_check({"judge": "g", "target": None}).ok
    assert neon_reachable_check(True).ok and not neon_reachable_check(False).ok


def test_ship_gate_requires_passing_deploy_and_explicit_human_approval():
    good = verify_deploy([lambda: CheckResult("a", True)])
    bad = verify_deploy([lambda: CheckResult("a", False)])
    # fail-closed: bad deploy, or no approver
    with pytest.raises(ShipDenied):
        ship_gate(bad, human_approved=True, approver="alice")
    with pytest.raises(ShipDenied):
        ship_gate(good, human_approved=False, approver="alice")
    with pytest.raises(ShipDenied):
        ship_gate(good, human_approved=True, approver="")
    # only an explicit human approval over a passing deploy ships
    out = ship_gate(good, human_approved=True, approver="alice")
    assert out["shipped"] and out["approver"] == "alice"
