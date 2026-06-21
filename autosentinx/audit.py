"""Hash-chained governance audit log (Phase 7, ADR 0002 / decision F).

Append-only + tamper-evident: each entry's hash chains the previous one. Altering any past row breaks
verification. id order is the chain order. Concurrent appends are serialized by a Postgres advisory
lock (pg_advisory_xact_lock) so 6–40 concurrent plays can't fork the chain (P1, decision 19).
"""
import hashlib
import json

from sqlalchemy import text
from sqlmodel import select

from .db import SessionLocal
from .models import AuditEvent, _now

GENESIS = "GENESIS"
# fixed bigint key for the chain-append advisory lock (stable across processes/instances)
_APPEND_LOCK_KEY = 0x4175_5365_6E78  # "AuSenx"


def _hash(prev_hash: str, run_id: str, event_type: str, actor: str, detail_json: str, ts_iso: str) -> str:
    payload = "|".join([prev_hash, run_id or "", event_type, actor, detail_json, ts_iso])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def append_event(event_type: str, *, run_id: str = "", actor: str = "operator",
                       detail: dict | None = None) -> AuditEvent:
    detail_json = json.dumps(detail or {}, sort_keys=True)
    ts = _now()
    async with SessionLocal() as s:
        # Serialize chain appends so concurrent plays (6–40/run) can't both read the same head and
        # FORK the hash chain: a transaction-scoped Postgres advisory lock, auto-released at commit.
        # No-op on non-Postgres (e.g. sqlite in tests, which run single-threaded). NOT swallowed —
        # if the audit append fails, the caller's operation fails closed (the gateway audits BEFORE it
        # forwards to the target, so a failed append blocks egress).
        if s.bind and s.bind.dialect.name == "postgresql":
            await s.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": _APPEND_LOCK_KEY})
        last = (await s.execute(select(AuditEvent).order_by(AuditEvent.id.desc()).limit(1))).scalars().first()
        prev = last.entry_hash if last else GENESIS
        h = _hash(prev, run_id, event_type, actor, detail_json, ts.isoformat())
        ev = AuditEvent(run_id=run_id, event_type=event_type, actor=actor, detail=detail_json,
                        prev_hash=prev, entry_hash=h, created_at=ts)
        s.add(ev)
        await s.commit()                  # releases the advisory lock
        await s.refresh(ev)
        return ev


async def verify_chain(run_id: str | None = None) -> dict:
    """Recompute every hash in order; report whether the chain is intact and where it breaks."""
    async with SessionLocal() as s:
        rows = list((await s.execute(select(AuditEvent).order_by(AuditEvent.id))).scalars().all())
    prev = GENESIS
    broken_at = None
    for ev in rows:
        expect = _hash(prev, ev.run_id, ev.event_type, ev.actor, ev.detail, ev.created_at.isoformat())
        if ev.prev_hash != prev or ev.entry_hash != expect:
            broken_at = ev.id
            break
        prev = ev.entry_hash
    scoped = [ev for ev in rows if (not run_id or ev.run_id == run_id)]
    return {
        "intact": broken_at is None,
        "broken_at_id": broken_at,
        "total_events": len(rows),
        "events": [
            {"id": ev.id, "ts": ev.created_at.isoformat(), "run_id": ev.run_id,
             "event": ev.event_type, "actor": ev.actor, "detail": json.loads(ev.detail or "{}"),
             "entry_hash": ev.entry_hash[:16]}
            for ev in scoped
        ],
    }
