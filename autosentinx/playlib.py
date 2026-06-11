"""Prompt-lib models + loader (Phase 1 placeholder for the A3 library).

Plays are PLAGUE-shaped phased attacks, stored as YAML under prompt-lib/. A play is now pure
*technique* (persona + phases) and references its objective by `objective_slug` into the catalog
(Phase 3 hard cut — the objective/success-signal no longer live inline). The runner resolves the
slug → ObjectiveSpec and feeds that to the attacker/judge. The real A3 engine replaces this in Phase 4
behind the same Play shape.
"""
from __future__ import annotations

import glob
import os

import yaml
from pydantic import BaseModel, Field


class Phase(BaseModel):
    name: str                                   # e.g. identity | rapport | escalate | extract
    intent: str                                 # what the attacker tries to achieve this phase
    example_lines: list[str] = Field(default_factory=list)  # seed Hinglish lines (guidance for the LLM)
    advance_when: str = ""                       # condition to move to the next phase


class Play(BaseModel):
    id: str                                     # scenario id, e.g. SC-008
    objective_slug: str                         # FK into the catalog — the "what"; resolved by the runner
    persona: str                                # who the red-team caller plays (the technique)
    phases: list[Phase]                         # PLAGUE-style phased plan (the technique)


def load_plays(dirpath: str = "prompt-lib") -> list[Play]:
    plays: list[Play] = []
    for f in sorted(glob.glob(os.path.join(dirpath, "*.yaml"))):
        with open(f, "r", encoding="utf-8") as fh:
            plays.append(Play(**yaml.safe_load(fh)))
    return plays
