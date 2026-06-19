"use client";
// V2 ARENA — the live duel. Ladder / Telegraph / Overturn (v2-concept-LTO).
// Calm-instrument skin (DESIGN.md): severity-only colour, line icons, dual-theme, WCAG AA.
import { useMemo, useState } from "react";
import {
  Crosshair, Shield, ShieldCheck, ShieldOff, ChevronsRight, CornerDownRight,
  GitCompare, Scale, Award, Radar, AlertTriangle, ChevronRight,
} from "lucide-react";
import {
  type RunView, type PlayView, type Band, type CellKind,
  bands, pickFocus, telegraph, breachPointPhase, judgeMeta, outcomeToken, blockCause,
} from "@/lib/runview";
import type { Severity } from "@/lib/types";

// ---- redundant non-colour severity glyph (DESIGN.md §5) ----
function Sev({ s }: { s: Severity }) {
  const cls = "inline-block w-2.5 h-2.5 align-middle";
  const map: Record<Severity, React.ReactNode> = {
    critical: <span className={cls} style={{ background: "var(--sev-critical)", clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)" }} />,
    high: <span className={cls} style={{ background: "var(--sev-high)", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />,
    medium: <span className={cls} style={{ background: "var(--sev-medium)", clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />,
    low: <span className="inline-block w-2.5 h-2.5 rounded-full border align-middle" style={{ borderColor: "var(--sev-low)" }} />,
  };
  return <span title={s} aria-label={`severity ${s}`}>{map[s]}</span>;
}

// ---- ribbon cell: per-turn defence (advisory). Shape carries it; ink only. ----
function Cell({ k }: { k: CellKind }) {
  const base = "inline-block w-2.5 h-2.5 rounded-[1px] align-middle";
  if (k === "held") return <span className={base} style={{ background: "var(--ink)" }} title="held" />;
  if (k === "wavered") return <span className={base} style={{ background: "linear-gradient(90deg,var(--ink) 50%,transparent 50%)", outline: "1px solid var(--ink-faint)" }} title="wavered" />;
  if (k === "yielded") return <span className={base} style={{ background: "transparent", outline: "1px solid var(--ink)" }} title="the agent gave the line (advisory)" />;
  return <span className={base} style={{ background: "var(--ink-faint)" }} title="unknown" />;
}

function StripLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] mono text-ink-faint">
      <span>per-turn defence (advisory):</span>
      <span className="flex items-center gap-1"><Cell k="held" />held</span>
      <span className="flex items-center gap-1"><Cell k="wavered" />wavered</span>
      <span className="flex items-center gap-1"><Cell k="yielded" />agent gave the line</span>
    </div>
  );
}

// ---- the verdict cap (check / disc / fork-overturn) ----
function VerdictCap({ p }: { p: PlayView }) {
  if (p.status === "blocked" || p.status === "error")
    return <span className="text-[10px] mono text-warn-text">⊘ not assessed</span>;
  if (p.status !== "done") {
    const t = p.status === "judging" ? "judging" : p.status === "running" ? "running" : "queued";
    return <span className="text-[10px] mono text-brand">…{t}</span>;
  }
  const o = p.verdict?.productOutcome;
  if (o === "FAIL") {
    const fork = p.verdict?.gateDelta?.disagree;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] mono font-bold" style={{ color: "var(--fail-text)" }}>
        {fork ? <GitCompare size={13} /> : <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "var(--fail)" }} />}
        BREACHED{fork ? <span className="text-[9px] font-normal text-ink-faint">· gate split</span> : null}
      </span>
    );
  }
  if (o === "PASS")
    return <span className="inline-flex items-center gap-1 text-[11px] mono font-bold" style={{ color: "var(--pass-text)" }}><ShieldCheck size={13} />HELD</span>;
  return <span className="text-[11px] mono">{o}</span>;
}

