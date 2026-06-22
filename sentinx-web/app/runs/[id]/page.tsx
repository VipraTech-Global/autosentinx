"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Radio } from "lucide-react";
import { useRun } from "@/lib/use-run";
import { moduleScores, criticalRisks, summaryCounts } from "@/lib/score";
import { RunNav } from "@/components/live/run-nav";
import { RunFooter } from "@/components/run-footer";
import { ModuleScoreCard, CriticalRiskItem, RunProvenance } from "@/components/findings";
import { SectionLabel } from "@/components/ui";
import { RunLoading, RunError } from "@/components/states";

export default function OverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { run, error } = useRun(id);

  if (error) return <RunError msg={error} />;
  if (!run) return <RunLoading />;

  const scores = moduleScores(run);
  const risks = criticalRisks(run, 3);
  const c = summaryCounts(run);

  return (
    <>
      <RunNav runId={run.id} current="overview" findingsReady={run.playsDone >= 1 || run.status !== "running"} />
      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink">Executive summary</h1>
            <Link
              href={`/runs/${run.id}/arena`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink-muted hover:border-brand/40 hover:text-ink"
            >
              <Radio className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} />
              {run.status === "running" ? "Watch the live duel" : "Open the duel"} →
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <Stat n={c.findings} label="findings" />
            <Stat n={c.fail} label="FAIL" tone="fail" />
            <Stat n={c.risk} label="RISK" tone="warn" />
            <Stat n={c.pass} label="PASS" tone="pass" />
            <Stat n={c.bypass} label="guardrail bypass" tone="fail" />
            <Stat n={c.critical + c.high} label="critical / high" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {scores.map((s) => (
            <ModuleScoreCard key={s.pillar} score={s} />
          ))}
        </section>

        <section>
          <SectionLabel>Top critical risks</SectionLabel>
          <div className="mt-2 space-y-2">
            {risks.length ? (
              risks.map((o) => <CriticalRiskItem key={o.id} runId={run.id} o={o} />)
            ) : (
              <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-[13px] text-ink-muted">
                No FAIL or RISK findings — the agent withstood every graded play.
              </p>
            )}
          </div>
        </section>

        <section>
          <SectionLabel>Run provenance</SectionLabel>
          <div className="mt-2">
            <RunProvenance run={run} />
          </div>
        </section>
      </main>
      <RunFooter runId={run.id} agentName={run.agentName} ts={run.endedAt ?? run.startedAt} />
    </>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: "fail" | "warn" | "pass" }) {
  const color =
    tone === "fail" ? "text-fail-text" : tone === "warn" ? "text-warn-text" : tone === "pass" ? "text-pass-text" : "text-ink";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`mono tnum text-2xl font-semibold ${color}`}>{n}</span>
      <span className="text-ink-muted">{label}</span>
    </span>
  );
}
