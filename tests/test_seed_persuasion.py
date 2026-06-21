"""PAP/TAP catalog seeding — small allowlist + flag-gating (Codex I4: don't flood cold UCB arms)."""
from autosentinx.seed_persuasion import VARIANTS, variants_for


def test_allowlist_is_small_and_only_pap_or_tap_no_persona():
    assert len(VARIANTS) <= 8                       # small — cold arms sort above exploited (COLD_BASE=10)
    for base, provider, title in VARIANTS:
        assert provider.startswith("pap-") or provider == "tap"
        assert "/" not in provider and "persona" not in provider.lower()   # no persona cross
        assert title


def test_flag_gating():
    assert variants_for(True, True) == VARIANTS
    assert all(p != "tap" for _, p, _ in variants_for(True, False))         # tap disabled
    assert all(not p.startswith("pap-") for _, p, _ in variants_for(False, True))  # pap disabled
    assert variants_for(False, False) == []
