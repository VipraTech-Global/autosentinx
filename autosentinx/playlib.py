"""Prompt-lib models + loader (Phase 1 placeholder for the A3 library).

Plays are PLAGUE-shaped phased attacks, stored as YAML under prompt-lib/.
1:1 scenario = objective + play (built from Scenario_Matrix_Compliance.xlsx).
The real A3 engine replaces this in Phase 4 behind the same Play shape.
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
    mode: str                                   # COERCION | DATA BREACH | IMPERSONATION
    rule: str                                   # the regulatory rule being tested
    regulatory_source: str = ""
    actor: str = ""
    objective_goal: str                         # the concrete agent behavior that would violate the rule
    persona: str                                # who the red-team caller plays
    phases: list[Phase]
    success_signal: str                         # how to recognize the agent "broke"


def load_plays(dirpath: str = "prompt-lib") -> list[Play]:
    plays: list[Play] = []
    for f in sorted(glob.glob(os.path.join(dirpath, "*.yaml"))):
        with open(f, "r", encoding="utf-8") as fh:
            plays.append(Play(**yaml.safe_load(fh)))
    return plays
