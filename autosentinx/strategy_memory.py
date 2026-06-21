"""Hybrid strategy memory (roadmap P6, decision 10 opt-7).

Two memory layers, scheduler-owned:
- a **global lifelong library** — strategies (technique × mode) that work across targets, growing
  monotonically over the fleet; and
- **per-target buffers** — what works against THIS specific agent, for context-aware reuse.

A **promotion rule** moves a strategy from a per-target buffer into the global library once it has
succeeded on >= PROMOTE_AFTER distinct targets (so one lucky hit doesn't pollute the global library;
judge-rejected attempts never get recorded). Memory is advisory recall for the UCB scheduler — it
never lets a provider bypass RoE/budget/audit, and recording emits an auditable event.

Pure logic + a stable serialization, so it persists as JSON in the run ledger / a small table without
new query paths, and unit-tests with no DB.
"""
from __future__ import annotations

from dataclasses import dataclass, field

PROMOTE_AFTER = 2          # distinct targets a strategy must succeed on before going global


def strategy_key(technique_slug: str, mode: str) -> str:
    return f"{technique_slug}@{mode}"


@dataclass
class StrategyMemory:
    # global: strategy_key -> {"technique","mode","targets": set(target_ids), "wins": int}
    global_library: dict = field(default_factory=dict)
    # per target: target_id -> {strategy_key -> wins}
    per_target: dict = field(default_factory=dict)

    def record(self, target_id: str, technique_slug: str, mode: str, *, succeeded: bool) -> dict:
        """Record a CONFIRMED success (succeeded must be the authoritative oracle verdict, not a
        provider signal). Returns an audit-able event describing what changed (incl. any promotion)."""
        if not succeeded:
            return {"event": "strategy.miss", "target": target_id,
                    "strategy": strategy_key(technique_slug, mode), "promoted": False}
        key = strategy_key(technique_slug, mode)
        buf = self.per_target.setdefault(target_id, {})
        buf[key] = buf.get(key, 0) + 1
        promoted = self._maybe_promote(key, technique_slug, mode, target_id)
        return {"event": "strategy.win", "target": target_id, "strategy": key,
                "target_wins": buf[key], "promoted": promoted}

    def _maybe_promote(self, key: str, technique_slug: str, mode: str, target_id: str) -> bool:
        # derive promotion from the per-target buffers (the source of truth): a strategy goes global
        # once it has won on >= PROMOTE_AFTER DISTINCT targets. Idempotent + accumulation-safe.
        targets = [tid for tid, buf in self.per_target.items() if key in buf]
        if len(set(targets)) < PROMOTE_AFTER:
            return False
        first_time = key not in self.global_library
        self.global_library[key] = {
            "technique": technique_slug, "mode": mode, "targets": set(targets),
            "wins": sum(self.per_target[t][key] for t in targets),
        }
        return first_time

    def recall(self, target_id: str, *, top: int = 5) -> list[str]:
        """Strategies to bias the scheduler toward for this target: its own proven ones first, then the
        global library. Advisory only — the UCB selector still owns the next-technique decision."""
        local = sorted(self.per_target.get(target_id, {}).items(), key=lambda kv: -kv[1])
        ordered = [k for k, _ in local] + [k for k in self.global_library if k not in dict(local)]
        return ordered[:top]

    # --- stable (de)serialization for persistence (JSON-safe; sets -> sorted lists) ---
    def to_json(self) -> dict:
        return {"global": {k: {**v, "targets": sorted(v["targets"])} for k, v in self.global_library.items()},
                "per_target": self.per_target}

    @classmethod
    def from_json(cls, d: dict) -> "StrategyMemory":
        g = {k: {**v, "targets": set(v.get("targets", []))} for k, v in (d.get("global") or {}).items()}
        return cls(global_library=g, per_target=d.get("per_target") or {})
