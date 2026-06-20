"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Arena from "@/components/live/arena";
import { fromStateJson, type RunView } from "@/lib/runview";
import { getRunView } from "@/lib/api";
import { RunNav } from "@/components/live/run-nav";
import { getRole, canSeeLive, screenHref, type Role } from "@/lib/role";

const SAMPLES = ["both-pillar-live", "both-pillar-full", "recon-demo", "estimate-demo", "live-8play", "fixture-3play", "midrun", "degraded"] as const;

export default function ArenaPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const data = search.get("data") ?? "live-8play";
  const runId = String(params?.id ?? "ER-LIVE");
  const isEngine = data === "engine";              // real server-side RunView (Wave 2); else a fixture / dev-bridge
  const livePoll = isEngine || search.get("live") === "1"; // poll the source as the run streams (D-Q15 2500ms)
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let iv: ReturnType<typeof setInterval> | undefined;
    setRun(null); setErr(null);
    // engine source → getRunView(id); else fixture/dev-bridge → fetch + fromStateJson (R1-B2: one shared adapter)
    const loadOne = (): Promise<RunView> =>
      isEngine
        ? getRunView(runId)
        : fetch(`/runs/${data}.json`, { cache: "no-store" })
            .then((r) => { if (!r.ok) throw new Error(`load ${data} failed`); return r.json(); })
            .then((raw) => fromStateJson(raw, runId));
    const load = () =>
      loadOne()
        .then((rv) => {
          if (!active) return;
          setRun(rv); setErr(null);
          const terminal = rv.status === "done" || rv.status === "failed" || rv.status === "blocked";
          if (livePoll && terminal && iv) { clearInterval(iv); iv = undefined; }
        })
        .catch((e) => {
          if (!active) return;
          if (isEngine && /401|unauthor/i.test(String(e))) setErr("Log in to view the live run.");
          else if (!livePoll) setErr(String(e));   // transient poll miss mid-stream is fine
        });
    load();
    if (livePoll) iv = setInterval(load, 2500);
    return () => { active = false; if (iv) clearInterval(iv); };
  }, [data, runId, livePoll, isEngine]);

  // access gate: V2/V3 restricted to Admin/QA + Security (role read client-side; null until mounted)
  const [role, setRoleState] = useState<Role | null>(null);
  useEffect(() => setRoleState(getRole()), []);
  const restricted = role !== null && !canSeeLive(role);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <RunNav runId={runId} current="live" runLabel={run?.id} target={run?.target || undefined} data={data} />
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

      {/* Live sub-bar — the live-duel-specific controls (zoom · Arena⇄Processing · sample · badges) */}
      <div className="sticky top-14 z-10 flex items-center gap-2.5 px-5 min-h-11 py-1.5 border-b border-border bg-surface/60 backdrop-blur flex-wrap">
        <span className="text-ink-faint text-[10.5px] mono uppercase tracking-[0.13em]">live duel</span>
        {run?.intensity ? <span className="mono text-[11px] text-ink-muted">intensity · <span className="text-ink">{run.intensity}</span></span> : null}
        {livePoll && run ? (
          run.status === "done" || run.status === "failed" || run.status === "blocked"
            ? <span className="mono text-[11px] text-ink-faint inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />run complete</span>
            : <span className="mono text-[11px] inline-flex items-center gap-1.5" style={{ color: "var(--fail-text)" }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--fail)" }} />LIVE</span>
        ) : null}
        {livePoll && !isEngine ? <span className="mono text-[10px] uppercase tracking-wide text-warn-text border border-warn-text/40 rounded px-1.5 py-0.5" title="Dev bridge: the engine run is real, but login + scan are mocked and the ROE-approval gate is skipped. Previews the parked engine port (D-LV26).">dev bridge</span> : null}
        {isEngine ? <span className="mono text-[10px] uppercase tracking-wide text-ink-faint border border-border rounded px-1.5 py-0.5" title="Live from the engine — GET /console/runs/{id}/runview (D-LV-dep3)">engine</span> : null}
        <span className="flex-1" />
        {/* zoom: Arena(V2) · Detail(V3) — Glance(V1) removed until V1 ships (PX-1, D-LV23) */}
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 bg-surface-sunk text-ink font-medium">Arena</span>
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => run && router.push(`/runs/${params?.id}/arena/${run.plays.find((p) => p.status === "done")?.idx ?? 0}/forensic?data=${data}`)}>Detail</button>
        </span>
        {/* Arena ⇄ Processing — the classic live screen (C4); temporary, OPEN-LV1 */}
        <button className="text-[11px] mono text-ink-muted border border-border rounded-md px-2.5 py-1 hover:border-brand inline-flex items-center gap-1" title="the classic Processing screen (C4) — temporary while V2-vs-C4 is unresolved (OPEN-LV1)" onClick={() => router.push(`/runs/${params?.id}/processing`)}>Processing ↗</button>
        {/* sample switcher (build/test aid, OPEN-LV3 / PX-2) — dev-only: visible in the review server, gone in a production build */}
        {process.env.NODE_ENV !== "production" ? (
          <select value={data} onChange={(e) => router.replace(`?data=${e.target.value}`)} className="mono text-[11px] bg-surface border border-border rounded-md px-2 py-1 text-ink-muted">
            {SAMPLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : null}
      </div>

      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {!run && !err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading {data}…</div> : null}
      {run ? <Arena run={run} onDrillToV3={(idx) => router.push(`/runs/${params?.id}/arena/${idx}/forensic?data=${data}`)} /> : null}
      </>
      )}
    </div>
  );
}
