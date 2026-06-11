# Sentinx v1 — Stage 1: User Research (Questionnaire → Answers)

> **Status: derived synthesis, not field research.** No live interviews were run for this deliverable. The "answers" below are reconstructed from the founders' scoping call (`Sentinexv1transcript`), the product deck, the architecture docs, the codebase, and domain knowledge of Indian NBFC collections regulation. Every answer is tagged with a **confidence** and **source**. Assumptions are flagged `⚠️ ASSUMPTION` for later validation. This is the cheapest place to introduce bias, so it is labelled honestly rather than dressed up as primary data.

## 1.1 Who we are designing for (the real audience picture)

Two audiences sit behind v1, and they are not the same:

- **The portrayed user** — an **NBFC compliance / security stakeholder** who would, in the product narrative, point Sentinx at their voice debt-collection agent and read the findings. The UI must *feel* built for this person. **(Primary, per decision: optimise for the NBFC security/compliance buyer.)**
- **The actual first viewers** — **Google reviewers** (capability/credibility) and the **founders** operating the demo. The UI must survive a sceptical technical read and make the attack machinery legible without becoming a developer console.

Design implication: build for the NBFC buyer's *trust* (audit-grade, evidence-first, regulator-credible); that same restraint reads as credibility to Google. Avoid demo-theatre that a compliance officer would find unserious.

## 1.2 The instrument (questionnaire)

A mixed quant/qual instrument we *would* field with 6–10 NBFC compliance/risk and AI-engineering stakeholders. Recorded here so the synthesis is auditable and the leading-question / unrepresentative-sample failure modes are visible.

**Screeners (quant):**
- Q0a. Does your NBFC operate an automated/AI voice agent for collections or servicing? (yes/no/piloting)
- Q0b. In which language(s) does it primarily converse? (Hindi / Hinglish / English / regional)
- Q0c. Who signs off that the agent is safe to run in production? (role)

**Context & jobs (qual — the load-bearing questions):**
- Q1. Walk me through the last time you had to convince someone (board, RBI, partner) that your collections agent behaves within the rules. What did you show them?
- Q2. When you worry about this agent, what specifically are you afraid it will say or do on a live call?
- Q3. How do you find out *today* that the agent misbehaved? (complaint, audit, spot-check, nothing)
- Q4. If a tool told you "your agent broke the rules in these 7 ways," what is the *first* thing you'd need to see to believe it?
- Q5. What would you have to forward to a colleague or regulator, and in what format?
- Q6. What makes a security/compliance report feel trustworthy vs. like marketing?

**Frequency & comfort (quant/scale):**
- Q7. How often would you re-test the agent? (per release / weekly / monthly / before audits)
- Q8. Comfort reading technical evidence (prompt logs, transcripts): 1–5.
- Q9. Who else needs to read the output, and how technical are they?

**Anti-bias controls:** open "walk me through" phrasing (Q1, Q3) instead of "wouldn't you want X?"; sample spans *both* compliance (non-technical) and security/AI (technical) roles so we don't design only for one comfort level; the fear question (Q2) surfaces real failure modes rather than confirming our feature list.

## 1.3 Synthesised answers (clustered findings)

| # | Finding | Confidence | Source |
|---|---|---|---|
| F1 | A single attack can break **two distinct duties at once** — a prompt-injection that elicits Hindi coercive language is *both* a security failure (instruction-limit compromise) and a compliance failure (RBI Fair Practices / harassment). Stakeholders reason about these as **separate concerns owned by separate people.** | High | Transcript (00:13–00:36); SME critique in transcript |
| F2 | The buyer's core question is **"prove it broke, and show me exactly how."** Belief comes from *evidence* — the actual attack and the agent's actual words — not from a score alone. | High | Transcript (00:41–01:21: "exactly kya hua tha… call recording ya text transcript dekh sakta hai") |
| F3 | The output must be **forwardable** — a PDF "findings report" combining the headline statistics with the specific target responses and the *final* attack line (not the full attack chain), omitting audio. | High | Transcript (07:34–08:47) |
| F4 | **Attack methodology is sensitive IP.** The full multi-turn attack chain should *not* be exposed; show only the last turn that landed. The "best attack machinery" is the USP and must not be given away. | High | Transcript (06:18–06:54, 08:37–08:47) |
| F5 | **Remediation is desired but not credible yet** in a black-box setting — you can't tell whether an input filter, output filter, or the base model failed. Excluded from v1; reframed as a roadmap ("Remediation Sprint"). A *signal* that it's coming is wanted. | High | Transcript (02:58–07:31) |
| F6 | Stakeholders think in **module scores + critical risks first** (executive summary), then drill into the table, then into one observation. Classic exec→list→detail funnel. | High | Transcript (02:02–02:27); deck |
| F7 | The **findings table and the observation are the same object at different zoom levels**; filtering across multiple runs only matters *after* there are multiple runs — irrelevant to a single-eval-run v1. | High | Transcript (02:27–02:58) |
| F8 | **Variable-name fidelity to the backend is critical** — if the screen's fields don't match the frozen DB fields, major rework follows. The detail screen is the riskiest screen and depends on a backend scoping freeze. | High (it's the [CRITICAL] action item) | Transcript (01:22–02:01); transcript action items |
| F9 | The agent under test is **Hindi/Hinglish voice**, but v1 evidence is **text transcripts** (audio/recording is a later "Layer B"). The UI must show a *graceful empty state* for audio, not a broken player. | High | Transcript (01:03); deck slide 6; codebase (text REST) |
| F10 | ⚠️ ASSUMPTION: NBFC compliance readers are **moderately non-technical** and need plain-language verdicts + regulation citations; security readers want the raw transcript and the bypass signal. The UI must serve both without overwhelming either. | Medium | Inferred from role split; standard for RegTech buyers |
| F11 | ⚠️ ASSUMPTION: Trust is won by **restraint and specificity** (exact clause, exact words, timestamps) and lost by hype, fake precision, or unexplained numbers. | Medium | Domain norm for audit/security tooling |

## 1.4 What this means before we name personas

- Two reader types with different comfort levels share every screen → **progressive disclosure** is a foundational requirement, not a nicety.
- The product's believability rests on **evidence fidelity**, while its IP rests on **withholding the attack chain** → there is a real, designed tension between *show enough to believe* and *hide enough to protect*. This tension is a first-class design driver (it reappears in mapping).
- A single eval run with no remediation and no cross-run history means the IA is **shallow and focused** — exec summary, one table, one detail, one export. Resisting the urge to add depth the engine can't back is itself a design goal (F5, F7).
