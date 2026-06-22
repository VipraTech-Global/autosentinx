"use client";

import { useParams } from "next/navigation";
import { useRun } from "@/lib/use-run";
import { RunNav } from "@/components/live/run-nav";
import { RunFooter } from "@/components/run-footer";
import { ObservationsTable } from "@/components/observations-table";
import { RunLoading, RunError } from "@/components/states";

export default function FindingsPage() {
  const { id } = useParams<{ id: string }>();
  const { run, error } = useRun(id);

  if (error) return <RunError msg={error} />;
  if (!run) return <RunLoading />;

  return (
    <>
      <RunNav runId={run.id} current="findings" findingsReady={run.playsDone >= 1 || run.status !== "running"} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight text-ink">Findings</h1>
        <ObservationsTable run={run} />
      </main>
      <RunFooter runId={run.id} agentName={run.agentName} ts={run.endedAt ?? run.startedAt} />
    </>
  );
}
