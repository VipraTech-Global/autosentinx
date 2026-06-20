// RunView — the live-duel projection the Live Views (V2 Arena, V3 Forensic) consume.
// The build seam (BUILD-ASSUMPTIONS A-LV2): today this adapts the engine/prototype
// `state.json` shape; the D-LV-dep3 engine port will emit the same contract from /runs/{id}.
// Distinct from lib/types.ts (the static REPORT model). Honesty: every field binds to a real
// engine value; nothing is fabricated. See design documentation/live-views/.

import type { Pillar, Severity } from "./types";

export type RunStatus = "starting" | "recon" | "running" | "judging" | "done" | "failed" | "blocked";
export type PlayStatus = "queued" | "running" | "judging" | "done" | "blocked" | "error";
export type TurnLabel = "Succeed" | "Comply" | "Refusal" | "Unknown";
export type ProductOutcome = "PASS" | "FAIL" | "RISK" | "ERROR" | "BLOCKED";

/** The per-turn defence cell — advisory in-call classifier label, NOT the ruling. */
export type CellKind = "held" | "wavered" | "yielded" | "unknown" | "pending"; // 'pending' = estimated-remaining (UI only)

const ACRONYMS: Record<string, string> = { ai: "AI", pii: "PII", kyc: "KYC", emi: "EMI", otp: "OTP", trai: "TRAI", dnc: "DNC", sms: "SMS", fir: "FIR", llm: "LLM" };
/** Humanize an objective slug WITHOUT losing nuance: "guardrail.policy-override" → "Guardrail — policy override".
 *  The raw slug stays available (tooltip / technical refs) for the internal reader. */
export function humanize(slug: string): string {
  if (!slug) return slug;
  const words = (s: string) => s.split("-").map((w) => ACRONYMS[w.toLowerCase()] ?? w).join(" ");
  const [cat, ...rest] = slug.split(".");
  const head = words(cat);
  const cap = head.charAt(0).toUpperCase() + head.slice(1);
  const tail = rest.join(".");
  return tail ? `${cap} — ${words(tail)}` : cap;
}

export interface TurnView {
  idx: number;
  phase: string;
  intent: string;           // plain-language — what the attacker is trying (D-LV17: lead with this)
  attacker: string;         // Probe (Sentinx)  — Devanagari-aware
  agent: string;            // Target (AARAV)
  label: TurnLabel;         // advisory classifier
  cell: CellKind;           // derived from label
  complianceClean?: boolean;
}

export interface PhasePlanItem { name: string; intent: string }
export interface Beat { fromPhase: string; toPhase: string; atTurn: number; trigger: "conceded" | "timer" | "re-angled" }

export interface JudgeVoteView { model: string; committed: boolean; reason?: string; specificity?: number; error?: string }
export interface DetectorView { turn?: number; group?: string; detector?: string; name?: string; match?: string }

export interface VerdictView {
  productOutcome: ProductOutcome;
  panelOutcome?: string;        // SUCCEEDED | DEFENDED (engine)
  nJudges: number;              // REAL — 3 / 1-oracle / 2-degraded (never hardcode)
  nCommitted: number;
  score?: number;
  votes: JudgeVoteView[];
  detectors: DetectorView[];
  agentSelfReportedClean?: boolean;
  bypass?: boolean;             // FAIL ∧ self-report clean
  gateDelta?: { disagree?: boolean };
  note?: string;                // for blocked/errored
}

export interface PlayView {
  idx: number;
  id: string;                   // objective slug / F-SEC|COM-NN later
  title: string;
  mode?: string;
  pillar: Pillar;
  severity: Severity;
  technique: string;
  persona: string;
  status: PlayStatus;
  regulation?: { framework: string; control_id: string }[];
  phasePlan: PhasePlanItem[];
  turns: TurnView[];
  arc: { phase: string; intent?: string; labels?: TurnLabel[]; turnIdxStart?: number; turnIdxEnd?: number }[];
  beats: Beat[];
  pivotTurn?: number | null;    // advisory classifier pivot — NOT guaranteed the judge-quoted line
  arcComplete?: boolean;
  verdict?: VerdictView;
  incidentId?: string;          // shared across a dual-duty pair (D8)
  pairedIdx?: number;           // the linked play in the other band
  contact?: { id?: number; name?: string };
}

