"use client";

import { useParams } from "next/navigation";
import { useRun } from "@/lib/use-run";
import { moduleScores, criticalRisks, summaryCounts } from "@/lib/score";
import { TopBar } from "@/components/top-bar";
import { RunTabs } from "@/components/run-tabs";
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
      <TopBar run={run} />
      <RunTabs runId={run.id} findingsCount={run.observations.length} />
      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Executive summary</h1>
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
