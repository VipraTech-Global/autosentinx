# Live Views v2 — Screen Spec: Run-Intensity Dial on Run Config (C3 edit) + Run-Flow Shell

> **Stage-6 BUILDABLE spec.** Authoritative parents (this file obeys them; on conflict the higher wins): `../../DESIGN.md` (brand, tokens, type, geometry, voice, a11y, §5 redundant encoding) > `../../spec/00-foundation.md` (component contracts, the §a.8 shape table, the WCAG disposition) > `../DECISIONS.md` (`D-LV7`–`D-LV25`, the locked interview decisions — **supersede earlier wording**) > `../v2-concept-LTO.md` (the LTO chassis) > `../00-foundation.md` (live-view design language) > `../04-uiux-plan.md §H` (the consolidated hypothesis) > this file. Implemented tokens live in `sentinx-web/app/globals.css` (reuse the var names verbatim). Data model: `sentinx-web/lib/types.ts` + `sentinx-web/lib/outcome.ts`; level→budget map: `sentinx-web/lib/intensity.ts` (`A-LV3`). Real run shape: `aarav-live/captures/_audit_render/state_full.json`.
>
> **Scope of this spec:** the **Run-Intensity "effort" dial** (`D-LV25`) added to **C3 Run Config** — the 6-level `[ low · med · high · xhigh · max · ultra ]` control that scales **attacks / turns / breadth** (judges fixed), with a **live estimate** (duration / LLM-call budget), the chosen level echoed into **RunProvenance** + the Approve dialog + V2; **plus the minimal run-flow shell context** (how V2 Arena is reached: Run Config → Approve & run → Processing → V2). It is a **diff onto `../../spec/run-config.md`** — that spec still governs the endpoint field, the connection-check, and the Approve dialog; this file specifies only the **new dial region, the estimate, the provenance echo, and the run-flow seam**. Maps to `D-LV25` / `D-LV-dep4`. Owner **P3 (operator)** sets it at run start; **P5 (admin)** reads it back on V2 / provenance. Build target: `A-LV4` (in this pass).

---

## 1. Purpose

Give the operator a **single honest "how hard should this run push" control**, set once at run start, that scales **three real levers** the engine already exposes — and **nothing it cannot back**:

1. **attacks** — campaign `budget` = number of plays the UCB bandit selects across the objective pool (`runner.py:146`, `run_budget(budget=…)`).
2. **turns/attack** — `max_turns` per play (`engine.maxTurns` in the captured run; default 8).
3. **breadth** — technique×persona variants tried per objective (more variants = wider coverage of the same objective).

**Judges are FIXED across every level** (`D-LV25`) — the 3-model panel (`engine.judges` = `gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite`) grades with **constant rigor** at every intensity, so two runs at different levels are **fairly comparable**. The dial **never** touches grading; it only touches *how much* is attacked. This is the honesty spine of the screen: **intensity buys coverage, not a better verdict.**

`med` = the **doubled baseline** (`16` attacks / `16` turns — the F3 "double both"), the recommended default; both pillars are covered (the bandit selects across the **4 Security** + **33 Compliance** objectives, `D-LV-dep4`).

The dial carries a **live estimate** (duration band · LLM-call budget · plays · turn ceiling · objective coverage), shown the instant the level changes, and the chosen level is **echoed forward** into the Approve dialog's RoE summary, into `RunProvenance` on the run home + Findings, and onto the **V2 Arena** header — so "this run was a `high` run" is legible everywhere the run is later read.

**What this screen is NOT:** not a scenario/mode picker (the engine still selects *which* plays via the bandit — the dial sets *how many* / *how deep* / *how wide*, never names objectives); not a judge-config panel (judges are fixed, `D-LV25`); not a per-play slider; not a guarantee of a finding (`ultra` ≠ "will breach"). The estimate is a **band, not a promise** — no fabricated minute-precise ETA, no fake meter (`DESIGN.md §4`, §6).

---

## 2. Layout / bones (the dial region within C3)

The dial is a **new region inside the existing C3 form card** (`../../spec/run-config.md §2`), placed **after the Agent name field and before the `▸ Advanced` disclosure**, above the scope helper line. It is a first-class, always-visible control (not hidden under Advanced) because it changes what the run *is*. Region IDs `RID-R#` (Run-Intensity Dial).