// ---- one play row (the frame-ribbon) ----
function Ribbon({ p, focused, onFocus }: { p: PlayView; focused: boolean; onFocus: () => void }) {
  const fail = p.verdict?.productOutcome === "FAIL";
  const crit = fail && p.severity === "critical";
  const cells = p.turns.map((t) => t.cell);
  return (
    <button
      onClick={onFocus}
      aria-pressed={focused}
      className={`group w-full text-left rounded-md border px-3 py-2 transition-colors relative ${focused ? "border-brand bg-brand-soft/30" : "border-border bg-surface hover:border-brand"}`}
      style={crit ? { boxShadow: "inset 3px 0 0 var(--sev-critical)" } : fail ? { boxShadow: "inset 3px 0 0 var(--fail)" } : p.verdict?.productOutcome === "PASS" ? { boxShadow: "inset 3px 0 0 color-mix(in srgb,var(--pass) 55%,transparent)" } : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Sev s={p.severity} />
        <span className="mono text-xs text-ink truncate max-w-[230px]">{p.id}</span>
        {p.severity === "critical" && p.verdict?.productOutcome === "PASS" ? <Award size={13} className="text-metric" /> : null}
        <span className="flex-1" />
        <VerdictCap p={p} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        {cells.length ? cells.map((c, i) => <Cell key={i} k={c} />) :
          (p.status === "blocked" || p.status === "error")
            ? <span className="text-[10px] mono text-ink-faint border-b border-dashed border-ink-faint">— not assessed —</span>
            : <span className="text-[10px] mono text-ink-faint">queued…</span>}
      </div>
    </button>
  );
}

// ---- a pillar band ----
function BandView({ b, focusIdx, onFocus }: { b: Band; focusIdx: number | null; onFocus: (i: number) => void }) {
  return (
    <section className="mb-4">
      <div className="flex items-baseline gap-2 mb-1.5">
        <h3 className="text-[10px] uppercase tracking-[0.13em] text-ink-faint font-semibold">{b.pillar}</h3>
        <span className="text-[11px] mono text-ink-muted">withstood <b className="text-ink tnum">{b.withstood}/{b.graded || 0}</b></span>
        <span className="flex-1 border-b border-border self-center ml-1" />
      </div>
      {b.plays.length ? (
        <div className="grid gap-1.5">
          {b.plays.map((p) => <Ribbon key={p.idx} p={p} focused={focusIdx === p.idx} onFocus={() => onFocus(p.idx)} />)}
        </div>
      ) : (
        <p className="text-[11px] mono text-ink-faint italic py-1">no {b.pillar} attacks in this run</p>
      )}
    </section>
  );
}

// ---- combatant header ----
function CombatantHeader({ p }: { p: PlayView }) {
  return (
    <div className="flex items-start gap-3 flex-wrap px-4 py-3 border-b border-border">
      <div className="flex-1 min-w-[200px]">
        <div className="font-semibold text-[15px] text-ink">{p.title}</div>
        <div className="mono text-[11px] text-ink-faint">{p.id} · {p.pillar}</div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border" style={{ color: `var(--sev-${p.severity}-text)`, borderColor: `var(--sev-${p.severity})` }}><Sev s={p.severity} />{p.severity}</span>
          {(p.regulation ?? []).map((r, i) => <span key={i} className="text-[10px] mono text-brand bg-brand-soft rounded-[3px] px-1.5 py-0.5">{r.framework} {r.control_id}</span>)}
        </div>
      </div>
      <div className="text-right pl-3 border-l-2" style={{ borderColor: "color-mix(in srgb,var(--fail) 28%,transparent)" }}>
        <div className="text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">vs · attacker</div>
        <div className="flex items-center justify-end gap-1.5 font-semibold text-[13.5px] text-ink"><Crosshair size={14} className="text-ink-muted" />{p.technique}</div>
        <div className="text-[10.5px] mono text-ink-muted mt-0.5">persona · {p.persona}</div>
      </div>
    </div>
  );
}

// ---- focal play: phase-banded ribbon + telegraph ----
function FocalArc({ p }: { p: PlayView }) {
  const tg = telegraph(p);
  const breachPhase = breachPointPhase(p);
  const beatTo: Record<string, PlayView["beats"][number]> = {};
  p.beats.forEach((b) => (beatTo[b.toPhase] = b));
  const reached = new Set(p.arc.map((a) => a.phase));
  const lastReached = p.arc.length ? p.arc[p.arc.length - 1].phase : null;
  // group turns by phase, in phasePlan order
  const turnsByPhase: Record<string, typeof p.turns> = {};
  p.turns.forEach((t) => (turnsByPhase[t.phase] ??= []).push(t));
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        {p.phasePlan.map((ph, i) => {
          const isReached = reached.has(ph.name);
          const isCurrent = p.status !== "done" && ph.name === lastReached;
          const isBreach = breachPhase === ph.name;
          const beat = beatTo[ph.name];
          const ts = turnsByPhase[ph.name] ?? [];
          return (
            <div key={ph.name} className="min-w-[150px] flex-1 px-1.5 relative">
              {beat ? (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8.5px] mono text-ink-muted whitespace-nowrap flex items-center gap-0.5">
                  {beat.trigger === "conceded" ? <><CornerDownRight size={10} />conceded</> : <><ChevronsRight size={10} />advanced</>}
                </div>
              ) : null}
              <div className="flex items-center gap-0 mt-3">
                <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] mono shrink-0"
                  style={isBreach ? { borderColor: "var(--fail)", background: "var(--fail)", color: "var(--on-brand)" }
                    : isReached ? { borderColor: "var(--brand)", background: "var(--brand)", color: "var(--on-brand)" }
                    : isCurrent ? { borderColor: "var(--brand-strong)", background: "var(--brand-soft)", color: "var(--brand)" }
                    : { borderColor: "var(--border)", color: "var(--ink-faint)" }}>
                  {isBreach ? <ShieldOff size={11} /> : isReached ? "✓" : i + 1}
                </span>
                <span className="h-0.5 flex-1" style={{ background: isReached ? "var(--brand)" : "var(--border)" }} />
              </div>
              <div className="text-[11.5px] font-semibold mt-1.5 text-ink">{ph.name}</div>
              <div className="text-[10px] text-ink-faint mt-0.5 leading-tight line-clamp-2 min-h-[26px]">{ph.intent}</div>
              {ts.length ? (
                <div className="flex gap-0.5 mt-1.5">{ts.map((t) => <Cell key={t.idx} k={t.cell} />)}</div>
              ) : null}
            </div>
          );
        })}
        {tg ? (
          <div className="min-w-[150px] flex-1 px-1.5 opacity-50">
            <div className="mt-3 flex items-center gap-0">
              <span className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center text-[9px] mono shrink-0" style={{ borderColor: "var(--ink-faint)", color: "var(--ink-faint)" }}>···</span>
              <span className="h-0.5 flex-1 border-t border-dashed" style={{ borderColor: "var(--ink-faint)" }} />
            </div>
            <div className="text-[11.5px] font-semibold mt-1.5 text-ink-muted italic">{tg.name}</div>
            <div className="text-[10px] text-ink-faint mt-0.5 leading-tight">{tg.intent}</div>
            <div className="text-[8.5px] mono text-ink-faint mt-1">planned next move</div>
          </div>
        ) : null}
      </div>
      <div className="mt-2"><StripLegend /></div>
      {p.status === "done" ? (
        <div className="text-[10.5px] mono mt-1.5" style={{ color: p.arcComplete ? "var(--ink-muted)" : "var(--ink-faint)" }}>
          {p.arcComplete ? "✓ ran the full plan to its final phase" + (p.verdict?.productOutcome === "PASS" ? " — and the line held" : "") : "△ ran out of turns before the final phase"}
        </div>
      ) : null}
    </div>
  );
}

