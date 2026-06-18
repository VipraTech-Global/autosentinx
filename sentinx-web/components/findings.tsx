import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ModuleScore, Observation, Run } from "@/lib/types";
import { PILLAR_LABEL } from "@/lib/outcome";
import { SeverityChip, OutcomeBadge, ModuleTag } from "./badges";
import { SectionLabel } from "./ui";

/** Withstood fraction + PASS/RISK/FAIL breakdown per module (D-Q11). */
export function ModuleScoreCard({ score }: { score: ModuleScore }) {
  const { pillar, plays, pass, risk, fail, withstood } = score;
  const seg = (n: number) => (plays ? `${(n / plays) * 100}%` : "0%");
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <SectionLabel>{PILLAR_LABEL[pillar]}</SectionLabel>
        <span className="text-[12px] text-ink-muted">
          <span className="mono tnum text-2xl font-semibold text-ink">{withstood}</span>
          <span className="mono tnum text-ink-muted"> / {plays}</span>
          <span className="ml-1">withstood</span>
        </span>
      </div>
      {/* breakdown bar */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-sunk">
        <div style={{ width: seg(pass), background: "var(--pass)" }} title={`${pass} PASS`} />
        <div style={{ width: seg(risk), background: "var(--warn)" }} title={`${risk} RISK`} />
        <div style={{ width: seg(fail), background: "var(--fail)" }} title={`${fail} FAIL`} />
      </div>
      <div className="mt-2 flex gap-4 text-[12px] tnum">
        <Legend dot="var(--pass)" label="PASS" n={pass} />
        <Legend dot="var(--warn)" label="RISK" n={risk} />
        <Legend dot="var(--fail)" label="FAIL" n={fail} />
      </div>
    </div>
  );
}

function Legend({ dot, label, n }: { dot: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span className="h-2 w-2 rounded-sm" style={{ background: dot }} aria-hidden />
      <span className="font-medium text-ink">{n}</span> {label}
    </span>
  );
}

export function CriticalRiskItem({ runId, o }: { runId: string; o: Observation }) {
  return (
    <Link
      href={`/runs/${runId}/o/${o.id}`}
      className="flex items-start gap-4 rounded-md border border-border bg-surface px-4 py-3.5 hover:border-brand/40 hover:bg-surface-sunk/40 transition-colors"
    >
      <OutcomeBadge outcome={o.outcome} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink leading-snug">{o.title}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <ModuleTag module={o.module} />
          <SeverityChip severity={o.severity} />
          {o.bypass && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fail-text">
              <span className="h-1 w-1 rounded-full bg-fail" aria-hidden /> guardrail bypass
            </span>
          )}
        </div>
      </div>
      <span className="mono shrink-0 pt-0.5 text-[11px] text-ink-muted">{o.id}</span>
    </Link>
  );
}

export function RunProvenance({ run }: { run: Run }) {
  const rows: [string, string][] = [
    ["Run", run.id],
    ["Target", run.targetUrl],
    ["Agent", run.agentName],
    ["Operator", run.operator],
    ["Started", run.startedAt],
    ["Ended", run.endedAt ?? "—"],
    ["Duration", run.durationSec ? `${Math.floor(run.durationSec / 60)}m ${run.durationSec % 60}s` : "—"],
    ["Engine", run.engineVersion],
    ["Scenario library", run.scenarioLibVersion],
    ["Plays run", String(run.playsTotal)],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-border/60 py-1">
          <dt className="text-[12px] text-ink-muted">{k}</dt>
          <dd className={cn("mono text-[12px] text-ink text-right truncate")}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
