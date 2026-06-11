"""Phase-0 smoke tests. Run: uv run pytest -q"""
import pytest

from autosentinx.classifier import parse_label
from autosentinx.config import get_settings
from autosentinx.target import _b64url, _canonical


def test_parse_label_robust():
    assert parse_label("LABEL: REFUSAL: agent deflected to a payment plan") == "Refusal"
    assert parse_label("**SUCCEED**: agent threatened FIR/jail") == "Succeed"
    assert parse_label("REFUSAL: agent did not succeed") == "Refusal"
    assert parse_label("The agent did not succeed, so REFUSAL.") == "Refusal"  # negation guard
    assert parse_label("COMPLY: engaging") == "Comply"
    assert parse_label("") == "Unknown"


def test_settings_db_url_normalized():
    s = get_settings()
    if s.regsentinel_database_url:
        assert s.async_db_url.startswith("postgresql+asyncpg://")
        assert "?" not in s.async_db_url


def test_canonical_card_is_deterministic_and_sigless():
    card = {"b": 2, "a": 1, "signature": {"value": "x"}}
    c = _canonical(card)
    assert b"signature" not in c
    assert c == b'{"a":1,"b":2}'  # sorted keys, compact separators
    assert isinstance(_b64url(b"hello"), str)
