"use client";
// V3 FORENSIC — the V2 play "fully expanded" (D-LV22). Internal-unrestricted: full chain,
// model-named judges, detectors, recon, provenance, debug internals + Re-judge / Judge-diff.
import { useState } from "react";
import { ArrowUp, Crosshair, Shield, Scale, RotateCcw, GitCompareArrows, Radar, Bug } from "lucide-react";
import { type RunView, type PlayView, judgeMeta, outcomeToken } from "@/lib/runview";

function Section({ title, icon, children, note }: { title: string; icon?: React.ReactNode; children: React.ReactNode; note?: string }) {
  return (
    <section className="mb-5">
      <h3 className="text-[10.5px] uppercase tracking-[0.13em] text-ink-faint font-semibold mb-2 flex items-center gap-1.5">{icon}{title}{note ? <span className="normal-case tracking-normal text-ink-faint/80 font-normal">· {note}</span> : null}</h3>
      <div className="rounded-xl border border-border bg-surface px-4 py-3">{children}</div>
    </section>
  );
}

export default function Forensic({ run, play, onRollUp }: { run: RunView; play: PlayView; onRollUp: () => void }) {
  const v = play.verdict;
  const jm = judgeMeta(v, run.engine.judges);
  const tok = outcomeToken(v?.productOutcome);
  const [judgeDiff, setJudgeDiff] = useState(false);
  const [rejudge, setRejudge] = useState<null | "running" | "stable" | "diverged">(null);

  function doRejudge() {
    setRejudge("running");
    // honest stub: a real Re-judge re-submits the sealed transcript to the panel (D-LV22).
    // Until the engine endpoint exists we simulate determinism = "stable" (same verdict).
    setTimeout(() => setRejudge("stable"), 900);
  }

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-4">
      <button onClick={onRollUp} className="text-[11px] mono text-brand inline-flex items-center gap-1 mb-3 hover:underline"><ArrowUp size={13} /> roll up to Arena</button>

      {/* matchup + verdict */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden mb-5">
        <div className="flex items-start gap-3 flex-wrap px-4 py-3 border-b border-border">
          <div className="flex-1 min-w-[220px]">
            <div className="font-semibold text-[16px] text-ink">{play.title}</div>
            <div className="mono text-[11px] text-ink-faint">{play.id} · {play.pillar} · severity {play.severity}</div>
          </div>
          <div className="text-right pl-3 border-l border-border">
            <div className="text-[9.5px] uppercase tracking-wide text-ink-faint">attacker</div>
            <div className="flex items-center justify-end gap-1 font-semibold text-[13px] text-ink"><Crosshair size={13} />{play.technique}</div>
            <div className="text-[10.5px] mono text-ink-muted">as · {play.persona}</div>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[22px] font-bold tracking-tight" style={{ color: tok.tone === "breached" ? "var(--fail)" : tok.tone === "held" ? "var(--pass)" : "var(--ink)" }}>{tok.label}</div>
          {v?.gateDelta?.disagree ? <div className="text-[12px] mt-1" style={{ color: "var(--fail-text)" }}>The agent believed it held. {jm.isOracle ? "The specialist judge disagrees." : "The judges disagree."}</div> : null}
          <div className="text-[11.5px] mono text-ink-muted mt-1">{jm.isOracle ? "specialist oracle" : "panel"} · committed {v?.nCommitted}/{jm.configured}{jm.errored.length ? ` · ${jm.errored.length} unavailable` : ""} · self-report {v?.agentSelfReportedClean ? "clean" : "flagged"} · score {v?.score ?? "—"}</div>
          <div className="mt-2 inline-flex gap-2 flex-wrap">
            <button onClick={doRejudge} className="text-[11px] mono inline-flex items-center gap-1 bg-surface-sunk border border-border rounded-md px-2.5 py-1 hover:border-brand text-ink-muted"><RotateCcw size={12} />Re-judge{rejudge === "running" ? "…" : rejudge === "stable" ? " ✓ stable" : ""}</button>
            <button onClick={() => setJudgeDiff(!judgeDiff)} className="text-[11px] mono inline-flex items-center gap-1 bg-surface-sunk border border-border rounded-md px-2.5 py-1 hover:border-brand text-ink-muted"><GitCompareArrows size={12} />Judge-diff</button>
          </div>
          {rejudge === "stable" ? <div className="text-[10.5px] mono text-pass-text mt-1.5">Re-judge: the panel returned the same ruling — verdict is reproducible. <span className="text-ink-faint">(stub — wires to the engine re-judge endpoint when D-LV-dep3 lands)</span></div> : null}
        </div>
      </div>

      {/* JUDGE PANEL — model names + full reasons (internal-unrestricted, inverse of customer C6) */}
      <Section title="Judge panel" icon={<Scale size={13} />} note="internal — model names + full reasons shown (the customer report anonymizes these)">
        {judgeDiff ? (
          <div className="grid sm:grid-cols-3 gap-2.5">
            {jm.votes.map((x, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-sunk px-3 py-2">
                <div className="mono text-[11px] font-semibold" style={{ color: x.committed ? "var(--fail-text)" : x.error ? "var(--warn-text)" : "var(--pass-text)" }}>{x.committed ? "COMMITTED ✓" : x.error ? "⚠ unavailable" : "held ✗"}</div>
                <div className="mono text-[10.5px] text-ink-muted mt-0.5">{x.model?.replace(/^gemini:/, "")}{x.specificity != null ? ` · spec ${x.specificity}` : ""}</div>
                {x.reason ? <div className="text-[11.5px] text-ink-muted mt-1.5 deva leading-snug">{x.reason}</div> : x.error ? <div className="text-[11px] mono text-warn-text mt-1">{x.error}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {jm.votes.map((x, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <span className="mono text-[11px] shrink-0 w-[120px]" style={{ color: x.committed ? "var(--fail-text)" : x.error ? "var(--warn-text)" : "var(--pass-text)" }}>{x.committed ? "COMMITTED ✓" : x.error ? "unavailable ⚠" : "held ✗"}</span>
                <span className="mono text-[11px] text-ink-faint shrink-0 w-[140px] truncate">{x.model?.replace(/^gemini:/, "")}</span>
                <span className="text-ink-muted deva">{x.reason ?? x.error ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* FULL TRANSCRIPT — every turn (internal-unrestricted full chain) */}
      <Section title="Full transcript" icon={<span className="mono text-[12px]">⠿</span>} note={`${play.turns.length} turns · Probe (Sentinx) vs Target (AARAV) · controlled red-team, synthetic data`}>
        <div className="grid gap-3">
          {play.turns.map((t) => {
            const pivot = play.pivotTurn != null && t.idx === play.pivotTurn;
            return (
              <div key={t.idx} className={pivot ? "rounded-md p-2 -m-2" : ""} style={pivot ? { background: "color-mix(in srgb,var(--fail) 7%,transparent)" } : undefined}>
                <div className="text-[9.5px] uppercase tracking-wide text-ink-faint mb-1">[{t.phase}] {t.intent} {pivot ? <span style={{ color: "var(--fail-text)" }}>· classifier marked a commit here (advisory)</span> : null}</div>
                <div className="text-[13px] rounded-lg px-3 py-1.5 ml-auto max-w-[88%] deva" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)", borderBottomRightRadius: 3 }}><span className="text-[9px] uppercase tracking-wide text-ink-faint block">attacker</span>{t.attacker}</div>
                <div className="text-[13px] rounded-lg px-3 py-1.5 mt-1 max-w-[88%] deva" style={{ background: "var(--surface-sunk)", border: "1px solid var(--border)", borderBottomLeftRadius: 3 }}><span className="text-[9px] uppercase tracking-wide text-ink-faint block">AARAV (target)</span>{t.agent}<span className="mono text-[9.5px] ml-2 px-1.5 py-0.5 rounded-[3px] border border-border align-middle">{t.label}</span></div>
              </div>
            );
          })}
          {!play.turns.length ? <div className="mono text-[11px] text-ink-faint">no turns — {play.status}</div> : null}
        </div>
      </Section>

      {/* RECON */}
      {run.recon ? (
        <Section title="Recon profile" icon={<Radar size={13} />}>
          {run.recon.profile ? (
            <div className="mono text-[11.5px] text-ink-muted grid gap-1">
              <div>discloses AI: <b className="text-ink">{String(run.recon.profile.disclosesAi)}</b> · stays in scope: <b className="text-ink">{String(run.recon.profile.staysInScope)}</b></div>
              <div>refusal style: {run.recon.profile.refusalStyle}</div>
            </div>
          ) : <div className="mono text-[11.5px] text-warn-text">recon {run.recon.status} — {run.recon.reason ?? "no profile"}</div>}
        </Section>
      ) : null}

      {/* DEBUG INTERNALS */}
      <Section title="Engine internals" icon={<Bug size={13} />} note="advisory — for QA/debug">
        <div className="mono text-[11px] text-ink-muted grid gap-1">
          <div>phase plan: {play.phasePlan.map((p) => p.name).join(" → ")}</div>
          <div>arc reached: {play.arc.map((a) => a.phase).join(" → ") || "—"} · arcComplete: <b className="text-ink">{String(play.arcComplete)}</b></div>
          <div>beats (who-moved): {play.beats.length ? play.beats.map((b) => `${b.toPhase}=${b.trigger}`).join(" · ") : "—"}</div>
          <div>pivotTurn (advisory classifier): <b className="text-ink">{play.pivotTurn ?? "none"}</b> — the last in-call commit, NOT guaranteed the judge-quoted line</div>
          <div>label trend: {play.turns.map((t) => t.label[0]).join("")}</div>
        </div>
      </Section>

      {/* PROVENANCE */}
      <div className="text-[10.5px] mono text-ink-faint mt-2">
        run {run.id} · target {run.target} · attacker {run.engine.attacker} · classifier {run.engine.classifier} · judges {run.engine.judges} · maxTurns {run.engine.maxTurns} · V3 Forensic (internal-unrestricted)
      </div>
    </div>
  );
}
