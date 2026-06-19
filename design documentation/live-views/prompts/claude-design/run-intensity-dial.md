# Claude Design prompt — Sentinx Run-Intensity Dial on Run Config (C3 edit, Live Views v2)

> Paste-ready. One region of the multi-screen Sentinx console — the **Run-Intensity "effort" dial** added to the **Run Config (C3)** screen, plus the run-flow shell context that carries the chosen level forward into the **V2 Arena**. Obeys the shared Sentinx design system. **Prepend `../../../prompts/claude-design/00-global-style.md` (the PREPEND-EVERYTHING-BELOW-THIS-LINE block) before this prompt** — it carries the tokens, the FAIL/RISK/PASS + severity §5 shape rules, the canonical example data, the audience, and the global a11y/responsive rules. Master spec: `design documentation/live-views/spec/run-intensity-dial.md`. Parent screen spec (governs the rest of C3): `design documentation/spec/run-config.md`. Locked decisions: `D-LV25` / `D-LV-dep4` / `D-LV21` (`../../DECISIONS.md`).

---

GOAL: Add a **Run-Intensity "effort" dial** to the Sentinx **Run Config** screen — a 6-level segmented control `[ low · med · high · xhigh · max · ultra ]` (Claude-Code-effort style), set at run start, that scales three honest levers — **attacks** (number of plays), **turns per attack**, and **breadth** (technique/persona variants per objective) — while the **judges stay fixed** (the same 3-model panel grades every level, so runs stay fairly comparable). `med` is the recommended default (doubled baseline, 16 plays / 16 turns). The dial carries a **live estimate** (plays · turns/play · breadth · approx LLM-call budget · duration band · objective coverage) that re-renders the instant the level changes, and the chosen level is echoed into the Approve & run dialog's Rules-of-Engagement summary, into RunProvenance (run home / Findings / PDF cover), and onto the V2 Arena top bar. Build it as a new region **inside the existing C3 form card** (after Agent name, before ▸ Advanced), plus the RunProvenance echo and the run-flow seam. This is the operator's "how hard should this run push" control in a BFSI-grade red-team console.

LAYOUT: A new first-class region in the centered ~560px C3 form card (NOT hidden under Advanced — it changes what the run is), placed after the **Agent name** field and above the **▸ Advanced** disclosure + scope helper + "Run audit" button. Regions top→bottom WITHIN the dial block:
  (1) **DIAL HEADER** — left: label `Run intensity` (14px Geist) + a small ⓘ line-icon info affordance (opens a popover); right: the current-level read-out (`med · recommended`, level in mono-cap, qualifier in sans `--ink-muted`).
  (2) **THE DIAL** — a 6-segment horizontal stepper, equal segments left→right ascending; the **selected** segment filled with `--brand` (`--on-brand` label), the rest `--surface` with `--border`. Each segment: the level name (mono-cap, 12px) + a **redundant fill-level glyph of 1–6 ascending ticks** beneath it (the non-colour intensity channel — a grayscale reader reads the level from the tick count, not the colour). A small "recommended" ▸ pip on the `med` segment, always present. Real radiogroup: ←/→ move, Home=low, End=ultra; each segment ≥44×44px.
  (3) **LIVE ESTIMATE STRIP** — four estimate cells in one desktop row (sans labels, mono-tabular values): `Plays 16` · `Turns / play up to 16` · `Breadth 1× technique/persona` · `LLM calls ≈ 770 calls`; then a duration-band line, a coverage line, and an always-present advisory caption (below).
  (4) **HONEST INTENSITY NOTE** — one `--ink-muted` 13px line.
Strict global hierarchy unchanged: **endpoint field > Run audit button > everything else** — the dial is a considered SECONDARY control, visually quieter than the endpoint and the primary button. Dense, sharp-edged, terminal-precise geometry; never a soft/rounded SaaS slider, never a continuous gauge.

CONTENT (exact copy + real data — no lorem, no fabricated findings, no fabricated ETA):
- Region label: `Run intensity`. Read-out per level: `low` · `med · recommended` · `high` · `xhigh` · `max` · `ultra`.
- Segment names (mono-cap): `low` `med` `high` `xhigh` `max` `ultra`.
- The level → lever map (TUNABLE defaults, `D-LV25`) drives the estimate. Plays / Turns / Breadth / objective-coverage / approx LLM-call band / duration band per level:
    `low    →  8 plays · 8 turns · 1× breadth  · up to ~8 of 37 objectives  · ≈ 190 calls   · ~3–5 min`
    `med    → 16 plays · 16 turns · 1× breadth · up to ~16 of 37 objectives · ≈ 770 calls   · ~6–10 min   (recommended, default)`
    `high   → 28 plays · 18 turns · 2× breadth · up to ~28 of 37 objectives · ≈ 1,510 calls · ~12–20 min`
    `xhigh  → 40 plays · 20 turns · 2× breadth · up to ~37 of 37 objectives · ≈ 2,400 calls · ~18–30 min`
    `max    → 60 plays · 24 turns · 3× breadth · full pool, repeated         · ≈ 4,300 calls · ~28–45 min`
    `ultra  → full catalog × all techniques · 30 turns · all variants · all 37 objectives · ≈ 7,000+ calls · ~40–70 min`
