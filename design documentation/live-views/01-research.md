# Live Views — Stage 1: Research delta (Questionnaire → Answers)

> **Status: derived synthesis, not field research** (same discipline as `../01-user-research.md`). No live interviews with NBFC executives or product admins were run for this delta. Answers are reconstructed from: the founders' 3-view directive + roll-up/down requirement (this engagement), the demo context (`../02-personas.md` P3), the product deck (content only), the live-view prototype + its adversarial review (this engagement), and domain knowledge of NBFC governance. **Assumptions are flagged `⚑` for post-v1 validation.**

## R-1. Why a live view at all (the surface's reason to exist)

The documented funnel answers *"what broke?"* after the run. It does **not** answer *"watch it break, as it happens"* — which three real situations need:
1. **The demo / first-impression** (P3 operator, already in scope): "let the machinery visibly tear the agent apart — *credibly*, in a few minutes, in front of Google" (`../02-personas.md` P3). A live, legible duel is the most persuasive few minutes the product has.
2. **Ongoing supervision** (P5 product admin, newly in scope): someone running many audits needs to **review the crucial bits of a run without reading every turn**, and catch a *quietly-degraded* pass or a silent bypass.
3. **Executive confidence** (P4, newly in scope): a non-technical NBFC sponsor needs to **grasp posture and be persuaded** the agent is safe (and the tool is real) without jargon or evidence depth.

## R-2. Questions → answers (the new axes these audiences add)

| Q | Answer (derived) | Flag |
|---|---|---|
| Does the live read need to be *engaging*, or just honest? | Both — but **engagement = comprehension + tension made legible**, not entertainment. The "duel" makes dynamics graspable; it must never trade honesty for spectacle (`00-foundation.md` D-LV1). | — |
| Who watches a run *as it happens*, vs reads the report after? | Three: operator (demo), product admin (supervision), exec sponsor (confidence). The findings *report* stays Meera's (P1). | ⚑ validate admin role exists at target NBFCs |
| What does an exec need in one glance? | Posture (safe / at-risk), the single worst thing, and one believable proof — nothing forensic. | ⚑ |
| What does an admin need that the exec doesn't? | The decisive moments (gate-delta), the per-play integrity read, real `nJudges`, and a **one-click roll-down to evidence** when something looks off. | — |
| Is the engagement layer a *new product*, or a projection of the same data? | A **projection** — one data contract, three densities (`00-foundation.md` LV-2). No new engine capability is implied. | — |
| Live or replay? | Both, same as Processing (M2): honest live, or a **labelled** demo-pace replay of a real run. No fabricated data in either. | — |

## R-3. Risks carried into mapping (honest flags)

- ⚑ **The "Product Admin" role may not exist at every NBFC** — it may collapse into the operator (vendor-side) or a security lead. The persona is defined behaviourally so it still holds whoever plays that role.
- ⚑ **The exec "glance" (V1) risks over-abstraction** — hiding a real failure behind a calm posture. Mitigated by: V1 omits (never fakes) what it can't show honestly, and always offers roll-down. **V1 implementation is deferred (`D-LV3`)** until validated; documented now so the continuum is complete.
- **No engine change is assumed.** Every live signal already exists in `state.json` (verified, this engagement). The surface displays; it does not promise.
