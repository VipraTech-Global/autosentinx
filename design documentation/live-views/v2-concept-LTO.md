# V2 Concept — "LADDER / TELEGRAPH / OVERTURN" (candidate, in interview)

> The recommended bold direction for V2 from the 2D-game-design exploration (6 lenses scored; this is the synthesis). **Candidate — being ratified through the design interview (`DECISIONS.md`), then folded into `04-uiux-plan.md`.** Keeps the four mandated duel concepts (matchup · stakeout map · attack arc · gate-delta climax) while radically re-conceiving how they are shown; obeys `00-foundation.md` in full.

## Why this, not the depth metaphors
The engine data kills the obvious metaphors: **every attack runs its full plan to the final phase — holds AND the breach** (`arcComplete=True` for both). So "how deep did it push" (RTS march / tower-defense lane / roguelike floors) renders **every play identical**. The thing that actually separates held from breached is the **shape of the label sequence** (a wall of Refusals vs a run of Succeeds) and the **gate-delta** at the verdict. So the spine must be the **label-tempo**, not a depth axis.

## The three grafted ideas
- **LADDER** *(fighting-game telemetry)* — the chassis. Highest functionality+honesty+foundation-fit; the only encoding that discriminates real plays.
- **TELEGRAPH** *(wargame-hex)* — the boldest new idea: show the attacker's **pre-committed next phase-name + intent** as a faint ink "planned next move" ghost (honest — `phasePlan[]` exists before the arc fills).
- **OVERTURN** *(sports-VAR)* — the gate-delta staged as "on-field clean → sent upstairs → overturned to BREACHED", a re-watchable replay-to-pivot.

## Run view — a stacked FRAME-LADDER (replaces the tile-rail)
Two **pillar bands** (Security upper, Compliance lower — F3's both-pillars reality made spatial), each with its real withstood-fraction. One **row per play**, severity-ordered: gutter = SeverityChip glyph (shape) + objective id (mono) + OutcomeBadge run-state. Body = a **frame-ribbon**: one cell per turn, **shape-encoded in ink** (held=solid / wavered=half / yielded=hollow, advisory-captioned, no verdict colour); **length = real turn count**. Right edge = the **verdict cap** (check=HELD, disc=BREACHED — the one place `--fail` is spent); on a real `gateDelta.disagree` the cap **FORKS** (self-report "clean" over panel "breached") — the only place two outcomes share one slot, so the silent bypass is the most visually distinct event on screen. Above: the one-line story + first-class coverage ("assessed 7/8 · 1 CRITICAL untested"). Degraded plays = first-class **dashed "not assessed"** ribbons. Real `nJudges` per row. The resting read = six quiet Refusal-ribbons + one all-Succeed ribbon forking at its cap.

## Focal play — the SAME ribbon expands in place (zoom continuum, not a new stage)
`CombatantHeader` (attacker [technique·persona, crosshair] vs target [AARAV, shield], line icons). The ribbon's frames **group into phase bands** from `phasePlan[]`, each labelled with its real phase-name + intent (V2 internal/unrestricted). The **TELEGRAPH**: the next unreached band as a faint ink ghost ("planned next move"); un-played bands on an early end read "not reached", never "would have won". `StrategyBeat`s ride band boundaries from real `beats[].trigger` (chevrons-right advanced / corner-down-right conceded, ink only). Advisory label pips per frame, captioned "not the ruling". arc-complete vs ran-out-of-turns stated plainly. Click a band → its landing exchange (landing only; full transcript stays V3).

## The climax — the VERDICT-CAP OVERTURN (the one LV-4 moment)
≤320ms, once, no shockwave/desaturation, instant under reduced-motion. On a real `gateDelta.disagree`: (1) on-field call shows first — AARAV self-reported `clean`; (2) a thin connector draws to the **pivotTurn** frame (none if `pivotTurn=null` → "panel ruled on the full exchange"); (3) the cap **forks**, OutcomeBadge → BREACHED, hero line verbatim: **"The agent believed it held. The judges disagree."** + real panel (N of real nJudges) + verbatim winning reason (mono) + `git-compare` glyph. Plain FAIL → "decision stands — panel agreed". HELD → composed HeldState (+ `award` on critical-held). **Re-triggerable replay-to-pivot** (M22) as a user-invoked function.

## Elevation over `duel2.html` (more on all three axes)
- **Abstraction:** the whole run is one comparative artifact (every play a readable ribbon across two real pillar bands) — "held-under-pressure vs held-untouched vs the one fork" at a glance; momentum reconstructed *honestly* from the label sequence, no meter.
- **Engagement:** the **telegraph** (forward anticipation the prototype never had) + a re-watchable **VAR overturn** replacing the banned shockwave.
- **Functionality:** one ribbon primitive scales glance→round→forensic (retires the rail/arc/integrity-strip as three separate widgets); gate-delta promoted from banner to a structural **fork**; replay-to-pivot is a real control; coverage/CRITICAL-untested first-class.
- Retires every banned element the prototype still ships (emoji, system/SF-Mono fonts, ad-hoc tokens, kill-node/siege copy, the shockwave/desat).

## Foundation compliance
Dual-theme (skin-only), Geist/Geist-Mono/Devanagari, **severity-only colour** (ribbons/bands/telegraph/beats/pips all ink/ink-faint by shape; `--fail` only on a settled BREACHED cap+fork, `--pass` only on settled HELD, `--warn` only on a real RISK + CRITICAL-untested flag, `--metric` for vote/coverage), line icons per the LV-3 map, **one** orchestrated moment, every mark bound to a real field, degraded states first-class, WCAG 2.2 AA (shape redundancy, ≥24px targets, keyboard zoom+replay).

## Open questions (being walked in the interview)
1. **Spine:** accept the frame-ladder (momentum from label sequence) over depth/length encodings? *(load-bearing)*
2. **Telegraph:** OK to show the attacker's pre-committed next phase-name+intent as a "planned next move" ghost (V2-internal)?
3. **One-moment budget:** replay-to-pivot as a user-invoked function (not a 2nd delight beat); overturn as 3-step reveal or single settle?
4. **Fork legibility:** render the self-report cap subordinate/advisory; keep the hero line as the single headline?
5. **All-HELD + degraded:** HeldState/award for a clean run; dashed "not assessed" + CRITICAL-untested for the degraded case?
