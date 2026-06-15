"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Radio } from "lucide-react";
import { useRun } from "@/lib/use-run";
import { OutcomeBadge, ModuleTag, SeverityChip } from "@/components/badges";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const PHASES = ["Recon", "Running plays", "Classifying", "Compiling findings"] as const;

export function ProcessingView({ runId }: { runId: string }) {
  const router = useRouter();
  const { run, error, stalled } = useRun(runId, 1800); // poll until status leaves "running"
  const [elapsed, setElapsed] = useState(0);
  const navigated = useRef(false);

  useEffect(() => {
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(clock);
  }, []);

  const finished = run != null && run.status !== "running";
  useEffect(() => {
    if (finished && !navigated.current) {
      navigated.current = true;
      const t = setTimeout(() => router.push(`/runs/${runId}`), 1100);
      return () => clearTimeout(t);
    }
  }, [finished, router, runId]);

  const total = run?.playsTotal ?? 0;
  const done = Math.min(run?.playsDone ?? 0, total || (run?.playsDone ?? 0));
  const feed = run?.observations ?? [];
  const phaseIdx = !run ? 0 : finished ? 3 : done === 0 ? 0 : 1;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-13 max-w-4xl items-center px-5 py-2.5">
          <Logo />
          <span className="ml-3 mono text-[12px] text-ink-muted">
            {stalled ? "stalled" : finished ? "completing" : "live"} · {runId.slice(0, 8)}
          </span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Auditing target</h1>
            <p className="mono mt-0.5 text-[12px] text-ink-muted">{run?.agentName ?? "AARAV NBFC voice agent"}</p>
          </div>
          <div className="text-right">
            <div className="mono tnum text-2xl font-semibold text-ink">{done} / {total || "—"}</div>
            <div className="text-[11px] text-ink-muted">plays complete · {fmt(elapsed)}</div>
          </div>
        </div>

        {/* phase rail */}
        <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PHASES.map((p, i) => {
            const state = i < phaseIdx ? "done" : i === phaseIdx ? "active" : "todo";
            return (
              <li
                key={p}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
                  state === "active"
                    ? "border-brand/50 bg-brand-soft text-ink"
                    : state === "done"
                      ? "border-border bg-surface text-ink-muted"
                      : "border-border bg-surface text-ink-faint"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5 text-pass" strokeWidth={2} />
                ) : state === "active" ? (
                  <span className="phase-pulse h-2 w-2 rounded-full bg-brand" aria-hidden />
                ) : (
                  <span className="h-3.5 w-3.5" />
                )}
                {p}
              </li>
            );
          })}
        </ol>

        {/* live findings feed */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <Radio className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> Live findings
          </div>
          <div className="mt-2 space-y-1.5" aria-live="polite" aria-label="Live findings feed">
            {error && <p className="text-[12.5px] text-fail-text">Could not load run: {error}</p>}
            {stalled && !error && (
              <p className="text-[12.5px] text-ink-muted">
                Awaiting approval or run stalled — no progress detected. Check the run status on the runs list.
              </p>
            )}
            {!error && !stalled && feed.length === 0 && (
              <p className="text-[12.5px] text-ink-muted">Probing the agent… findings will appear here as plays complete.</p>
            )}
            {feed.map((o) => (
              <div key={o.id} className="reveal flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
                <OutcomeBadge outcome={o.outcome} />
                <span className="mono text-[11px] text-ink-muted">{o.id}</span>
                <span className="flex-1 truncate text-[12.5px] text-ink">{o.title}</span>
                <ModuleTag module={o.module} />
                <SeverityChip severity={o.severity} />
              </div>
            ))}
          </div>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {stalled
            ? "Run stalled or awaiting approval."
            : finished
              ? "Run complete. Opening report."
              : `${done} of ${total || "unknown"} plays complete.`}
        </p>

        {finished && (
          <p className="mt-6 text-center text-[12.5px] text-ink-muted">Compiling findings — opening report…</p>
        )}
      </div>
    </main>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
