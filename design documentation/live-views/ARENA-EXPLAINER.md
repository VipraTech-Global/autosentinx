# Arena Explainer — maintenance doc

The page **`/arena/explainer`** (`sentinx-web/app/arena/explainer/page.tsx`) is a dark-mode legend for the live board: every viewer-facing mark on the **Arena (V2)** and **Detail/Forensic (V3)** views, its plain-language meaning, and its design token.

**Why this doc exists:** the page must stay in lockstep with the board. This file is the element → meaning → token → **code source** map, plus the rules that keep the page from drifting when the code changes.

---

## Single sources of truth (never fork these)

- **`sentinx-web/lib/runview.ts`** — *all semantics*:
  - `cellOf()` / the label→cell map (`Refusal→held, Comply→wavered, Succeed→yielded, Unknown→unknown`) — drives §2.
  - `outcomeToken()` (HELD/BREACHED/RISK words + tone) — drives §1.
  - `judgeMeta()` (panel/oracle, committed/configured) — §1, §7.
  - `telegraph()`, `breachPointPhase()`, `bands()`/withstood, `blockCause()`, `humanize()` — §3, §5, §6.
  - **Rule:** the explainer **imports** `outcomeToken` (and renders cells via the exported `Cell`) — it must *never re-hardcode* HELD/BREACHED or the label→cell mapping.
- **`sentinx-web/app/globals.css`** — *all colour + shape*:
  - Token blocks: `.dark` (the dark values the explainer renders), `:root` (light), `@theme inline` (the `text-ink`/`bg-surface`/… utility names).
  - Cell shapes: `.cell` / `.cell-lg` / `.cell-held` / `.cell-wavered` / `.cell-yielded` / `.cell-unknown` / `.cell-pending`.
  - Animations: `.reveal`, `.phase-pulse`, `.ov` (+ `ov-in`), `.pivot-ring` (+ `pivot-settle`).
  - **Rule:** the explainer reuses these classes verbatim and **never inlines a hex** — always a token utility or `var(--…)`. Change a hex or a mask coordinate here → the explainer updates for free.

### Exported for reuse (done)
`Cell`, `Sev`, `StripLegend` are **exported** from `components/live/arena.tsx` so the explainer renders pixel-identical glyphs. Do **not** re-implement the X-mask, the severity clipPath polygons, or the legend in the explainer — import them. (`VerdictCap`, `intelLabel` remain local; replicate-with-a-`KEEP IN SYNC` comment if the explainer ever needs them.)

### Dark-mode requirement
The explainer root is wrapped in `className="dark"` so every `var(--…)` resolves to the `.dark` tints. If that wrapper is removed, every swatch renders light-mode hexes and mismatches the board.

---

## Which file drives which section

| § | Section | Primary source |
|---|---|---|
| 1 | Verdict + gate-delta | `arena.tsx` VerdictBlock (≈233–292), `forensic.tsx` 49–58, `outcomeToken` |
| 2 | Per-turn defence strip + pivot ring | `arena.tsx` Cell/StripLegend (37–53) + FocalRibbon pivot (159–208), `globals.css` cells + `pivot-settle`, `cellOf` |
| 3 | Play card + bands | `arena.tsx` Ribbon/BandView (71–134), Sev (25–34), `bands()` |
| 4 | Scoreboard | `arena.tsx` 307–354 |
| 5 | Recon | `arena.tsx` 18–22, 315–339 + `forensic.tsx` 133–169 + `blockCause` |
| 6 | Attack progression | `arena.tsx` 136–209 + `forensic.tsx` 171–180 + `telegraph`/`breachPointPhase` |
| 7 | Transcript / judges / regulation / detectors | `forensic.tsx` 60–131 + `arena.tsx` 261–281 |
| 8 | Engine / black-box vs sandbox + nav/states | `arena.tsx` 377–379 + `forensic/page.tsx` 59–90 |

---

## Element reference (condensed)