- Estimate cell labels: `Plays` · `Turns / play` · `Breadth` · `LLM calls`. Example values for `med`: `16` · `up to 16` · `1× technique/persona` · `≈ 770 calls`.
- Duration-band line (for `med`): `Est. duration ~6–10 min · judges fixed (3-model panel) at every level.`
- Coverage line (for `med`): `Covers up to 16 of 37 objectives across Security + Compliance.`
- Advisory caption (ALWAYS present, 12px `--ink-muted`): `Estimate — a planning band, not a guarantee. Actual calls vary with how early each attack resolves.`
- `ultra` extra caveat line: `Full sweep — longest run; covers all 37 objectives. Est. duration ~40–70 min.`
- `med` recommended-pip tooltip: `Recommended — doubled baseline. Covers both pillars at a fair, comparable depth.`
- Honest intensity note: `Higher intensity widens coverage and depth. It does not change how strictly findings are judged.`
- ⓘ info popover: `Run intensity scales three things — how many attacks run, how many turns each attack gets, and how many technique/persona variants are tried per objective. It does not change the judges: every level is graded by the same fixed 3-model panel, so runs at different intensities stay fairly comparable. med is the recommended default — a doubled baseline that covers both Security and Compliance.`
- **Echo forward (RunProvenance + Approve dialog + V2):**
    Approve & run dialog adds an RoE row (mono values): `Intensity   high · 28 plays · ≤18 turns · 2× breadth`.
    RunProvenance (run home / Findings) adds a line: `Intensity  high (28 / 18 / 2)` — on a COMPLETED run with a shortfall: `Intensity  high · 24 of 28 plays run · ≤18 turns`.
    V2 Arena top-bar provenance ref: `ER-01 · VendorBot v2.1 · 12 Jun 17:34 IST · high`.
    PDF cover provenance: `Intensity: high` (actual executed counts, not the estimate).
- Use `VendorBot v2.1` as the demo agent and `ER-01` as the run ref so it matches the rest of the console. **Do NOT** put any sample finding, severity chip, outcome badge, score, the F-COM-03 `"Agar payment nahi ki…"` Hinglish line, or any judge/detector data on this region — it is PRE-RUN, no evidence exists yet (fabricated precision is banned). The canonical example appears only implicitly via `VendorBot v2.1` and the `Security + Compliance` coverage the run will be graded against.

AUDIENCE: BFSI CXOs and their Security / Risk / Compliance leaders (NBFC-first); driven live by the Sentinx operator (P3) at run start and read back by the Product Admin (P5) on V2 / provenance. Executive, high-trust read; the dial must feel like a precise, honest instrument control (effort = coverage, not a better verdict), never a gamified "power slider." Regulator-credible, forensic, composed.

