"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Arena from "@/components/live/arena";
import { fromStateJson, type RunView } from "@/lib/runview";
import { ThemeToggle } from "@/components/theme-toggle";

const SAMPLES = ["both-pillar-live", "both-pillar-full", "recon-demo", "live-8play", "fixture-3play", "midrun", "degraded"] as const;

export default function ArenaPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const data = search.get("data") ?? "live-8play";
  const livePoll = search.get("live") === "1";   // ?live=1 → poll the source as a run streams in (D-Q15 cadence)
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let iv: ReturnType<typeof setInterval> | undefined;
    setRun(null); setErr(null);
    const load = () =>
      fetch(`/runs/${data}.json`, { cache: "no-store" })
        .then((r) => { if (!r.ok) throw new Error(`load ${data} failed`); return r.json(); })
        .then((raw) => {
          if (!active) return;
          const rv = fromStateJson(raw, String(params?.id ?? "ER-LIVE"));
          setRun(rv); setErr(null);
          const terminal = rv.status === "done" || rv.status === "failed" || rv.status === "blocked";
          if (livePoll && terminal && iv) { clearInterval(iv); iv = undefined; }
        })
        .catch((e) => { if (active && !livePoll) setErr(String(e)); }); // transient miss mid-stream is fine
    load();
    if (livePoll) iv = setInterval(load, 2500);
    return () => { active = false; if (iv) clearInterval(iv); };
  }, [data, params?.id, livePoll]);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 h-14 border-b border-border bg-bg/90 backdrop-blur">
        <span className="flex items-center gap-2 font-semibold text-[15px]">
          <span className="w-4 h-4 rounded-full border-[1.5px] border-brand relative">
            <span className="absolute inset-[-1.5px] rounded-full border-t-[1.5px] border-r-[1.5px] border-brand" style={{ borderTopColor: "transparent", animation: "phase-pulse 2.4s linear infinite" }} />
          </span>
          SENTIN<span className="text-brand">X</span>
          <span className="text-ink-faint text-[11px] font-normal">· arena (view 2)</span>
        </span>
        {run ? <span className="mono text-[12px] text-ink-muted bg-surface border border-border rounded-md px-2 py-1 truncate max-w-[280px]">{run.id} · {run.target || "—"}</span> : null}
        {livePoll && run ? (
          run.status === "done" || run.status === "failed" || run.status === "blocked"
            ? <span className="mono text-[11px] text-ink-faint inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />run complete</span>
            : <span className="mono text-[11px] inline-flex items-center gap-1.5" style={{ color: "var(--fail-text)" }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--fail)" }} />LIVE</span>
        ) : null}
        {/* honesty: this ?live=1 path is a DEV BRIDGE (engine real; auth+scan mocked) previewing the
            parked engine port D-LV26 — it must never be mistaken for the production funnel (review P1-3) */}
        {livePoll ? <span className="mono text-[10px] uppercase tracking-wide text-warn-text border border-warn-text/40 rounded px-1.5 py-0.5" title="Dev bridge: the engine run is real, but login + scan are mocked and the ROE-approval gate is skipped. Previews the parked engine port (D-LV26).">dev bridge</span> : null}
        <span className="flex-1" />
        {/* sample switcher (build/test aid) */}
        <select value={data} onChange={(e) => router.replace(`?data=${e.target.value}`)} className="mono text-[11px] bg-surface border border-border rounded-md px-2 py-1 text-ink-muted">
          {SAMPLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* zoom control (V1·V2·V3) — V1 deferred (RoadmapLock) */}
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 text-ink-faint cursor-not-allowed" title="V1 Glance — coming soon">Glance</span>
          <span className="px-2.5 py-1 bg-brand-soft text-brand border-l border-border">Arena</span>
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => run && router.push(`/runs/${params?.id}/arena/${run.plays.find((p) => p.status === "done")?.idx ?? 0}/forensic?data=${data}`)}>Detail</button>
        </span>
        <ThemeToggle />
      </header>

      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {!run && !err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading {data}…</div> : null}
      {run ? <Arena run={run} onDrillToV3={(idx) => router.push(`/runs/${params?.id}/arena/${idx}/forensic?data=${data}`)} /> : null}
    </div>
  );
}
