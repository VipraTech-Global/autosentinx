"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Radio } from "lucide-react";
import { useRun } from "@/lib/use-run";
import { getRunView } from "@/lib/api";
import { getRole } from "@/lib/role";
import { type RunView } from "@/lib/runview";
import { OutcomeBadge, ModuleTag, SeverityChip } from "@/components/badges";
import { StopRunButton } from "@/components/stop-run-button";
import { RunNav } from "@/components/live/run-nav";

const PHASES = ["Recon", "Running plays", "Classifying", "Compiling findings"] as const;

// Stage captions — keep the watcher oriented during the (legitimately slow) cold-start first
// play: the count can sit at 0–1/N for a few minutes, then jump as plays land in bursts. Honest,
// expectation-setting copy reads as "working", not "stuck".
const PHASE_HINTS = [
  "Establishing a secure session and profiling the target agent — the first step is the slowest.",
  "Running multi-turn attacks. Plays finish in bursts, so the count may pause, then jump.",
  "Scoring the transcripts with the judge panel…",
  "Compiling findings…",
] as const;

export function ProcessingView({ runId }: { runId: string }) {
  const router = useRouter();
  const { run, error, stalled } = useRun(runId, 1800); // poll until status leaves "running"
  const navigated = useRef(false);

  // Poll the RunView too, so this (Passive) view carries the SAME live sub-bar (Arena·Detail·Passive
  // toggle + LIVE indicator) as the Arena/Forensic screens — identical chrome across the live views.
  const [rv, setRv] = useState<RunView | null>(null);
  useEffect(() => {
    let on = true;
    const load = () => getRunView(runId).then((v) => { if (on) setRv(v); }).catch(() => {});
    load();
    const iv = setInterval(load, 1500);
    return () => { on = false; clearInterval(iv); };
  }, [runId]);

  const finished = run != null && run.status !== "running";

  // Server-anchored elapsed: derive from the run's start (approved_at→created_at; console.py),
  // so it survives a refresh and tracks backend truth instead of a mount-based counter, and
  // freezes once the run leaves "running". NOTE: the frozen value is client wall-clock to the
  // moment of completion — the authoritative server duration (durationSec) is DEFERRED
  // (issue #3: backend ended_at not yet recorded), so we anchor on startedAt only for now.
  const startedMs = toEpochMs(run?.startedAt);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startedMs == null) return;
    const update = () => setElapsed(Math.max(0, Math.round((Date.now() - startedMs) / 1000)));
    update();
    if (finished) return; // freeze the clock once the run leaves "running"
    const clock = setInterval(update, 1000);
    return () => clearInterval(clock);
  }, [startedMs, finished]);
  useEffect(() => {
    if (finished && !navigated.current) {
      navigated.current = true;
      // Land each persona on their home screen (Admin/Security → live Arena, Compliance → Findings,
      // Exec/other → Overview). Access is open to all today; this is the default landing only.
      const role = getRole();
      const dest =
        role === "admin" || role === "security" ? `/runs/${runId}/arena`
        : role === "compliance" ? `/runs/${runId}/findings`
        : `/runs/${runId}`;
      const t = setTimeout(() => router.push(dest), 1100);
      return () => clearTimeout(t);
    }
  }, [finished, router, runId]);

  const total = run?.playsTotal ?? 0;
  const done = Math.min(run?.playsDone ?? 0, total || (run?.playsDone ?? 0));
  const feed = run?.observations ?? [];
  // Phase rail from the only signals the backend exposes (status, playsDone, playsTotal):
  // Recon while no play has completed yet (recon + the first play in flight), Running plays as
  // plays land, Classifying once all plays are in but status is still running, Compiling at
  // finish. Polling self-recovers now (use-run), so Recon advances instead of getting stuck.
  const phaseIdx = !run ? 0 : finished ? 3 : done === 0 ? 0 : total > 0 && done >= total ? 2 : 1;

  // live sub-bar values, derived from the RunView poll
  const plays = rv?.plays ?? [];
  const rterminal = rv ? ["done", "failed", "blocked"].includes(rv.status) : finished;
  const playsStarted = plays.some((p) => p.status === "running" || p.status === "judging" || p.status === "done") || rterminal;
  const detailIdx = (plays.find((p) => p.status === "running" || p.status === "judging") ?? plays.find((p) => p.status === "done") ?? plays.find((p) => p.status !== "queued"))?.idx ?? 0;
  const firstPlayIdx = (plays.find((p) => p.status === "done") ?? plays.find((p) => p.status !== "queued") ?? plays[0])?.idx ?? 0;
  const findingsReady = (run?.playsDone ?? 0) >= 1 || (run != null && run.status !== "running");

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <RunNav runId={runId} current="live" runLabel={rv?.id} target={rv?.target || undefined} firstPlayIdx={firstPlayIdx} findingsReady={findingsReady} />
      {/* live sub-bar — identical to Arena/Forensic; Passive is the active toggle segment */}
      <div className="sticky top-14 z-10 flex items-center gap-2.5 px-5 min-h-11 py-1.5 border-b border-border bg-surface/60 backdrop-blur flex-wrap">
        <span className="text-ink-faint text-[10.5px] mono uppercase tracking-[0.13em]">live duel</span>
        {rv?.intensity ? <span className="mono text-[11px] text-ink-muted">intensity · <span className="text-ink">{rv.intensity}</span></span> : null}
        {rterminal
          ? <span className="mono text-[11px] text-ink-faint inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />run complete</span>
          : <span className="mono text-[11px] inline-flex items-center gap-1.5" style={{ color: "var(--fail-text)" }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--fail)" }} />LIVE</span>}
        <span className="flex-1" />
        {!finished ? <StopRunButton runId={runId} size="sm" /> : null}
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <button className="px-2.5 py-1 text-ink-muted hover:bg-surface-sunk" onClick={() => router.push(`/runs/${runId}/arena`)}>Arena</button>
          {playsStarted ? (
            <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => router.push(`/runs/${runId}/arena/${detailIdx}/forensic`)}>Detail</button>
          ) : (
            <span aria-disabled="true" title="Available once the first attack starts" className="px-2.5 py-1 text-ink-faint border-l border-border opacity-40 cursor-not-allowed select-none">Detail</span>
          )}
          <span className="px-2.5 py-1 bg-brand text-on-brand font-medium border-l border-border">Passive</span>
        </span>
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 py-10">
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

        {!finished && (
          <p className="mt-3 text-center text-[12.5px] text-ink-muted">{PHASE_HINTS[phaseIdx]}</p>
        )}

        {/* live findings feed */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <Radio className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> Live findings
          </div>
          <div className="mt-2 space-y-1.5" aria-live="polite" aria-label="Live findings feed">
            {error && <p className="text-[12.5px] text-fail-text">Could not load run: {error}</p>}
            {stalled && !error && feed.length === 0 && (
              <p className="text-[12.5px] text-ink-muted">
                Still working — this is taking longer than usual. The page updates automatically as plays complete.
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
            ? "Still working; this is taking longer than usual."
            : finished
              ? "Run complete. Opening report."
              : `${done} of ${total || "unknown"} plays complete.`}
        </p>

        {finished && (
          <p className="mt-6 text-center text-[12.5px] text-ink-muted">Compiling findings — opening report…</p>
        )}
      </div>
    </div>
  );
}

// Backend timestamps are naive UTC (models.py _now() strips tzinfo → no offset), so a bare
// "2026-06-17T05:00:00" would be parsed by Date as LOCAL time and inflate elapsed by the
// browser's UTC offset. Force UTC interpretation when the string carries no zone designator.
function toEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(iso);
  const t = new Date(hasZone ? iso : `${iso}Z`).getTime();
  return Number.isNaN(t) ? null : t;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
