"""Console view-model — transforms backend Attempt + Catalog + Turns into the frontend Run/Observation
shape (sentinx-web/lib/types.ts), camelCase. One place for the catalog join, JSON parse, bypass
derivation, the D8 two-row (Security+Compliance) split, and fairness grouping. The frontend derives
the FAIL/RISK/PASS `outcome` itself (lib/outcome.ts), so we emit rawOutcome + the inputs it needs.
"""
from __future__ import annotations

import json
from datetime import timedelta

from .catalog import Catalog, ObjectiveSpec

COMPLIANCE_FRAMEWORKS = {"RBI-FPC", "DPDP", "TRAI"}
SECURITY_FRAMEWORKS = {"OWASP-LLM", "OWASP-AGENTIC", "MITRE-ATLAS", "NIST-AI-RMF"}
SINGLE_JUDGE_MODES = {"VULNERABILITY_FAIL", "MIS_SELLING"}
FAIRNESS_MODE = "FAIRNESS_VIOLATION"

_GROUP_CATEGORY = {
    "COERCION": "Coercion / threat", "IMPERSONATION": "AI-identity / impersonation",
    "DATA_BREACH": "Sensitive data disclosure", "MIS_SELLING": "Unauthorized commitment",
}
_DETECTOR_CATEGORY = {
    "aadhaar": "PII: Aadhaar number", "pan": "PII: PAN", "phone": "PII: phone number",
    "upi": "PII: UPI ID", "ifsc": "PII: IFSC code", "claims_human": "Claims to be human",
    "denies_ai": "Denies being an AI", "police_fir": "Police / FIR threat",
    "arrest_jail": "Arrest / jail threat", "legal_action": "Legal-action threat",
    "cibil": "CIBIL / credit threat", "employer_family": "Third-party contact threat",
    "waiver": "Fee waiver", "settlement": "Settlement offer",
}


def _ist(created_at, idx: int) -> str:
    try:
        t = (created_at + timedelta(hours=5, minutes=30, seconds=3 * max(idx, 0)))
        return t.strftime("%H:%M:%S") + " IST"
    except Exception:  # noqa: BLE001
        return ""


def _lang(text: str) -> str:
    return "hi" if any("ऀ" <= c <= "ॿ" for c in (text or "")) else "en"


def _oracle(mode: str) -> str:
    if mode == FAIRNESS_MODE:
        return "fairness"
    if mode in SINGLE_JUDGE_MODES:
        return "single-judge"
    return "panel"


def _judge_votes(raw: str) -> list[dict]:
    out = []
    for v in json.loads(raw or "[]"):
        if v.get("error"):
            continue
        if "committed" not in v:   # fairness PairVerdict, not a JudgeVerdict — skip here
            continue
        out.append({"committed": bool(v.get("committed")), "specificity": float(v.get("specificity") or 0.0),
                    "reason": str(v.get("reason", ""))})
    return out


def _detector_hits(raw: str) -> list[dict]:
    out = []
    for h in json.loads(raw or "[]"):
        det = h.get("detector", "")
        out.append({
            "turn": int(h.get("turn", -1)), "group": h.get("group", ""), "detector": det,
            "category": _DETECTOR_CATEGORY.get(det, _GROUP_CATEGORY.get(h.get("group", ""), "Signal")),
            "match": str(h.get("match", ""))[:60],
        })
    return out


def _evidence(turns, created_at) -> list[dict]:
    """The landing exchange + the decisive turn (where the finding landed) — probe ↔ target."""
    if not turns:
        return []
    decisive = next((t for t in turns if getattr(t, "label", "") == "Succeed"), turns[-1])
    chosen, seen = [], set()
    for t in (turns[0], decisive):
        if id(t) in seen:
            continue
        seen.add(id(t))
        chosen.append(t)
    ev = []
    for t in chosen:
        atk, tgt = getattr(t, "attacker_line", "") or "", getattr(t, "target_reply", "") or ""
        if atk:
            ev.append({"idx": t.idx, "speaker": "probe", "text": atk, "lang": _lang(atk), "ts": _ist(created_at, t.idx)})
        if tgt:
            ev.append({"idx": t.idx, "speaker": "target", "text": tgt, "lang": _lang(tgt), "ts": _ist(created_at, t.idx)})
    return ev


def _crosswalk(spec: ObjectiveSpec, frameworks: set | None) -> list[dict]:
    edges = spec.crosswalk if spec else []
    if frameworks is not None:
        edges = [e for e in edges if e.framework in frameworks]
    return [{
        "framework": e.framework, "controlId": e.control_id, "controlTitle": e.control_title or e.control_id,
        "relation": e.relation, "strength": e.strength, "text": e.rationale or e.control_title,
        "smePending": True,
    } for e in edges]


def _bypass(outcome: str, turns) -> bool:
    return outcome == "succeeded" and any(getattr(t, "compliance_clean", None) is True for t in turns)


