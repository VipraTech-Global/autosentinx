"""Failure-mode spine v1.0 — the stable controlled vocabulary of the Objective catalog (ADR 0011 §2).

16 modes in 5 non-exclusive families, plus the enums the catalog is keyed on (pillar, testability,
crosswalk relation, framework). The 3 consumer-protection modes need special oracles (Phase 6), so they
are flagged DRAFT_MODES — catalogued now, gradeable later. Spine is versioned + deprecate-never-delete:
a new mode must clear the mode-vs-tag governance gate before the version bumps (spine-v1.1, …).
"""
from enum import Enum

SPINE_VERSION = "spine-v1.0"


class Family(str, Enum):
    CONDUCT = "Conduct"
    DATA_PRIVACY = "Data & Privacy"
    PROCESS_TRANSPARENCY = "Process & Transparency"
    TRUTHFULNESS_ACTION = "Truthfulness & Action"
    FAIR_TREATMENT = "Fair Treatment & Consumer Protection"


class Mode(str, Enum):
    # Conduct
    COERCION = "COERCION"
    TIMING_VIOLATION = "TIMING_VIOLATION"
    CHANNEL_VIOLATION = "CHANNEL_VIOLATION"
    DOOM_LOOP = "DOOM_LOOP"
    # Data & Privacy
    DATA_BREACH = "DATA_BREACH"
    CONSENT_BYPASS = "CONSENT_BYPASS"
    SYSTEM_PROMPT_LEAK = "SYSTEM_PROMPT_LEAK"
    MEMORY_POISONING = "MEMORY_POISONING"
    # Process & Transparency
    PROCESS_SKIP = "PROCESS_SKIP"
    DISCLOSURE_FAIL = "DISCLOSURE_FAIL"
    IMPERSONATION = "IMPERSONATION"
    # Truthfulness & Action
    HALLUCINATION = "HALLUCINATION"
    TOOL_HIJACK = "TOOL_HIJACK"
    # Fair Treatment & Consumer Protection (need Phase-6 oracles)
    FAIRNESS_VIOLATION = "FAIRNESS_VIOLATION"
    VULNERABILITY_FAIL = "VULNERABILITY_FAIL"
    MIS_SELLING = "MIS_SELLING"


FAMILY_MODES: dict[Family, list[Mode]] = {
    Family.CONDUCT: [Mode.COERCION, Mode.TIMING_VIOLATION, Mode.CHANNEL_VIOLATION, Mode.DOOM_LOOP],
    Family.DATA_PRIVACY: [Mode.DATA_BREACH, Mode.CONSENT_BYPASS, Mode.SYSTEM_PROMPT_LEAK, Mode.MEMORY_POISONING],
    Family.PROCESS_TRANSPARENCY: [Mode.PROCESS_SKIP, Mode.DISCLOSURE_FAIL, Mode.IMPERSONATION],
    Family.TRUTHFULNESS_ACTION: [Mode.HALLUCINATION, Mode.TOOL_HIJACK],
    Family.FAIR_TREATMENT: [Mode.FAIRNESS_VIOLATION, Mode.VULNERABILITY_FAIL, Mode.MIS_SELLING],
}

MODE_FAMILY: dict[Mode, Family] = {m: f for f, modes in FAMILY_MODES.items() for m in modes}

# Consumer-protection modes — catalogued now, but their oracles (fairness paired-test, vulnerability
# two-stage, mis-selling manipulation judge) land in Phase 6. Until then objectives on these are `draft`.
DRAFT_MODES: set[Mode] = {Mode.FAIRNESS_VIOLATION, Mode.VULNERABILITY_FAIL, Mode.MIS_SELLING}


class Pillar(str, Enum):
    COMPLIANCE = "compliance"
    SECURITY = "security"
    # CONVERSATIONAL_QUALITY reserved (deferred — namespace held, no objectives yet)


class Testability(str, Enum):
    DRIVE = "drive"            # provoke via a multi-turn play (the attacker)
    PROBE = "probe"            # single elicitation probe
    CONFIG_AUDIT = "config-audit"  # not conversationally reachable; audit config out-of-band (deferred)


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Relation(str, Enum):
    """STRM/OLIR crosswalk edge type between an objective and a framework control."""
    EQUAL = "equal"
    SUBSET = "subset"
    SUPERSET = "superset"
    INTERSECTS = "intersects"


class Framework(str, Enum):
    RBI_FPC = "RBI-FPC"          # RBI Fair Practices Code / FREE-AI / recovery-agent norms
    DPDP = "DPDP"               # Digital Personal Data Protection Act 2023
    TRAI = "TRAI"               # TRAI commercial-comms / AI-call disclosure
    OWASP_LLM = "OWASP-LLM"     # OWASP Top 10 for LLM Apps
    OWASP_AGENTIC = "OWASP-AGENTIC"  # OWASP Agentic threats
    MITRE_ATLAS = "MITRE-ATLAS"
    NIST_AI_RMF = "NIST-AI-RMF"


def validate_mode(mode: str) -> Mode:
    try:
        return Mode(mode)
    except ValueError as e:
        raise ValueError(f"unknown mode {mode!r} — not in {SPINE_VERSION}") from e


def is_draft(mode: Mode) -> bool:
    return mode in DRAFT_MODES
