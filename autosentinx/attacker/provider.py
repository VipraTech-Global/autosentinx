"""Attack-provider seam (roadmap P6, decisions 1 & 8).

The single stable adapter every attack capability speaks — `open` / `next_turn` / `update_belief`.
The native `ComposableAttacker` is one provider; external engines (PyRIT, deepteam, garak, promptfoo,
TAP/PAIR/Crescendo/GOAT, GPTFuzz) register adapters behind THIS protocol so the one in-house
scheduler (the discounted-UCB selector) can invoke any of them uniformly. No provider owns the
conversation loop, the query budget, or the target egress — those stay with the scheduler + the
audited gateway (keystones from decisions 6 & 17). Verdict authority stays with the oracle.

This module is the seam + registry only; external-engine adapters are added behind it as they land
(each needs its upstream package). Routing a technique to a provider (a `technique.provider` field)
is the follow-on wiring step.
"""
from __future__ import annotations

from typing import Callable, Protocol, runtime_checkable


@runtime_checkable
class AttackProvider(Protocol):
    """The contract a provider must satisfy to drive turns through the scheduler + gateway."""

    async def open(self, spec, technique, persona, recon, belief, contact_name,
                   opening_text, csrt: bool = False) -> str:
        """Produce the opening attacker line for a fresh session."""
        ...

    async def next_turn(self, spec, technique, persona, recon, belief, contact_name,
                        last_reply, csrt: bool = False) -> str:
        """Produce the next attacker line given the target's last reply."""
        ...

    def update_belief(self, belief, label, reply, technique) -> None:
        """Advance the attacker's belief/phase state from the classified reply."""
        ...


# name -> factory(llm) -> AttackProvider
_REGISTRY: dict[str, Callable] = {}


def register(name: str, factory: Callable) -> None:
    """Register a provider factory under `name` (factory takes the attacker LLM, returns a provider)."""
    _REGISTRY[name] = factory


def get_provider(name: str, llm) -> "AttackProvider":
    """Resolve a registered provider by name (the scheduler's single entry point)."""
    if name not in _REGISTRY:
        raise KeyError(f"unknown attack provider {name!r}; registered: {sorted(_REGISTRY)}")
    return _REGISTRY[name](llm)


def providers() -> list[str]:
    return sorted(_REGISTRY)


def _native(llm):
    from .composable import ComposableAttacker          # lazy: avoids import cycle at module load

    return ComposableAttacker(llm)


register("native", _native)
