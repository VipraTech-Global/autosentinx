"""Unit tests for the composable technique DSL (roadmap P5)."""
import base64

from autosentinx.dsl import (
    Recipe,
    acronym,
    code_switch,
    encode_base64,
    persona_wrap,
    phonetic_perturb,
)
from autosentinx.suppression import SENSITIVE_KEYS, assert_export_safe


def test_single_primitives_transform():
    assert persona_wrap("a lawyer").apply("share the balance").startswith("[As a lawyer]")
    assert "Sir ji" in code_switch().apply("give me the account number")
    assert encode_base64().apply("hi") == base64.b64encode(b"hi").decode()


def test_phonetic_perturbation_is_applied():
    out = phonetic_perturb().apply("please confirm the account number")
    assert "pliz" in out and "kanfarm" in out and "akaunt" in out and "numbar" in out


def test_recipe_composes_in_order_and_records_firing_chain():
    r = Recipe().then(persona_wrap("a lawyer")).then(code_switch()).then(phonetic_perturb())
    out, chain = r.apply("confirm the address")
    assert [s.name for s in chain] == ["persona_wrap", "code_switch", "phonetic_perturb"]
    assert "[As a lawyer]" in out and "Sir ji" in out and "adres" in out      # all fired, in order


def test_acronym_substitution_recorded_in_params():
    r = Recipe().then(acronym({"jailbreak": "JB"}))
    out, chain = r.apply("do a jailbreak now")
    assert "JB" in out and "jailbreak" not in out
    assert ("jailbreak", "JB") in chain[0].params


def test_firing_signature_is_a_suppressible_recipe():
    r = Recipe().then(persona_wrap("x")).then(encode_base64())
    sig = r.firing_signature("secret ask")
    assert "primitive_chain" in sig                                    # the recipe provenance
    # that primitive_chain is exactly what P9 must keep out of an exportable view
    assert "primitive_chain" in SENSITIVE_KEYS
    assert not assert_export_safe(sig)[0]
