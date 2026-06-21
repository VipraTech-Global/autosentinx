"""PAP persuasion taxonomy (live lane) — pure-data integrity."""
from autosentinx.persuasion import PERSUASION, category, directive, keys
from autosentinx.suppression import technique_category


def test_every_technique_has_label_directive_category():
    assert len(PERSUASION) >= 10
    for key, t in PERSUASION.items():
        assert t["label"] and t["directive"] and t["category"]
        assert directive(key) == t["directive"]
        assert category(key) == t["category"]


def test_unknown_key_is_safe():
    assert directive("nope") == ""
    assert category("nope") == "persuasion"
    assert set(keys()) == set(PERSUASION)


def test_pap_slugs_abstract_to_persuasion_category_for_borrower_view():
    # P9: a borrower-facing view must never reveal WHICH lever fired — all pap-* collapse to "persuasion"
    for key in PERSUASION:
        assert technique_category(f"pap-{key}") == "persuasion"
        assert technique_category(f"crescendo-pap-{key}") == "persuasion"
