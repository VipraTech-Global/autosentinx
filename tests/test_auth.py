"""Auth — password hashing + JWT round-trip (offline, no DB/network)."""
import pytest

from autosentinx.security import _decode, create_access_token, hash_password, verify_password


def test_hash_and_verify():
    h = hash_password("supersecret1")
    assert h != "supersecret1"
    assert verify_password("supersecret1", h)
    assert not verify_password("wrong", h)


def test_token_roundtrip():
    tok = create_access_token("user@example.com")
    assert _decode(tok) == "user@example.com"


def test_bad_token_rejected():
    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        _decode("not-a-real-token")
