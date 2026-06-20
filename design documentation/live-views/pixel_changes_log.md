# Live Views — Pixel-Report Change & Reversal Log

> Actions taken on the `pixel_report.md` findings (2026-06-21 directive: *remove stale-capture artifacts; cut 1–2★ unless useful; refine 3–4★ as advised*). **Every change here is reversible** — each entry has the **exact original code** so an item can be restored verbatim. Each change is also its own git commit (the diff is the second source of truth). To revert one item: paste its *Before* back over its *After* in the cited `file:location`.
>
> Legend: **CUT** = removed · **GATE** = kept but hidden outside dev · **REFINE** = changed in place · **KEEP** = explicitly kept despite a low score (useful) · **NO-OP** = not ours / not a real element.

## V2 (Arena) — pass 1

### PX-1 · CUT the disabled "Glance" zoom segment + DE-BRAND the active "Arena" pill — `app/runs/[id]/arena/page.tsx` (zoom control, ~line 72)
Report: Glance scored **1 (cut)** — a dead "coming soon" control teaching a feature that isn't there (V1 deferred, `D-LV23`). The active pill scored **2 (refine)** — brand-blue selected state competes with severity colour.
**Before:**
```tsx
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 text-ink-faint cursor-not-allowed" title="V1 Glance — coming soon">Glance</span>
          <span className="px-2.5 py-1 bg-brand-soft text-brand border-l border-border">Arena</span>
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={() => run && router.push(`/runs/${params?.id}/arena/${run.plays.find((p) => p.status === "done")?.idx ?? 0}/forensic?data=${data}`)}>Detail</button>
        </span>
```
**After:** Glance removed; Arena selected state → neutral `bg-surface-sunk text-ink font-medium` (severity-neutral). **Revert:** paste the Before block back. To re-add Glance when V1 lands, restore the first `<span>`.

### PX-2 · GATE the sample switcher to dev only — `app/runs/[id]/arena/page.tsx` (~line 80)
Report: scored **1 (cut)** — leaked build/test scaffolding (8 fixture names) in operator chrome. But it's **useful for review** (`OPEN-LV3`), so GATE not cut: render only when `process.env.NODE_ENV !== "production"` (visible in the dev/review server, gone in a production build).
**Before:**
```tsx
        {/* sample switcher (build/test aid, OPEN-LV3) */}
        <select value={data} onChange={(e) => router.replace(`?data=${e.target.value}`)} className="mono text-[11px] bg-surface border border-border rounded-md px-2 py-1 text-ink-muted">
          {SAMPLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
```
**After:** wrapped in `{process.env.NODE_ENV !== "production" ? (…) : null}`. **Revert:** remove the wrapper to show it in production again.

### PX-3 · DEDUPE StripLegend (shown twice) — `components/live/arena.tsx` (focal copy, ~line 200)
Report: scored **2 (refine)** — the per-turn legend renders under the scoreboard AND inside the focal on one screen. Keep the scoreboard instance (global home); drop the focal copy.
**Before (focal):** `      <div className="mt-2.5"><StripLegend /></div>`
**After:** removed. **Revert:** restore the line inside the focal block.

### PX-4 · MUTE the "held" count when zero — `components/live/arena.tsx` scoreboard (~line 340)
Report: a `0 held` still wears pass-green; mute zero counts (green should mean "some held").
**Before:** `        <span style={{ color: "var(--pass-text)" }}>{Math.max(0, run.summary.done - run.summary.fails - run.summary.risks)} held</span>`
**After:** green only when the count > 0, else ink-muted. **Revert:** paste the Before.

### KEEP / NO-OP (explicitly not changed)
- **Processing ↗** (scored 2) — **KEPT**: you explicitly asked for V2↔C4 nav; it's a useful door, not clutter (`OPEN-LV1`). Reconsider when OPEN-LV1 resolves.
- **Floating "N" avatar** (scored 2) — **NO-OP**: that's the **Next.js dev-mode indicator**, not our UI; it does not render in a production build. Nothing to change.
- **Stale "SENTIN X" wordmark / plain-circle logo** (flagged) — **NOT a code issue**: the code already renders the real `<Logo>` (RadarMark + "AutoSentinX"); only the *light capture* `nav_arena_admin.png` was stale. Action = recapture (below), no code change.

## V3 (Forensic) — pass 1
*(From `pixel_report_v3.md` — workflow `wf_9406c5b7-698`, 97 elements, mean 3.93.)*

### PX-5 · CUT "Glance" + DE-BRAND the active "Forensic" pill — `app/runs/[id]/arena/[playId]/forensic/page.tsx` (~line 68)
**Before:**
```tsx
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 text-ink-faint cursor-not-allowed" title="V1 Glance — coming soon">Glance</span>
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={backToArena}>Arena</button>
          <span className="px-2.5 py-1 bg-brand-soft text-brand border-l border-border">Forensic</span>
        </span>
```
**After:** Glance removed; Forensic pill → neutral `bg-surface-sunk text-ink font-medium`. **Revert:** paste the Before.