class ConsoleView:
    def __init__(self, catalog: Catalog) -> None:
        self.catalog = catalog

    # ---- run summary (list) ----
    def run_summary(self, run) -> dict:
        status = "running" if run.status in ("running", "pending_approval") else run.status
        try:
            budget = int(json.loads(run.roe or "{}").get("budget") or run.num_attempts)
        except Exception:  # noqa: BLE001
            budget = run.num_attempts
        return {
            "id": run.id, "targetUrl": run.target_url, "agentName": self._agent_name(run),
            "status": status, "startedAt": (run.approved_at or run.created_at).isoformat(),
            "operator": run.approved_by or "operator",
            "playsTotal": max(budget, run.num_attempts),   # planned (budget)
            "playsDone": run.num_attempts,                 # attempts executed so far
            "note": run.note,
        }

    def _agent_name(self, run) -> str:
        return "AARAV — NBFC voice debt-collection agent"

    # ---- full run with observations ----
    def run_full(self, run, attempts: list[dict]) -> dict:
        rows = [(a["attempt"], a["turns"]) for a in attempts]
        observations: list[dict] = []
        counters = {"security": 0, "compliance": 0}

        # fairness: group the fairness/<pair> summary with its /A and /B sample rows
        fairness_summaries = {a.objective_id: (a, t) for a, t in rows
                              if a.mode == FAIRNESS_MODE and a.objective_id.count("/") == 1}
        fairness_samples = {a.objective_id: (a, t) for a, t in rows
                            if a.mode == FAIRNESS_MODE and a.objective_id.count("/") == 2}

        for attempt, turns in rows:
            if attempt.outcome in ("sample", "error", "blocked"):
                continue
            if attempt.mode == FAIRNESS_MODE:
                if attempt.objective_id.count("/") != 1:  # only build from the summary row
                    continue
                observations.append(self._fairness_obs(attempt, fairness_samples, run, counters))
                continue
            spec = self.catalog.get(attempt.objective_slug)
            has_comp = bool(spec and any(e.framework in COMPLIANCE_FRAMEWORKS for e in spec.crosswalk))
            has_sec = bool(spec and any(e.framework in SECURITY_FRAMEWORKS for e in spec.crosswalk))
            if has_comp and has_sec:  # D8 — emit one observation per pillar, linked
                inc = f"INC-{attempt.id}"
                sec = self._obs(attempt, turns, spec, "security", SECURITY_FRAMEWORKS, run, counters, inc)
                com = self._obs(attempt, turns, spec, "compliance", COMPLIANCE_FRAMEWORKS, run, counters, inc)
                sec["pairedId"], com["pairedId"] = com["id"], sec["id"]
                observations += [sec, com]
            else:
                module = (spec.primary_pillar if spec else "compliance")
                observations.append(self._obs(attempt, turns, spec, module, None, run, counters, None))

        return {
            **self.run_summary(run),
            "endedAt": None, "engineVersion": "autosentinx (Phase-7)",
            "scenarioLibVersion": f"spine-v1.0 · {len(self.catalog)} objectives",
            "durationSec": None, "observations": observations,
        }

    def _obs(self, attempt, turns, spec, module, fw, run, counters, incident) -> dict:
        counters[module] += 1
        code = "SEC" if module == "security" else "COM"
        return {
            "id": f"F-{code}-{counters[module]:02d}",
            "objectiveSlug": attempt.objective_slug, "objectiveId": attempt.objective_slug,
            "title": spec.title if spec else attempt.objective_slug,
            "description": spec.goal if spec else attempt.rule,
            "module": module, "severity": (spec.severity if spec else "medium"),
            "oracle": _oracle(attempt.mode), "rawOutcome": attempt.outcome,
            "verdictScore": attempt.verdict_score, "judgeVotes": _judge_votes(attempt.judge_votes),
            "detectorHits": _detector_hits(attempt.detector_hits),
            "crosswalk": _crosswalk(spec, fw), "bypass": _bypass(attempt.outcome, turns),
            "incidentId": incident, "pairedId": None,
            "evidence": _evidence(turns, attempt.created_at), "numTurns": attempt.num_turns,
            "detectedIn": run.id, "reproduced": True,
            "technique": attempt.technique_slug, "persona": attempt.persona_slug,
        }

    def _fairness_obs(self, summary, samples, run, counters) -> dict:
        pv = (json.loads(summary.judge_votes or "[]") or [{}])[0]
        pair = summary.objective_id.split("/", 1)[1]
        spec = self.catalog.get(summary.objective_slug)
        counters["compliance"] += 1
        personas = []
        for grp in ("A", "B"):
            s = samples.get(f"{summary.objective_id}/{grp}")
            if not s:
                continue
            sa, st = s
            personas.append({
                "label": f"Persona {grp} — {sa.persona_slug}", "attribute": pv.get("varied_attribute", ""),
                "turns": _evidence(st, sa.created_at),
                "note": ("treated worse" if pv.get("worse_group") == grp else "baseline treatment"),
            })
        return {
            "id": f"F-COM-{counters['compliance']:02d}",
            "objectiveSlug": summary.objective_slug, "objectiveId": f"fairness/{pair}",
            "title": spec.title if spec else "Disparate treatment", "description": spec.goal if spec else "",
            "module": "compliance", "severity": (spec.severity if spec else "high"),
            "oracle": "fairness", "rawOutcome": summary.outcome, "verdictScore": summary.verdict_score,
            "judgeVotes": [], "detectorHits": [], "crosswalk": _crosswalk(spec, None),
            "bypass": False, "incidentId": None, "pairedId": None, "evidence": [],
            "numTurns": 0, "detectedIn": run.id, "reproduced": True,
            "technique": "neutral-interaction", "persona": f"{pair}",
            "fairness": {
                "personas": personas,
                "verdict": pv.get("reason", "") or ("disparate treatment" if summary.outcome == "succeeded" else "fair"),
                "stat": f"effect size (gap) = {pv.get('gap', 0.0)}",
            },
        }
