# PL2 — Plan of Action: land our conformance + contract work onto the new main cleanly

> **Target (where we merge into):** `autosentinx-mainsync/sentinx-web` @ **`eabb173`** — Latticly restyle on top of live-backend wiring, JWT auth, and real-data run pages with route param `[id]`.
> **Our source (what we port from):** `autosentinx` @ **`4a567ab`**, diff range **`6c0c5a9..4a567ab`** (19 files; **no** `app/runs/**` pages).
> **Verified against live main on 2026-06-15:** `RISK_BAND.hi=0.7` and medium shape `◆` still unfixed; `startScan` serializes only `strategy=ucb&budget=6` (drops `endpoint`/`agentName`); `app/runs/[id]/o/[obsId]/page.tsx:64-66` calls `BypassSignal bypass selfReports` / `FairnessComparison fairness={o.fairness}` with **no** new props; `ui.tsx` still `h-9`/`rounded-md`, no `Textarea`, no ref-forwarding `Input`; `processing-view.tsx` polls via `useRun(runId,1800)` but still `Loader2 animate-spin`; BFF proxy exports only GET/POST.

---

## ⬛ THE NAMING RULE (governs every string in this plan)

> **User-facing surfaces → "Sentinx".** Anything the operator/buyer reads in product chrome or the audit report: login, run-config (`/new`), processing, evidence panels, the PDF/report body, the logo wordmark, footers, error toasts.
>
> **Engine / repo / backend / internal docs → "AutoSentinx".** The grading engine, the judge, repo/package names, API-contract titles, server logs, the fixed sandbox target (AARAV), and design-doc internals.

**This REPLACES the old "rebrand everything to AutoSentinx" guidance.** The earlier plan told us to rewrite every re-authored "Sentinx" string to "AutoSentinx"; that was wrong for product chrome. The corrected rule is the split above. Consequences that ripple through this plan:

- Several **MAIN** strings are now the *wrong* brand for a user-facing surface and must be corrected **to "Sentinx"** as we touch their files:
  - `app/login/page.tsx:44` — `"Sign in to AutoSentinx"` → **"Sign in to Sentinx"**.
  - `app/new/page.tsx:58,114` — `"Point AutoSentinx at…"`, `"AutoSentinx requires human approval…"` → **"Sentinx"**.
  - `components/evidence.tsx:77` fallback — `"AutoSentinx judge verdict shown below."` → **"Sentinx panel: …"** (spec `pdf-report.md:88,132`); the `bypass && selfReports` branch `"AutoSentinx's judge panel"` gets the same treatment.
  - `app/runs/[id]/report/page.tsx:42` — `"AutoSentinx ran {playsTotal}…"` is the **borderline** case (engine attribution inside customer-read report body). Default to **"Sentinx"**; flag for explicit product sign-off (see Phase 7, Item 3).
  - The **logo wordmark** (`components/logo.tsx:39-40`) renders `AutoSentin<span>X</span>`; as user-facing chrome it should read **"Sentinx"** (tracked as a wordmark item, *not* the Phase 1 gradient fix).
- **Deliberate exceptions (stay "AutoSentinx"):** `app/page.tsx` marketing landing (engine-as-product Latticly branding — see DROP set), `api-contract.md` title, all server/engine code, the AARAV sandbox target name.
- **R2 (below) is rewritten accordingly:** the pre-commit grep guard no longer hunts stray "Sentinx" — it verifies each surface carries the *correct* brand per the split.

---

## Inputs synthesized

- `conformance-triage.md` — PRESERVE 9 / TWEAK 8 / TRASH 14 across 31 rows.
- `api-contract.md` — the **first written** FE↔BE contract + 8 mismatch findings (still **untracked** in git as of verification).
- Live preflight against MAIN @ `eabb173` and our diff `6c0c5a9..4a567ab` (every claim below carries its grep/read proof).

## Guiding principles

1. **Land the free wins first.** The 9 PRESERVE files apply cleanly and several (medium shape, `RISK_BAND .55`, `score.ts`) also correct main's **live** path via `lib/api.ts`. Lowest risk, highest leverage — do them before touching anything that branches with main.
2. **Never re-introduce dead or superseded code.** All landing fixes, the login fake-auth removal, the poll-vs-timer swap, and the `mock/run.ts` wiring are TRASH — main already solved or deleted those. Porting them would create dead code or regress live behavior.
3. **One breaking change is gated.** `evidence.tsx` adds **required** props; it must ship in the *same commit* as the two detail-page call-site updates or main's build breaks. Treat as an atomic unit.
4. **Contract gaps are a separate workstream.** The FE↔BE mismatches are not conformance fixes; most are "decide + document," and only a couple are real code changes. Don't conflate with the port.
5. **Naming is cross-cutting and split, not uniform.** Apply THE NAMING RULE above on every file touched; the grep guard verifies the correct brand per surface (it does not blanket-rewrite to one name).

---

## (a) Conformance fixes: what to port, in what order — with full evidence

### Phase 0 — Setup (do once)
- Branch off `eabb173`. Confirm `npm run build` + lint are green on untouched main (baseline).
- Keep our `4a567ab` checkout side-by-side for copy/diff reference.

### Phase 1 — PRESERVE (apply cleanly, ship as one reviewable batch) — **do first**

