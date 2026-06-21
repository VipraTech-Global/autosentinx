"""DSL transform-providers + GPTFuzz mutation lane (roadmap P5, decisions 11 & 14).

Wires the composable DSL (`dsl.py`) into the attacker behind the provider seam: a DslProvider drives
turns with the native ComposableAttacker, then applies a fixed DSL recipe (e.g. phonetic perturbation,
Hinglish code-switch/sandwich) to each generated line — so the transform is a selectable provider the
single UCB scheduler can pick, and the firing chain is recorded as the suppressible recipe (P9).

GPTFuzz lane: a distinct provider that evolutionarily MUTATES each native line by composing a
deterministic-per-turn chain of primitives — discovering novel variants beyond hand-composed recipes,
without Math.random (varied by turn index so runs are reproducible).
"""
from __future__ import annotations

from ..dsl import Recipe, acronym, code_switch, phonetic_perturb, persona_wrap
from .provider import register


class DslProvider:
    """Native attacker + a DSL recipe applied to every emitted line. Conforms to the provider seam."""

    def __init__(self, llm, recipe: Recipe, *, label: str = "dsl") -> None:
        from .composable import ComposableAttacker
        self.native = ComposableAttacker(llm)
        self.recipe = recipe
        self.label = label
        self.last_chain: list = []                    # firing chain of the most recent transform (P9 recipe)

    async def open(self, *a, **k) -> str:
        return self._apply(await self.native.open(*a, **k))

    async def next_turn(self, *a, **k) -> str:
        return self._apply(await self.native.next_turn(*a, **k))

    def update_belief(self, *a, **k):
        return self.native.update_belief(*a, **k)

    def _apply(self, line: str) -> str:
        out, self.last_chain = self.recipe.apply(line)
        return out


# --- deterministic GPTFuzz-style mutation lane -------------------------------

_MUTATORS = (lambda: phonetic_perturb(),
             lambda: code_switch(),
             lambda: persona_wrap("a senior bank officer"),
             lambda: acronym({"account": "a/c", "number": "no."}))


def _fuzz_recipe(turn_idx: int) -> Recipe:
    """A reproducible mutation chain that varies by turn (AFL-style evolution without Math.random)."""
    r = Recipe()
    n = (turn_idx % 3) + 1                              # 1..3 stacked mutators, rotating by turn
    for i in range(n):
        r = r.then(_MUTATORS[(turn_idx + i) % len(_MUTATORS)]())
    return r


class GptFuzzProvider:
    """Mutates each native line via an evolving primitive chain (decision 11 mutation lane)."""

    def __init__(self, llm) -> None:
        from .composable import ComposableAttacker
        self.native = ComposableAttacker(llm)
        self._i = 0
        self.last_chain: list = []

    async def open(self, *a, **k) -> str:
        return self._mutate(await self.native.open(*a, **k))

    async def next_turn(self, *a, **k) -> str:
        return self._mutate(await self.native.next_turn(*a, **k))

    def update_belief(self, *a, **k):
        return self.native.update_belief(*a, **k)

    def _mutate(self, line: str) -> str:
        out, self.last_chain = _fuzz_recipe(self._i).apply(line)
        self._i += 1
        return out


# register DSL transform-providers behind the seam (decision 14: phonetic is first-class for voice)
register("dsl-phonetic", lambda llm: DslProvider(llm, Recipe().then(phonetic_perturb()), label="dsl-phonetic"))
register("dsl-codeswitch", lambda llm: DslProvider(llm, Recipe().then(code_switch()), label="dsl-codeswitch"))
register("dsl-sandwich", lambda llm: DslProvider(
    llm, Recipe().then(code_switch()).then(phonetic_perturb()), label="dsl-sandwich"))
register("gptfuzz", lambda llm: GptFuzzProvider(llm))
