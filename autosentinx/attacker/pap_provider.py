"""PAP persuasion providers behind the attack seam (live lane; offline harvest is separate/deferred).

A `PapProvider` wraps the native ComposableAttacker and steers GENERATION with a persuasion technique:
it clones the incoming TechniqueSpec with the technique's directive appended to `strategy`, so the
persuasion frame flows through `composable._system_prompt` into the model that writes the line. This is
generation-time steering, NOT a post-hoc rewrite — the violation goal stays in the system prompt by
construction, so the line is on-topic without an extra validation call (resolves Codex review I3).

The technique name is recorded on `last_chain` (the firing recipe the runner persists to Turn.recipe and
P9 abstracts to the "persuasion" category). One provider is registered per curated technique as `pap-<key>`
so the discounted-UCB selector can learn which persuasion lever a given agent is weak to.
"""
from __future__ import annotations

import hashlib

from ..persuasion import PERSUASION, directive
from .provider import register


def _hash(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:8]


class PapProvider:
    """Native attacker steered by one PAP persuasion technique. Conforms to the provider seam."""

    def __init__(self, llm, technique_key: str) -> None:
        from .composable import ComposableAttacker
        self.native = ComposableAttacker(llm)
        self.technique_key = technique_key
        self.directive = directive(technique_key)
        self.label = f"pap-{technique_key}"
        self.last_chain: list = []

    def _steer(self, technique):
        """Clone the technique with the persuasion directive appended to its strategy (generation-time
        steering). model_copy keeps the original technique untouched (TechniqueSpec is a pydantic model)."""
        if not self.directive:
            return technique
        frame = f"\n\nPERSUASION FRAME ({self.technique_key}): {self.directive}"
        return technique.model_copy(update={"strategy": (technique.strategy or "") + frame})

    def _record(self) -> None:
        self.last_chain = [{"persuasion": self.technique_key, "directive_hash": _hash(self.directive)}]

    async def open(self, spec, technique, persona, recon, belief, contact_name,
                   opening_text, csrt: bool = False) -> str:
        line = await self.native.open(spec, self._steer(technique), persona, recon, belief,
                                      contact_name, opening_text, csrt)
        self._record()
        return line

    async def next_turn(self, spec, technique, persona, recon, belief, contact_name,
                        last_reply, csrt: bool = False) -> str:
        line = await self.native.next_turn(spec, self._steer(technique), persona, recon, belief,
                                           contact_name, last_reply, csrt)
        self._record()
        return line

    def update_belief(self, belief, label, reply, technique) -> None:
        # belief/phase advance is technique-shape driven, not persuasion driven — use the base technique
        return self.native.update_belief(belief, label, reply, technique)


# register one provider per curated persuasion technique (mirrors dsl_provider's one-liners)
for _key in PERSUASION:
    register(f"pap-{_key}", (lambda k: lambda llm: PapProvider(llm, k))(_key))
