# Claude Design prompt — Sentinx Run Config + Approve & Run (C3)

> Paste-ready. One screen of the multi-screen Sentinx console. Obeys the shared Sentinx design system (DESIGN.md tokens, DECISIONS.md D-Q1…D-Q20). Master spec: `design/spec/run-config.md`.

---

GOAL: Build the **Run Config** screen for Sentinx — a fully-editable, vision-forward "enter any vendor endpoint" form (target endpoint, agent name, collapsed Advanced auth/notes, "Run audit") that, on submit, runs a connection check and then opens a one-click **"Approve & run"** Rules-of-Engagement governance confirmation before processing starts. This is the operator's launch screen in a BFSI-grade red-team console.

LAYOUT: Single centered column on a quiet canvas; instrument-grade but focused (a form, not a data table) — no left nav, no dashboard cards. Regions top→bottom: (1) **slim top bar** (~56px) — Sentinx wordmark + radar/scan-sweep glyph on the left, light/dark theme toggle on the right, nothing else (no run reference yet, no account clutter); (2) **centered form card** (max-width ~560px, surface card, 8px radius, one soft shadow) containing, in this priority order — H1 "New audit" + sub-line; **Target API endpoint** field (PRIMARY, required, mono input) with an inline connection-status slot directly beneath it; **Agent name** field; a collapsed **▸ Advanced** disclosure (bearer token + notes); a quiet scope helper line; a full-width primary **"Run audit"** button (disabled until the endpoint is a valid URL); (3) an **honest sub-note** below the card; (4) a **faint footer** (confidential line). Strict hierarchy: endpoint field > Run button > agent name > everything else. Dense, sharp-edged, terminal-precise geometry — never soft/rounded SaaS.

