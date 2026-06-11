# Sentinx v1 — Frontend Design

UI/UX design for the **Sentinx** v1 frontend — an autonomous red-teaming **audit instrument** for NBFC Hindi/Hinglish voice collection agents. Authored by running the **#ProcessFlow linearly** (research → personas → mapping → plan → critique), grounded in the founders' scoping call, the product deck (information only), the backend architecture + code, and live platform research.

**v1 FOCUS scope:** one eval run. Flow = **Landing → Login → Run Config → Processing → Findings (Exec Summary + Observations) → Observation Detail**, plus a PDF findings report. Remediation = locked "coming soon."

## Read in order
| Doc | Stage | What it is |
|---|---|---|
| [00-PROCESS.md](00-PROCESS.md) | — | The process, with reasons; how it's applied linearly here |
| [01-user-research.md](01-user-research.md) | 1 | Questionnaire + synthesised (derived) answers, with confidence tags |
| [02-personas.md](02-personas.md) | 2 | Behavioural parameters + personas (Meera / Arjun / operator) |
| [03-mapping.md](03-mapping.md) | 3 | Traceability (goal→need→feature→rule) + scope cuts + backend deps D1–D7 |
| [DESIGN.md](DESIGN.md) | Foundation | Brand, design language, tokens, voice, a11y, clichés-to-avoid — **the ironclad system** |
| [04-uiux-plan.md](04-uiux-plan.md) | 4 | **The approval artifact** — IA, journeys, 7-screen bones, states, open decisions |
| [05-critique.md](05-critique.md) | 5 | Adversarial design-critic pass + what was applied / deferred / needs a decision |

## Status
🟢 **APPROVED & BUILT.** The interview locked 20 decisions (`DECISIONS.md`), then all three deliverables shipped:
1. **UI/UX master spec** → `spec/` (`00-foundation.md` + 7 screens).
2. **Claude Design prompts** → `prompts/claude-design/` (`00-global-style.md` + 7 screens). *(Google Stitch variants on request — only the Output Format section changes.)*
3. **Frontend** → `../sentinx-web/` (Next.js + TypeScript + Tailwind v4). Builds clean; `npm run dev` → http://localhost:3000.

Autonomous build decisions are logged in **`ASSUMPTIONS-LOG.md`** for review. Backend dependencies still open (not UI forks): D8 two-observation build · D6 variable freeze · D5 SME clause sign-off.
