# Sentinx v1 — Screen Spec: Run Config + Approve & Run (C3)

> **Master spec for the Run Config screen and its one-click governance confirmation.** Authoritative parents (this file obeys them; on conflict DESIGN.md wins): `DESIGN.md` (brand, tokens, typography, geometry, voice, a11y, clichés), `DECISIONS.md` (D-Q1…D-Q20 + backend reconciliation), `04-uiux-plan.md` §C3 (screen bones), `BACKEND-UPDATE.md` / `BACKEND-UPDATE-2.md` (real field schema + approval flow). Maps to mapping ID **M1**; owner **P3 (operator)**; watched by P1 (Meera) and P2 (Arjun). Dependency **D1** (engine fixed to AARAV sandbox), **D-Q14** (vision-forward endpoint), **D-Q20** (one-click Approve & run).

---

## 1. Purpose

Let the operator **define the target and start an audit in seconds**, then pass a **single, visible human-in-the-loop governance gate** before the engine executes. Two jobs on one route:

1. **Configure** — a fully-editable, vision-forward "enter any vendor endpoint" form (endpoint, agent name, optional advanced auth/notes). This is the second-run path in a live demo, so it must feel fast and credible (P3), while never *promising* capability the engine can't back (D-Q14).
2. **Approve & run** — the mandatory `POST /scan` → `pending_approval` → `POST /runs/{id}/approve` step (D-Q20), surfaced as a one-click **Rules-of-Engagement confirmation**: governance as a feature, not friction.

**The honesty load lives in the connection-check + error/timeout states.** The engine only executes against the AARAV sandbox (D1); the field presents as general-purpose, so an unsupported/unreachable endpoint must fail *gracefully and specifically* — never a fabricated "connected" result, never a faked run.

**What this screen is NOT:** not a multi-step wizard, not a dashboard, not a place to pick scenarios/modes (the engine selects plays), not real auth (that is C2 Login). No left nav (DESIGN.md §6 — generic-admin cliché). One screenful, no required scroll on desktop.

---

## 2. Layout / bones (regions top → bottom)

Pre-run flow = **wizard-like linear, no global chrome** (04-uiux-plan §A). The page is a single centered column on a quiet canvas; density is instrument-grade but this screen *breathes more* than Findings (it is a focused single-job form, not a data table).

```
▭ TOP BAR (slim, ~56px)  — brand only, returns to Landing pre-run
    · Sentinx wordmark + radar/scan-sweep glyph (left)
    · theme toggle (light default / dark console) (right)
    · NO run reference yet (no run exists), NO account menu clutter

▭ FORM CARD  (centered single column, max-width ~560px, surface card, radius-lg 8px,
              one soft elevation; generous top space above it)
    1. H1  "New audit"                          (28px Geist, tight tracking)
       sub "Point Sentinx at a voice agent endpoint and run a multi-turn red-team audit."
    2. FIELD — Target API endpoint  ★PRIMARY, required
         label "Target API endpoint"  + required mark
         input (mono, Geist Mono — it is a URL/identifier = data)
         placeholder  https://api.vendor.example/v1/voice/agent
         helper "Enter any vendor voice-agent endpoint."   (vision-forward, D-Q14)
         ⤷ inline connection-check status slot (lives directly under field) — see §4
    3. FIELD — Agent name
         label "Agent name"
         input (Geist sans — it is a human label)
         placeholder  VendorBot v2.1
         helper "Shown on the report and in findings."
    4. DISCLOSURE ▸ "Advanced"  (collapsed by default; aria-expanded)
         · Bearer token   (input type=password, mono, optional; "Sent only to the target; never stored.")
         · Notes / Rules-of-Engagement context  (textarea, optional)
    5. SCOPE HELPER LINE (quiet, ink-muted, NOT a field):
         "This run: Security + Compliance · multi-turn Hindi/Hinglish plays · one eval run."
    6. PRIMARY BUTTON  "Run audit"   (full-width within card, brand Azure-Cobalt #1D5BD6)
         — disabled until endpoint is non-empty + syntactically valid
▭ HONEST SUB-NOTE (below card, ink-muted, 13px):
    "Sentinx runs one evaluation run against the configured target. Results persist
     for this session." (no fabricated durability claim)
▭ FOOTER (faint): "Proprietary & confidential · Sentinx red-team console."
```

