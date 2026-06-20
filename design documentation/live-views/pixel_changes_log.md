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