// ---- the verdict / overturn climax ----
function VerdictBlock({ p, run, onDrill }: { p: PlayView; run: RunView; onDrill: () => void }) {
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
    return <div className="px-4 py-4 text-[16px] font-bold text-brand">{p.status === "judging" ? "⟳ judging — the panel is sealing its ruling…" : "⟳ live attack in progress…"}</div>;

  const v = p.verdict!;
  const o = v.productOutcome;
  const tok = outcomeToken(o);
  const jm = judgeMeta(v, run.engine.judges);
  const isCrit = p.severity === "critical";
  const win = jm.voted.find((x) => x.committed) ?? jm.voted[0];
  const dets = (v.detectors ?? []).filter((d) => d.match || d.detector || d.group);
  return (
    <div className="px-4 py-4 reveal">
      <div className="text-[25px] font-bold tracking-tight" style={{ color: tok.tone === "breached" ? "var(--fail)" : tok.tone === "held" ? "var(--pass)" : "var(--ink)", textShadow: o === "FAIL" && isCrit ? "0 0 20px color-mix(in srgb,var(--fail) 45%,transparent)" : undefined }}>
        {tok.label}{o === "FAIL" && isCrit ? <span className="text-[10px] font-extrabold tracking-wide align-middle ml-2.5 px-1.5 py-0.5 rounded-[5px] border mono" style={{ color: "var(--sev-critical-text)", borderColor: "var(--sev-critical)" }}>CRITICAL</span> : null}
      </div>

      {v.gateDelta?.disagree ? (
        <div className="rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold my-2.5 flex items-start gap-2" style={{ background: "linear-gradient(90deg,color-mix(in srgb,var(--fail) 16%,transparent),transparent)", border: "1px solid color-mix(in srgb,var(--fail) 45%,transparent)", color: "var(--fail-text)" }}>
          <GitCompare size={16} className="mt-0.5 shrink-0" />
          <span><b style={{ color: "var(--fail)" }}>The agent believed it held. {jm.isOracle ? "The specialist judge disagrees." : "The judges disagree."}</b>{" "}
            {jm.isOracle ? "The specialist judge" : "The black-box panel"} ruled <b style={{ color: "var(--fail)" }}>BREACHED</b>, while AARAV&apos;s own sandbox gate self-reported the call <code className="mono">{v.agentSelfReportedClean ? "clean" : "flagged"}</code>.</span>
        </div>
      ) : (
        <div className="text-[11.5px] mono text-ink-faint my-2">gate: agreed — no delta ({jm.isOracle ? "specialist oracle" : "panel"} {v.panelOutcome === "SUCCEEDED" ? "BREACHED" : v.panelOutcome === "DEFENDED" ? "HELD" : v.panelOutcome} · self-report {v.agentSelfReportedClean ? "clean" : "flagged"})</div>
      )}

      <div className="text-[12px] mono text-ink-muted my-1.5 flex items-center gap-1 flex-wrap">
        <Scale size={13} className="text-ink-faint" />
        {jm.isOracle ? "specialist oracle" : "panel"} <b className="text-ink">{v.panelOutcome === "SUCCEEDED" ? "BREACHED" : "HELD"} · {v.nCommitted}/{jm.configured}</b>
        {jm.errored.length ? <span className="text-warn-text"> · {jm.errored.length} unavailable</span> : null}
        · self-report {v.agentSelfReportedClean ? "clean" : "flagged"}
        <button onClick={() => setGateOpen(!gateOpen)} className="ml-1 text-brand underline-offset-2 hover:underline">{gateOpen ? "▾ hide detail" : "▸ gate detail"}</button>
      </div>

      {win?.reason ? (
        <div className="text-[12px] text-ink-muted mt-1.5 px-3 py-2 rounded-md deva" style={{ background: "var(--surface-sunk)", borderLeft: "2px solid var(--fail)" }}>
          “{win.reason}” <span className="mono text-[11px] text-ink-faint">— {win.model?.replace(/^gemini:/, "")}, {win.committed ? "committed" : "held"}</span>
        </div>
      ) : null}

      {gateOpen ? (
        <div className="mt-2.5">
          {jm.voted.map((x, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] mono px-2 py-0.5 rounded-[5px] border border-border mr-1.5 mb-1.5">
              {x.committed ? <b style={{ color: "var(--fail)" }}>COMMITTED ✓</b> : <span style={{ color: "var(--pass)" }}>held ✗</span>} {x.model?.replace(/^gemini:/, "")}
            </span>
          ))}
          {jm.errored.map((x, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] mono px-2 py-0.5 rounded-[5px] border mr-1.5 mb-1.5" style={{ borderColor: "color-mix(in srgb,var(--warn) 40%,transparent)", color: "var(--warn-text)" }} title={x.error}>⚠ unavailable · {x.model?.replace(/^gemini:/, "")}</span>
          ))}
          {dets.length ? <div className="text-[11px] mono text-ink-faint mt-1.5">{dets.length} keyword detector hit{dets.length === 1 ? "" : "s"} (e.g. <b className="text-metric">{dets[0].group ?? dets[0].detector}</b> @ turn {dets[0].turn ?? "?"}) — evidence, <u>not the ruling</u></div> : null}
        </div>
      ) : null}

      {o === "PASS" ? (
        <div className="rounded-lg px-3.5 py-2.5 text-[13px] font-semibold mt-2" style={{ background: "linear-gradient(90deg,color-mix(in srgb,var(--pass) 13%,transparent),transparent)", border: "1px solid color-mix(in srgb,var(--pass) 40%,transparent)", color: "var(--pass-text)" }}>
          <span className="flex items-center gap-1.5"><Shield size={15} />held the line — {p.turns.length}/{p.turns.length} turns, no phase landed the violation</span>
          {isCrit ? <span className="block mt-1 text-[11px] mono" style={{ color: "var(--metric)" }}><Award size={12} className="inline" /> held the highest-stakes objective (critical)</span> : null}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2 flex-wrap">
        <button onClick={onDrill} className="text-[11px] mono text-ink-muted bg-surface-sunk border border-border rounded-md px-2.5 py-1 hover:border-brand inline-flex items-center gap-1">open full forensic view (V3) <ChevronRight size={12} /></button>
      </div>
    </div>
  );
}

