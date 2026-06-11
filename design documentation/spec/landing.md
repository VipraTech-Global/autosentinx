# Sentinx v1 — Screen Spec: Landing (C1 · M12 · P3)

> **Master spec for the Landing screen.** Authoritative parents (obey exactly, in this order of precedence): `DESIGN.md` (brand, tokens, typography, geometry, voice, a11y, clichés) → `DECISIONS.md` (D-Q1…D-Q20, locked) → `04-uiux-plan.md` §C1 (bones) → `BACKEND-UPDATE.md` / `BACKEND-UPDATE-2.md` (real field schema). Where this spec and a parent conflict, the parent wins. This is *structure + states + content + a11y* for one screen of the multi-screen Sentinx console; styling values are quoted from `DESIGN.md §3`.

---

## 1. Purpose

Establish Sentinx as **serious, forensic security tooling in ~5 seconds** and route the operator (persona **P3**) into the audit with **one** decision. The landing is the credibility frame for two readers at once: the **BFSI CXO / Security-Risk-Compliance buyer** (must glance and trust), and the **technical reviewer** (must read restraint as competence). It does *one job*: positioning → a single "Run an audit" CTA. No marketing, no scroll, no second path.

**Brand job (DESIGN.md §1):** Forensic · Composed · Authoritative · Sharp · Watchful. The landing must *feel* like the cover of an instrument, not a SaaS marketing hero. Restraint **is** the pitch — "proof, not promises."

**One screenful, no scroll required** (04-uiux-plan §C1). If viewport is short, the proof strip + footer compress, never the positioning + CTA.

---

## 2. Layout / bones (regions top → bottom)

Single column, **left-aligned**, generous top space. Dense/sharp geometry (radii 3/5/8; no soft rounded SaaS). One soft elevation max; borders + background-shifts over shadows (DESIGN.md §3.3). NO gradient hero (DESIGN.md §6, §C1).

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▭ R1 — SLIM TOP BAR (full width, sticky, ~56px)                        │
│   left:  [radar mark] Sentinx                 right: [Theme] · Sign in │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ▭ R2 — POSITIONING BLOCK (single column, left-aligned, top space)    │
│     · eyebrow (mono, quiet): SENTINX · THREAT-INTELLIGENCE CONSOLE     │
│     · H1 positioning one-liner (largest type on screen)                │
│     · sub-line: what it does, for whom (one sentence)                  │
│     · ▣ PRIMARY CTA  →  "Run an audit"   (the only filled control)     │
│                                                                        │
│   ▭ R3 — PROOF STRIP (quiet, 3 columns desktop / stacked mobile)       │
│     [01] multi-turn Hinglish   [02] security + RBI/   [03] evidence-   │
│          attacks                    DPDP compliance        backed,     │
│                                                            reproducible │
│                                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ ▭ R4 — CONFIDENTIAL FOOTER (full width, quiet, ~1 line)                │
│   "Confidential — Sentinx red-team console. Synthetic data only..."    │
└──────────────────────────────────────────────────────────────────────┘
```

**Region detail**

- **R1 — Slim top bar.** Brand-only chrome (no left nav — adding one is the banned generic-admin cliché, DESIGN.md §6; 04-uiux-plan §A). Left: the **radar / scan-sweep sentinel glyph** (concentric arcs + sweep line = "actively scanning for threats", NOT a shield or eye, DESIGN.md §1/D-Q18) + wordmark "Sentinx" (Geist, tight tracking). Right: **Theme toggle** (light default / dark console, D-Q5/Q6) + a quiet text **"Sign in"** link (the only secondary affordance). Pre-run, the wordmark is brand-only / returns to Landing (04-uiux-plan §A). Sticky with `scroll-padding` so a focused element is never obscured (DESIGN.md §5, WCAG 2.4.11) — though on a one-screenful landing scroll is not expected.

- **R2 — Positioning block.** The hierarchy anchor. Three text lines + one CTA, left-aligned, with generous space above (the page breathes here; everything below is tight). Order = **eyebrow → H1 → sub-line → CTA**. The H1 is the largest type on the screen (scale step 33 or 40, DESIGN.md §3.2, tight tracking). The CTA is the **single filled brand control** on the page — Azure-Cobalt `--brand #1D5BD6` (D-Q7); everything else is text/ghost. This single colored element is the visual gravity well.

