"use client";
// V2 ARENA — the live duel. Ladder / Telegraph / Overturn (v2-concept-LTO).
// Calm-instrument skin (DESIGN.md): severity-only colour, line icons, dual-theme, WCAG AA.
// The frame-ribbon (per-turn label SEQUENCE) is the spine — NOT a depth axis (D-LV15).
import { useMemo, useState } from "react";
import {
  Crosshair, Shield, ShieldCheck, ShieldOff, ChevronsRight, CornerDownRight,
  GitCompare, Scale, Award, Radar, AlertTriangle, ChevronRight, Check, X,
  CircleSlash, Loader2, RotateCcw, Repeat,
} from "lucide-react";
import {
  type RunView, type PlayView, type Band, type CellKind,
  bands, pickFocus, telegraph, breachPointPhase, judgeMeta, outcomeToken, blockCause,
} from "@/lib/runview";
import type { Severity } from "@/lib/types";

// redundant non-colour severity glyph (DESIGN.md §5)
function Sev({ s }: { s: Severity }) {
  const cls = "inline-block w-2.5 h-2.5 align-middle";
  const m: Record<Severity, React.ReactNode> = {
    critical: <span className={cls} style={{ background: "var(--sev-critical)" }} />,
    high: <span className={cls} style={{ background: "var(--sev-high)", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />,
    medium: <span className={cls} style={{ background: "var(--sev-medium)", clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />,
    low: <span className="inline-block w-2.5 h-2.5 rounded-full border align-middle" style={{ borderColor: "var(--sev-low)" }} />,
  };
  return <span title={`severity ${s}`} aria-label={`severity ${s}`}>{m[s]}</span>;
}

// the frame-ribbon cell — ink-only by SHAPE; yielded is a STRUCK (additive) cell, not empty.
function Cell({ k, lg }: { k: CellKind; lg?: boolean }) {
  const titles: Record<CellKind, string> = { held: "held", wavered: "wavered", yielded: "the agent gave the line (advisory)", unknown: "unknown" };
  return <span className={`cell cell-${k}${lg ? " cell-lg" : ""}`} title={titles[k]} />;
}

function StripLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] mono text-ink-faint">
      <span>per-turn defence (advisory · not the ruling):</span>
      <span className="flex items-center gap-1"><Cell k="held" />held</span>
      <span className="flex items-center gap-1"><Cell k="wavered" />wavered</span>
      <span className="flex items-center gap-1"><Cell k="yielded" />gave the line</span>
    </div>
  );
}

// verdict cap — line icons, --fail/--pass only here (a real settled ruling)
function VerdictCap({ p }: { p: PlayView }) {
  if (p.status === "blocked" || p.status === "error")
    return <span className="inline-flex items-center gap-1 text-[10px] mono text-ink-faint"><CircleSlash size={12} />not assessed</span>;
  if (p.status !== "done")
    return <span className="inline-flex items-center gap-1 text-[10px] mono text-brand"><Loader2 size={12} className="animate-spin" />{p.status === "judging" ? "judging" : p.status === "running" ? "live" : "queued"}</span>;
  const o = p.verdict?.productOutcome;
  if (o === "FAIL") {
    const fork = p.verdict?.gateDelta?.disagree;
    return <span className="inline-flex items-center gap-1 text-[11px] mono font-bold" style={{ color: "var(--fail-text)" }}>{fork ? <GitCompare size={13} /> : <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "var(--fail)" }} />}BREACHED{fork ? <span className="text-[9px] font-normal text-ink-faint">gate split</span> : null}</span>;
  }
  if (o === "PASS") return <span className="inline-flex items-center gap-1 text-[11px] mono font-bold" style={{ color: "var(--pass-text)" }}><ShieldCheck size={13} />HELD</span>;
  return <span className="text-[11px] mono">{o}</span>;
}

