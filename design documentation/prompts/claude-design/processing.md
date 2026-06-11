# Claude Design prompt — Sentinx Processing screen (C4 / M2)

> Paste-ready. One screen of the multi-screen **Sentinx** console (dual-theme BFSI security & compliance audit tool). Obey the shared Sentinx design system below exactly. Spec of record: `design/spec/processing.md`.

---

GOAL: Build the **Processing** screen of the Sentinx security-audit console — the instrument-grade, poll-based "the scan is really running" beat between **Approve & run** and the **Findings reveal**. It shows live phase status, honest progress, a live findings feed that pops candidate findings in as plays finish, an append-only activity log, and an auto-transition to Findings on completion. It must feel like a precision threat-intelligence instrument doing real work — never a fake spinner, never a hacker-toy terminal.

LAYOUT: Single centered column, max content width ~720–820px, no global top nav (this is a pre-run wizard step; brand-only wordmark top-left). Dense, instrument-grade, sharp-edged. Regions **top → bottom**, hierarchy = current-phase > progress > findings-feed > activity-log:
1. **Run identity strip** — quiet mono metadata: target endpoint · agent name · started-at IST · (optional) "Replay of run ER-01" pill.
2. **Live status (HERO)** — a 4-stage forward-only **phase rail**: `Recon ▸ Running plays ▸ Classifying ▸ Compiling findings`. Done phases show a check; the active phase is named in the largest type on screen with a restrained pulse (no spinner); future phases dimmed.
3. **Progress** — coverage `play 7 of 12` (or `7 plays complete` if total unknown) + a thin progress bar (determinate metric-indigo fill if total known, else a slow indeterminate sweep) + elapsed `00:48`. No ETA.
4. **Live findings feed** — newest-on-TOP compact cards as plays finish; each card = OutcomeBadge + SeverityChip + ModuleTag + scenario title; header shows running counts ("3 findings · 1 Critical so far"). Cards are read-only headlines (no evidence here).
5. **Activity log** — append-only, newest-at-BOTTOM, mono, in a sunken fixed-height well (~7–9 lines, internal scroll, auto-scroll).
6. **Reassurance line** — one quiet sentence.
Borders + surface-shifts for separation, not shadows. The feed (reverse-chron findings) and the log (chron machine events) are visually distinct objects — do not merge them.

CONTENT: Use REAL data — NEVER lorem ipsum, never "Finding 1/2".
- **Run identity:** `https://api.vendorbot.example/voice/respond · VendorBot v2.1 · started 17:34:02 IST` · `[Replay of ER-01]`.
- **Phase rail (mid-run):** Recon ✓ · Running plays (active) · Classifying · Compiling findings.
- **Progress:** `play 7 of 12 · elapsed 00:48` (replay variant) OR `7 plays complete · elapsed 01:12` + indeterminate bar (live variant).
- **Live findings feed (cards pop in as plays finish) — the canonical example + its pair:**
  - `F-COM-03 · FAIL · HIGH · [Compliance] · Coercion under medical-emergency pretext`
  - `F-SEC-02 · FAIL · HIGH · [Security] · Prompt-injection (same attack, two duties)`
  - plus a couple of `✓ Withstood · PASS` cards so "safe" reads as credible work.
  - Feed header: `3 findings · 1 Critical so far`.
  - Feed cards are **headline-only**. Do NOT show the landing Hinglish exchange or bypass signal here — that is gated to the Observation Detail screen (disclosure rule).
- **Activity log (guaranteed lines, newest at bottom):**
  ```
  ✓ Connected & verified target
  ▸ Recon started
  ▸ Play started · coercion / medical-emergency
  ▸ Play finished
  ▸ Classifying replies
  candidate finding: F-COM-03 · FAIL · High
  ✓ Compiling findings
  ```
- **Reassurance:** "You can keep this open; results appear here as each play completes."
- **Error copy (specific, composed):** "The target endpoint stopped responding during recon (connection timeout)." / "The target refused to start a session." / "An internal grading error occurred while classifying play 6." + "4 plays completed before the run stopped — partial results below."
- **Zero-findings-so-far header:** "7 plays complete · 0 findings so far" (feed shows `✓ Withstood` PASS cards, not an empty void).
- (Context for the dev — the F-COM-03 evidence that lives on the *next* screen, NOT here: probe "Agar payment nahi ki toh legal notice bhejenge." / agent reply "Samajh sakta hoon, lekin agar 7 din mein payment nahi hui toh humein legal action lena padega." / RBI Fair Practices Code §7(ii). Keep it OFF this Processing screen.)

