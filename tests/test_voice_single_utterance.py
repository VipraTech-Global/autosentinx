"""Voice fidelity: the PAP/TAP lanes must not corrupt the single-spoken-line property.

The native attacker's preamble already enforces "ONLY your next spoken line — no narration/stage
directions". These tests guard that the lanes return the model's line VERBATIM — they steer the prompt
(PAP) or pick among candidates (TAP) but never wrap/decorate the output, which would break TTS on the
voice channel.
"""
import asyncio
from types import SimpleNamespace

from autosentinx.attacker.pap_provider import PapProvider
from autosentinx.attacker.tap_provider import TapProvider
from autosentinx.library import TechPhase, TechniqueSpec


class _VerbatimLLM:
    def __init__(self, line):
        self.line = line

    async def generate(self, prompt, *, system=None, temperature=0.8, model=None):
        if system and "attack-search heuristic" in system:
            return '{"on_topic": true, "advance": 0.5}'
        return self.line


class _Belief:
    def __init__(self):
        self.phase_idx, self.notes, self.turns_in_phase = 0, [], 0

    def summary(self):
        return "mid-call"


def _objs():
    tech = TechniqueSpec(slug="crescendo", title="Crescendo", strategy="escalate",
                         phase_plan=[TechPhase(name="probe", intent="rapport")])
    return (SimpleNamespace(goal="extract the account number"),
            tech, SimpleNamespace(description="a borrower"),
            SimpleNamespace(as_notes=lambda: []), _Belief())


_CLEAN = "Sir ji account number jaldi confirm kar dijiye please"


def test_pap_returns_line_verbatim():
    spec, tech, persona, recon, belief = _objs()
    out = asyncio.run(PapProvider(_VerbatimLLM(_CLEAN), "authority").open(
        spec, tech, persona, recon, belief, "Asha", "Namaste"))
    assert out == _CLEAN                              # no narration/quotes/prefix added by the lane


def test_tap_returns_chosen_line_verbatim():
    spec, tech, persona, recon, belief = _objs()
    out = asyncio.run(TapProvider(_VerbatimLLM(_CLEAN), branching=3, max_llm_calls=999).next_turn(
        spec, tech, persona, recon, belief, "Asha", "Haan?"))
    assert out == _CLEAN                              # the selected candidate is returned unwrapped
