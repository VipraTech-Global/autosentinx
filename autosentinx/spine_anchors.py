"""Anchor the 16-mode hazard spine to published taxonomies (roadmap P5, decision 3 opt-4).

Decision 3 chose: SALAD-Bench as the structural backbone + AILuminate grading conventions + an
AIR-Bench regulation-derived crosswalk (NIST-AI-RMF is already in `spine.Framework`). This module is
the anchor table: every one of the 16 spine modes maps to a SALAD-Bench task, an AILuminate hazard
category, and an AIR-Bench area — so a finding renders all of OWASP-LLM / MITRE-ATLAS / NIST-AI-RMF /
RBI / DPDP / TRAI **plus** SALAD / AILuminate / AIR-Bench labels, and coverage is benchmark-comparable.

The anchors are materialized into the existing crosswalk tables (`FrameworkControl` +
`ObjectiveControlMap`) via `framework_controls()` / `objective_anchor_edges()`, so no new schema is
needed. The exact upstream IDs (SALAD 16-task ids, AILuminate v1.0 12-category ids, AIR-Bench category
numbers) live here and are refined against the verified corpus.
"""
from __future__ import annotations

from .spine import Mode

# Three taxonomies anchored here (added alongside spine.Framework's 7).
SALAD = "SALAD-Bench"
AILUMINATE = "MLCommons-AILuminate"
AIRBENCH = "AIR-Bench-2024"
ANCHOR_FRAMEWORKS = (SALAD, AILUMINATE, AIRBENCH)

# mode -> {SALAD task, AILuminate hazard category, AIR-Bench area}. Faithful to each mode's meaning;
# IDs follow each taxonomy's published structure (SALAD 6-domain/16-task, AILuminate 12-category,
# AIR-Bench regulation-derived areas).
ANCHORS: dict[Mode, dict] = {
    Mode.COERCION:          {"salad": "malicious_use/harassment_threats", "ailuminate": "violent_crimes",         "airbench": "Operational Misuses/Coercion"},
    Mode.TIMING_VIOLATION:  {"salad": "malicious_use/illegal_regulated",   "ailuminate": "nonviolent_crimes",      "airbench": "Operational Misuses/Regulatory"},
    Mode.CHANNEL_VIOLATION: {"salad": "malicious_use/illegal_regulated",   "ailuminate": "nonviolent_crimes",      "airbench": "Operational Misuses/Regulatory"},
    Mode.DOOM_LOOP:         {"salad": "info_safety/service_failure",       "ailuminate": "specialized_advice",     "airbench": "Operational Misuses/Service"},
    Mode.DATA_BREACH:       {"salad": "info_safety/privacy_leakage",       "ailuminate": "privacy",                "airbench": "Privacy/Sensitive Disclosure"},
    Mode.CONSENT_BYPASS:    {"salad": "info_safety/privacy_leakage",       "ailuminate": "privacy",                "airbench": "Privacy/Consent"},
    Mode.SYSTEM_PROMPT_LEAK:{"salad": "info_safety/system_prompt_leak",    "ailuminate": "privacy",                "airbench": "Security Risks/Confidentiality"},
    Mode.MEMORY_POISONING:  {"salad": "malicious_use/integrity",          "ailuminate": "nonviolent_crimes",      "airbench": "Security Risks/Integrity"},
    Mode.PROCESS_SKIP:      {"salad": "malicious_use/illegal_regulated",   "ailuminate": "nonviolent_crimes",      "airbench": "Operational Misuses/Process"},
    Mode.DISCLOSURE_FAIL:   {"salad": "info_safety/deception",            "ailuminate": "specialized_advice",     "airbench": "Deception/Non-disclosure"},
    Mode.IMPERSONATION:     {"salad": "info_safety/deception",            "ailuminate": "defamation",             "airbench": "Deception/Impersonation"},
    Mode.HALLUCINATION:     {"salad": "info_safety/misinformation",       "ailuminate": "specialized_advice",     "airbench": "Deception/Misinformation"},
    Mode.TOOL_HIJACK:       {"salad": "malicious_use/security",           "ailuminate": "nonviolent_crimes",      "airbench": "Security Risks/Tool Misuse"},
    Mode.FAIRNESS_VIOLATION:{"salad": "representation/discrimination",     "ailuminate": "hate",                   "airbench": "Discrimination/Disparate Treatment"},
    Mode.VULNERABILITY_FAIL:{"salad": "human_autonomy/vulnerable_groups",  "ailuminate": "specialized_advice",     "airbench": "Human Autonomy/Vulnerable Groups"},
    Mode.MIS_SELLING:       {"salad": "info_safety/deception",            "ailuminate": "specialized_advice",     "airbench": "Deception/Mis-selling"},
}


def framework_controls() -> list[dict]:
    """Distinct (framework, control_id, title) rows for FrameworkControl seeding across the 3 taxonomies."""
    seen, out = set(), []
    for anchors in ANCHORS.values():
        for fw, key in ((SALAD, "salad"), (AILUMINATE, "ailuminate"), (AIRBENCH, "airbench")):
            cid = anchors[key]
            if (fw, cid) in seen:
                continue
            seen.add((fw, cid))
            out.append({"framework": fw, "control_id": cid, "title": cid.replace("_", " ").replace("/", " · ")})
    return out


def mode_anchor_edges(mode: Mode) -> list[dict]:
    """Crosswalk edges (framework, control_id) anchoring a mode to the 3 taxonomies."""
    a = ANCHORS[mode]
    return [{"framework": SALAD, "control_id": a["salad"]},
            {"framework": AILUMINATE, "control_id": a["ailuminate"]},
            {"framework": AIRBENCH, "control_id": a["airbench"]}]


def all_modes_anchored() -> bool:
    return all(m in ANCHORS and all(k in ANCHORS[m] for k in ("salad", "ailuminate", "airbench"))
               for m in Mode)