**Hierarchy (strict):** endpoint field > Run audit button > agent name > everything else. Advanced is hidden because Meera/Arjun rarely touch it; the operator opens it when an endpoint needs auth.

### 2.1 The Approve & Run confirmation (governance gate — D-Q20)

Triggered when "Run audit" succeeds (POST /scan returns `pending_approval`). Rendered as a **modal dialog** over a dimmed form (the form is preserved behind, not destroyed — so a "Cancel" returns to an editable form, not a blank). `role="dialog"`, focus trapped, `aria-modal="true"`, labelled by its H2.

```
▭ APPROVE & RUN  (dialog, max-width ~520px, surface card, radius-lg)
    H2  "Approve & run"
    framing line: "You are about to launch a live red-team audit. Confirm the
                   Rules of Engagement."
    ▭ RoE SUMMARY BLOCK (read-only, mono for the data values):
        Target      <endpoint>                         ← Run.target_url (RoE.target)
        Agent       <agent name>
        Scope       Security + Compliance · multi-turn Hindi/Hinglish
        Data        Synthetic borrower data · sandbox · no real borrower/PII
        Run ref     ER-NN  (pending)                   ← Run.id (pending_approval)
        Authorised  akhil18.mittal@gmail.com           ← becomes Run.approved_by
    ▭ governance note (ink-muted): "Approval is logged to the audit trail."
        (AuditEvent scan.approved — provenance, not a promise of more)
    ▭ ACTIONS:  [ Cancel ]   [ Approve & run ▸ ]  (primary; one click → POST approve → Processing)
```

**One click on "Approve & run"** issues `POST /runs/{id}/approve` and transitions to Processing (C4). This is the only place approval happens; if skipped, the run never executes (poll sits at `pending_approval`, num_attempts=0 — BACKEND-UPDATE-2 §3h).

---

## 3. Components used (from the foundation inventory, DESIGN.md §7)

