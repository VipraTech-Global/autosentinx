"""Unit tests for the audited gateway (roadmap P4, keystone #3).

Pure-logic: a fake target + a fake audit sink (no DB / network). Asserts the keystone properties —
the gateway is the sole egress, every send is audited, and RoE/bound denials are fail-closed (the
target is never called). Uses `asyncio.run` directly so no pytest-asyncio plugin is required.
"""
import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from autosentinx.gateway import AuditedGateway, Budget, GatewayDenied, RoE


class FakeTarget:
    def __init__(self):
        self.sent: list[tuple[str, str]] = []
        self.started: list[int] = []
        self.closed = False

    async def start_session(self, contact_id: int) -> dict:
        self.started.append(contact_id)
        return {"session_id": f"s-{contact_id}"}

    async def send_turn(self, session_id: str, message: str) -> dict:
        self.sent.append((session_id, message))
        return {"agent_text": "ok"}

    async def end_session(self, session_id: str) -> dict:
        return {}

    async def aclose(self) -> None:
        self.closed = True


def _sink():
    events: list[dict] = []

    async def sink(event_type, *, run_id, actor, detail):
        events.append({"event": event_type, "run_id": run_id, "actor": actor, "detail": detail})
        return events[-1]

    return events, sink


def _gw(target, roe=None, budget=None):
    events, sink = _sink()
    roe = roe or RoE(run_id="r1", authorized=True)
    gw = AuditedGateway(target=target, roe=roe, budget=budget or Budget(), audit_sink=sink)
    return gw, events


def test_authorized_send_forwards_and_audits():
    async def run():
        t = FakeTarget()
        gw, events = _gw(t)
        out = await gw.send_turn("s-1", "namaste")
        assert out == {"agent_text": "ok"}
        assert t.sent == [("s-1", "namaste")]                       # forwarded
        assert any(e["event"] == "gateway.send_turn" for e in events)  # audited
    asyncio.run(run())


def test_unauthorized_roe_is_fail_closed():
    async def run():
        t = FakeTarget()
        gw, events = _gw(t, roe=RoE(run_id="r1", authorized=False))
        with pytest.raises(GatewayDenied):
            await gw.send_turn("s-1", "namaste")
        assert t.sent == []                                         # target NEVER called
        assert any(e["event"] == "gateway.deny" for e in events)    # denial audited
    asyncio.run(run())


def test_kill_switch_denies_even_when_authorized():
    async def run():
        t = FakeTarget()
        gw, _ = _gw(t, roe=RoE(run_id="r1", authorized=True, kill_switch_engaged=True))
        with pytest.raises(GatewayDenied):
            await gw.send_turn("s-1", "x")
        assert t.sent == []
    asyncio.run(run())


def test_expired_roe_denies():
    async def run():
        t = FakeTarget()
        past = datetime.now(timezone.utc) - timedelta(seconds=1)
        gw, _ = _gw(t, roe=RoE(run_id="r1", authorized=True, expires_at=past))
        with pytest.raises(GatewayDenied):
            await gw.send_turn("s-1", "x")
        assert t.sent == []
    asyncio.run(run())


def test_governed_bound_exhaustion_is_fail_closed():
    async def run():
        t = FakeTarget()
        gw, events = _gw(t, budget=Budget(granted=2))
        await gw.send_turn("s", "1")
        await gw.send_turn("s", "2")
        with pytest.raises(GatewayDenied):
            await gw.send_turn("s", "3")                            # over the bound
        assert t.sent == [("s", "1"), ("s", "2")]                  # third never forwarded
        assert gw.budget.spent == 2 and gw.budget.remaining() == 0
        assert any(e["detail"].get("reason", "").startswith("governed turn bound") for e in events)
    asyncio.run(run())


def test_start_and_end_are_audited():
    async def run():
        t = FakeTarget()
        gw, events = _gw(t)
        await gw.start_session(7)
        await gw.end_session("s-7")
        kinds = {e["event"] for e in events}
        assert "gateway.start_session" in kinds and "gateway.end_session" in kinds
        assert t.started == [7]
    asyncio.run(run())