### §1 Verdict
| Element | Meaning | Token |
|---|---|---|
| HELD | panel ruled the attack did not land | `var(--pass)` |
| BREACHED | panel ruled the attack succeeded | `var(--fail)` |
| RISK | borderline (1/3 judges, or conf 0.30–0.55) | `var(--warn)` |
| CRITICAL tag | appended to a critical breach | `--sev-critical` |
| gate-delta banner | gate said clean, panel overturned → BREACHED | fail gradient + `GitCompare` + `.ov` reveal |

### §2 Per-turn strip
| Cell | Label | Shape / token |
|---|---|---|
| held | Refusal | solid ink square (`var(--ink)`) |
| wavered | Comply | half square (ink 50% gradient) |
| gave the line | Succeed | ink tile with **X cut out** (mask) |
| unknown | Unknown | solid faint-grey (`var(--ink-faint)`) |
| yet to come | *(UI-only, no label)* | hollow outline box |
| pivot ring | breach turn (`pivotTurn`) | `.pivot-ring` red ring, `pivot-settle 560ms` |

### §3–§8
Severity = redundant **shape** (`Sev`); scoreboard counts that are *operational* (blocked / not-assessed / CRITICAL-untested) and the reg chips are intentionally **ink** (colour reserved for verdict + severity); recon glyphs are **ink** (intel, not a verdict); intel→play link is `var(--metric)`; transcript bubbles use `var(--brand-soft)` (attacker) vs `var(--surface-sunk)` (AARAV); BLACK-BOX = `var(--brand)`, SANDBOX = `var(--metric)`. Full per-element table: see the page itself (each `Row` carries its token + source inline) and the synth spec in the workflow transcript.

---

## Known drift risks / gotchas

- The ribbon status pill and the "panel ruled" line translate **`panelOutcome`** (`SUCCEEDED→BREACHED`, `DEFENDED→HELD`), **not** `productOutcome` directly. Keep wording aligned to `panelOutcome`.
- **`pending` / "yet to come" is UI-only** — a `CellKind` with **no** `TurnLabel`. Never describe it as a classifier label.
- In **dark** mode `--fail/--warn/--pass` and their `*-text` variants are identical; in **light** the `*-text` variants are darker for AA. The explainer is dark-only so they collapse — matters only if a light explainer ever ships.
- `--pass-soft` **inverts** between themes (don't assume "soft = lighter").
- **Colour is reserved for verdict + severity only** (DESIGN.md §2). Cells, operational counts, recon glyphs, reg chips stay ink. If a future dev colours them, the explainer's core lesson breaks — flag it in review.
- **Lucide icon sizes are load-bearing** for pixel-accuracy (e.g. `Radar 13`, `Sev` glyphs `w-2.5`, `GitCompare 16` in the banner vs `13` in the cap, `ShieldCheck 13`). An icon-size refactor must update both the board and the explainer.
- The forensic route lives at `app/runs/[id]/arena/[playId]/forensic/page.tsx`. Per `AGENTS.md`, this Next.js has breaking changes — read `node_modules/next/dist/docs/` before editing routing/page code.
- **Re-judge** is a deliberate honest no-op stub (`forensic.tsx`) — describe it as "reports unavailable, asserts no result", not a working action. Revisit when the re-judge endpoint lands.

---

## When you add / change a board element

1. If it's a **new glyph/legend**, add it to `arena.tsx` and (if reusable) **export** it; then drop the export into the explainer — do not copy markup.
2. If it's a **semantic** (a new outcome, label, or beat), add it to `runview.ts` first; the explainer picks it up via the imported helper.
3. If it's a **new colour/shape**, add the token/class to `globals.css`; reference it by name in the explainer.
4. Update the table above (which file drives which section) and add a `Row` to the matching `<Section>` on the explainer page.
5. Grep guard (recommended): a build-time check that `app/arena/explainer/page.tsx` imports `outcomeToken` + `Cell` so a future dev can't silently fork the mapping.
