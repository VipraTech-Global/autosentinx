# Sentinx v1 — Design Process (the #ProcessFlow, with reasons)

> This document records **how** we are designing the Sentinx v1 frontend and **why** the process is shaped this way. It adapts the generic pipeline in `DesignProcess.docx` to this specific project, run **linearly** (per the explicit instruction: *"DO it linearly. If looping is REALLY necessary for current project do it on your own."*).

## 0.1 The pipeline and why each stage exists

The process is a **traceability ladder** — each rung trades abstraction for concreteness, moving from *understanding the problem* to *constructing the solution*. The single idea holding it together: **every pixel must trace back to a persona goal and a business rule.** When someone later asks "why does this screen exist?" or "what can we cut to ship?", the thread must be intact, or scope debates become opinion fights.

| Stage | Question it answers | Artifact | Why it comes here |
|---|---|---|---|
| **1. Research → Answers** | Along what dimensions do users vary; what are they really trying to do? | `01-user-research.md` | Cheapest place to ruin everything downstream. Bias entering here propagates silently. |
| **2. Answers → Personas + parameters** | Who, specifically, are we designing for? | `02-personas.md` | Parameters must be *behavioral/goal-based*, not demographic. If a parameter changes no design decision, it is cut. |
| **3. Personas → Mapping** | Why does each requirement exist — which user goal and business rule justify it? | `03-mapping.md` | **The crux.** This is where problem-space meets solution-space; the solution is committed *here*, not at the plan. Reconciles user need × product requirement × business logic. |
| **4. Mapping → UI/UX Plan** | How is everything arranged into a coherent product, and where does each thing live? | `04-uiux-plan.md` | Structure, not pixels: information architecture, journeys, screen inventory, navigation, content strategy. **This is the approval gate.** |
| **— Foundation (parallel)** | What are the non-negotiable ground rules — brand, design language, tokens, voice? | `DESIGN.md` | The "ironclad system" the plan and every later spec must obey. Authored alongside stages 3–4 so the plan can reference it. |
| **5. Analysis / Critique** | Where is the plan weak — before any visual flair is applied? | `05-critique.md` | We deliberately **step back and act as a design critic** after the plan, not after the pixels. Cheaper to fix a plan than a build. |
| **6. UI/UX Specs** *(post-approval)* | Exactly how is each piece built, in every state? | `specs/` + tool prompts | Buildable detail: wireframes, component specs, every state (empty/loading/error/success), responsive rules, accessibility, design tokens, edge cases. The thing Stitch / Claude Design / Next.js build from. |

## 0.2 The craft sequence layered on top (stages 4→6)

Per the brief, the craft order is enforced **within and after** the plan:

1. **Foundation** (`DESIGN.md`) — ground rules first. Color, type, structural paradigms become an ironclad system.
2. **Shape the bones** — spacing, visual rhythm, hierarchy **before** any visual flair (this lives in the Plan, stage 4).
3. **Analysis / critique** — design-critic pass on the plan (stage 5).
4. **Styling & micro-interactions** — typography, motion, colour, "delight" injected **only after** structure is sound (stage 6, post-approval).
5. **Finalize** — edge cases, accessibility, error boundaries before anything is called "ready" (stage 6, post-approval).

## 0.3 Where we deliberately deviate from the generic pipeline

The generic critique in `DesignProcess.docx` notes the real world *loops, diverges before converging, and needs an ideation + validation step*. We are running **linearly by instruction**, with three pragmatic concessions appropriate to a fast v1 demo:

- **No fresh field research.** We cannot interview NBFC compliance heads before this deliverable. Stage 1 is therefore a **structured synthesis** grounded in: the founders' scoping call (`Sentinexv1transcript`), the product deck, the backend architecture docs, the working code, and domain knowledge of RBI/DPDP collections regulation. It is **explicitly labelled as derived**, with assumptions flagged for later validation. This is the single biggest risk in the chain and is called out as such.
- **Validation is deferred, not skipped.** No usability testing happens before the build; the **approval gate at stage 4** and the **critique at stage 5** are the stand-ins. Real validation (clickthrough test with an NBFC stakeholder) is logged as a post-v1 action.
- **Business logic is treated as ambient.** It constrains stage 1 (who we target, the Google + NBFC dual audience) and recurs through mapping — not injected once.

## 0.4 Inputs this process draws on (the context base)

- **`Sentinexv1transcript`** — the founders' scoping call that froze v1 FOCUS scope (one eval run; Security+Compliance can yield two observations from one attack; remediation out-of-scope; findings PDF in-scope; observation-detail fields must mirror frozen backend variables).
- **`TriadAI_Product_Flow` deck** — information content only; **we do not anchor on its visual design** (per constraint).
- **`architecture.md` / `architecture-rationale.md`** — the backend vision (3-layer model, 16-mode spine, coverage/oracle design) and what is *designed-not-built*.
- **The `autosentinx` codebase** — what actually exists today (`Run → Attempt → Turn`, the GALA-lite attacker, the 4-way classifier) and therefore what the UI can honestly show.
- **Prior gap analysis** (this engagement) — the verified deltas between product vision and built engine; the UI must not promise what the engine cannot yet produce without flagging it.
- **Platform research** — how Google Stitch and Claude Design expect prompts, so the spec is authored once and re-targeted by swapping only the output section.

## 0.5 Status & gate

We execute stages 1–5 now and **stop for approval at the UI/UX Plan**. UI/UX specs, the Stitch/Claude-Design prompts, and the Next.js build happen **only after** the plan is approved.