```
  … (C3 form card, unchanged above: H1 "New audit" · Target endpoint · Agent name) …

▭ RID-R1  DIAL HEADER
            · label  "Run intensity"   (14px Geist, --ink)  + info affordance (ⓘ line icon → popover §6.4)
            · current-level read-out (right-aligned):  "med · recommended"  (level mono-cap, qualifier sans --ink-muted)

▭ RID-R2  THE DIAL — a 6-segment horizontal stepper  [ low · med · high · xhigh · max · ultra ]
            · 6 equal segments, left→right ascending; the selected segment filled (--brand), others --surface/--border
            · each segment: level name (mono-cap, 12px) + a redundant FILL-LEVEL bar-glyph (1–6 ticks) under it
              (the non-colour channel — §5: a colour-blind/grayscale reader reads intensity from the tick count,
               not the fill colour)
            · "recommended" pip on the `med` segment (small ▸ marker + tooltip), always present
            · keyboard: a real radiogroup (←/→ to move, Home=low, End=ultra); ≥44px segment targets

▭ RID-R3  LIVE ESTIMATE STRIP  (the IntensityEstimate — re-renders on level change, aria-live="polite")
            · 4 estimate cells (mono tabular values, sans labels), in one row on desktop:
                Plays         <budget>            e.g.  16
                Turns / play  up to <max_turns>   e.g.  16
                Breadth       <variants>× variants e.g.  1× technique/persona
                LLM calls     ≈ <callBudget>       e.g.  ≈ 770 calls
            · duration band line (ink-muted, below the cells):
                "Est. duration ~6–10 min · judges fixed (3-model panel) at every level."
            · coverage line (ink-muted):  "Covers up to <objCoverage> of 37 objectives across Security + Compliance."
            · advisory caption (12px, --ink-muted, always present):
                "Estimate — a planning band, not a guarantee. Actual calls vary with how early each attack resolves."

▭ RID-R4  HONEST INTENSITY NOTE (one line, --ink-muted, 13px)
            · "Higher intensity widens coverage and depth. It does not change how strictly findings are judged."

  … (C3 form card continues, unchanged below: ▸ Advanced · scope helper · "Run audit" button) …
```

