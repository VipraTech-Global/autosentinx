# Sentinx v1 — Stage 5: Analysis / Design Critique (and what was done about it)

> Per the process, we **stepped back and acted as design critics on the plan before any visual styling** — six independent lenses (IA/flow, accessibility+bilingual, RegTech credibility, brand/design-language, backend feasibility, live-demo narrative). They raised **9 blocking, 24 major, 14 minor** issues. This document records the verdict, the themes, and exactly what was **applied to the plan/foundation now** vs. **deferred to the spec** vs. **needs your decision**.

## 5.1 What the critics agreed is working (keep it)
- **Scope honesty is the standout** — the D1–D7 dependency flags, the explicit cuts table, "never silently fake," and the inverted-label honesty (engine `Succeed` = agent FAILED) let the team answer a sceptical Google "is this real?" without flinching.
- **The exec→list→detail funnel is the right spine**, and **merging Exec Summary + Observations into one Findings screen** is correct for a single run.
- **Progressive disclosure as a foundational requirement** cleanly resolves the dual reader (Meera reads the verdict zone; Arjun expands the evidence).
- **IP-protection encoded into components** (show-enough/hide-method) rather than left to per-screen discipline.
- **Accessibility specified up front** — rare at plan stage; reads as seriousness.
- **The "calm instrument" language is genuinely distinctive** and mostly expressed *structurally* (mono-as-evidence, semantic-colour-for-severity-only), not just asserted.

## 5.2 Blocking themes → resolution (applied now)

| # | Blocking theme (lens) | Fix applied | Where |
|---|---|---|---|
| B1 | **No run home / re-entry / New-audit / sign-out**; wordmark + breadcrumb undefined (IA) | Defined a durable **run home (= Findings)**, post-run top bar with **New audit · run reference · Export · Sign out**, per-phase **wordmark behaviour** (post-run → Findings, never Landing), dropped the breadcrumb for an explicit **← Back to Findings** + run reference | plan §A, §C5, §C6 |
| B2 | **Findings leads with an undefined % score** (RegTech, demo, brand) — violates "no fake precision" + risks the "4-stat-cards" cliché | Summary is now **evidence-led**: headline worst-finding sentence → **bypass headline** → **withstood fractions** (not bare %) → counts → Critical Risks. ScoreRing only with an on-screen definition | plan §C5; DESIGN §7 |
| B3 | **Bypass signal buried two clicks deep** (demo) — the single most persuasive proof | **Promoted a bypass headline into the Findings reveal** ("N findings the agent's own filter rated clean"); full component stays on Detail | plan §C5, §C6 |
| B4 | **Hardcoded "Open" Status manufactures a liability artifact** (RegTech) | **Removed Status** from table + Detail + reference data; replaced with defensible **provenance** ("Detected in: ER-01 · Reproduced") | plan §C5, §C6; DESIGN §8 |
| B5 | **Verbatim Hinglish coercion shown with no confidentiality/synthetic frame** (RegTech) | Added a **handling line** (controlled red-team run, synthetic data, no PII) on Detail + PDF cover; **speaker-labelled** Probe (Sentinx) vs Target agent | plan §C6, §C7; DESIGN §8 |
| B6 | **Named tokens already fail WCAG AA contrast** (a11y) | Darkened `--warn`/`--sev-medium` (#B5710E → #8A5408), annotated every token with its ratio, restricted `--ink-faint` to non-text | DESIGN §3.1 |
| B7 | **Dark "operations" mode breaks "identical semantics" + fails contrast** (a11y) | Replaced the "identical" claim with an **explicit AA dark semantic ramp** requirement + guardrails; made the dark moment an **open decision** (default light) | DESIGN §3.1; plan §C4, §F.5 |
| B8 | **Exec Summary fully load-bearing on D2/D3 with no degraded layout** (backend) | Added **degraded rendering**: if scores/severity aren't delivered, fall back to fractions + counts + bypass + worst finding, hide the ring | plan §C5 |
| B9 | **Score has no baseline/definition/direction** as the first thing seen (demo) | Same as B2 — fractions with visible denominator are baseline-implied; % only when frozen | plan §C5, §F.4 |

## 5.3 Major issues folded in now
- **Zero-findings "agent held the line"** state fully specified (affirmative verdict + coverage proof + full PASS table + one "closest call" + PDF variant). *(plan §C5)*
- **Two-row model** made *loud*: standing explanatory copy + shared incident id + paired-link icon; **headline counts count events, table lists observations** (stated on screen). *(plan §C5)*
- **Run provenance** block (run ID, operator, IST start/end/duration, target, agent + engine + scenario-library version, plays run) on Findings + PDF cover — turns "demo output" into "audit artifact." *(plan §C5, §C7)*
- **Forensic invariant:** `EvidenceBlock` is **timestamped + attributable by construction** (per-turn IST + judge/ruleset provenance). *(DESIGN §7; plan §C6)*
- **FAIL/PASS default; RISK reserved**; inversion mapping (`Succeed→FAIL`) goes in the field appendix. *(DESIGN §7; plan §C5, §F.2)*
- **Processing log** reduced to **guaranteed vs conditional** events; added a **demo-pacing replay** mode (real events, narratable speed) for the 3-minute demo; dark-mode terminal-tells banned. *(plan §C4)*
- **D7 added** (target self-report dependency) with a **BypassSignal fallback** for non-self-reporting endpoints. *(mapping §3.4; DESIGN §7; plan §C6)*
- **Redundant non-colour encoding table** (shape/icon per severity+outcome); "and/or" → "**and**". *(DESIGN §5)*
- **Bilingual model** tightened (tag only genuine Devanagari `lang="hi"`; romanised Hinglish stays `en`; decide canonical script). *(DESIGN §5)*
- **Connection-check honesty** ("Endpoint reachable", not "verified") + timeout state; D1 reframed so the demo target is unambiguous. *(plan §C3)*
- **D6 hardened:** a provisional **named-variable list is a precondition for approving C6**; fields referenced by role until the freeze. *(mapping §3.4; plan §C6)*

## 5.4 Deferred to the SPEC stage (captured, not lost)
These are correct but belong in buildable detail, not the plan:
- Per-state **measured contrast** for every token on every surface; final dark semantic ramp hex.
- Full **WCAG 2.2 SC disposition table** (all nine new SC), and **PDF/UA** tagging specifics.
- **Focus-management** specifics for disclosure/jump/back (named in plan §C6; exact `aria-*` in spec).
- **Motion choreography** for the reveal (staggered timings) — styling stage, post-approval.
- Exact **shape glyphs** rendering and the SeverityChip/OutcomeBadge component API.

## 5.5 Needs YOUR decision (now the §F open-decisions list)
The critique converted several items into explicit forks — see **plan §F (Open decisions for approval) #1–#9**: modules (Security+Compliance vs +Conversion), FAIL/PASS-only vs RISK, severity source, score definition (fraction vs %), dark Processing vs light, login presence, run persistence/re-entry, the D6 freeze owner/timing, and SME sign-off on clauses.

## 5.6 The single most important change (consensus)
**Make the Findings reveal lead with *evidence*, not a percentage** — the worst caught-lying finding + the bypass headline, with reproducible fractions supporting. The product's whole thesis is "proof, not promises"; the original plan opened on a contested number. **This is now applied** (§C5). The runner-up: **give the run a durable home** (B1) so it reads as an instrument, not a throwaway demo — **also applied** (§A).