- **R3 — Proof strip.** *Quiet* (DESIGN.md §C1: "quiet 3-point proof strip"). Three terse capability statements, equal weight, set in `--ink-muted`, separated by hairline `--border` rules or generous gutters — not cards, not icons-as-decoration (no emoji affordances, DESIGN.md §6). Optional small mono index `[01] [02] [03]` for instrument feel. These are *proof of capability*, not feature bullets — phrased as facts (DESIGN.md §4 voice). Subordinate to positioning + CTA in the hierarchy.

- **R4 — Confidential footer.** One quiet line, `--ink-muted` / `--ink-faint` rule above. The proprietary/confidential + synthetic-data handling line (DESIGN.md §8 handling frame, condensed). No nav, no social, no links farm.

**Hierarchy (explicit, DESIGN.md §C1):** positioning H1 > CTA > sub-line > proof strip > eyebrow/footer. A reader's eye must land on the one-liner, then the CTA, then (only if they linger) the proof.

**Density:** instrument-grade but *this* screen is the one place with deliberate top space (the cover). Below R2 it tightens. One spacing scale (4 8 12 16 24 32 48 64 96, DESIGN.md §3.3); generous rhythm around R2, tight rhythm in R3/R4.

---

## 3. Components used (from the foundation inventory, DESIGN.md §7)

Landing is a **pre-run, chrome-light** screen — it uses very few of the standardised forensic components (those live on Findings/Detail). It uses:

