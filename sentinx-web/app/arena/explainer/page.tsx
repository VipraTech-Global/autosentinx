"use client";
// /arena/explainer — a dark-mode legend for the live board. Renders the SAME glyphs/tokens the
// Arena (V2) + Forensic (V3) use, so it can never drift: Cell/Sev/StripLegend are imported from
// arena.tsx and outcomeToken from runview.ts (single sources of truth). Maintenance notes +
// element→source map live in: design documentation/live-views/ARENA-EXPLAINER.md.
import Link from "next/link";
import {
  GitCompare, ShieldCheck, ShieldOff, Loader2, CircleSlash, AlertTriangle, Crosshair,
  CornerDownRight, ChevronsRight, Radar, Check, X, Scale, Award, Repeat, Search,
} from "lucide-react";
import { Cell, Sev, StripLegend } from "@/components/live/arena";
import { outcomeToken } from "@/lib/runview";

function Section({ n, heading, intro, children }: { n: number; heading: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-[15px] font-semibold text-ink">{n} · {heading}</h2>
      <p className="mt-1 mb-3 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">{intro}</p>
      <div className="rounded-xl border border-border bg-surface px-4">{children}</div>
    </section>
  );
}

function Row({ swatch, label, meaning, token, source }: { swatch: React.ReactNode; label: string; meaning: string; token: string; source?: string }) {
  return (
    <div className="flex items-start gap-4 border-t border-border py-3 first:border-t-0">
      <div className="flex min-h-[26px] w-[210px] shrink-0 items-center gap-2">{swatch}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-ink">{label}</div>
        <div className="mt-0.5 text-[12px] text-ink-muted">{meaning}</div>
        <div className="mono mt-1 text-[10px] text-ink-faint">{token}{source ? <> · <span className="text-ink-faint/70">{source}</span></> : null}</div>
      </div>
    </div>
  );
}

// reusable composite swatches
const gateDelta = (
  <div className="rounded-lg px-2.5 py-1.5 text-[10px]" style={{ background: "linear-gradient(90deg,color-mix(in srgb,var(--fail) 16%,transparent),transparent)", border: "1px solid color-mix(in srgb,var(--fail) 45%,transparent)" }}>
    <span className="inline-flex items-center gap-1" style={{ color: "var(--fail-text)" }}><GitCompare size={12} /><b style={{ color: "var(--fail)" }}>agent believed it held</b></span>
  </div>
);

