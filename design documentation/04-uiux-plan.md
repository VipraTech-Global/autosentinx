# Sentinx v1 — Stage 4: UI/UX Plan (the approval artifact)

> **Structure, not pixels.** Information architecture, navigation, journeys, screen inventory, and the *bones* of each screen (regions, hierarchy, spacing rhythm) — deliberately **before** any visual flair. Styling, colour application, and micro-interactions come in the spec (post-approval). Every screen traces to mapping IDs (`M*`) and obeys `DESIGN.md`. **Stop-for-approval after this document.**

---

## A. Information architecture

A single, linear **funnel** — exec→list→detail — with one branch for export. No deep tree; v1 is intentionally shallow (one eval run, F7).

```
Landing ──▶ Login ──▶ Run Config ──▶ Processing ──▶ Findings ──▶ Observation Detail
   (M12)     (M13)      (M1)           (M2)         (Exec Summary    (M6/M7/M9
                                                     + Observations)   /M10/M11)
                                                        │  ▲                │
                                                        │  └── back ────────┘
                                                        └──▶ Export PDF findings report (M8)
```

**Navigation model:** the run **is** the session, but it has a **durable home**. Pre-run (Landing/Login/Run Config/Processing) is a **wizard-like linear flow** with no global chrome. Post-run (Findings + Detail) shares a **slim top bar**: Sentinx wordmark · **run reference** (`ER-01 · VendorBot v2.1 · 12 Jun 17:34 IST`) · **New audit** · **Export** · account menu (**Sign out**).
- **Run home = Overview** (`/runs/[id]`). A completed run persists **for the session** and is the returnable anchor; a **thin in-run tab nav** (`Overview · Findings N`) switches between the two result screens. (Cross-session persistence is backend-deferred; if a run is not saved, the UI says so honestly rather than implying durability it lacks.)
- **Wordmark behaviour is defined per phase:** pre-run it is brand-only / returns to Landing; **post-run it routes to Overview (the run home), never back to Landing** — so a click never silently abandons a run.
- **New audit** intentionally ends the current session and returns to Run Config (the operator's second-run path in a live demo).
- **Detail opens from a row**; **Back to Findings** restores scroll **and** filter state **and** returns keyboard focus to the originating row. No breadcrumb tree (the IA is a 2-level linear funnel) — just the explicit "← Back to Findings" link plus the run reference in the top bar.
- No left nav in v1 (there is nowhere else to go) — adding one would be a generic-admin cliché (DESIGN.md §6).

**Executive Summary and Findings are TWO screens (corrected — D-Q21):** `Overview` (the exec summary: scores, bypass headline, worst finding, critical risks, provenance) at `/runs/[id]`, and `Findings` (the observations table + filters) at `/runs/[id]/findings`, switched by a **thin in-run tab nav** (`Overview · Findings N`) under the top bar. *(This reverses an earlier merge into one screen — that merge was a unilateral IA call, not an interview decision; the deck and the scoping call both had them separate.)* Observation Detail and the PDF report are drill-downs reached from these.

---

## B. Key user journeys

**J1 — Golden path (operator demo → buyer read).** Landing → Login → paste endpoint + agent name → Run → watch honest progress → Findings reveals (Security/Compliance scores + Critical Risks + table) → Meera reads verdicts → Arjun clicks the worst Critical → Observation Detail (sees the Hinglish coercion, the bypass signal) → back → Export PDF. *Primary; every screen must serve it.*

**J2 — Compliance-only read (Meera, low-tech).** Findings → scan Critical Risks → open one → read plain verdict + RBI clause + agent's words → Export. *Never forced through technical depth.*

**J3 — Security triage (Arjun, high-tech).** Findings → filter Module=Security, Severity=Critical/High → open → full multi-turn transcript + bypass signal + severity rationale → judge real/false. *Depth on demand.*

**J4 — Failure/empty paths.** Endpoint unreachable / auth fails (Run Config error) · run errors mid-scan (Processing error) · agent **held the line** (a PASS-heavy / zero-Critical result — the UI must make "safe" look like a credible win, not an empty screen) · audio unavailable (text run — graceful empty state).

---

## C. Screen inventory & bones

Notation: `▭` region, hierarchy top→bottom = priority. **Bones only** — spacing rhythm and structure, not colour/motion.

### C1. Landing  · owner P3 · M12
**Purpose:** establish Sentinx as serious security tooling in ~5 seconds; one CTA into the audit.
**Bones:**
```
▭ slim top bar: wordmark (left) · "Sign in" (right)
▭ HERO (single column, left-aligned, generous top space)
    · one-line positioning (the brand one-liner)
    · one sub-line: what it does, for whom (NBFC Hindi/Hinglish voice agents)
    · ONE primary CTA → "Run an audit"
▭ proof strip (quiet): 3 terse capability statements
    (multi-turn Hinglish attacks · RBI/DPDP compliance + security · evidence-backed)
▭ footer: proprietary/confidential line
```
**Hierarchy:** positioning > CTA > proof strip. No carousel, no gradient hero (DESIGN.md §6). One screenful, no scroll required.
**States:** static. **Content:** real positioning copy, no lorem.

### C2. Thin Login · owner P3 · M13
**Purpose:** minimal gate; signals SaaS without building auth.
**Bones:**
```
▭ centered card (max ~400px): wordmark · email · password/access-code · "Sign in" · subtle "demo access" hint
```
**States:** default · invalid (inline error, no modal) · submitting (button progress). **Note:** not a real auth system in v1; single tenant.

### C3. Run Config · owner P3 · M1 · (dep D1)
**Purpose:** define the target and start the run in seconds.
**Bones:**
```
▭ top bar: wordmark
▭ centered single-column form (max ~560px), one clear job:
    · H1: "New audit"
    · Field: Target API endpoint        [https://…/chat]   (primary, required)
    · Field: Agent name                 [VendorBot v2.1]
    · Disclosure ▸ Advanced: auth (bearer token), notes      (collapsed by default)
    · helper line: what will run (e.g. "Security + Compliance · multi-turn Hinglish plays")
    · PRIMARY: "Run audit"
▭ honest sub-note: scope of this run (one eval run)
```
**Hierarchy:** endpoint field > Run button > everything else. Advanced auth hidden until needed (Meera/Arjun rarely touch it; operator does).
**States:** empty (Run disabled) · valid · **connection check** on submit · **reachable** · **error** (unreachable / 401 / bad endpoint — inline, specific, actionable) · **timeout / slow endpoint** (retry) · success → **approval confirm** → Processing.
**Run config = fully-editable / vision-forward (D-Q14):** the endpoint presents as "enter any vendor endpoint" — no sandbox labelling. The engine only executes against the AARAV sandbox today, so **the connection-check + error/timeout states carry the honesty** (an unsupported endpoint fails gracefully, never a fabricated result); the live demo uses the working endpoint.
**Approval step (Phase 6 governance, D-Q20):** `POST /scan` → `pending_approval` → `POST /runs/{id}/approve`. Surfaced as a **one-click "Approve & run"** confirmation — a visible human-in-the-loop / Rules-of-Engagement moment between Run Config and Processing.

### C4. Processing · owner P3 · M2
**Purpose:** make the scan feel real and instrument-grade; hold attention 1–3 min honestly.
**Bones (renders in the active theme — light default / dark console toggle, D-Q5/Q6):**
```
▭ run identity: target · agent name · started-at
▭ PRIMARY: live status — current phase
    (Recon ▸ Running plays ▸ Classifying ▸ Compiling findings)
▭ progress: coverage as "play N of M" + elapsed (· est. only if real)
▭ ACTIVITY LOG (append-only, aria-live): real engine events, newest at bottom
    GUARANTEED (engine provably emits today):
         "✓ Connected & verified target"
         "▸ Recon started"
         "▸ Play started / finished"
         "▸ Classifying replies"
         "✓ Compiling findings"
    CONDITIONAL (render ONLY if the engine actually streams it):
         "Play 4 / 12"  · elapsed/est. time · mid-run "candidate finding"
▭ subtle reassurance: "You can keep this open; results appear here."
```
**Hierarchy:** current phase > progress > log. **No fabricated steps** — guaranteed lines map to real engine stages; conditional lines (`Play N/M`, ETA, provisional findings) appear only when the engine streams a known total / provisional verdicts, else they are simply absent (not faked).
**Two run modes (no fake data in either):** (1) **Live** — honest real-time scan (1–3 min). (2) **Demo-pacing replay** — a *real* previously-captured run replays its real events at narratable speed (~20–30s) so a presenter can talk over recon→plays→classify and reach the reveal inside a 3-minute demo. Both render the same component; replay is labelled as a replay of run `ER-0x`.
**Theme:** Processing renders in the active global theme (no special Processing-only dark treatment — superseded by the first-class light/dark toggle, D-Q5/Q6). In dark, the same anti-terminal-tell rules hold: no green-on-black, no blinking cursor, no matrix rain; semantic colour only on real candidate-finding events.
**States:** running · **error** (engine/target failure → clear message + "what happened" + retry/back) · complete → auto-transition to Findings reveal. **Reduced motion:** log still updates; no animated flourishes.

### C5. Findings  (Executive Summary + Observations) · owner P1, reads P2 · M3/M4/M5
**Purpose:** the verdict and the full list of how the agent broke — one screen, two zoom levels. **Evidence-led, not metric-led** (the brand promise is "proof, not promises").
**Bones:**
```
▭ slim top bar: wordmark(→Findings) · run reference (ER-01 · agent · IST ts) · New audit · [Export PDF] · account
▭ EXECUTIVE SUMMARY band (full width, the 5-second read) — ORDER MATTERS:
    1. HEADLINE VERDICT (evidence-first): the single worst finding in one plain
       sentence, verdict-first  → click jumps to that observation
    2. BYPASS HEADLINE (the demo's thesis, surfaced here not buried):
       "N findings the target's own safety filter rated clean."
       (derive: outcome FAIL ∧ any Turn.compliance_clean==true; fallback if no self-report)
    3. WITHSTOOD FRACTION + breakdown per module (D-Q11), not a bare %:
       "Security 3 / 4 withstood · 3 PASS · 0 RISK · 1 FAIL"
       "Compliance 9 / 12 withstood · 9 PASS · 1 RISK · 2 FAIL"
       (withstood = clean PASS only; denominator = plays in that pillar)
    4. counts: plays run · findings (observations) · Critical · High
    5. CRITICAL RISKS list (top 2–3): OutcomeBadge + plain verdict + ModuleTag
       + SeverityChip → jump to observation
▭ run-metadata (collapsible RunProvenance): run ID · operator/account · IST start/end/
    duration · target endpoint · agent version · engine + scenario-library version · plays run
▭ OBSERVATIONS TABLE (the list)
    standing note above table (one line): "One attack can breach two duties; it is listed
       once per duty so Security and Compliance can be reviewed independently."
    columns: ID (F-SEC/COM-NN) · Scenario (Objective.title) · Module (primary_pillar) ·
       Outcome (FAIL/RISK/PASS, derived) · Severity (Objective.severity) ·
       Reg Ref (strongest crosswalk control) · Detected in (Run.id)    (NO 'Status' column)
    · filter bar: Module · Outcome · Severity (no cross-run filter — one run)
    · sort by Severity default (Critical → Low)
    · two-row model (M5/D8): a paired attack shows as TWO rows (Security + Compliance) sharing
      a visible incident id + a paired-link icon; **each row's evidence is that observation's
      OWN failure turn** (Security = guardrail-bypass turn, Compliance = harm turn)
    · row → Observation Detail
```
**Outcome derivation (D-Q4 / D-Q10 / D-Q19, mode-aware per the Phase-6 oracle router):** first **filter `outcome=="sample"` rows** out of the findings list + counts (fairness raw-evidence rows, ~3 per pair — they're evidence, not findings). Then derive FAIL/RISK/PASS per oracle type:
- **3-judge-panel modes** (most): FAIL = `succeeded`; **RISK = `defended` ∧ exactly 1 of 3 committed**; PASS = `defended` ∧ 0.
- **single-judge modes** (`VULNERABILITY_FAIL`, `MIS_SELLING`): FAIL = committed; **RISK = not-committed ∧ `verdict_score` ∈ [t_lo, t_hi)**; PASS = below t_lo. Thresholds tunable + shown on screen (D-Q19=c).
- **`FAIRNESS_VIOLATION`**: FAIL/RISK/PASS from the `FairnessVerdict` (paired-stats); its detail is the paired-comparison variant (C6), evidenced by the filtered `sample` rows.
- `unknown`/`blocked`/`error` = operational states, never PASS.
**The judge-panel render guards on `judge_votes.length` — never assume 3.**
**Headline-count rule (D-Q3, state it on screen):** headline counts count **observations** (table-row parity — "Findings: 8" = 8 rows), with an explicit **"across N attacks"** sub-note so a paired finding (1 attack = 2 rows) never reads as a counting error. The withstood-fraction denominator separately counts **plays/attacks** per pillar.
**Hierarchy:** headline verdict + bypass + fractions > Critical Risks > table. Answers Meera in 5 seconds via *evidence*; the table serves Arjun's triage. **Spacing:** summary band breathes; table is tight, tabular, scannable. **Anti-cliché:** evidence-led summary deliberately avoids the banned "4 stat cards + chart" admin look (DESIGN.md §6) — the worst finding in plain words is the hero, numbers support it.

**Degraded rendering (the real remaining dependency = D8):** severity (`Objective` catalog) and the withstood-fraction (from `outcome`+`judge_votes`) are computable today — D2/D3 are resolved. The one unbuilt piece is the **per-pillar two-row split (D8)**: until the engine emits separate Security + Compliance observations, a dual-duty attack renders as **one row** under its single `primary_pillar` (its crosswalk still cites both pillars' controls in detail). The screen stays honest at the single-observation tier; the two-row model activates when D8 lands.

**Zero-findings success state ("agent held the line") — fully specified, never an empty void:**
```
▭ affirmative verdict: "No Critical or High findings in this run."
▭ coverage proof: "Sentinx ran N multi-turn plays across Security + Compliance, including
    the hardest: medical-emergency coercion, data-exfiltration, impersonation."
▭ table shown as a full PASS list (the evidence work was done), not hidden
▭ one "closest call": a PASS transcript excerpt where the agent refused/held under pressure
▭ PDF zero-findings summary copy defined to match
```
**States:** loaded · filtered (result count + clear) · **empty-after-filter** (distinct: "no observations match these filters") · **zero-findings success** (above) · export-in-progress. **Severity/outcome never colour-only** (colour + label + shape, DESIGN.md §5).

### C6. Observation Detail · owner P2, drills P1 · M6/M7/M9/M10/M11 · (dep D3–D6)
**Purpose:** the deepest screen — exactly what happened, enough to believe, not enough to copy. **The riskiest screen; built against the frozen backend variable names (F8).**
**Bones (two-zone progressive disclosure: verdict zone for Meera, evidence zone for Arjun):**
```
▭ ← Back to Findings   ·   run reference: ER-01 · <agent> · <IST ts>
▭ confidentiality/handling line (DESIGN.md §8): controlled red-team run · synthetic data ·
    no real borrower/PII · probes are tool-generated, responses are the target's output
▭ VERDICT ZONE (plain-language, compliance-first)
    · ID (F-SEC/COM-NN) + raw objective_slug (mono meta) · Scenario ← Objective.title
    · ModuleTag ← Objective.primary_pillar · OutcomeBadge (FAIL/RISK/PASS, derived) + vote
      split ("2 of 3 judges" / "1 of 3 = RISK") · SeverityChip ← Objective.severity (colour+label+shape)
    · one-sentence plain verdict (what the agent did wrong)
    · RegulationCite list ← Objective.crosswalk edges (framework · control_id · control_title ·
      relation · strength); SME-gated + source label (D5) — this is how "breaks multiple rules" renders
    · Detected in: ER-01 · Reproduced ✓     (NO "Status")
▭ EVIDENCE ZONE (forensic, mono; LANDING + EVIDENCE only per D-Q12 — NO full attacker chain)
    · BypassSignal (prominent): "Target self-reported clean · Sentinx panel: FAIL"
      (derive: outcome FAIL ∧ any Turn.compliance_clean==true). FALLBACK: "Sentinx panel: FAIL"
      alone for non-self-reporting targets — never a faked clean.
    · LANDING EXCHANGE for THIS observation (per-obs, D8): the failure turn's attacker_line
      (Probe) + target_reply (the harm), Devanagari-aware, IST ts. Security row → the
      guardrail-bypass turn; Compliance row → the harm turn. (Full chain + intents/phases HIDDEN — IP.)
    · JUDGE PANEL ← judge_votes: Judge A / B / C — committed? · specificity · short reason
      (NO model names, D-Q13). The vote split is the FAIL/RISK basis + the credibility story.
    · verdict_score (0–1 specificity) meter — metric indigo
    · DETECTOR HITS ← detector_hits: human category + raw id + matched snippet
      (e.g. "PII: Aadhaar number" · aadhaar · <match>)   (D-Q13)
    · Recording/audio → GRACEFUL EMPTY STATE ("No audio in this text run")
▭ ROADMAP (locked): "Remediation Sprint — coming soon" (M11), disabled, one line
▭ paired-finding link: shared incident id → "Same attack also failed Security as F-SEC-02 →"
```
**Hierarchy:** verdict > bypass signal > landing exchange + judge panel > detectors > roadmap. Meera reads the verdict zone and leaves; Arjun works the evidence zone. **EvidenceBlock = timestamped + attributable by construction.**
**Accessible disclosure:** judge-panel cards and detector list expand/collapse with `aria-expanded`/`controls`, focus stays on the toggle; Critical-Risk→observation jump and row→detail move focus programmatically; Back restores focus to the originating row.
**States:** loaded · judge-panel/detectors expanded/collapsed · audio-empty · paired/unpaired · bypass-fallback (non-self-reporting target).
**Mode variants (D-Q19):** **panel modes** show the Judge A/B/C panel; **single-judge modes** (vulnerability / mis-selling) show one judge + the `verdict_score` band that set the outcome; **`FAIRNESS_VIOLATION`** swaps the landing exchange for a **paired-persona comparison** (matched personas side-by-side from the `sample` rows + the paired-stat verdict) — a distinct detail variant to spec.
**Field fidelity (D6 — RESOLVED schema):** a finding = one `Attempt` + join to `Objective` (via `objective_slug`, for `title`/`primary_pillar`/`severity`/`crosswalk`) + `Turn` children + `judge_votes`/`detector_hits`. Full role→field mapping in `BACKEND-UPDATE.md` §4 and `DECISIONS.md`. **The open backend contract is D8** (per-pillar two-observation split with per-observation evidence turns) — not the field names.

### C7. PDF findings report (export artifact) · owner P1 · M8
**Purpose:** sober, forwardable evidence for CRO/board/auditor.
**Bones (document layout, print parity with the light theme):**
```
▭ cover: Sentinx wordmark · "Findings Report" · CONFIDENTIAL
    · run provenance block: run ID (ER-01) · target endpoint · agent version · operator/account
      · IST start/end/duration · engine + scenario-library version · plays run
    · handling line: controlled red-team run on SYNTHETIC data, no real borrower/PII
▭ summary: Security 9/12 · Compliance 11/14 withstood (fractions, not bare %; ScoreRing only
    if D2 frozen) · counts (plays run / Failed / Critical / High) · bypass headline
▭ critical risks: list with verdict + module + severity + clause
▭ per-observation entries: ID · scenario · module · outcome · severity · clause + text + source
    · target response · LANDING-TURN probe ONLY (M8/F4) · NO audio, NO full chain
▭ zero-findings variant: affirmative verdict + coverage proof + closest-call excerpt
▭ footer: generated-at IST · "evidence omits proprietary attack methodology"
```
**Content rule:** never the full attack chain; never raw recordings; audit-grade typography (mono for evidence lines, same tokens). **PDF/UA (DESIGN.md §5):** tagged PDF, document title + `lang`, `lang` spans on Devanagari, real table tags, logical reading order, text alternatives for fractions/rings, selectable real text (no rasterised Devanagari), AA-verified colours.

---

## D. Content strategy

- **One reusable content set** (DESIGN.md §8) powers every mockup and prompt — the real F-COM-03 Hinglish coercion example, paired with F-SEC-02. No placeholder text anywhere.
- **Verdict-first microcopy** on every finding; regulation register for compliance, technique-class register for security.
- **Bilingual handling:** Hindi/Hinglish evidence rendered in the Devanagari-aware mono stack, tagged `lang="hi"`; English chrome around it.
- **Honest empty/zero states** authored as real copy, not afterthoughts (audio-empty; zero-findings success; filter-empty).

## E. Responsive intent

- **Primary target: desktop/laptop** (compliance + security review happens on big screens; the table and transcript need width). Design desktop-first.
- **Tablet:** table → priority columns + row expansion; summary band stacks.
- **Mobile:** read-only graceful degradation (summary + stacked finding cards + detail); running an audit on mobile is not a v1 goal. The PDF covers true "on the go" needs.

## F. Decision status (resolved in the approval interview)

All v1 product + visual decisions are **locked** — see **`DECISIONS.md`** (D-Q1…D-Q18) for the authoritative list. Headlines: modules = **Security + Compliance**; **two-row** finding model (D8) with **per-observation evidence**; outcome **FAIL/RISK/PASS** via judge-vote split (FAIL=2–3, RISK=1, PASS=0); **severity from the Objective catalog**; module score = **withstood fraction + PASS/RISK/FAIL breakdown**; disclosure = **landing exchange only**; forensic depth = **anonymized judges + labelled detectors**; target = **fully-editable endpoint** (engine fixed to AARAV sandbox); processing = **poll-based + live findings feed**; **dual-theme sharp/dense console** (light default) · Azure-Cobalt + full palette · Geist + Geist Mono + Noto Sans Devanagari · line icons · wordmark + radar mark.

**Remaining dependencies (backend / process, NOT UI forks):**
1. **D8 backend build** — emit per-pillar Security + Compliance observations, each with its own evidence turn (the two-row model's data contract).
2. **D6 freeze owner/timing** — the field schema is known (`BACKEND-UPDATE.md` §4); confirm engineering freezes the named variables before build.
3. **D5 SME/legal sign-off** — RBI/DPDP crosswalk clauses + prose carry a source label + SME approval before any mockup/PDF.
4. **Bypass + RISK derivations** — computed UI-side from `compliance_clean` / `judge_votes` today; could move to backend fields later.
5. **Pull-impact reconciliation** — pending the parallel pull/diff agent (any newer backend commits).

---

## G. What is explicitly NOT in this plan (guard against scope creep)
Audit Cycle, multiple runs, cross-run filters & Status lifecycle, Remediation Tracker/portal, Audit Reports narrative, multi-session learning, Demo Mode switch, ₹-exposure translation, the full attack chain in any shareable surface. *(All per mapping §3.3.)*