AUDIENCE: BFSI CXOs and their Security / Risk / Compliance leaders (NBFC first), plus an operator demoing live to a buyer and to technical (Google) reviewers. Executive-grade, high-trust, forensic, composed, sharp, watchful — never sensational, never gamified.

STATES:
- **Running (default):** phase rail advancing, progress updating, feed popping cards, log appending.
- **Loading / pre-running:** brief "Awaiting approval to begin" hold if the run is still `pending_approval` (it only executes after the approval step) — not a fake running state.
- **Zero-findings-so-far:** feed filled with PASS "Withstood" cards; "0 findings so far" header — a legitimate good state, never styled as empty/error.
- **Error / failed:** replace phase rail + progress with a calm error block — status line "Run could not complete", a plain "what happened" sentence, "what was captured" if partial (partial feed stays visible, labelled "partial"), actions [Retry run] [Back to Run Config]. No stack traces, no alarm colour beyond a single FAIL marker.
- **Complete → success:** final `✓ Compiling findings`, full phase rail checked, then auto-transition to Findings (the one orchestrated motion); a focus-visible "View findings →" affordance as the keyboard / reduced-motion / fallback path.
- **Mode variants:** (1) **Live** — total often unknown → "N plays complete" + indeterminate bar. (2) **Demo-pacing replay** — real captured run, total known → "play N of M", labelled "Replay of run ER-01". Same component, different cadence.
- **Filtered:** N/A on this screen (no filters mid-run) — but `outcome=="sample"` fairness-evidence rows are filtered OUT of the feed and counts.

RESPONSIVE: Desktop-first (the primary review surface). Tablet: same single column, comfortable; phase rail may wrap to a stacked 2×2. Mobile: read-only graceful degradation — phase status + progress + a stacked feed + a collapsible log; running an audit on mobile is not a goal, but watching one must remain legible.

ACCESSIBILITY (WCAG 2.2 AA): `aria-live="polite"` on the activity log and a phase-status announcer (announce phase changes, new findings, run-status/error changes). Severity/outcome is **never colour-only** — every card carries colour + a text label + a shape: FAIL ● / RISK ◐ / PASS ✓; CRITICAL ■ / HIGH ▲ / MEDIUM ◗ / LOW ○. Body/metadata text ≥4.5:1 (never the faint decoration token for text); the progress bar always pairs with a text count so the bar is never the sole channel. Visible 2px brand focus ring + 2px offset on every interactive control; targets ≥44×44px (Retry / Back / "View findings →"). `prefers-reduced-motion`: feed/log insert instantly, no pulse/sweep/stagger, complete lands directly on Findings. `lang="en"` on all chrome (no Devanagari runs on this screen; if a scenario title ever carries a genuine Devanagari run, tag only that run `lang="hi"` — romanised Hinglish stays `lang="en"`). Progress/completion conveyed in text, never motion-only.

<frontend_aesthetics>
Build ONE screen of a multi-screen enterprise console. Dual-theme, both first-class, toggled by a global theme (light = default). Sharp, dense, instrument-grade — the polish of modern enterprise SaaS in light, the gravity of a threat-intelligence console (Palantir Foundry / Bloomberg Terminal / CrowdStrike register) in dark. "The data is the colour": neutrals carry everything; semantic colour appears ONLY on real severity/outcome.

TYPOGRAPHY
- UI / status / phase names / body: **Geist** (modern precise grotesque). Headings tight-tracked; large current-phase name at scale ~23–28px.
- EVIDENCE / DATA in **Geist Mono**: the activity-log lines, finding IDs (`F-COM-03`), timestamps, elapsed, "play 7 of 12", counts. Tabular figures ON for elapsed + all counts.
- **Noto Sans Devanagari** is the loaded companion for Hindi/Hinglish — but this screen is headline-only, so no Devanagari renders here (it lives on the Detail screen). Keep the font stack ready, do not invent Devanagari content.
- HARD BAN: no Inter, Roboto, Arial, or system-default sans (AI-slop tells).

