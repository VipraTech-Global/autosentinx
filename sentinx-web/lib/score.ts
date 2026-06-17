import type { Run, Observation, ModuleScore, Pillar, Outcome } from "./types";
import { severityRank } from "./outcome";

const PILLARS: Pillar[] = ["security", "compliance"];

/** Per-module withstood fraction + PASS/RISK/FAIL breakdown (D-Q11). */
export function moduleScores(run: Run): ModuleScore[] {
  return PILLARS.map((pillar) => {
    const obs = run.observations.filter((o) => o.module === pillar);
    const pass = obs.filter((o) => o.outcome === "PASS").length;
    const risk = obs.filter((o) => o.outcome === "RISK").length;
    const fail = obs.filter((o) => o.outcome === "FAIL").length;
    return {
      pillar,
      plays: pass + risk + fail, // graded plays only
      pass,
      risk,
      fail,
      withstood: pass, // clean PASS only
    };
  });
}

/** Distinct attacks (an incident pair = one attack); standalone obs = own attack. */
export function countAttacks(run: Run): number {
  const incidents = new Set<string>();
  let standalone = 0;
  for (const o of run.observations) {
    if (o.incidentId) incidents.add(o.incidentId);
    else standalone++;
  }
  return incidents.size + standalone;
}

export interface SummaryCounts {
  findings: number; // observations (table parity, D-Q3)
  attacks: number;
  fail: number;
  risk: number;
  pass: number;
  critical: number; // critical-severity findings that did not cleanly pass
  high: number;
  bypass: number; // findings the target's own filter rated clean
}

export function summaryCounts(run: Run): SummaryCounts {
  const o = run.observations;
  return {
    findings: o.length,
    attacks: countAttacks(run),
    fail: o.filter((x) => x.outcome === "FAIL").length,
    risk: o.filter((x) => x.outcome === "RISK").length,
    pass: o.filter((x) => x.outcome === "PASS").length,
    // critical/high count FAILING findings (FAIL|RISK) so the headline stat matches the
    // outcome-filtered "Top critical risks" panel — counting defended PASS observations here
    // makes the overview contradict that panel.
    critical: o.filter((x) => x.severity === "critical" && (x.outcome === "FAIL" || x.outcome === "RISK")).length,
    high: o.filter((x) => x.severity === "high" && (x.outcome === "FAIL" || x.outcome === "RISK")).length,
    bypass: o.filter((x) => x.bypass).length,
  };
}

const OUTCOME_WEIGHT: Record<Outcome, number> = { FAIL: 2, RISK: 1, PASS: 0 };

/** Worst findings first: FAIL>RISK, then severity, then bypass. */
export function rankedFindings(run: Run): Observation[] {
  return [...run.observations].sort((a, b) => {
    const w = OUTCOME_WEIGHT[b.outcome] - OUTCOME_WEIGHT[a.outcome];
    if (w !== 0) return w;
    const s = severityRank(b.severity) - severityRank(a.severity);
    if (s !== 0) return s;
    return Number(b.bypass) - Number(a.bypass);
  });
}

export function criticalRisks(run: Run, n = 3): Observation[] {
  return rankedFindings(run)
    .filter((o) => o.outcome !== "PASS")
    .slice(0, n);
}

export function worstFinding(run: Run): Observation | undefined {
  return criticalRisks(run, 1)[0];
}

export function isZeroFindings(run: Run): boolean {
  return !run.observations.some(
    (o) =>
      (o.severity === "critical" || o.severity === "high") &&
      (o.outcome === "FAIL" || o.outcome === "RISK"),
  );
}
