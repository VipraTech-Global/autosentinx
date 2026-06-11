# Sentinx v1 — Stage 3: Mapping (persona goal → need → feature → business rule)

> **The crux.** This is where the solution is actually committed. Each row is a traceability thread: a real persona goal, the user need it creates, the v1 feature that serves it, and the business rule that shapes or permits it. The Plan (stage 4) and every later spec only *elaborate* decisions made here. If a feature isn't in this table, it isn't in v1.

## 3.1 Traceability matrix (in-scope features)

| ID | Persona goal | User need | v1 Feature | Business rule / constraint |
|---|---|---|---|---|
| M1 | P3: run a credible audit by pointing at a live agent | Enter the target agent and start a run in seconds | **Run Config**: target API endpoint + agent name + (optional) auth; "Run audit" | Product promise is "paste an endpoint and Run." ⚠️ Backend today is wired to one specific target protocol — UI designs the promise; connectivity is a flagged backend dependency (see §3.4). |
| M2 | P3: make the scan feel real, not instant theatre | See honest progress while the attacker works | **Processing** screen: live activity log + phase/coverage progress + elapsed/est. time | Must reflect *real* engine stages (recon → multi-turn plays → classify), not fabricated steps. No fake precision. |
| M3 | P1: lead with the verdict | A 5-second read of how safe the agent is | **Executive Summary**: Security score, Compliance score, Critical Risks list | Scores must be **derivable and reproducible** from stored data. Severity weighting + module mapping are backend dependencies (§3.4). |
| M4 | P1+P2: see every way it broke | A scannable list of findings for this run | **Observations table**: ID · Scenario · Module · Outcome · Severity · Reg Ref · Status | One run only → no cross-run filter is required (F7); table still filterable by Module/Severity/Outcome for triage. |
| M5 | P1+P2: one attack can break two duties | The same occurrence shown as **two observations** when it fails two modules | **Two-row model**: a prompt-injection→coercion event yields one Security row + one Compliance row, linked | Structurally sound per SME critique; lets security and compliance filter independently without distorting threat counts (F1). |
| M6 | P2: judge whether a finding is real | See exactly what happened at depth | **Observation Detail**: scenario, module, outcome, severity rationale, regulation ref + text, **landing attack line**, target response, **full multi-turn transcript**, bypass signal | Fields must mirror **frozen backend variables** (F8 — the [CRITICAL] dependency). Detail is the riskiest screen; built against the scoping freeze. |
| M7 | P2: trust the detection | Show our verdict against the agent's own self-report | **Bypass evidence**: "agent reported clean / our judge says FAIL" contrast (`compliance_clean` vs our label) | This *is* the real-bypass definition in the engine; it's the most credible single piece of evidence and cheap to surface. |
| M8 | P1: forward it upward | A shareable, sober report | **PDF findings report**: headline stats + per-observation regulation test, target response, **last-turn attack line only**, no audio | Withhold the full attack chain (F4); omit raw recordings (F3). Looks audit-grade, not marketing. |
| M9 | P1+P2: believe it without giving away IP | Enough evidence to believe, not enough to copy the method | **Disclosure rule baked into components**: detail view (secured) shows full transcript; shareable/PDF shows only the landing turn | The attack machinery is the USP (F4). The show-enough / hide-enough tension is a first-class component rule, not an afterthought. |
| M10 | P1: voice agent, text evidence today | Don't show a broken audio player | **Graceful empty state** for recording/transcript-audio; text transcript is the evidence in v1 | Layer B (SIP/voice/audio) is later (F9). Empty state must read as "not in this run," not "broken." |
| M11 | P1: signal the bigger value | Know remediation is coming without it being built | **Locked "Remediation Sprint — coming soon"** affordance in Observation Detail | Remediation excluded from v1 (F5); positioned as roadmap to elevate from scanner → lifecycle platform. |
| M12 | P3: establish credibility instantly | A landing that frames Sentinx as serious security tooling | **Landing**: positioning, one CTA into the audit | Optimised for the NBFC-buyer read; restraint = credibility to Google too. |
| M13 | P3: gate access minimally | A thin sign-in | **Thin Login** | Single-tenant demo; hints at SaaS without building multi-tenancy/roles. Not a real auth system in v1. |

## 3.2 The v1 screen set (derived from the matrix)

1. **Landing** (M12)
2. **Thin Login** (M13)
3. **Run Config** (M1)
4. **Processing** (M2)
5. **Findings** = Executive Summary (M3) + Observations table (M4, M5) on one screen
6. **Observation Detail** (M6, M7, M9, M10, M11)
7. **PDF findings report** (M8) — an export artifact, not a navigable screen

## 3.3 Explicit cuts (and the rule that cut them)

