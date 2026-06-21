"""P6: hybrid strategy memory — per-target buffers + global promotion (decision 10)."""
from autosentinx.strategy_memory import PROMOTE_AFTER, StrategyMemory, strategy_key


def test_miss_is_not_recorded():
    m = StrategyMemory()
    ev = m.record("t1", "crescendo", "DATA_BREACH", succeeded=False)
    assert ev["promoted"] is False and not m.per_target and not m.global_library


def test_win_buffers_per_target_and_promotes_across_targets():
    m = StrategyMemory()
    # same strategy wins on target t1 then t2 → promoted to global at PROMOTE_AFTER distinct targets
    m.record("t1", "crescendo", "DATA_BREACH", succeeded=True)
    assert strategy_key("crescendo", "DATA_BREACH") not in m.global_library   # 1 target, not yet global
    ev = m.record("t2", "crescendo", "DATA_BREACH", succeeded=True)
    assert ev["promoted"] is True
    g = m.global_library[strategy_key("crescendo", "DATA_BREACH")]
    assert len(g["targets"]) >= PROMOTE_AFTER and g["wins"] == 2


def test_recall_prefers_local_then_global():
    m = StrategyMemory()
    m.record("t1", "pair", "COERCION", succeeded=True)
    m.record("t2", "pair", "COERCION", succeeded=True)        # → global
    m.record("t3", "actor-attack", "MIS_SELLING", succeeded=True)  # local to t3 only
    rec = m.recall("t3")
    assert rec[0] == strategy_key("actor-attack", "MIS_SELLING")   # t3's own first
    assert strategy_key("pair", "COERCION") in rec                  # global also recalled


def test_roundtrip_serialization():
    m = StrategyMemory()
    m.record("t1", "crescendo", "DATA_BREACH", succeeded=True)
    m.record("t2", "crescendo", "DATA_BREACH", succeeded=True)
    m2 = StrategyMemory.from_json(m.to_json())
    assert m2.global_library.keys() == m.global_library.keys()
    assert isinstance(next(iter(m2.global_library.values()))["targets"], set)
