# Sentinx — Web Console (v1)

The Next.js + TypeScript frontend for **Sentinx**, the AI red-team & compliance audit console.
Built from the locked design decisions in `../design documentation/DECISIONS.md` and `../design documentation/DESIGN.md`.

## Run

```bash
npm install      # if not already
npm run dev      # http://localhost:3000
npm run build    # production build (passes clean)
```

## What's here

| Route | Screen |
|---|---|
| `/` | Landing |
| `/login` | Thin login (cosmetic gate) |
| `/new` | Run Config + one-click "Approve & run" |
| `/runs/[runId]/processing` | Processing (poll-sim + live findings feed, demo replay) |
| `/runs/[runId]` | Findings — exec summary + observations table |
| `/runs/[runId]/o/[obsId]` | Observation Detail (panel / single-judge / fairness variants) |
| `/runs/[runId]/report` | Printable PDF findings report |

Try the flow: **/** → Run an audit → sign in → Run audit → Approve & run → watch the scan → findings → click any row → Observation Detail. Toggle light/dark (top-right). Best rows to open: `F-COM-03` (canonical coercion + bypass), `F-COM-01` (Devanagari + detectors), `F-COM-06` (fairness paired-persona variant), `F-SEC-02` (two-row pair).

## Architecture

- **Design tokens** → `app/globals.css` (light default + dark console, all CSS variables; Tailwind v4 `@theme`).
- **Types** mirror the real backend schema → `lib/types.ts` (Attempt + Objective + Turn + judge_votes + detector_hits).
- **Mode-aware outcome / scoring** → `lib/outcome.ts`, `lib/score.ts` (panel 1-of-3=RISK; single-judge `verdict_score` band; fairness; withstood fraction).
- **Mock data** (the demo run) → `lib/mock/run.ts`. Swap for the live `/runs` API via a thin adapter (see `ASSUMPTIONS-LOG.md` A6/A7).
- **Components** → `components/` (badges, evidence, findings, table, top-bar, theme).

Fonts: Geist Sans (UI) + Geist Mono (evidence) + Noto Sans Devanagari (Hinglish). Icons: lucide (line). Theme: next-themes.

> Backend is currently fixed to the AARAV sandbox; the endpoint field is vision-forward (D-Q14). Decisions made autonomously during the build are logged in `../design documentation/ASSUMPTIONS-LOG.md` for review.

## Logging & debugging (see what works / what doesn't)

Everything is logged to **one unified stream** so failures are never silent:

- **Run with a tailable log:** `npm run dev:log` (writes `dev.log`), then in another terminal `npm run logs` (`tail -f dev.log`).
- **`proxy.ts`** logs every page request: `[req] GET /runs/ER-01` + status + timing.
- **`components/client-logger.tsx`** logs each route change, app mount, and every uncaught **window error / unhandled rejection** — these are mirrored to the server via **`/api/log`** so they show up as `[client] ERROR …` in the same log (and in the browser console).
- **`app/error.tsx` / `app/global-error.tsx`** — render-error boundaries: a readable card with the message + `digest` + "Try again", and the error is logged.
- **`app/not-found.tsx`** — friendly 404 for unknown runs/observations.
- **`lib/logger.ts`** — `logger.info/warn/error(msg, meta)` from any client code; logs to console **and** the server.

So while you click through: watch `dev.log` (server + mirrored client events) and the browser console (client detail). Any break shows up with its route and message.
