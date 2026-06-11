# Sentinx v1 — Screen Spec: Login (C2)

> Master spec for the **Login** screen. Authoritative parents: `DESIGN.md` (tokens, type, geometry, voice, a11y), `DECISIONS.md` (D-Q1…D-Q20), `04-uiux-plan.md` §C2, `BACKEND-UPDATE.md` / `BACKEND-UPDATE-2.md` (field schema). When this spec conflicts with `DESIGN.md`, `DESIGN.md` wins.
>
> **Plan ref:** `04-uiux-plan.md` §C2 (Thin Login · owner P3 · M13). **Route:** `/login` (ASSUMPTIONS-LOG A8). **Owner persona:** P3 — Sangram / Akhilesh, operator/demo driver (login is "trivial" for P1/P2).

---

## 1. Purpose & scope

A **cosmetic gate**, not real authentication. Login exists to:

1. Signal "this is real, single-tenant enterprise SaaS" — a credible threshold a CXO expects before a console.
2. Establish the brand surface (wordmark + sentinel mark) in the first 5 seconds of the session, in the active theme.
3. Hand the operator a one-action path into the audit flow with zero friction during a live Google/buyer demo.

**Explicitly NOT in scope (v1):** real auth, sessions, tokens, password reset, SSO, multi-tenant, registration, "remember me", OAuth, MFA. There is **no backend auth endpoint** — the engine is fixed to the AARAV sandbox and exposes only run/catalog routes (`BACKEND-UPDATE.md` §4, `BACKEND-UPDATE-2.md` §5). Submission is a **client-side cosmetic transition** to Run Config (`/new`). This is documented honestly here so no one wires a fake auth claim.

**This screen does NOT touch any backend finding/observation data.** It maps to **zero** real backend variables (see §6). It is the only screen in the inventory with no data dependency — its "honesty load" is simply *not pretending to authenticate*.

---

## 2. Layout & bones (regions top → bottom)

A single centered card on the app canvas. Pre-run flow = **no global chrome** (no top bar, no nav — per IA §A: Landing/Login/Run Config/Processing are a wizard-like linear flow). Density: this is the one **calm, composed** screen — generous around a small, sharp card — but the card itself uses the system's tight radii and aligned fields (it is still an instrument, not a soft SaaS bubble).

```
▭ APP CANVAS (--bg; full viewport; vertically + horizontally centered)
│
│   ▭ CARD  (--surface; max-width 400px; --radius-lg 8px; 1px --border;
│   │        single soft elevation --shadow; internal padding 32px)
│   │
│   │   ▭ BRAND BLOCK (top, left-aligned within card)
│   │   │   · Sentinel mark (radar/scan-sweep glyph) + "Sentinx" wordmark (Geist, tight tracking)
│   │   │   · one quiet sub-line: "Security & compliance audit console"
│   │   │
│   │   ▭ FORM (stacked, single column, 16px field rhythm)
│   │   │   · Field 1 — Email           label + input (type=email, autocomplete=username)
│   │   │   · Field 2 — Access code      label + input (type=password, autocomplete=current-password)
│   │   │   · [inline error region]      (reserved; appears between fields & button on invalid)
│   │   │   · PRIMARY BUTTON — "Sign in"  (full card width, --brand fill)
│   │   │
│   │   ▭ DEMO-ACCESS HINT (bottom, quiet, --ink-muted, 13px)
│   │   │   · "Demo access — use the credentials provided for this session."
│   │
│   ▭ FOOTER LINE (below card, --ink-muted 12px, centered)
│       · "Sentinx — confidential. Authorized use only."
│
│   ▭ THEME TOGGLE (top-right of viewport, icon-only, 44×44 target)
│       · light default / dark console; persists (next-themes). Present so the operator can
│         pre-set the demo skin before entering the flow. The only chrome on this screen.
```

**Hierarchy:** brand block (identity) > email/access-code fields > Sign in > demo hint > footer. The button is the visual anchor (brand fill); everything above it is quiet.