CONTENT (exact copy + real data — no lorem, no fabricated findings):
- H1: `New audit`  · sub: `Point Sentinx at a voice agent endpoint and run a multi-turn red-team audit.`
- Endpoint label `Target API endpoint` (required) · placeholder `https://api.vendor.example/v1/voice/agent` · helper `Enter any vendor voice-agent endpoint.` (mono input — it's a URL/identifier = data).
- Agent label `Agent name` · placeholder `VendorBot v2.1` · helper `Shown on the report and in findings.` (sans input — it's a human label). Use `VendorBot v2.1` as the demo value so it matches the later run reference `ER-01 · VendorBot v2.1`.
- `▸ Advanced` (collapsed by default): `Bearer token` (password input, helper `Sent only to the target; never stored.`) and `Notes / Rules of Engagement` (textarea). Optional.
- Scope helper (quiet, ink-muted, not a field): `This run: Security + Compliance · multi-turn Hindi/Hinglish plays · one eval run.`
- Primary button `Run audit`.
- Honest sub-note: `Sentinx runs one evaluation run against the configured target. Results persist for this session.`
- Footer: `Proprietary & confidential · Sentinx red-team console.`
- **Connection-check status copy** (renders in the slot under the endpoint, with a redundant icon/shape, never colour-only): checking → `Checking target endpoint…`; reachable → `Target reachable. Verified agent endpoint.` (✓); unreachable → `Could not reach this endpoint. Check the URL and that the service is running.` (●); 401 → `Endpoint reached but rejected the request (401). Add a bearer token under Advanced.` (auto-opens Advanced, focuses bearer); 404/bad path → `Reached the host, but no voice-agent endpoint was found at this path.`; timeout → `The endpoint did not respond in time. It may be slow or unavailable — retry, or check the URL.` (◐ + Retry).
- **Approve & Run dialog** (modal over the dimmed, preserved form): H2 `Approve & run`; framing `You are about to launch a live red-team audit. Confirm the Rules of Engagement.`; a read-only RoE summary block (mono for the data values) —
    `Target     https://api.vendor.example/v1/voice/agent`
    `Agent      VendorBot v2.1`
    `Scope      Security + Compliance · multi-turn Hindi/Hinglish`
    `Data       Synthetic borrower data · sandbox · no real borrower/PII`
    `Run ref    ER-01  (pending)`
    `Authorised akhil18.mittal@gmail.com`
  ; governance note `Approval is logged to the audit trail.`; actions `Cancel` and primary `Approve & run` (one click → starts processing).
- **Do NOT** put any sample finding, score, or the F-COM-03 Hinglish coercion line on this screen — it is pre-run; no evidence exists yet (fabricated precision is banned). The F-COM-03 / F-SEC-02 example belongs to the Findings/Detail screens; here it appears only implicitly via the `VendorBot v2.1` agent name and the `Security + Compliance` scope it will be graded against.

AUDIENCE: BFSI CXOs and their Security / Risk / Compliance leaders (NBFC-first); driven live by the Sentinx operator. Executive, high-trust read; the governance/Approve step must feel like a credibility feature (human-in-the-loop Rules of Engagement), not friction. Regulator-credible, forensic, composed — never alarmist, never gamified.

STATES: **empty** (endpoint blank → "Run audit" disabled, helper only, no error styling); **valid/idle** (valid URL → button enabled, no network call yet); **invalid shape** (not a URL → inline field error `Enter a full URL including https://`, ▲ + `--fail-text`, aria-invalid); **connection-check: checking / reachable / error-unreachable / error-401 / error-404 / timeout** (copy above; reachable auto-advances to the dialog); **scan-created** (POST /scan → pending_approval → Approve dialog opens, focus trapped); **approving** (primary → busy `Starting run…`); **approved** (→ navigate to Processing); **approve-error** (inline error inside the dialog `Could not start the run. Retry, or go back to edit the target.` — keep the dialog); **cancel** (Esc/Cancel → return to the editable, value-preserved form, focus back on "Run audit"). The connection-check + error/timeout states carry the product's honesty: an unreachable endpoint fails gracefully and specifically — never a fabricated "connected" or a faked run.

RESPONSIVE: Desktop-first (~560px centered form, one screenful, no required scroll; dialog centers over the dimmed form). Tablet: form ~88% width (max 560px), dialog near-full-width with margins, touch targets ≥44px. Mobile: read-only degradation — running an audit on mobile is not a goal; stack single-column, dialog becomes a full-height sheet, no horizontal scroll.

ACCESSIBILITY (WCAG 2.2 AA): connection status is colour + label + shape, never colour-only (✓ reachable / ● error / ◐ timeout); visible focus ring (2px brand outline, 2px offset) on every control; targets ≥44×44px; `<form>` with `<label for>`, `aria-required` on endpoint, `aria-invalid`+`aria-describedby` on errors; Advanced uses `aria-expanded`/`aria-controls` (focus stays on the toggle); dialog is `role="dialog"` `aria-modal="true"` `aria-labelledby` (H2) with trapped focus and Esc=Cancel; `aria-live="polite"` on the connection-status slot and approve result; `scroll-padding-top` so the sticky top bar never obscures a focused field; chrome is `lang="en"` (no Devanagari content on this screen — but keep the Noto Sans Devanagari fallback so a Devanagari agent name never tofus); reduced-motion → spinner becomes static "Checking…", dialog appears instantly. Values are preserved across the Approve→Cancel round-trip (no redundant re-entry).

<frontend_aesthetics>
TYPOGRAPHY:
- `--font-sans: "Geist", "Noto Sans Devanagari", sans-serif` for all UI, headings, labels, body, button text.
- `--font-mono: "Geist Mono", "Noto Sans Mono", monospace` for **data-as-text only**: the endpoint input value, the bearer token input, and the RoE summary values (Target / Run ref ER-01 / endpoint). Mono is the forensic signal — reserve it for data, not for prose or labels.
- `--font-deva: "Noto Sans Devanagari"` companion in the stack (no Hindi content on this screen, but the fallback must exist).
- Type scale (1.20 minor third, 16px base): H1 ~28px tight tracking; sub ~16px; labels/helpers 13–14px; tabular figures on for any numerics. BAN Inter / Roboto / Arial / system-default sans (AI-slop tells).

COLOR & THEME (exact CSS variables; light default + first-class dark console; semantic colour reserved for outcome/severity — here only pass/error/timeout earn colour):
LIGHT (default):
  --bg #F7F9FB; --surface #FFFFFF; --surface-sunk #EEF2F6; --border #DCE3EC;
  --ink #0F1722; --ink-muted #586273; --ink-faint #8A94A3 (non-text decoration only);
  --brand #1D5BD6 (Azure Cobalt — primary "Run audit"/"Approve & run", links, focus ring; NEVER severity);
  --brand-strong #1648A8 (hover/press); --brand-soft #DBEAFE (subtle container/hover);
  --fail #EF4444 / --fail-text #C5302A (error states); --warn #D97706 / --warn-text #B45309 (timeout);
  --pass #10B981 / --pass-text #047857 (reachable ✓).
DARK (first-class toggle, threat-intelligence console — Palantir/Bloomberg/CrowdStrike register):
  --bg #0B0E14; --surface #141A23; --surface-sunk #0E131B; --border #232C3A;
  --ink #E6EBF1; --ink-muted #9AA6B6; --brand #5E9BFF; --brand-strong #3D7DF0;
  --brand-soft rgba(93,155,255,.14); semantic re-tinted lighter to hold ≥4.5:1 on #141A23
  (fail ≈ #F0857A, warn ≈ #E0A93B, pass ≈ #5CC08A). Severity/semantic colour appears ONLY on a real
  status (reachable/error/timeout) — never as ambient glow.
The brand Azure-Cobalt #1D5BD6 is the single disciplined accent; neutrals carry the canvas ("the data is the colour"). Re-verify every colour at AA.

GEOMETRY & DENSITY: sharp/terminal-precise radii — `--radius-sm 3px` (chips), `--radius-md 5px`, `--radius-lg 8px` (the form card + dialog); controls ~4px. 4px spacing scale (4 8 12 16 24 32 48). One soft elevation on the card/dialog; otherwise borders + background shifts (not heavy shadows) for separation. Line/outline icons only, ~1.5px stroke (Lucide or Phosphor) — never filled/duotone; the connection-status ✓/●/◐ are shape-bearing, not decorative.

MOTION (restrained — DESIGN.md §3.4): the single orchestrated "delight" beat in this product is the Processing→Findings reveal, which is NOT on this screen — so here motion is purely functional and ≤200ms ease-out: the connection-check spinner, the Advanced disclosure expand, the dialog mount. Respect `prefers-reduced-motion` (spinner→static text, dialog→instant). No bounce, no attention-seeking animation.

BACKGROUNDS: flat, sharp, dense enterprise surfaces; quiet light canvas (#F7F9FB) or near-black layered dark (#0B0E14/#141A23). NO gradients, NO glassmorphism, NO purple-on-white SaaS hero, NO matrix/terminal tells (no green-on-black, no blinking cursor, no scanlines). The dark theme is a composed war-room console, not a hacker toy.

CLICHÉS TO AVOID: Inter/Roboto/Arial or system-default fonts; purple or any gradient on white; glassy SaaS hero; soft rounded "friendly SaaS" cards; generic admin template (left rail + stat cards + bland chart); emoji as UI affordances; alarmist iconography; evenly-distributed rainbow palette / decorative colour; green-on-black hacker-terminal aesthetic; lorem ipsum or "Field 1 / Finding 1" placeholders; fabricated metrics or precision the engine can't back.
</frontend_aesthetics>

OUTPUT: React + Tailwind — one screen of the multi-screen Sentinx console (the Run Config screen plus its Approve & Run modal). Implement the design tokens above as CSS variables / a Tailwind theme extension; support the light/dark toggle; obey the shared design system. Wire the form → connection-check → POST /scan (pending_approval) → Approve & Run dialog → POST /runs/{id}/approve → Processing route. No backend mocks beyond the state stubs needed to demonstrate every state listed above.
