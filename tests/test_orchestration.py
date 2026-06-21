"""P8: durable-orchestration primitives — idempotent resume + leases."""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from autosentinx.orchestration import Lease, acquire, completed_labels, remaining_runspecs


def _att(label, outcome): return SimpleNamespace(objective_id=label, outcome=outcome)
def _rs(label): return SimpleNamespace(label=label)


def test_resume_skips_completed_runspecs():
    runspecs = [_rs("a"), _rs("b"), _rs("c")]
    attempts = [_att("a", "succeeded"), _att("b", "error"), _att("c", "defended")]
    # a + c are done (non-error), b errored → only a, b? no: a,c done → remaining = b
    rem = [rs.label for rs in remaining_runspecs(runspecs, attempts)]
    assert rem == ["b"]
    assert completed_labels(attempts) == {"a", "c"}


def test_lease_validity_and_reclaim():
    now = datetime.now(timezone.utc)
    l = Lease("r1", "w1", now + timedelta(seconds=60))
    assert l.valid(now=now)
    assert not l.reclaimable_by("w2", now=now)                  # still valid → w2 can't take it
    past = now + timedelta(seconds=61)
    assert not l.valid(now=past) and l.reclaimable_by("w2", now=past)   # expired → reclaimable


def test_acquire_blocks_active_holder_but_grants_after_expiry():
    now = datetime.now(timezone.utc)
    held = Lease("r1", "w1", now + timedelta(seconds=60))
    assert acquire("r1", "w2", held, now=now) is None           # w1 active → w2 denied
    assert acquire("r1", "w1", held, now=now) is not None       # holder renews
    expired = Lease("r1", "w1", now - timedelta(seconds=1))
    got = acquire("r1", "w2", expired, now=now)
    assert got is not None and got.owner == "w2"                # expired → w2 takes over