**Geometry (D-Q16):** card `--radius-lg 8px`; inputs and button `--radius-sm 3px` (controls ~4px max — never pill/bubbly). Borders + background-shift for separation, one soft elevation on the card only. No gradient, no glass.

**Responsive (desktop-first; §E):**
- **Desktop / laptop (primary):** card centered in the viewport, ~400px wide, comfortable vertical centering.
- **Tablet:** identical centered card; canvas padding 24px min around it.
- **Mobile:** card goes near-full-width (16px side gutters), still centered vertically if it fits, top-aligned with 48px top space if the keyboard would crowd it. Inputs and button keep ≥44px height. Login is the one pre-run screen that is fully usable on mobile (running an audit is not a mobile goal, but signing in to *read* results is fine).

---

## 3. Components used (from the foundation inventory, §7 DESIGN.md)

Login is deliberately lightweight; it reuses primitives rather than the data-forensic components.

| Component | Role here | Source / notes |
|---|---|---|
| **Wordmark + sentinel mark** | brand block | DESIGN.md §1 / D-Q18 — radar/scan-sweep glyph (offensive "scanning", not shield/eye); renders mono in both themes |
| **TextField** (foundation primitive) | email, access code | label above input; `--radius-sm`; focus ring 2px `--brand` @ 2px offset; error variant uses `--fail-text` + icon, never colour-only |
| **Button / primary** (foundation primitive) | "Sign in" | full card width, `--brand` fill → `--brand-strong` hover/pressed; submitting = inline progress + disabled |
| **InlineError** (foundation primitive) | invalid state | text + warning glyph (▲ line icon), `role="alert"`, lives in reserved region so layout never jumps |
| **EmptyState** | NOT used | no data on this screen |
| **ThemeToggle** | skin switch | line icon (sun/moon), 44×44 target, persisted |

**Not used (and why):** `SeverityChip`, `OutcomeBadge`, `EvidenceBlock`, `TranscriptTurn`, `BypassSignal`, `RegulationCite`, `RunProvenance`, `ScoreRing`, `WithstoodFraction`, `ObservationRow`, `RunStatusLog`, `RoadmapLock` — all carry finding/run data this screen has none of. Pulling any of them in would be decorative (a §6 cliché). The forensic/mono system stays off this screen entirely; this is plain Geist Sans UI.

**Typography on this screen:** all text is `--font-sans` (Geist). **No `--font-mono`** appears — mono is reserved exclusively for evidence/data (D-Q8); there is no evidence here. No Devanagari runs on this screen, so no `lang="hi"` tagging is needed (the engine emits Hinglish only inside transcripts — Findings/Detail/PDF).

---

## 4. States (every state, fully specified)

The plan (§C2) names three: **default · invalid · submitting**. Specified in full below, plus the success transition.

### 4.1 Default (idle)
- Both fields empty, no error region rendered (zero-height, reserved).
- "Sign in" is **enabled** (this is a cosmetic gate — we do not block on empty; pressing with empty fields routes a demo straight through, OR shows the gentle invalid prompt if validation is on — see 4.2 decision). **Decision:** button enabled at all times; client validation runs on submit and shows inline guidance rather than a disabled dead-end, so a demo never stalls on a greyed button.
- Demo-access hint visible. Footer visible. Theme toggle reflects current persisted theme.
- Focus on first load: **email field** (autofocus), so a keyboard/demo user types immediately.

### 4.2 Invalid (cosmetic validation)
- Trigger: submit with an email that fails a basic shape check (no `@`/empty) — the only validation. Access code is **never** validated against a value (there is no auth), so a wrong/empty code does **not** produce an "invalid credentials" error (that would be a fake auth claim). Validation is limited to "this doesn't look like an email."
- Render: **InlineError** appears in the reserved region between the access-code field and the button — `role="alert"`, `aria-live="polite"`. Copy: *"Enter the email address provided for this session."* The email field gets `aria-invalid="true"`, a `--fail-text` border, and a line warning glyph (▲) inside/adjacent — **colour + icon + text**, never colour alone (DESIGN.md §5).
- No modal, ever (plan §C2: "inline error, no modal").
- Recovery: editing the field clears `aria-invalid` and removes the error on next valid submit. Layout does not shift (region was reserved).