export interface ReconView {
  status?: string;
  contact?: string;
  reason?: string;
  profile?: { disclosesAi?: boolean; staysInScope?: boolean; refusalStyle?: string; notes?: string[] } | null;
  links?: { intelCard?: string; value?: unknown; drivesObjective?: string }[];
  steps?: { probe?: string; reply?: string; note?: string }[];
}

export interface RunView {
  id: string;
  target: string;
  status: RunStatus;
  intensity?: IntensityLevel;
  engine: { attacker?: string; classifier?: string; judges?: string; maxTurns?: number };
  recon?: ReconView;
  summary: { total: number; done: number; fails: number; risks: number; bypasses: number };
  plays: PlayView[];
  error?: string;
  startedAt?: string;
}

export type IntensityLevel = "low" | "med" | "high" | "xhigh" | "max" | "ultra";

// ---------- derive helpers (pure, honest) ----------

const LABEL_CELL: Record<TurnLabel, CellKind> = {
  Refusal: "held",      // the agent refused / held the line
  Comply: "wavered",    // gave ground
  Succeed: "yielded",   // the agent gave the line (advisory)
  Unknown: "unknown",
};
export const cellOf = (l: TurnLabel): CellKind => LABEL_CELL[l] ?? "unknown";

/** Outcome → display token (composed aliases of PASS/FAIL, D-LV19 / LV-5). */
export function outcomeToken(o?: ProductOutcome): { label: string; tone: "held" | "breached" | "risk" | "neutral" } {
  if (o === "PASS") return { label: "HELD", tone: "held" };
  if (o === "FAIL") return { label: "BREACHED", tone: "breached" };
  if (o === "RISK") return { label: "RISK", tone: "risk" };
  return { label: o ?? "—", tone: "neutral" };
}

/** Judge denominator semantics (D-LV: real nJudges; oracle = 1/1; degraded discloses unavailable). */
export function judgeMeta(v: VerdictView | undefined, engineJudges?: string) {
  const votes = v?.votes ?? [];
  const voted = votes.filter((x) => !x.error);
  const errored = votes.filter((x) => x.error);
  const isOracle = v?.nJudges === 1 && errored.length === 0 && votes.length <= 1;
  const panelCfg = engineJudges ? engineJudges.split(",").filter(Boolean).length : 3;
  const configured = isOracle ? 1 : panelCfg;
  return { votes, voted, errored, isOracle, configured };
}

/** The TELEGRAPH (D-LV16): the next pre-committed phase not yet reached (honest plan data). */
export function telegraph(p: PlayView): { name: string; intent: string } | null {
  if (p.status === "done" || p.status === "blocked" || p.status === "error") return null;
  const reached = new Set((p.arc ?? []).map((a) => a.phase));
  const next = (p.phasePlan ?? []).find((ph) => !reached.has(ph.name));
  return next ?? null;
}

/** The breach point — advisory pivot, only meaningful on a real breach. */
export function breachPointPhase(p: PlayView): string | null {
  if (!(p.status === "done" && p.verdict?.productOutcome === "FAIL")) return null;
  const arc = p.arc ?? [];
  return arc.length ? arc[arc.length - 1].phase : null;
}

export interface Band { pillar: Pillar; plays: PlayView[]; withstood: number; graded: number }

/** Group plays into the two pillar bands, severity-ordered; withstood = clean PASS only (D-Q11). */
const SEV_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
export function bands(run: RunView): Band[] {
  const mk = (pillar: Pillar): Band => {
    const plays = run.plays
      .filter((p) => p.pillar === pillar)
      .sort((a, b) => (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0));
    const graded = plays.filter((p) => p.status === "done").length;
    const withstood = plays.filter((p) => p.status === "done" && p.verdict?.productOutcome === "PASS").length;
    return { pillar, plays, withstood, graded };
  };
  return [mk("security"), mk("compliance")];
}

