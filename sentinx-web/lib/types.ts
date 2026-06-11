// Sentinx domain types — mirror the AutoSentinx backend schema (BACKEND-UPDATE.md §4)
// so swapping mock fixtures for the live /runs API is a thin adapter.

export type Pillar = "security" | "compliance";
export type Severity = "critical" | "high" | "medium" | "low";

// Derived product outcome (D-Q4/Q10/Q19)
export type Outcome = "FAIL" | "RISK" | "PASS";
// Raw engine outcome stored on Attempt.outcome (lowercase) + the "sample" evidence rows
export type RawOutcome =
  | "succeeded"
  | "defended"
  | "unknown"
  | "blocked"
  | "error"
  | "sample";

// Which oracle graded this finding (Phase-6 mode-aware router, BACKEND-UPDATE-2.md)
export type OracleType = "panel" | "single-judge" | "fairness";

// judge_votes JSON — anonymized in the UI (D-Q13: no model names shown)
export interface JudgeVote {
  committed: boolean;
  specificity: number; // 0..1
  reason: string;
}

// detector_hits JSON — shown as human category + raw id + snippet (D-Q13)
export interface DetectorHit {
  turn: number;
  group: string; // e.g. COERCION | DATA_BREACH
  detector: string; // raw id, e.g. "aadhaar", "police_fir"
  category: string; // human label, e.g. "PII: Aadhaar number"
  match: string; // matched snippet (<=60 chars)
}

// crosswalk edge (one objective -> many framework controls)
export interface CrosswalkEdge {
  framework: string; // RBI-FPC | DPDP | OWASP-LLM | MITRE-ATLAS ...
  controlId: string;
  controlTitle: string;
  relation: "equal" | "subset" | "superset" | "intersects";
  strength: number; // 1..10
  text?: string; // displayable clause prose — [SME-pending] until signed off (C6/D5)
  smePending?: boolean;
}

export type Speaker = "probe" | "target";

export interface EvidenceTurn {
  idx: number;
  speaker: Speaker;
  text: string;
  lang?: "hi" | "en";
  ts: string; // IST timestamp string
}

// Fairness paired-persona comparison variant (D-Q19)
export interface FairnessPersona {
  label: string; // e.g. "Persona A — male, Hindi"
  attribute: string; // the varied attribute
  turns: EvidenceTurn[];
  note: string; // how the agent treated this persona
}
export interface FairnessEvidence {
  personas: FairnessPersona[];
  verdict: string; // paired-stat verdict summary
  stat: string; // e.g. "Cohen's d = 0.8, BH-FDR p<0.05"
}

// A finding/observation = one Attempt enriched by its Objective + Turn evidence
export interface Observation {
  id: string; // display id F-SEC/COM-NN (C1)
  objectiveSlug: string; // catalog FK (join key)
  objectiveId: string; // play/technique id, human label e.g. SC-020
  title: string; // Objective.title
  description: string; // Objective.description (the goal)
  module: Pillar; // Objective.primary_pillar
  severity: Severity; // Objective.severity
  oracle: OracleType;
  rawOutcome: RawOutcome;
  outcome: Outcome; // derived
  verdictScore: number; // 0..1
  judgeVotes: JudgeVote[];
  detectorHits: DetectorHit[];
  crosswalk: CrosswalkEdge[];
  bypass: boolean; // derived: FAIL ∧ any turn self-reported clean
  incidentId?: string; // shared across a two-row pair (D8)
  pairedId?: string; // the linked observation (other pillar)
  evidence: EvidenceTurn[]; // the landing exchange for THIS observation (per-obs)
  numTurns: number;
  detectedIn: string; // run id
  reproduced: boolean;
  technique: string; // technique_slug / "the how"
  persona: string;
  fairness?: FairnessEvidence;
}

export interface Run {
  id: string; // ER-01
  targetUrl: string;
  agentName: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  operator: string;
  engineVersion: string;
  scenarioLibVersion: string;
  playsTotal: number;
  playsDone: number;
  observations: Observation[]; // excludes outcome=="sample" rows (folded into fairness)
}

export interface ModuleScore {
  pillar: Pillar;
  plays: number; // denominator: graded plays in this pillar
  pass: number;
  risk: number;
  fail: number;
  withstood: number; // = pass (D-Q11: clean PASS only)
}