### 4.3 Submitting
- Trigger: valid submit.
- Render: button enters progress state — label → "Signing in…", an inline ~1s indeterminate progress (line spinner or a thin progress bar in `--brand`), button `disabled` + `aria-busy="true"`. Fields go read-only for the brief transition.
- Motion: restrained (DESIGN.md §3.4) — ≤200ms button state change; the indeterminate indicator is functional, not decorative. Honors `prefers-reduced-motion` (static "Signing in…" label, no spin).
- This is a **cosmetic delay** (single timeout), tuned ~600–900ms so it reads as "a system did something" without wasting demo seconds. No network call.

### 4.4 Success → transition (not a standing screen state)
- On completion of the submitting timer, route to **Run Config** (`/new`), the operator's actual first job (IA §A: Login ▸ Run Config). No toast, no interstitial.
- The wordmark/brand persists into Run Config's top bar so the transition feels continuous.

### States the plan's global vocabulary lists that are **N/A here** (stated for completeness):
- **empty / zero-findings / filtered / loading-data / error(engine)** — none apply; no data, no run. Documented so a reviewer doesn't expect them.
- **mode-variants (panel / single-judge / fairness)** — N/A; those are oracle-render variants on Findings/Detail only.

---

## 5. Content & microcopy (exact strings)

All copy is plain, exact, unhyped (DESIGN.md §4). No marketing, no exclamation, no emoji.

| Slot | Exact string |
|---|---|
| Wordmark | `Sentinx` (running text form; "SentinX" only inside the rendered mark) |
| Brand sub-line | `Security & compliance audit console` |
| Email label | `Email` |
| Email placeholder | `you@yourbank.com` |
| Access-code label | `Access code` |
| Access-code placeholder | *(empty; password field shows dots)* |
| Primary button (default) | `Sign in` |
| Primary button (submitting) | `Signing in…` |
| Invalid error | `Enter the email address provided for this session.` |
| Demo-access hint | `Demo access — use the credentials provided for this session.` |
| Footer | `Sentinx — confidential. Authorized use only.` |

**Why no real example data here:** the global rule "use the REAL canonical F-COM-03 example, never lorem ipsum" governs **finding/evidence content**. This screen has no findings, transcripts, clauses, or scores — so there is nothing for the F-COM-03 example to populate. Using it here would be fabrication (an `@`-style email is generic chrome, not a fabricated metric). The F-COM-03 coercion example and its paired F-SEC-02 row live where evidence renders: **Findings, Observation Detail, and the PDF** — not the cosmetic gate. (Stated explicitly so the reviewer confirms this is a deliberate omission, not an oversight.)

---

## 6. Data fields → backend variables

**This screen consumes ZERO backend variables.** There is no `Run`, `Attempt`, `Objective`, `Turn`, `judge_votes`, or `detector_hits` read on login (`BACKEND-UPDATE.md` §4). There is **no auth route** in the API surface (`/scan`, `/runs`, `/runs/{id}`, `/runs/{id}/approve`, `/catalog*` — `BACKEND-UPDATE-2.md` §5); none authenticate.

| UI field | Backend variable | Mapping |
|---|---|---|
| Email input | — | **none.** Client-held string; not persisted, not sent. Cosmetic. |
| Access code input | — | **none.** Not validated against any value; not sent. (A real `roe`/`approved_by` actor exists on `Run` — `BACKEND-UPDATE-2.md` §5 — but that is captured at the **approval step** in Run Config, NOT here. Login does not write it.) |
| "Sign in" submit | — | **no network call.** Client-side route transition to `/new`. |

