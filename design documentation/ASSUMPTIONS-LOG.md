# Sentinx v1 — Build Assumptions & Autonomous Decisions (review log)

Decisions I made **autonomously** while finishing the spec → Claude-Design prompts → Next.js build (per instruction: "if you have a question, go with your most recommended answer and log it"). Each entry: **Decision · Why · Where it lives** (so a change is easily traceable into the design + frontend) · **Revisit?**

> Authoritative product/visual decisions remain in `DECISIONS.md` (D-Q1…D-Q20). This file only records build-time choices not already settled there.

## Tooling / stack
| # | Decision | Why | Where it lives | Revisit? |
|---|---|---|---|---|
| A1 | **Next.js (App Router) + TypeScript + Tailwind** | Matches the brief; app-router is current; Tailwind implements our token system cleanly | `sentinx-web/` whole app | low |
| A2 | **Custom components (no shadcn/ui)** | shadcn defaults to rounded/soft; our spec is sharp/dense terminal (D-Q16) — full control of geometry + tokens | `sentinx-web/components/` | low |
| A3 | **lucide-react** icons | Line/outline set per D-Q17 | every icon usage | low |
| A4 | **`geist` package (Sans+Mono) + Noto Sans Devanagari via next/font** | Exact typography per D-Q8; Devanagari for Hinglish evidence | `app/layout.tsx`, `app/globals.css` | low |
| A5 | **next-themes** for light/dark toggle | Reliable class-based theme switch; light default, persisted (D-Q5/Q6) | `ThemeProvider`, `globals.css` | low |
| A6 | **Mock data layer** (TS fixtures matching the real field schema) | Backend is fixed to AARAV + not wired; UI must be fully navigable for the demo. Fixtures mirror `Attempt`+`Objective`+`Turn`+`judge_votes`+`detector_hits` exactly (BACKEND-UPDATE.md §4) so swapping to the live API is a thin adapter | `lib/mock/`, `lib/types.ts` | medium — swap for live API later |
| A7 | **Thin API-client stub** alongside mocks | So the live `/runs`,`/runs/{id}`,`/scan`,`/approve` wiring is a drop-in later | `lib/api.ts` | medium |
| A8 | **Routes:** `/` landing · `/login` · `/new` run-config · `/runs/[runId]/processing` · `/runs/[runId]` findings · `/runs/[runId]/o/[obsId]` detail · `/runs/[runId]/report` printable report | Clean app-router mapping of the screen inventory; Approve is a step in the run flow | `app/**` | low |

## Data / content assumptions
| # | Decision | Why | Where it lives | Revisit? |
|---|---|---|---|---|
| C1 | **Display ID `F-SEC/COM-NN`** synthesized from pillar + per-run sequence; raw `objective_slug` shown as mono metadata | Deck-familiar, pillar-coded (D6 resolution) | `lib/mock`, ObservationRow, Detail | low |
| C2 | **RISK `verdict_score` band for single-judge modes = [0.30, 0.70)** (committed→FAIL; not-committed ∧ score in band→RISK; else PASS); thresholds surfaced on screen and centralised in one config | D-Q19 left thresholds "tunable"; picked sensible defaults, made them a single constant | `lib/outcome.ts` (`RISK_BAND`) | **yes — tune with eng** |
| C3 | **Withstood-fraction denominator = plays attempted in that pillar**, excluding `unknown`/`blocked`/`error`/`sample` | A play that errored isn't evidence of "withstood"; keeps the ratio honest | `lib/score.ts` | medium |
| C4 | **Mock run = realistic mixed set**: ~12 plays, both pillars, panel + single-judge + fairness modes, ≥1 dual-duty two-row pair, ≥1 bypass-signal finding, ≥1 zero-evidence/PASS, the canonical F-COM-03 | Exercises every UI state (two-row, RISK, fairness variant, bypass, zero-findings) for the demo | `lib/mock/run.ts` | low |
| C5 | **Two-row model rendered UI-side** (D8 unbuilt): when a mock attack carries both pillars, the fixture emits two linked observation objects sharing an `incidentId`, each with its own `evidenceTurn` | Lets the UI show the agreed two-row + per-observation evidence today; live backend fills this when D8 lands | `lib/mock`, types | medium |
| C6 | **Regulation clause text = curated placeholders, clearly marked `[SME-pending]`** | D5 SME sign-off is a process gate; never present unverified clauses as final | RegulationCite, mock | **yes — SME** |

## Open for review (none blocking the build)
- C2 RISK band thresholds · C3 denominator rule · C6 clause text — all isolated in single modules so a change is one-file + re-render.
