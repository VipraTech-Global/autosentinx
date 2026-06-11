# Claude Design prompt — Sentinx Login (C2)

> Paste-ready. One screen of the multi-screen **Sentinx** console. Obeys `DESIGN.md` + `DECISIONS.md` + spec `spec/login.md`. Output: **React + Tailwind**, single screen, shared design system.

---

GOAL: Build the **Login** screen for Sentinx — a cosmetic, single-tenant gate (NOT real auth) into a BFSI-grade security & compliance audit console. A centered card with the Sentinx wordmark, an email field, an access-code field, and one "Sign in" action that transitions the operator into the audit flow.

LAYOUT: Single centered card on the app canvas, no top bar and no nav (this is a pre-run, wizard-style screen with no global chrome). Card max-width 400px, sharp 8px corners, 1px border, one soft elevation, 32px internal padding. Regions top→bottom inside the card: (1) brand block — radar/scan-sweep sentinel mark + "Sentinx" wordmark (Geist, tight tracking) + one quiet sub-line "Security & compliance audit console"; (2) form — Email label+input, Access code label+input, a reserved inline-error slot, then a full-width "Sign in" primary button; (3) a quiet demo-access hint. Below the card: a small centered confidential footer line. Top-right of the viewport: an icon-only light/dark theme toggle (the only chrome). Dense, sharp, instrument-grade geometry — controls at 3–4px radius, never pill/bubbly. Vertically and horizontally centered on desktop; near-full-width card on mobile.

CONTENT (exact copy — plain, unhyped, no emoji, no marketing):
- Wordmark: `Sentinx`
- Brand sub-line: `Security & compliance audit console`
- Email — label `Email`, placeholder `you@yourbank.com`
- Access code — label `Access code`, password field (dots), no placeholder
- Primary button: `Sign in` (default) / `Signing in…` (submitting)
- Inline error (invalid email only): `Enter the email address provided for this session.`
- Demo-access hint: `Demo access — use the credentials provided for this session.`
- Footer: `Sentinx — confidential. Authorized use only.`
- NO finding/evidence content on this screen. This is the only Sentinx screen with no backend data — do NOT render transcripts, severity chips, scores, the F-COM-03 coercion example, or any Hindi/Devanagari text here; all evidence content lives on Findings/Detail/PDF. There is no auth backend, so NEVER show a "wrong password / invalid credentials / session expired / locked out" error — the only validation is a basic email-shape check.

AUDIENCE: BFSI CXOs and their Security / Risk / Compliance leaders (NBFC-first), plus a Sentinx operator driving a live demo. Must read as credible single-tenant enterprise SaaS in the first 5 seconds — composed and authoritative, not playful.

STATES:
- **Default / idle:** both fields empty, no error rendered (error slot reserved so layout never jumps), "Sign in" enabled, email field autofocused.
- **Invalid:** only on an email that fails a basic shape check — inline error appears in the reserved slot (`role="alert"`), email field gets an error border + a line warning triangle (▲) + the error text (colour AND icon AND text, never colour alone). No modal. Access code is never validated (no auth), so a wrong code produces no error.
- **Submitting:** valid submit → button shows "Signing in…" with a restrained inline indeterminate indicator, button disabled + `aria-busy`, fields read-only, ~700ms cosmetic delay (no network), then routes to Run Config.
- **Success:** route forward to the Run Config screen (no toast, no interstitial).
- N/A here (state so for the system): empty / loading-data / zero-findings / filtered / engine-error / oracle mode-variants — none apply; this screen has no data and no run.

RESPONSIVE: Desktop-first — card centered ~400px wide. Tablet — same centered card, 24px canvas padding. Mobile — read-friendly: card goes near-full-width with 16px gutters, inputs and button stay ≥44px tall; signing in to read results on mobile is supported (running an audit is not a mobile goal).

ACCESSIBILITY (WCAG 2.2 AA): real `<form>` with labelled inputs (`autocomplete="username"` / `current-password`); visible 2px brand focus ring at 2px offset on every interactive element; tab order email → access code → Sign in → theme toggle, no focus trap; targets ≥44px (toggle ≥44×44, well over the 24×24 floor); invalid email uses `aria-invalid` + `aria-describedby` to a `role="alert"` live region and is conveyed by colour + ▲ icon + text; submitting uses `aria-busy` + visible label; honor `prefers-reduced-motion` (no spin, instant theme switch); `lang="en"` (no Devanagari on this screen); re-verify text/brand contrast in BOTH light and dark with a checker.