**Honesty note (carries the screen's integrity load):** because there is no real auth, the screen must never display a credential-rejection error ("wrong password / invalid credentials"), a lockout, or a "session expired" — those would assert an auth system the backend does not have. The only error is the cosmetic email-shape hint (§4.2). The human-in-the-loop accountability that *is* real — the `POST /runs/{id}/approve` actor (`approved_by`, D-Q20) — surfaces as the one-click "Approve & run" governance step **in Run Config**, not as a login.

---

## 7. Accessibility notes (WCAG 2.2 AA — DESIGN.md §5)

- **Form semantics:** real `<form>`; each input has an associated `<label>` (`for`/`id`); the form has an accessible name ("Sign in to Sentinx"). `autocomplete="username"` on email, `autocomplete="current-password"` on access code.
- **Focus:** visible 2px `--brand` focus ring at 2px offset on every interactive element (both fields, button, theme toggle). Email autofocused on load. Logical tab order: email → access code → Sign in → demo hint (non-interactive) → theme toggle. **No focus trap** (single card, no modal).
- **2.4.11 Focus Not Obscured:** N/A — no sticky bar on this pre-run screen; nothing overlaps the card.
- **2.5.8 Target Size:** inputs ≥44px tall; "Sign in" ≥44px tall and full-card-width; theme toggle ≥44×44. All exceed the 24×24 minimum.
- **2.5.7 Dragging Movements:** N/A — nothing requires drag.
- **Error handling (3.3.1 / 3.3.3):** invalid email → `aria-invalid="true"` on the field, error text in a `role="alert"` / `aria-live="polite"` region programmatically associated via `aria-describedby`; error identifies the field and suggests the fix ("Enter the email address provided for this session.").
- **Severity/outcome colour rule:** N/A — no severity on this screen. The one error indicator still follows the redundant-channel discipline (colour + ▲ icon + text), never colour-only.
- **Submitting state:** button `aria-busy="true"` + visible "Signing in…" label so AT announces the state change.
- **Contrast:** body/label text uses `--ink` / `--ink-muted` (≥4.5:1 on `--surface`); placeholder uses `--ink-muted` (not `--ink-faint`, which is decoration-only); button label is white on `--brand #1D5BD6` (verify ≥4.5:1; brand-strong on hover). Dark theme uses the measured dark tokens (`--ink #E6EBF1` on `--surface #141A23`, `--brand #5E9BFF`). Re-verify both skins with a checker, not by eye.
- **Language:** page `lang="en"`. No Devanagari runs on this screen → no `lang="hi"` spans needed (the Devanagari/`lang="hi"` discipline applies to transcript evidence on Findings/Detail/PDF).
- **Reduced motion:** `prefers-reduced-motion` → submitting indicator degrades to a static "Signing in…" label; theme toggle is instant.
- **Keyboard path:** full keyboard sign-in (tab to fields, type, Enter submits the form, lands on Run Config with focus moved to its first field). Theme toggle keyboard-operable.

---

## 8. Cross-references

- Parents: `DESIGN.md` (§1 brand, §3 tokens, §4 voice, §5 a11y, §6 clichés), `DECISIONS.md` (D-Q5/Q6 theme, D-Q7/Q7b colour, D-Q8 type, D-Q16 geometry, D-Q17 icons, D-Q18 wordmark, D-Q20 approval-is-in-Run-Config).
- Plan: `04-uiux-plan.md` §A (IA — pre-run wizard, no chrome), §C2 (bones), §E (responsive).
- Backend: `BACKEND-UPDATE.md` §4, `BACKEND-UPDATE-2.md` §5 (confirming **no auth route** exists — the basis for the cosmetic-gate honesty).
- Build: `ASSUMPTIONS-LOG.md` A5 (next-themes), A8 (route `/login`).
- Sibling prompt: `prompts/claude-design/login.md`.
