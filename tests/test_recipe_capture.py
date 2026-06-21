"""Generic provider recipe capture (Turn.recipe) + its P9 suppression."""
import json

from autosentinx.runner import _provider_recipe
from autosentinx.suppression import assert_export_safe, public_view


class _ProvWithChain:
    last_chain = [{"persuasion": "authority", "directive_hash": "deadbeef"}]


class _NativeProv:
    pass  # no last_chain — the ComposableAttacker case


def test_recipe_serialized_under_sensitive_key():
    out = _provider_recipe(_ProvWithChain())
    parsed = json.loads(out)
    # keyed under "primitive_chain" so suppression.SENSITIVE_KEYS catches it
    assert parsed["primitive_chain"][0]["persuasion"] == "authority"


def test_native_provider_records_no_recipe():
    assert _provider_recipe(_NativeProv()) == ""
    assert _provider_recipe(object()) == ""


def test_captured_recipe_is_p9_suppressed():
    # a finding carrying the captured recipe must be stripped from the borrower/regulator view
    recipe = json.loads(_provider_recipe(_ProvWithChain()))
    finding = {"finding_id": "F1", "hazard_mode": "DATA_BREACH", "verdict": "succeeded",
               "technique": "crescendo-pap-authority", **recipe}
    view = public_view(finding)
    assert "primitive_chain" not in view                 # recipe never leaks
    assert view["technique_category"] == "persuasion"     # abstracted, not the parametrized chain
    ok, _ = assert_export_safe(finding)
    assert ok is False                                    # export gate blocks the raw recipe
    ok, _ = assert_export_safe(view)
    assert ok is True                                     # the abstracted view is export-safe