// one ladder row (the frame-ribbon, compact)
function Ribbon({ p, focused, onFocus }: { p: PlayView; focused: boolean; onFocus: () => void }) {
  const fail = p.verdict?.productOutcome === "FAIL";
  const crit = fail && p.severity === "critical";
  return (
    <button onClick={onFocus} aria-pressed={focused}
      className={`group w-full text-left rounded-md border px-3 py-2 transition-colors ${focused ? "border-brand bg-brand-soft/30" : "border-border bg-surface hover:border-brand"}`}
      style={crit ? { boxShadow: "inset 3px 0 0 var(--sev-critical)" } : fail ? { boxShadow: "inset 3px 0 0 var(--fail)" } : p.verdict?.productOutcome === "PASS" ? { boxShadow: "inset 3px 0 0 color-mix(in srgb,var(--pass) 55%,transparent)" } : undefined}>
      <div className="flex items-center gap-2 flex-wrap">
        <Sev s={p.severity} />
        <span className="mono text-xs text-ink truncate max-w-[210px]">{p.id}</span>
        {p.severity === "critical" && p.verdict?.productOutcome === "PASS" ? <Award size={13} className="text-metric" /> : null}
        <span className="flex-1" />
        <VerdictCap p={p} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        {p.turns.length ? p.turns.map((t, i) => <Cell key={i} k={t.cell} />)
          : (p.status === "blocked" || p.status === "error") ? <span className="text-[10px] mono text-ink-faint border-b border-dashed border-ink-faint">— not assessed —</span>
          : <span className="text-[10px] mono text-ink-faint">queued…</span>}
      </div>
    </button>
  );
}

function BandView({ b, focusIdx, onFocus }: { b: Band; focusIdx: number | null; onFocus: (i: number) => void }) {
  return (
    <section className="mb-4">
      <div className="flex items-baseline gap-2 mb-1.5">
        <h3 className="text-[10px] uppercase tracking-[0.13em] text-ink-faint font-semibold">{b.pillar}</h3>
        <span className="text-[11px] mono text-ink-muted">withstood <b className="text-ink tnum">{b.withstood}/{b.graded || 0}</b></span>
        <span className="flex-1 border-b border-border self-center ml-1" />
      </div>
      {b.plays.length ? <div className="grid gap-1.5">{b.plays.map((p) => <Ribbon key={p.idx} p={p} focused={focusIdx === p.idx} onFocus={() => onFocus(p.idx)} />)}</div>
        : <p className="text-[11px] mono text-ink-faint italic py-1">no {b.pillar} attacks in this run</p>}
    </section>
  );
}

function CombatantHeader({ p }: { p: PlayView }) {
  return (
    <div className="flex items-start gap-3 flex-wrap px-4 py-3 border-b border-border">
      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold text-[15px] text-ink">{p.title}</div>
        <div className="mono text-[11px] text-ink-faint">{p.id} · {p.pillar}</div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border" style={{ color: `var(--sev-${p.severity}-text)`, borderColor: `var(--sev-${p.severity})` }}><Sev s={p.severity} />{p.severity}</span>
          {(p.regulation ?? []).map((r, i) => <span key={i} className="text-[10px] mono text-brand bg-brand-soft rounded-[3px] px-1.5 py-0.5">{r.framework} {r.control_id}</span>)}
        </div>
      </div>
      <div className="text-right pl-3 border-l-2" style={{ borderColor: "var(--border)" }}>
        <div className="text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">vs · attacker</div>
        <div className="flex items-center justify-end gap-1.5 font-semibold text-[13.5px] text-ink"><Crosshair size={14} className="text-ink-muted" />{p.technique}</div>
        <div className="text-[10.5px] mono text-ink-muted mt-0.5">as · {p.persona}</div>
      </div>
    </div>
  );
}

