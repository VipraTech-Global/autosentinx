"use client";

import { useParams } from "next/navigation";
import { useRun } from "@/lib/use-run";
import { TopBar } from "@/components/top-bar";
import { RunTabs } from "@/components/run-tabs";
import { ObservationsTable } from "@/components/observations-table";
import { RunLoading, RunError } from "@/components/states";

export default function FindingsPage() {
  const { id } = useParams<{ id: string }>();
  const { run, error } = useRun(id);

  if (error) return <RunError msg={error} />;
  if (!run) return <RunLoading />;

  return (
    <>
      <TopBar run={run} />
      <RunTabs runId={run.id} findingsCount={run.observations.length} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight text-ink">Findings</h1>
        <ObservationsTable run={run} />
      </main>
    </>
  );
}