| Component | Use on this screen |
|---|---|
| **RunProvenance** (partial) | The RoE summary block in the Approve dialog reuses the provenance pattern: target · agent · run ref · authorised-by · scope. Pre-run it shows *pending* values (no IST start/end/duration yet). |
| **EmptyState** | Endpoint field empty → "Run audit" disabled with a quiet helper (not an error). |
| `OutcomeBadge` / `SeverityChip` / `EvidenceBlock` / `ObservationRow` | **Not used here** — no findings exist yet. (Explicitly noted so a builder doesn't import the findings furniture.) |
| New patterns introduced by this screen (promote to inventory) | **`EndpointField`** (mono input + inline connection-check status slot), **`ConnectionStatus`** (the reachable/checking/error/timeout chip + message), **`ApproveRunDialog`** (the RoE governance modal), **`Disclosure`** (the Advanced collapse). |

All inputs, the disclosure toggle, and dialog actions obey the shared geometry (radius-sm 3 / md 5 / lg 8; controls ~4px), line icons (~1.5px stroke, Lucide/Phosphor), and the focus rule (2px brand outline, 2px offset).

---

## 4. States (every state, exhaustive)

The connection-check + error/timeout states **carry the product's honesty** (D-Q14) — spec them precisely.

### Form-level states
| State | Trigger | Render |
|---|---|---|
| **empty** | endpoint blank | "Run audit" disabled; no error styling; helper text only. Other fields optional. |
| **valid (idle)** | endpoint syntactically valid URL | "Run audit" enabled. No network call yet (validation is client-side shape only; reachability is checked on submit). |
| **invalid shape** | endpoint not a URL (e.g. missing scheme) | inline field error under the endpoint field: "Enter a full URL including https://" — `aria-invalid`, error text in `--fail-text` + warning glyph (▲ shape, never colour-only). Button stays disabled. |

### Connection-check states (on "Run audit" submit → POST /scan precheck)
These render in the **ConnectionStatus slot directly under the endpoint field**, `aria-live="polite"`, with a redundant icon/shape per DESIGN.md §5 (never colour-only):

| State | Render | Copy (real, unhyped) |
|---|---|---|
| **checking** | spinner/indeterminate bar (≤200ms ease, reduced-motion → static "Checking…"); button → busy/disabled | "Checking target endpoint…" |
| **reachable** | success tick ✓ (pass token); proceeds automatically to the Approve dialog | "Target reachable. Verified agent endpoint." |
| **error — unreachable** | error disc ● + `--fail-text`; button re-enabled for retry | "Could not reach this endpoint. Check the URL and that the service is running." |
| **error — 401 / auth** | error disc ● + `--fail-text`; auto-expands Advanced (focus → bearer token) | "Endpoint reached but rejected the request (401). Add a bearer token under Advanced." |
| **error — bad endpoint / 404 / wrong shape** | error disc ● | "Reached the host, but no voice-agent endpoint was found at this path." |
| **timeout / slow endpoint** | warn half-disc ◐ + `--warn-text`; a "Retry" affordance | "The endpoint did not respond in time. It may be slow or unavailable — retry, or check the URL." |

> **D1 honesty contract:** because the engine is fixed to AARAV (D1), an unsupported real endpoint surfaces through these error/timeout states — it never returns a fabricated success or a fake finding. The live demo uses the working AARAV endpoint, which returns **reachable**. The copy above is deliberately generic-vendor (vision-forward) while the failure modes stay truthful.

### Approval-flow states
| State | Trigger | Render |
|---|---|---|
| **scan-created → dialog open** | POST /scan → `pending_approval` | Approve & Run dialog mounts; focus moves to the dialog (trapped); RoE summary shows the endpoint/agent + pending `ER-NN`. |
| **approving** | "Approve & run" clicked → POST /runs/{id}/approve | dialog primary → busy ("Starting run…"); not cancellable mid-call. |
| **approved → transition** | approve 200 | unmount dialog → navigate to Processing (C4); the single Processing→Findings reveal is the only orchestrated motion (DESIGN.md §3.4) — this transition is a quiet, instant route change. |
| **approve error** | approve non-200 | inline error inside the dialog (not a new modal): "Could not start the run. Retry, or go back to edit the target." — keeps the dialog so the operator can retry without re-entering the form. |
| **cancel** | "Cancel" / Esc | dialog unmounts; returns to the **editable, preserved** form (values intact); focus returns to "Run audit". |

### Cross-cutting
- **Reduced motion:** spinner → static text; dialog appears instantly; no flourish. (DESIGN.md §3.4)
- **Theme:** renders in the active global theme (light default / dark console). No screen-specific dark treatment; tokens swap only.

---

## 5. Data fields → REAL backend variables

Source of truth: `BACKEND-UPDATE.md` §4 + `BACKEND-UPDATE-2.md` §5 (post-`bad0619` schema). This screen *writes* the run; it reads back the pending run for the dialog.

| UI field / element | Backend variable (exact name) | Source / notes |
|---|---|---|
| Target API endpoint input | `Run.target_url` | BACKEND-UPDATE §4 (`Run`, models.py:24-32). **Reality (D1, fact g):** the engine resolves `target_url` to `settings.aarav_base_url`; the field is vision-forward UI over a fixed sandbox. The connection-check states carry that honesty. |
| RoE.target (dialog) | `Run.roe.target` | BACKEND-UPDATE-2 §5 — new `Run.roe` (JSON); `roe.target` = `s.aarav_base_url` (app.py:113). |
| Agent name | display label (no dedicated column) | Surfaced on report/findings (04-uiux-plan §C5 top bar `ER-01 · VendorBot v2.1`). Carried client-side / in `Run.note` if persisted; **not a fabricated schema field.** |
| Advanced ▸ Bearer token | auth header to target (not stored) | Honesty copy: "Sent only to the target; never stored." Not a persisted `Run` column. |
| Advanced ▸ Notes / RoE context | `Run.note` and/or `Run.roe` (JSON) | `Run.note` (BACKEND-UPDATE §4); `Run.roe` accepts RoE context (BACKEND-UPDATE-2 §5). |
| Scope helper ("Security + Compliance") | derived from `Objective.primary_pillar` distribution | 18 compliance / 4 security objectives (fact d). Not user-selectable; the engine picks plays. |
| Run ref `ER-NN` (pending) | `Run.id` | `Run.status == "pending_approval"` after POST /scan (BACKEND-UPDATE-2 §5). Display ID `ER-NN`; raw `Run.id` (uuid hex) as mono metadata. |
| Run status (gate) | `Run.status` | `pending_approval` → `running` after approve. Poll target `/runs/{id}` (no streaming — fact h). |
| Authorised-by (dialog) | `Run.approved_by` | Set by `POST /runs/{id}/approve` (BACKEND-UPDATE-2 §5). UI shows the operator email `akhil18.mittal@gmail.com`. |
| Approved-at | `Run.approved_at` | Set on approve; not shown pre-approval (no fake timestamp). |
| Governance "logged to audit trail" note | `AuditEvent` (`scan.created`, `scan.approved`) | hash-chained governance log, `event_type ∈ scan.created|scan.approved|...` (BACKEND-UPDATE-2 §5). Surfaced as a one-line provenance reassurance, **not** a full audit viewer (out of v1 scope). |

**Write/flow routes (exact):** `POST /scan` (creates `pending_approval`, returns `Run.id`) → `POST /runs/{id}/approve` (sets `approved_by`/`approved_at`, status → `running`). Poll `GET /runs/{id}` thereafter. (BACKEND-UPDATE-2 §5.)

**Do NOT surface:** scenario/mode pickers, severity, judge config, `verdict_score`, `judge_votes` — none exist pre-run; importing them here would be fabricated precision (DESIGN.md §4, §6).

---

## 6. Content / microcopy (real, verdict-register voice — no lorem)

All copy is plain, exact, unhyped (DESIGN.md §4). No exclamation marks, no emoji affordances, no "Critical!! 🔴".

- **H1:** `New audit`
- **Sub:** `Point Sentinx at a voice agent endpoint and run a multi-turn red-team audit.`
- **Endpoint label:** `Target API endpoint` · placeholder `https://api.vendor.example/v1/voice/agent` · helper `Enter any vendor voice-agent endpoint.`
- **Agent label:** `Agent name` · placeholder `VendorBot v2.1` · helper `Shown on the report and in findings.`
- **Advanced toggle:** `Advanced` → `Bearer token` (`Sent only to the target; never stored.`) · `Notes / Rules of Engagement`
- **Scope helper:** `This run: Security + Compliance · multi-turn Hindi/Hinglish plays · one eval run.`
- **Primary button:** `Run audit`
- **Honest sub-note:** `Sentinx runs one evaluation run against the configured target. Results persist for this session.`
- **Connection-check copy:** exactly as the table in §4 (reachable / unreachable / 401 / 404 / timeout).
- **Approve dialog H2:** `Approve & run` · framing `You are about to launch a live red-team audit. Confirm the Rules of Engagement.` · governance note `Approval is logged to the audit trail.` · actions `Cancel` / `Approve & run`.

### The canonical example (DESIGN.md §8) — where it appears on THIS screen
Run Config is pre-run, so the **F-COM-03 evidence does not render here** (no findings exist — that would be fabricated). It belongs on Findings/Detail (C5/C6). Its role on this screen is **forward-reference only**, to keep the demo coherent:

- The **agent name** the operator types in the golden-path demo is `VendorBot v2.1` (matches the run reference `ER-01 · VendorBot v2.1` that later appears on Findings).
- The **scope helper** truthfully names the duties the F-COM-03 / F-SEC-02 pair will be graded against: *Security + Compliance*.
- A builder must **not** seed any sample finding, score, or the `"Agar payment nahi ki toh legal notice bhejenge."` line on this screen — it has no source yet. (The Hinglish coercion example is reserved for the evidence surfaces.)

---

## 7. Accessibility notes (WCAG 2.2 AA — DESIGN.md §5)

- **Contrast:** all body/label/helper text uses `--ink` / `--ink-muted` (≥4.5:1); `--ink-faint` only for the footer rule/decoration, never readable text. Error text uses `*-text` tokens (`--fail-text #C5302A`, `--warn-text #B45309`) — AA on white. Re-verify with a checker, not by eye.
- **Connection status is never colour-only (§5 fixed encoding):** reachable = ✓ check; error = ● solid disc; timeout = ◐ half-disc — each paired with its label and message. The four-reds rule is moot here (no severity), but the redundant-channel discipline still applies to pass/error/timeout.
- **2.4.11 Focus Not Obscured:** the slim top bar is short; the form scrolls under it with `scroll-padding-top` so a focused field is never hidden. The Approve dialog traps focus, so nothing focusable sits behind it.
- **2.5.8 Target Size:** all inputs, the Advanced toggle, and dialog buttons ≥ 44×44px (min 24×24 hard floor). The disclosure chevron hit-area spans the full toggle row.
- **2.5.7 Dragging Movements:** nothing on this screen requires drag.
- **Focus visible:** 2px brand (`--brand`) outline, 2px offset, on every input, toggle, link, and button — both themes.
- **Keyboard path:** Tab order = endpoint → agent → Advanced toggle → (when open) bearer → notes → Run audit. Enter on a valid form submits. In the dialog: Cancel / Approve reachable by Tab; Esc = Cancel; Enter on the focused primary = Approve. Full keyboard path through config → approve → Processing (DESIGN.md §5).
- **Live regions:** `aria-live="polite"` on the ConnectionStatus slot and on the run-status/approve result so SR users hear "Checking…", "Target reachable", "Starting run…".
- **Semantics:** `<form>` with associated `<label for>`; required endpoint via `aria-required`; errors via `aria-invalid` + `aria-describedby` pointing at the inline message. Advanced collapse uses `aria-expanded`/`aria-controls`, focus stays on the toggle. Dialog = `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (the H2). Headings in order (single H1; dialog H2).
- **Language (bilingual model):** this screen's chrome is English (`lang="en"`); there is **no Devanagari content** here, so no `lang="hi"` spans (those are reserved for evidence surfaces). The type stack still carries Noto Sans Devanagari so any vendor agent name containing Devanagari renders without tofu.
- **Reduced motion:** honoured — spinner degrades to static "Checking…"; dialog appears instantly (DESIGN.md §3.4).

---

## 8. Responsive intent (desktop-first — 04-uiux-plan §E)

- **Desktop / laptop (primary):** centered ~560px form on the canvas; one screenful, no required scroll; the Approve dialog centers over the dimmed form.
- **Tablet:** form fills a comfortable column (~88% width, max 560px); dialog becomes near-full-width with margins; touch targets ≥ 44px.
- **Mobile (read-only degradation):** running an audit on mobile is **not a v1 goal** (P3 demos on a big screen). The form may render but is de-emphasised; the screen stacks single-column, the dialog becomes a full-height sheet. No horizontal scroll. (The PDF covers true on-the-go needs.)

---

## 9. Disposition of the remaining WCAG 2.2 AA SC (per DESIGN.md §5 requirement)

| SC | Disposition on this screen |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | **Applicable** — `scroll-padding-top` for the sticky top bar; dialog traps focus. |
| 2.4.12 Focus Not Obscured (Enhanced) | Applicable — same mechanism satisfies the enhanced bar (nothing overlaps a focused control). |
| 2.4.13 Focus Appearance | Applicable — 2px outline + 2px offset meets the area/contrast minimum. |
| 2.5.7 Dragging Movements | **N/A-because** no drag interaction exists. |
| 2.5.8 Target Size (Min) | **Applicable** — all controls ≥ 24×24 (we target ≥ 44). |
| 3.2.6 Consistent Help | Applicable — helper text + the honest sub-note are in a consistent location across the pre-run flow. |
| 3.3.7 Redundant Entry | **Applicable** — endpoint/agent values are preserved across the Approve→Cancel round-trip (no re-entry). |
| 3.3.8 Accessible Authentication (Min) | **N/A-because** real auth is C2 Login; the optional bearer token is paste-able (no cognitive test, no transcription puzzle). |
| 3.3.9 Accessible Authentication (Enhanced) | N/A-because — same as above. |
