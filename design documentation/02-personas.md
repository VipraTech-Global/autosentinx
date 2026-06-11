# Sentinx v1 — Stage 2: Personas + Parameters

> Parameters are the **schema** (the axes along which users vary); personas are **instances** (memorable readings of those axes). Rule applied: every parameter must change a design decision, or it is cut. All parameters here are **behavioural / goal-based**, not demographic.

## 2.1 Parameters (the axes)

| Axis | Why it changes a design decision |
|---|---|
| **Primary job-to-be-done** | Determines the screen a persona lands on and what "done" looks like for them. |
| **Trust threshold** (what makes them believe a finding) | Decides how much evidence we surface and how prominently (score vs. transcript vs. citation). |
| **Technical comfort** (1–5) | Decides default depth: plain-language verdict on top, raw transcript on demand. Drives progressive disclosure. |
| **Regulatory accountability** (do they personally answer for a breach?) | Decides how much regulation-citation and audit-defensibility weight the UI carries. |
| **Output they must produce** (what they forward, to whom) | Decides export format and what is safe to include (PDF findings report; last-turn only). |
| **Failure they fear most** | Decides which findings get visual priority (coercion/harassment vs. data leak vs. impersonation). |
| **Frequency / context of use** | Decides whether this is a daily console or an occasional, high-stakes review. v1 = occasional, high-stakes. |
| **IP sensitivity** (do they care about protecting method) | Decides what we *withhold* (the attack chain). |

## 2.2 Personas

### P1 — Meera, Head of Compliance & Risk (NBFC) — **PRIMARY**
*"I have to be able to stand in front of RBI and say our collections agent does not threaten or harass borrowers — and prove it."*

- **JTBD:** Get **defensible evidence** that the voice agent stays inside RBI Fair Practices / DPDP before and while it's live; forward that evidence upward and outward.
- **Trust threshold:** A score alone is marketing. She believes when she sees the **exact regulation clause**, the **exact words the agent said**, and a clear FAIL verdict.
- **Technical comfort:** 2/5. Reads transcripts fine; does not read prompt-injection payloads or JSON.
- **Regulatory accountability:** **High** — her name is on the sign-off.
- **Output:** A **PDF findings report** for the CRO/board and, eventually, an auditor. Must look sober and precise.
- **Fears most:** Coercion / harassment / illegal threats in Hindi on a real call → regulatory action and reputational harm.
- **Frequency:** Before a release and before audits; occasional, high-stakes.
- **IP sensitivity:** Indirect — she doesn't want methodology leaking to the vendor either.
- **Design consequences:** Executive Summary leads with **Security + Compliance scores and Critical Risks**; every observation carries a **plain-language verdict + regulation citation**; the **PDF export** is a first-class action; technical depth is one click away, never in her face.

### P2 — Arjun, AI / Security Engineering Lead (NBFC or vendor-risk) — **SECONDARY**
*"Don't tell me it's 'High severity'. Show me the turn where it broke and what it actually said."*

- **JTBD:** Understand **exactly how** the agent broke, judge whether it's real, and know what class of fix it implies — even without white-box access.
- **Trust threshold:** The **multi-turn transcript** and the **bypass signal** (our verdict vs. the agent's own "compliance_clean" self-report). He distrusts anything he can't inspect.
- **Technical comfort:** 5/5. Wants the raw evidence; tolerant of dense data.
- **Regulatory accountability:** Medium — accountable for the fix, not the sign-off.
- **Output:** Triage list; cares which findings are Critical/High and reproducible.
- **Fears most:** A confident-but-wrong finding (false positive) wasting his team, or a real bypass slipping through.
- **IP sensitivity:** Understands the attack chain is the product's IP; fine seeing only the landing turn in shareable views, full transcript in the secured detail view.
- **Design consequences:** **Observation Detail** is his screen — full transcript, the attacker's landing line, target response, the AARAV self-report-vs-our-verdict contrast, severity rationale. Progressive disclosure means his depth doesn't clutter Meera's view.

### P3 — Sangram / Akhilesh, Sentinx operator (founder) — **TERTIARY (operator/demo driver)**
*"Paste the endpoint, hit run, and let the machinery visibly tear the agent apart — credibly, in a few minutes, in front of Google."*

- **JTBD:** Run a fast, credible audit live; make the capability legible to a buyer and to Google without exposing internals or over-promising.
- **Trust threshold:** N/A (they built it) — but they need the demo to *land* and to **not claim what the engine can't do**.
- **Technical comfort:** 5/5.
- **Output:** The whole session is the output — the run-to-findings narrative.
- **Design consequences:** **Run Config + Processing** must feel like a real scan (honest live progress), the **landing** must establish credibility in seconds, and nothing in the UI should promise capability the backend can't yet produce (arbitrary-endpoint connectivity, Conversion scoring, remediation) without an honest "roadmap"/flag.

## 2.3 Persona → screen ownership (preview of the plan)

| Screen | P1 Meera | P2 Arjun | P3 Operator |
|---|---|---|---|
| Landing | secondary | — | **owner** |
| Login | trivial | trivial | **owner** |
| Run Config | watches | watches | **owner** |
| Processing | — | interested | **owner** |
| Findings (Exec Summary + Observations) | **owner** | reads | reviews |
| Observation Detail | drills in | **owner** | reviews |
| PDF findings report | **owner** | contributes | generates |

## 2.4 Explicitly out-of-scope personas (v1)
- **The vendor being remediated** (OTP portal) — remediation is out of scope (F5).
- **The CXO/RBI report consumer** of a full *Audit Cycle* narrative — needs multiple eval runs; not v1 (F7).
- **Multi-tenant admin / Product Admin config** — single-tenant demo; thresholds are backend config, not UI.