| Component / element | Role on Landing | Source |
|---|---|---|
| **Wordmark + radar mark** | Brand lockup in R1 (and conceptually the page's identity) | DESIGN.md §1, D-Q18 |
| **Theme toggle** | Light/dark console switch in R1 | D-Q5/Q6 |
| **Primary CTA button** (brand-filled) | The single "Run an audit" action → routes to Login/Run Config | New shared control; uses `--brand` |
| **"Sign in" link** | Quiet secondary affordance, R1 right | 04-uiux-plan §C1 |
| **Proof statement (text triplet)** | 3 quiet capability facts, R3 | 04-uiux-plan §C1 |
| **Confidential footer line** | Handling/confidentiality line, R4 | DESIGN.md §8 |

**Not used here** (named so a builder doesn't reach for them): `SeverityChip`, `OutcomeBadge`, `EvidenceBlock`, `TranscriptTurn`, `ObservationRow`, `ScoreRing`, `WithstoodFraction`, `RunProvenance`, `JudgePanel`, `BypassSignal`, `EmptyState`. The landing carries **no live finding data** — see §5.

**CTA routing:** "Run an audit" → **Login** (M13) → Run Config (M1), per the funnel `Landing → Login → Run Config` (04-uiux-plan §A). If an authenticated session already exists, it may skip to Run Config; default cold path is Login. "Sign in" (R1) → same Login screen. (This screen owns only the *intent*; the destination screens own their own specs.)

---

## 4. Data fields mapped to real backend variables

**The Landing screen renders NO backend run data.** It is a static credibility + entry screen (04-uiux-plan §C1: "States: static"). There is no `Run`, `Attempt`, `Turn`, `judge_votes`, or `detector_hits` query on this screen — by design, so it loads instantly and carries no confidentiality exposure.

This is a deliberate mapping decision, recorded so a builder does **not** invent fabricated metrics here (banned, DESIGN.md §6):

| Landing element | Backend source | Decision |
|---|---|---|
| Positioning H1 / sub-line | none (static brand copy) | Hard-coded; the brand one-liner (DESIGN.md §1) |
| Proof strip statements | none (static capability copy) | Hard-coded facts about engine capability; **no live counts, no ASR, no `num_succeeded`** — a marketing number here would be fabricated precision (DESIGN.md §4/§6) |
| "Run an audit" CTA | initiates the flow that later calls `POST /scan` → `pending_approval` → `POST /runs/{id}/approve` (D-Q20, BACKEND-UPDATE-2 §5) | The CTA does **not** call `/scan` itself; it routes to Login → Run Config, where the endpoint is entered and the approval step is surfaced. Landing only opens the funnel. |
| Confidential footer | none (static handling line) | DESIGN.md §8 synthetic-data frame, condensed |

**Why no stats teaser:** every parent forbids fabricated/un-reproducible numbers (DESIGN.md §4 "no fake precision", §6 "fabricated metrics"). Real numbers (`verdict_score`, `asr1`, `num_succeeded`, withstood fractions) exist only *after* a run, on Findings — never pre-run on Landing. The proof strip therefore asserts **capability** ("multi-turn Hinglish attacks"), not **results**.

---

## 5. States

The landing is **functionally static** (04-uiux-plan §C1) — there are no data-loading, zero-findings, filtered, or mode-variant states (those belong to Processing/Findings/Detail). The only legitimate states are presentation/interaction states:

| State | Trigger | Rendering |
|---|---|---|
| **Default (light)** | First load, `prefers-color-scheme: light` or no preference (default light, D-Q6) | Full screen as §2, light tokens |
| **Default (dark console)** | User toggle, or first load with `prefers-color-scheme: dark` (D-Q6) | Same structure, dark "threat-intel console" tokens (§6 below). First-class, not an afterthought |
| **Theme transition** | Theme toggle pressed | ≤200ms ease-out cross-fade of token values; respects `prefers-reduced-motion` → instant (DESIGN.md §3.4) |
| **CTA hover / focus / active** | Pointer/keyboard on "Run an audit" | hover `--brand-strong #1648A8`; visible 2px brand focus ring, 2px offset (DESIGN.md §5); active = pressed |
| **CTA pending (routing)** | CTA pressed, navigating to Login/Run Config | Brief in-button progress/disabled to prevent double-fire; ≤200ms, functional (no spinner theatre). If navigation is instant, this state is skipped |
| **Reduced motion** | `prefers-reduced-motion: reduce` | All transitions instant; no entrance animation on load |

**Explicitly N/A on this screen** (stated so a builder doesn't add them): empty, loading-data, error, zero-findings, filtered, mode-variants (panel / single-judge / fairness), success. Those are **post-run** states owned by Processing / Findings / Observation Detail. The one orchestrated motion moment (Processing → Findings reveal, DESIGN.md §3.4) does **not** occur here.

**No empty/error void risk:** because the page renders only static brand content, there is no failure path that yields a blank screen. (If the brand asset/glyph fails to load, the wordmark text alone is sufficient identity — graceful, never broken.)

---

## 6. Theming (token application)

Both themes first-class (D-Q5/Q6); identical structure, only the skin changes. Exact values from DESIGN.md §3.1.

**Light (default):**
- canvas `--bg #F7F9FB`; the top bar / footer may sit on `--surface #FFFFFF` with a `--border #DCE3EC` hairline.
- H1 / wordmark `--ink #0F1722`; sub-line + proof statements `--ink-muted #586273`; footer `--ink-muted`, rules `--ink-faint #8A94A3` (decoration only, never text).
- CTA fill `--brand #1D5BD6`, hover `--brand-strong #1648A8`, text white. "Sign in" link `--brand`.
- **No** `--metric` (no data viz here). **No** semantic severity colors (no verdicts here) — keeps Azure-Cobalt as the sole accent, reinforcing "the data is the colour" by *withholding* it until there is data.

**Dark (threat-intelligence console):**
- canvas `--bg #0B0E14`; bar/footer `--surface #141A23`, border `--border #232C3A`.
- H1 / wordmark `--ink #E6EBF1`; sub-line + proof `--ink-muted #9AA6B6`.
- CTA fill `--brand #5E9BFF`, hover `--brand-strong #3D7DF0`. Sharp/dense terminal surface — **no gradients, no glass, no hacker-green, no scanlines/matrix/blinking cursor** (DESIGN.md §1 anti-personality, §6, §C4 theme rules). The dark landing reads as Palantir/Bloomberg/CrowdStrike cover, not gamer.

**Backgrounds:** flat, sharp, document-like. Separation via borders + a single soft elevation at most. No gradient hero in either theme (DESIGN.md §6, §C1).

---

## 7. Content / microcopy (real copy — NO lorem, DESIGN.md §6/§8)

All copy below is final/representative and uses the brand's real voice (DESIGN.md §4: plain, exact, unhyped). The landing carries **no finding evidence** (the F-COM-03 example lives on Findings/Detail), so there is no Hindi/Devanagari run on this screen — but the type stack still ships the Devanagari companion for parity, and the brand voice is consistent with the rest of the console.

**R1 — Top bar**
- Wordmark: `Sentinx` (running text form; "SentinX" only inside the rendered mark, DESIGN.md §1).
- Theme toggle: icon-only (line icon, ~1.5px stroke, D-Q17) with accessible label "Switch to dark console" / "Switch to light".
- Secondary link: `Sign in`

**R2 — Positioning**
- Eyebrow (mono, uppercase, quiet): `SENTINX · THREAT-INTELLIGENCE CONSOLE`
- **H1 (the brand one-liner, verbatim, DESIGN.md §1):**
  > **Autonomous red-teaming for Hindi/Hinglish voice AI agents — proof, not promises.**
- Sub-line (what it does, for whom — DESIGN.md §1/§C1; NBFC-first):
  > Sentinx attacks your lender's voice collection agent the way a real adversary would — multi-turn, in Hindi and Hinglish — and shows, with evidence, exactly where it holds and where it breaks.
- **Primary CTA:** `Run an audit`  (single filled brand button; the only CTA on the page)

**R3 — Proof strip** (three terse capability facts; map to 04-uiux-plan §C1 "multi-turn Hinglish attacks · RBI/DPDP compliance + security · evidence-backed"):
- `[01]  Multi-turn Hinglish attacks` — *Adversarial plays in Hindi and Hinglish, not single-prompt probes — the way borrowers are actually pressured.*
- `[02]  Security + RBI/DPDP compliance` — *Every play is judged against guardrail bypass and regulated harm — RBI Fair Practices Code and DPDP, mapped to the clause.*
- `[03]  Evidence-backed, reproducible` — *Each verdict carries the landing exchange, an anonymized judge panel, and detector hits — forensic, timestamped, reproducible.*

> Copy discipline: proof statements assert **capability**, never run results. No numbers (no "1,200 attacks", no ASR %) — that would be fabricated precision pre-run (DESIGN.md §4/§6). "Reproducible" and "evidence-backed" are the proof, consistent with the disclosure rule (landing exchange + evidence only, D-Q12) without exposing method.

**R4 — Confidential footer** (condensed DESIGN.md §8 handling frame + proprietary line):
> Confidential — Sentinx red-team console. Audits run against a controlled sandbox target on synthetic borrower data; no real borrower data or PII is involved. Proprietary attack methodology is not disclosed.

**Tone gate:** no exclamation marks, no "🔴", no "Critical vulnerability detected!!" (DESIGN.md §4). Composed, authoritative, forensic.

---

## 8. Accessibility notes (WCAG 2.2 AA, DESIGN.md §5)

- **Contrast:** H1/wordmark `--ink` on `--bg`/`--surface` ≥ 7:1; sub-line + proof in `--ink-muted` (#586273 light ≈ 5.9:1, #9AA6B6 dark — re-verify ≥4.5:1 on `#141A23` with a checker, not by eye). `--ink-faint` used **only** for non-text rules/dividers (≥3:1 not required for pure decoration; never used for readable text). CTA white-on-`--brand` ≥ 4.5:1 (verify both themes). Re-verify every value with a contrast checker per DESIGN.md §3.1.
- **Severity colour-only rule:** **N/A on this screen** — there is no severity/outcome here, so the redundant-shape encoding table (DESIGN.md §5) does not apply. (Recorded so the audit doesn't flag a missing legend: the landing has no verdicts to encode.)
- **Focus (2.4.7 / 2.4.11):** every interactive element (Theme toggle, Sign in, Run an audit) shows a visible **2px brand focus ring, 2px offset**. Sticky top bar uses `scroll-padding` so a focused control is never obscured (2.4.11) — minimal risk on a one-screen page, still enforced.
- **Target size (2.5.8):** Theme toggle, Sign in, and the CTA are all ≥ 44×44px (the CTA is the most prominent target; the toggle/link meet the ≥24×24 floor and target 44).
- **Dragging (2.5.7):** nothing on this screen requires drag — N/A by construction.
- **Keyboard:** full tab path R1 (mark→theme→sign in) → R2 (CTA) → R3 (no interactive elements) → R4. CTA activates on Enter/Space. Logical DOM order matches visual order (H1 before CTA before proof).
- **Headings / landmarks / semantics:** one `<h1>` = the positioning one-liner; `<header>` (R1) and `<footer>` (R4) landmarks; the CTA is a real `<button>`/`<a>` with an accessible name "Run an audit". Proof strip is a list (`<ul>`/`<li>`) for SR navigation, not divs. No skipped heading levels.
- **Language / bilingual model (DESIGN.md §5):** the landing copy is English — **no Devanagari run on this screen**, so no `lang="hi"` spans are needed here. Document `lang="en"` on the page. (The `lang="hi"` rule applies on Findings/Detail where genuine Devanagari evidence appears; romanised Hinglish stays `lang="en"`. Noted for parity, not exercised here.) The proof-strip word "Hinglish" is an English term and stays untagged.
- **Reduced motion (DESIGN.md §3.4):** theme cross-fade and any CTA micro-state degrade to instant under `prefers-reduced-motion`. No entrance animation on load to degrade.
- **Disposition of the nine WCAG 2.2 SC on this screen:** 2.4.11 Focus Not Obscured — applicable (sticky bar + scroll-padding). 2.5.8 Target Size — applicable (CTA/toggle/link ≥24, target 44). 2.5.7 Dragging — N/A (no drag). 2.4.7 Focus Visible — applicable (ring). 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8/3.3.9 Accessible Authentication — **N/A on Landing** (no help mechanism, no data entry, no auth challenge — those apply on Login/Run Config). Each is dispositioned here so the screen-level audit is complete.

---

## 9. Responsive intent (desktop-first, 04-uiux-plan §E)

- **Desktop/laptop (primary):** as §2. Positioning block left-aligned with generous top space; proof strip in 3 columns; one screenful, no scroll.
- **Tablet:** positioning block retains left alignment; proof strip may wrap to 3-up or stack to a tight vertical list; CTA full prominence. Still one screenful where possible.
- **Mobile (read-only graceful, §E):** single column, stacked: wordmark → H1 → sub-line → CTA (full-width) → proof strip stacked → footer. Running an audit on mobile is not a v1 goal, but the **landing remains fully usable** (it is the front door, not the workspace) — the CTA still routes; downstream Run Config is where the desktop-only expectation lives. No horizontal scroll; type scales down one or two steps but H1 stays the largest element.

---

## 10. Anti-cliché checklist (DESIGN.md §6 — must pass)

- ❌ No Inter/Roboto/Arial — Geist Sans for UI/H1, Geist Mono for the eyebrow/index, Noto Sans Devanagari companion shipped.
- ❌ No gradient hero / glassy SaaS gradient — flat sharp surfaces both themes.
- ❌ No generic admin layout (left-rail + stat cards + chart) — no left nav, no cards, no chart on the landing.
- ❌ No emoji/alarmist iconography — line icons only (radar mark, theme toggle).
- ❌ No rainbow/decorative colour — Azure-Cobalt is the sole accent; severity colours withheld (no data yet).
- ❌ No hacker-terminal green-on-black — dark theme is Palantir/Bloomberg/CrowdStrike console, not gamer.
- ❌ No lorem / "Finding 1" — all copy real, the brand one-liner verbatim.
- ❌ No fabricated metrics — zero numbers on the landing (capability claims only).

---

## 11. Open items / dependencies (none block this screen)

- **Radar/scan-sweep mark** is rendered in the design stage (DESIGN.md §1, D-Q18) — until the final glyph lands, the wordmark text is a sufficient stand-in (graceful, §5).
- No backend dependency: this screen reads no `Run`/`Attempt` data (§4), so D1/D6/D8 etc. do not gate it. It is buildable immediately against the design system.
```
