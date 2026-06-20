"""Unit tests for raw-PII-free containment & redaction (roadmap P2)."""
from autosentinx.redaction import (
    Containment,
    EmissionGate,
    PiiSpan,
    contain,
    value_hash,
)

TEXT = "Call Rajesh at 9876543210 about PAN ABCDE1234F now"
#       0         1         2         3         4
#       0123456789...


def _spans():
    phone = TEXT.index("9876543210")
    pan = TEXT.index("ABCDE1234F")
    return [
        PiiSpan(phone, phone + 10, "PHONE"),
        PiiSpan(pan, pan + 10, "PAN"),
    ]


def test_contain_replaces_spans_with_typed_tokens_and_drops_raw():
    c = contain(TEXT, _spans())
    assert "9876543210" not in c.redacted_text and "ABCDE1234F" not in c.redacted_text
    assert "[PII:PHONE:f0]" in c.redacted_text and "[PII:PAN:f1]" in c.redacted_text
    # tokens carry type + field id + hash + linkage, but NEVER the raw value
    for t in c.tokens:
        assert t.value_hash and "9876543210" not in t.value_hash
        assert TEXT[t.start:t.end] in ("9876543210", "ABCDE1234F")     # linkage offsets valid


def test_value_hash_is_stable_and_linkable():
    assert value_hash("9876543210") == value_hash("9876543210")
    assert value_hash("9876543210") != value_hash("0000000000")
    # same raw value in two findings → same hash (linkable without storing raw)
    c1 = contain("ph 9876543210", [PiiSpan(3, 13, "PHONE")])
    c2 = contain("again 9876543210", [PiiSpan(6, 16, "PHONE")])
    assert c1.tokens[0].value_hash == c2.tokens[0].value_hash


def test_overlapping_spans_resolved_no_corruption():
    c = contain("ABCDE1234F", [PiiSpan(0, 10, "PAN"), PiiSpan(2, 6, "DIGITS")])
    assert c.redacted_text == "[PII:PAN:f0]"          # outer kept, inner overlap dropped
    assert len(c.tokens) == 1


def test_emission_gate_blocks_on_unresolved_pii():
    c = contain("x 9876543210", [PiiSpan(2, 12, "UNKNOWN", resolved=False)])
    ok, reason = EmissionGate.can_emit(c)
    assert not ok and "UNKNOWN" in reason


def test_emission_gate_allows_clean_redaction():
    ok, _ = EmissionGate.can_emit(contain(TEXT, _spans()))
    assert ok


def test_containment_holds_no_raw_pii():
    c = contain(TEXT, _spans())
    # the containment object, serialized, must not leak any raw identifier
    blob = c.redacted_text + "".join(t.token + t.entity_type + t.field_id + t.value_hash for t in c.tokens)
    assert "9876543210" not in blob and "ABCDE1234F" not in blob


# --- detector adapter over the repo's existing Indian-PII patterns (no Presidio) ---

def test_detect_and_contain_real_indian_pii():
    from autosentinx.redaction import EmissionGate, contain_text
    txt = "Aapka Aadhaar 1234 5678 9012 aur PAN ABCDE1234F, phone 9876543210 hai"
    c = contain_text(txt)
    # all three identifiers detected, tokenized, and dropped from the redacted text
    types = {t.entity_type for t in c.tokens}
    assert {"AADHAAR", "PAN", "PHONE"} <= types
    assert "1234 5678 9012" not in c.redacted_text and "ABCDE1234F" not in c.redacted_text
    assert "9876543210" not in c.redacted_text
    assert EmissionGate.can_emit(c)[0]                      # all resolved → emittable