// ---- the Arena ----
export default function Arena({ run, onDrillToV3 }: { run: RunView; onDrillToV3?: (idx: number) => void }) {
  const initial = useMemo(() => pickFocus(run), [run]);
  const [focusIdx, setFocusIdx] = useState<number | null>(initial);
  const bs = useMemo(() => bands(run), [run]);
  const focal = run.plays.find((p) => p.idx === focusIdx) ?? null;
  const blocked = run.plays.filter((p) => p.status === "blocked").length;
  const errored = run.plays.filter((p) => p.status === "error").length;
  const critUntested = run.plays.filter((p) => p.severity === "critical" && p.status !== "done").length;
  const recon = run.recon;

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-4">
      {/* recon prelude */}
      <h2 className="text-[10.5px] uppercase tracking-[0.13em] text-ink-faint font-semibold mb-2.5 flex items-center gap-1.5"><Radar size={13} /> Recon — how the attacker read AARAV</h2>
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-[12.5px] text-ink-muted mb-5">
        {recon?.profile ? (
          <div className="grid sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Discloses it&apos;s AI?</div><div className="text-[15px] font-semibold mt-1" style={{ color: recon.profile.disclosesAi === false ? "var(--sev-high-text)" : "var(--pass-text)" }}>{recon.profile.disclosesAi === false ? "NO ✗" : recon.profile.disclosesAi === true ? "YES ✓" : "unclear"}</div></div>
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Stays in scope?</div><div className="text-[15px] font-semibold mt-1" style={{ color: recon.profile.staysInScope ? "var(--pass-text)" : "var(--sev-high-text)" }}>{recon.profile.staysInScope ? "YES ✓" : "NO ✗"}</div></div>
            <div className="rounded-lg border border-border bg-surface-sunk px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-ink-faint">Refusal style</div><div className="text-[12px] mt-1 text-ink-muted">{(recon.profile.refusalStyle ?? "—").slice(0, 60)}</div></div>
          </div>
        ) : recon?.status === "skipped" || recon?.status === "error" ? (
          <span className="text-warn-text"><b className="text-ink">⊘ Recon {recon.status === "error" ? "errored" : "blocked"}</b> — {blockCause(recon.reason)} · the attacker pressed its phase plan without scouting intel</span>
        ) : (
          <span className="italic text-ink-faint">scouting the mark…</span>
        )}
      </div>

      {/* scoreboard */}
      <div className="flex items-baseline gap-3.5 flex-wrap mono text-[13px] text-ink-muted mb-1">
        <span className="font-sans text-[15px] font-semibold text-ink">{run.summary.fails ? `${run.summary.fails} breached${run.summary.bypasses ? ` (${run.summary.bypasses} the agent never caught)` : ""}` : run.summary.done ? "clean so far" : "run starting"}</span>
        <span>assessed <b className="text-ink tnum">{run.summary.done}</b>/{run.summary.total}</span>
        <span style={{ color: "var(--pass-text)" }}>{Math.max(0, run.summary.done - run.summary.fails - run.summary.risks)} held</span>
        {run.summary.fails ? <span style={{ color: "var(--fail-text)" }}>{run.summary.fails} breached</span> : null}
        {run.summary.bypasses ? <span style={{ color: "var(--warn-text)" }}>{run.summary.bypasses} gate-delta</span> : null}
        {blocked ? <span className="text-ink-faint">{blocked} blocked</span> : null}
        {errored ? <span className="text-ink-faint">{errored} not assessed</span> : null}
        {critUntested ? <span style={{ color: "var(--warn-text)" }}>⚠ {critUntested} CRITICAL untested</span> : null}
      </div>
      <div className="mb-4"><StripLegend /></div>

      {/* bands */}
      {bs.map((b) => <BandView key={b.pillar} b={b} focusIdx={focusIdx} onFocus={setFocusIdx} />)}

      {/* focal play */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden mt-2">
        {focal ? (
          <>
            <CombatantHeader p={focal} />
            {(focal.status === "blocked" || focal.status === "error") ? null : <FocalArc p={focal} />}
            <VerdictBlock p={focal} run={run} onDrill={() => onDrillToV3?.(focal.idx)} />
          </>
        ) : <div className="text-center py-10 mono text-[12px] text-ink-faint">select a play…</div>}
      </div>

      {/* provenance */}
      <div className="text-[10.5px] mono text-ink-faint mt-6 leading-relaxed">
        Attacker {run.engine.attacker} · classifier {run.engine.classifier} · judges {run.engine.judges} · maxTurns {run.engine.maxTurns}{run.intensity ? ` · intensity ${run.intensity}` : ""}<br />
        <span className="text-brand">BLACK-BOX</span> = judged only from the agent&apos;s spoken words. <span style={{ color: "var(--metric)" }}>SANDBOX</span> = the target&apos;s own self-reported gate / advisory classifier. · {run.status === "done" ? "run complete" : "streaming live"} · Arena (View 2) — internal
      </div>
    </div>
  );
}
