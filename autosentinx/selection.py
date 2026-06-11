"""Discounted-UCB technique selector (Phase 5 H1).

Per-objective bandit over its applicable techniques; reward = the panel's continuous verdict_score.
γ-discounted stats (decay stale wins so a patched-out technique gets re-explored). Cold arms are
warm-started by a mode-level prior (mean value of that technique across other objectives in the same
mode) so thin per-objective budgets still order sensibly. Stats persist in `technique_stat` across
campaigns. UCB (not ε-greedy/Thompson) — coverage-preserving, the regulator-facing choice (ADR 0012).
"""
from __future__ import annotations

import math
from typing import Optional

from sqlmodel import select as sql_select

from .catalog import Catalog
from .db import SessionLocal
from .models import TechniqueStat

GAMMA = 0.95         # discount factor (recent observations weigh more)
C = 0.7              # exploration constant
COLD_BASE = 10.0     # cold arms (no data) sort above any exploited arm; ordered among themselves by prior
DEFAULT_PRIOR = 0.5


class _Arm:
    __slots__ = ("n", "s", "raw_count", "raw_succ")

    def __init__(self, n=0.0, s=0.0, raw_count=0, raw_succ=0):
        self.n, self.s, self.raw_count, self.raw_succ = n, s, raw_count, raw_succ

    @property
    def value(self) -> float:
        return self.s / self.n if self.n > 0 else 0.0


class Selector:
    def __init__(self, arms: dict[tuple[str, str], _Arm], mode_priors: dict[tuple[str, str], float]) -> None:
        self._arms = arms                  # (objective_slug, technique_slug) -> _Arm
        self._mode_priors = mode_priors    # (mode, technique_slug) -> prior value

    @classmethod
    async def load(cls, catalog: Catalog) -> "Selector":
        async with SessionLocal() as s:
            rows = list((await s.execute(sql_select(TechniqueStat))).scalars().all())
        arms: dict[tuple[str, str], _Arm] = {}
        # mode prior = mean discounted value of (technique) across objectives sharing the objective's mode
        prior_acc: dict[tuple[str, str], list[float]] = {}
        for r in rows:
            arms[(r.objective_slug, r.technique_slug)] = _Arm(r.n_disc, r.s_disc, r.raw_count, r.raw_successes)
            spec = catalog.get(r.objective_slug)
            if spec and r.n_disc > 0:
                prior_acc.setdefault((spec.mode, r.technique_slug), []).append(r.s_disc / r.n_disc)
        mode_priors = {k: sum(v) / len(v) for k, v in prior_acc.items()}
        return cls(arms, mode_priors)

    def _arm(self, objective_slug: str, technique_slug: str) -> _Arm:
        return self._arms.get((objective_slug, technique_slug), _Arm())

    def select(self, objective_slug: str, mode: str, techniques: list[str]) -> Optional[str]:
        """Pick the next technique for this objective by the Discounted-UCB index."""
        if not techniques:
            return None
        total_n = sum(self._arm(objective_slug, t).n for t in techniques)
        best_t, best_idx = None, -1.0
        for t in techniques:
            arm = self._arm(objective_slug, t)
            if arm.n <= 0:  # cold — warm-start by mode prior, but always tried before exploited arms
                idx = COLD_BASE + self._mode_priors.get((mode, t), DEFAULT_PRIOR)
            else:
                bonus = C * math.sqrt(math.log(max(total_n, 2.0)) / arm.n)
                idx = arm.value + bonus
            if idx > best_idx:
                best_idx, best_t = idx, t
        return best_t

    async def observe(self, objective_slug: str, mode: str, technique_slug: str,
                      reward: float, succeeded: bool) -> None:
        """Discount all of this objective's arms one step, then credit the pulled arm; persist."""
        for (o, t), arm in self._arms.items():
            if o == objective_slug:
                arm.n *= GAMMA
                arm.s *= GAMMA
        arm = self._arms.setdefault((objective_slug, technique_slug), _Arm())
        arm.n += 1.0
        arm.s += reward
        arm.raw_count += 1
        arm.raw_succ += 1 if succeeded else 0
        await self._persist(objective_slug)

    async def _persist(self, objective_slug: str) -> None:
        async with SessionLocal() as s:
            existing = {
                r.technique_slug: r for r in (await s.execute(
                    sql_select(TechniqueStat).where(TechniqueStat.objective_slug == objective_slug)
                )).scalars().all()
            }
            for (o, t), arm in self._arms.items():
                if o != objective_slug:
                    continue
                row = existing.get(t)
                if row is None:
                    row = TechniqueStat(objective_slug=o, technique_slug=t)
                row.n_disc, row.s_disc = arm.n, arm.s
                row.raw_count, row.raw_successes = arm.raw_count, arm.raw_succ
                s.add(row)
            await s.commit()

    def stats_table(self) -> list[dict]:
        out = []
        for (o, t), arm in self._arms.items():
            out.append({
                "objective": o, "technique": t,
                "value": round(arm.value, 3), "n_disc": round(arm.n, 3),
                "raw_count": arm.raw_count, "raw_successes": arm.raw_succ,
                "asr": round(arm.raw_succ / arm.raw_count, 3) if arm.raw_count else 0.0,
            })
        return sorted(out, key=lambda x: (-x["value"], x["objective"]))
