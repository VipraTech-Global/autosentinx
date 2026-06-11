# Sentinx v1 — Spec: Processing (C4 / M2)

> Master spec for the **Processing** screen — the poll-based, instrument-grade "the scan is real" beat between **Approve & run** (Run Config, C3) and the **Findings reveal** (C5). This file is subordinate to `DESIGN.md` (foundation, wins on conflict), `DECISIONS.md` (D-Q1…D-Q20, authoritative), `04-uiux-plan.md` §C4 (bones), and the backend field schema in `BACKEND-UPDATE.md` / `BACKEND-UPDATE-2.md` (real variable names). Owner: **P3 (operator/demo driver)**; P2 (Arjun) is an interested watcher. Renders in the **active global theme** (light default · dark "threat-intelligence console" toggle, D-Q5/Q6) — no Processing-only dark treatment.

---

## 1. Purpose

Make a 1–3 minute black-box scan **feel real, honest, and instrument-grade** while it runs, and hand off to Findings with the one orchestrated motion moment in the product. Three jobs, in priority order:

1. **Hold attention honestly.** The operator (P3) is talking over this in a live demo to a BFSI buyer + Google reviewers. The screen must look like a precision instrument doing real work — not a fake spinner, not a hacker-toy terminal. Every line it shows must map to a real engine stage (DESIGN.md §4 "no fake precision"; `04-uiux-plan.md` §C4 "No fabricated steps").
2. **Surface evidence as it lands.** A **live findings feed** pops candidate findings in as plays finish, so the value is legible *before* the reveal — the brand promise is "proof, not promises" (DESIGN.md §1).
3. **Orchestrate the handoff.** On `status: completed`, auto-transition to the **Findings reveal** — the single "delight" beat (DESIGN.md §3.4): staggered entrance of score band → critical risks → table. This screen *initiates* that motion; the choreography lives in the Findings spec.

