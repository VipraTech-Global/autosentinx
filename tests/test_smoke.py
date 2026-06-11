"""Phase-0 smoke tests. Run: uv run pytest -q"""
import pytest

from autosentinx.config import get_settings
from autosentinx.target import _b64url, _canonical


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
