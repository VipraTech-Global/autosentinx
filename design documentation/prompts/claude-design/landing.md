# Claude Design prompt — Sentinx Landing (C1 · M12)

> Paste-ready. One screen of the multi-screen Sentinx console. Obeys `DESIGN.md` + `DECISIONS.md` (D-Q1…D-Q20). Output is React + Tailwind. Master spec: `design/spec/landing.md`.

---

GOAL: Build the **Landing screen** for Sentinx — a BFSI-grade, dual-theme threat-intelligence & AI-risk console that autonomously red-teams Hindi/Hinglish voice collection agents. One screenful that establishes serious, forensic security tooling in ~5 seconds and routes to the audit via a single CTA. No marketing site, no scroll, no second path.

LAYOUT: Single column, left-aligned, dense/sharp (terminal-precise, NOT soft-rounded SaaS). Regions top→bottom:
1. **Slim sticky top bar (~56px):** left = radar/scan-sweep sentinel glyph + wordmark "Sentinx" (Geist, tight tracking); right = theme toggle (light default / dark console) + a quiet "Sign in" text link. No left nav (a left rail here is a banned generic-admin cliché).
2. **Positioning block** (generous top space — this is the cover; the one place that breathes): eyebrow (mono, quiet) → H1 one-liner (largest type on screen) → one sub-line → ONE filled brand CTA "Run an audit". The CTA is the only filled/colored control on the page — the visual gravity well.
3. **Quiet proof strip** (3 columns desktop / stacked mobile): three terse capability facts, equal weight, muted ink, separated by hairline rules or gutters — NOT cards, NOT icon tiles. Small mono index [01][02][03] for instrument feel.
4. **Confidential footer** (one quiet line): proprietary + synthetic-data handling line.
Hierarchy: H1 > CTA > sub-line > proof strip > eyebrow/footer. One soft elevation max; separate with borders + background-shifts, not shadows. NO gradient hero in either theme.

CONTENT (real copy — never lorem; the brand one-liner verbatim):
- Eyebrow (mono, uppercase): `SENTINX · THREAT-INTELLIGENCE CONSOLE`
- H1: **Autonomous red-teaming for Hindi/Hinglish voice AI agents — proof, not promises.**
- Sub-line: *Sentinx attacks your lender's voice collection agent the way a real adversary would — multi-turn, in Hindi and Hinglish — and shows, with evidence, exactly where it holds and where it breaks.*
- Primary CTA: `Run an audit`
- Proof strip (capability, NOT results — zero numbers):
  - `[01] Multi-turn Hinglish attacks` — Adversarial plays in Hindi and Hinglish, not single-prompt probes — the way borrowers are actually pressured.
  - `[02] Security + RBI/DPDP compliance` — Every play is judged against guardrail bypass and regulated harm — RBI Fair Practices Code and DPDP, mapped to the clause.
  - `[03] Evidence-backed, reproducible` — Each verdict carries the landing exchange, an anonymized judge panel, and detector hits — forensic, timestamped, reproducible.
- Footer: *Confidential — Sentinx red-team console. Audits run against a controlled sandbox target on synthetic borrower data; no real borrower data or PII is involved. Proprietary attack methodology is not disclosed.*
- The Landing carries **NO live finding data and NO numbers** — it reads zero backend run data on purpose (loads instantly, no confidentiality exposure, no fabricated precision). The real forensic example (F-COM-03 Hinglish coercion, RBI FPC §7(ii), the bypass signal) belongs on the *Findings/Detail* screens, NOT here; do not invent stats, ASR percentages, or counts for the landing.
- "Run an audit" routes into the funnel (Landing → Login → Run Config); it does NOT itself trigger a scan. Voice is plain, exact, unhyped — no exclamation marks, no alarm emoji, no "Critical detected!!".

AUDIENCE: BFSI CXOs (NBFC-first) and their Security, Risk & Compliance leaders — an executive, high-trust read that must also land as credibility to technical reviewers. A CXO glances and trusts; a security lead reads restraint as competence. Aesthetic anchors: Palantir Foundry, Bloomberg Terminal, CrowdStrike Falcon. Brand personality: Forensic · Composed · Authoritative · Sharp · Watchful.

STATES: This screen is functionally **static** — no data-loading/empty/error/zero-findings/filtered/mode-variant states (those belong to Processing/Findings/Detail; do NOT add them here). Implement only:
- Default light (default theme) and Default dark (first-class console toggle, respects `prefers-color-scheme`, default light).
- Theme transition (≤200ms ease-out cross-fade; instant under reduced motion).
- CTA hover (`--brand-strong`) / focus (2px brand ring, 2px offset) / active / brief pending-on-navigate (no spinner theatre).
- Reduced-motion: all transitions instant, no load animation.
There is no blank/error path — the page is static brand content; if the glyph fails, the wordmark text alone is sufficient identity.

RESPONSIVE: Desktop-first (the audit workspace lives downstream). Desktop/laptop = as laid out, one screenful, no scroll. Tablet = positioning stays left-aligned; proof strip wraps 3-up or stacks. Mobile = single column stacked (wordmark → H1 → sub-line → full-width CTA → stacked proof → footer); landing stays fully usable as the front door (running an audit on mobile is not a v1 goal, but the CTA still routes). No horizontal scroll; H1 stays the largest element at every breakpoint.