// FOCAL = the same frame-ribbon EXPANDED into intent-labelled phase groups + telegraph ghost.
// No numbered node-stepper (D-LV15/LV-concept): the cell sequence IS the spine.
function FocalRibbon({ p }: { p: PlayView }) {
  const tg = telegraph(p);
  const breachPhase = breachPointPhase(p);
  const reached = new Set(p.arc.map((a) => a.phase));
  const beatTo: Record<string, PlayView["beats"][number]> = {};
  p.beats.forEach((b) => (beatTo[b.toPhase] = b));
  const turnsByPhase: Record<string, typeof p.turns> = {};
  p.turns.forEach((t) => (turnsByPhase[t.phase] ??= []).push(t));
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-stretch gap-4 overflow-x-auto pb-1">
        {p.phasePlan.map((ph) => {
          const isReached = reached.has(ph.name);
          const cells = turnsByPhase[ph.name] ?? [];
          const beat = beatTo[ph.name];
          const isBreach = breachPhase === ph.name;
          return (
            <div key={ph.name} className="min-w-[150px] flex flex-col gap-1.5">
              {beat ? (
                <div className="text-[8.5px] mono text-ink-muted flex items-center gap-0.5 h-3">{beat.trigger === "conceded" ? <><CornerDownRight size={10} />the agent yielded</> : <><ChevronsRight size={10} />advanced</>}</div>
              ) : <div className="h-3" />}
              <div className="text-[12px] font-semibold text-ink leading-tight" style={{ color: isReached ? undefined : "var(--ink-faint)" }}>{ph.intent || ph.name}</div>
              <div className="mono text-[9px] text-ink-faint">{ph.name}</div>
              <div className="flex gap-1 flex-wrap min-h-[12px]">
                {isReached ? cells.map((t) => <Cell key={t.idx} k={t.cell} lg />) : <span className="text-[9.5px] mono text-ink-faint italic">not reached</span>}
              </div>
              {isBreach ? <div className="text-[9px] mono text-ink-muted flex items-center gap-1"><ShieldOff size={11} />breach point — classifier pivot (advisory)</div> : null}
            </div>
          );
        })}
        {tg ? (
          <div className="min-w-[150px] flex flex-col gap-1.5 opacity-45 border-l border-dashed border-ink-faint pl-3">
            <div className="h-3" />
            <div className="text-[12px] font-semibold text-ink-muted italic leading-tight">{tg.intent || tg.name}</div>
            <div className="mono text-[9px] text-ink-faint">{tg.name}</div>
            <div className="text-[8.5px] mono text-ink-faint">⟶ planned next move</div>
          </div>
        ) : null}
      </div>
      <div className="mt-2.5"><StripLegend /></div>
      {p.status === "done" ? (
        <div className="text-[10.5px] mono mt-1.5 text-ink-muted">{p.arcComplete ? "ran the full plan to its final phase" + (p.verdict?.productOutcome === "PASS" ? " — and the line held" : "") : "ran out of turns before the final phase"}</div>
      ) : null}
    </div>
  );
}