STATES:
- **default (med)**: `med` segment selected (`--brand` fill + 2-tick glyph + recommended ▸ pip), read-out `med · recommended`, estimate = 16 / up-to-16 / 1× / ≈770 calls / ~6–10 min.
- **selected — low / high / xhigh / max**: the picked segment fills; the estimate strip + duration band + coverage line re-render to that level's row (table above); `aria-live` announces the new estimate. `low` adds an estimate qualifier `Lighter — a fast smoke pass; narrower coverage.`
- **selected — ultra**: 6-tick segment fills; estimate shows the full-catalog row + the extra caveat line `Full sweep — longest run; covers all 37 objectives…`. Rendered as the documented heaviest level in NEUTRAL/brand — NOT alarm-coloured, NOT an error.
- **focus**: 2px brand focus ring on the radiogroup; ←/→ move selection (focus ≠ selection until moved); roving tabindex, single tab-stop.
- **reduced motion**: segment fill + estimate values swap INSTANTLY (no count-up, no cross-fade); `aria-live` still announces.
- **echoed / preserved**: the chosen level flows into the Approve dialog RoE row and is preserved across the Approve→Cancel round-trip and an edit-return (no re-selection demanded, SC 3.3.7).
- **run-flow seam (shell context)**: on "Run audit" → connection-check reachable (C3, unchanged) → Approve dialog (RoE shows the intensity) → `POST /scan {budget, max_turns, breadth}` → `POST /runs/{id}/approve` → Processing (C4) → "Watch the duel" → V2 Arena (top-bar ref shows the level; pillar bands populate up to the budget; an objective the budget didn't reach shows as a first-class "not assessed" coverage flag on V2 — never a silent gap, never a backfilled total).
- The dial itself has **NO network/loading/empty state** — it always has a valid default and a synchronous client-computed estimate.

HONESTY INVARIANTS (absolute — must visibly hold): judges are FIXED across every level (state it in copy: the honest note + the ⓘ popover); the estimate is a planning BAND not a promise (advisory caption always present + announced); no fabricated single-minute ETA; no continuous "intensity gauge" implying false precision (it is a 6-state stepper bound to a real level→budget map); intensity uses `--brand` + neutrals ONLY — never `--fail`/`--warn`/`--pass`/severity colours (intensity is not a verdict); coverage shortfalls downstream are first-class "not assessed" flags, never silent; the objective pool is 4 Security + 33 Compliance = 37 objectives (both pillars named); completed-run provenance shows REAL `playsTotal`/`maxTurns` (the pre-run numbers are clearly labelled estimates, replaced by actuals).

RESPONSIVE: Desktop-first (dial 6 segments in one row, 4 estimate cells in one row, fits the ~560px form card without forcing scroll on a laptop). Tablet: segments stay one row (or wrap 3+3 if tight), estimate cells wrap to a 2×2 grid, targets ≥44px. Mobile (read-only degradation, running an audit on mobile is not a goal): dial stacks as a full-width 6-row list (name + tick-glyph + one-line per-level estimate per row), estimate strip stacks single-column, no horizontal scroll, de-emphasised.

ACCESSIBILITY (WCAG 2.2 AA): the dial's intensity is colour + label + SHAPE, never colour-only — selected `--brand` fill AND the mono-cap level name AND a redundant 1–6 ascending tick-glyph (grayscale-legible from name + tick count). NO severity colour anywhere on this region (intensity is not an outcome — `--brand` + neutrals only; `ultra` is not alarm-coloured). `role="radiogroup"` with `aria-label="Run intensity"`; each segment `role="radio"` + `aria-checked`; ←/→ move, Home=low, End=ultra; single tab-stop, roving tabindex; the recommended pip described via `aria-describedby` on the `med` radio. The live estimate strip is `aria-live="polite"` + `aria-atomic="true"` so the new estimate (plays / turns / breadth / call band / duration + the "planning band, not a guarantee" caption) is announced on level change. Visible focus ring (2px brand outline, 2px offset) on the radiogroup + ⓘ; targets ≥44×44px (segments and ⓘ); NOTHING requires drag (a stepper, not a slider — SC 2.5.7); the chosen level is preserved across Approve→Cancel (SC 3.3.7); inherits C3 `scroll-padding-top` (SC 2.4.11); chrome is `lang="en"` (Noto Sans Devanagari stays in the stack for a Devanagari agent name elsewhere on C3); reduced-motion → instant swaps. Contrast: labels/values/notes in `--ink`/`--ink-muted` (≥4.5:1); `--ink-faint` only for idle ticks/dividers (non-text), never readable text.

<frontend_aesthetics>
TYPOGRAPHY:
- `--font-sans: "Geist", "Noto Sans Devanagari", sans-serif` for all UI: the region label, estimate cell labels, the duration/coverage/advisory/honest-note prose, the ⓘ popover, and button/dialog chrome.
- `--font-mono: "Geist Mono", "Noto Sans Mono", monospace` for **data-as-text only**: the segment level names (mono-cap), the estimate cell VALUES (`16`, `up to 16`, `≈ 770 calls`), and the RoE/provenance intensity values (`high · 28 plays · ≤18 turns · 2× breadth`). Mono is the forensic signal — reserve it for data, not for prose or the descriptive labels.
- `--font-deva: "Noto Sans Devanagari"` companion in the stack (no Hindi content on this region, but the fallback must exist).
- Type scale (1.20 minor third, 16px base): region label ~14px; segment names ~12px mono-cap; estimate values ~14px mono tabular; captions/notes 12–13px. **Tabular figures ON** for every numeric (plays/turns/breadth/calls). BAN Inter / Roboto / Arial / system-default sans (AI-slop tells).

COLOR & THEME (exact CSS variables, reused verbatim from `sentinx-web/app/globals.css`; light default + first-class dark console — `D-LV21`; semantic colour reserved for outcome/severity, which this region has NONE of — intensity earns ONLY `--brand`):
LIGHT (default):
  --bg #F7F9FB; --surface #FFFFFF; --surface-sunk #EEF2F6; --border #DCE3EC;
  --ink #0F1722; --ink-muted #586273; --ink-faint #8A94A3 (non-text decoration / idle ticks only);
  --brand #1D5BD6 (Azure Cobalt — the SELECTED dial segment fill, the ⓘ/links, the focus ring; NEVER severity);
  --brand-strong #1648A8 (hover/press on a segment); --brand-soft #DBEAFE (segment hover / subtle container);
  --on-brand #FFFFFF (label on the selected/filled segment);
  --metric #818CF8 / --metric-soft #EEF2FF (available for a NON-severity estimate accent ONLY if needed — prefer neutrals).
  (Do NOT use --fail/--warn/--pass/--sev-* anywhere on this region — intensity is not a verdict.)
DARK (first-class toggle, threat-intelligence console — Palantir/Bloomberg/CrowdStrike register):
  --bg #0B0E14; --surface #141A23; --surface-sunk #0E131B; --border #232C3A;
  --ink #E6EBF1; --ink-muted #9AA6B6; --ink-faint #5C6675;
  --brand #5E9BFF; --brand-strong #3D7DF0; --brand-soft rgba(93,155,255,.14); --on-brand #08111F;
  --metric #A5B4FC; --metric-soft rgba(129,140,248,.16).
  Semantic/severity tokens exist but are NOT used here. The brand Azure-Cobalt is the single disciplined accent; neutrals carry the canvas ("the data is the colour"). Re-verify the selected-segment `--on-brand` label and all text at AA in both themes.

GEOMETRY & DENSITY: sharp / terminal-precise radii — `--radius-sm 3px` (the segment ticks / small chips), `--radius-md 5px` (the dial segments / controls), `--radius-lg 8px` (the form card + the Approve dialog). 4px spacing scale (4 8 12 16 24 32 48). The 6 dial segments are a tight, aligned, equal-width row with hairline `--border` dividers — a precise instrument stepper, NOT a rounded pill toggle, NOT a draggable range slider. One soft elevation on the form card; otherwise borders + background-shifts for separation. Line/outline icons only, ~1.5px stroke (Lucide: `info` for ⓘ, `chevron-right`/a small marker for the recommended pip, `gauge` is acceptable ONLY as a quiet header glyph if used — never a filled meter). The tick-glyph is shape-bearing (the redundant intensity channel), not decorative.

MOTION (restrained — DESIGN.md §3.4): the single orchestrated "delight" beat in the Live Views is the V2 VerdictReveal overturn, which is NOT on this screen — so here motion is purely functional and ≤200ms ease-out: the segment fill transition on selection, the estimate value swap, the ⓘ popover + Advanced disclosure. NO count-up animation on the estimate numbers (they swap), no bounce, no attention-seeking motion. Respect `prefers-reduced-motion` (instant swaps, instant popover).

BACKGROUNDS: flat, sharp, dense enterprise surfaces; quiet light canvas (#F7F9FB) or near-black layered dark (#0B0E14 / #141A23). NO gradients, NO glassmorphism, NO purple-on-white SaaS hero, NO matrix/terminal tells (no green-on-black, no blinking cursor, no scanlines). The dark theme is a composed war-room console, not a hacker toy.

CLICHÉS TO AVOID: Inter/Roboto/Arial or system-default fonts; purple or any gradient on white; glassy SaaS hero; soft rounded "friendly SaaS" cards; a continuous "power/intensity gauge" or speedometer dial implying false precision (use the discrete 6-segment stepper); a draggable range slider (it must be a click/arrow stepper — no drag, SC 2.5.7); severity/alarm colour on the dial (intensity is not a verdict); a fabricated single-minute ETA; generic admin template; emoji as UI affordances; alarmist iconography; lorem ipsum or "Level 1 / Level 2" placeholders; any seeded finding/score/severity on this pre-run region.
</frontend_aesthetics>

OUTPUT: React + Tailwind — the Run-Intensity dial region as it sits inside the Sentinx Run Config (C3) form (render it in the context of the C3 form card so the placement and hierarchy are correct), plus the RunProvenance intensity-echo line and the Approve-dialog RoE intensity row. Implement the design tokens above as CSS variables / a Tailwind theme extension; support the light/dark toggle; obey the shared design system. Wire the dial as a controlled radiogroup whose level drives the client-side estimate (from the level→lever map above) and is carried into the `POST /scan {budget, max_turns, breadth}` payload → Approve & run → Processing → V2 Arena seam. Demonstrate every state listed (default med, each selected level incl. ultra caveat, focus, reduced-motion, the echoed provenance/RoE line). No backend mocks beyond the state stubs needed to show every state and the estimate map.
