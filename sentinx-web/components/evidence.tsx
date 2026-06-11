import { cn } from "@/lib/cn";
import type { EvidenceTurn, JudgeVote, DetectorHit, CrosswalkEdge, FairnessEvidence } from "@/lib/types";
import { ShieldAlert, ShieldCheck, Scale, Crosshair } from "lucide-react";
import { SectionLabel } from "./ui";

export function ConfidentialityLine({ className }: { className?: string }) {
  return (
    <p className={cn("text-[12px] text-ink-muted leading-relaxed", className)}>
      Evidence from a controlled Sentinx red-team run against a sandbox target on{" "}
      <span className="text-ink">synthetic</span> data — no real borrower or PII. Probes are
      tool-generated; responses are the target agent&apos;s own output.
    </p>
  );
}

/** A transcript exchange line — mono, speaker-labelled, Devanagari-aware. */
export function TranscriptTurn({ turn }: { turn: EvidenceTurn }) {
  const isProbe = turn.speaker === "probe";
  return (
    <div className="flex gap-3 py-2">
      <div className="w-20 shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
            isProbe ? "text-ink-faint" : "text-brand",
          )}
        >
          {isProbe ? <Crosshair className="h-3 w-3" strokeWidth={1.5} /> : <RadarDot />}
          {isProbe ? "Probe" : "Target"}
        </span>
        <span className="mono mt-0.5 block text-[10.5px] text-ink-faint tnum">{turn.ts}</span>
      </div>
      <p
        lang={turn.lang === "hi" ? "hi" : undefined}
        className={cn(
          "mono flex-1 text-[12.5px] leading-relaxed",
          isProbe ? "text-ink-muted" : "text-ink",
          turn.lang === "hi" && "deva",
        )}
      >
        {turn.text}
      </p>
    </div>
  );
}

function RadarDot() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />;
}

/** The single most persuasive artifact: our verdict vs the target's self-report (M7/D7). */
export function BypassSignal({ bypass, selfReports }: { bypass: boolean; selfReports: boolean }) {
  if (bypass && selfReports) {
    return (
      <div className="rounded-md border border-fail/40 bg-[color-mix(in_srgb,var(--fail)_7%,transparent)] p-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-fail" strokeWidth={1.75} />
          <div>
            <div className="text-[13px] font-semibold text-fail-text">Guardrail bypass</div>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              The target&apos;s own safety filter reported this exchange{" "}
              <span className="mono text-ink">compliance_clean = true</span> — Sentinx&apos;s judge
              panel rated it <span className="font-semibold text-fail-text">FAIL</span>. The
              agent&apos;s filter missed it.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // Fallback for non-self-reporting targets — never a faked "clean".
  return (
    <div className="rounded-md border border-border bg-surface-sunk p-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
        <p className="text-[12.5px] text-ink-muted">
          Sentinx judge verdict shown below. {selfReports ? "Target self-report matched." : "This target does not self-report a guardrail signal."}
        </p>
      </div>
    </div>
  );
}

/** Anonymized 3-judge (or N) panel — guards on vote count, never assumes 3 (D-Q13). */
export function JudgePanel({ votes }: { votes: JudgeVote[] }) {
  if (votes.length === 0) {
    return <p className="text-[12.5px] text-ink-muted">Graded by a specialised oracle (see verdict).</p>;
  }
  const committed = votes.filter((v) => v.committed).length;
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-ink-muted">
        <span className="font-semibold text-ink tnum">{committed} of {votes.length}</span> independent
        judges flagged a violation.
      </div>
      <ol className="space-y-1.5">
        {votes.map((v, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-sm bg-surface-sunk px-2.5 py-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-surface text-[11px] font-bold text-ink-muted">
              {String.fromCharCode(65 + i)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn("text-[11px] font-bold uppercase", v.committed ? "text-fail-text" : "text-pass-text")}
                >
                  {v.committed ? "● violation" : "✓ held"}
                </span>
                <span className="mono text-[11px] text-ink-faint tnum">spec {v.specificity.toFixed(2)}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-muted">{v.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DetectorHits({ hits }: { hits: DetectorHit[] }) {
  if (hits.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {hits.map((h, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="inline-flex items-center rounded-sm border border-warn/40 px-1.5 py-0.5 font-medium text-warn-text">
            {h.category}
          </span>
          <span className="mono text-ink-faint">{h.detector}</span>
          <span className="mono text-ink">“{h.match}”</span>
        </div>
      ))}
    </div>
  );
}

/** 0–1 specificity meter in metric indigo, RISK band marked. */
export function VerdictScoreMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>verdict score</span>
        <span className="mono tnum text-ink">{score.toFixed(2)}</span>
      </div>
      <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
        {/* RISK band 0.30–0.70 marker */}
        <div className="absolute inset-y-0 left-[30%] w-[40%] bg-warn/15" aria-hidden />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: pct + "%", background: "var(--metric)" }} />
      </div>
    </div>
  );
}

export function RegulationCite({ edges }: { edges: CrosswalkEdge[] }) {
  return (
    <div className="space-y-2.5">
      {edges.map((e, i) => (
        <div key={i} className="border-l-2 border-border pl-3">
          <div className="flex flex-wrap items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.5} />
            <span className="mono text-[12px] font-medium text-ink">{e.framework} {e.controlId}</span>
            <span className="text-[12px] text-ink-muted">{e.controlTitle}</span>
            {e.smePending && (
              <span className="rounded-sm bg-surface-sunk px-1 py-0.5 text-[10px] text-ink-faint">SME-pending</span>
            )}
          </div>
          {e.text && <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{e.text}</p>}
        </div>
      ))}
    </div>
  );
}

/** Fairness paired-persona comparison variant (D-Q19). */
export function FairnessComparison({ fairness }: { fairness: FairnessEvidence }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-warn/40 bg-[color-mix(in_srgb,var(--warn)_6%,transparent)] p-3">
        <div className="text-[13px] font-semibold text-warn-text">Disparate treatment</div>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">{fairness.verdict}</p>
        <p className="mono mt-1.5 text-[11px] text-ink-faint">{fairness.stat}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fairness.personas.map((p, i) => (
          <div key={i} className="rounded-md border border-border bg-surface p-3">
            <SectionLabel>{p.label}</SectionLabel>
            <p className="mt-1 text-[12px] text-ink-muted">{p.note}</p>
            <div className="mt-2 divide-y divide-border">
              {p.turns.map((t) => (
                <TranscriptTurn key={t.idx} turn={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
