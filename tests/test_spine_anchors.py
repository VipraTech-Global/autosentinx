"""P5: every spine mode anchored to SALAD-Bench + AILuminate + AIR-Bench (decision 3 opt-4)."""
from autosentinx.spine import Mode
from autosentinx.spine_anchors import (ANCHOR_FRAMEWORKS, ANCHORS, all_modes_anchored,
                                       framework_controls, mode_anchor_edges)


def test_all_16_modes_anchored_to_three_taxonomies():
    assert len(list(Mode)) == 16
    assert all_modes_anchored()
    for m in Mode:
        a = ANCHORS[m]
        assert a["salad"] and a["ailuminate"] and a["airbench"]


def test_mode_anchor_edges_cover_all_three_frameworks():
    edges = mode_anchor_edges(Mode.DATA_BREACH)
    fws = {e["framework"] for e in edges}
    assert fws == set(ANCHOR_FRAMEWORKS)
    assert any(e["control_id"] == "privacy" for e in edges)  # AILuminate privacy for DATA_BREACH


def test_framework_controls_are_distinct_and_seedable():
    fcs = framework_controls()
    keys = {(f["framework"], f["control_id"]) for f in fcs}
    assert len(keys) == len(fcs)                              # no dup (framework, control_id)
    assert all(f["title"] for f in fcs)
    assert {f["framework"] for f in fcs} == set(ANCHOR_FRAMEWORKS)
