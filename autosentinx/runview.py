"""RunView projection — the live-duel sibling of ConsoleView (console.py).

A read-time projector over persisted Run + Attempt + Turn rows → the `state.json`-shaped RunView the
Live Views (V2 Arena / V3 Forensic) consume via `sentinx-web/lib/runview.ts::fromStateJson`. NOT a
parallel system: it reuses console.py helpers and the canonical outcome rule in outcome.py; it
REPLACES the throwaway aarav-live/run_stream.py state-builder. Read-path ONLY — it never touches the
keystones AuditedGateway / KillSwitch / anchor (those are write-path egress controls, EP-16).
(ENGINE-PORT-PLAN EP-2..EP-9 / R1, Wave 1 — play-granular; per-turn liveness is Wave 3.)
"""
from __future__ import annotations

import json

from .catalog import Catalog
from .config import get_settings
from .console import (
    _oracle, _detector_hits, _bypass,
    COMPLIANCE_FRAMEWORKS, SECURITY_FRAMEWORKS,
)
from .library import Library
from .outcome import derive_outcome

_INTENSITY = {"low", "med", "high", "xhigh", "max", "ultra"}  # runview.ts IntensityLevel enum
_RUN_STATUS = {"pending_approval": "starting", "running": "running", "completed": "done", "failed": "failed"}
_PLAY_STATUS = {"blocked": "blocked", "error": "error", "unknown": "error"}  # 'unknown' = all judges failed → degraded/not-assessed (CR-P2); else → "done"


def _regulation(spec, frameworks) -> list[dict]:
    """snake_case, pillar-filtered regulation (R1-B1): {framework, control_id, control_title}.
    Deliberately NOT console._crosswalk (that emits camelCase controlId/controlTitle the FE can't read)."""
    edges = spec.crosswalk if spec else []
    if frameworks is not None:
        edges = [e for e in edges if e.framework in frameworks]
    edges = sorted(edges, key=lambda e: -e.strength)[:3]
    return [{"framework": e.framework, "control_id": e.control_id,
             "control_title": e.control_title or e.control_id} for e in edges]


def _votes(raw: str) -> list[dict]:
    """Model-RETAINING vote mapper (R1-minor): keep `provider:model` (console._judge_votes strips it).
    Skips fairness PairVerdict rows (no 'committed')."""
    out = []
    for v in json.loads(raw or "[]"):
        if "committed" not in v:
            continue
        out.append({
            "model": v.get("model", ""), "committed": bool(v.get("committed")),
            "specificity": float(v.get("specificity") or 0.0),
            "reason": str(v.get("reason", "")), "error": str(v.get("error", "")),
        })
    return out


def _build_arc(turns: list[dict]) -> dict:
    """Port of run_stream._update_arc over mapped turn dicts → {arc, beats, pivotTurn}.
    Honest concession/timer beat: the engine advances immediately on a Comply, so a concession-driven
    advance has Comply as the prior phase's LAST label (composable advance rule). Coupled to GALA-lite
    advance semantics — if that rule changes, this inference must change with it (EP-R2)."""
    arc: list[dict] = []
    beats: list[dict] = []
    for t in turns:
        if not arc or arc[-1]["phase"] != t["phase"]:
            if arc:
                prior = arc[-1]
                trig = "conceded" if (prior["labels"] and prior["labels"][-1] == "Comply") else "timer"
                prior["advanceTrigger"] = trig
                beats.append({"fromPhase": prior["phase"], "toPhase": t["phase"], "atTurn": t["idx"],
                              "trigger": "conceded" if trig == "conceded" else "re-angled"})
            arc.append({"phase": t["phase"], "intent": t["intent"], "turnIdxStart": t["idx"],
                        "turnIdxEnd": t["idx"], "reached": True, "advanceTrigger": None, "labels": [t["label"]]})
        else:
            arc[-1]["turnIdxEnd"] = t["idx"]
            arc[-1]["labels"].append(t["label"])
    succ = [t["idx"] for t in turns if t["label"] == "Succeed"]
    comp = [t["idx"] for t in turns if t["label"] == "Comply"]
    return {"arc": arc, "beats": beats, "pivotTurn": succ[-1] if succ else (comp[-1] if comp else None)}


