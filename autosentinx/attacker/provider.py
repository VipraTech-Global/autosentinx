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


def _engine_shell(engine: str, pip_pkg: str):
    """A registered-but-unwired external engine. Resolving it fails clearly (vs a silent KeyError),
    documenting the seam; wiring an adapter means returning an AttackProvider that maps the engine's
    orchestrator onto open/next_turn/update_belief and egresses ONLY through the scheduler+gateway."""
    def factory(llm):
        raise NotImplementedError(
            f"attack provider {engine!r} is registered but not yet wired — `pip install {pip_pkg}` "
            f"and implement its open/next_turn/update_belief adapter (egress via the gateway only)")
    return factory


# external engines decided in decision 1 — registered behind the seam, adapters pending.
for _name, _pkg in (("pyrit", "pyrit"), ("deepteam", "deepteam"),
                    ("garak", "garak"), ("promptfoo", "promptfoo")):
    register(_name, _engine_shell(_name, _pkg))

from . import dsl_provider  # noqa: E402,F401  — registers dsl-phonetic/codeswitch/sandwich + gptfuzz
