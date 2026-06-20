"""External anchoring for the tamper-evident audit chain (roadmap P1, decision 19 / ADR 0019).

The audit chain (`audit.py`) is tamper-evident *internally*: recompute every hash and a mutated or
removed interior row is detected. But a single-host chain cannot, by itself, detect a **rollback or
fork** — an attacker who can rewrite the whole table could rebuild a *different* but internally-
consistent chain. The defense (decision 19, opt-3) is to periodically publish the current chain HEAD
to an **append-only external store** that is outside the chain's own trust domain, so any later
divergence from a previously-witnessed head is provable.

This module is the pluggable anchoring layer. It does NOT touch the existing chain or its hashing —
it only *reads* the current head and submits it to an `AnchorStore`. Swap `FileAnchorStore` for a
real external sink (object store with object-lock, or a Trillian-style transparency log) in
production by implementing the same `submit` / `head` contract.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from typing import Any, Optional, Protocol, runtime_checkable

# NOTE: DB-touching imports (sqlmodel / db / models) are deliberately LAZY — imported inside
# `current_head()` only. This keeps the pure logic (canonical, receipts, FileAnchorStore,
# consistency) importable and unit-testable without the Postgres stack installed (roadmap's
# "pure logic vs infra binding" rule).

GENESIS = "GENESIS"  # matches audit.GENESIS — an empty chain anchors the genesis head


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(payload: Any) -> bytes:
    """Deterministic canonical serialization: sorted keys, no insignificant whitespace, UTF-8.

    Provided for new anchoring receipts (and future chain entries). Stable across processes so two
    independent verifiers compute the same bytes for the same logical payload.
    """
    if isinstance(payload, (bytes, bytearray)):
        return bytes(payload)
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def receipt_hash(receipt: dict) -> str:
    """Content hash binding an anchor receipt to its witnessed head (tamper-evidence on the receipt)."""
    body = {k: receipt[k] for k in ("anchor_id", "store", "chain_head", "seq", "anchored_at")}
    return hashlib.sha256(canonical(body)).hexdigest()


@runtime_checkable
class AnchorStore(Protocol):
    """An append-only external witness for chain heads. Implementations MUST be append-only and
    outside the audit DB's trust domain (a different store / account / immutability policy)."""

    def submit(self, chain_head: str, *, seq: Optional[int]) -> dict:
        """Witness `chain_head`; return an immutable receipt (must include a `receipt_hash`)."""
        ...

    def heads(self) -> list[dict]:
        """All witnessed receipts in submission order (for consistency checks)."""
        ...


class FileAnchorStore:
    """Reference external store: an append-only JSONL file. A real deployment swaps this for an
    object store with object-lock / WORM or a transparency log — same contract. Append-only +
    fsync; never rewrites prior lines."""

    def __init__(self, path: Optional[str] = None):
        self.path = path or os.environ.get("AUTOSENTINX_ANCHOR_FILE", "audit-anchors.jsonl")
        self.name = f"file:{os.path.basename(self.path)}"
        self._lock = threading.Lock()

    def submit(self, chain_head: str, *, seq: Optional[int]) -> dict:
        with self._lock:
            index = sum(1 for _ in open(self.path, encoding="utf-8")) if os.path.exists(self.path) else 0
            receipt = {
                "anchor_id": f"anchor-{index:08d}",
                "store": self.name,
                "chain_head": chain_head,
                "seq": seq,
                "anchored_at": _now_iso(),
            }
            receipt["receipt_hash"] = receipt_hash(receipt)
            with open(self.path, "a", encoding="utf-8") as f:
                f.write(json.dumps(receipt, sort_keys=True) + "\n")
                f.flush()
                os.fsync(f.fileno())
            return dict(receipt)

    def heads(self) -> list[dict]:
        if not os.path.exists(self.path):
            return []
        with open(self.path, encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]


_default_store: AnchorStore = FileAnchorStore()


def set_default_store(store: AnchorStore) -> None:
    """Swap the external store (e.g. an object-lock / transparency-log impl) process-wide."""
    global _default_store
    _default_store = store


async def current_head() -> tuple[str, Optional[int]]:
    """The audit chain's current head hash + its row id (GENESIS, None when empty)."""
    from sqlmodel import select                       # lazy: DB stack only needed here

    from .db import SessionLocal
    from .models import AuditEvent

    async with SessionLocal() as s:
        last = (await s.execute(select(AuditEvent).order_by(AuditEvent.id.desc()).limit(1))).scalars().first()
    return (last.entry_hash, last.id) if last else (GENESIS, None)


async def anchor_head(store: Optional[AnchorStore] = None) -> dict:
    """Witness the current chain head to the external store; return the immutable receipt.

    Call periodically (e.g. at campaign end / on a timer). Cheap and side-effect-free w.r.t. the
    chain — it only reads the head and appends to the external witness.
    """
    head, seq = await current_head()
    return (store or _default_store).submit(head, seq=seq)


def check_consistency(store: Optional[AnchorStore] = None) -> dict:
    """Verify the witness log itself is self-consistent and monotonic.

    - every receipt's `receipt_hash` recomputes (no witnessed receipt was altered), and
    - heads only ever advance from the genesis-or-prior witnessed line (no rewritten history).
    A real rollback/fork check also re-reads the live chain and confirms its current head extends
    the last witnessed head; that cross-check belongs at the gateway/SHIP layer where both are in hand.
    """
    receipts = (store or _default_store).heads()
    for r in receipts:
        if r.get("receipt_hash") != receipt_hash(r):
            return {"ok": False, "reason": "altered anchor receipt", "anchor_id": r.get("anchor_id")}
    return {"ok": True, "witnessed": len(receipts),
            "latest_head": receipts[-1]["chain_head"] if receipts else GENESIS}
