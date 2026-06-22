"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Arena from "@/components/live/arena";
import Forensic from "@/components/live/forensic";
import { fromStateJson, type RunView } from "@/lib/runview";
import { MinimalBar } from "@/components/minimal-bar";

// Canned demo runs — captured / simulated RunView fixtures (public/canned/*.json) used for design
// review and screenshots. They are NOT real audits, and live OUTSIDE the /runs namespace so the
// auth proxy (which gates /runs/*) never touches them and no real-run screen can reach them.
// Dev/review only — hidden in a production build so a customer can never land on a demo by accident.
const SAMPLES = ["both-pillar-live", "both-pillar-full", "recon-demo", "estimate-demo", "live-8play", "fixture-3play", "midrun", "degraded"] as const;

export default function CannedExamplesPage() {
  const isProd = process.env.NODE_ENV === "production";
  const [sample, setSample] = useState<string>("both-pillar-full");
  const [playIdx, setPlayIdx] = useState<number | null>(null);
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isProd) return;
    let on = true;
    setRun(null); setErr(null); setPlayIdx(null);
    fetch(`/canned/${sample}.json`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`load ${sample} failed`); return r.json(); })
      .then((raw) => { if (on) setRun(fromStateJson(raw, `DEMO-${sample}`)); })
      .catch((e) => { if (on) setErr(String(e)); });
    return () => { on = false; };
  }, [sample, isProd]);

  if (isProd) {
    return (
      <main className="flex min-h-screen flex-col">
        <MinimalBar />
        <div className="flex flex-1 items-center justify-center px-5 text-center">
          <p className="text-[13px] text-ink-muted">Canned demo examples are available in development builds only.</p>
        </div>
      </main>
    );
  }

  const play = playIdx != null ? (run?.plays.find((p) => p.idx === playIdx) ?? null) : null;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <MinimalBar />
      {/* Loud, permanent banner so a demo screen can never be mistaken for a real audit. */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-2 border-b border-warn-text/50 bg-surface-sunk flex-wrap">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-warn-text">Demo example — not a real run</span>
        <span className="text-[11.5px] text-ink-muted">Captured / simulated fixtures for design review. To audit a real agent, start a run from <Link href="/new" className="text-brand hover:underline">New audit</Link>.</span>
        <span className="flex-1" />
        <label className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span>example</span>
          <select value={sample} onChange={(e) => setSample(e.target.value)} aria-label="pick a demo example" className="mono text-[11px] bg-surface border border-border rounded-md px-2 py-1 text-ink cursor-pointer">
            {SAMPLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {play ? (
          <button onClick={() => setPlayIdx(null)} className="text-[11px] mono text-ink-muted border border-border rounded-md px-2.5 py-1 hover:border-brand">← Arena</button>
        ) : null}
      </div>
      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {!run && !err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading {sample}…</div> : null}
      {run && play ? <Forensic run={run} play={play} /> : run ? <Arena run={run} onDrillToV3={(idx) => setPlayIdx(idx)} /> : null}
    </div>
  );
}
