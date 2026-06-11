"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Link2 } from "lucide-react";
import { useRun } from "@/lib/use-run";
import { ORACLE_LABEL } from "@/lib/outcome";
import { TopBar } from "@/components/top-bar";
import { OutcomeBadge, ModuleTag, SeverityChip } from "@/components/badges";
import { SectionLabel } from "@/components/ui";
import {
  TranscriptTurn, JudgePanel, DetectorHits, BypassSignal, VerdictScoreMeter,
  RegulationCite, FairnessComparison, ConfidentialityLine,
} from "@/components/evidence";
import { RunLoading, RunError } from "@/components/states";

export default function ObservationPage() {
  const { id, obsId } = useParams<{ id: string; obsId: string }>();
  const { run, error } = useRun(id);

  if (error) return <RunError msg={error} />;
  if (!run) return <RunLoading />;
  const o = run.observations.find((x) => x.id === obsId);
  if (!o) return <RunError msg={`Observation ${obsId} not found in this run.`} />;

  return (
    <>
      <TopBar run={run} />
      <main className="mx-auto max-w-4xl px-5 py-6">
        <Link
          href={`/runs/${run.id}/findings`}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> All findings
        </Link>

        {/* header */}
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[19px] font-semibold leading-snug tracking-tight text-ink">{o.title}</h1>
            <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">{o.description}</p>
          </div>
          <span className="mono shrink-0 text-[12px] text-ink-faint">{o.id}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <OutcomeBadge outcome={o.outcome} />
          <ModuleTag module={o.module} />
          <SeverityChip severity={o.severity} />
          <span className="text-[12px] text-ink-muted">{ORACLE_LABEL[o.oracle]}</span>
          {o.pairedId && (
            <Link
              href={`/runs/${run.id}/o/${o.pairedId}`}
              className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline"
            >
              <Link2 className="h-3 w-3" strokeWidth={1.5} /> linked {o.module === "security" ? "compliance" : "security"} duty
            </Link>
          )}
        </div>

        {/* verdict zone */}
        <section className="mt-7">
          <SectionLabel>Verdict</SectionLabel>
          <div className="mt-2 space-y-3">
            <BypassSignal bypass={o.bypass} selfReports />
            {o.oracle === "fairness" && o.fairness ? (
              <FairnessComparison fairness={o.fairness} />
            ) : (
              <>
                <div className="rounded-md border border-border bg-surface p-3">
                  <JudgePanel votes={o.judgeVotes} />
                </div>
                <VerdictScoreMeter score={o.verdictScore} />
              </>
            )}
          </div>
        </section>

        {/* forensic evidence zone */}
        {o.detectorHits.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Deterministic detectors</SectionLabel>
            <div className="mt-2"><DetectorHits hits={o.detectorHits} /></div>
          </section>
        )}

        {o.evidence.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Evidence — landing exchange</SectionLabel>
            <div className="mt-2 divide-y divide-border rounded-md border border-border bg-surface px-3">
              {o.evidence.map((t, i) => (
                <TranscriptTurn key={`${t.idx}-${t.speaker}-${i}`} turn={t} />
              ))}
            </div>
          </section>
        )}

        {o.crosswalk.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Regulatory & security mapping</SectionLabel>
            <div className="mt-2"><RegulationCite edges={o.crosswalk} /></div>
          </section>
        )}

        <div className="mt-8 border-t border-border pt-4">
          <ConfidentialityLine />
        </div>
      </main>
    </>
  );
}