export default function ArenaExplainerPage() {
  return (
    <div className="dark min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-5 backdrop-blur">
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">AutoSentin<span className="text-brand">X</span></span>
        <span className="mono text-[11px] text-ink-faint">/arena/explainer</span>
        <span className="flex-1" />
        <Link href="/runs" className="text-[12.5px] font-medium text-ink-muted hover:text-ink">Runs</Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reading the live board</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          Every mark on the <b className="text-ink">Arena</b> (the live duel) and <b className="text-ink">Detail</b> (forensic) view, what it means, and its design token.
          The golden rule: <b className="text-ink">colour is reserved for the settled ruling and for severity</b> — everything advisory (per-turn defence, recon, operational counts) stays ink, with meaning carried by <b className="text-ink">shape</b>.
        </p>

        <div className="mt-7">

        <Section n={1} heading="The verdict — HELD / BREACHED / RISK + the gate-delta" intro="The single big word that settles each play. HELD/BREACHED/RISK are the viewer-facing aliases of the engine's PASS/FAIL/RISK. A gate-delta is the VAR-style overturn: the agent's own gate said 'clean', the judge panel disagreed.">
          <Row label="HELD" meaning="The judge panel ruled the attack did not land — the agent held the line." token="var(--pass) · tone held"
            swatch={<span className="text-[20px] font-bold tracking-tight" style={{ color: "var(--pass)" }}>{outcomeToken("PASS").label}</span>} />
          <Row label="BREACHED" meaning="The panel ruled the attack succeeded — the agent gave up the violation." token="var(--fail) · tone breached"
            swatch={<span className="text-[20px] font-bold tracking-tight" style={{ color: "var(--fail)" }}>{outcomeToken("FAIL").label}</span>} />
          <Row label="RISK" meaning="Borderline — 1 of 3 judges committed, or single-judge confidence in the 0.30–0.55 band." token="var(--warn) · tone risk"
            swatch={<span className="text-[20px] font-bold tracking-tight" style={{ color: "var(--warn)" }}>{outcomeToken("RISK").label}</span>} />
          <Row label="CRITICAL tag" meaning="Appended to BREACHED only when the breached objective is critical-severity." token="--sev-critical / --sev-critical-text"
            swatch={<span className="mono rounded-[5px] border px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide" style={{ color: "var(--sev-critical-text)", borderColor: "var(--sev-critical)" }}>CRITICAL</span>} />
          <Row label="gate-delta overturn" meaning="The agent self-reported clean, but the panel overturned it to BREACHED — a silent bypass the agent never caught." token="fail-tinted gradient + GitCompare"
            swatch={gateDelta} />
          <Row label="replay to pivot" meaning="Re-fires the overturn animation + the red pivot ring. Only present on a gate-fork." token="border-border · hover:border-brand"
            swatch={<span className="mono inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10.5px] text-ink-muted"><Repeat size={12} />replay to pivot</span>} />
        </Section>

        <Section n={2} heading="The per-turn defence strip — one cell per turn" intro="The frame-ribbon is the spine of the board: one ink cell per conversation turn, meaning carried by SHAPE (so it reads without colour). These are ADVISORY in-call classifier labels — NOT the ruling. 'Gave the line' is a struck cell (an X cut out of an ink tile) so a breach row reads damaged, not empty. Mapping (cellOf): Refusal→held, Comply→wavered, Succeed→gave-the-line, Unknown→unknown.">
          <Row label="held (Refusal)" meaning="The agent refused / held the line this turn." token="solid ink square · var(--ink)"
            swatch={<Cell k="held" lg />} />
          <Row label="wavered (Comply)" meaning="Gave ground but didn't hand over the violation — a partial slip." token="half square · ink 50% gradient"
            swatch={<Cell k="wavered" lg />} />
          <Row label="gave the line (Succeed)" meaning="The agent gave the line / the attack succeeded this turn (advisory)." token="ink tile with an X cut out (mask)"
            swatch={<Cell k="yielded" lg />} />
          <Row label="unknown (Unknown)" meaning="The classifier could not label this turn." token="solid faint-grey · var(--ink-faint)"
            swatch={<Cell k="unknown" lg />} />
          <Row label="yet to come (pending)" meaning="An estimated remaining turn slot, up to the run's maxTurns. UI-only — it has NO classifier label." token="hollow outline box"
            swatch={<Cell k="pending" lg />} />
          <Row label="breach-point pivot (red ring)" meaning="On the breach phase, the exact turn the classifier flagged — ringed in red, settling in sync with the overturn. Advisory: not guaranteed the judge-quoted line." token=".pivot-ring · pivot-settle 560ms"
            swatch={<span className="relative inline-flex"><Cell k="yielded" lg /><span className="pivot-ring absolute -inset-[2px] rounded-[2px]" /></span>} />
          <Row label="the legend (canonical decoder)" meaning="The one legend that decodes every ribbon — mounted at the scoreboard, reused here verbatim." token="StripLegend (real component)"
            swatch={<div className="scale-90 origin-left"><StripLegend /></div>} />
        </Section>

        <Section n={3} heading="The play card & the SECURITY / COMPLIANCE bands" intro="The left ladder stacks each play as a clickable frame-ribbon row, grouped into two pillar bands. A breach paints a coloured left rail; severity is a redundant SHAPE so it reads without colour.">
          <Row label="severity glyphs" meaning="Severity as a shape — critical (filled square), high (triangle), medium (diamond), low (hollow circle). Muted on un-assessed rows." token="var(--sev-*) · clipPath polygons"
            swatch={<span className="flex items-center gap-2.5"><Sev s="critical" /><Sev s="high" /><Sev s="medium" /><Sev s="low" /></span>} />
          <Row label="HELD cap" meaning="A compact per-play status+verdict at the row's right end (held)." token="ShieldCheck + var(--pass-text)"
            swatch={<span className="mono inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--pass-text)" }}><ShieldCheck size={13} />HELD</span>} />
          <Row label="BREACHED cap" meaning="The breached variant of the cap (with a 'gate split' tag when the gate disagreed)." token="var(--fail-text) + dot"
            swatch={<span className="mono inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--fail-text)" }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--fail)" }} />BREACHED</span>} />
          <Row label="live cap" meaning="The streaming state — a brand spinner while the play is in flight / judging." token="Loader2 spin · text-brand"
            swatch={<span className="mono inline-flex items-center gap-1 text-[10px] text-brand"><Loader2 size={12} className="animate-spin" />live</span>} />
          <Row label="critical-PASS Award" meaning="A trophy marks a critical objective that HELD." token="Award · var(--metric)"
            swatch={<Award size={15} className="text-metric" />} />
          <Row label="breach left-rail" meaning="A FAIL paints a 3px inset left rail on the play card (critical → critical colour, else fail)." token="boxShadow inset 3px var(--fail)"
            swatch={<span className="inline-block rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] text-ink-muted" style={{ boxShadow: "inset 3px 0 0 var(--fail)" }}>a breached play row</span>} />
        </Section>

        <Section n={4} heading="The scoreboard — the run-summary sentence & chips" intro="Above the ladder, one plain-language sentence settles the whole run, then a mono chip row. Strict rule: colour is for verdicts + severity only — operational counts (blocked / errored / untested) stay ink. Dashed-underline chips are hover-explained.">
          <Row label="run-summary sentence" meaning="The big neutral verdict: 'n breached', 'clean — held every play', 'no breaches yet', 'attack in progress', or 'run starting'." token="font-sans · text-ink (neutral)"
            swatch={<span className="font-sans text-[14px] font-semibold text-ink">2 breached</span>} />
          <Row label="assessed n/total · n held" meaning="How many plays have a settled ruling; held = done − fails − risks (green only when > 0)." token="text-ink-muted · var(--pass-text)"
            swatch={<span className="mono text-[12px] text-ink-muted">assessed <b className="text-ink tnum">5</b>/8 · <span style={{ color: "var(--pass-text)" }}>3 held</span></span>} />
          <Row label="at risk · gate-delta (hover)" meaning="Borderline rulings, and silent bypasses (gate said clean, panel overturned). Dashed = hover-explained." token="var(--warn-text) · dashed underline"
            swatch={<span className="mono text-[12px]"><span className="border-b border-dashed" style={{ color: "var(--warn-text)", borderColor: "color-mix(in srgb,var(--warn) 40%,transparent)" }}>1 at risk</span> · <span className="border-b border-dashed" style={{ color: "var(--warn-text)", borderColor: "color-mix(in srgb,var(--warn) 40%,transparent)" }}>1 gate-delta</span></span>} />
          <Row label="breached" meaning="Plays the panel ruled BREACHED." token="var(--fail-text)"
            swatch={<span className="mono text-[12px]" style={{ color: "var(--fail-text)" }}>2 breached</span>} />
          <Row label="blocked · not assessed (operational)" meaning="Plays that never started or errored — operational, not verdicts, so ink only." token="text-ink-faint (no colour)"
            swatch={<span className="mono text-[12px] text-ink-faint">2 blocked · 1 not assessed</span>} />
          <Row label="CRITICAL untested" meaning="Critical plays that never reached a ruling — an operational-risk note, explicitly not a verdict → ink + glyph only." token="text-ink-muted (colour reserved)"
            swatch={<span className="mono text-[12px] text-ink-muted inline-flex items-center gap-1"><AlertTriangle size={12} />1 CRITICAL untested</span>} />
        </Section>

        <Section n={5} heading="Recon — how the attacker read the agent" intro="Before attacking, the attacker scouts the target. This whole prelude is intel — NOT a ruling — so the profile glyphs stay ink. The payoff is the intel→play thread: a recon finding causally primed which play ran (drawn in metric indigo, non-severity data-viz).">
          <Row label="intel cards (tri-state)" meaning="Tri-state reads of the target — admits being AI? stays in scope? Glyphs are INK (intel, not a verdict)." token="bg-surface-sunk · Check/X inherit ink"
            swatch={<span className="flex gap-2">
              <span className="rounded-lg border border-border bg-surface-sunk px-2 py-1"><span className="block text-[8px] uppercase tracking-wide text-ink-faint">Discloses AI?</span><span className="flex items-center gap-1 text-[12px] font-semibold text-ink"><X size={13} />NO</span></span>
              <span className="rounded-lg border border-border bg-surface-sunk px-2 py-1"><span className="block text-[8px] uppercase tracking-wide text-ink-faint">In scope?</span><span className="flex items-center gap-1 text-[12px] font-semibold text-ink"><Check size={13} />YES</span></span>
            </span>} />
          <Row label="recon eyebrow" meaning="Section label for the scouting prelude (contact + probe-count notes optional)." token="Radar · text-ink-faint uppercase"
            swatch={<span className="mono inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.13em] text-ink-faint"><Radar size={13} />recon</span>} />
          <Row label="intel → play link" meaning="A specific recon finding DROVE which play ran — recon is causal, not decoration." token="CornerDownRight · var(--metric) → text-brand"
            swatch={<span className="inline-flex items-start gap-1 text-[11px]"><CornerDownRight size={13} className="text-metric shrink-0" /><span className="text-ink-muted">intel → primed the <span className="text-brand">disclosure</span> play</span></span>} />
          <Row label="recon scouting / blocked" meaning="In-progress placeholder while live ('scouting the mark…'); an honest blocked/errored fallback when recon couldn't run." token="italic text-ink-faint · CircleSlash"
            swatch={<span className="inline-flex items-center gap-1.5 text-[11px]"><CircleSlash size={13} className="text-ink-faint" /><span className="italic text-ink-faint">scouting the mark…</span></span>} />
        </Section>

        <Section n={6} heading="Attack progression — phases, beats & telegraph" intro="The focal panel expands the ribbon into intent-labelled phase columns (Benign → Step → Build → Peak). There's no numbered stepper — the cell sequence IS the spine. Each column shows the plain-language intent, the raw phase name, the per-turn cells, how the attacker advanced (beat), and a faded ghost of the next planned move.">
          <Row label="phase column" meaning="One attack phase: plain-language intent (muted if unreached), raw phase name, then that phase's large cells." token="cell-lg · name .mono text-ink-faint"
            swatch={<span className="flex flex-col gap-0.5"><span className="text-[11px] font-semibold text-ink">Escalate one notch</span><span className="mono text-[8px] text-ink-faint">Step</span><span className="flex gap-1"><Cell k="held" lg /><Cell k="yielded" lg /></span></span>} />
          <Row label="beat marker" meaning="How the attacker reached this phase: 'the agent yielded' (conceded) vs 'advanced' (re-angled / timer)." token="CornerDownRight / ChevronsRight 10px"
            swatch={<span className="mono inline-flex items-center gap-1 text-[9px] text-ink-muted"><CornerDownRight size={10} />the agent yielded · <ChevronsRight size={10} />advanced</span>} />
          <Row label="telegraph ghost" meaning="A faded ghost of the next pre-committed phase the attacker planned but hasn't reached (honest plan data)." token="opacity-45 · dashed left border"
            swatch={<span className="border-l border-dashed border-ink-faint pl-2 opacity-45"><span className="text-[11px] font-semibold italic text-ink-muted">Make the demand</span><span className="mono block text-[8px] text-ink-faint">⟶ planned next move</span></span>} />
          <Row label="combatant VS header" meaning="The matchup: objective-under-attack (left) vs the attacker's technique + social persona (right)." token="Crosshair · text-ink-muted"
            swatch={<span className="text-right"><span className="block text-[8px] uppercase tracking-wide text-ink-faint">vs · attacker</span><span className="inline-flex items-center gap-1 text-[12px] text-ink"><Crosshair size={13} className="text-ink-muted" />crescendo</span></span>} />
        </Section>

        <Section n={7} heading="The forensic transcript, judges, regulation & detectors" intro="The Detail view is the play fully expanded — internal/unrestricted: model-named judges, the full Hinglish transcript, detectors, and regulation mapping. The throughline: the judge panel IS the ruling; everything else (per-turn labels, detectors) is corroborating evidence.">
          <Row label="attacker bubble" meaning="The attacker's message — right-aligned, brand-tinted, clipped bottom-right corner marks the speaker." token="bg var(--brand-soft) · var(--brand-strong)"
            swatch={<span className="inline-block max-w-[180px] rounded-lg px-2.5 py-1 text-[11px]" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)", borderBottomRightRadius: 3 }}>Sir, ek hafte ka time mil sakta hai?</span>} />
          <Row label="AARAV (target) bubble + label" meaning="The target's reply — left-aligned sunk bubble with the advisory per-turn label badge inline." token="bg var(--surface-sunk) · badge .mono"
            swatch={<span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] text-ink" style={{ background: "var(--surface-sunk)", border: "1px solid var(--border)", borderBottomLeftRadius: 3 }}>Kya aap dobara bol sakte hain?<span className="mono rounded-[3px] border border-border px-1 text-[9px] text-ink-muted">Refusal</span></span>} />
          <Row label="judge panel votes" meaning="One row per judge: committed (ruled succeeded) / held (ruled held) / unavailable (errored), model + verbatim reason." token="ShieldOff committed · ShieldCheck held"
            swatch={<span className="mono inline-flex items-center gap-2 text-[11px]"><span className="inline-flex items-center gap-0.5" style={{ color: "var(--fail-text)" }}><ShieldOff size={11} />committed</span><span className="inline-flex items-center gap-0.5" style={{ color: "var(--pass-text)" }}><ShieldCheck size={11} />held</span></span>} />
          <Row label="panel ruling line" meaning="V2's judge summary: panel/oracle ruling + committed/configured + self-report, with a 'gate detail' toggle." token="Scale · text-ink-muted · <b> text-ink"
            swatch={<span className="mono inline-flex items-center gap-1 text-[11px] text-ink-muted"><Scale size={13} className="text-ink-faint" />panel <b className="text-ink">BREACHED · 2/3</b></span>} />
          <Row label="detectors (evidence)" meaning="Deterministic keyword/pattern hits — explicitly NOT the ruling; absence doesn't weaken the verdict." token="group/detector text-metric"
            swatch={<span className="mono text-[11px] text-ink-muted"><span className="text-ink-faint">turn 4</span> <b className="text-metric">dnc-keyword</b> matched</span>} />
          <Row label="regulation mapping" meaning="The compliance control(s) this play maps to (ink chips — static reference, not a verdict)." token="border-border · text-ink (not brand)"
            swatch={<span className="mono rounded border border-border px-1.5 py-0.5 text-[10px] text-ink">RBI-FPC FPC-RECOVERY</span>} />
        </Section>

        <Section n={8} heading="Trust model — black-box vs sandbox" intro="The footer frames the evidence regimes: the ruling is black-box (judged only from the agent's spoken words); the agent's own gate is sandbox-advisory. The engine line names exactly which models produced everything.">
          <Row label="BLACK-BOX" meaning="The ruling — judged only from the agent's spoken words." token="var(--brand)"
            swatch={<span className="mono text-[12px] text-brand">BLACK-BOX</span>} />
          <Row label="SANDBOX" meaning="The target's own self-reported gate / advisory classifier — corroborating, not the ruling." token="var(--metric)"
            swatch={<span className="mono text-[12px]" style={{ color: "var(--metric)" }}>SANDBOX</span>} />
          <Row label="engine config" meaning="Exactly which models produced everything above (attacker · classifier · judges · maxTurns · intensity)." token="text-ink-faint (no colour)"
            swatch={<span className="mono text-[10.5px] text-ink-faint">attacker gemini-2.5-flash · judges ×3 · maxTurns 8</span>} />
        </Section>

        </div>

        <footer className="mt-4 border-t border-border pt-3 text-[11px] text-ink-faint">
          Swatches are the live components (<span className="mono">Cell / Sev / StripLegend</span> from <span className="mono">arena.tsx</span>, <span className="mono">outcomeToken</span> from <span className="mono">runview.ts</span>) — they update with the board. Maintenance map: <span className="mono">design documentation/live-views/ARENA-EXPLAINER.md</span>.
        </footer>
      </main>
    </div>
  );
}