<frontend_aesthetics>
This is one screen of a dual-theme, BFSI-grade **threat-intelligence & compliance audit console** — the "calm instrument" register of Palantir Foundry / Bloomberg Terminal / CrowdStrike, NOT a marketing site and NOT a hacker toy. Light is the default "daylight console"; dark is a first-class "war-room" toggle. Both are sharp, dense, and document-precise. Login is the one composed, quiet screen — restraint is the whole point.

TYPOGRAPHY
- UI / headings / body / labels / button: **Geist** (`"Geist", "Noto Sans Devanagari", sans-serif`). Tight tracking on the wordmark. Tabular figures available but unused here.
- **Geist Mono** is reserved EXCLUSIVELY for evidence/data (transcripts, IDs, scores) elsewhere — it does NOT appear on this screen. No mono on Login.
- **Noto Sans Devanagari** is the companion for Hindi/Hinglish evidence — also not on this screen (no Hindi here).
- ABSOLUTELY NO Inter, Roboto, Arial, or system-default sans — these are AI-slop tells and are banned.

COLOR & THEME (exact CSS variables — semantic colour is reserved for severity/outcome, which does NOT appear here; this screen is almost entirely neutral + one brand accent on the button):
Light (default):
  --bg #F7F9FB; --surface #FFFFFF; --surface-sunk #EEF2F6; --border #DCE3EC;
  --ink #0F1722; --ink-muted #586273; --ink-faint #8A94A3 (non-text decoration only — never label/placeholder text);
  --brand #1D5BD6 (Azure Cobalt — the "Sign in" fill, links, focus ring); --brand-strong #1648A8 (hover/pressed); --brand-soft #DBEAFE;
  error-only accent (email-shape error): --fail-text #C5302A (text/border) — the ONLY semantic colour permitted, and only in the invalid state, always paired with a ▲ icon + text.
Dark (first-class toggle):
  --bg #0B0E14; --surface #141A23; --surface-sunk #0E131B; --border #232C3A;
  --ink #E6EBF1; --ink-muted #9AA6B6; --brand #5E9BFF; --brand-strong #3D7DF0; --brand-soft rgba(93,155,255,.14);
  dark error text ≈ #F0857A.
Brand = Azure Cobalt #1D5BD6 only. Severity owns red/amber/green elsewhere; brand is NEVER a severity colour, and no severity colour appears on Login except the single cosmetic email-error tint.

MOTION
- Restrained, functional only (≤200ms, ease-out). The single orchestrated "delight" beat of the product is the Processing→Findings reveal — NOT this screen. Here: a quiet button state change into "Signing in…" with a thin indeterminate indicator, and an instant theme switch.
- Honor `prefers-reduced-motion`: no spinner animation (static "Signing in…"), no theme-toggle transition.

BACKGROUNDS / SURFACES
- Flat, sharp, document-like. Solid `--bg` canvas, solid `--surface` card, 1px `--border`, ONE soft elevation on the card. Separation comes from borders + background-shift, not heavy shadows.
- NO gradients (especially no purple-on-white SaaS-hero gradient), NO glassmorphism/blur, NO rounded soft-SaaS bubbles.
- NO hacker/terminal tells in either theme: no green-on-black, no matrix rain, no blinking cursor, no scanlines, no neon glow. The dark theme is enterprise war-room (Palantir/CrowdStrike), not gamer.

CLICHÉS TO AVOID (explicit): Inter/Roboto/Arial or system fonts; purple-or-any gradient on white; glassy SaaS-hero backgrounds; soft rounded pill/bubble controls; generic admin-template look; emoji as UI; matrix/terminal/hacker-green tells; a fake "invalid credentials" auth error (there is no auth); decorative use of colour (colour here earns its place only on the brand button and the single cosmetic error).
</frontend_aesthetics>

OUTPUT: React + Tailwind, one screen of the multi-screen Sentinx console. Use CSS variables / a Tailwind theme extension for the tokens above (light default, class-based dark toggle). Custom components (no rounded shadcn defaults) — sharp radii (card 8px, controls 3–4px), line icons (Lucide, ~1.5px stroke). Obey the shared Sentinx design system.
