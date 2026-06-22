"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { MinimalBar } from "@/components/minimal-bar";
import { StopRunButton } from "@/components/stop-run-button";
import { listRuns, type RunSummary } from "@/lib/api";
import { getRole } from "@/lib/role";
import { fmtIST } from "@/lib/time";

const STATUS_STYLE: Record<string, string> = {
  running: "text-fail-text",
  completed: "text-pass-text",
  failed: "text-fail-text",
};

export default function RunsIndexPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [err, setErr] = useState<string>("");

  const load = useCallback(() => {
    listRuns()
      .then((d) => setRuns(d.runs))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Row destination is persona-aware (matches each role's home), engine-backed for the live duel.
  // pending-approval runs go to the run page rather than a results view.
  function openRun(r: RunSummary) {
    const role = getRole();
    if (r.pendingApproval) { router.push(`/runs/${r.id}`); return; }
    if (role === "admin" || role === "security") router.push(`/runs/${r.id}/arena`);
    else if (role === "compliance") router.push(`/runs/${r.id}/findings`);
    else router.push(`/runs/${r.id}`);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <MinimalBar showRuns />
      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Runs</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">Every audit you&apos;ve started — newest first. Open one to view its live duel, findings or report.</p>
          </div>
          <Link href="/new" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-3.5 text-[13px] font-medium text-on-brand hover:bg-brand-strong">
            <Plus className="h-4 w-4" strokeWidth={1.75} /> New audit
          </Link>
        </div>

        {err && <p className="mt-6 text-[13px] text-fail-text">Could not load runs: {err}</p>}
        {!runs && !err && <p className="mt-6 text-[13px] text-ink-muted">Loading runs…</p>}
        {runs && runs.length === 0 && (
          <div className="mt-6 rounded-md border border-border bg-surface px-4 py-10 text-center text-[13px] text-ink-muted">
            No runs yet. <Link href="/new" className="text-brand hover:underline">Start your first audit →</Link>
          </div>
        )}

        {runs && runs.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-md border border-border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-sunk text-[11px] uppercase tracking-wide text-ink-muted">
                  <Th>Status</Th>
                  <Th className="min-w-[14rem]">Target</Th>
                  <Th>Intensity</Th>
                  <Th>Plays</Th>
                  <Th>Started</Th>
                  <Th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open run ${r.id}`}
                    onClick={() => openRun(r)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRun(r); } }}
                    className="cursor-pointer border-t border-border bg-surface hover:bg-surface-sunk focus-visible:bg-surface-sunk"
                  >
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 text-[12px] ${STATUS_STYLE[r.status] ?? "text-ink-muted"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${r.status === "running" ? "animate-pulse bg-fail" : r.status === "completed" ? "bg-pass" : "bg-ink-faint"}`} />
                        {r.pendingApproval ? "pending approval" : r.status}
                      </span>
                    </Td>
                    <Td>
                      <div className="text-[13px] text-ink">{r.agentName}</div>
                      <div className="mono text-[11px] text-ink-faint truncate max-w-[22rem]">{r.targetUrl}</div>
                    </Td>
                    <Td><span className="mono text-[12px] text-ink-muted">{r.intensity ?? "—"}</span></Td>
                    <Td><span className="mono tnum text-[12px] text-ink-muted">{r.playsDone} / {r.playsTotal}</span></Td>
                    <Td><span className="mono text-[11.5px] text-ink-muted">{fmtIST(r.startedAt)}</span></Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "running" && !r.pendingApproval ? <StopRunButton runId={r.id} onStopped={load} size="sm" /> : null}
                        <ChevronRight className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={`px-3 py-2 font-semibold ${className ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className ?? ""}`}>{children}</td>;
}