These touch files main left at our base; no adaptation needed. Order within the batch is irrelevant, but verify build once after all. The verified per-item analysis follows verbatim (each item: 1 what's wrong · 2 impact · 3 proof · 4 fix · 5 logs · 6 additional info).

All preflight checks complete. Every claim is verified against MAIN's live code and the design docs. Here is my section.

---

#### item — lib/outcome.ts · SEVERITY_META.medium shape `◆` → `◗`

**1. What's wrong?**
MAIN renders the MEDIUM severity glyph as a filled diamond `◆`, but the normative shape table specifies a half-filled diamond `◗`. The diff corrects it.

**2. What it actually impacts, and how**
User-visible, on every severity chip (`SeverityChip` reads `m.shape`). The shape is the colour-blind/grayscale redundant channel (colour AND label AND shape). `◆` (fully filled) reads as a "solid" severity weight, visually closer to Critical `■`; `◗` is the intended "half" glyph that distinguishes MEDIUM at a glance in grayscale. Mechanism: `badges.tsx:16` emits `<span aria-hidden>{m.shape}</span>`, so the glyph is purely the non-colour signal — the wrong glyph weakens the very accessibility guarantee the channel exists for.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'medium: { label: "MEDIUM"' lib/outcome.ts` → literal result:
`64: medium: { label: "MEDIUM", shape: "◆", rank: 2, ... }` — still un-applied (`◆`).
DIFF: `lib/outcome.ts` hunk changes line 64 `shape: "◆"` → `shape: "◗"`.
CONTRADICTS the normative source: `spec/00-foundation.md:177` `| Medium | MEDIUM | half-filled diamond ◗ | ... | diamond |`, and reinforced by `spec/findings.md:84` (`■ / ▲ / ◗ / ○`) and `spec/findings.md:214` (`MEDIUM ◗`). The diff CONFORMS to all three.

**4. What should happen?**
Apply the one-character change in `sentinx-web/lib/outcome.ts:64`: `shape: "◆"` → `shape: "◗"`. No other change.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
The glyph is `aria-hidden`, so screen readers are unaffected; this is purely a visual-redundancy fix. Naming: not a brand string. Applies cleanly (line 64 unchanged in MAIN). Caveat: `◗` must be the U+25D7 RIGHT HALF BLACK CIRCLE character used in the spec/diff; verify the literal character round-trips through the editor.

---

#### item — lib/outcome.ts · RISK_BAND.hi `0.7` → `0.55` (also corrects the LIVE deriveOutcome)

**1. What's wrong?**
The single-judge RISK band upper bound is `0.7` in MAIN; the spec's current value is `0.55`. The diff narrows it to `{ lo: 0.3, hi: 0.55 }`.

**2. What it actually impacts, and how**
Wrong verdict, on the LIVE path. `deriveOutcome` (outcome.ts:43) classifies single-judge `defended` rows: `verdictScore ∈ [lo, hi)` → RISK, else PASS. With `hi: 0.7`, scores in `[0.55, 0.7)` are mislabeled RISK instead of PASS. This is not cosmetic: `lib/api.ts:55-60` calls the same `deriveOutcome` with `verdictScore: o.verdictScore ?? 0` on every backend observation, so the live console's FAIL/RISK/PASS counts, the findings table, module scores, and the headline verdict all shift. It also de-syncs the on-screen "RISK band" note, which the spec says must read `0.30–0.55`.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n RISK_BAND lib/outcome.ts` → `11: export const RISK_BAND = { lo: 0.3, hi: 0.7 } as const;` and `43: if (o.verdictScore >= RISK_BAND.lo && o.verdictScore < RISK_BAND.hi)` — still `0.7`.
LIVE wiring proof: `grep -n 'verdictScore\|deriveOutcome' lib/api.ts` → `4: import { deriveOutcome }`, `55: const outcome = deriveOutcome({`, `59: verdictScore: o.verdictScore ?? 0` — confirms api.ts imports the same constant.
DIFF: line 11 → `{ lo: 0.3, hi: 0.55 }`.
CONTRADICTS `spec/findings.md:116` and `:204` ("RISK band = verdict_score **0.30–0.55** (tunable)"). `conformance-triage.md:58` explicitly states this PRESERVE item "also corrects the live `lib/api.ts` derivation, since it imports the same `RISK_BAND`."

**4. What should happen?**
Change `sentinx-web/lib/outcome.ts:11` to `export const RISK_BAND = { lo: 0.3, hi: 0.55 } as const;`. Also update the comment to the diff's wording (`D-Q19 tunable default — findings.md §6 / observation-detail.md §7.2`).

**5. Error messages / logs / traces**
none (static/structural — behavioral change in derivation, no build error).

**6. Additional info**
DOC CONFLICT TO FLAG (caveat, not a blocker): several specs still cite the OLD `[0.30, 0.70)` band — `spec/00-foundation.md:203,217,293`, `spec/pdf-report.md:152,154,235`. Only `findings.md` and `observation-detail.md` (the files the diff's comment cites) carry `0.55`. The diff follows the newer `findings.md`/`observation-detail.md` value, which matches triage's PRESERVE directive. If any on-screen band-note copy or the PDF band note is hard-coded to `0.30–0.70` elsewhere, it must be updated to `0.30–0.55` to stay consistent. No brand-string concern. Applies cleanly.

---

#### item — lib/score.ts · count-parity (critical/high) + zero-findings predicate

**1. What's wrong?**
Two things. (a) `summaryCounts.critical`/`.high` in MAIN count only failing rows (`severity===X && (FAIL||RISK)`), but D-Q3 table parity requires counting all observation rows of that severity. (b) `isZeroFindings` in MAIN returns true only when *every* row is PASS, but the affirmative "held the line" state is the absence of Critical/High FAIL-or-RISK findings.

**2. What it actually impacts, and how**
Wrong counts and a wrong success-state trigger, both user-visible. (a) The headline Critical/High tallies won't match the count of Critical/High rows in the findings table (a PASS Critical row would be in the table but excluded from the headline), breaking the "Total/Critical/High count table rows" parity. (b) `isZeroFindings` gates the zero-findings success screen; with the `every PASS` predicate, a run containing only Low/Medium findings (or any non-Critical/High RISK) would NOT show "held the line" even though there are no Critical/High findings — the affirmative state the copy promises ("No Critical or High findings in this run.") never fires.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'failing\|critical:\|high:\|every((o) => o.outcome' lib/score.ts` → literal:
`48: const failing = (x) => x.outcome === "FAIL" || x.outcome === "RISK";`
`55: critical: o.filter((x) => x.severity === "critical" && failing(x)).length,`
`56: high: o.filter((x) => x.severity === "high" && failing(x)).length,`
`85: return run.observations.every((o) => o.outcome === "PASS");`
DIFF: removes `failing`, makes `critical`/`high` = `severity===X` row counts; rewrites `isZeroFindings` to `!run.observations.some(o => (critical||high) && (FAIL||RISK))`.
CONFORMS to: `spec/findings.md:152` ("Sort by Severity default (Critical → Low), then verdict_score" — same table model the counts mirror); `spec/findings.md:156` + `:206` zero-findings copy "No Critical or High findings in this run."; comment cites `findings.md §5 / plan §C5`. D-Q3 parity is named in the diff comment and `conformance-triage.md:46`.

**4. What should happen?**
In `sentinx-web/lib/score.ts`: delete the `failing` helper (line 48); set `critical`/`high` to `o.filter(x => x.severity === "critical"/"high").length` (lines 55-56); replace `isZeroFindings` body (line 85) with the negated `.some(...)` over Critical/High × (FAIL|RISK). Exactly as the diff shows.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
`bypass` count is unchanged. Both `summaryCounts` and `isZeroFindings` feed the live path too (they take a `Run`, which `lib/api.ts` produces). The zero-findings copy strings are "Sentinx ran N…" — brand-facing **"Sentinx"** (correct: it's product/UI copy, not engine). No string change is in this file. Applies cleanly.

---

#### item — components/logo.tsx · remove banned `<linearGradient>`

**1. What's wrong?**
The `RadarMark` SVG defines a `linearGradient` ("sweep" fan, filled via `url(#sweep)`). Gradients are banned in the mark; the diff deletes the `<defs>` block and the gradient-filled sweep path, keeping the solid sweep line.

**2. What it actually impacts, and how**
User-visible mark rendering, plus a latent correctness hazard. The gradient `id="sweep"` is a document-global SVG id; if the `Logo` renders more than once on a page (e.g., top bar + footer, or multiple marketing nav instances), duplicate `id="sweep"` definitions collide and `url(#sweep)` can resolve to the wrong/first def — a known multi-instance SVG bug. Removing it both conforms to the "no gradient" mark rule and eliminates the duplicate-id fill. The visible mark loses the soft fan but keeps concentric arcs + a crisp sweep line.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'linearGradient\|url(#sweep)\|<defs>' components/logo.tsx` → literal:
`7: <defs>` / `8: <linearGradient id="sweep" ...>` / `11: </linearGradient>` / `18: <path d="M12 12 L20.5 9.2 ..." fill="url(#sweep)" />` — gradient still present.
DIFF: deletes lines 7-12 (`<defs>…</defs>`) and the `fill="url(#sweep)"` path (line 18); relabels the remaining stroke path comment to "sweep line."

**4. What should happen?**
In `sentinx-web/components/logo.tsx`: remove the entire `<defs>…</defs>` gradient block and the `<path … fill="url(#sweep)" />` line; keep the two arc paths, the solid sweep-line path (line 17), and the center circle. As in the diff.

**5. Error messages / logs / traces**
none (static/structural). No console error in MAIN today because the single-instance case resolves; the risk is silent mis-fill on multi-instance.

**6. Additional info**
NAMING FLAG: the logo wordmark text in MAIN is `AutoSentin<span>X</span>` (logo.tsx:39-40). The Phase 1 logo diff does NOT touch the wordmark — but per the naming rule, the **user-facing** product wordmark should read **"Sentinx"**, not the engine name "AutoSentinx." This is out of scope for the gradient fix but should be flagged: if the logo is user-facing chrome, the wordmark is a string that must read "Sentinx." Confirm whether a separate item covers the wordmark rename; the gradient diff alone leaves "AutoSentinX" intact. Gradient removal applies cleanly. **PL2 decision:** track the wordmark → "Sentinx" rename as its own one-line copy item (do it whenever `logo.tsx` is open, but keep it logically distinct from the gradient fix so the grep guard catches it).

---

#### item — components/theme-toggle.tsx · `h-8 w-8` → `h-11 w-11`, `rounded-md` → `rounded-sm`

**1. What's wrong?**
The theme-toggle button is 32×32px (`h-8 w-8`) in MAIN; WCAG 2.5.8 / the spec want ≥44×44px. The diff sizes it to 44×44 (`h-11 w-11`) and squares the corners (`rounded-md`→`rounded-sm`) for geometry consistency.

**2. What it actually impacts, and how**
a11y (target size) + minor visual. `h-8` = 2rem = 32px, below the 44px target; `h-11` = 2.75rem = 44px. Mechanism: the size classes set the button's box directly, so the click/touch target grows to the compliant 44². `rounded-sm` (3px radius per the `--radius-sm` token) aligns with the product's "sharp/terminal-precise" geometry vs the softer `rounded-md`.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'h-8 w-8\|rounded-md\|h-11' components/theme-toggle.tsx` → literal:
`20: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border ...",` — still `h-8`/`rounded-md`, no `h-11`.
DIFF: line 20 `h-8 w-8 … rounded-md` → `h-11 w-11 … rounded-sm`.
CONFORMS to `spec/00-foundation.md:318` ("theme toggle … ≥44px target, aria-pressed") and `:358` ("theme toggle ≥ 24×24px (ideally 44)"), and `DESIGN.md:157` ("≥ 44×44px touch/click targets").

**4. What should happen?**
In `sentinx-web/components/theme-toggle.tsx:20`: `h-8 w-8 … rounded-md` → `h-11 w-11 … rounded-sm`. Icon size (`h-4 w-4`) stays.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
Caveat: spec `:318` also calls for `aria-pressed` on the toggle; MAIN uses `aria-label` only (theme-toggle.tsx:18) and has no `aria-pressed`. The Phase 1 diff does NOT add `aria-pressed` — out of scope here, but a residual gap if a separate item doesn't cover it. The size bump may nudge layout where the toggle sits in a tight bar (login top-right, minimal-bar); verify no overflow. No brand string. Applies cleanly.

---

#### item — components/observations-table.tsx · th scope, row `role=button`+aria-label+Space, Clear, verdict_score tiebreak, ink-faint→ink-muted

**1. What's wrong?**
Multiple findings-table a11y/sort/clear gaps in MAIN: bare `<th>` (no `scope="col"`); rows are keyboard-openable with Enter only (no `role="button"`, no `aria-label`, no Space); no "Clear filters" action; sort is severity-only with no `verdict_score` tiebreak; and three `text-ink-faint` usages on actual text. The diff fixes all five.

**2. What it actually impacts, and how**
a11y + correctness + readability, all user-visible. (a) Without `scope="col"`, screen readers can't reliably associate header cells with data cells. (b) Rows act as buttons but lack `role="button"`/`aria-label` and don't respond to Space — AT announces a plain row, and Space (a standard button activation key) does nothing; the diff adds `role="button"`, `aria-label={`Open finding ${o.id}`}`, and `e.key === " "` with `preventDefault()` (stops page scroll). (c) After filtering to an empty set there's no escape affordance; the diff adds a "Clear" button (gated on `filtered`). (d) Severity-only sort leaves equal-severity rows in arbitrary order; the diff adds `b.verdictScore - a.verdictScore` as the documented tiebreak. (e) `ink-faint` is "NON-TEXT decoration only" and fails AA for text — three text spans use it; the diff moves them to `ink-muted`.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'scope=\|aria-label\|e.key === " "\|verdictScore\|ink-faint\|Clear\|role="button"' components/observations-table.tsx` → literal results:
`47: …text-ink-faint tnum">{rows.length} shown</span>`
`53: …uppercase tracking-wide text-ink-faint">`
`102: <p className="text-[12px] text-ink-faint">`
…and NO hits for `scope=`, `aria-label`, `e.key === " "`, `verdictScore`, `Clear`, or `role="button"` — confirming all five are un-applied. (Cross-check: MAIN `Th` = `<th className=...>` at line 124; row `onKeyDown` is Enter-only at line 70; sort is `severityRank(b)-severityRank(a)` only at line 31.)
Field check: `grep -n verdictScore lib/types.ts` → `83: verdictScore: number; // 0..1` — the tiebreak field exists, so `b.verdictScore - a.verdictScore` compiles.
CONFORMS to: `spec/findings.md:152` ("Sort by Severity default (Critical → Low), then by verdict_score"); `:155` ("Clear filters action"); `spec/00-foundation.md:251` ("keyboard-activable (Enter/Space → onOpen)"); `:22` (`--ink-faint` is "non-text decoration only … fails AA for text"). Triage `conformance-triage.md:46` lists exactly this PRESERVE item and notes MAIN is "still bare `<th>`, Enter-only row, `{n} shown`, severity-only sort, `ink-faint`."

**4. What should happen?**
In `sentinx-web/components/observations-table.tsx`: (1) `Th` → `<th scope="col" …>`; (2) add `role="button"`, `aria-label={`Open finding ${o.id}`}`, and `e.key === " "` (+ `e.preventDefault()`) to the row; (3) add `clearFilters()` + the "Clear" button in the toolbar (gated on `filtered`), and change the count copy to "N observation(s)"; (4) add `verdictScore` descending as the sort tiebreak after `severityRank`; (5) change the three `text-ink-faint` text spans (lines 47, 53, 102) to `text-ink-muted`. Exactly as the diff.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
Ordering/dep: the `verdictScore` tiebreak depends on the field being present on every row — it is, both in the type (types.ts:83) and on the live mapping (api.ts passes `verdictScore`), so no runtime `undefined`. NAMING: `aria-label` reads "Open finding {id}" — generic, no brand. The toolbar count change ("N observations") is UI copy, not a brand string. This is the largest Phase 1 file; applies cleanly because MAIN is at the diff's base (no overlapping edits). Note `Td`/`Select`/`attacks` helpers are untouched.

---

#### item — components/disclosure.tsx · `aria-controls` resolves (always-render controlled region via `hidden`)

**1. What's wrong?**
The button sets `aria-controls={id}`, but in MAIN the controlled `<div id={id}>` is conditionally mounted only when `open` (`{open && (...)}`). While collapsed, the referenced id doesn't exist, so `aria-controls` dangles. The diff always renders the region and toggles visibility with the `hidden` attribute.

**2. What it actually impacts, and how**
a11y (broken ARIA reference), user-visible to AT. `aria-controls` must point to an element that exists in the DOM; when collapsed the `id` target is absent, so the association is invalid and assistive tech can't relate the toggle to its region. The fix renders `<div id={id} hidden={!open} …>` unconditionally — the id always resolves, and `hidden` both visually hides and removes it from the a11y tree when closed, preserving the collapse behavior without the dangling reference.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN): `grep -n 'open && (\|aria-controls\|hidden=' components/disclosure.tsx` → literal:
`25: aria-controls={id}` and `38: {open && (` — and NO `hidden=` — confirming the controlled region is still conditionally mounted (un-applied).
DIFF: replaces `{open && (<div id={id} …>…</div>)}` with `<div id={id} hidden={!open} …>…</div>` (plus a comment on the a11y disclosure contract). Note the diff hunk also changes the wrapper `rounded-md`→`rounded-lg` and the count span `ink-faint`→`ink-muted`; the load-bearing a11y fix is the always-rendered region.
CONFORMS to the WAI-ARIA disclosure pattern (aria-controls must reference an existing element); reinforced by the diff's own comment "Always render the controlled region so aria-controls resolves even while collapsed."

**4. What should happen?**
In `sentinx-web/components/disclosure.tsx`: change the conditional `{open && (<div id={id} className="border-t border-border px-3 py-3">{children}</div>)}` to an always-rendered `<div id={id} hidden={!open} className="border-t border-border px-3 py-3">{children}</div>`. (Diff also flips wrapper to `rounded-lg` and the count to `ink-muted`.)

**5. Error messages / logs / traces**
none (static/structural). No console warning is emitted for a dangling `aria-controls`; it's an axe/AT-level finding, not a React error.

**6. Additional info**
Caveat: always-rendering `children` means the collapsed content is in the DOM (mounted) even when hidden — fine for static content; if any child does heavy work on mount, note it now lives behind `hidden` rather than unmounted. The `rounded-md`→`rounded-lg` in this same hunk is a visual change bundled with the a11y fix (the prompt's Phase 1 scope names "aria-controls resolves"; the `rounded-lg` and `ink-muted` ride along in the diff). No brand string. Applies cleanly.

---

#### item — badges / findings / run-tabs · `ink-faint` → `ink-muted`

**1. What's wrong?**
Four text spans across three components render in `text-ink-faint`, which is reserved for non-text decoration and fails AA contrast for text. The diff moves them to `text-ink-muted` (an AA-safe text token).

**2. What it actually impacts, and how**
a11y (text contrast), user-visible. `--ink-faint` is explicitly "NON-TEXT decoration only" and fails AA; using it on real text (the oracle label, the `/ {plays}` denominator, the finding `o.id`, and the inactive tab count) yields under-contrast text. `ink-muted` is the permitted muted-text token. Mechanism: each is a literal Tailwind class on a `<span>` containing text; swapping the token raises the colour to the AA-safe `--ink-muted` value.

**3. Why — proof, preflight checks, vs which doc/code**
PREFLIGHT (MAIN) — literal results:
`grep -n ink-faint components/badges.tsx` → `54: <span className={cn("text-[11px] text-ink-faint", className)}>{ORACLE_LABEL[oracle]}</span>` (OracleTag).
`grep -n ink-faint components/findings.tsx` → `18: …text-ink-faint"> / {plays}</span>` and `65: …text-[11px] text-ink-faint">{o.id}</span>`.
`grep -n ink-faint components/run-tabs.tsx` → `38: active ? "bg-white/20 text-on-brand" : "bg-surface-sunk text-ink-faint",` (inactive tab count).
Token-definition check: `grep -n 'ink-faint\|ink-muted' app/globals.css` → `16: --ink-faint: #8a94a3; /* NON-TEXT decoration only */` and `--ink-muted` defined alongside — confirming `ink-faint` is the non-text token and `ink-muted` is the text token.
DIFF: each of these four lines flips `ink-faint`→`ink-muted`.
CONFORMS to `spec/00-foundation.md:22`: "`--ink-faint` is **non-text decoration only** (it fails AA for text)." Triage `conformance-triage.md:73` lists "the `ink-faint→ink-muted` readability fixes in `badges`/`findings`/`run-tabs`."

**4. What should happen?**
Change the literal class in each: `sentinx-web/components/badges.tsx:54`, `components/findings.tsx:18` and `:65`, `components/run-tabs.tsx:38` — `text-ink-faint` → `text-ink-muted`. (In run-tabs the token sits inside a `cn(...)` ternary string.)

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
Scope note: `grep -rln ink-faint` shows 16 files still use `ink-faint` repo-wide (incl. `top-bar.tsx`, `ui.tsx`, `evidence.tsx`, several `app/*` pages, and the disclosure/observations-table spans handled in their own items). Phase 1 only covers badges/findings/run-tabs (plus the two table/disclosure spans in their items) — the remaining `ink-faint`-on-text instances are NOT in this Phase 1 set and remain residual a11y gaps to triage separately (and some `ink-faint` uses are legitimately non-text decoration, e.g. icon/divider colours, which must NOT be changed). No brand strings. All four apply cleanly.

**Phase 1 Definition of Done:** `npm run build` + lint green; `grep -rn "ink-faint" components/badges.tsx components/findings.tsx components/run-tabs.tsx` returns only non-text uses; no brand strings introduced. → commit **"Phase 1: preserve clean conformance fixes (medium ◗, RISK band .55, count parity, a11y)."**

---

### Phase 2 — `globals.css` tokens (TWEAK, low-risk, isolated)
### Phase 3 — `ui.tsx` + `login` (TWEAK, adapt) — global controls, do together

The verified Phase 2–3 analysis follows verbatim.

Now I have everything verified. Key facts confirmed:
- MAIN globals.css applies cleanly with the diff (the context lines `--shadow-elev`, `--font-mono`, `@layer base`, the dark tokens all match base `6c0c5a9`); `--shadow-elev` IS consumed by `.glass`/`.feature-card`/`.step-card` at lines 200/228/254.
- `--grid-*` tokens are separate names — no collision with our dark-token edits.
- `.btn-cta`/`.btn-cta-ghost` are raw CSS classes used directly via `className` in app/page.tsx and marketing-nav.tsx — they do NOT use `<Button>`, so the ui.tsx Button size/radius change cannot fight marketing buttons.
- Our diff's login is built on OLD base (cosmetic `setTimeout`, `code.length < 3`) — directly conflicts with MAIN's real `await login()` JWT, `code.length < 8`.
- `Noto Sans Mono`/`Noto Sans Devanagari Mono` are NOT loaded in layout.tsx — they're string fallbacks relying on the OS.
- `phase-pulse` and `scroll-padding-top` are consumed in the diff (processing-view, run screens) but NOT on login.
- node_modules absent in mainsync, so all findings are static/structural (no live build).

Here is my section.

---

#### item 1 — login: our diff regresses MAIN's real JWT auth back to a cosmetic `setTimeout` mock

**1. What's wrong?**
Our diff for `app/login/page.tsx` was authored against the OLD base (`6c0c5a9`), whose `submit()` was a fake `setTimeout(() => router.push("/new"), 450)` with a `code.length < 3` gate. MAIN has since replaced that with a real async JWT call (`await login(email, code)`, `code.length < 8`). Applying our diff as-is would delete MAIN's real authentication and route the user to `/new` without ever calling the backend.

**2. What it actually impacts, and how**
Wrong verdict + broken product behavior. Mechanism: our `submit()` is synchronous and never imports/calls `login()` from `lib/api.ts`. The user would "sign in" with any `@`-containing email and no real password, the `sx_jwt` httpOnly cookie would never be set, and every subsequent `/api/*` BFF call (which requires `Authorization: Bearer <jwt>` server-side) would 401. It also reintroduces the `setTimeout` race the real flow removed.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (base our diff targets): `git -C /Users/sangramsabat/autosentinx show 6c0c5a9:sentinx-web/app/login/page.tsx` → literal `if (!email.includes("@") || code.length < 3) {...} setTimeout(() => router.push("/new"), 450);` — confirms the diff's "before" is the cosmetic mock.
- PREFLIGHT (MAIN now): `Read sentinx-web/app/login/page.tsx` → lines 18-34: `async function submit` with `if (!email.includes("@") || code.length < 8) {...}` then `await login(email, code); router.push("/new");` inside try/catch. MAIN login at **app/login/page.tsx:27**.
- PREFLIGHT (signature): `grep -n "export async function login" /Users/.../sentinx-web/lib/api.ts` → **lib/api.ts:20** `export async function login(email: string, password: string)` posting to `/api/auth/login`.
- DOC: `conformance-triage.md:33` row 6 marks the fake-auth-gate removal as **TRASH / "Moot: main added real JWT auth"**; this plan's Phase 3 says "main already does real password validation (`code.length < 8`)… Drop the fake-auth-removal item entirely (TRASH #6 — moot)." Our diff does the exact opposite — it re-imposes the cosmetic gate.

**4. What should happen?**
Do NOT take our diff's `submit()` body, the `450→700` timeout change, or the `// Cosmetic gate` comment. Keep MAIN's real async `submit()` (the `await login()` try/catch, `code.length < 8`, `setSubmitting(false)` on error). Layer ONLY the a11y/markup attributes (see item 2) on top. File: `app/login/page.tsx`.

**5. Error messages / logs / traces**
none (static/structural — `node_modules` is absent in mainsync, so no live build; verified `npx tsc` reports the env has no compiler).

**6. Additional info**
Ordering: this is the load-bearing reconciliation — items 2 and 3 only make sense once the real `submit()` is preserved. NAMING: login copy is user-facing → "Sentinx". MAIN's h1 currently reads **"Sign in to AutoSentinx"** (app/login/page.tsx:44) — wrong brand for a user-facing surface; correct it to **"Sign in to Sentinx"** as part of this phase (THE NAMING RULE).

---

#### item 2 — login a11y attributes: safe to re-apply onto MAIN's async submit, but one error string is wrong for a real password flow

**1. What's wrong?**
The a11y attributes in our diff (`autoFocus`, `autoComplete="username"`/`current-password`, `readOnly={submitting}`, `aria-describedby`, `aria-live="polite"`, `aria-busy`, the warning icon) are correct and should be ported. BUT two pieces fight MAIN's reality: (a) our diff drops `aria-invalid`, `onChange` error-clear, and the `setError(false)` from the password field — fine for a cosmetic gate, wrong for a real validated password; and (b) the error copy `"Enter the email address provided for this session."` describes a no-auth demo, not MAIN's account-creating password ≥8 flow.

**2. What it actually impacts, and how**
A11y + wrong/misleading copy. Mechanism: MAIN gates on BOTH `!email.includes("@")` AND `code.length < 8`, and surfaces backend errors via `setErrorMsg(err.message)`. Our diff's single hard-coded email-only error string would mis-describe a too-short-password failure or a backend `401/signup` failure, telling the user to fix their email when the password (or server) was the problem. Porting our diff's password field verbatim also strips its `aria-invalid` and error-clear-on-change, regressing MAIN's 3.3.1 error association on that field.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (our diff): `git diff 6c0c5a9..4a567ab -- sentinx-web/app/login/page.tsx` → adds `autoFocus`, `autoComplete="username"`, `readOnly={submitting}`, `aria-describedby={error ? "login-error" : undefined}` on email; `autoComplete="current-password"` on the code field but changes its `onChange` to `(e) => setCode(e.target.value)` (drops `setError(false)`) and REMOVES its `aria-invalid={error}`; error `<p>` gains `id="login-error" aria-live="polite"` + `<AlertTriangle .../>` with copy `Enter the email address provided for this session.`
- PREFLIGHT (MAIN keeps a dynamic message): `Read app/login/page.tsx:16,30` → MAIN already has `errorMsg` state and `setErrorMsg(err instanceof Error ? err.message : "Sign-in failed.")`. MAIN renders `{errorMsg}`, our diff hard-codes a static string — a regression of MAIN's server-error surfacing.
- DOC: `conformance-triage.md:34` (row 7, TWEAK) is explicit — "the field is now a real Password (8+)… the 'Access code'/'Demo access' hint copy must be reconciled with real auth, and 'Enter the email address provided for this session.' no longer fits an account-creating password flow." `spec/login.md:96,126` give the cosmetic-era strings; they must be ADAPTED, not pasted, because MAIN's field is a real password (`api-contract.md:30-31`: `/auth/login` → 401 fallback `/auth/signup`, pw ≥ 8).

**4. What should happen?**
Port onto MAIN's `submit()`: `autoFocus` + `autoComplete="username"` + `readOnly={submitting}` + `aria-describedby={error ? "login-error" : undefined}` on email; `autoComplete="current-password"` + `readOnly={submitting}` on the password field while KEEPING MAIN's `aria-invalid={error}` and the `setError(false)` on its `onChange`; add `id="login-error" role="alert" aria-live="polite"` + the ▲ icon to the error `<p>`; add `aria-busy={submitting}` to the Button. Render MAIN's dynamic `{errorMsg}` inside that `<p>` (not a hard-coded string), and keep MAIN's default `errorMsg` "Enter a valid email and a password (8+ characters)." (adapt wording to taste, but it must reference the password, since the password IS validated). File: `app/login/page.tsx`.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
The ▲ glyph: `spec/login.md:74,96,160` specify a "line warning glyph (▲)". Our diff uses lucide `AlertTriangle` — acceptable (MAIN already imports `AlertTriangle` in `components/states.tsx:2` and `app/error.tsx:5`, so the export resolves under MAIN's lucide pin). One caveat: `package.json:14` pins `"lucide-react": "^1.17.0"` and `node_modules` is not installed here, so I could not runtime-verify the export; it's used elsewhere in MAIN so it is safe. `spec/login.md:156` says 2.4.11 Focus-Not-Obscured is **N/A on login** (no sticky bar) — see item 5 for the global `scroll-padding-top`. NAMING: copy is user-facing → "Sentinx" (footer in our diff `Sentinx — confidential. Authorized use only.` matches `spec/login.md:132` — correct).

---

#### item 3 — login "Access code" / "Demo access" label + hint copy contradicts MAIN's real account-creating password

**1. What's wrong?**
Our diff keeps the label `Access code` and hint `Demo access — use the credentials provided for this session.` (cosmetic-era spec copy). MAIN's field is a real password (`code.length < 8`, sent to `/api/auth/login`, account-creating on first use). Calling a validated, account-creating password an "Access code" / "Demo access" is misleading and inconsistent with MAIN's own hint.

**2. What it actually impacts, and how**
User-visible copy contradiction. Mechanism: MAIN's hint already reads `8+ characters. First sign-in creates your operator account.` (app/login/page.tsx:61) — a truthful password description. Our diff would overwrite that truthful copy with "Access code / Demo access," telling the user the field is a throwaway demo code when it actually creates a real backend account with a password minimum.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (MAIN truthful hint): `Read app/login/page.tsx:61` → `<Field label="Password" htmlFor="code" hint="8+ characters. First sign-in creates your operator account.">`. MAIN already uses label **"Password"**, not "Access code."
- PREFLIGHT (our diff reverts it): `git diff …login/page.tsx` → `<Field label="Access code" … hint="Demo access — use the credentials provided for this session.">`. This is a downgrade from MAIN's accurate copy.
- DOC: `conformance-triage.md:34` row 7 explicitly says the "Access code"/"Demo access" hint copy "must be reconciled with real auth." `spec/login.md:17` and §6 describe the cosmetic era ("There is no backend auth endpoint"); that premise is FALSE for MAIN (`api-contract.md:30-31,73` document a live `/auth/login` + `/auth/signup`). So the spec's literal "Access code" strings must yield to MAIN's real password.

**4. What should happen?**
Keep MAIN's `label="Password"` and a password-accurate hint (MAIN's `8+ characters. First sign-in creates your operator account.` is good; keep it or lightly reword). Do NOT apply our diff's `Access code` label or `Demo access…` hint. Keep MAIN's `type="password"` and add only `autoComplete="current-password"`. File: `app/login/page.tsx`.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
NAMING: user-facing → "Sentinx". The subtitle: our diff sets `Security & compliance audit console` (matches `spec/login.md:123` brand sub-line) — that's an acceptable improvement over MAIN's "Access the red-team console." and is brand-safe. Footer is fine (see item 2). The h1 should read **"Sign in to Sentinx"** (correct it from MAIN's "AutoSentinx" — item 1).

---

#### item 4 — ui.tsx control resize (h-11/rounded-sm, Card elevation, Textarea, aria-invalid) is safe and does NOT fight `.btn-cta` marketing buttons

**1. What's wrong?**
Nothing wrong — this is a verification item. The concern was that enlarging the shared `<Button>`/`<Input>` (to `h-11`/`rounded-sm`) and adding `box-shadow:var(--shadow-elev)` on `<Card>` would alter the Latticly marketing buttons. It does not: the landing CTAs use the raw CSS classes `.btn-cta`/`.btn-cta-ghost`, not the React `<Button>` component.

**2. What it actually impacts, and how**
No marketing regression; the changes are scoped to the console primitives. Mechanism: `<Button>` styling is composed in `components/ui.tsx`; `.btn-cta` is composed in `globals.css` and applied via literal `className="btn-cta"`. They share no selector, so resizing `<Button>` cannot touch the gradient marketing CTAs. The `aria-invalid:` Tailwind v4 variant on Input/Textarea only paints a `--fail-text` border when a consumer sets `aria-invalid`, so it's inert elsewhere.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (marketing buttons are raw CSS, not `<Button>`): `grep -n "btn-cta|<Button" app/page.tsx` → only `app/page.tsx:138,141,307,310` as `className="btn-cta…"`/`btn-cta-ghost`, plus `components/marketing-nav.tsx:51`. ZERO `<Button` in `app/page.tsx`. So the Button component and the marketing CTA are disjoint.
- PREFLIGHT (Card shadow consumers exist): `grep -n "var(--shadow-elev)" app/globals.css` → **globals.css:200 (.glass), 228 (.feature-card), 254 (.step-card)** already consume `--shadow-elev`; adding it to `<Card>` reuses the same token — consistent, not novel.
- PREFLIGHT (our diff): `git diff …components/ui.tsx` → Button `rounded-md→rounded-sm`, `sm:h-8→h-9`, `md:h-9→h-11`; Card `rounded-md→rounded-lg` + inline `style={{ boxShadow: "var(--shadow-elev)", ...style }}`; Input `h-9→h-11`, `rounded-md→rounded-sm`, adds `aria-invalid:border-fail-text aria-invalid:focus-visible:border-fail-text`; adds `Textarea`.
- DOC: `conformance-triage.md:75` lists "`ui.tsx` control sizing/radius/Card-elevation/`Textarea`" as a TWEAK to re-apply; `spec/login.md:72` requires `--radius-sm` on the TextField and **2.5.8 target size ≥44px** (`spec/login.md`) — `h-11` = 44px satisfies it. `--radius-sm` is `3px` (`globals.css:124`), so `rounded-sm` is correct.

**4. What should happen?**
Apply the ui.tsx changes as-is. One ordering caveat: the Card inline `style={{ boxShadow: "var(--shadow-elev)", ...style }}` spreads caller `style` AFTER, so a caller can still override — good. **Also: convert `Input` to `React.forwardRef<HTMLInputElement, …>` so Phase 4's `ref={tokenRef}` compiles (see Item P4-2).** Confirm `style` prop is now destructured on Card (our diff adds it). File: `components/ui.tsx`.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
Tailwind v4 supports `aria-invalid:` as a built-in variant (maps to `&[aria-invalid="true"]`) — no config needed; `globals.css:1` is `@import "tailwindcss"` (v4, per `package.json:27` `tailwindcss: ^4`). Could not runtime-verify (no `node_modules`), but it is a documented v4 native variant. NAMING: ui.tsx has no user-facing brand strings.

---

#### item 5 — globals.css token/shadow/mono/scroll-padding edits apply cleanly; two caveats (unloaded mono fonts; global scroll-padding is harmless on login)

**1. What's wrong?**
The globals.css diff is low-risk and applies cleanly onto MAIN's 386-line file (the diff's context lines all match MAIN). Two caveats: (a) the new `--font-mono` fallbacks `"Noto Sans Mono"` / `"Noto Sans Devanagari Mono"` are NOT loaded as web fonts in `layout.tsx` — they rely on the OS having them installed, so on most machines they silently fall through to `ui-monospace`; and (b) `scroll-padding-top: 3.5rem` is a GLOBAL `html` rule justified for run screens with a sticky TopBar, but login has no sticky bar (`spec/login.md:156` says 2.4.11 is N/A there) — harmless, just not load-bearing on login.

**2. What it actually impacts, and how**
Cosmetic/no-op on most setups; no breakage. Mechanism: `next/font` only self-hosts fonts that are imported and assigned a `--font-*` variable in `layout.tsx`. `layout.tsx:10` defines only `--font-deva`; there is no `--font-noto-mono`. The literal strings `"Noto Sans Mono"` are CSS family names, so they match only if the user's OS already has that family — otherwise they're skipped. `scroll-padding-top` simply offsets in-page anchor scrolls; on login (no anchors, no sticky header) it has no visible effect.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (no collision; tokens are additive): `git diff …globals.css` only touches `--shadow-elev` (both themes), the `.dark` semantic/severity hexes, `--font-mono`, and adds `scroll-padding-top` + the `phase-pulse` keyframe. It does NOT touch `--grid-size`/`--grid-dot-rgb`/`--grid-line-rgb`/`--grid-dot-idle`. `grep -n "\-\-grid" app/globals.css` → those live at **globals.css:39-42, 78-80, 175-176**, untouched by the diff. No collision with the Latticly marketing grid.
- PREFLIGHT (shadow propagates correctly): `--shadow-elev` is read by `.glass`/`.feature-card`/`.step-card` (globals.css:200/228/254) AND now by `<Card>` (item 4) — the new flatter value `0 2px 8px` (light) / `0 2px 10px` (dark) restyles all of them uniformly, which is the intent.
- PREFLIGHT (fonts not loaded): `grep -n "Noto.*Mono\|font-deva" app/layout.tsx` → only `variable: "--font-deva"` at **layout.tsx:10**; no `Noto Sans Mono` import. So the mono fallbacks are OS-dependent strings, not bundled fonts.
- PREFLIGHT (scroll-padding consumers): `git diff … | grep phase-pulse|scroll-padding` → `.phase-pulse` is consumed in processing-view (`sentinx-web/.../processing` span `className="phase-pulse …"`, diff line 1507) and `scroll-padding-top` benefits the run screens' sticky TopBar — neither is exercised by login. DOC: the diff's own comment cites "WCAG 2.2 2.4.11 Focus Not Obscured … sticky TopBar (h-13 ≈ 52px)"; `spec/login.md:156` confirms it's N/A on login.

**4. What should happen?**
Apply the globals.css diff as-is (tokens, shadow, scroll-padding, phase-pulse) — it's clean. OPTIONAL hardening: if real mono coverage of Devanagari/precise glyphs is desired, actually load `Noto_Sans_Mono` via `next/font/google` in `layout.tsx` and assign `--font-noto-mono`, then reference that variable in `--font-mono`; otherwise drop the two `"Noto…"` strings to avoid implying a font that isn't shipped. File: `app/globals.css` (and `app/layout.tsx` only if you choose to actually load the font).

**5. Error messages / logs / traces**
none (static/structural — `node_modules` (tailwind/typescript/lucide) is not installed in mainsync, so no live PostCSS/build output was obtainable).

**6. Additional info**
Ordering: the `--shadow-elev` value change (item 5) must land for the `<Card>` elevation (item 4) to look right — they are one visual system. NAMING: globals.css comments reference engine/spec internals; no user-facing strings. The diff's `--shadow-elev` comment says "the ONE elevation (spec §a.1)" — internal, fine. No "Sentinx"/"AutoSentinx" string in this file to flag.

**Phase 2 DoD:** build + lint green; `--grid-*` untouched; `.phase-pulse` keyframe added (consumed in Phase 5). **Phase 3 DoD:** build + lint green; `/login` h1 reads "Sign in to **Sentinx**"; real `await login()` preserved; `aria-invalid` retained on password; `grep -rn "AutoSentinx" app/login` returns nothing (user-facing surface).

---

### Phase 4 — Run-config (`app/new/page.tsx`) hardening (TWEAK, highest adaptation) — wire to real API

The verified Phase 4–5 analysis follows verbatim.

Confirmed: MAIN's `ui.tsx` has NO `Textarea` export and the `Input` does NOT forward a ref (`tokenRef` in the diff would fail). Both are blockers if the diff is applied as-is. I have everything I need. Let me also verify the diff's `ConnectionStatus`/`isValidUrl` use a standalone fetch (not `startScan`), which I already saw, and confirm the budget literal one more time.

I now have all preflight evidence. Writing the section.

---

#### Item P4-1 — Approve routes to a hardcoded `ER-01`, not the real `run_id` from `startScan`

**1. What's wrong?**
Our diff's `approveRun()` navigates to `/runs/${PENDING_RUN_REF}/processing` where `PENDING_RUN_REF = "ER-01"` is a hardcoded constant, and it never calls the backend at all (a `setTimeout(700)` stands in for approve). MAIN already wires the real flow: `startScan({endpoint, agentName})` returns a real `run_id`, which `approveScan(runId)` approves before routing to `/runs/${runId}/processing`.

**2. What it actually impacts, and how**
Wrong verdict / broken golden path. If our diff is applied verbatim, every approved run navigates to `/runs/ER-01/processing`, so the processing page calls `useRun("ER-01")` → `getRun("ER-01")` → `GET /api/console/runs/ER-01`, which 404s for any real run. The operator watches a dead/erroring screen instead of their actual run. The task is explicit: the dialog must be "wired to the REAL run_id from startScan (NOT a hardcoded ER-01)."

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on the diff: `git -C /Users/sangramsabat/autosentinx show 4a567ab:sentinx-web/app/new/page.tsx | grep -n "PENDING_RUN_REF\|startScan"` → literal result: `10:const PENDING_RUN_REF = "ER-01";` and `138: router.push(\`/runs/${PENDING_RUN_REF}/processing\`);` — and **no** match for `startScan`. The diff's `approveRun` is `await new Promise(resolve => setTimeout(resolve, 700))` (diff body, the `approveRun()` function).
- Preflight on MAIN: `grep -n "startScan\|approveScan\|runId\|run_id" app/new/page.tsx` → `29: const { run_id } = await startScan({ endpoint, agentName: agent });`, `30: setRunId(run_id);`, `42: await approveScan(runId);`, `43: router.push(\`/runs/${runId}/processing\`);` (MAIN `sentinx-web/app/new/page.tsx:29-43`).
- Doc: `conformance-triage.md:41` (row 13) — "substitute the real `run_id` for the pending ref." `api-contract.md:75-76` defines `startScan → {run_id}` and `approveScan(runId) → POST /api/runs/<id>/approve`.

**4. What should happen?**
In MAIN's `app/new/page.tsx`: keep MAIN's `startScan`/`approveScan` wiring and `const [runId, setRunId]`. Re-apply our focus-trapped `ApproveRunDialog` but feed it the real `runId`: dialog "Run ref" Row shows `runId` (not `ER-01 (pending)`), `onApprove` calls `await approveScan(runId)` then `router.push(\`/runs/${runId}/processing\`)`. Delete `PENDING_RUN_REF` and the `setTimeout` stub. `OPERATOR_EMAIL` should not be hardcoded either (see Item P4-7).

**5. Error messages / logs / traces**
none (static/structural) — but the runtime consequence is a `GET /api/console/runs/ER-01` 404 surfacing as `useRun`'s `error` ("Could not load run: …") on the processing screen.

**6. Additional info**
Ordering: this is the core of Phase 4's "real `run_id` wiring" and depends on Phase 3 shipping first. `approveScan` currently returns `void` (`lib/api.ts:45-47`) — see Item P4-4 for surfacing its `.detail`.

---

#### Item P4-2 — `import { … Textarea } from "@/components/ui"` will not compile (Textarea does not exist in MAIN)

**1. What's wrong?**
Our diff's `new/page.tsx` imports `Textarea` from `@/components/ui` and renders `<Textarea …>` for the Notes / Rules-of-Engagement field, but MAIN's `components/ui.tsx` exports no `Textarea`. It also passes `ref={tokenRef}` to `<Input>`, but MAIN's `Input` is a plain function component that does not forward a ref.

**2. What it actually impacts, and how**
Build break. `import { Textarea }` from a module that doesn't export it is a TypeScript/Next compile error (`Module '"@/components/ui"' has no exported member 'Textarea'`), failing `npm run build`. Separately, `ref={tokenRef}` on a non-`forwardRef` function component is a React/TS error and the `tokenRef.current?.focus()` auth-401 focus move would silently no-op at best.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN ui exports: `grep -n "export function" components/ui.tsx` → `Button` (4), `Card` (25), `SectionLabel` (34), `Field` (42), `Input` (62), `Mono` (75), `Divider` (79) — **no `Textarea`**. Read of `sentinx-web/components/ui.tsx:62-73` shows `Input` is `export function Input({ className, ...props })` — a plain component, no `React.forwardRef`.
- Preflight on diff: `git -C /Users/sangramsabat/autosentinx show 4a567ab:sentinx-web/app/new/page.tsx | grep -n "Textarea\|ref={tokenRef}"` → `7:import { Button, Card, Field, Input, Textarea } from "@/components/ui";` and `239: <Textarea`; the bearer `<Input ref={tokenRef} …>` is in the Advanced panel.
- Doc: `conformance-triage.md:36` (row 9) lists "`Textarea`" as part of our `ui.tsx` rewrite — confirming `Textarea` is supposed to be **added** to `ui.tsx`, and that this is a "global control change." Phase ordering makes Phase 3 (`ui.tsx`'s `Textarea`) a hard "**prerequisite** for Phase 4's Notes field."

**4. What should happen?**
Add `Textarea` to MAIN's `components/ui.tsx` (Phase 3), and convert `Input` to `React.forwardRef<HTMLInputElement, …>` so `ref={tokenRef}` works. Only then re-apply Phase 4's `new/page.tsx`. Alternatively, if Phase 3 is deferred, do NOT apply the `Textarea` import/usage — but the spec wants the multi-line Notes/RoE field (`04-uiux-plan.md:83`), so adding `Textarea` is the correct path.

**5. Error messages / logs / traces**
none captured (static) — predicted: `error TS2305: Module '"@/components/ui"' has no exported member 'Textarea'.` and a forwardRef type error on `<Input ref=…>`.

**6. Additional info**
Hard dependency on Phase 3. Note `ui.tsx` is global — `conformance-triage.md:36` warns to confirm `.btn-cta` marketing buttons are untouched.

---

#### Item P4-3 — "Endpoint reachable" UI theater (contract gap #1) — re-applying our `ConnectionStatus` re-asserts an unverified success

**1. What's wrong?**
MAIN still asserts `Endpoint reachable — audit pending approval` and `Connecting…` even though the operator's `endpoint` is never sent to the backend (`/scan` targets a hard-wired AARAV sandbox). Our diff "fixes" this with a real `checkEndpoint` fetch + a `reachable` branch that prints "Target reachable. Verified agent endpoint." — but that probes an arbitrary URL the engine will never actually scan, so it's a *different* flavor of the same theater: a green "verified" check that has zero bearing on what gets audited.

**2. What it actually impacts, and how**
Honesty/trust defect (the product's headline value is scope-honesty). The operator believes their endpoint was reached and will be audited; in reality `startScan` serializes only `strategy=ucb&budget=N` and the run hits the sandbox. A skeptical buyer who inspects the network tab sees the form input go nowhere.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN: `grep -n "reachable\|Connecting" app/new/page.tsx` → `95: …Loader2…/> Connecting…` and `110: Endpoint reachable — audit pending approval` (MAIN `app/new/page.tsx:95,110`).
- Preflight on `lib/api.ts`: Read `sentinx-web/lib/api.ts:39-43` → `startScan` builds `new URLSearchParams({ strategy: "ucb", budget: String(cfg.budget ?? 6) })` — `endpoint`/`agentName` from `ScanConfig` are accepted but **never serialized**.
- Doc: contract gap #1 (HIGH) — "'Endpoint reachable' copy asserted with no real check → operator input has **zero** backend effect… make the copy honest… stop asserting an unverified reachability success. Don't silently keep theater." R4 — "Porting Phase 4 copy verbatim re-introduces the 'Endpoint reachable' false assertion." `DECISIONS.md:24` (D-Q14) — vision-forward field where "error/timeout states carry the honesty load."

**4. What should happen?**
In MAIN's `app/new/page.tsx`: (a) remove the bare "Endpoint reachable — audit pending approval" assertion; (b) when re-applying our `ConnectionStatus`, soften the `reachable` copy from "Verified agent endpoint" to a non-asserting form, and add an honest note that the configured target is fixed in this build (e.g. scope line states the engine runs against the sandbox). The connection check may remain as a URL-shape/host probe, but copy must not imply the probed endpoint is what gets audited. Per `conformance-triage.md:38` (row 10), the precheck should *precede* `startScan`, with `reachable → startScan`.

**5. Error messages / logs / traces**
none (static/honesty).

**6. Additional info**
NAMING: any new sub-note copy here is user-facing → "Sentinx" (see Item P4-6). BE fix (add `endpoint`/`agent` to `/scan`) is deferred.

---

#### Item P4-4 — Approve-error region must surface backend `.detail` (contract gap #8); our diff swallows it

**1. What's wrong?**
Our diff's `approveRun` catch sets a generic `{ kind: "error" }` and renders fixed copy ("Could not start the run. Retry, or go back…"). MAIN's `approveScan` (`lib/api.ts:45-47`) calls `req()` which throws an `Error` whose message is the backend's `.detail` (404 "run not found" / 409 "not pending_approval"), but our dialog never reads that message — it's discarded.

**2. What it actually impacts, and how**
Wrong/opaque error message. A 409 (run already running / not pending) or 404 shows the same generic line, so the operator can't tell "already approved" from "transient failure," and can't act correctly. The task requires "in-dialog aria-live approve-error surfacing backend `.detail` (contract gap #8)."

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on `lib/api.ts`: Read `sentinx-web/lib/api.ts:6-18` → `req` does `detail = (await r.json()).detail ?? detail; … throw new Error(detail);`. Line 45-47: `approveScan` = `await req(...)` returns `void` and propagates that Error.
- Preflight on diff: the diff's `ApproveState` is `{ kind: "idle" | "approving" | "error" }` with no message field, and the rendered error is a hardcoded string (diff `ApproveRunDialog`, the `approve.kind === "error"` block).
- Doc: contract gap #8 (LOW) — "`approveScan` ignores response body → backend 404/409 detail is swallowed behind generic 'Approval failed'… Surface backend `.detail` from `approveScan` failures in the approve-error region (pairs naturally with Phase 4's in-dialog aria-live error)."

**4. What should happen?**
Change `ApproveState` to carry the message: `{ kind: "error"; detail: string }`. In `approveRun`, `catch (e) { setApprove({ kind: "error", detail: e instanceof Error ? e.message : "Could not start the run." }) }`. Render `{approve.detail}` inside the existing `aria-live="polite"` wrapper in the dialog. Keep the wrapper our diff already added. File: MAIN `app/new/page.tsx`.

**5. Error messages / logs / traces**
Backend shapes to surface (per `api-contract.md:35`, row 7): `409 {"detail": "...not pending_approval"}`, `404 {"detail": "run not found"}`.

**6. Additional info**
The in-dialog `aria-live="polite" aria-atomic="true"` wrapper our diff added is correct and should be kept; only the content source needs to change from static to `.detail`.

---

#### Item P4-5 — Budget 6-vs-40 drift (contract gap #3): set it explicitly and state it in copy

**1. What's wrong?**
`lib/api.ts startScan` defaults `budget` to `6`; the call site in `new/page.tsx` passes no budget, so `6` is always sent. The backend `/scan` default is `40` (never reached). The `/new` copy ("one evaluation run" / "Will run … one evaluation run") maps to neither number. Our diff doesn't touch the budget at all.

**2. What it actually impacts, and how**
Silent contract drift + misleading copy. The number of plays is an undocumented `6` while the contract doc says backend default `40`; the operator's on-screen "one evaluation run" is unverifiable. Not user-fatal, but it's an unstated, un-owned value the task explicitly asks to "set explicit + state it."

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on `lib/api.ts`: Read `:40` → `const q = new URLSearchParams({ strategy: "ucb", budget: String(cfg.budget ?? 6) });`. Call site MAIN `app/new/page.tsx:29` → `startScan({ endpoint, agentName: agent })` (no `budget`).
- Doc: contract gap #3 (MED) — "FE always sends `6` so BE default never applies; on-screen copy ('one evaluation run') maps to neither… Pick one intended budget, set it explicitly in `lib/api.ts`, and make the `/new` copy state it. Note the resolved value in `api-contract.md`. No BE change." `api-contract.md:34,75` records `budget=40` (backend) and `budget=<n||6>` (FE) — the drift.

**4. What should happen?**
Decide one budget (the doc leaves the value to product; `6` is the de-facto demo value). Set it explicitly at the call site in `app/new/page.tsx` (`startScan({ endpoint, agentName: agent, budget: 6 })`) or as an explicit named constant in `lib/api.ts` rather than a silent `?? 6`. Update the `/new` scope line to state the play count instead of vague "one evaluation run," and record the resolved value in `api-contract.md:34/75`.

**5. Error messages / logs / traces**
none (static/contract).

**6. Additional info**
Docs-coupled: this is "FE + docs", no backend change. Pairs with the honest-copy work in Item P4-3 (same scope line).

---

#### Item P4-6 — NAMING: reconcile MAIN's "AutoSentinx" run-config strings vs our new "Sentinx" copy

**1. What's wrong?**
MAIN's `new/page.tsx` user-facing copy reads "AutoSentinx" twice. Our diff's re-authored user-facing copy reads "Sentinx" (sub-line "Point Sentinx at a voice agent endpoint…", "Sentinx requires human approval…", footer "Sentinx red-team console."). Per the naming rule, user-facing strings must be "Sentinx" and engine/backend = "AutoSentinx" — so MAIN's two strings are the wrong brand for user-facing copy, and a naive merge could leave both spellings.

**2. What it actually impacts, and how**
User-visible brand inconsistency. The audit console UI should present as "Sentinx" to the operator; "AutoSentinx" is the engine/repo name and should not appear in product chrome. If unreconciled, the run-config screen shows mixed branding.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN: `grep -rn "Sentinx\|AutoSentinx" app/new/page.tsx` → `58: Point AutoSentinx at a target voice agent…` and `114: AutoSentinx requires human approval…` (MAIN `app/new/page.tsx:58,114`).
- Preflight on diff: the diff replaces those with "Point Sentinx at a voice agent endpoint…" and "Sentinx runs one evaluation run…" / footer "Sentinx red-team console." (diff `new/page.tsx` body).
- Doc/rule: THE NAMING RULE — user-facing = "Sentinx", engine/repo/backend = "AutoSentinx." `conformance-triage.md:41` (row 13) — "reconcile 'Sentinx' → 'AutoSentinx' rebrand in any new strings" — note this row's phrasing predates the corrected rule; the **governing rule is user-facing → Sentinx**. R2 — "`grep -rn 'Sentinx' app components` must return only intended strings before each commit."

**4. What should happen?**
In MAIN `app/new/page.tsx`, the two user-facing strings should read "Sentinx" (operator-facing console copy), matching our diff. Run the R2 grep guard before commit to ensure each surface carries the correct brand. Caveat: this contradicts a literal reading of `conformance-triage.md:41` ("Sentinx → AutoSentinx") — flag for product: the governing instruction is "all new copy user-facing → 'Sentinx'", which I follow; reconcile the triage doc note accordingly.

**5. Error messages / logs / traces**
none (static/naming).

**6. Additional info**
This is a place to flag a string that "must read one or the other": the run-config sub-line and footer are user-facing → "Sentinx." Any reference to the grading engine/judge stays "AutoSentinx."

---

#### Item P4-7 — `OPERATOR_EMAIL` hardcoded to a personal address in the Approve dialog

**1. What's wrong?**
Our diff hardcodes `const OPERATOR_EMAIL = "akhil18.mittal@gmail.com";` and renders it as the "Authorised" RoE row. MAIN has real JWT auth (the logged-in identity lives server-side in the `sx_jwt` cookie), so a baked-in personal Gmail is both wrong and leaky.

**2. What it actually impacts, and how**
User-visible incorrect data + privacy/credibility issue. The "Authorised: …" governance row claims a specific operator regardless of who is actually signed in; for a security/compliance audit console that asserts "Approval is logged to the audit trail," a hardcoded mismatched identity is a real defect.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on diff: `git -C /Users/sangramsabat/autosentinx show 4a567ab:sentinx-web/app/new/page.tsx | grep -n OPERATOR_EMAIL` → `9:const OPERATOR_EMAIL = "akhil18.mittal@gmail.com";` and the dialog `<Row k="Authorised" v={OPERATOR_EMAIL} mono />`.
- Preflight on MAIN auth: `api-contract.md:15-19` — BFF stores JWT in httpOnly cookie `sx_jwt`; `/auth/me` (`api-contract.md:32`, route #4) returns `{email}` but is marked "**No**" (unconsumed by FE). So the email isn't currently fetched client-side.
- Doc: `api-contract.md:35` (route #7) — approve defaults `approver=operator`; the displayed "Authorised" should reflect the real session identity, not a literal.

**4. What should happen?**
Remove the hardcoded constant. Either drop the "Authorised" row, or derive it from the session — e.g. wire `/auth/me` (route #4) through the BFF/`lib/api.ts` and pass the real email, or pass the email already known at login down to the page. File: MAIN `app/new/page.tsx` (+ optional `lib/api.ts` `me()`).

Concrete (pickup-able) — add to `lib/api.ts`:
```ts
export async function me(): Promise<{ email: string }> {
  return req("/api/auth/me");   // BFF proxies → backend GET /auth/me (route #4); no new proxy route needed
}
```
then in `app/new/page.tsx` replace `OPERATOR_EMAIL` with the value resolved from `me()` (or the email already captured at login). `/auth/me` returns `{email, created_at}` (api-contract.md #4) and is auth-gated, so it rides the existing `[...path]` BFF with the `sx_jwt` cookie attached automatically.

**5. Error messages / logs / traces**
none (static).

**6. Additional info**
Note this address matches the `# userEmail` context, but that's the *grader's* email, not a guaranteed runtime operator — it must not be compiled into product copy.

---

### Phase 5 — Processing (`components/processing-view.tsx`) (TWEAK, adapt to poll data)

#### Item P5-1 — Drop the poll-vs-timer model; MAIN already polls via `useRun` (gap #14, TRASH)

**1. What's wrong?**
Our diff's `processing-view.tsx` is the old mock/timer model: it reads `MOCK_RUN`, drives progress from a client `setTimeout`/`elapsed` timer, and sets `IS_REPLAY = true`. MAIN's `ProcessingView` already uses `useRun(runId, 1800)` real polling against `/console/runs/{id}` and derives `done`/`total`/`feed` from `run.playsDone`/`run.playsTotal`/`run.observations`. The diff's timer model must NOT be re-applied.

**2. What it actually impacts, and how**
Regression to fake progress if ported. Re-applying the diff would replace live polling with a fabricated client timer over `MOCK_RUN` — the exact "scan feels like theatre" failure the design forbids, and it would ignore the real run's status. The task: "MAIN already polls via useRun — DROP our poll-vs-timer."

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN: `grep -n "useRun\|MOCK_RUN\|setInterval" components/processing-view.tsx` → `15: const { run, error } = useRun(runId, 1800);` and the only interval is the elapsed clock (`:20`). No `MOCK_RUN`. Read MAIN `:33-36` confirms `total/done/feed/phaseIdx` come from `run`.
- Preflight on diff: `git -C /Users/sangramsabat/autosentinx show 4a567ab:sentinx-web/components/processing-view.tsx | grep -n "MOCK_RUN\|IS_REPLAY\|setTimeout"` → `MOCK_RUN` import + `const run = MOCK_RUN;` + `const IS_REPLAY = true;`.
- Doc: `conformance-triage.md:43` (row 14, **TRASH**) — "Superseded: main's `ProcessingView` now uses `useRun(runId, 1800)` real polling… Our timer-based replay model is replaced." Phase 5 — "Processing poll-vs-timer (#14) — superseded."

**4. What should happen?**
Keep MAIN's `useRun`-driven `processing-view.tsx`. Re-apply ONLY the presentation/a11y additions (Items P5-2…P5-5) on top of `run.observations`/`run.status`/`run.playsDone`, never the `MOCK_RUN`/timer/`IS_REPLAY` scaffolding. File: MAIN `components/processing-view.tsx`.

**5. Error messages / logs / traces**
none (structural).

**6. Additional info**
Ordering: Phase 5 depends on Phase 1 (`outcome.ts` shapes) and Phase 2 (`.phase-pulse` keyframes).

---

#### Item P5-2 — Re-apply RunStatusLog activity log + aria-live + phase announcer, driven by `run`, not a timer

**1. What's wrong?**
MAIN's `processing-view.tsx` lacks the activity-log region, the `aria-live` on the feed, and the visually-hidden phase/status announcer. Our diff adds all three, but builds the log from the timer-derived `done`/`revealed`/`IS_REPLAY`. The additions are wanted; their data source must switch to `run.observations`/`run.status`/`run.playsDone`.

**2. What it actually impacts, and how**
Accessibility gap (screen-reader users get no announced progress and no append-only log) and a missing "scan feels real" surface. Mechanism: without `role="status"`/`aria-live`, SR users hear nothing as plays complete; without the log, sighted users lack the engine-stage narrative the design mandates.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN: `grep -n "aria-live\|Activity log\|role=\"status\"\|phase-pulse" components/processing-view.tsx` → **no matches** (confirmed none present).
- Preflight on diff: the diff adds `const log: string[] = [...]`, an `Activity log` block with `aria-live="polite"`, feed `aria-live="polite"`, and a trailing `<p role="status" aria-live="polite" className="sr-only">{announce}</p>`.
- Doc: `conformance-triage.md:44` (row 15, **TWEAK**) — "Re-apply our additions on top of the `useRun` data instead of `MOCK_RUN`/timer — e.g. drive the log/feed/counts from `run.observations` + `run.status`/`playsDone`." `04-uiux-plan.md:109` — "guaranteed lines map to real engine stages; conditional lines (`Play N/M`, ETA, provisional findings) appear only when the engine streams a known total… else they are simply absent (not faked)." `03-mapping.md:10` (M2) — live activity log reflecting real stages.

**4. What should happen?**
In MAIN `components/processing-view.tsx`: re-add the activity-log well (mono, append-only, newest-at-bottom, auto-scroll), the feed `aria-live`, and the `sr-only role="status"` announcer — but compute `log`/`announce` from `run` (e.g. iterate `run.observations` for candidate-finding lines, gate `Play N / M` on a real known `run.playsTotal`, and base the announcer on `run.status` + `playsDone`/`playsTotal`). Also handle MAIN's `error` state (currently rendered at `:94`) inside these regions.

**5. Error messages / logs / traces**
none (a11y/structural).

**6. Additional info**
The "Play N / M" line must only render when `run.playsTotal` is truly known (`04-uiux-plan.md:109`); do NOT gate it on `IS_REPLAY` (which is being removed — Item P5-4).

---

#### Item P5-3 — Replace `Loader2` spinner with the quiet `.phase-pulse`; depends on the keyframes existing in MAIN

**1. What's wrong?**
MAIN's active-phase node renders `<Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />`. Our diff swaps it for `<span className="phase-pulse h-2 w-2 rounded-full bg-brand" aria-hidden />` (a ≤1-cycle/2s pulse that degrades under reduced motion). But MAIN's `globals.css` has NO `.phase-pulse` keyframes — so applying the swap without Phase 2 leaves the pulse inert.

**2. What it actually impacts, and how**
"Calm vigilance, not a spinner" design intent + a latent no-op. If the JSX swap is applied but the CSS isn't, the dot renders static (no animation) — not fatal, but the intended motion is missing. The task: "replace Loader2 spinner with quiet pulse, driven by run.observations/status NOT a timer."

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN CSS: `grep -n "phase-pulse\|scroll-padding\|scroll-behavior" app/globals.css` → only `133: html { scroll-behavior: smooth; }` and `384: scroll-behavior: auto !important;` — **no `phase-pulse`, no `scroll-padding-top`**.
- Preflight on MAIN component: `grep -n "Loader2\|animate-spin" components/processing-view.tsx` → `5: import { Loader2, … }`, `78: <Loader2 … animate-spin … />`.
- Preflight on diff CSS: diff `globals.css` adds `@keyframes phase-pulse { … }` + `.phase-pulse { animation: phase-pulse 2s ease-in-out infinite; }`.
- Doc: `conformance-triage.md:44` (row 15) — "replace spinner with quiet pulse"; `conformance-triage.md:60` (row 27) — "add `.phase-pulse` only if we re-do the processing pulse (#15)"; `04-uiux-plan.md:91,109` — instrument-grade, no fabricated steps.

**4. What should happen?**
(a) Add the `@keyframes phase-pulse` + `.phase-pulse` rule (and `scroll-padding-top: 3.5rem`) into MAIN's `app/globals.css` (Phase 2). (b) Then swap MAIN's `Loader2` active node for the `.phase-pulse` dot (`aria-hidden`), and drop the now-unused `Loader2` import. The active phase is selected by `run`-derived `phaseIdx`, not a timer (already the case in MAIN `:36`).

**5. Error messages / logs / traces**
none (visual/structural).

**6. Additional info**
Hard dependency: Phase 2. The diff's `.phase-pulse` auto-degrades under `prefers-reduced-motion` via MAIN's existing global reduced-motion rule (`globals.css:384` neutralizes animation duration).

---

#### Item P5-4 — `IS_REPLAY = true` / "Replay of run ER-01" label is now WRONG; use a live label

**1. What's wrong?**
Our diff hardcodes `IS_REPLAY = true` and renders a pill "Replay of run {run.id}" in the header. Against MAIN's live polling this is false — it's a live run, not a replay — and `run.id` would be the real id. MAIN currently shows `running · {runId.slice(0,8)}`.

**2. What it actually impacts, and how**
User-visible false statement. A live, in-progress audit would be labeled "Replay," directly contradicting the honesty mandate and confusing the operator/buyer about whether they're watching a real scan.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on diff: `git -C /Users/sangramsabat/autosentinx show 4a567ab:sentinx-web/components/processing-view.tsx | grep -n "IS_REPLAY\|Replay of run"` → `const IS_REPLAY = true;` and the pill `Replay of run {run.id}`.
- Preflight on MAIN: `grep -n "running ·\|Replay" components/processing-view.tsx` → `43: …running · {runId.slice(0, 8)}` (no "Replay").
- Doc: `conformance-triage.md:44` (row 15) — "The `IS_REPLAY = true` + 'Replay of run' framing is now **wrong** (it's live polling, not replay), so adapt to a live label." `04-uiux-plan.md:110` — replay is a distinct mode "labelled as a replay of run `ER-0x`"; live is the default here.

**4. What should happen?**
Remove `IS_REPLAY` and the "Replay of run" pill. Use a live label driven by `run.status` (e.g. a "running"/"live" pill or MAIN's `running · {runId.slice(0,8)}` styled as the bordered pill our diff introduced). Any "Play N / M" conditional (Item P5-2) must then gate on a real known total, not `IS_REPLAY`. File: MAIN `components/processing-view.tsx`.

**5. Error messages / logs / traces**
none (copy/honesty).

**6. Additional info**
NAMING: the pill is user-facing chrome; keep brand-neutral status text ("Live" / "Running"), and any brand word here is "Sentinx" not "AutoSentinx."

---

#### Item P5-5 — Add the poll-guard (contract gap #5): a non-approved run polls forever

**1. What's wrong?**
`run_summary` collapses `pending_approval` → `"running"`, and `useRun` stops only when `status !== "running"` (`use-run.ts:20`). A run that is created but never approved reports `"running"` with `playsDone=0` indefinitely, so the poller never terminates. Neither MAIN's `useRun`/`ProcessingView` nor our diff has any guard.

**2. What it actually impacts, and how**
Resource leak / hung UI. Mechanism: `setInterval(load, 1800)` (`use-run.ts:26`) keeps firing `GET /console/runs/{id}` forever; the processing screen sits at `0 / —` with a spinning/pulsing phase and never reaches `finished`, so it never routes to the report. Today it's latent because `new/page.tsx` calls `approveScan` immediately — but it's a real fragility the task asks to close in Phase 5.

**3. Why — proof, preflight checks, vs which doc/code**
- Preflight on MAIN: Read `lib/use-run.ts:20` → `if (pollMs > 0 && r.status !== "running" && timer) clearInterval(timer);` — the only stop condition is leaving `"running"`. No max-duration/stall guard. `processing-view.tsx:24` → `const finished = run != null && run.status !== "running";` — same single condition.
- Doc: contract gap #5 (MED) — "A created-but-never-approved run reports `"running"` forever with `playsDone=0` → poller never terminates… **FE (cheap, do with Phase 5):** add a poll guard — bounded max-duration / `playsDone===0` stall timeout / surface a 'awaiting approval or stalled' state instead of polling forever." R6 — "Without the guard, a non-approved run polls forever. Mitigation: land the FE poll-guard with Phase 5." `BACKEND-UPDATE-2.md:82` confirms the `pending_approval`→`"running"` collapse.

**4. What should happen?**
Add a guard, either in `lib/use-run.ts` (preferred, reusable) or in `ProcessingView`: a bounded max poll duration and/or a `playsDone === 0` stall timeout that clears the interval and surfaces an "awaiting approval / stalled" state instead of polling indefinitely. Keep the BE clean-fix (expose `pending_approval` distinctly) as a deferred ticket. Files: MAIN `lib/use-run.ts` and/or `components/processing-view.tsx`.

**5. Error messages / logs / traces**
none statically — runtime symptom is an unbounded series of `GET /api/console/runs/{id}` requests every 1800ms with `status:"running", playsDone:0`.

**6. Additional info**
BE-side clean fix deferred. This guard also defends Item P4-1's failure mode: if approve ever routes to a stuck/invalid run, the guard stops the hang instead of spinning forever.

**Phase 4 DoD:** build + lint green; real `run_id` from `startScan`/`approveScan` (no `ER-01`, no `OPERATOR_EMAIL` literal); `Textarea` + ref-forwarding `Input` present (Phase 3); honest endpoint copy; approve error shows `.detail`; explicit budget; `grep -rn "AutoSentinx" app/new` clean. **Phase 5 DoD:** build + lint green; no `MOCK_RUN`/`IS_REPLAY`/timer; log+announcer driven by `run`; `.phase-pulse` active; poll-guard lands; live label (no "Replay").

---

### Phase 6 — Evidence (`evidence.tsx`) + detail call sites (TWEAK, **BREAKING — atomic commit**)
### Phase 7 — Page-level gaps NOT in our diff: **re-do fresh, do not cherry-pick**
### DROP set (TRASH — do not port)

The verified Phase 6–7 + DROP analysis follows verbatim.

All confirmed: `Outcome` is exported (types.ts:8) and `Observation.outcome: Outcome` exists (types.ts:82), so the call-site fix `outcome={o.outcome}` is type-valid. I have everything needed. Writing the section now.

---

#### Item 1 — ATOMIC BREAKING UNIT: evidence.tsx required props vs. unchanged obs-page call sites (Phase 6)

**1. What's wrong?**
Our diff edits `components/evidence.tsx` to add **required** props — `outcome: Outcome` on `BypassSignal` and `verdictScore: number` on `FairnessComparison` — but the diff `6c0c5a9..4a567ab` **never touches** `app/runs/[id]/o/[obsId]/page.tsx`, the only place these two components are called. MAIN's call sites still pass neither prop, so applying our `evidence.tsx` to MAIN produces a TypeScript build break unless the call-site update ships in the *same* commit.

**2. What it actually impacts, and how**
Build break (hard fail, not user-visible degradation). Mechanism: `BypassSignal` and `FairnessComparison` now destructure required props with no default; the JSX call sites omit them, so `tsc`/`next build` reports `Property 'outcome' is missing` and `Property 'verdictScore' is missing`. The run-detail page (`/runs/[id]/o/[obsId]`) fails to compile, taking down the whole production build, not just that route.

**3. Why — proof, preflight checks, vs which doc/code**
- New required props in OUR diff: `git -C /Users/sangramsabat/autosentinx diff 6c0c5a9..4a567ab -- sentinx-web/components/evidence.tsx` →
  - `BypassSignal({ bypass, selfReports, outcome }: { bypass: boolean; selfReports: boolean; outcome: Outcome })` (non-optional `outcome`)
  - `FairnessComparison({ fairness, verdictScore }: { fairness: FairnessEvidence; verdictScore: number })` (non-optional `verdictScore`)
- MAIN call sites pass NEITHER — preflight `grep -rn "BypassSignal\|FairnessComparison" sentinx-web/app sentinx-web/components` in MAIN, literal result:
  - `sentinx-web/app/runs/[id]/o/[obsId]/page.tsx:64: <BypassSignal bypass={o.bypass} selfReports />`
  - `sentinx-web/app/runs/[id]/o/[obsId]/page.tsx:66: <FairnessComparison fairness={o.fairness} />`
- Diff does NOT update the page — preflight `git diff 6c0c5a9..4a567ab --name-only -- "sentinx-web/app/runs/[id]/page.tsx" "sentinx-web/app/runs/[id]/report/page.tsx"` and `--stat -- "sentinx-web/app/runs/**"` both returned **empty**; and `git show 6c0c5a9:.../o/[obsId]/page.tsx` returned **empty** (the obs page did not even exist at our diff base — it is purely MAIN's live rewrite).
- Type validity of the fix is confirmed: MAIN `lib/types.ts:8 export type Outcome = "FAIL" | "RISK" | "PASS";` and `lib/types.ts:82 outcome: Outcome; // derived` on `Observation`, so `outcome={o.outcome}` and `verdictScore={o.verdictScore}` are well-typed.
- Doc that names this exact break: `conformance-triage.md:49` and `:84` ("our `evidence.tsx` … added **required props** … Re-applying our `evidence.tsx` **breaks those call sites** until they're updated … in the same change, or the build breaks").

**4. What should happen?**
Ship as ONE atomic commit. In `sentinx-web/app/runs/[id]/o/[obsId]/page.tsx`, update the two call sites in lockstep with the `evidence.tsx` change:
- line 64 → `<BypassSignal bypass={o.bypass} selfReports outcome={o.outcome} />`
- line 66 → `<FairnessComparison fairness={o.fairness} verdictScore={o.verdictScore} />`
Do not land the `evidence.tsx` prop changes without these edits in the same commit.

**5. Error messages / logs / traces**
none (static/structural — projected `tsc` error: `Type '{ bypass: boolean; selfReports: true; }' is missing the following properties … : outcome` and the analogous `verdictScore` error). Not actually run because MAIN currently has the old `evidence.tsx`; the error materializes only after our diff is applied.

**6. Additional info**
- Dependency: requires MAIN's `lib/outcome.ts` `OUTCOME_META` to expose `{ label, fill, text }` — verified present at `sentinx-web/lib/outcome.ts:48-55` (`fill`, `text`, `label` all exist), so the new `om.fill`/`om.text`/`om.label` usage in our `evidence.tsx` is compatible.
- NAMING (load-bearing): the fallback string must read **"Sentinx panel: FAIL"** (user-facing). Our diff already produces `Sentinx panel: {om.label}` — this is CORRECT and matches the authoritative spec `spec/pdf-report.md:88,132` ("Sentinx panel: FAIL … never a faked clean"). MAIN's *current* fallback at `evidence.tsx:77` wrongly reads **"AutoSentinx judge verdict shown below."** — that is engine-name leakage into user-facing copy. Reconcile by adopting our "Sentinx panel: …" copy, not MAIN's "AutoSentinx judge". (Note: MAIN's `bypass && selfReports` branch at `evidence.tsx` also says "AutoSentinx's judge panel" — flag for the same Sentinx-facing reconciliation, though our diff does not rewrite that branch's prose.)

---

#### Item 2 — Phase 7 overview page is NET-NEW vs MAIN's live rewrite — re-do fresh, do not cherry-pick

**1. What's wrong?**
Our overview-page work (`app/runs/[id]/page.tsx`) targets a DOM/data model that no longer exists. MAIN fully rewrote this page onto the live backend (`useRun`, `useParams`, polling), and our diff never edited it — so there is no diff hunk to port. The Phase-7 overview gaps must be re-implemented against MAIN's new page, not cherry-picked.

**2. What it actually impacts, and how**
No build break, but a process trap: anyone attempting a `git apply`/cherry-pick of "the overview fixes" will find nothing applies (our diff has zero overview hunks), and naively pasting our old overview JSX would clobber MAIN's live `useRun` wiring and break data loading. Mechanism: the two trees diverged structurally — our base had no live overview page; MAIN's is a `"use client"` component reading from `lib/use-run.ts`.

**3. Why — proof, preflight checks, vs which doc/code**
- Diff does NOT modify the overview page — preflight `git -C /Users/sangramsabat/autosentinx diff 6c0c5a9..4a567ab --name-only -- "sentinx-web/app/runs/[id]/page.tsx"` returned **empty**; `git show 6c0c5a9:sentinx-web/app/runs/[id]/page.tsx` returned **empty** (no such file at our base).
- MAIN's page is a live rewrite — read `sentinx-web/app/runs/[id]/page.tsx:1-26`: `"use client"`, `useParams`, `const { run, error } = useRun(id)`, `RunTabs`, `TopBar`, `moduleScores/criticalRisks/summaryCounts(run)`. This is the live-data page, not our mock-era page.
- Doc: `conformance-triage.md:55` and `:84` classify the report/overview-style page work as "TRASH (as a diff) / re-do … We never edited the report page. Main rewrote it … These must be re-done against main's new … page, not ported from us."

**4. What should happen?**
Re-do the Phase-7 overview enhancements fresh ON TOP OF MAIN's current `sentinx-web/app/runs/[id]/page.tsx`, reading from `run` (the `useRun` result). Re-apply only the *content/copy/structure* deltas (e.g. the executive-summary `Stat` set, critical-risks block, zero-findings variant, provenance) as edits against the live component — do NOT replace the `useRun`/`useParams` data plumbing. Keep the single source of truth for outcomes (`lib/outcome.ts` + `lib/score.ts`).

**5. Error messages / logs / traces**
none (static/structural — empty `git apply` result for any cherry-pick attempt).

**6. Additional info**
- Ordering: do this AFTER Item 1's atomic evidence/call-site change lands, since the overview's critical-risk items link into the obs detail page.
- NAMING: any new user-facing string on this page = **"Sentinx"**. The page currently has none of the brand inline, so no leak today — but the RISK-band note (spec `findings.md:116,204`) and any "Sentinx panel"/"Sentinx red-team" prose you add must read **Sentinx**, never AutoSentinx.

---

#### Item 3 — Phase 7 report page is NET-NEW vs MAIN's live rewrite — re-do fresh, do not cherry-pick

**1. What's wrong?**
Same divergence as the overview: our report-page work targets a page MAIN fully rewrote onto `useRun`/live data, and our diff never edited `app/runs/[id]/report/page.tsx`. The Phase-7 report gaps (per-entry BypassSignal sentence, RegulationCite SME-source label, "Detected in/Reproduced", "Probe (Sentinx)" label, print page-breaks/running footer, zero-findings variant) must be re-implemented against MAIN's new report page.

**2. What it actually impacts, and how**
No build break (the report page imports `TranscriptTurn, JudgePanel, RegulationCite, DetectorHits` only — NOT `BypassSignal`/`FairnessComparison`, so Item 1's prop break does NOT reach it). The impact is process + correctness: a cherry-pick finds nothing to apply, and the report page carries **engine-name leakage** in user-facing prose that must be fixed during the fresh re-do.

**3. Why — proof, preflight checks, vs which doc/code**
- Diff does NOT modify the report page — preflight `git -C /Users/sangramsabat/autosentinx diff 6c0c5a9..4a567ab --name-only -- "sentinx-web/app/runs/[id]/report/page.tsx"` returned **empty**.
- MAIN's report page is a live rewrite — read `sentinx-web/app/runs/[id]/report/page.tsx:14-23`: `useParams`, `useRun(id)`, `criticalRisks(run, 50)`. It does NOT import `BypassSignal` (line 11 imports only `TranscriptTurn, JudgePanel, RegulationCite, DetectorHits`), confirming Item 1's break does not touch it.
- Engine-name leak in user-facing report copy — same file `:42` reads **"AutoSentinx ran {run.playsTotal} multi-turn Hinglish plays…"** and `:108` footer "© 2026 VipraTech Global · {run.engineVersion}".
- Doc: `conformance-triage.md:55` ("the report-page gaps … TRASH (as a diff) / re-do … We never edited the report page. Main rewrote it … must be re-done against main's new report page, not ported from us"). Spec for the per-entry/fallback bypass copy: `spec/pdf-report.md:88,132` ("Target self-reported clean · **Sentinx panel: FAIL**").

**4. What should happen?**
Re-do the Phase-7 report enhancements fresh against MAIN's `sentinx-web/app/runs/[id]/report/page.tsx`, editing the live component in place (keep `useRun`/`criticalRisks`). Add the per-entry BypassSignal sentence using the spec string ("Target self-reported clean · Sentinx panel: FAIL"), the SME-source RegulationCite label, "Detected in/Reproduced" lines, the "Probe (Sentinx)" transcript label, and the print page-break/running-footer CSS. Separately decide whether `:42`'s "AutoSentinx ran…" is intended engine-attribution or should read "Sentinx" (see naming note).

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
- The `@media print` improvements our team produced are ALSO not in our diff — preflight: `globals.css` print block is not part of the report-page hunks; treat print CSS as a fresh add against MAIN's `globals.css`.
- NAMING (load-bearing, must read one or the other): user-facing audit prose = **"Sentinx"**. The string "AutoSentinx ran…" at `:42` is the borderline case — since it is engine attribution inside the report body that the customer reads, default it to **"Sentinx"**; AutoSentinx is the engine/repo/backend name and should not surface in customer-facing report copy. Flag for an explicit decision.

---

#### Item 4 — DROP: all 5 landing fixes + `evidence-showcase.tsx` (moot — landing fully rewritten; component is dead code)

**1. What's wrong?**
The five landing conformance fixes (proof list, mono `SENTINX · THREAT-INTELLIGENCE CONSOLE` eyebrow, synthetic-data footer, minimal-bar sticky, EvidenceShowcase) target a landing DOM that no longer exists — MAIN rewrote `app/page.tsx` to the Latticly look with the AutoSentinx rebrand. Our net-new `components/evidence-showcase.tsx` would be imported by nothing and is therefore dead code.

**2. What it actually impacts, and how**
Dead code / wasted effort if applied. `evidence-showcase.tsx` imports `MOCK_RUN` from `lib/mock/run.ts` and renders a landing-only PL1 showcase; with the landing rewritten it has zero importers, so it never renders, never tree-shakes into a route, and just adds maintenance surface. The eyebrow/footer/minimal-bar fixes reference selectors and copy that MAIN's restyle deleted.

**3. Why — proof, preflight checks, vs which doc/code**
- `evidence-showcase.tsx` does not exist in MAIN and has no importers — preflight `ls sentinx-web/components/evidence-showcase.tsx` → **"No such file or directory"**; `grep -rn "evidence-showcase\|EvidenceShowcase" sentinx-web` → **empty** (zero importers). Our diff adds it as a *new file* (`git diff 6c0c5a9..4a567ab -- …/evidence-showcase.tsx` shows `new file mode 100644`, header "landing-plan §6 step 4 / P1").
- Landing fully rewritten with AutoSentinx + Latticly domain — preflight `grep -n "AutoSentinx\|Latticly\|NBFC\|borrower" sentinx-web/app/page.tsx`, literal hits: `:63 "Give AutoSentinx the voice agent's endpoint…"`, `:67 "AutoSentinx attacks"`, `:132 "AutoSentinx runs real multi-turn Hinglish attacks against your NBFC's voice collection…"`. The mono `SENTINX · THREAT-INTELLIGENCE CONSOLE` eyebrow that gap #2 wanted is gone.
- Doc: `conformance-triage.md:80` ("All landing fixes (#1–#5: proof list, mono eyebrow, synthetic-data footer, minimal-bar sticky, EvidenceShowcase) — main's landing was fully rewritten (Latticly look + AutoSentinx rebrand); our landing DOM no longer exists, and `evidence-showcase.tsx` would be dead code"); and `:28` (gap #2 eyebrow "TRASH … Superseded by the restyle + AutoSentinx rebrand").

**4. What should happen?**
DROP all five landing fixes and DROP `components/evidence-showcase.tsx` — do not create the file in MAIN, do not port the eyebrow/footer/minimal-bar/proof-list hunks. If the live-evidence-showcase capability is still desired product-wise, it would have to be re-designed against the new Latticly landing as a separate decision, not as a conformance "fix".

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
This is PL1 (marketing/landing) domain. NAMING caveat: the landing is the **deliberate exception** to the user-facing→Sentinx rule — MAIN's landing is intentionally **AutoSentinx** (engine-as-product on the marketing page). Porting our showcase's "SENTINX" eyebrow would reintroduce a brand conflict there — another reason to drop rather than reconcile.

---

#### Item 5 — DROP: login fake-auth removal (moot — MAIN already has real JWT auth)

**1. What's wrong?**
Our `app/login/page.tsx` diff *reintroduces* cosmetic fake-auth (`setTimeout(() => router.push("/new"), 700)`, comment "no auth exists, so the access code is never validated"). MAIN already replaced that with real authentication: `login()` from `lib/api` posting to `/api/auth/login`. Applying our login diff would be a regression, not a fix.

**2. What it actually impacts, and how**
If applied, it would DOWNGRADE security: it deletes the `await login(email, code)` call and its error handling, restoring an unauthenticated client-side redirect. Mechanism: our hunk replaces the real async submit with a `setTimeout` redirect and removes the password-length/credential check, so any email-shaped string would "log in".

**3. Why — proof, preflight checks, vs which doc/code**
- MAIN has real JWT login — read `sentinx-web/app/login/page.tsx:8` (`import { login } from "@/lib/api"`), `:27` (`await login(email, code); // logs in, or creates the account on first use`), `:29-33` (real catch/error path). And `sentinx-web/lib/api.ts:20-26`: `login()` POSTs to `/api/auth/login` with `{ email, password }` (JWT-backed BFF).
- Our diff reintroduces fake-auth — `git -C /Users/sangramsabat/autosentinx diff 6c0c5a9..4a567ab -- sentinx-web/app/login/page.tsx`: replaces the validation with `// Cosmetic gate: no auth exists, so the access code is never validated.` and `setTimeout(() => router.push("/new"), 700)`.
- Doc: `conformance-triage.md:4` ("New main … JWT auth (`app/api/auth/*` + `lib/api.login`)") confirms MAIN supersedes the demo login.

**4. What should happen?**
DROP the login fake-auth change entirely. Keep MAIN's `sentinx-web/app/login/page.tsx` real `login()` flow. If any of our login *copy* conformance strings are still wanted (e.g. footer "Sentinx — confidential. Authorized use only." per `conformance-gaps.md:124`), re-apply ONLY those copy edits onto MAIN's live login (handled in Phase 3) — never the `setTimeout`/no-auth logic.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
NAMING (load-bearing): MAIN's login heading at `page.tsx:44` reads **"Sign in to AutoSentinx"** — that is user-facing and should read **"Sign in to Sentinx"** (Sentinx = user-facing brand; AutoSentinx = engine). This is a separate, still-valid copy gap to apply onto MAIN's live login (Phase 3, item 1) — distinct from the fake-auth change being dropped.

---

#### Item 6 — DROP: poll-vs-timer fix (moot — MAIN already polls)

**1. What's wrong?**
Any "replace the fake setTimeout progress with real polling" fix is already done in MAIN. The processing flow polls the live backend via `useRun(runId, 1800)` and auto-redirects when status leaves "running". There is nothing to convert.

**2. What it actually impacts, and how**
Moot. Applying a timer→poll change would conflict with MAIN's existing poll loop (double-polling or clobbering the redirect). No user-visible improvement remains to be made here.

**3. Why — proof, preflight checks, vs which doc/code**
- MAIN already polls in `use-run.ts` — read `sentinx-web/lib/use-run.ts:7-31`: `useRun(id, pollMs = 0)`, `if (pollMs > 0) timer = setInterval(load, pollMs)`, `clearInterval` once `r.status !== "running"`.
- Processing screen uses it live — preflight `grep -n "useRun\|setInterval\|router.push\|status" sentinx-web/components/processing-view.tsx`, literal hits: `:15 const { run, error } = useRun(runId, 1800); // poll until status leaves "running"`, `:24 const finished = run != null && run.status !== "running"`, `:28 setTimeout(() => router.push(\`/runs/${runId}\`), 1100)` (cosmetic 1.1s settle before redirect, not a fake progress timer). The route shell `app/runs/[id]/processing/page.tsx:3-5` just `await params` and renders `<ProcessingView />`.
- Doc: `conformance-triage.md:4` ("real-data run pages (`lib/use-run.ts` polling)").

**4. What should happen?**
DROP the poll-vs-timer fix. Leave MAIN's `lib/use-run.ts` + `components/processing-view.tsx` polling untouched. (Phase 5 adds the *poll-guard* on top — that is distinct from the timer→poll swap and is still wanted.)

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
The only residual `setTimeout` in MAIN's processing-view (`:28`) is a deliberate 1100 ms post-completion settle before redirect — not a progress simulation — so it is not the "fake timer" our fix targeted. No naming impact.

---

#### Item 7 — DROP: `lib/mock/run.ts` wiring (moot — dead in MAIN; only `evidence-showcase` would have used it)

**1. What's wrong?**
Our `lib/mock/run.ts` change rewires authored observations through `deriveOutcome` (renames `observations`→`authored`, maps outcomes). But MAIN's app reads live data via `lib/api.ts`/`lib/use-run.ts`; the only thing that imports `MOCK_RUN` in our diff is the dropped `evidence-showcase.tsx`. So this wiring is dead code in MAIN.

**2. What it actually impacts, and how**
Dead code if applied. The pages (overview, findings, report, obs, processing) all source from `useRun`/`lib/api.ts`, not `MOCK_RUN`. With `evidence-showcase.tsx` dropped (Item 4), nothing imports `MOCK_RUN`, so the `deriveOutcome` rewiring exercises nothing at runtime and adds an unused dependency edge.

**3. Why — proof, preflight checks, vs which doc/code**
- No live importer of mock in MAIN — preflight `grep -rn "mock/run\|from \"@/lib/mock" sentinx-web/app sentinx-web/components sentinx-web/lib` → **empty** (zero importers in MAIN's live tree). `lib/mock/run.ts` exists (`ls sentinx-web/lib/mock/` → `run.ts`) but is orphaned.
- MAIN sources live data — `sentinx-web/lib/api.ts:1-4` ("Live adapter — same-origin calls to the BFF … Maps the backend console view-model into the `Run` type and fills the UI-derived `outcome`") and uses `deriveOutcome` itself (`api.ts:55-60` `withOutcomes`). So the single-source-of-truth-for-outcomes goal our mock change wanted is ALREADY satisfied on the live path.
- Our diff's mock change — `git -C /Users/sangramsabat/autosentinx diff 6c0c5a9..4a567ab -- sentinx-web/lib/mock/run.ts`: adds `import { deriveOutcome }`, renames to `authored`, maps `observations` through `deriveOutcome(...)`. Its only consumer is `evidence-showcase.tsx` (`import { MOCK_RUN } from "@/lib/mock/run"` in that new file).

**4. What should happen?**
DROP the `lib/mock/run.ts` wiring change. Do not apply it to MAIN. The live `deriveOutcome` single-source is already enforced in `lib/api.ts:withOutcomes`; the mock rewiring is unnecessary and, with `evidence-showcase` dropped, would be unreachable.

**5. Error messages / logs / traces**
none (static/structural).

**6. Additional info**
Ordering/dependency: Item 7 and Item 4 are coupled — `evidence-showcase.tsx` is the sole `MOCK_RUN` consumer in our diff, so dropping it (Item 4) is what makes this mock wiring dead. If MAIN still ships `lib/mock/run.ts` for tests/fixtures, leave the file as-is; just don't apply our `deriveOutcome` rewiring. No naming impact (mock data is not user-facing).

**Phase 6 DoD:** build + lint green (the atomic unit is exactly what un-breaks it); `evidence.tsx` + `o/[obsId]/page.tsx:64,66` in ONE commit; fallback reads "Sentinx panel: …" (no "AutoSentinx judge"). **Phase 7 DoD:** build + lint green; implemented as fresh edits on MAIN's live `useRun` pages (no cherry-pick); report body brand reconciled to "Sentinx"; print CSS added.

---

## (b) API contract state + FE↔BE gaps to close (and who changes what)

The verified API-contract section follows verbatim.

> **Severities and owners in this section are canonical with `api-contract.md` → "Severity & owner matrix".** Gap **#N** here = finding **F⟨N⟩** there. If you change a severity, change it in both.
>
> **Paths:** repo-relative paths (e.g. `sentinx-web/lib/api.ts`, `app.py`) are anchored to `origin/main @ eabb173`. The `git -C /Users/...` lines below are **the preflight evidence actually run against the local diff clone** (base `6c0c5a9` → branch `4a567ab`) — they record *what was verified*, not commands a reviewer must re-run.

All preflight checks complete and confirmed. The api-contract.md is untracked (`?? "design documentation/api-contract.md"`, `error: pathspec ... did not match`). MAIN's `new/page.tsx` calls real `startScan({ endpoint, agentName: agent })`, confirming gaps #1/#2. Here is my section.

---

#### Item — Preamble: NO API contract existed before; commit it as canonical + fix doc-drift

**1. What's wrong?** There was no written FE↔BE API contract anywhere in the repo. `design documentation/api-contract.md` is brand-new and **untracked** in git. The eight gaps below are documented in it but the file itself was never committed, and two existing docs still describe the FE poll target as `/runs/{id}` when the live FE actually polls `/console/runs/{id}` (doc-drift, gap #4).

**2. What it actually impacts, and how** Dead-doc risk: an uncommitted contract is invisible to anyone running `git log`/CI and is one `git clean` away from deletion. The doc-drift means a backend engineer reading BACKEND-UPDATE-2 §h / DECISIONS D-Q15 would harden/instrument the wrong endpoint (`/runs/{id}`, the raw SQLModel route #20) believing the UI depends on it, while the UI in fact reads the camelCase view-model at `/console/runs/{id}` (#18). No build break — purely a source-of-truth/maintenance hazard.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT (tracked status): `git -C /Users/sangramsabat/autosentinx status --porcelain -- "design documentation/api-contract.md"` → literal output `?? "design documentation/api-contract.md"`; and `git ls-files --error-unmatch ...` → `error: pathspec 'design documentation/api-contract.md' did not match any file(s) known to git`. So it is untracked.
- The doc states this itself: api-contract.md:6-7 — "No prior `openapi.json`/`swagger`/`api-contract.md` existed … This is the first written contract."
- DRIFT proof: BACKEND-UPDATE-2.md:79 (`### h. NO event-streaming endpoint (UI polls /runs/{id})`), :82 ("polling `/runs/{id}` after `/scan` will sit at `pending_approval`"), :130 ("Unchanged read contract the UI relies on: `GET /runs`, `GET /runs/{id}`"), and DECISIONS.md:25 D-Q15 ("Poll `/runs/{id}` for status"). The real FE call is `getRun → GET /api/console/runs/${runId}` (api.ts:68-71) and `useRun(runId, 1800)` (processing-view.tsx:15) → so the live poll target is `/console/runs/{id}` (#18), not `/runs/{id}` (#20).

**4. What should happen?** (a) `git add "design documentation/api-contract.md"` and commit it as canonical. (b) Fix the drift: in BACKEND-UPDATE-2.md (§h lines 79/82/130) and DECISIONS.md (D-Q15 line 25), change the FE poll target text from `/runs/{id}` to `/console/runs/{id}` (note raw `/runs/{id}` remains a valid, unconsumed read route — distinguish the two).

**5. Error messages / logs / traces** none (static/structural) — the only "output" is the git porcelain/ls-files results pasted above.

**6. Additional info** OWNER: docs. Severity: low (hygiene). Naming: file title is "AutoSentinx — API Contract" (engine/backend → correct). When editing the docs, keep the distinction between the product-facing view-model route (`/console/*`) and the raw engine routes (`/runs/*`).

---

#### Item — Gap #1: `startScan` drops `endpoint` and `agentName` (FE → BE)

**1. What's wrong?** The FE `ScanConfig` accepts `endpoint` and `agentName`, and `new/page.tsx` passes them (`startScan({ endpoint, agentName: agent })`), but `startScan` only serializes `strategy` and `budget` into the query string. The endpoint and agent name the operator typed are silently discarded.

**2. What it actually impacts, and how** The target URL the user enters on `/new` has no effect on what gets scanned: the backend `/scan` route ignores any target field anyway and always scans `s.aarav_base_url` (the fixed AARAV sandbox). So the UI implies "point Sentinx at any vendor endpoint," but every run hits the same hardcoded target. User-visible deception, not a crash.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: read MAIN `sentinx-web/lib/api.ts:39-43`. Literal: `const q = new URLSearchParams({ strategy: "ucb", budget: String(cfg.budget ?? 6) });` — `cfg.endpoint`/`cfg.agentName` are declared in the interface (api.ts:33-37) but never read.
- PREFLIGHT: `grep -n 'startScan' new/page.tsx` → caller at `new/page.tsx:29`: `const { run_id } = await startScan({ endpoint, agentName: agent });` — confirms the FE *does* try to pass them.
- PREFLIGHT: read `app.py:156-179`. The `/scan` signature (lines 158-166) has **no** `endpoint`/`target`/`agent_name` param; line 173-174 forces `"target": s.aarav_base_url` and `Run(target_url=s.aarav_base_url, …)`. So even if the FE sent them, the BE would ignore them.
- Conforms to api-contract.md:34 ("FE sends only `strategy=ucb&budget=N`") and the proxy table api-contract.md:75.

**4. What should happen?** Two-part. FE-now: nothing strictly required for the demo since BE has no target param — but if/when BE accepts a target, add `if (cfg.endpoint) q.set("target", cfg.endpoint)` and an agent param in `api.ts:40`. BE-later: add `target`/`agent_name` query params to `app.py:156` `scan()` and thread them into `roe`/`Run.target_url`. Until then, the contract should explicitly note the endpoint field is cosmetic. **(FE honest-copy action lands in Phase 4, Item P4-3.)**

**5. Error messages / logs / traces** none (static/structural). No console error — the params just never appear on the wire.

**6. Additional info** OWNER: **FE-now** (honest copy, Phase 4 P4-3) **+ BE-later** (real targeting). Severity: **high** — UI theater on a *security* product: operator input has zero backend effect, and the "Endpoint reachable" success is asserted with no check. Canonical with api-contract.md **F1**. Ordering: the FE honest-copy fix is independent and lands now; the BE target param must land before the field can truly drive a scan. Note the diff's *own* `new/page.tsx` rewrite removed the `startScan` call entirely in favor of a mock `router.push('/runs/ER-01/processing')` — so the diff regresses this further (see Phase 4, Item P4-1). Naming: the user-facing form labels say "Sentinx"; the discarded target maps to the "AutoSentinx" engine sandbox.

---

#### Item — Gap #2: `agentName` hardcoded to "AARAV — NBFC voice debt-collection agent"

**1. What's wrong?** The backend console view-model returns a constant agent name for every run, ignoring whatever the operator named the agent on `/new`.

**2. What it actually impacts, and how** Every run row and run header in the UI shows "AARAV — NBFC voice debt-collection agent" regardless of the "Agent name" field (e.g., "VendorBot v2.1"). Combined with #1, the per-run identity the user typed is doubly lost — not stored on `/scan`, and not echoed by `/console`. User-visible.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `grep -n agentName autosentinx/console.py` → `console.py:132-133`: `def _agent_name(self, run) -> str:` / `return "AARAV — NBFC voice debt-collection agent"` — a literal return, run argument unused.
- PREFLIGHT: `console.py:124` uses it: `"agentName": self._agent_name(run)`.
- Conforms to api-contract.md:55-56 ("`agentName` is **hardcoded** to `"AARAV — NBFC voice debt-collection agent"`").

**4. What should happen?** BE-later: persist the agent name on the `Run` (new column or in `roe`), then make `_agent_name(run)` return `run.agent_name or "AARAV …"`. File: `autosentinx/console.py:132` plus the `/scan` route (`app.py:156`) and `Run` model. No FE change needed once BE echoes it.

**5. Error messages / logs / traces** none (static/structural).

**6. Additional info** OWNER: **BE-later** (paired with #1 — the name must first be captured by `/scan`) **+ FE-now** (don't imply the displayed name came from operator input). Severity: **high** — paired with #1; even the read path can't reflect operator input. Canonical with api-contract.md **F2**. Naming: "AARAV" is the fixed engine target name (AutoSentinx side); the user-supplied name is a Sentinx-facing label. The fallback string is the only place "AARAV/NBFC" surfaces in the UI today — flag if product wants it genericized.

---

#### Item — Gap #3: budget default 6 (FE) vs 40 (BE)

**1. What's wrong?** `startScan` defaults `budget` to **6** when the caller omits it; the backend `/scan` route defaults `budget` to **40**. Because the FE always sends an explicit `budget`, the FE's 6 wins and the BE's 40 default never applies.

**2. What it actually impacts, and how** A run started from the UI plans 6 attacks instead of 40 — far fewer plays, lighter coverage, faster (and weaker) audit. This also drives `playsTotal` (the "N of M plays" denominator) since the console derives `budget` from `roe.budget` (`console.py:120`). User-visible (fewer findings, smaller progress total). Not a crash.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `api.ts:40` → `budget: String(cfg.budget ?? 6)`. Literal default = `6`.
- PREFLIGHT: `app.py:159` → `budget: int = Query(40, …)`. Literal default = `40`.
- PREFLIGHT: `console.py:120` → `budget = int(json.loads(run.roe or "{}").get("budget") or run.num_attempts)` — confirms FE-sent `roe.budget` (6) flows to `playsTotal`.
- Matches api-contract.md:34 ("budget=40") vs api-contract.md:75 ("budget=<n||6>").

**4. What should happen?** Decide the intended demo budget and unify. If 6 is intentional for demo pacing, document it; if not, change `api.ts:40` to `cfg.budget ?? 40` to match BE. Single file: `sentinx-web/lib/api.ts:40`. OWNER FE-now (the FE default is the effective value). **(Action folds into Phase 4, Item P4-5.)**

**5. Error messages / logs / traces** none (static/structural).

**6. Additional info** OWNER: FE-now (FE default is authoritative since it's always sent). Severity: **medium** (canonical with api-contract.md **F3**; affects audit depth + the progress denominator). Caveat: changing to 40 lengthens every demo run ~6.7×; coordinate with the demo-pacing replay mode (DECISIONS D-Q15). Naming: n/a.

---

#### Item — Gap #4: FE polls `/console/runs/{id}` but docs say `/runs/{id}`

**1. What's wrong?** The live FE polls the camelCase view-model route `GET /console/runs/{id}` (#18), but BACKEND-UPDATE-2 and DECISIONS describe the UI poll target as the raw `GET /runs/{id}` (#20). Pure doc-drift — the code is correct, the docs are stale.

**2. What it actually impacts, and how** Mechanism and impact are the same as described in the Preamble item (a BE engineer would instrument/guarantee the wrong route). No runtime effect.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `api.ts:68-71` → `getRun` calls `GET /api/console/runs/${runId}`; `processing-view.tsx:15` → `useRun(runId, 1800)`; `use-run.ts:17` → `getRun(id)`. So the polled URL is `/console/runs/{id}`.
- PREFLIGHT: `grep -rn '/runs/{id}' docs` → BACKEND-UPDATE-2.md:79, :82, :130; DECISIONS.md:25 all say `/runs/{id}`.
- PREFLIGHT: `app.py:355-372` confirms BOTH routes exist (`/console/runs/{run_id}` at :364, raw `/runs/{run_id}` at :379) — so `/runs/{id}` is real but unconsumed (#20).
- Matches api-contract.md:46-48 (#18 "**Yes** — `lib/api.ts getRun` (+ `useRun` polling)"; #20 "**No** (FE polls `/console/runs/{id}`, not this)").

**4. What should happen?** docs-only edit (see Preamble item #4 for exact lines): BACKEND-UPDATE-2.md §h (79/82/130), DECISIONS.md:25. No code change.

**5. Error messages / logs / traces** none (static/structural).

**6. Additional info** OWNER: docs. Severity: low. Naming: n/a. This is the doc-fix the plan asks to land in BACKEND-UPDATE-2/DECISIONS.

---

#### Item — Gap #5: `pending_approval` masked to `"running"` → poller never stops (hang)

**1. What's wrong?** The console collapses `pending_approval` → `"running"` in the view-model (`console.py:118`). `useRun`'s poll loop only clears the interval when `status !== "running"` (`use-run.ts:20`). So if a run is polled while still awaiting approval (or if approval never fires), the masked status is permanently `"running"` and the poller loops forever.

**2. What it actually impacts, and how** The Processing screen polls every 1800ms (`processing-view.tsx:15`). For a normal run that gets approved and completes, the status eventually becomes `succeeded`/`failed` and the poll stops — fine. But for a run stuck in `pending_approval` (e.g., approval call failed, or someone deep-links to a pending run's processing page), the UI shows an eternal "running" spinner and hammers the BFF/backend on a 1.8s loop indefinitely. User-visible hang + wasted requests.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `console.py:118` → `status = "running" if run.status in ("running", "pending_approval") else run.status` — pending is indistinguishable from running over the wire.
- PREFLIGHT: `use-run.ts:20` → `if (pollMs > 0 && r.status !== "running" && timer) clearInterval(timer);` — stop condition is exactly the masked value, so it can never trigger while pending.
- PREFLIGHT: `processing-view.tsx:15` → `useRun(runId, 1800)`.
- Corroborated by BACKEND-UPDATE-2.md:82 ("polling `/runs/{id}` after `/scan` will sit at `pending_approval` … until approval … the run never progresses"). Matches api-contract.md:55 ("`status` collapses `pending_approval` → `"running"`") and the §5 finding.

**4. What should happen?** FE-now: in MAIN flow, approval already happens before navigation (`new/page.tsx:42-44` `await approveScan(runId)` then `router.push(.../processing)`), so the common path is covered — but harden `use-run.ts` with a safety cap (max poll count or elapsed-time guard) so a never-approved run can't loop forever. Cleaner BE-later option: expose the true status in the view-model (add a separate `phase`/`approved` field) so the FE can distinguish pending from running. Files: `sentinx-web/lib/use-run.ts:20` (guard) and/or `autosentinx/console.py:118-124` (un-mask). **(FE guard lands in Phase 5, Item P5-5.)**

**5. Error messages / logs / traces** none (static/structural) — runtime symptom is silent: repeated `GET /api/console/runs/{id} 200` every 1.8s in the network tab, spinner never resolves.

**6. Additional info** OWNER: FE-now (poll guard) + BE-later (status disambiguation). Severity: **medium** (canonical with api-contract.md **F5**) — latent today (the FE approves before navigating), but the only gap with a real runtime-hang failure mode. Ordering: the FE guard is the safe immediate fix; the BE field is the principled fix. Note: the diff does NOT touch `use-run.ts`, so this remains unfixed in the diff. Naming: n/a.

---

#### Item — Gap #6: 14 of 21 backend endpoints are unconsumed by the FE

**1. What's wrong?** Of 21 backend routes, the FE consumes only 7 (login/signup via fallback, scan, approve, console/runs, console/runs/{id}). The other 14 — `/auth/me`, `/health`, `/catalog`, `/catalog/coverage`, `/catalog/{slug}`, `/techniques`, `/techniques/{slug}`, `/coverage`, `/selection/stats`, `/ingest`, `/audit`, raw `/runs`, raw `/runs/{id}`, `/runs/{id}/transcript` — have no FE caller.

**2. What it actually impacts, and how** Not a bug — it's surface the product hasn't wired yet. Impact is opportunity/clarity: rich data (catalog severity joins, technique provenance, audit hash-chain, selection stats) is available but unused, and a reader could mistake an unused route for a dead one. No build or runtime effect.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `grep -n '@app.get\|@app.post' app.py` confirms all 21 routes (scan :156, approve :182, health :100, console/runs :355, console/runs/{id} :364, raw /runs :374, /runs/{id} :379, /runs/{id}/transcript :387, plus catalog/technique/coverage/selection/ingest/audit/auth routes).
- PREFLIGHT: api.ts exports only `login, logout, startScan, approveScan, getRun, listRuns` (api.ts:20,29,39,45,68,73) → matches the "Consumed by FE? **Yes**" rows in api-contract.md:30-49 (rows 2,3,6,7,17,18) = 7 consumed, 14 unconsumed.
- BACKEND-UPDATE.md:152 explicitly offers `/runs/{id}/transcript` etc. as available read surface; BACKEND-UPDATE recommends `/catalog/{slug}` for severity (api-contract.md:38) — FE instead derives from `/console/*`.

**4. What should happen?** docs-only: the contract's "Consumed by FE?" column (api-contract.md:29-49) already records this accurately; keep it as the canonical inventory so unused ≠ dead is explicit. No code change; future features (catalog detail, audit view) can adopt routes from this list. OWNER: docs (+ FE-later if features adopt them).

**5. Error messages / logs / traces** none (static/structural).

**6. Additional info** OWNER: docs / FE-later. Severity: low (informational). Caveat: do not delete the unconsumed BE routes assuming they're dead — several (`/catalog/{slug}`, `/runs/{id}/transcript`) are recommended integration points. Naming: these are AutoSentinx engine endpoints.

---

#### Item — Gap #7: BFF proxy implements GET/POST only

**1. What's wrong?** `app/api/[...path]/route.ts` exports only `GET` and `POST` handlers. Any `PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS` browser call to `/api/*` would 405 at the Next route before reaching the backend.

**2. What it actually impacts, and how** Today this is harmless: every consumed backend route is GET or POST (login/scan/approve are POST; console reads are GET), so nothing is blocked. It becomes a latent break the moment any future FE feature needs a non-GET/POST verb (e.g., a DELETE-run or PATCH-config endpoint) — the call would silently fail with a Next 405, not a backend error. Forward-looking, not current.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `grep -n 'export async function' app/api/[...path]/route.ts` → only `GET` (:30) and `POST` (:33). No `PUT`/`PATCH`/`DELETE`.
- PREFLIGHT: the `forward` helper (route.ts:8-27) is already verb-agnostic (`method: req.method`, body read for non-GET/HEAD at :14) — so adding verbs is trivial, only the exports are missing.
- Consistent with api-contract.md:69 ("the proxy strips `/api` and forwards the rest") which describes the mechanism generically.

**4. What should happen?** FE-later (not now): when a non-GET/POST route is needed, add `export const PUT = POST`-style thin handlers (or a single catch-all) in `app/api/[...path]/route.ts` reusing `forward`. No change required for the current consumed surface.

**5. Error messages / logs / traces** none (static/structural). If hit, the runtime symptom would be Next's `405 Method Not Allowed` from the route, not a backend response.

**6. Additional info** OWNER: FE-later. Severity: low (no current consumer needs it). Caveat: only add verbs that a real endpoint requires — don't blanket-proxy DELETE without auth review. Naming: n/a.

---

#### Item — Gap #8: `approveScan` swallows the backend `.detail` (409/404 reason lost)

**1. What's wrong?** `approveScan` calls the shared `req()` helper but returns `void` and is wired so its thrown error message — which `req()` does correctly extract from the backend `.detail` — is not surfaced as a specific reason on the approve UI. The backend's precise 409 (`run is {status}, not pending_approval`) / 404 (`run not found`) text is parsed by `req()` but the approve flow shows only a generic fallback.

**2. What it actually impacts, and how** Two-layer nuance from the live code: `req()` (api.ts:8-16) DOES read `.detail` and `throw new Error(detail)`. But `approveScan` (api.ts:45-47) just `await req(...)` with no body use, and the MAIN caller `new/page.tsx:42-46` catches with `setErr(e2 instanceof Error ? e2.message : "Approval failed.")` — so the message *does* propagate in MAIN. The doc's "swallows .detail" framing is the risk that if any caller catches without reading `e.message`, the specific 409 reason (e.g., "run is running, not pending_approval") is lost and the operator sees only "Approval failed." User-visible-on-error only.

**3. Why — proof, preflight checks, vs which doc/code**
- PREFLIGHT: `grep -n 'approveScan|.detail|throw' api.ts` → `.detail` extracted at api.ts:11, thrown at api.ts:15; `approveScan` at api.ts:45-47 returns `void` (no body surfaced).
- PREFLIGHT: `app.py:187,190` → backend emits `detail="run not found"` (404) and `detail=f"run is {run.status}, not pending_approval"` (409) — real, specific strings worth showing.
- PREFLIGHT: MAIN caller `new/page.tsx:42-46` does surface `e2.message`, so MAIN is actually correct; the gap is structural/fragile, not a live break.
- Matches api-contract.md:35 (approve route 404/409 semantics) and the proxy row api-contract.md:76 ("(ignored body)").

**4. What should happen?** FE-now (hardening): keep the current `req()` `.detail` extraction (it's correct) and ensure every `approveScan` catch surfaces `e.message` (MAIN already does at `new/page.tsx:44`). Optionally have `approveScan` return the parsed body so callers can branch on 409-vs-404. Files: `sentinx-web/lib/api.ts:45-47` (optional return), confirm caller `app/new/page.tsx:42-46`. **(In-dialog `.detail` surfacing lands in Phase 4, Item P4-4.)**

**5. Error messages / logs / traces** Backend literal on conflict: `{"detail":"run is running, not pending_approval"}` (HTTP 409, from `app.py:190`); on missing: `{"detail":"run not found"}` (HTTP 404, `app.py:187`). `req()` turns these into `Error("run is running, not pending_approval")`.

**6. Additional info** OWNER: FE-now (low effort, mostly already handled). Severity: low (error-path only, and MAIN already propagates). Caveat: the doc's "swallows" wording overstates MAIN's behavior — flag that the verified live caller does surface the detail; the real action is to keep it that way and not regress. Naming: error strings are operator-facing inside the Sentinx console.

---

**Cross-cutting verified fact (applies to #1, #2, #5, #8):** PREFLIGHT `git -C /Users/sangramsabat/autosentinx diff --stat 6c0c5a9..4a567ab -- sentinx-web` lists **19** changed files; `git diff … -- sentinx-web/lib/api.ts` → **0** lines, and `lib/use-run.ts` + `app/api/[...path]/route.ts` + `app/api/auth/**` likewise produce **no diff output**. So none of the eight API-contract gaps are fixed by this diff — every fix is FE-now/BE-later/docs work still pending, and the diff's `app/new/page.tsx` rewrite even replaces the real `startScan`/`approveScan` wiring (MAIN `new/page.tsx:29,42`) with a mock `router.push('/runs/ER-01/processing')`, which would regress #1/#2/#8 if merged. The action this section authorizes is: commit `api-contract.md` as canonical and fix the #4 doc-drift in BACKEND-UPDATE-2/DECISIONS.

**Net contract code changes owned by FE in this milestone:** #1/#2 honest copy (Phase 4, P4-3), #3 explicit budget + copy (Phase 4, P4-5), #5 poll guard (Phase 5, P5-5), #8 surface approve error detail (Phase 4, P4-4). **BE changes are all deferred** to a future "real targeting" milestone (#1, #2, optional #5). **Docs:** commit the contract, fix #4 doc drift, record #3/#6/#7 notes.

#### Milestone BE-1 — real targeting (deferred backend work, named so "fully functional" never silently means "FE-against-a-fixed-sandbox forever")

The scattered "BE-later" punts above (#1 target param, #2 agent-name capture/echo, #5 `pending_approval` un-mask) are one coherent backend milestone, not loose ends. Group + track them as **BE-1**:

- **#1 — accept a target.** `POST /scan` gains `target` (+ `agent_name`) query params (`app.py:156` `scan()`); thread `target` into `roe` and `Run.target_url` instead of forcing `s.aarav_base_url` (`app.py:173-174`). Optionally add a real reachability check so "Endpoint reachable" can be asserted honestly.
- **#2 — capture + echo the agent name.** Persist `agent_name` on `Run` (column or `roe`); `console.py:_agent_name(run)` returns `run.agent_name or "AARAV — …"` (`console.py:132`).
- **#5 — un-mask status.** Stop collapsing `pending_approval`→`"running"` in the view-model (`console.py:118`); expose a distinct `phase`/`approved` field so the FE can stop polling a never-approved run without the FE-side guard having to guess.

**Acceptance criteria for BE-1:** `/scan` accepts `target`/`agent_name` and the run honours them; `/console/runs/{id}` echoes the operator-supplied agent name; `/console/runs/{id}` exposes `pending_approval` distinctly from `running`. Once BE-1 lands, the FE honest-copy (P4-3) becomes real targeting copy, and the FE poll-guard (P5-5) becomes a backstop rather than the primary fix.

---

## (c) Sequencing, dependencies, risks

**Sequence (dependency-ordered):**
1. **Phase 0** baseline green (build + lint on untouched main @ `eabb173`).
2. **Phase 1 (PRESERVE)** — independent, zero adaptation, ship first. Includes the live-path-correcting `outcome.ts`/`score.ts` wins (medium ◗, RISK band .55, count parity, a11y).
3. **Phase 2 (`globals.css`)** — independent; pairs token work with the later pulse (`.phase-pulse` keyframe added now, consumed in Phase 5).
4. **Phase 3 (`ui.tsx`+login)** — `ui.tsx`'s new `Textarea`/sizing **and the ref-forwarding `Input`** are a **prerequisite** for Phase 4's Notes field and bearer-focus — must precede Phase 4. Login keeps MAIN's real `await login()`; corrects h1 to "Sign in to **Sentinx**".
5. **Phase 4 (`new/page.tsx`)** — depends on Phase 3 (`Textarea` + ref `Input`) and on `api-contract.md` decisions #1/#3/#8. Highest adaptation; real `run_id` wiring, honest endpoint copy, in-dialog `.detail`, explicit budget, `OPERATOR_EMAIL` removed, "Sentinx" copy.
6. **Phase 5 (processing)** — depends on Phase 1 (`outcome.ts` shapes) + Phase 2 (`.phase-pulse`); folds in poll-guard #5; drops `MOCK_RUN`/timer/`IS_REPLAY`; live label.
7. **Phase 6 (evidence + detail)** — **atomic breaking commit**; depends on Phase 1 (`outcome.ts` `OUTCOME_META`). Do not split. Fallback reads "Sentinx panel: …".
8. **Phase 7 (overview/report fresh)** — net-new against main's live `useRun` pages; lowest priority, after the ports land; report body brand reconciled to "Sentinx" + print CSS.
9. **Contract:** commit `api-contract.md` early (alongside Phase 1); doc fixes (#4) and notes (#3/#6/#7) anytime; BE items go to a separate ticket/milestone.

**Risks (honest):**
- **R1 — Phase 6 build break (atomic unit).** Required-prop addition to `evidence.tsx` breaks `app/runs/[id]/o/[obsId]/page.tsx:64,66` if shipped alone. *Mitigation:* single atomic commit pairing `evidence.tsx` with both call-site edits (`outcome={o.outcome}`, `verdictScore={o.verdictScore}`); build-gate before merge. (Verified the call sites currently pass neither prop; `Outcome` and `Observation.outcome` exist, so the fix is type-valid.)
- **R2 — Naming split must be applied, not blanket-rewritten.** Per THE NAMING RULE, re-authored copy in login/new/processing/evidence/report is **user-facing → "Sentinx"**, while engine/repo/backend/docs stay **"AutoSentinx"**. The hazard now runs both ways: leaving MAIN's stray "AutoSentinx" on user-facing surfaces (login h1, `/new` sub-lines, evidence fallback, report body) is just as wrong as introducing "Sentinx" on the marketing landing (a deliberate AutoSentinx surface). *Mitigation:* before each commit, run `grep -rn "Sentinx\|AutoSentinx" app components` and verify **each hit carries the correct brand for its surface** — user-facing chrome/report = Sentinx; landing/engine/contract = AutoSentinx. This REPLACES the old "must return only AutoSentinx" guard.
- **R3 — `ui.tsx` is global.** h-11/rounded-sm/shadow + ref-forwarding changes every Button/Input/Card app-wide, including main's run pages and any marketing-adjacent control. *Mitigation:* visual pass on `/login`, `/new`, run pages; confirm `.btn-cta`/`.btn-cta-ghost` marketing buttons are untouched (separate raw CSS class, used via `className` — verified disjoint from `<Button>`).
- **R4 — Re-shipping UI theater (#1).** Porting Phase 4 copy verbatim re-introduces the "Endpoint reachable" false assertion; our diff's `reachable` "Verified agent endpoint" is the same theater in a new flavor (probes a URL the engine never scans). *Mitigation:* resolve the honest-copy decision (#1/P4-3) **before** writing Phase 4 strings; the connection check may stay as a host-shape probe, but copy must not imply the probed endpoint is audited.
- **R5 — Phase 7 is not a port.** Treating overview/report as cherry-picks will fail (our diff has zero hunks for those files; main rewrote them onto `useRun`). *Mitigation:* schedule as fresh implementation against main's live-data pages, scoped separately, after Phases 1–6.
- **R6 — Poller hang (#5).** Without the guard, a non-approved run polls `/console/runs/{id}` forever at 1800ms with `status:"running", playsDone:0` (because `console.py` masks `pending_approval`→`running`). *Mitigation:* land the FE poll-guard (P5-5) with Phase 5 even before the BE clean fix (un-mask `pending_approval`).
- **R7 — Live-path side effects from Phase 1.** `RISK_BAND .55` + medium shape `◗` now also change **live** verdicts/glyphs via `lib/api.ts`/`deriveOutcome` (which imports the same constant). This is intended (spec-correct) but is a visible behavior change on real runs — call it out in the PR so it isn't mistaken for a regression. Same for `score.ts` count-parity/zero-findings, which feed main's rewritten overview/report.

**Definition of Done — per phase (gate before each commit):**
- **Build + lint green** (`npm run build` + lint) on the branch.
- **Naming grep clean per surface:** `grep -rn "Sentinx\|AutoSentinx" app components` reviewed — every user-facing hit reads "Sentinx", every engine/landing/contract hit reads "AutoSentinx" (R2).
- **Phase-specific gate** as listed under each phase above (e.g. Phase 1: `ink-faint` only on non-text in the three files; Phase 4: real `run_id`, no `ER-01`/`OPERATOR_EMAIL`; Phase 6: the atomic `evidence.tsx`+`o/[obsId]/page.tsx` pair in one commit).
- **For Phases 4–6:** a manual click-through of `/login` → `/new` → processing → run detail to confirm the live path renders (no `useRun("ER-01")` 404, no dangling `aria-controls`, honest endpoint copy).
