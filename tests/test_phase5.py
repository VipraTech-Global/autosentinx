"""Phase 5 — selection (Discounted-UCB) + coverage (MAP-Elites) logic (offline, no DB)."""
from types import SimpleNamespace

from autosentinx.coverage import DECLARED_CELLS, build_archive, cell_of
from autosentinx.selection import _Arm, Selector
from autosentinx.spine import Mode


# ---- selection ----

def test_selector_prefers_higher_value_arm():
    arms = {("o", "good"): _Arm(n=5, s=4.5, raw_count=5, raw_succ=5),   # value 0.9
            ("o", "bad"): _Arm(n=5, s=0.5, raw_count=5, raw_succ=0)}    # value 0.1
    sel = Selector(arms, mode_priors={})
    assert sel.select("o", "DATA_BREACH", ["good", "bad"]) == "good"


def test_selector_tries_cold_arms_before_warm():
    # a warm, high-value arm vs a cold (no-data) arm → cold must be explored first
    arms = {("o", "warm"): _Arm(n=10, s=10, raw_count=10, raw_succ=10)}  # value 1.0
    sel = Selector(arms, mode_priors={})
    assert sel.select("o", "DATA_BREACH", ["warm", "cold"]) == "cold"


def test_selector_cold_ordered_by_mode_prior():
    sel = Selector(arms={}, mode_priors={("COERCION", "a"): 0.2, ("COERCION", "b"): 0.8})
    assert sel.select("o", "COERCION", ["a", "b"]) == "b"   # higher mode prior wins among cold arms


# ---- coverage ----

def _att(mode, tech, persona, turns, score, outcome="succeeded"):
    return SimpleNamespace(mode=mode, technique_slug=tech, persona_slug=persona, objective_slug="obj",
                           num_turns=turns, verdict_score=score, outcome=outcome)


def test_cell_mapping_and_skips():
    c = cell_of(_att(Mode.DATA_BREACH.value, "actor-attack", "confused-elder", 7, 1.0))
    assert c == ("Data & Privacy", "decomposition", "soft", "deep")
    assert cell_of(_att(Mode.COERCION.value, "x", "y", 0, 0.0, outcome="error")) is None  # errored → no cell
    assert cell_of(_att(Mode.COERCION.value, "x", "y", 3, 0.0, outcome="blocked")) is None


def test_build_archive_metrics_and_gaps():
    atts = [
        _att(Mode.DISCLOSURE_FAIL.value, "direct-probe", "distressed-borrower", 1, 1.0),
        _att(Mode.DISCLOSURE_FAIL.value, "direct-probe", "distressed-borrower", 2, 0.5),  # same cell → elite keeps best
        _att(Mode.COERCION.value, "crescendo", "aggressive-defiant", 8, 0.3),
        _att(Mode.DATA_BREACH.value, "x", "y", 0, 0.0, outcome="error"),                  # ignored
    ]
    a = build_archive(atts)
    assert a["declared_cells"] == DECLARED_CELLS == 225
    assert a["filled_cells"] == 2                       # two distinct cells (the dup collapses)
    assert a["qd_score"] == 1.3                         # 1.0 (best of the dup) + 0.3
    tested = {(g["family"], g["tactic"]) for g in a["gap_register"]}
    assert ("Process & Transparency", "direct") not in tested   # tested → not a gap
    assert ("Truthfulness & Action", "injection") in tested     # never tested → a gap
