# Sentinx v1 — UI Refinements Changelog

Post-build visual/UX refinements (after the 20-decision approval + initial build). Each entry: **what · why · where**, so a change is traceable into the frontend. Substantive product/IA decisions live in `DECISIONS.md`; this logs the smaller visual tweaks.

## 2026-06-12

### Exec Summary / Findings split → two screens + in-run tab nav
Full record in `DECISIONS.md` **D-Q21** and `04-uiux-plan.md §A`. `Overview` at `/runs/[id]`, `Findings` at `/runs/[id]/findings`, switched by a thin in-run tab nav.
*Where:* `components/run-tabs.tsx`, `app/runs/[runId]/page.tsx`, `app/runs/[runId]/findings/page.tsx`.

### Critical Risks cards — looser spacing ("too cramped" feedback)
- **What:** `CriticalRiskItem` padding `px-3 py-2.5` → **`px-4 py-3.5`**; item gap `gap-3` → `gap-4`; title `13px` → **`14px` medium**; chip-row top margin `mt-1` → `mt-2.5`; chip gap `gap-2` → `gap-2.5` + wrap; added a leading dot before "guardrail bypass"; card list `space-y-1.5` → `space-y-2.5`; section `mt-4` → `mt-6`.
- **Why:** cards read cramped — content bunched, chips crowded.
- **Where:** `components/findings.tsx` (`CriticalRiskItem`); `app/runs/[runId]/page.tsx` (Critical risks block).

### In-run tab nav — active tab filled brand (visibility)
- **What:** `RunTabs` active tab changed from a subtle bottom-border underline to a **filled Azure-Cobalt pill** (`bg-brand` + `on-brand` text); inactive tabs are muted with a hover fill; the nav bar got vertical height (`py-2`). Findings count shown as a chip on the tab.
- **Why:** the underline-style active state was too subtle — "Overview/Findings nav is not visible."
- **Where:** `components/run-tabs.tsx`.
