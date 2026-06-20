"""Unit tests for the attack-provider seam (roadmap P6, decisions 1 & 8)."""
import pytest

from autosentinx.attacker.provider import AttackProvider, get_provider, providers, register


class _FakeLLM:
    async def generate(self, *a, **k):
        return "x"


def test_native_provider_is_registered_and_conforms():
    assert "native" in providers()
    p = get_provider("native", _FakeLLM())
    # the native ComposableAttacker satisfies the provider protocol (the stable seam)
    assert isinstance(p, AttackProvider)
    assert hasattr(p, "open") and hasattr(p, "next_turn") and hasattr(p, "update_belief")


def test_unknown_provider_raises():
    with pytest.raises(KeyError):
        get_provider("pyrit", _FakeLLM())     # external adapters not registered yet → explicit error


def test_register_adds_a_provider_behind_the_same_contract():
    class _Stub:
        async def open(self, *a, **k): return "o"
        async def next_turn(self, *a, **k): return "n"
        def update_belief(self, *a, **k): return None

    register("stub-engine", lambda llm: _Stub())
    assert "stub-engine" in providers()
    p = get_provider("stub-engine", _FakeLLM())
    assert isinstance(p, AttackProvider)