class RunViewProjection:
    def __init__(self, catalog: Catalog, library: Library) -> None:
        self.catalog = catalog
        self.library = library

    def run_runview(self, run, attempts: list[dict], run_roe: dict, live=None) -> dict:
        """`run_roe` = json.loads(run.roe or '{}'). Param named run_roe to disambiguate from the
        keystones autosentinx/roe.py policy module (R1-minor).

        `live` (EP Wave 3 streaming) = the in-memory _LIVE cursor for the in-flight play (runner._LIVE),
        or None. When present on a still-running run, the board pre-loads the full plan as 'queued…' rows
        and streams the one in-flight play as a 'running'/'judging' card."""
        s = get_settings()
        max_turns = int(run_roe.get("max_turns") or s.max_turns)  # MUST be an int even Phase-1 (R1-minor)

        plays: list[dict] = []
        for a in attempts:
            attempt, turns = a["attempt"], a["turns"]
            if attempt.outcome == "sample":  # fairness sample rows only — render error/blocked (R1-minor)
                continue
            spec = self.catalog.get(attempt.objective_slug)
            has_comp = bool(spec and any(e.framework in COMPLIANCE_FRAMEWORKS for e in spec.crosswalk))
            has_sec = bool(spec and any(e.framework in SECURITY_FRAMEWORKS for e in spec.crosswalk))
            if has_comp and has_sec:  # D8 — one play per pillar, linked by incidentId
                inc = f"INC-{attempt.id}"
                plays.append(self._play(attempt, turns, spec, "security", SECURITY_FRAMEWORKS, max_turns, inc))
                plays.append(self._play(attempt, turns, spec, "compliance", COMPLIANCE_FRAMEWORKS, max_turns, inc))
            else:
                pillar = spec.primary_pillar if spec else "compliance"
                plays.append(self._play(attempt, turns, spec, pillar, None, max_turns, None))

        # Streaming placeholders (EP Wave 3). started basis = len(plays) — the projection's OWN play
        # count (fairness 'sample' rows already skipped, dual-duty pairs already split into 2), NOT raw
        # num_attempts. Queued/running rows are emitted ONLY while the run is still live; a finished short
        # run must never show phantom queued rows.
        planned = int(run_roe.get("budget") or 0)
        started = len(plays)
        live_present = bool(live) and run.status == "running"
        if live_present:
            plays.append(self._running_play(live))
            started += 1
        queued_count = max(0, planned - started) if run.status in ("running", "pending_approval") else 0
        for i in range(queued_count):
            plays.append(self._queued_play(i))

        # assign idx, then back-fill pairedIdx for dual-duty pairs (two-pass, EP-R5)
        for i, p in enumerate(plays):
            p["idx"] = i
        by_inc: dict[str, list[int]] = {}
        for p in plays:
            if p.get("incidentId"):
                by_inc.setdefault(p["incidentId"], []).append(p["idx"])
        for idxs in by_inc.values():
            if len(idxs) == 2:
                plays[idxs[0]]["pairedIdx"], plays[idxs[1]]["pairedIdx"] = idxs[1], idxs[0]

        done = sum(1 for p in plays if p["status"] == "done")
        fails = sum(1 for p in plays if (p.get("verdict") or {}).get("productOutcome") == "FAIL")
        risks = sum(1 for p in plays if (p.get("verdict") or {}).get("productOutcome") == "RISK")
        byp = sum(1 for p in plays if (p.get("verdict") or {}).get("bypass"))

        out = {
            "id": run.id, "target": run.target_url,
            "status": _RUN_STATUS.get(run.status, "running"),
            "engine": {
                "attacker": s.llm_attacker_model, "classifier": s.llm_classifier_model,
                "judges": s.llm_judge_models, "maxTurns": max_turns,
            },
            "recon": self._recon(run),
            "summary": {"total": max(int(run_roe.get("budget") or 0), run.num_attempts, len(plays)),
                        "done": done, "fails": fails, "risks": risks, "bypasses": byp},
            "plays": plays,
            "startedAt": (run.approved_at or run.created_at).isoformat(),
        }
        if run_roe.get("intensity") in _INTENSITY:
            out["intensity"] = run_roe["intensity"]
        return out

    def _recon(self, run) -> dict:
        """Real ReconView from the persisted campaign-start scouting profile (EP Wave 4). Honest
        'skipped' when a run predates the recon column or recon was blocked. links[] is intentionally
        omitted — the engine does not derive intel→objective threads (that's a UI/demo concept)."""
        raw = (getattr(run, "recon", "") or "").strip()
        if not raw:
            # No recon persisted yet. Recon is profiled at campaign start and persisted as it lands,
            # so on a still-LIVE run an empty column just means "not scouted yet" → pending, NOT blocked.
            # Only a TERMINAL run that retained no recon is genuinely 'skipped'/not-retained.
            if run.status not in ("completed", "failed"):
                return {"status": "pending", "reason": "scouting in progress"}
            return {"status": "skipped", "reason": "no recon profile retained for this run"}
        try:
            r = json.loads(raw)
        except Exception:  # noqa: BLE001
            return {"status": "skipped", "reason": "recon profile unreadable"}
        steps = [{"probe": s.get("probe"), "reply": s.get("reply"), "note": s.get("note")}
                 for s in (r.get("steps") or [])]
        if not steps:
            # recon ran but probed nothing (target blocked the start session / empty fallback) — honest
            # 'skipped' with the cause, never a hollow 'done' profile (same never-fabricate principle as CR-P2)
            notes = r.get("notes") or []
            raw = next((n for n in notes if "skip" in n.lower()), None)
            # strip a leading 'recon skipped:' so the FE ('recon skipped — {reason}') doesn't double-print it
            reason = (raw.split(":", 1)[1].strip() if raw and ":" in raw else raw) or \
                "target blocked the start session"
            return {"status": "skipped", "reason": reason, "contact": r.get("contact_name") or ""}
        return {
            "status": "done",
            "contact": r.get("contact_name") or "",
            "profile": {
                "disclosesAi": r.get("discloses_ai"),
                "staysInScope": r.get("stays_in_scope"),
                "refusalStyle": r.get("refusal_style") or "",
                "notes": r.get("notes") or [],
            },
            "steps": steps,
        }

    def _play(self, attempt, turns, spec, pillar, fw, max_turns, incident) -> dict:
        tv = [{"idx": t.idx, "phase": t.phase, "intent": t.attacker_intent,
               "attacker": t.attacker_line, "agent": t.target_reply, "label": t.label or "Unknown",
               "complianceClean": t.compliance_clean} for t in turns]
        arc = _build_arc(tv)
        tech = self.library.technique(attempt.technique_slug) if self.library else None
        phase_plan = [{"name": ph.name, "intent": ph.intent} for ph in (tech.phase_plan if tech else [])]
        status = _PLAY_STATUS.get(attempt.outcome, "done")
        return {
            "id": attempt.objective_slug, "objective": attempt.objective_slug,
            "title": spec.title if spec else attempt.objective_slug,
            "mode": attempt.mode, "severity": (spec.severity if spec else "medium"), "pillar": pillar,
            "technique": attempt.technique_slug, "persona": attempt.persona or attempt.persona_slug,  # prose title (CR-P3); FE renders verbatim
            "regulation": _regulation(spec, fw), "goal": spec.goal if spec else attempt.rule,
            "status": status, "turns": tv, "phasePlan": phase_plan,
            "arc": arc["arc"], "beats": arc["beats"],
            "arcComplete": bool(phase_plan) and phase_plan[-1]["name"] in {a["phase"] for a in arc["arc"]},
            "pivotTurn": arc["pivotTurn"],
            "verdict": self._verdict(attempt, turns, status),
            "incidentId": incident,
            "contact": {"id": attempt.contact_id, "name": attempt.contact_name},
        }

    def _queued_play(self, i: int) -> dict:
        """A placeholder 'queued…' row mirroring _play's keys, all empty/neutral. The bandit's next pick
        is non-deterministic, so we NEVER fabricate technique/objective names — honest 'queued attack'
        label (same never-fabricate discipline as _recon). Pillar is alternated security/compliance only
        to seed both bands. verdict MUST be None (not a partial dict) so runview.ts VerdictCap renders
        the queued cap correctly."""
        return {
            "id": f"queued-{i}", "objective": "", "title": "queued attack", "mode": "",
            "severity": "medium", "pillar": "security" if i % 2 == 0 else "compliance",
            "technique": "", "persona": "", "regulation": [], "goal": "", "status": "queued",
            "turns": [], "phasePlan": [], "arc": [], "beats": [], "arcComplete": False,
            "pivotTurn": None, "verdict": None, "incidentId": None,
            "contact": {"id": None, "name": ""},
        }

    def _running_play(self, live: dict) -> dict:
        """A _play-shaped card for the in-flight play, built from the in-memory _LIVE cursor. Snapshot-copy
        the turns list (the runner coroutine appends to it in the same event loop) to avoid
        mutation-during-iteration. verdict MUST be None until the real Attempt lands. pickFocus() in
        runview.ts auto-focuses this because status is 'running'/'judging'."""
        tv = [{"idx": t.get("idx"), "phase": t.get("phase"), "intent": t.get("intent"),
               "attacker": t.get("attacker"), "agent": t.get("agent"), "label": t.get("label") or "Unknown",
               "complianceClean": t.get("complianceClean")}
              for t in list(live.get("turns") or [])]
        arc = _build_arc(tv)
        tech = self.library.technique(live.get("technique_slug")) if (self.library and live.get("technique_slug")) else None
        phase_plan = [{"name": ph.name, "intent": ph.intent} for ph in (tech.phase_plan if tech else [])]
        status = "judging" if live.get("phase") == "judging" else "running"
        return {
            "id": live.get("objective_slug") or "running", "objective": live.get("objective_slug") or "",
            "title": live.get("title") or "attack in progress", "mode": live.get("mode") or "",
            "severity": live.get("severity") or "medium", "pillar": live.get("pillar") or "compliance",
            "technique": live.get("technique_slug") or "", "persona": live.get("persona") or "",
            "regulation": [], "goal": "", "status": status, "turns": tv, "phasePlan": phase_plan,
            "arc": arc["arc"], "beats": arc["beats"], "arcComplete": False, "pivotTurn": arc["pivotTurn"],
            "verdict": None, "incidentId": None,
            "contact": {"id": live.get("contact_id"), "name": live.get("contact_name") or ""},
        }

    def _verdict(self, attempt, turns, status) -> dict:
        if status in ("blocked", "error"):
            # 'unknown' (all judges failed) maps to status 'error' (CR-P2); give it an honest cause note
            note = attempt.error or ("ungraded — all judges failed" if attempt.outcome == "unknown" else "")
            return {"productOutcome": "BLOCKED" if status == "blocked" else "ERROR", "note": note}
        votes = _votes(attempt.judge_votes)
        oracle = _oracle(attempt.mode)
        # fairness oracle has no judge panel — its FAIL/PASS comes from the disparate-treatment outcome (mirror api.ts, CR-P1)
        fairness_outcome = ("FAIL" if attempt.outcome == "succeeded" else "PASS") if oracle == "fairness" else None
        product = derive_outcome(attempt.outcome, oracle, votes, attempt.verdict_score, fairness_outcome)
        detectors = _detector_hits(attempt.detector_hits)
        if product is None:  # defensive guard — 'unknown' now degrades to status 'error' above; never fabricate a verdict
            return {"productOutcome": "ERROR", "note": attempt.error or "ungraded (all judges failed)",
                    "panelOutcome": (attempt.outcome or "").upper(), "nJudges": 0, "nCommitted": 0,
                    "score": attempt.verdict_score, "votes": votes, "detectors": detectors}
        live = [v for v in votes if not v.get("error")]
        n_judges = len(live)                                  # REAL — never hardcode 3 (M20)
        n_committed = sum(1 for v in live if v.get("committed"))
        agent_clean = all((t.compliance_clean is True) for t in turns) if turns else False
        bypass = _bypass(attempt.outcome, turns)              # ConsoleView semantics (EP-6): succeeded ∧ any clean
        return {
            "productOutcome": product, "panelOutcome": (attempt.outcome or "").upper(),
            "score": attempt.verdict_score, "nJudges": n_judges, "nCommitted": n_committed,
            "votes": votes, "detectors": detectors,
            "agentSelfReportedClean": agent_clean, "bypass": bypass, "numTurns": attempt.num_turns,
            "gateDelta": {"panel": product, "selfReport": agent_clean, "bypass": bypass,
                          "disagree": (product == "FAIL" and agent_clean)},
        }