| Cut from v1 | Why (rule) | Re-enters when |
|---|---|---|
| Audit Cycle container, multiple Eval Runs, cross-run finding history & Status lifecycle | Single eval run (FOCUS); filtering-across-runs has no value with one run (F7) | Multi-run / Audit Cycle phase |
| Remediation Tracker, LLM fix-specs, vendor OTP portal | Black-box remediation not credible yet; excluded by decision (F5) | "Remediation Sprint" roadmap |
| Audit Reports (CXO/RBI rolled-up narrative) | Requires reconciliation across multiple runs (F7); v1 ships a *findings* PDF instead (F3) | Audit Cycle phase |
| Multi-session adversarial learning view | Founder marked it "very light" / future (transcript 08:47–09:34) | Later |
| Demo Mode data-layer switch, ₹-exposure translation | Product-sales layer beyond v1 focus | Sales/demo hardening |
| Full multi-turn attack chain in any shareable surface | IP protection (F4, M9) | Never (by design) |

## 3.4 ⚠️ Backend dependencies the UI must not silently fake

These are honest flags carried from the prior gap analysis. The UI is designed to *display* them; the backend must *produce* them, or the screen must degrade gracefully.

| Dep | What the UI needs | Engine reality today | v1 handling |
|---|---|---|---|
| **D1 Arbitrary-endpoint connectivity** | Run against a pasted vendor `/chat` endpoint | Engine speaks one specific target protocol (AARAV signed-card + `/voice/call/*`) | Design the endpoint flow; for the demo it may target the known agent. Flag as the #1 backend dependency. |
| **D2 Module scores (Security %, Compliance %)** | A reproducible % per module | Engine emits raw counts only; no module mapping, no %; the "direction" of the score is undefined | Define the scoring rule with engineering as part of the scoping freeze; UI shows the agreed metric, never a fabricated number. |
| **D3 Severity (Critical/High/Medium/Low)** | A severity per observation (drives Exec Summary + gating) | No severity anywhere in the engine | Severity must become a **per-scenario attribute in the scenario library**, surfaced to the finding. Backend dependency. |
| **D4 Outcome = FAIL / RISK / PASS** | A 3-way per-observation outcome | Engine has attack labels (Succeed/defended) — binary; no RISK tier; "Succeed" = agent FAILED (inverted) | Define the translation (attack-result → product outcome) in the freeze; RISK tier needs a source rule or is omitted in v1. |
| **D5 Regulation clause + text** | Exact clause (e.g. RBI FPC §7(ii)) + displayable prose | Engine carries free-text `rule` / `regulatory_source`, not normalized clauses | v1 can show the free-text rule + a curated clause/text per scenario; full clause store is later. |
| **D6 Frozen detail-field schema** | Stable variable names for Observation Detail | `Run/Attempt/Turn` exist; final fields not frozen | **Blocking:** detail screen designed against the freeze; **the field-mapping appendix is a precondition for approving C6, not a post-approval attachment.** Until frozen, C6 fields are referenced by *role* (landing-turn text, agent-response text, judge verdict) not by DB name (F8). |
| **D7 Target self-report (bypass signal)** | `compliance_clean` / `violations` from the target, to power the BypassSignal | Available only from the AARAV-protocol target; **absent from arbitrary endpoints** — couples tightly to D1. **Also: the bypass is not yet computed into a field** — the UI/backend must derive "agent said clean ∧ Sentinx says FAIL" from `Turn.compliance_clean` vs the panel verdict | The single most persuasive artifact (M7) depends on this. BypassSignal must degrade gracefully ("Sentinx judge: FAIL", no self-report contrast) for targets that don't self-report — never blank, never a faked "clean". |
| **D8 Per-pillar observation split (two-row model, M5)** | One dual-duty attack shown as a **Security observation + a Compliance observation**, linked; **each row carries its own evidence turn** | **Does NOT exist as built.** Phase-3 engine = one `Attempt` → one `Objective` → one `primary_pillar` (security *or* compliance); 18 compliance / 4 security objectives | **REQUIRED backend work (decision = keep two-row, option b):** emit a **Security** observation when the agent's guardrails/instructions are bypassed (technique success, e.g. injection) **and** a **Compliance** observation when a regulated harm is produced (objective success), linked by a shared incident id. **Each per-pillar observation must reference its OWN landing-turn evidence** — the Security row points to the guardrail-bypass turn, the Compliance row to the harm turn (not a shared attack-level last turn). Grounded in the transcript SME critique (injection→Security; coercive output→Compliance). Until built, the UI renders the two-row model against this contract; a single-pillar attack yields one row. |

## 3.5 Notable scope decision for approval — **modules in v1**

The deck's "TriadAI" carried **three** modules (Security, Compliance, **Conversion**). Under the **Sentinx** brand and the **security/compliance** audience, and given the engine's three modes (COERCION / DATA BREACH / IMPERSONATION) are all security/compliance probes — and the architecture explicitly **defers** Conversational-Quality — **v1 proposes two modules: Security and Compliance.** Conversion becomes roadmap (like remediation).

> **Decision needed at approval:** confirm **Security + Compliance only** for v1 (recommended, honest to the engine), or keep Conversion as a third (currently un-producible) module.
