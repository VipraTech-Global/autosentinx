"""Target seam + AaravTarget.

Fetches AARAV's signed agent-card, HMAC-verifies it (matching AARAV's own
canonicalization exactly), reads the advertised endpoints, then drives the
/voice/call/* conversation. Pure black-box: we keep our own transcript and never
read AARAV's DB.
"""
import base64
import copy
import hashlib
import hmac
import json
from typing import Optional, Protocol

import httpx

from .config import get_settings


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _canonical(card: dict) -> bytes:
    payload = copy.deepcopy(card)
    payload.pop("signature", None)
    return json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("utf-8")


class Target(Protocol):
    async def discover_and_verify(self) -> dict: ...
    async def start_session(self, contact_id: int) -> dict: ...
    async def send_turn(self, session_id: str, message: str) -> dict: ...
    async def end_session(self, session_id: str) -> dict: ...


class AaravTarget:
    def __init__(self, base_url: Optional[str] = None) -> None:
        s = get_settings()
        self.base = (base_url or s.aarav_base_url).rstrip("/")
        self._secret = s.aarav_card_shared_secret
        self._kid = s.aarav_card_key_id
        self._bearer = s.target_bearer_token
        self._endpoints: dict = {}
        self._client = httpx.AsyncClient(timeout=120.0)

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self._bearer:
            h["Authorization"] = f"Bearer {self._bearer}"
        return h

    async def discover_and_verify(self) -> dict:
        r = await self._client.get(f"{self.base}/.well-known/agent-card.json")
        r.raise_for_status()
        card = r.json()
        sig = card.get("signature") or {}
        expected = _b64url(
            hmac.new(self._secret.encode("utf-8"), _canonical(card), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(expected, sig.get("value", "")):
            raise ValueError("AARAV agent-card signature verification FAILED")
        if self._kid and sig.get("kid") != self._kid:
            raise ValueError(f"agent-card kid mismatch: card={sig.get('kid')} expected={self._kid}")
        self._endpoints = card.get("endpoints", {})
        return card

    async def start_session(self, contact_id: int) -> dict:
        """Returns the full start payload: session_id, contact_name, agent_text, compliance_*."""
        url = self._endpoints.get("voice_start") or f"{self.base}/voice/call/start"
        body: dict = {"contact_id": contact_id}
        s = get_settings()
        if s.aarav_force_current_time:  # forces AARAV's settings-aware window path (avoids hardcoded 10-7 default)
            body["current_time"] = s.aarav_force_current_time
        r = await self._client.post(url, headers=self._headers(), json=body)
        r.raise_for_status()
        return r.json()

    async def send_turn(self, session_id: str, message: str) -> dict:
        tmpl = self._endpoints.get("voice_respond_template") or \
            f"{self.base}/voice/call/{{session_id}}/respond"
        url = tmpl.replace("{session_id}", session_id)
        r = await self._client.post(url, headers=self._headers(), json={"borrower_message": message})
        r.raise_for_status()
        return r.json()

    async def end_session(self, session_id: str) -> dict:
        tmpl = self._endpoints.get("voice_end_template") or \
            f"{self.base}/voice/call/{{session_id}}/end"
        url = tmpl.replace("{session_id}", session_id)
        r = await self._client.post(url, headers=self._headers())
        return r.json() if r.content else {}

    async def aclose(self) -> None:
        await self._client.aclose()
