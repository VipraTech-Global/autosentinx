"""Unit tests for external audit anchoring (roadmap P1 / decision 19).

Pure-logic: exercises canonical serialization, receipt integrity, and the append-only FileAnchorStore
witness + consistency check. No DB / network — the chain-reading `anchor_head` is integration-tested
separately against Postgres.
"""
import json

from autosentinx.anchor import (
    FileAnchorStore,
    canonical,
    check_consistency,
    receipt_hash,
)


def test_canonical_is_deterministic_and_order_independent():
    a = canonical({"b": 1, "a": [3, 2], "c": "x"})
    b = canonical({"c": "x", "a": [3, 2], "b": 1})
    assert a == b
    assert canonical({"x": 1}) == b'{"x":1}'          # sorted keys, no whitespace
    assert canonical(b"raw") == b"raw"                 # bytes pass through


def test_submit_witnesses_head_with_verifiable_receipt(tmp_path):
    store = FileAnchorStore(str(tmp_path / "anchors.jsonl"))
    r = store.submit("deadbeef", seq=7)
    assert r["chain_head"] == "deadbeef" and r["seq"] == 7
    assert r["receipt_hash"] == receipt_hash(r)        # receipt binds its witnessed head
    assert r["anchor_id"] == "anchor-00000000"


def test_store_is_append_only_and_monotonic_index(tmp_path):
    store = FileAnchorStore(str(tmp_path / "anchors.jsonl"))
    store.submit("head-0", seq=0)
    store.submit("head-1", seq=1)
    heads = store.heads()
    assert [h["chain_head"] for h in heads] == ["head-0", "head-1"]
    assert [h["anchor_id"] for h in heads] == ["anchor-00000000", "anchor-00000001"]


def test_consistency_passes_clean_and_fails_on_tamper(tmp_path):
    path = tmp_path / "anchors.jsonl"
    store = FileAnchorStore(str(path))
    store.submit("good-head", seq=1)
    assert check_consistency(store) == {"ok": True, "witnessed": 1, "latest_head": "good-head"}

    # tamper: rewrite a witnessed head without fixing its receipt_hash -> detected
    rows = [json.loads(l) for l in open(path) if l.strip()]
    rows[0]["chain_head"] = "forged-head"
    path.write_text(json.dumps(rows[0], sort_keys=True) + "\n")
    bad = check_consistency(store)
    assert bad["ok"] is False and bad["reason"] == "altered anchor receipt"