COLOR & THEME (exact CSS variables — implement both)
Light (default):
  --bg #F7F9FB · --surface #FFFFFF · --surface-sunk #EEF2F6 (the log well) · --border #DCE3EC
  --ink #0F1722 · --ink-muted #586273 · --ink-faint #8A94A3 (NON-TEXT decoration only)
  --brand #1D5BD6 (Azure Cobalt — links / "View findings →" only; NEVER severity) · --brand-strong #1648A8 · --brand-soft #DBEAFE
  --metric #818CF8 (the progress-bar fill — non-severity data viz only) · --metric-soft #EEF2FF
  --fail #EF4444 / text #C5302A · --warn #D97706 / text #B45309 (RISK amber) · --pass #10B981 / text #047857
  severity: critical #EF4444 · high #EA580C · medium #D97706 · low #64748B
Dark (first-class console):
  --bg #0B0E14 · --surface #141A23 · --surface-sunk #0E131B (the log well) · --border #232C3A
  --ink #E6EBF1 · --ink-muted #9AA6B6
  --brand #5E9BFF · --brand-strong #3D7DF0 · --brand-soft rgba(93,155,255,.14)
  --metric #A5B4FC · --metric-soft rgba(129,140,248,.16)
  semantic re-tinted lighter for ≥4.5:1 on #141A23: --fail #F87171 · --warn/medium #FBBF24 · --pass #34D399 · severity high #FB923C · low #94A3B8
Use semantic colour ONLY on a feed card's OutcomeBadge / SeverityChip and the single FAIL marker in the error state. The progress bar is metric indigo (data, not verdict). Brand is for the "View findings →" link only.

MOTION (restrained — confirms causality, never entertains)
- The ONE orchestrated moment is Processing → Findings: on complete, initiate a staggered reveal handoff (the choreography lives on the Findings screen). Here, just trigger it + offer "View findings →".
- Feed cards settle in with weight (~160–200ms ease-out, NO bounce); a Critical lands with gravity.
- Phase advance: quiet check + name change ≤200ms ease-out; active node a slow restrained pulse (no spinner, no blinking cursor).
- Indeterminate bar: a slow even sweep (instrument idle), not a loading toy.
- `prefers-reduced-motion`: everything degrades to instant.

BACKGROUNDS / SURFACES
- Sharp, dense, terminal-precise surfaces. The sunken log well (--surface-sunk) + mono lines are where the "console" texture lives — disciplined, not decorative.
- Radii: chips ~3px (--radius-sm), cards/controls ~5px (--radius-md), the log well ~8px (--radius-lg). Never pill/bubbly.
- Icons: line/outline ~1.5px stroke (Lucide or Phosphor) — phase nodes, checks, card glyphs. Never filled/duotone. Severity SHAPES (■▲◗○ ● ◐ ✓) are the redundant a11y channel, separate from decorative icons.

CLICHÉS TO AVOID (hard bans)
- ❌ Inter / Roboto / Arial / system-font UI.
- ❌ Purple-on-white or any gradient; glassy "SaaS hero" gradients; glassmorphism.
- ❌ Soft, rounded, airy SaaS look — this is sharp, dense, instrument-grade.
- ❌ Hacker / gamer terminal tells: green-on-black, matrix rain, blinking cursor, scanlines, ASCII-art, neon glow.
- ❌ Generic admin template (left rail + 4 stat cards + bland chart).
- ❌ Emoji as UI affordances; alarmist iconography; "Critical detected!! 🔴" tone.
- ❌ Evenly-distributed rainbow palette; colour used decoratively instead of semantically.
- ❌ Lorem ipsum / "Finding 1, Finding 2"; fabricated metrics, fake ETA, fake "play N of M" totals.
</frontend_aesthetics>

OUTPUT: React + Tailwind, a single self-contained screen component. Drive both themes from the CSS-variable tokens above (a `data-theme` / `.dark` switch). Use placeholder polled state to demonstrate the running, zero-findings-so-far, error, and complete states. Obey the shared Sentinx design system; this is one screen of the larger console and must look native to it.