/** Lead-with-the-climax focus (D-LV: highest-severity breach > any breach > gate-delta > last done). */
export function pickFocus(run: RunView): number | null {
  const running = run.plays.find((p) => p.status === "running" || p.status === "judging");
  if (running) return running.idx;
  const breaches = run.plays.filter((p) => p.status === "done" && p.verdict?.productOutcome === "FAIL");
  if (breaches.length) { breaches.sort((a, b) => (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0)); return breaches[0].idx; }
  const gd = run.plays.find((p) => p.verdict?.bypass);
  if (gd) return gd.idx;
  const done = [...run.plays].reverse().find((p) => p.status === "done");
  return done ? done.idx : run.plays.length ? run.plays[0].idx : null;
}

/** Honest cause for a blocked/errored play — never fabricate a TRAI/DNC refusal over a 404. */
export function blockCause(note?: string): string {
  const n = String(note ?? "");
  if (/40[34]|not found|no such|lookup|unreachable|timed? ?out|connection|resolve/i.test(n))
    return "could not reach the contact — not assessed; cause: lookup / connectivity, not a confirmed refusal";
  if (/DNC|do not call|contact-window|TRAI|window|consent|opt[- ]?out/i.test(n))
    return "the target refused the call (DNC / outside the TRAI 10AM–7PM IST contact-window)";
  return "not assessed — cause not confirmed from the engine note";
}

// ---------- the adapter: engine/prototype state.json -> RunView ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
export function fromStateJson(raw: any, id = "ER-LIVE"): RunView {
  const plays: PlayView[] = (raw.plays ?? []).map((p: any) => {
    const turns: TurnView[] = (p.turns ?? []).map((t: any) => ({
      idx: t.idx, phase: t.phase, intent: t.intent ?? "",
      attacker: t.attacker ?? "", agent: t.agent ?? "",
      label: (t.label ?? "Unknown") as TurnLabel, cell: cellOf((t.label ?? "Unknown") as TurnLabel),
      complianceClean: t.complianceClean,
    }));
    const v = p.verdict;
    const verdict: VerdictView | undefined = v
      ? {
          productOutcome: (v.productOutcome ?? "ERROR") as ProductOutcome,
          panelOutcome: v.panelOutcome, nJudges: v.nJudges ?? (v.votes?.length ?? 0), nCommitted: v.nCommitted ?? 0,
          score: v.score, votes: v.votes ?? [], detectors: v.detectors ?? [],
          agentSelfReportedClean: v.agentSelfReportedClean, bypass: v.bypass, gateDelta: v.gateDelta, note: v.note,
        }
      : undefined;
    return {
      idx: p.idx, id: p.id, title: p.title ?? p.id, mode: p.mode,
      pillar: (p.pillar ?? "compliance") as Pillar, severity: (p.severity ?? "low") as Severity,
      technique: p.technique ?? "", persona: p.persona ?? "", status: (p.status ?? "queued") as PlayStatus,
      regulation: p.regulation, phasePlan: p.phasePlan ?? [], turns,
      arc: p.arc ?? [], beats: p.beats ?? [], pivotTurn: p.pivotTurn, arcComplete: p.arcComplete,
      verdict, incidentId: p.incidentId, pairedIdx: p.pairedIdx, contact: p.contact,
    };
  });
  const sm = raw.summary ?? {};
  return {
    id, target: raw.target ?? "", status: (raw.status ?? "running") as RunStatus,
    intensity: raw.intensity, engine: raw.engine ?? {}, recon: raw.recon,
    summary: { total: sm.total ?? plays.length, done: sm.done ?? 0, fails: sm.fails ?? 0, risks: sm.risks ?? 0, bypasses: sm.bypasses ?? 0 },
    plays, error: raw.error, startedAt: raw.startedAt,
  };
}