ACCESSIBILITY (WCAG 2.2 AA): One `<h1>` (the one-liner); `<header>`/`<footer>` landmarks; proof strip is a real `<ul>/<li>`; CTA is a real button/link with accessible name "Run an audit". Visible 2px brand focus ring (2px offset) on every interactive element; sticky bar uses `scroll-padding` (2.4.11). Targets ≥44×44 for the CTA; theme toggle/Sign-in ≥24, target 44 (2.5.8). No drag (2.5.7 N/A). Logical DOM order matches visual (H1 before CTA before proof). Contrast: ink-on-bg ≥7:1, muted text ≥4.5:1, white-on-brand ≥4.5:1 — verify both themes with a checker; `--ink-faint` for decoration rules only, never text. Page `lang="en"`; **no Devanagari run on this screen** so no `lang="hi"` spans here (that rule applies on Findings/Detail evidence; romanised Hinglish stays `lang="en"`). Severity colour+label+shape encoding is N/A here (no verdicts on the landing). Honour `prefers-reduced-motion`.

<frontend_aesthetics>
TYPOGRAPHY:
- `--font-sans: "Geist", "Noto Sans Devanagari", sans-serif` for UI, the H1, and body. `--font-mono: "Geist Mono", "Noto Sans Mono", monospace` reserved for the eyebrow, the [01][02][03] proof index, and any evidence/data elsewhere in the console (NONE on this screen beyond the eyebrow/index). Ship `--font-deva: "Noto Sans Devanagari"` as the Devanagari companion for cross-screen parity even though the landing copy is English.
- Type scale (1.20 minor-third, 16px base): 12 / 13 / 14 / 16 / 19 / 23 / 28 / 33 / 40. H1 at step 33–40 with tight tracking; sub-line at 16–19, line-height ~1.55; proof statements at 13–14; eyebrow/index at 12 mono, uppercase, wide tracking. Tabular figures on globally (no figures on this screen, but keep the setting).
- FORBIDDEN: Inter, Roboto, Arial, system-default sans (AI-slop tells). Geist is the serious-software grotesque that carries the brand.

COLOR & THEME (exact CSS variables; light default, dark first-class console):
LIGHT (default):
  --bg #F7F9FB · --surface #FFFFFF · --surface-sunk #EEF2F6 · --border #DCE3EC
  --ink #0F1722 · --ink-muted #586273 · --ink-faint #8A94A3 (NON-TEXT decoration only)
  --brand #1D5BD6 (Azure Cobalt) · --brand-strong #1648A8 · --brand-soft #DBEAFE
DARK (threat-intelligence console):
  --bg #0B0E14 · --surface #141A23 · --surface-sunk #0E131B · --border #232C3A
  --ink #E6EBF1 · --ink-muted #9AA6B6
  --brand #5E9BFF · --brand-strong #3D7DF0 · --brand-soft rgba(93,155,255,.14)
- Implement as a `data-theme`/class toggle persisted by the user; respect `prefers-color-scheme` on first load, default light.
- The CTA is the ONLY use of brand colour on the page (Azure-Cobalt fill). Withhold `--metric` (#818CF8) and ALL semantic severity colours (`--fail #EF4444`, `--warn #D97706`, `--pass #10B981`, severity ramp) — there is no data or verdict on the landing, so "the data is the colour" means colour is *withheld* until there is data. Severity colour is NEVER brand and NEVER decorative.

MOTION (restrained — motion confirms state, never entertains):
- Only two micro-moments here: the theme cross-fade and CTA hover/press, both ≤200ms ease-out. No entrance choreography on load. The one orchestrated "delight" beat in the whole product — the Processing→Findings reveal — does NOT occur on this screen; do not animate the landing in.
- Honour `prefers-reduced-motion` → instant.

BACKGROUNDS / SURFACES:
- Sharp, dense, document-like terminal surfaces. Flat fills (`--bg`, `--surface`); separation via 1px `--border` hairlines and background-shifts, with at most one soft elevation. Radii sharp: `--radius-sm 3px / --radius-md 5px / --radius-lg 8px` (CTA/control ~4–5px, never pill/bubbly).
- Icons: line/outline only, ~1.5px stroke (Lucide or Phosphor) — the radar/scan-sweep sentinel glyph (concentric arcs + sweep line = "actively scanning", offensive — NOT a defensive shield or surveillance eye) and the theme-toggle icon. Never filled/duotone.

CLICHÉS TO AVOID (hard bans):
- Inter/Roboto/Arial/system-font UI. Purple-on-white or any glassy "SaaS hero" gradient. Soft rounded consumer-SaaS shapes. Generic admin layout (left rail + 4 stat cards + chart). Emoji/alarmist iconography. Evenly-distributed rainbow palette / decorative colour. Dark "hacker terminal" gaming aesthetic — NO green-on-black, matrix rain, scanlines, blinking cursor, glow. Lorem ipsum / "Finding 1". Fabricated metrics or any number the engine can't back. The dark theme is Palantir/Bloomberg/CrowdStrike enterprise gravity, never gamer.
</frontend_aesthetics>

OUTPUT: React + Tailwind, a single screen of the multi-screen Sentinx console. Obey the shared design system above (tokens, typography, geometry, motion). Implement the light/dark theme toggle with the exact CSS-variable palette. No external UI kit styling that fights the tokens; line icons only. Deliver clean, semantic, accessible markup (header/main/footer landmarks, real h1, ul/li proof strip, real button/link CTA) ready to drop into the console shell.
