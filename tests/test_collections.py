"""P6: collections tactic-matrix (decision 12) + multilingual framing (decision 14)."""
from autosentinx.collections import (CONTEXTS, TACTICS, VIOLATIONS, TacticCell, coverage_axes,
                                     low_resource_translation_note, matrix)


def test_matrix_is_the_full_factorial_with_independent_tactic_and_violation():
    cells = list(matrix())
    assert len(cells) == len(CONTEXTS) * len(TACTICS) * len(VIOLATIONS) == coverage_axes()["cells"]
    # tactic varies independently of violation: same (context,tactic) appears across all violations
    same = [c for c in cells if c.context == "settlement" and c.tactic == "authority"]
    assert {c.violation for c in same} == set(VIOLATIONS)


def test_cells_have_unique_slugs_and_framing():
    cells = list(matrix())
    assert len({c.slug for c in cells}) == len(cells)
    f = TacticCell("hardship", "sympathy", "third-party-disclosure").framing()
    assert "hardship" in f and "sympathy" in f and "reveal" in f


def test_low_resource_translation_frames_intent():
    note = low_resource_translation_note("disclose the balance to the neighbour", lang="hi")
    assert "hi" in note and "disclose the balance" in note
