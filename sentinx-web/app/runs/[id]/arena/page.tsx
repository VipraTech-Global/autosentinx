"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Arena from "@/components/live/arena";
import { type RunView } from "@/lib/runview";
import { getRunView } from "@/lib/api";
import { RunNav } from "@/components/live/run-nav";
import { StopRunButton } from "@/components/stop-run-button";
import { getRole, canSeeLive, screenHref, type Role } from "@/lib/role";

export default function ArenaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const runId = String(params?.id ?? "");
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Real runs are ALWAYS engine-backed: poll the server RunView until the run reaches a terminal
  // status. Canned demos are NOT served here — they live on /canned-examples (off this nav).
  useEffect(() => {
    let active = true;
    let loaded = false;            // has a poll ever populated run? a first-load error must surface, not spin forever (CR-P2b)
    let iv: ReturnType<typeof setInterval> | undefined;
    setRun(null); setErr(null);
    const load = () =>
      getRunView(runId)
        .then((rv) => {
          if (!active) return;
          loaded = true;
          setRun(rv); setErr(null);
          const terminal = rv.status === "done" || rv.status === "failed" || rv.status === "blocked";
          if (terminal && iv) { clearInterval(iv); iv = undefined; }
        })
        .catch((e) => {
          if (!active) return;
          if (/401|unauthor/i.test(String(e))) setErr("Log in to view the live run.");
          else if (!loaded) setErr(String(e));   // first-load hard error (404/500/network) must surface (CR-P2b)
          // else: a transient poll miss mid-stream is fine — keep the last good frame
        });
    load();
    iv = setInterval(load, 1000); // 1s poll → the in-memory live cursor (queued + streaming turns) surfaces near-instantly
    return () => { active = false; if (iv) clearInterval(iv); };
  }, [runId]);

  // access gate (client-side until backend RBAC lands; open to all today — see lib/role.ts)
  const [role, setRoleState] = useState<Role | null>(null);
  useEffect(() => setRoleState(getRole()), []);
  const restricted = role !== null && !canSeeLive(role);
  const firstPlayIdx = (run?.plays.find((p) => p.status === "done") ?? run?.plays[0])?.idx ?? 0;
  const terminal = run ? (run.status === "done" || run.status === "failed" || run.status === "blocked") : false;
  // Findings/Report unlock once the first attack has produced a result; Detail (V3) unlocks once the
  // first play has STARTED (before that there is only recon, nothing to drill into).
  const findingsReady = !!run && (run.summary.done >= 1 || terminal);
  const playsStarted = !!run && (run.plays.some((p) => p.status === "running" || p.status === "judging" || p.status === "done") || terminal);
  const detailIdx = (run?.plays.find((p) => p.status === "done") ?? run?.plays.find((p) => p.status === "running" || p.status === "judging"))?.idx ?? 0;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <RunNav runId={runId} current="live" runLabel={run?.id} target={run?.target || undefined} firstPlayIdx={firstPlayIdx} findingsReady={findingsReady} />
      {role === null ? (
        <div className="max-w-[700px] mx-auto mt-24 text-center mono text-ink-faint text-[12px]">resolving access…</div>
      ) : restricted ? (
        <div className="max-w-[620px] mx-auto mt-24 text-center px-6">
          <div className="text-[15px] font-semibold text-ink">The live duel is restricted</div>
          <div className="mono text-[12.5px] text-ink-muted mt-2">View 2 (Arena) and View 3 (Forensic) are visible only to <b className="text-ink">Admin / QA</b> and <b className="text-ink">Security</b>. Switch role above, or:</div>
          <a href={screenHref("overview", runId)} className="inline-block mt-4 text-[12px] mono text-brand hover:underline">go to your Overview →</a>
        </div>
      ) : (
      <>

      {/* Live sub-bar — the live-duel-specific controls (zoom · Arena⇄Processing · live status) */}
      <div className="sticky top-14 z-10 flex items-center gap-2.5 px-5 min-h-11 py-1.5 border-b border-border bg-surface/60 backdrop-blur flex-wrap">
        <span className="text-ink-faint text-[10.5px] mono uppercase tracking-[0.13em]">live duel</span>
        {run?.intensity ? <span className="mono text-[11px] text-ink-muted">intensity · <span className="text-ink">{run.intensity}</span></span> : null}
        {run ? (
          terminal
            ? <span className="mono text-[11px] text-ink-faint inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />run complete</span>
            : <span className="mono text-[11px] inline-flex items-center gap-1.5" style={{ color: "var(--fail-text)" }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--fail)" }} />LIVE</span>
        ) : null}
        <span className="flex-1" />
        {/* Stop the run — only while it is live (post-approval, pre-completion) */}
        {run && !terminal ? <StopRunButton runId={runId} size="sm" /> : null}
        {/* view-switcher: Arena(V2) · Detail(V3) · Passive — Detail gated until the first play has STARTED
            (only recon before that); Passive is the phase-rail/processing view, now a peer toggle segment */}
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 bg-brand text-on-brand font-medium">Arena</span>
          {playsStarted ? (
            <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => router.push(`/runs/${params?.id}/arena/${detailIdx}/forensic`)}>Detail</button>
          ) : (
            <span aria-disabled="true" title="Available once the first attack starts" className="px-2.5 py-1 text-ink-faint border-l border-border opacity-40 cursor-not-allowed select-none">Detail</span>
          )}
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => router.push(`/runs/${runId}/processing`)}>Passive</button>
        </span>
      </div>

      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {!run && !err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading live run…</div> : null}
      {run ? <Arena run={run} onDrillToV3={(idx) => router.push(`/runs/${params?.id}/arena/${idx}/forensic`)} /> : null}
      </>
      )}
    </div>
  );
}
