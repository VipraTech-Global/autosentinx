"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Forensic from "@/components/live/forensic";
import { fromStateJson, humanize, type RunView } from "@/lib/runview";
import { getRunView } from "@/lib/api";
import { RunNav } from "@/components/live/run-nav";
import { getRole, canSeeLive, screenHref, type Role } from "@/lib/role";

export default function ForensicPage() {
  const params = useParams<{ id: string; playId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const data = search.get("data") ?? "live-8play";
  const playIdx = Number(params?.playId ?? 0);
  const runId = String(params?.id ?? "ER-LIVE");
  const isEngine = data === "engine";   // real server-side RunView (Wave 2); else a fixture
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    let loaded = false;            // first successful poll? a first-load engine error must surface, not spin forever (CR-P2b)
    let iv: ReturnType<typeof setInterval> | undefined;
    const loadOne = (): Promise<RunView> =>
      isEngine
        ? getRunView(runId)
        : fetch(`/runs/${data}.json`, { cache: "no-store" })
            .then((r) => { if (!r.ok) throw new Error(`load ${data} failed`); return r.json(); })
            .then((raw) => fromStateJson(raw, runId));
    const load = () => loadOne()
      .then((rv) => {
        if (!on) return;
        loaded = true;
        setRun(rv); setErr(null);
        const terminal = rv.status === "done" || rv.status === "failed" || rv.status === "blocked";
        if (isEngine && terminal && iv) { clearInterval(iv); iv = undefined; }   // engine keeps polling until terminal
      })
      .catch((e) => { if (!on) return; if (isEngine && /401|unauthor/i.test(String(e))) setErr("Log in to view the live run."); else if (!isEngine) setErr(String(e)); else if (isEngine && !loaded) setErr(String(e)); /* first-load hard error must surface (CR-P2b) */ });
    load();
    if (isEngine) iv = setInterval(load, 2500);
    return () => { on = false; if (iv) clearInterval(iv); };
  }, [data, runId, isEngine]);

  // access gate: V3 Forensic restricted to Admin/QA + Security (in-place notice, no redirect)
  const [role, setRoleState] = useState<Role | null>(null);
  useEffect(() => setRoleState(getRole()), []);
  const restricted = role !== null && !canSeeLive(role);

  const plays = run?.plays ?? [];
  const play = plays.find((p) => p.idx === playIdx) ?? null;
  const pos = plays.findIndex((p) => p.idx === playIdx);
  const prev = pos > 0 ? plays[pos - 1] : null;
  const next = pos >= 0 && pos < plays.length - 1 ? plays[pos + 1] : null;
  const forensicHref = (idx: number) => `/runs/${runId}/arena/${idx}/forensic?data=${data}`;
  const backToArena = () => router.push(`/runs/${runId}/arena?data=${data}`);
  const cap = (p: { verdict?: { productOutcome?: string } | null; status: string }) =>
    p.verdict?.productOutcome === "FAIL" ? "BREACHED" : p.status === "done" ? "HELD" : p.status;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <RunNav runId={runId} current="live" runLabel={run?.id} target={run?.target || undefined} data={data} />
      {role === null ? (
        <div className="max-w-[700px] mx-auto mt-24 text-center mono text-ink-faint text-[12px]">resolving access…</div>
      ) : restricted ? (
        <div className="max-w-[620px] mx-auto mt-24 text-center px-6">
          <div className="text-[15px] font-semibold text-ink">The forensic view is restricted</div>
          <div className="mono text-[12.5px] text-ink-muted mt-2">View 2 (Arena) and View 3 (Forensic) are visible only to <b className="text-ink">Admin / QA</b> and <b className="text-ink">Security</b>. Switch role above, or:</div>
          <a href={screenHref("overview", runId)} className="inline-block mt-4 text-[12px] mono text-brand hover:underline">go to your Overview →</a>
        </div>
      ) : (
      <>
      {/* V3 sub-bar: identity + play stepper/picker (step between forensics) + zoom back to Arena */}
      <div className="sticky top-14 z-10 flex items-center gap-2.5 px-5 min-h-11 py-1.5 border-b border-border bg-surface/60 backdrop-blur flex-wrap">
        <span className="text-ink-faint text-[10.5px] mono uppercase tracking-[0.13em]">forensic · internal</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1">
          <button disabled={!prev} onClick={() => prev && router.push(forensicHref(prev.idx))} className="px-1.5 py-1 rounded-md border border-border text-ink-muted hover:border-ink-faint disabled:opacity-40 disabled:hover:border-border" title={prev ? `prev · ${prev.id}` : "first play"} aria-label="previous play"><ChevronLeft size={14} /></button>
          <select value={plays.some((p) => p.idx === playIdx) ? playIdx : (plays[0]?.idx ?? 0)} onChange={(e) => router.push(forensicHref(Number(e.target.value)))} aria-label="jump to a play's forensic" className="mono text-[11px] bg-surface border border-border rounded-md px-2 py-1 text-ink max-w-[260px] cursor-pointer">
            {plays.map((p) => <option key={p.idx} value={p.idx}>{humanize(p.id)} · {cap(p)}</option>)}
          </select>
          <button disabled={!next} onClick={() => next && router.push(forensicHref(next.idx))} className="px-1.5 py-1 rounded-md border border-border text-ink-muted hover:border-ink-faint disabled:opacity-40 disabled:hover:border-border" title={next ? `next · ${next.id}` : "last play"} aria-label="next play"><ChevronRight size={14} /></button>
        </span>
        {/* zoom: Arena(V2) · Forensic(V3) — Glance(V1) removed until V1 ships (PX-5); active pill severity-neutral */}
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <button className="px-2.5 py-1 text-ink-muted hover:bg-surface-sunk" onClick={backToArena}>Arena</button>
          <span className="px-2.5 py-1 bg-surface-sunk text-ink font-medium border-l border-border">Forensic</span>
        </span>
      </div>
      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {run && !play ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">play {playIdx} not found</div> : null}
      {run && play ? <Forensic run={run} play={play} /> : (!err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading…</div> : null)}
      </>
      )}
    </div>
  );
}
