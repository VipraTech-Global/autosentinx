"""Console view-model transform: D8 split, single-pillar, filtering, fairness grouping, bypass."""
import json
from datetime import datetime
from types import SimpleNamespace

from autosentinx.catalog import Catalog, CrosswalkEdge, ObjectiveSpec
from autosentinx.console import ConsoleView

_NOW = datetime(2026, 6, 12, 12, 0, 0)


def _spec(slug, pillar, severity, frameworks):
    xs = [CrosswalkEdge(framework=f, control_id="C1", relation="equal", strength=8,
                        rationale="r", control_title="Ctl") for f in frameworks]
    return ObjectiveSpec(slug=slug, title=slug, mode="X", family="f", primary_pillar=pillar,
                         severity=severity, status="active", testability="drive", goal="g",
                         success_definition="s", crosswalk=xs)


def _catalog():
    return Catalog({
        # dual-pillar: DPDP (compliance) + OWASP-LLM (security) -> D8 split
        "data.leak": _spec("data.leak", "compliance", "critical", ["DPDP", "OWASP-LLM", "RBI-FPC"]),
        # single-pillar compliance
        "coerce.threat": _spec("coerce.threat", "compliance", "high", ["RBI-FPC"]),
        "fair.x": _spec("fair.x", "compliance", "high", ["RBI-FPC", "NIST-AI-RMF"]),
    })


def _att(**kw):
    base = dict(id=1, objective_id="x", objective_slug="data.leak", mode="DATA_BREACH", outcome="defended",
                verdict_score=0.0, judge_votes="[]", detector_hits="[]", num_turns=2, rule="rule",
                created_at=_NOW, technique_slug="actor-attack", persona_slug="savvy-evader")
    base.update(kw)
    return SimpleNamespace(**base)


def _turn(idx, atk, tgt, label="", clean=None):
    return SimpleNamespace(idx=idx, attacker_line=atk, target_reply=tgt, label=label, compliance_clean=clean)


def _run():
    return SimpleNamespace(id="R1", target_url="http://t", status="completed", created_at=_NOW,
                           approved_at=_NOW, approved_by="akhil@x.com", num_attempts=4, num_succeeded=1, note="n")


def _view():
    return ConsoleView(_catalog())


def test_d8_split_into_two_linked_observations():
    att = _att(outcome="succeeded", judge_votes=json.dumps(
        [{"committed": True, "specificity": 1.0, "reason": "leaked"},
         {"committed": True, "specificity": 0.9, "reason": "leaked"},
         {"committed": False, "specificity": 0.0, "reason": ""}]),
        detector_hits=json.dumps([{"turn": 0, "group": "DATA_BREACH", "detector": "aadhaar", "match": "1234 5678 9012"}]))
    turns = [_turn(0, "mera aadhaar?", "1234 5678 9012", label="Succeed", clean=True)]
    out = _view().run_full(_run(), [{"attempt": att, "turns": turns}])
    obs = out["observations"]
    assert len(obs) == 2
    mods = {o["module"] for o in obs}
    assert mods == {"security", "compliance"}
    sec = next(o for o in obs if o["module"] == "security")
    com = next(o for o in obs if o["module"] == "compliance")
    assert sec["incidentId"] == com["incidentId"] and sec["pairedId"] == com["id"] and com["pairedId"] == sec["id"]
    assert {e["framework"] for e in sec["crosswalk"]} <= {"OWASP-LLM", "OWASP-AGENTIC", "MITRE-ATLAS", "NIST-AI-RMF"}
    assert {e["framework"] for e in com["crosswalk"]} <= {"RBI-FPC", "DPDP", "TRAI"}
    assert sec["bypass"] is True and sec["oracle"] == "panel"
    assert len(sec["judgeVotes"]) == 3 and sec["detectorHits"][0]["category"] == "PII: Aadhaar number"


def test_single_pillar_one_observation():
    att = _att(objective_slug="coerce.threat", mode="COERCION", outcome="defended")
    out = _view().run_full(_run(), [{"attempt": att, "turns": [_turn(0, "a", "b")]}])
    assert len(out["observations"]) == 1 and out["observations"][0]["module"] == "compliance"


def test_sample_error_blocked_excluded():
    rows = [{"attempt": _att(outcome=o), "turns": []} for o in ("sample", "error", "blocked")]
    assert _view().run_full(_run(), rows)["observations"] == []


def test_fairness_grouped_into_one_observation():
    summary = _att(id=9, objective_slug="fair.x", mode="FAIRNESS_VIOLATION", objective_id="fairness/gender-0",
                   outcome="succeeded", verdict_score=0.4,
                   judge_votes=json.dumps([{"varied_attribute": "gender", "worse_group": "B", "gap": 0.4,
                                            "reason": "harsher to male"}]), num_turns=0)
    a = _att(id=10, mode="FAIRNESS_VIOLATION", objective_id="fairness/gender-0/A", outcome="sample",
             persona_slug="fair-female-north")
    b = _att(id=11, mode="FAIRNESS_VIOLATION", objective_id="fairness/gender-0/B", outcome="sample",
             persona_slug="fair-male-north")
    rows = [{"attempt": summary, "turns": []},
            {"attempt": a, "turns": [_turn(0, "namaste", "ji boliye")]},
            {"attempt": b, "turns": [_turn(0, "namaste", "haan?")]}]
    obs = _view().run_full(_run(), rows)["observations"]
    assert len(obs) == 1
    o = obs[0]
    assert o["oracle"] == "fairness" and o["fairness"] is not None
    assert len(o["fairness"]["personas"]) == 2 and "gap" in o["fairness"]["stat"]
