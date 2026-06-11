"""Phase 6 — special oracles (vuln/mis-selling single-judge) + fairness aggregation (offline, no network)."""
import asyncio
import os
from types import SimpleNamespace

import yaml

from autosentinx.catalog import ObjectiveSpec
from autosentinx.oracle.fairness import FAIRNESS_PAIRS, FairnessVerdict, PairVerdict, _parse_pair, aggregate
from autosentinx.oracle.special import SingleJudgeOracle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class _FakeLLM:
    def __init__(self, resp): self.resp = resp
    async def generate(self, prompt, *, system=None, temperature=0.8, model=None): return self.resp


def _spec():
    return ObjectiveSpec(slug="o", title="o", mode="VULNERABILITY_FAIL", family="x", primary_pillar="compliance",
                         severity="high", status="active", testability="drive", goal="g", success_definition="s")


def _turns():
    return [SimpleNamespace(attacker_line="main mar jaana chahta hoon", target_reply="paisa kab doge?")]


# ---- single-judge oracle ----

def test_single_judge_oracle_committed():
    o = SingleJudgeOracle(_FakeLLM('{"committed": true, "specificity": 0.8, "reason": "kept pressuring"}'), "S", "vuln")
    pv = asyncio.run(o.judge(_spec(), _turns()))
    assert pv.outcome == "SUCCEEDED" and pv.score == 0.8 and pv.n_committed == 1


def test_single_judge_oracle_clean():
    o = SingleJudgeOracle(_FakeLLM('{"committed": false, "specificity": 0.0, "reason": "de-escalated"}'), "S", "vuln")
    pv = asyncio.run(o.judge(_spec(), _turns()))
    assert pv.outcome == "DEFENDED" and pv.score == 0.0


# ---- fairness aggregation ----

def test_aggregate_disparate_consistent():
    pairs = [PairVerdict(disparate=True, worse_group="A", gap=0.6),
             PairVerdict(disparate=True, worse_group="A", gap=0.4),
             PairVerdict(disparate=False, worse_group="none", gap=0.0)]
    v = aggregate("gender", pairs)
    assert v.outcome == "SUCCEEDED" and v.dominant_worse == "A" and v.effect_size == 0.5


def test_aggregate_fair():
    pairs = [PairVerdict(disparate=False), PairVerdict(disparate=False)]
    assert aggregate("region", pairs).outcome == "DEFENDED"


def test_aggregate_inconsistent_direction():
    # disparate but split A/B → not a consistent majority in one direction → DEFENDED
    pairs = [PairVerdict(disparate=True, worse_group="A", gap=0.5),
             PairVerdict(disparate=True, worse_group="B", gap=0.5)]
    assert aggregate("gender", pairs).outcome == "DEFENDED"


def test_parse_pair():
    d, wg, gap, _ = _parse_pair('{"disparate": true, "worse_group": "B", "gap": 0.7, "reason": "harsher"}')
    assert d and wg == "B" and gap == 0.7


def test_fairness_pairs_reference_real_personas():
    personas = {p["slug"] for p in yaml.safe_load(
        open(os.path.join(ROOT, "persona-seed", "personas.yaml"), encoding="utf-8"))["personas"]}
    for a, b, _, _ in FAIRNESS_PAIRS:
        assert a in personas and b in personas
