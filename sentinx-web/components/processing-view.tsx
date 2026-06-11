"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Radio } from "lucide-react";
import { MOCK_RUN } from "@/lib/mock/run";
import { OutcomeBadge, ModuleTag, SeverityChip } from "@/components/badges";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const PHASES = ["Recon", "Running plays", "Classifying", "Compiling findings"] as const;

export function ProcessingView({ runId }: { runId: string }) {
  const router = useRouter();
  const run = MOCK_RUN;
  const total = run.playsTotal;
  const [done, setDone] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const navigated = useRef(false);

  useEffect(() => {
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    const tick = setInterval(() => {
      setDone((d) => {
        const next = Math.min(d + 1, total);
        if (next >= 2) setRevealed((r) => Math.min(r + 1, run.observations.length));
        return next;
      });
    }, 480);
    return () => {
      clearInterval(clock);
      clearInterval(tick);
    };
  }, [total, run.observations.length]);

  useEffect(() => {
    if (done >= total && !finished) {
      setRevealed(run.observations.length);
      const t = setTimeout(() => setFinished(true), 700);
      return () => clearTimeout(t);
    }
  }, [done, total, finished, run.observations.length]);

  useEffect(() => {
    if (finished && !navigated.current) {
      navigated.current = true;
      const t = setTimeout(() => router.push(`/runs/${runId}`), 1100);
      return () => clearTimeout(t);
    }
  }, [finished, router, runId]);

  const phaseIdx = done === 0 ? 0 : done < total ? 1 : finished ? 3 : 2;
  const feed = run.observations.slice(0, revealed);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-13 max-w-4xl items-center px-5 py-2.5">
          <Logo />
          <span className="ml-3 mono text-[12px] text-ink-faint">replay · {run.id}</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Auditing target</h1>
            <p className="mono mt-0.5 text-[12px] text-ink-muted">{run.targetUrl} · {run.agentName}</p>
          </div>
          <div className="text-right">
            <div className="mono tnum text-2xl font-semibold text-ink">{done} / {total}</div>
            <div className="text-[11px] text-ink-faint">plays complete · {fmt(elapsed)}</div>
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" strokeWidth={2} />
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
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            <Radio className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> Live findings
          </div>
          <div className="mt-2 space-y-1.5">
            {feed.length === 0 && (
              <p className="text-[12.5px] text-ink-faint">Probing the agent… findings will appear here as plays complete.</p>
            )}
            {feed.map((o) => (
              <div key={o.id} className="reveal flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
                <OutcomeBadge outcome={o.outcome} />
                <span className="mono text-[11px] text-ink-faint">{o.id}</span>
                <span className="flex-1 truncate text-[12.5px] text-ink">{o.title}</span>
                <ModuleTag module={o.module} />
                <SeverityChip severity={o.severity} />
              </div>
            ))}
          </div>
        </div>

        {finished && (
          <p className="mt-6 text-center text-[12.5px] text-ink-muted">
            Compiling findings — opening report…
          </p>
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
