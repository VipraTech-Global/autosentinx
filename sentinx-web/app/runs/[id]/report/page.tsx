"use client";

import { useParams } from "next/navigation";
import { useRun } from "@/lib/use-run";
import { moduleScores, criticalRisks, summaryCounts } from "@/lib/score";
import { PILLAR_LABEL, ORACLE_LABEL } from "@/lib/outcome";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { OutcomeBadge, ModuleTag, SeverityChip } from "@/components/badges";
import { RunProvenance } from "@/components/findings";
import { TranscriptTurn, JudgePanel, RegulationCite, DetectorHits } from "@/components/evidence";
import { RunLoading, RunError } from "@/components/states";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { run, error } = useRun(id);

  if (error) return <RunError msg={error} />;
  if (!run) return <RunLoading />;

  const c = summaryCounts(run);
  const scores = moduleScores(run);
  const risks = criticalRisks(run, 50); // all non-PASS, worst first

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Logo />
        <PrintButton />
      </div>

      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Red-team audit report</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          {run.agentName} · run <span className="mono">{run.id}</span>
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint">Executive summary</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink">
          AutoSentinx ran {run.playsTotal} multi-turn Hinglish plays against the target. It recorded{" "}
          <b>{c.findings}</b> findings — <b className="text-fail-text">{c.fail} FAIL</b>,{" "}
          <b className="text-warn-text">{c.risk} RISK</b>, <b className="text-pass-text">{c.pass} PASS</b>
          {c.bypass > 0 && (
            <> — of which <b className="text-fail-text">{c.bypass}</b> bypassed the agent&apos;s own safety filter</>
          )}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {scores.map((s) => (
            <div key={s.pillar} className="rounded-md border border-border p-3">
              <div className="text-[12px] font-semibold text-ink">{PILLAR_LABEL[s.pillar]}</div>
              <div className="mono mt-1 text-[13px] text-ink-muted">
                {s.withstood} / {s.plays} withstood · {s.fail} FAIL · {s.risk} RISK
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint">Provenance</h2>
        <div className="mt-2"><RunProvenance run={run} /></div>
      </section>

      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint">
          Findings ({risks.length})
        </h2>
        <div className="mt-3 space-y-5">
          {risks.map((o) => (
            <article key={o.id} className="break-inside-avoid rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-ink">{o.title}</h3>
                <span className="mono text-[11px] text-ink-faint">{o.id}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OutcomeBadge outcome={o.outcome} />
                <ModuleTag module={o.module} />
                <SeverityChip severity={o.severity} />
                <span className="text-[11.5px] text-ink-muted">{ORACLE_LABEL[o.oracle]}</span>
              </div>
              {o.judgeVotes.length > 0 && (
                <div className="mt-3"><JudgePanel votes={o.judgeVotes} /></div>
              )}
              {o.detectorHits.length > 0 && (
                <div className="mt-3"><DetectorHits hits={o.detectorHits} /></div>
              )}
              {o.evidence.length > 0 && (
                <div className="mt-3 divide-y divide-border rounded-md bg-surface-sunk px-3">
                  {o.evidence.map((t, i) => (
                    <TranscriptTurn key={`${t.idx}-${t.speaker}-${i}`} turn={t} />
                  ))}
                </div>
              )}
              {o.crosswalk.length > 0 && (
                <div className="mt-3"><RegulationCite edges={o.crosswalk} /></div>
              )}
            </article>
          ))}
          {risks.length === 0 && (
            <p className="text-[13px] text-ink-muted">No FAIL or RISK findings — the agent withstood every graded play.</p>
          )}
        </div>
      </section>

      <footer className="mt-8 border-t border-border pt-3 text-[11px] text-ink-faint">
        Proprietary &amp; confidential · © 2026 VipraTech Global · {run.engineVersion}
      </footer>
    </main>
  );
}
