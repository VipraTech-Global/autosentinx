# Live Views — Stage 2: Personas delta (P4, P5)

> Extends `../02-personas.md`. Same rule: every parameter must change a design decision; personas are behavioural, not demographic. Uses the canonical axis schema (`../02-personas.md §2.1`). These two personas were **out of scope in v1** (`../02-personas.md §2.4`) and are brought **in scope** by founder decision (2026-06-19) — superseded in §S below.

## P4 — Ishaan, NBFC Business / Exec Sponsor — **GLANCE audience (V1 owner; build deferred)**
*"In thirty seconds, tell me: is our collections bot going to embarrass us — and is this tool actually real?"*

- **JTBD:** Form **confidence** (or concern) about the agent's posture and the tool's credibility — to approve a purchase, brief the board, or greenlight a release. Consumes the audit **as it happens**, at the highest abstraction.
- **Trust threshold:** A vivid, legible **posture read** + **one** believable proof (the single worst moment, in plain words). A wall of evidence loses him; a bare score doesn't move him.
- **Technical comfort:** **1–2/5.** No transcripts, no JSON, no judge mechanics.
- **Regulatory accountability:** Indirect — he sponsors the sign-off; Meera (P1) owns it.
- **Output:** A verbal/visual confidence to carry upward; ultimately Meera's PDF (M8) is the artifact, not his.
- **Fears most:** A public, quotable failure of the live agent (a Hindi threat to a borrower) → reputational + regulatory blowback.
- **Frequency:** Rare, high-stakes (a demo, a release gate, a board prep).
- **IP sensitivity:** None of his own; he benefits from the method staying hidden (sellable).
- **Design consequences (→ V1 Glance, M17):** the **most abstracted** tier — posture in one read, the worst finding in one plain sentence, one proof; **no forensic depth**; engagement = the dynamics made legible, not entertainment. **Omits, never fakes,** anything it can't show honestly. **Always offers roll-down** to V2/V3. *Build deferred (`D-LV3`); documented now.*

## P5 — Priya, Product Admin / Audit Supervisor (**AutoSentinx team · INTERNAL**) — **ARENA audience (V2 owner)**
*"I run these audits all day. Show me the moments that matter and let me drop into the evidence the second something looks off."*

> **Audience class = INTERNAL.** P5 is on the AutoSentinx team; **V2 is an internal surface, never shown to an NBFC end-user.** The IP/disclosure rule (`../DECISIONS.md D-Q12`) therefore **does not bind V2** — full attacker strategy, intents, phase-names, and chain may show. D-Q12 governs only the **customer-facing** tiers (V1 → NBFC exec; the customer's Observation Detail C6). See `00-foundation.md` `D-LV6`.

- **JTBD:** **Supervise and review** a run's crucial moments and outcomes **without** reading every turn; decide go / no-go / escalate; catch a *quietly-degraded* pass or a *silent bypass*.
- **Trust threshold:** The **verdict** + the **gate-delta** (agent self-reported clean vs panel FAIL) + the **per-play integrity read** + **real `nJudges`**. Distrusts a single number; distrusts a denominator she can't verify.
- **Technical comfort:** **3–4/5.** Comfortable with the verdict mechanics; not living in raw payloads.
- **Regulatory accountability:** Medium — accountable for the *quality of the audit*, not the regulatory sign-off.
- **Output:** A go/no-go on the run; an escalation to Arjun (P2) or Meera (P1) when a breach lands.
- **Fears most:** A **silently degraded** result read as clean (a 503'd judge, a window-blocked recon) or a **bypass** that the agent's own filter missed — passing review unnoticed.
- **Frequency:** Daily / per-run; the closest thing to a "console" user.
- **IP sensitivity:** **Internal — none.** She *needs* the full method (strategy, intents, full chain) to supervise quality; V2 shows it. (The customer never sees V2; D-Q12 protects the customer-facing tiers, not hers.)
- **Design consequences (→ V2 Arena, M14–M16):** the **engagement + crucial-detail** tier — the live duel (CombatantHeader · AttackArc · StrategyBeat), the gate-delta climax (VerdictReveal · BypassSignal), the IntegrityStrip stakeout map, real `nJudges`; **detail preserved but not overwhelming**; **one-click roll-down** to V3 (M18/M19). Honest degraded states are first-class (M21).

## §ownership — Persona → view-tier ownership (extends `../02-personas.md §2.3`)

| Tier | P1 Meera (Compl.) | P2 Arjun (Sec.) | P3 Operator | **P4 Ishaan (Exec)** | **P5 Priya (Admin)** |
|---|---|---|---|---|---|
| **V1 Glance** | secondary | — | reviews | **owner** | reviews |
| **V2 Arena** | reads | reads | drives (demo) | watches | **owner** |
| **V3 Forensic** *(= C6 Observation Detail)* | drills | **owner** | reviews | — | drills |

*(The funnel screens C1–C7 keep their canonical ownership; the Live View tiers add the rows above. V3 Forensic **is** the existing Observation Detail surface, reused — not a new screen.)*

## §S — Supersession of `../02-personas.md §2.4` (dated)

**Supersedes `../02-personas.md §2.4` (2026-06-19):** The two personas previously listed out-of-scope are now **in scope** as the Live View audiences:
- **"Multi-tenant admin / Product Admin"** → now **P5 Priya** (single-tenant still; P5 is an *audit supervisor* role, not multi-tenant config).
- **"CXO/RBI report consumer of a full Audit Cycle"** is **still out of scope** (needs multi-run); **P4 Ishaan is narrower** — a *live-audit glance* sponsor, not an Audit-Cycle narrative consumer.
- **Still out of scope:** the vendor being remediated (unchanged).