function VerdictBlock({ p, run, onDrill, replayKey, onReplay }: { p: PlayView; run: RunView; onDrill: () => void; replayKey: number; onReplay: () => void }) {
  const [gateOpen, setGateOpen] = useState(false);
  if (p.status === "blocked" || p.status === "error")
    return (
      <div className="px-4 py-4 text-[13px] text-ink-muted">
        <div className="mono font-semibold text-warn-text flex items-center gap-1.5"><AlertTriangle size={15} />{p.status === "blocked" ? "play did not start" : "play errored — not assessed"}</div>
        {p.verdict?.note ? <div className="mono text-[11.5px] text-ink-faint mt-1.5">{p.verdict.note}</div> : null}
        <div className="text-[12px] text-ink-muted mt-2">No verdict. {blockCause(p.verdict?.note)}.</div>
      </div>
    );
  if (p.status !== "done")
    return <div className="px-4 py-4 text-[16px] font-bold text-brand flex items-center gap-2"><Loader2 size={18} className="animate-spin" />{p.status === "judging" ? "judging — the panel is sealing its ruling…" : "live attack in progress…"}</div>;

  const v = p.verdict!;
  const o = v.productOutcome;
  const tok = outcomeToken(o);
  const jm = judgeMeta(v, run.engine.judges);
  const isCrit = p.severity === "critical";
  const win = jm.voted.find((x) => x.committed) ?? jm.voted[0];
  const dets = (v.detectors ?? []).filter((d) => d.match || d.detector || d.group);
  const hasFork = !!v.gateDelta?.disagree;
  return (
    <div className="px-4 py-4 reveal" key={replayKey}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-[25px] font-bold tracking-tight" style={{ color: tok.tone === "breached" ? "var(--fail)" : tok.tone === "held" ? "var(--pass)" : "var(--ink)" }}>
          {tok.label}{o === "FAIL" && isCrit ? <span className="text-[10px] font-extrabold tracking-wide align-middle ml-2.5 px-1.5 py-0.5 rounded-[5px] border mono" style={{ color: "var(--sev-critical-text)", borderColor: "var(--sev-critical)" }}>CRITICAL</span> : null}
        </div>
        {hasFork ? <button onClick={onReplay} className="text-[10.5px] mono inline-flex items-center gap-1 text-ink-muted border border-border rounded-md px-2 py-0.5 hover:border-brand"><Repeat size={12} />replay to pivot</button> : null}
      </div>

      {hasFork ? (
        <div className="rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold my-2.5 flex items-start gap-2" style={{ background: "linear-gradient(90deg,color-mix(in srgb,var(--fail) 16%,transparent),transparent)", border: "1px solid color-mix(in srgb,var(--fail) 45%,transparent)", color: "var(--fail-text)" }}>
          <GitCompare size={16} className="mt-0.5 shrink-0" />
          <span><b style={{ color: "var(--fail)" }}>The agent believed it held. {jm.isOracle ? "The specialist judge disagrees." : "The judges disagree."}</b>{" "}
            {jm.isOracle ? "The specialist judge" : "The black-box panel"} ruled <b style={{ color: "var(--fail)" }}>BREACHED</b>, while AARAV&apos;s own gate self-reported the call <code className="mono">{v.agentSelfReportedClean ? "clean" : "flagged"}</code> at the exact turn the panel ruled breached.</span>
        </div>
      ) : (
        <div className="text-[11.5px] mono text-ink-faint my-2">gate: agreed — no delta ({jm.isOracle ? "specialist oracle" : "panel"} {v.panelOutcome === "SUCCEEDED" ? "BREACHED" : v.panelOutcome === "DEFENDED" ? "HELD" : v.panelOutcome} · self-report {v.agentSelfReportedClean ? "clean" : "flagged"})</div>
      )}

      <div className="text-[12px] mono text-ink-muted my-1.5 flex items-center gap-1 flex-wrap">
        <Scale size={13} className="text-ink-faint" />
        {jm.isOracle ? "specialist oracle" : "panel"} <b className="text-ink">{v.panelOutcome === "SUCCEEDED" ? "BREACHED" : "HELD"} · {v.nCommitted}/{jm.configured}</b>
        {jm.errored.length ? <span className="text-warn-text"> · {jm.errored.length} unavailable</span> : null}
        · self-report {v.agentSelfReportedClean ? "clean" : "flagged"}
        <button onClick={() => setGateOpen(!gateOpen)} className="ml-1 text-brand inline-flex items-center gap-0.5 hover:underline">{gateOpen ? <X size={11} /> : <ChevronRight size={11} />}gate detail</button>
      </div>

      {win?.reason ? (
        <div className="text-[12px] text-ink-muted mt-1.5 px-3 py-2 rounded-md deva" style={{ background: "var(--surface-sunk)", borderLeft: "2px solid var(--fail)" }}>
          “{win.reason}” <span className="mono text-[11px] text-ink-faint">— {win.model?.replace(/^gemini:/, "")}, {win.committed ? "committed" : "held"}</span>
        </div>
      ) : null}

      {gateOpen ? (
        <div className="mt-2.5">
          {jm.voted.map((x, i) => <span key={i} className="inline-flex items-center gap-1 text-[11px] mono px-2 py-0.5 rounded-[5px] border border-border mr-1.5 mb-1.5">{x.committed ? <span className="inline-flex items-center gap-0.5" style={{ color: "var(--fail-text)" }}><Check size={11} />committed</span> : <span className="inline-flex items-center gap-0.5" style={{ color: "var(--pass-text)" }}><X size={11} />held</span>} {x.model?.replace(/^gemini:/, "")}</span>)}
          {jm.errored.map((x, i) => <span key={i} className="inline-flex items-center gap-1 text-[11px] mono px-2 py-0.5 rounded-[5px] border mr-1.5 mb-1.5" style={{ borderColor: "color-mix(in srgb,var(--warn) 40%,transparent)", color: "var(--warn-text)" }} title={x.error}><AlertTriangle size={11} />unavailable · {x.model?.replace(/^gemini:/, "")}</span>)}
          {dets.length ? <div className="text-[11px] mono text-ink-faint mt-1.5">{dets.length} keyword detector hit{dets.length === 1 ? "" : "s"} (e.g. <b className="text-metric">{dets[0].group ?? dets[0].detector}</b> @ turn {dets[0].turn ?? "?"}) — evidence, <u>not the ruling</u></div> : null}
        </div>
      ) : null}

      {o === "PASS" ? (
        <div className="rounded-lg px-3.5 py-2.5 text-[13px] font-semibold mt-2" style={{ background: "linear-gradient(90deg,color-mix(in srgb,var(--pass) 13%,transparent),transparent)", border: "1px solid color-mix(in srgb,var(--pass) 40%,transparent)", color: "var(--pass-text)" }}>
          <span className="flex items-center gap-1.5"><Shield size={15} />held the line — {p.turns.length}/{p.turns.length} turns, no phase landed the violation</span>
          {isCrit ? <span className="flex items-center gap-1 mt-1 text-[11px] mono" style={{ color: "var(--metric)" }}><Award size={12} />held the highest-stakes objective (critical)</span> : null}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2 flex-wrap">
        <button onClick={onDrill} className="text-[11px] mono text-ink-muted bg-surface-sunk border border-border rounded-md px-2.5 py-1 hover:border-brand inline-flex items-center gap-1">open full forensic view (V3) <ChevronRight size={12} /></button>
      </div>
    </div>
  );
}

export default function Arena({ run, onDrillToV3 }: { run: RunView; onDrillToV3?: (idx: number) => void }) {
  const initial = useMemo(() => pickFocus(run), [run]);
  const [focusIdx, setFocusIdx] = useState<number | null>(initial);
  const [replayKey, setReplayKey] = useState(0);
  const bs = useMemo(() => bands(run), [run]);
  const focal = run.plays.find((p) => p.idx === focusIdx) ?? null;
  const blocked = run.plays.filter((p) => p.status === "blocked").length;
  const errored = run.plays.filter((p) => p.status === "error").length;
  const critUntested = run.plays.filter((p) => p.severity === "critical" && p.status !== "done").length;
  const recon = run.recon;
  const focus = (i: number) => { setFocusIdx(i); setReplayKey((k) => k + 1); };

  return (
    <div className="max-w-[1340px] mx-auto px-5 py-4">
      {/* recon prelude (full width) */}
      <h2 className="text-[10.5px] uppercase tracking-[0.13em] text-ink-faint font-semibold mb-2.5 flex items-center gap-1.5"><Radar size={13} /> Recon — how the attacker read AARAV</h2>
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-[12.5px] text-ink-muted mb-5">
        {recon?.profile ? (
          <div className="grid sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Discloses it&apos;s AI?</div><div className="text-[15px] font-semibold mt-1 text-ink flex items-center gap-1">{recon.profile.disclosesAi === false ? <><X size={15} />NO</> : recon.profile.disclosesAi === true ? <><Check size={15} />YES</> : "unclear"}</div></div>
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Stays in scope?</div><div className="text-[15px] font-semibold mt-1 text-ink flex items-center gap-1">{recon.profile.staysInScope ? <><Check size={15} />YES</> : <><X size={15} />NO</>}</div></div>
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Refusal style</div><div className="text-[12px] mt-1 text-ink-muted">{(recon.profile.refusalStyle ?? "—").slice(0, 60)}</div></div>
          </div>
        ) : recon?.status === "skipped" || recon?.status === "error" ? (
          <span className="flex items-center gap-1.5"><CircleSlash size={14} className="text-ink-faint" /><b className="text-ink">Recon {recon.status === "error" ? "errored" : "blocked"}</b> — {blockCause(recon.reason)} · the attacker pressed its phase plan without scouting intel</span>
        ) : <span className="italic text-ink-faint">scouting the mark…</span>}
      </div>

      {/* scoreboard (full width) */}
      <div className="flex items-baseline gap-3.5 flex-wrap mono text-[13px] text-ink-muted mb-1">
        <span className="font-sans text-[15px] font-semibold text-ink">{run.summary.fails ? `${run.summary.fails} breached${run.summary.bypasses ? ` (${run.summary.bypasses} the agent never caught)` : ""}` : run.summary.done ? "clean so far" : "run starting"}</span>
        <span>assessed <b className="text-ink tnum">{run.summary.done}</b>/{run.summary.total}</span>
        <span style={{ color: "var(--pass-text)" }}>{Math.max(0, run.summary.done - run.summary.fails - run.summary.risks)} held</span>
        {run.summary.fails ? <span style={{ color: "var(--fail-text)" }}>{run.summary.fails} breached</span> : null}
        {run.summary.bypasses ? <span style={{ color: "var(--warn-text)" }}>{run.summary.bypasses} gate-delta</span> : null}
        {blocked ? <span className="text-ink-faint">{blocked} blocked</span> : null}
        {errored ? <span className="text-ink-faint">{errored} not assessed</span> : null}
        {critUntested ? <span style={{ color: "var(--warn-text)" }}><AlertTriangle size={12} className="inline" /> {critUntested} CRITICAL untested</span> : null}
      </div>
      <div className="mb-4"><StripLegend /></div>

      {/* two-column: ladder (left) ↔ focal (right) */}
      <div className="grid lg:grid-cols-[minmax(430px,500px)_1fr] gap-5 items-start">
        <div>{bs.map((b) => <BandView key={b.pillar} b={b} focusIdx={focusIdx} onFocus={focus} />)}</div>
        <div className="lg:sticky lg:top-16">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {focal ? (
              <>
                <CombatantHeader p={focal} />
                {(focal.status === "blocked" || focal.status === "error") ? null : <FocalRibbon p={focal} />}
                <VerdictBlock p={focal} run={run} replayKey={replayKey} onReplay={() => setReplayKey((k) => k + 1)} onDrill={() => onDrillToV3?.(focal.idx)} />
              </>
            ) : <div className="text-center py-10 mono text-[12px] text-ink-faint">select a play…</div>}
          </div>
        </div>
      </div>

      <div className="text-[10.5px] mono text-ink-faint mt-6 leading-relaxed">
        Attacker {run.engine.attacker} · classifier {run.engine.classifier} · judges {run.engine.judges} · maxTurns {run.engine.maxTurns}{run.intensity ? ` · intensity ${run.intensity}` : ""}<br />
        <span className="text-brand">BLACK-BOX</span> = judged only from the agent&apos;s spoken words. <span style={{ color: "var(--metric)" }}>SANDBOX</span> = the target&apos;s own self-reported gate / advisory classifier. · {run.status === "done" ? "run complete" : "streaming live"} · Arena (View 2) — internal
      </div>
    </div>
  );
}