**Non-goals / out of scope here:** the Findings layout itself (C5); the approval click (that is C3's "Approve & run", D-Q20 — Processing begins *after* `POST /runs/{id}/approve` succeeds and `status` leaves `pending_approval`); any backend streaming (there is none — fact h, `BACKEND-UPDATE-2.md` §3 — this screen **polls** `GET /runs/{id}`).

---

## 2. Data model — how Processing knows what to show

There is **no websocket / SSE / StreamingResponse** in the backend (`BACKEND-UPDATE-2.md` fact h, grep-clean). Processing is a **poll loop over `GET /runs/{id}`**, which returns the full `{run, attempts:[{attempt, turns}]}` blob.

| UI concept | Source (REAL backend variable) | Notes |
|---|---|---|
| Run identity — target | `Run.target_url` | = `aarav_base_url` (fixed to AARAV sandbox, fact g). Display as the operator-entered endpoint label; **never** surface "sandbox" wording (D-Q14 vision-forward). |
| Run identity — agent name | operator input from Run Config (C3) | Not a distinct backend field; echoed from the form (e.g. `VendorBot v2.1`). |
| Run identity — started-at | `Run.approved_at` (preferred) else `Run.created_at` | IST, mono. Execution begins at approval (D-Q20). `created_at` is naive UTC — convert to IST for display. |
| **Run status (the gate)** | `Run.status` | `pending_approval` → `running` → `completed` \| `failed`. Drives the whole phase machine (see §5). |
| Coverage "play N of M" | **N** = `Run.num_attempts` (attempts written so far) · **M** = total planned plays | ⚠️ **M is CONDITIONAL.** The engine does not expose a guaranteed total-plays count up front (technique selection is budget/bandit-driven, Phase 5). Render `play N of M` **only** when a real M is known (replay mode has it; live may not). Else render **"N plays complete"** with an indeterminate bar (see §5, §6). NEVER fabricate M. |
| Succeeded-so-far (optional micro-stat) | `Run.num_succeeded` | count of `outcome=="succeeded"`. Used only as a quiet running tally if shown; not emphasized (no alarmism mid-run, DESIGN.md §4). |
| Elapsed | now − started-at (UI clock) | Computed UI-side, mono, `mm:ss`. **No ETA** unless the engine yields a real estimate — it does not today, so ETA is **absent**, not faked (`04-uiux-plan.md` §C4). |
| **Live findings feed item** | each new `attempt` in `attempts[]` whose `outcome` resolved | One feed card per finished play. **Filter `outcome=="sample"`** (fairness raw-evidence rows) — they are NOT findings (`BACKEND-UPDATE-2.md` fact b; must-filter flag). |
| Feed item — scenario | join `attempt.objective_slug → Objective.title` | Severity/title/pillar live ONLY on `Objective` (fact d) — join via `objective_slug`, not `objective_id` (now a human label, fact c). |
| Feed item — module | `Objective.primary_pillar` (`compliance` \| `security`) | Via the same join. |
| Feed item — outcome | derived from `attempt.outcome` + mode-aware oracle | succeeded→FAIL · defended+split→RISK · defended+0→PASS (see §3). |
| Feed item — severity | `Objective.severity` (`critical\|high\|medium\|low`) | Via join. Colour + label + shape (DESIGN.md §5). |
| Governance / audit line (optional) | `AuditEvent.event_type` (`scan.approved`, `scan.started`, `scan.completed`) + `intact` from `GET /audit?run_id=` | Hash-chained log (`BACKEND-UPDATE-2.md` §5). Use ONLY for the guaranteed "Approved & started" line and an optional chain-integrity reassurance; do not invent intermediate events. |
| Error detail | `Run.status=="failed"` and/or `Attempt.error` / `outcome ∈ {error, blocked}` | `error` text populated only for `error`/`blocked` outcomes. Drives the error state (§5). |

**Outcome derivation for feed items (mode-aware — D-Q4/Q10/Q19, `BACKEND-UPDATE-2.md` facts a/b):**
- **3-judge-panel modes (the 13 panel modes):** FAIL = `outcome=="succeeded"`; **RISK = `defended` ∧ exactly 1 of 3 `judge_votes` committed**; PASS = `defended` ∧ 0 committed.
- **Single-judge modes** (`VULNERABILITY_FAIL`, `MIS_SELLING`, `n_judges=1`): FAIL = committed; **RISK = not-committed ∧ `verdict_score` ∈ [t_lo, t_hi)**; PASS = below `t_lo`.
- **`FAIRNESS_VIOLATION`:** outcome from the `FairnessVerdict` summary attempt; its `sample` rows are filtered out of the feed.
- **Guard the RISK rule on `judge_votes.length === 3` with a `committed` field on each entry** — never assume 3 (fact a/b). `unknown`/`blocked`/`error` are operational, never PASS, and do not pop as findings (they may emit a quiet log line).

---

## 3. Run modes (no fake data in either) — D-Q15

Both modes render the **same component**; only the event cadence differs.

| Mode | What it is | Cadence | Total M known? | Label |
|---|---|---|---|---|
| **Live** | Honest real-time scan; polls `GET /runs/{id}`. | 1–3 min; poll interval ~1–2 s. | Often **no** (bandit selection) → "N plays complete" + indeterminate bar. | none (default) |
| **Demo-pacing replay** | A *real* previously-captured run (`ER-01`) replays its real events at narratable speed (~20–30 s) so the presenter can talk over recon → plays → classify and still reach the reveal inside a 3-minute demo. | ~20–30 s scripted from the captured timeline. | **Yes** (the captured run's true total) → "play N of M". | a quiet, explicit **"Replay of run ER-01"** pill — never disguised as live. |

Replay is **labelled as a replay** (`04-uiux-plan.md` §C4) — honesty is non-negotiable (DESIGN.md §4). Both modes obey the same anti-terminal-tell rules in dark (§7).

---

## 4. Layout / bones (regions top → bottom; dense, instrument-grade)

Single column, centered, max content width ~720–820px (this is a focused wizard step, no global chrome pre-run — `04-uiux-plan.md` §A). Hierarchy = **current phase > progress > findings feed > activity log**. Spacing is the structural tool (DESIGN.md §3.3); borders + surface-shifts over shadows.

```
┌─ (no top bar — pre-run wizard; brand-only wordmark top-left, returns to Landing) ─┐
│                                                                                   │
│ ▭ RUN IDENTITY (quiet, mono metadata strip)                                       │
│     target endpoint · agent name · started 17:34:02 IST   [Replay of ER-01]?      │
│                                                                                   │
│ ▭ PRIMARY — LIVE STATUS (the hero, current phase)                                 │
│     a 4-stage phase rail:  Recon ▸ Running plays ▸ Classifying ▸ Compiling         │
│     current phase named large; done phases checked; future phases dimmed           │
│                                                                                   │
│ ▭ PROGRESS                                                                         │
│     coverage: "play 7 of 12"  (or "7 plays complete" if M unknown)                │
│     determinate bar (metric indigo) if M known · else indeterminate sweep          │
│     elapsed 01:12   (· est. ONLY if engine yields a real one — today: absent)      │
│                                                                                   │
│ ▭ LIVE FINDINGS FEED (the proof; newest at TOP, settles in with weight)            │
│     compact cards as plays finish — OutcomeBadge + Severity + Module + scenario     │
│     each card is read-only here (full evidence is gated to Detail, post-reveal)    │
│     header counts mid-run: "3 findings · 1 Critical so far"                         │
│                                                                                   │
│ ▭ ACTIVITY LOG (append-only, aria-live=polite, newest at BOTTOM, mono)             │
│     real engine events; guaranteed lines always, conditional lines only if real    │
│     scrolls within a fixed-height sunk well; auto-scrolls unless user scrolled up   │
│                                                                                   │
│ ▭ REASSURANCE (subtle, ink-muted)                                                  │
│     "You can keep this open; results appear here as each play completes."           │
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Region notes:**
- **Run identity** uses `RunProvenance` (partial — target · agent · started-at only; full provenance is a Findings concern). Mono, `--ink-muted`, small.
- **Live status / phase rail** is the visual hero. Four phases map to real engine stages (§5). The current phase gets the largest type on screen (scale 23/28); a slim, restrained progress affordance per phase (a filling underline or a quiet pulse on the active node — **not** a spinner, **not** a blinking cursor).
- **Progress** sits directly under status. The bar is the **only** place metric indigo appears mid-run as a fill; it is data viz, not severity (DESIGN.md §3.1 — metric is non-severity).
- **Live findings feed** is the second-most-important region (it is the "proof"). Cards stack newest-on-top so the latest result is always in view without scrolling. Each card carries the redundant non-colour channel (label + shape) so a Critical reads without colour (DESIGN.md §5).
- **Activity log** is a `RunStatusLog` in a `--surface-sunk` well, mono, fixed height (~7–9 lines visible), internal scroll, newest at bottom (log convention; opposite of the feed, which is reverse-chron for glanceability). This is the dense "terminal precision" texture — but **disciplined**, not decorative.
- The feed (newest-top, card) and log (newest-bottom, line) are deliberately **different objects**: the feed is *findings* (evidence), the log is *machine events* (provenance). Do not merge them.

**Density / theme:** dense in both skins; dark is the "war-room" read. The log well + feed cards are where the console texture lives. No gradients, no glass, no scanlines, no matrix rain, no green-on-black (DESIGN.md §6; `04-uiux-plan.md` §C4).

---

## 5. States (the phase machine + non-running states)

Driven by `Run.status` and the polled blob. `aria-live` announces phase changes and run-status changes (DESIGN.md §5).

### 5.1 The four phases (running) — mapped to real engine stages
| Phase (UI) | Engine reality (guaranteed) | Enters when | Activity-log line(s) |
|---|---|---|---|
| **Recon** | session start / target verification + recon | `status` flips to `running` after approve | `✓ Connected & verified target` · `▸ Recon started` |
| **Running plays** | composable techniques execute per attempt (Phase 4) | first `attempt` appears / recon line emitted | `▸ Play started` · `▸ Play finished` (per attempt, if observable) |
| **Classifying** | per-turn classifier + StrongREJECT panel / special / fairness oracle grade | attempts accumulating / grading underway | `▸ Classifying replies` |
| **Compiling findings** | run rollup (`num_succeeded`, ASR) prepared | nearing `completed` | `✓ Compiling findings` |

Phases are presented as a forward-only rail; a completed phase shows a check (DESIGN.md §5 PASS shape ✓), the active phase is named + lightly animated (settle, not bounce), future phases are `--ink-faint` (decoration, non-text-contrast OK).

### 5.2 GUARANTEED vs CONDITIONAL log lines (the honesty contract — `04-uiux-plan.md` §C4)
**GUARANTEED — the engine provably emits today; always render in order:**
```
✓ Connected & verified target
▸ Recon started
▸ Play started        (per play, when an attempt write is observable via poll)
▸ Play finished       (per play)
▸ Classifying replies
✓ Compiling findings
```
**CONDITIONAL — render ONLY if the engine actually provides the datum this poll; else simply absent (not faked):**
```
Play 4 / 12              ← only if a real total M is known (replay; rarely live)
elapsed 01:12 · est …    ← elapsed always; "est" ONLY with a real engine estimate (none today)
candidate finding: F-COM-03 · FAIL · High   ← only when a graded attempt exists this poll
```
A conditional line that has no real backing **does not appear at all**. No placeholder, no spinner-as-step.

### 5.3 Running (default success-path state)
Phase rail advancing · progress updating · feed popping cards · log appending · reassurance line present. Reduced motion: log + feed still update (instant inserts); no flourishes, no settle animation (DESIGN.md §3.4).

### 5.4 Zero-findings-so-far (mid-run, the "agent is holding" read)
If no FAIL/RISK cards yet, the feed is **not empty** — it shows PASS cards as plays withstand ("✓ Withstood" cards) so "safe" looks like credible work, not a void (`04-uiux-plan.md` §C5 zero-findings ethos applied mid-run). Header reads "N plays complete · 0 findings so far". This is a *legitimate, good* mid-state, never styled as an error or emptiness.

### 5.5 Error state (`Run.status=="failed"`, or fatal target/engine failure)
The honesty load lives here (D-Q14 — an unsupported/unreachable endpoint must fail gracefully, never a fabricated result). Replaces the phase rail / progress with a calm, composed error block (DESIGN.md §1 "composed", §4 voice):
```
▭ status: Run could not complete
▭ what happened (plain, specific, from Run.error / Attempt.error / outcome):
    e.g. "The target endpoint stopped responding during recon (connection timeout)."
         "The target refused to start a session (blocked)."  ← outcome=="blocked"
         "An internal grading error occurred on play 6."      ← outcome=="error"
▭ what was captured (if partial): "4 of N plays completed before the error."
▭ actions: [Retry run]  [Back to Run Config]
```
No stack traces, no raw JSON, no alarm colour beyond a single FAIL marker on the status word. If some attempts graded before the failure, the partial feed remains visible (honest partial result), clearly labelled "partial — run did not complete".

### 5.6 Complete → auto-transition (the orchestrated moment)
On `status=="completed"`: a final `✓ Compiling findings` log line, the phase rail fully checked, then **auto-advance to Findings** with the one orchestrated motion (DESIGN.md §3.4). Processing **initiates** the reveal; the staggered entrance (score band → critical risks → table) is specced in the Findings spec. No manual "Continue" is required, but a focus-visible **"View findings →"** affordance appears as the keyboard/reduced-motion path and as a fallback if auto-transition is interrupted. Reduced motion: skip the stagger, land directly on Findings.

### 5.7 Approval-pending guard (edge — D-Q20)
If polling begins while `status=="pending_approval"` (approve not yet confirmed), Processing shows a brief "Awaiting approval to begin" hold rather than a fake running state — because the run does not execute until `POST /runs/{id}/approve` (`BACKEND-UPDATE-2.md` fact h nuance). In the normal flow this is transient/skipped (C3 fires approve before routing here).

---

## 6. Components used (from the foundation inventory, DESIGN.md §7)

| Component | Use on this screen |
|---|---|
| `RunProvenance` (partial) | Run-identity strip: target · agent · started-at IST (mono). |
| `RunStatusLog` | The append-only activity log (aria-live, guaranteed/conditional lines). |
| `OutcomeBadge` | Per feed card: FAIL ● / RISK ◐ / PASS ✓ (RISK is live, D-Q4/Q10). |
| `SeverityChip` | Per feed card: CRITICAL ■ / HIGH ▲ / MEDIUM ◗ / LOW ○ (colour+label+shape). |
| `ModuleTag` | Per feed card: Security / Compliance (from `primary_pillar`). |
| `EmptyState` | Only for the error/partial framing; the *running* feed is never an empty void (PASS cards fill it). |
| **Phase rail** (screen-local) | Recon ▸ Running plays ▸ Classifying ▸ Compiling — built from the same line-icon + tabular type system; not a new global component. |
| **Progress bar** (screen-local) | Determinate (metric indigo fill) when M known; indeterminate sweep otherwise. |
| `WithstoodFraction` | NOT here (that is the Findings summary). Mid-run shows raw running counts only ("N plays complete"), never a computed fraction that could mislead before the run ends. |

`EvidenceBlock` / `TranscriptTurn` / `JudgePanel` / `BypassSignal` / `RegulationCite` are **NOT** on this screen — feed cards are headline-only; full forensic evidence is gated to Observation Detail (C6), post-reveal, per the disclosure rule (D-Q12). The Processing feed shows *that* a finding landed, not the landing exchange.

---

## 7. Theme & visual specifics (light default · dark console)

Renders in the **active global theme** (D-Q5/Q6) — Processing has no special dark treatment.

- **Colour discipline ("the data is the colour"):** neutrals carry the canvas. Semantic colour appears **only** on real candidate-finding events (a feed card's OutcomeBadge / SeverityChip) and the single FAIL marker in the error state. The progress bar uses **metric indigo** (`--metric` #818CF8 light / #A5B4FC dark) — non-severity data viz, never a verdict colour. Brand Azure-Cobalt (`--brand` #1D5BD6 light / #5E9BFF dark) is for the "View findings →" affordance / any link only — never severity.
- **Light tokens:** `--bg` #F7F9FB · `--surface` #FFFFFF · `--surface-sunk` #EEF2F6 (the log well) · `--border` #DCE3EC · `--ink` #0F1722 · `--ink-muted` #586273.
- **Dark tokens:** `--bg` #0B0E14 · `--surface` #141A23 · `--surface-sunk` #0E131B (the log well) · `--border` #232C3A · `--ink` #E6EBF1 · `--ink-muted` #9AA6B6. Semantic re-tints lighter for AA on #141A23 (fail ≈ #F0857A · warn ≈ #E0A93B · pass ≈ #5CC08A — finalize with checker).
- **Backgrounds:** sharp, dense terminal-precise surfaces. **NO gradients, NO glass, NO green-on-black, NO scanlines, NO blinking cursor, NO matrix rain** (DESIGN.md §6; `04-uiux-plan.md` §C4 anti-terminal-tell rules hold in dark).
- **Typography:** Geist (UI/status/phase names), **Geist Mono** for all evidence/data — the activity log lines, IDs (`F-COM-03`), timestamps, elapsed, "play N of M". Tabular figures on for elapsed and counts. Noto Sans Devanagari companion is loaded but Processing feed cards are headline-only (English chrome) — Devanagari evidence appears in Detail, not here.
- **Geometry:** sharp radii — chips ~3px (`--radius-sm`), cards/controls ~5px (`--radius-md`), the log well ~8px (`--radius-lg`). Never pill/bubbly (D-Q16).
- **Icons:** line/outline ~1.5px (Lucide/Phosphor) — phase nodes, the check on done phases, feed-card glyphs. Never filled/duotone (D-Q17). The severity *shapes* (■▲◗○ ● ◐ ✓) are the redundant a11y channel, distinct from decorative icons.

---

## 8. Motion (restrained; the one reveal)

- **The single orchestrated moment is Processing → Findings** (DESIGN.md §3.4). On `completed`, Processing initiates the staggered reveal (score band → critical risks → table); choreography in the Findings spec.
- **Feed cards settle in with weight** (a brief ease-out, ~160–200ms, no bounce) as they pop — a Critical lands with gravity, never playfully (DESIGN.md §3.4).
- **Phase advance** is a quiet check + name change, ≤200ms ease-out. The active node may carry a slow, restrained pulse (≤1 cycle/2s) — calm vigilance, not a spinner.
- **Indeterminate bar** (M unknown) is a slow, even sweep — instrument idle, not a loading-toy.
- **`prefers-reduced-motion`:** ALL of the above degrade to instant — log/feed inserts appear immediately, phases switch without animation, no pulse/sweep, and complete lands directly on Findings (DESIGN.md §3.4, §5).

---

## 9. Content / microcopy (real example — DESIGN.md §8; NEVER lorem)

The canonical example threads through the live findings feed as the headline that pops when its play finishes.

**Run identity strip (replay demo):**
```
https://api.vendorbot.example/voice/respond · VendorBot v2.1 · started 17:34:02 IST   [Replay of ER-01]
```

**Phase rail (mid-run):** `Recon ✓   ·   Running plays ▸ (active)   ·   Classifying   ·   Compiling findings`

**Progress (replay, M known):** `play 7 of 12 · elapsed 00:48`
**Progress (live, M unknown):** `7 plays complete · elapsed 01:12` + indeterminate bar.

**Live findings feed — the F-COM-03 card (and its paired F-SEC-02), as they pop:**
```
F-COM-03   ● FAIL   ◗?▲ HIGH   [Compliance]   Coercion under medical-emergency pretext
F-SEC-02   ● FAIL   ▲ HIGH     [Security]     Prompt-injection (same attack, two duties)
```
> Feed cards are **headline-only** — outcome + severity + module + scenario title. The landing Hinglish exchange ("Agar payment nahi ki toh legal notice bhejenge." / "…humein legal action lena padega.") and the bypass signal (`compliance_clean==true` vs Sentinx FAIL) are **gated to Observation Detail** (C6), per the disclosure rule (D-Q12). Processing proves a finding *landed*; it does not reveal the method.

**Mid-run feed header:** `3 findings · 1 Critical so far` (counts observations; `unknown/blocked/error` and `sample` rows excluded).

**Activity log (guaranteed lines, newest at bottom):**
```
✓ Connected & verified target
▸ Recon started
▸ Play started · coercion / medical-emergency
▸ Play finished
▸ Classifying replies
candidate finding: F-COM-03 · FAIL · High        ← conditional, real graded attempt
✓ Compiling findings
```

**Reassurance:** `You can keep this open; results appear here as each play completes.`

**Error state (real, specific):**
- timeout: `The target endpoint stopped responding during recon (connection timeout).`
- blocked: `The target refused to start a session.` (`outcome=="blocked"`)
- engine: `An internal grading error occurred while classifying play 6.` (`outcome=="error"`)
- partial: `4 plays completed before the run stopped — partial results below.`

**Zero-findings-so-far header:** `7 plays complete · 0 findings so far` (with `✓ Withstood` PASS cards in the feed — safe is a credible result, never an empty screen).

Voice: plain, exact, unhyped, composed (DESIGN.md §4). No "Critical vulnerability detected!! 🔴". No emoji as UI affordance (the ✓ / ▸ / ● etc. are typographic status glyphs paired with text labels, not decorative emoji).

---

## 10. Accessibility (WCAG 2.2 AA — DESIGN.md §5; disposition the relevant SC)

- **`aria-live="polite"`** on the activity log (`RunStatusLog`) and on the phase-status announcer, so a screen-reader user hears phase changes, new findings, and run-status changes (DESIGN.md §5; `04-uiux-plan.md` §C4). The feed region announces new findings politely (not assertively — avoid interrupting). On `failed`, announce the error.
- **Severity/outcome never colour-only** — every feed card carries **colour + text label + shape**: FAIL ● / RISK ◐ / PASS ✓; CRITICAL ■ / HIGH ▲ / MEDIUM ◗ / LOW ○ (the §5 encoding table). The four reds/ambers are separable without colour.
- **Contrast:** body/metadata text ≥4.5:1 (use `--ink-muted`, never `--ink-faint` for text); large status type ≥3:1; the progress bar fill (metric indigo) carries a text label ("play 7 of 12") so the bar is never the sole information channel. Re-verify both themes with a checker.
- **Focus & targets (2.5.8):** the only interactive elements pre-completion are the optional cancel/back and (on error) Retry / Back to Run Config; on complete, "View findings →". All ≥44×44px, visible 2px brand focus ring + 2px offset. **2.4.11 Focus Not Obscured:** no sticky bar here, so N/A, but the log well uses internal scroll with `scroll-padding` so a focused control is never hidden. **2.5.7 Dragging:** nothing requires drag — N/A.
- **Reduced motion (2.3.3 / DESIGN.md §3.4):** honored — feed/log update instantly, no pulse/sweep/stagger; complete lands directly on Findings. The "View findings →" affordance is the explicit keyboard path.
- **Language:** Processing feed/log chrome is English (`lang="en"`). The one place Devanagari could appear is a conditional candidate-finding snippet — but per disclosure (D-Q12) the landing Hinglish exchange is **not** shown here, so no `lang="hi"` runs are required on this screen. (If a future scenario *title* contains a genuine Devanagari run, tag only that run `lang="hi"`; romanised Hinglish stays `lang="en"` — DESIGN.md §5.)
- **No motion-only meaning:** progress and completion are conveyed in text ("play 7 of 12", "Compiling findings", "Run complete") in addition to any animation, so nothing depends on perceiving motion.
- **Keyboard path:** the full run→findings path is keyboard-traversable; the auto-transition has a focus-visible "View findings →" equivalent so keyboard/AT users are never stranded by an automatic motion they cannot trigger.

---

## 11. Honesty checklist (do-not-violate, per DESIGN.md §4 / §6 + D-Q14/Q15)

- [ ] No fabricated steps — every log line maps to a real engine stage; conditional lines absent when unbacked.
- [ ] No fake total M — "play N of M" only with a real total; else "N plays complete" + indeterminate bar.
- [ ] No fake ETA — elapsed only; "est" requires a real engine estimate (none today).
- [ ] `outcome=="sample"` rows filtered from the feed and counts.
- [ ] Replay is labelled "Replay of run ER-01" — never disguised as live.
- [ ] Error states are specific and composed — no stack traces, no alarmist colour, graceful on unreachable/unsupported endpoint.
- [ ] No green-on-black / scanlines / blinking cursor / matrix rain / gradients / glass — in either theme.
- [ ] RISK rendered only where derivable (guard on `judge_votes.length===3`); single/fairness modes per their bands.
- [ ] Devanagari evidence and the landing exchange stay OUT of Processing (gated to Detail, D-Q12).