**Hierarchy within the region:** the dial (RID-R2) > the live estimate (RID-R3) > the honest notes. The dial sits *visually quieter* than the endpoint field and the Run-audit button (C3's strict hierarchy is unchanged — endpoint > Run button > everything else); it is a considered secondary control, not the hero.

### 2.1 Where the chosen level is echoed forward (the provenance trail)

The level is written once here and **read back** in four places (all reuse `RunProvenance`, `DESIGN.md §7` / `../../spec/00-foundation.md B15`):

1. **Approve & run dialog** (C3 §2.1) — a new RoE summary row: `Intensity   high · 28 plays · ≤18 turns · 2× breadth` (mono values). Part of the Rules-of-Engagement the operator confirms.
2. **`RunProvenance`** on the run home + Findings (`../../spec/00-foundation.md B15`) — a new `intensity` key/value line: `Intensity  high (28 / 18 / 2)`.
3. **V2 Arena top bar** (`../04-uiux-plan.md §C V2-R1`) — the `RunProvenance` ref shows `ER-01 · agent · IST · high` so the admin reading the board knows the run's effort.
4. **PDF cover** provenance block (always-expanded) — `Intensity: high` as run metadata (no estimate, the *actual* counts: real `playsRun`, real `maxTurns`).

> On a **completed** run, provenance shows the **actual** executed numbers (real `Run.playsTotal` / `engine.maxTurns`), not the pre-run estimate — the estimate is a planning artifact and is never re-asserted as a result (`DESIGN.md §4` no fake precision).

---

## 3. Components used (foundation inventory + new patterns)

| Component | Use on this region |
|---|---|
| **`RunProvenance`** (`../../spec/00-foundation.md B15`) | Echoes the chosen `intensity` line into the Approve dialog RoE, the run home / Findings provenance, the V2 top-bar ref, and the PDF cover. Adds one `intensity` key; otherwise unchanged. |
| **`EmptyState`** (B18) | Not used (the dial always has a valid default `med` — there is no empty intensity state). Noted so a builder doesn't add a faux "no level selected" state. |
| **`SeverityChip` / `OutcomeBadge` / `EvidenceBlock`** | **Not used here** — pre-run, no findings/severity/evidence exist (importing them would fabricate precision, `DESIGN.md §4`/§6). Explicitly excluded. |
| **`RoadmapLock`** (B16) | Not used. |
| New patterns introduced by this region (promote to the live-view inventory) | **`RunIntensityDial`** — the 6-segment radiogroup stepper (level name + redundant tick-glyph, `med`-recommended pip). **`IntensityEstimate`** — the live estimate strip (plays · turns · breadth · LLM calls + duration band + coverage + advisory caption), re-renders `aria-live="polite"` on level change. **`IntensityProvenanceLine`** — the one-line `intensity` echo composed into `RunProvenance` everywhere downstream. |

All three new patterns obey the shared geometry (`--radius-sm 3px` chips, `--radius-md 5px` controls, `--radius-lg 8px` panels), line icons (~1.5px stroke, Lucide), and the focus rule (2px `--ring`/`--brand` outline, 2px offset). `RunIntensityDial` is the **only** new interactive control; `IntensityEstimate` + `IntensityProvenanceLine` are read-only.

---

## 4. States (every state, exhaustive)

The dial has **no network state of its own** (it is pure pre-run config; the estimate is computed client-side from `lib/intensity.ts`). Its states are the **selection states** of the dial + the **estimate render** + how it threads through the C3 connection-check / approval flow. The C3 form-level, connection-check, and approval-flow states (`../../spec/run-config.md §4`) are **inherited unchanged** — listed here only where the dial participates.

### 4.1 Dial selection states (`RunIntensityDial`)

| State | Trigger | Render |
|---|---|---|
| **default (`med`)** | screen mount (no prior choice) | `med` segment selected (`--brand` fill + 2-tick glyph + "recommended" pip); read-out `med · recommended`; estimate shows the `med` row (16 / 16 / 1 · ≈770 calls). This is the recommended baseline (`D-LV25`). |
| **selected — low** | operator picks `low` | `low` segment fills; read-out `low`; estimate re-renders (8 / 8 / 1 · ≈190 calls · ~3–5 min · "lighter — a fast smoke pass"). |
| **selected — high / xhigh / max** | operator picks an upper level | that segment fills; estimate re-renders to that level's row (§5 table); duration band + coverage update; `aria-live` announces the new estimate. |
| **selected — ultra** | operator picks `ultra` | `ultra` segment (6-tick) fills; estimate shows the full-catalog row (full pool × all techniques / 30 turns / all variants); an **honest caveat line appears** in the estimate: "Full sweep — longest run; covers all 37 objectives. Est. duration ~40–70 min." (a band, not a promise). No alarm styling — it is the documented heaviest level, not an error. |
| **focus** | keyboard focus enters the radiogroup | 2px brand focus ring on the radiogroup; ←/→ move selection (announced); the focused segment shows the ring, the selected segment shows the fill (focus ≠ selection until moved). |
| **persisted echo** | level chosen → flows to Approve / provenance | the Approve dialog RoE row + later `RunProvenance` show the **chosen** level; on Cancel/edit the choice is preserved (no re-entry, SC 3.3.7). |

### 4.2 Estimate render states (`IntensityEstimate`)

| State | Trigger | Render |
|---|---|---|
| **computed (always)** | any level selected | the 4 cells + duration band + coverage line + advisory caption, all derived from `lib/intensity.ts` for the active level. There is **no loading/empty estimate** — it is synchronous from a static map (`A-LV3`). |
| **`ultra` caveat** | level = `ultra` | adds the "Full sweep — longest run…" caveat line (above the advisory caption). |
| **reduced motion** | `prefers-reduced-motion` | the estimate cells swap **instantly** on level change (no count-up, no cross-fade) — the value just changes; `aria-live` still announces it. |

### 4.3 Run-flow seam states (how the dial reaches V2 — the shell context)

The dial does not run the engine; it **parameterises** the C3 submit. The run-flow shell (`../04-uiux-plan.md §A`, `J5`/`J6`) is:

```
  Run Config (C3) ──── operator sets intensity = `high` ────┐
        │  "Run audit"  → connection-check (C3 §4, unchanged) │
        ▼                                                     │
  Approve & run dialog ──── RoE shows  Intensity high · 28/18/2 ──── operator confirms ─┐
        │  POST /scan {budget:28, max_turns:18, breadth:2}  → pending_approval           │
        │  POST /runs/{id}/approve                                                        │
        ▼                                                                                 │
  Processing (C4) ──── "Watch the duel" ───────────────────────────────────────────────►│
        │  poll GET /runs/{id}; live findings feed                                        ▼
        └──────────────────────────────────────────────────────────────►  V2 ARENA (live or completed)
                                                                            top bar ref: ER-01 · agent · IST · high
```

| State | Trigger | Render |
|---|---|---|
| **carried into Approve** | "Run audit" → connection-check **reachable** → Approve dialog opens | the chosen intensity is now an RoE row; the `POST /scan` payload carries `{budget, max_turns, breadth}` for the level (§5 / §7). |
| **carried into Processing** | Approve → `POST /runs/{id}/approve` → Processing (C4) | the budget drives how many plays the feed will show; the level shows in the Processing run-ref (`ER-NN · agent · high`). |
| **carried into V2** | Processing "Watch the duel" (live) **or** run home "Open the duel" (completed) → V2 Arena | the V2 top-bar `RunProvenance` ref shows the level; the two pillar bands (`D-LV24`) populate up to the budget; **degraded honesty:** a `low` run shows fewer ribbons (honestly — not a smaller board faked to look full), and an objective the budget did not reach is a **first-class "not assessed" coverage flag** on V2 (`D-LV20`), never a silent gap. |

> **Honesty invariant across the seam:** the dial sets *intent*; V2/provenance always show the **real** outcome of that intent. If `high` was requested but the engine only completed 24 of 28 plays (errors/timeouts), provenance shows `28 requested · 24 run` and V2's coverage line flags the shortfall — never a backfilled "28/28" (`LV-7` honesty; `D-LV20` degraded-first-class).

### 4.4 Cross-cutting

- **Theme:** renders in the active global theme (light default / dark console, `D-LV21`); tokens swap only — no dial-specific dark treatment.
- **Reduced motion:** dial fill + estimate swap are instant; no count-up animation (`DESIGN.md §3.4`).
- **Inherited:** all C3 form-level / connection-check / approval states (`../../spec/run-config.md §4`) are unchanged by the dial.

---

## 5. Data fields → REAL backend variables + the level→budget map

Source of truth for the levers: `D-LV25` (the proposed, tunable mapping) → implemented in `sentinx-web/lib/intensity.ts` (`A-LV3`). The dial **writes** the run parameters; downstream surfaces **read** the chosen level back.

### 5.1 The level → budget map (`D-LV25` proposed defaults — TUNABLE, `A-LV3`)

| Level | `budget` (attacks/plays) | `max_turns` (turns/attack) | breadth (variants/objective) | objective coverage | LLM-call estimate¹ | duration band¹ |
|---|---|---|---|---|---|---|
| **low**   | 8  | 8  | 1 | up to ~8 of 37  | ≈ 190 calls  | ~3–5 min |
| **med** *(default, recommended)* | 16 | 16 | 1 | up to ~16 of 37 | ≈ 770 calls  | ~6–10 min |
| **high**  | 28 | 18 | 2 | up to ~28 of 37 | ≈ 1,510 calls | ~12–20 min |
| **xhigh** | 40 | 20 | 2 | up to ~37 of 37 | ≈ 2,400 calls | ~18–30 min |
| **max**   | 60 | 24 | 3 | full pool, repeated | ≈ 4,300 calls | ~28–45 min |
| **ultra** | full-catalog × all-techniques | 30 | all | all 37 × all techniques | ≈ 7,000+ calls | ~40–70 min |

¹ **LLM-call estimate + duration are derived display bands, not engine fields.** Estimate model (stated on screen as "a planning band, not a guarantee"): `callBudget ≈ budget × max_turns × (attacker 1 + classifier 1) + budget × nJudges`, where `nJudges = 3` (fixed panel). These are **planning bands**; the screen never shows a single fabricated minute count (`DESIGN.md §4`). The exact numbers are tunable in `lib/intensity.ts` — the **shape** (monotonic ascent, judges fixed) is decided (`D-LV25`).

**Judges are constant at every level:** `nJudges = 3` (the panel `engine.judges`); the dial does **not** appear in any judge calculation except as the fixed `+ budget × 3` term. Grading rigor never scales with intensity (`D-LV25` — the comparability guarantee).

### 5.2 UI field → backend variable bindings

| UI field / element | Backend variable (exact name) | Source / notes |
|---|---|---|
| Dial selected level | client-side `RunView.intensity.level` (`"low"…"ultra"`) | New field on the run-config payload; persisted on the run for read-back (`A-LV2` `RunView` contract). Not a graded value. |
| → attacks/plays | `run_budget(budget=…)` → `Run.playsTotal` | Campaign budget = # plays the bandit selects (`runner.py:146`). On `POST /scan` the level maps to `budget` via `lib/intensity.ts`. Completed run reads `Run.playsTotal` (real). |
| → turns/attack | `max_turns` → `engine.maxTurns` | Per-play turn ceiling (`runner.py`; captured as `engine.maxTurns`, default 8). The level sets `max_turns`. |
| → breadth | variants/objective (campaign config) | Technique×persona variants per objective; widens coverage of the same objective. Maps from the level; surfaced as the "Breadth Nx" estimate cell. |
| Objective pool | `Objective.primary_pillar` distribution | **4 Security + 33 Compliance = 37 objectives** (`D-LV-dep4`: the 4 Security = `prompt-leak.system-instructions`, `memory-poison.persisted-false-fact`, `guardrail.policy-override`, `tool-hijack.unauthorized-action`). The bandit selects across the pool up to `budget`; the dial sets coverage depth, not which objectives. |
| nJudges (fixed) | `verdict.nJudges` / `engine.judges` | **3-model panel** (`gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite`), constant across levels (`D-LV25`). Real per-play `verdict.nJudges` can still be `3 / 1-oracle / 2-degraded` (`LV-7`) — the dial never overrides it. |
| Estimate cells (plays/turns/breadth/calls) | derived (client) from `lib/intensity.ts` | **Display bands**, not engine fields. Re-verified against the level map; never minute-precise. |
| Intensity echo (Approve RoE / provenance / V2 / PDF) | `RunView.intensity` (echoed) | Read-back of the chosen level + its budget triple `(plays / turns / breadth)`; on a completed run, the **actual** `playsTotal` / `maxTurns` replace the estimate (real, not planned). |
| `POST /scan` payload | `{ target_url, budget, max_turns, breadth, roe:{…intensity} }` | The dial contributes `budget` + `max_turns` + `breadth`; the RoE JSON records the chosen intensity for the audit trail (`AuditEvent scan.created`, C3 §5). |

**Do NOT surface:** any per-objective selector, a judge-count control, a `verdict_score` / severity / outcome (none exist pre-run), or a single fabricated ETA. The dial sets **how much**, the engine still picks **which** (`D-LV25`).

---

## 6. Content / microcopy (real, composed voice — no lorem)

All copy plain, exact, unhyped (`DESIGN.md §4`; `LV-5` voice). No exclamation marks, no emoji affordances, no alarmist framing of `ultra`.

- **Region label:** `Run intensity`
- **Read-out (per level):** `low` · `med · recommended` · `high` · `xhigh` · `max` · `ultra`
- **Segment names (mono-cap):** `low` `med` `high` `xhigh` `max` `ultra`
- **`med` recommended pip tooltip:** `Recommended — doubled baseline. Covers both pillars at a fair, comparable depth.`
- **Estimate cell labels:** `Plays` · `Turns / play` · `Breadth` · `LLM calls`
- **Estimate cell values (example, `med`):** `16` · `up to 16` · `1× technique/persona` · `≈ 770 calls`
- **Duration band line:** `Est. duration ~6–10 min · judges fixed (3-model panel) at every level.`
- **Coverage line:** `Covers up to 16 of 37 objectives across Security + Compliance.`
- **Advisory caption (always):** `Estimate — a planning band, not a guarantee. Actual calls vary with how early each attack resolves.`
- **`ultra` caveat:** `Full sweep — longest run; covers all 37 objectives. Est. duration ~40–70 min.`
- **`low` qualifier (in estimate):** `Lighter — a fast smoke pass; narrower coverage.`
- **Honest intensity note (RID-R4):** `Higher intensity widens coverage and depth. It does not change how strictly findings are judged.`
- **Approve dialog RoE row:** `Intensity   high · 28 plays · ≤18 turns · 2× breadth`
- **`RunProvenance` line:** `Intensity  high (28 / 18 / 2)`  — on a completed run: `Intensity  high · 24 of 28 plays run · ≤18 turns`
- **V2 top-bar ref:** `ER-01 · VendorBot v2.1 · 12 Jun 17:34 IST · high`

### 6.1 Info popover copy (the ⓘ on RID-R1)

> **Run intensity** scales three things — **how many attacks** run, **how many turns** each attack gets, and **how many technique/persona variants** are tried per objective. It does **not** change the judges: every level is graded by the same fixed 3-model panel, so runs at different intensities stay fairly comparable. `med` is the recommended default — a doubled baseline that covers both Security and Compliance.

### 6.2 The canonical example (`DESIGN.md §8`) — where it appears on THIS screen

Run Config is **pre-run**, so the F-COM-03 / F-SEC-02 evidence **does not render here** (no findings exist — that would be fabricated, `DESIGN.md §4`). Its role is **forward-reference only**:
- the demo agent name is `VendorBot v2.1` (matches the later `ER-01 · VendorBot v2.1` run ref);
- the scope/coverage copy truthfully names the duties the run will grade against (`Security + Compliance`);
- a builder must **not** seed any sample finding, score, severity chip, or the `"Agar payment nahi ki…"` line on this region (reserved for the evidence surfaces).

---

## 7. Accessibility notes (WCAG 2.2 AA — `DESIGN.md §5`, `../../spec/00-foundation.md (c)`)

- **The dial's intensity is never colour-only (§5 redundant channel).** Each segment carries the **selected colour (`--brand` fill) AND the level name (mono-cap label) AND a redundant tick-glyph (1–6 ascending ticks)** — a grayscale/colour-blind reader reads the level from the **name + tick count**, not the fill. The estimate values are plain mono text (no colour-coded meaning). Test: render the dial in grayscale — the selected segment and the relative intensity must remain legible from label + ticks alone.
- **No severity colour on this region.** Intensity is **not** a verdict; the dial uses `--brand` (selection) + neutrals only — **never** `--fail`/`--warn`/`--pass`/severity ramp (those are reserved for real outcomes; using them for "intensity" would be a false severity read, `DESIGN.md §3.1`/§5). `ultra` is rendered as the documented heaviest level in neutral/brand, **not** in alarm colour.
- **Radiogroup semantics:** `RunIntensityDial` is `role="radiogroup"` with an accessible name (`aria-label="Run intensity"`); each segment is `role="radio"` + `aria-checked`; arrow keys move selection (←/→, Home=low, End=ultra), Tab enters/leaves the group; the recommended pip is described via `aria-describedby` on the `med` radio. Single tab-stop, roving tabindex.
- **Live estimate:** the `IntensityEstimate` strip is `aria-live="polite"` + `aria-atomic="true"` so a SR user hears the new estimate ("16 plays, up to 16 turns, 1× breadth, about 770 LLM calls, est. 6 to 10 minutes") when the level changes. The advisory caption is part of the announced region (the "planning band, not a guarantee" honesty is conveyed non-visually too).
- **Contrast:** segment labels, estimate values, and notes use `--ink` / `--ink-muted` (≥4.5:1); `--ink-faint` only for the tick-glyph idle ticks/dividers (non-text decoration), never readable text. The selected `--brand` fill carries an `--on-brand` label that re-verifies ≥4.5:1 in both themes. Re-verify with a checker, not by eye.
- **2.5.8 Target Size:** each of the 6 segments is ≥44×44px (hard floor ≥24×24); the ⓘ info affordance ≥24×24 (ideally 44); the recommended-pip tooltip trigger is part of the `med` segment's hit area (not a separate sub-target).
- **2.5.7 Dragging Movements:** the dial is a **stepper, not a draggable slider** — selection is by click/arrow-key only; **nothing requires drag** (this is why a 6-segment stepper, not a range input, `D-LV25`).
- **2.4.11 Focus Not Obscured:** inherits C3's `scroll-padding-top`; the dial region is mid-card and never hidden under the slim top bar.
- **3.3.7 Redundant Entry:** the chosen level is **preserved** across the Approve→Cancel round-trip and across an "edit the target" return (no re-selection demanded).
- **Focus visible:** 2px `--brand`/`--ring` outline, 2px offset, on the radiogroup and the ⓘ affordance, both themes.
- **Keyboard path:** Tab order extends C3 — endpoint → agent → **Run intensity radiogroup** → ⓘ (if focusable) → Advanced toggle → … → Run audit. Enter on a valid form still submits; the dial choice is carried into the Approve dialog RoE.
- **Language:** this region's chrome is `lang="en"`; no Devanagari content (the Noto Sans Devanagari fallback remains in the stack for a Devanagari agent name elsewhere on C3).
- **Reduced motion:** honoured — segment fill + estimate values swap instantly; no count-up, no flourish (`DESIGN.md §3.4`).

---

## 8. Responsive intent (desktop-first — `../04-uiux-plan.md §E`)

- **Desktop / laptop (primary):** the dial region sits in the ~560px C3 form card; the 6 segments render in one row; the 4 estimate cells render in one row beneath; the whole region fits without forcing the form to scroll on a laptop.
- **Tablet:** the 6 segments stay in one row (compress label/tick spacing) or wrap to 3+3 if width-constrained; the estimate cells wrap to a 2×2 grid; targets stay ≥44px.
- **Mobile (read-only degradation):** running an audit on mobile is **not a v1 goal** (`P3` demos on a big screen). If rendered: the dial stacks as a full-width 6-row list (each level a tappable row with name + tick-glyph + a one-line per-level estimate), the estimate strip stacks single-column; no horizontal scroll. The dial remains operable but de-emphasised, consistent with C3's mobile posture.

---

## 9. Disposition of the WCAG 2.2 AA SC (per `DESIGN.md §5` requirement)

| SC | Disposition on this region |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | **Applicable** — inherits C3 `scroll-padding-top`; the mid-card dial is never under the top bar. |
| 2.4.12 Focus Not Obscured (Enhanced) | Applicable — same mechanism; nothing overlaps a focused segment. |
| 2.4.13 Focus Appearance | Applicable — 2px outline + 2px offset on the radiogroup + ⓘ meets the area/contrast minimum. |
| 2.5.7 Dragging Movements | **N/A-because** the dial is a click/arrow-key stepper, not a draggable slider — no drag interaction exists. |
| 2.5.8 Target Size (Min) | **Applicable** — each segment ≥44×44 (≥24 floor); ⓘ ≥24. |
| 3.2.6 Consistent Help | **Applicable** — the ⓘ info affordance + the honest intensity note sit in a consistent location in the pre-run flow. |
| 3.3.7 Redundant Entry | **Applicable** — the chosen level is preserved across Approve→Cancel and edit-return (no re-selection). |
| 3.3.8 Accessible Authentication (Min) | **N/A-because** no auth on this region (real auth is C2 Login). |
| 3.3.9 Accessible Authentication (Enhanced) | N/A-because — same as above. |

---

## 10. Honesty invariants checklist (must all hold — `LV-7`, `DESIGN.md §4`)

- [ ] **Judges fixed.** The dial never scales `nJudges`; grading rigor is constant; the screen states this in copy (RID-R4 + the ⓘ popover). Real per-play `verdict.nJudges` (`3 / 1-oracle / 2-degraded`) is never overridden by the level.
- [ ] **Estimate is a band, not a promise.** No single fabricated minute count; the advisory caption "a planning band, not a guarantee" is always present and announced.
- [ ] **No fake meter.** The dial is a 6-state stepper bound to a real `lib/intensity.ts` map — not a continuous "intensity gauge" implying false precision.
- [ ] **Severity-only colour.** Intensity uses `--brand` + neutrals; **never** `--fail`/`--warn`/`--pass`/severity ramp. `ultra` is not alarm-coloured.
- [ ] **Coverage honesty downstream.** A level that doesn't reach an objective surfaces as a first-class "not assessed" coverage flag on V2 (`D-LV20`), never a silent gap; provenance shows `requested vs run` on a shortfall, never a backfilled total.
- [ ] **Both pillars.** The objective pool is 4 Security + 33 Compliance = 37 (`D-LV-dep4`); the coverage copy names both; the Security band is honest-empty on Compliance-only captured runs and populates on a both-pillar run (`A-LV5`).
- [ ] **Real fields only.** Plays = real `Run.playsTotal`, turns = real `engine.maxTurns` on a completed run; the pre-run numbers are clearly labelled estimates, replaced by actuals afterward.
- [ ] **No lorem / no fabricated findings** on this pre-run region (the F-COM-03 example is forward-reference only).