### PX-6 · CUT the redundant in-body "↑ roll up to Arena" — `components/live/forensic.tsx` (~line 35) + its `onRollUp` prop
3 back-to-Arena paths existed (zoom segment, this, role nav). Kept the zoom segment as the single up-control.
**Before (removed line):** `      <button onClick={onRollUp} className="text-[11px] mono text-brand inline-flex items-center gap-1 mb-3 hover:underline"><ArrowUp size={13} /> roll up to Arena</button>`
Also: signature `Forensic({ run, play, onRollUp }: { …; onRollUp: () => void })` → `Forensic({ run, play }: { … })`; import dropped `ArrowUp`; page call dropped `onRollUp={backToArena}`. **Revert:** restore the button + the `onRollUp` prop/import/page-arg.

### PX-7 · REFINE judge-vote glyph + colour (de-invert + de-colour) — `components/live/forensic.tsx` (~lines 68 & 78)
Report: Check==committed reads inverted; fail-red/pass-green on a per-judge vote breaks severity-only-colour.
**Before (both spots):** `… style={{ color: x.committed ? "var(--fail-text)" : x.error ? "var(--warn-text)" : "var(--pass-text)" }}>{x.committed ? <><Check size={11} />committed</> : x.error ? <><AlertTriangle size={11} />unavailable</> : <><Shield size={11} />held</>}`
**After:** ink-only; `ShieldOff` (committed) / `ShieldCheck` (held) / `AlertTriangle` (unavailable) — no colour, no inverted check. (Import swapped `Shield,Check` → `ShieldOff,ShieldCheck`.) **Revert:** restore the `style` colour + `Check`/`Shield` glyphs + the import.

### PX-8 · REFINE severity → a chip — `components/live/forensic.tsx` (~line 42)
**Before:** `            <div className="text-[11px] text-ink-faint" title={play.id}>{humanize(play.id)} · {play.pillar} · severity {play.severity}</div>`
**After:** adds a severity-coloured chip (severity colour is allowed) matching V2's focal header. **Revert:** paste the Before.

### PX-9 · REFINE model-name width 140→180 + title tooltip — `forensic.tsx` (~line 79). **Before:** `w-[140px] truncate">{x.model?.replace(…)}` → **After:** `w-[180px] truncate" title={x.model}>`. Revert: 180→140, drop title.
### PX-10 · REFINE probe icon Crosshair→Search — `forensic.tsx` (~line 121): the recon-probe `<Crosshair>` reused the attacker-technique glyph → `<Search>`. Revert: Search→Crosshair.
### PX-11 · REFINE label-trend legend — `forensic.tsx` (~line 149). **Before:** `<div>label trend: {play.turns.map((t) => t.label[0]).join("")}</div>` → **After:** wraps the string + appends `(R refusal · S succeed · C comply · U unknown)`. Revert: paste the Before.

## Lift-to-4 pass (refine-only, no deletions) — every element ≥4
*(2026-06-21 directive: every element ≥4 by REFINING, not deleting; prior cuts untouched. Re-audit `wf_7b5ef25a-de3` found 15 still-<4 elements; all refined in place. Git diff of the lift-to-4 commit is the precise revert source — each is an in-place tweak, nothing removed.)*
| # | Element (was <4) | Refine applied | File |
|---|---|---|---|
| L1 | scoreboard `gate-delta` token | + tooltip (plain-language meaning) + dashed underline | arena.tsx |
| L2 | footer model list | strip `gemini:` prefix + space-join (matches the rest of the UI) | arena.tsx |
| L3 | StripLegend missing cell kinds | added `yet to come (est.)` + `unknown` keys | arena.tsx |
| L4 | recon intel→attack target (raw slug) | `humanize()` + raw slug on hover | arena.tsx |
| L5 | recon profile ✓/✗ cards | + caption "observed during recon — intel, not a verdict" | arena.tsx |
| L6 | regulation/compliance chips (brand pills) | de-brand → ink/border + `control_title` meaning on hover (type gained `control_title?`) | arena.tsx / runview.ts |
| L7 | verdict `score` (raw float) | relabel → "confidence X.XX/1" + tooltip | forensic.tsx |
| L8 | per-turn label chip | + polarity tooltip ("advisory classifier — agent held / attacker got the line") | forensic.tsx |
| L9 | recon intel→attack target (V3) | `humanize()` + de-brand to ink + hover slug | forensic.tsx |
| L10 | brand hover-borders on buttons/stepper | `hover:border-brand` → `hover:border-ink-faint` | forensic.tsx + forensic page |
| L11 | judge `spec N` | relabel → "specificity N/1" | forensic.tsx |
| L12 | engine-internals `beats` | relabel "why each phase advanced" + trigger legend | forensic.tsx |
| L13 | intensity caption | plain sentence (drop mono, ink-muted) + clearer wording | intensity-dial.tsx |
| L14 | intensity estimate line | ink-faint → ink-muted (legible) | intensity-dial.tsx |
| L15 | /new roll-up vs dial (dup counts) | re-scoped roll-up to scope-only (dial owns the counts) | new/page.tsx |
**Revert any item:** `git show <lift-to-4 commit>` → the diff hunk for that line is the exact restore.

### Deferred (V3, logged not done)
- **Detector hits inline in the transcript** (scored 2, an ADD not a cut) — detectors live only in the Judge panel; surfacing them per-turn in the transcript is an enhancement, not clutter. Deferred.
- The ~24 remaining 3–4★ refines in `pixel_report_v3.md` (mostly subjective polish) — left as the record; action case-by-case later.
