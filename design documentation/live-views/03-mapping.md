# Live Views — Stage 3: Mapping delta (M14+ `[LV]`)

> **The crux, for the Live View.** Extends `../03-mapping.md` (continues the `M*` series). Each row: persona goal → user need → v1 feature → business rule. The Plan (`04-uiux-plan.md`) and later specs only *elaborate* these. **If a view element isn't here, it isn't in the plan** (`../00-PROCESS.md`). All rows tagged `[LV]`.

## §M — Traceability matrix (Live View)

| ID | Persona goal | User need | Feature | Business rule / constraint |
|---|---|---|---|---|
| **M14** `[LV]` | P5/P3: watch the audit happen, credibly | See the attacker press a line and the target hold or give ground, **in real time** | **V2 Arena live surface** — `CombatantHeader` + `AttackArc` (phase spine fills as turns arrive) + `StrategyBeat` (re-angle / concede) | Same honest data as Processing (M2). Arc/labels read from `state.json` (`arc`, `beats`, `labelTrend`); **no fabricated dynamics**, no faked progress. |
| **M15** `[LV]` | P5: grasp the decisive moment | See the single most decision-relevant fact of a play | **`VerdictReveal` + `BypassSignal`** — gate-delta promoted to the climax ("agent believed it held; the judges disagree") | **= M7** (the bypass *is* `compliance_clean`==true ∧ panel FAIL). Degrades gracefully for non-self-reporting targets (D7). The one orchestrated motion (`00-foundation.md` LV-4). |
| **M16** `[LV]` | P5: read defence strength at a glance over a whole run | A resting "stakeout map" of how each play held | **`IntegrityStrip`** per play (held / wavered / yielded, per turn) + run scoreboard | **Advisory** in-call classifier labels, **captioned "not the ruling"**; muted hues distinct from the verdict scar; never a posture/momentum meter (inherits `../03-mapping.md` honesty + DESIGN.md §4). |
| **M17** `[LV]` | P4: grasp posture in one read | "Is the agent safe, is this real?" without jargon | **V1 Glance** — abstracted posture + worst-finding-in-one-sentence + one proof | Highest abstraction; **omits, never fakes** anything it can't show honestly; always offers roll-down. **Build deferred (`D-LV3`)**; documented now. |
| **M18** `[LV]` | P5/P2: move between abstraction and evidence without losing place | Zoom up/down the same run | **`ZoomControl` roll-up/down continuum** (V1↔V2↔V3) | **State-preserving** (focused play, scroll, filter); **disclosure-monotonic** (confidential method appears only at V3); keyboard + deep-link parity (`D-LV2`). |
| **M19** `[LV]` | P2: drill from a live moment to full evidence | The full transcript + judge panel for the focused play | **Roll-down to V3 = Observation Detail (C6), reused** | V3 **is** the secured detail tier (the disclosure boundary, §1/M9). Reuses C6's contract + field freeze (D6/D8); **not a new screen**. |
| **M20** `[LV]` | P5: trust the panel verdict | Know how many judges actually ruled, honestly | **Real `nJudges` rendering** — 3-panel / 1-oracle ("specialist judge") / degraded ("N of 3 · M unavailable") | **Never hardcode 3** (the judge-panel guard, `../04-uiux-plan.md` "guards on `judge_votes.length`"). Verified against live `state.json` (nJudges ∈ {1,2,3}). |
| **M21** `[LV]` | all: never be misled by a degraded run | Honest live degraded/blocked/errored states | **First-class degraded renderers** (blocked = "could not reach — not assessed"; errored = "no verdict"; recon-skipped = honest strip) | **Never a faked verdict**; a 404 is not a fabricated TRAI/DNC refusal (inherits the live-view honesty work + DESIGN.md §4). |
| **M22** `[LV]` | P3: land the demo in 3 minutes | Narrate recon→plays→verdict at presentable speed | **Demo-pace replay in the Arena** (real captured run, replayed) | **= M2's replay mode**; labelled as a replay of run `ER-0x`; **no fabricated data** in either live or replay. |

## §screen — The Live View in the screen set (extends `../03-mapping.md §3.2`)

The Live View is **one new surface** (three zoom tiers), reachable from the funnel — **not** seven new screens:

8. **Live View** — `V1 Glance` (M17, deferred) · `V2 Arena` (M14–M16, M20–M22) · `V3 Forensic` (M19 = reuse of C6). Reached from **Processing** (watch a running audit) and from **Findings** (re-enter a completed run's duel). The `ZoomControl` (M18) is its spine.

## §cuts — Explicit scope decisions (extends `../03-mapping.md §3.3`)

| Decision | Rule | Re-enters |
|---|---|---|
| **V1 Glance — design now, build later (`D-LV3`)** | Over-abstraction risk un-validated (`01-research.md` R-3); deferring de-risks without losing the continuum | After a clickthrough validation with an exec stakeholder |
| Arena adds **no** new engine capability | Every live signal already exists in `state.json` (verified); the surface *displays*, never promises (DESIGN.md §4) | n/a (by design) |
| Full attack chain stays **V3-only** | IP protection (F4 / M9); V1/V2 carry landing-turn / abstraction only | Never (by design) |

## §dep — Live-view dependencies (parallel to `../03-mapping.md §3.4`)

| Dep | What the surface needs | Reality | Handling |
|---|---|---|---|
| **D-LV-dep1** | The funnel screens (Processing C4, Findings C5, Detail C6) to exist for roll-up/down to land in | Documented (canonical), not yet built | The Live View plan references them by ID; V3 **is** C6. If a funnel screen isn't built, the continuum still works within the Live View tiers and links out honestly. |
| **D-LV-dep2** | The per-turn arc/beat/verdict **projection** the Arena binds to | **Prototype-only — NOT in the canonical engine.** Produced today only by `aarav-live/run_stream.py` writing a **local file**; absent from `autosentinx/runner.py` / `/runs/{id}`. The field paths exist *there*; per-play `arc/beats/labelTrend/phasePlan/turns/pivotTurn/arcComplete` + per-play `verdict.{productOutcome,panelOutcome,score,nJudges,nCommitted,votes,detectors,agentSelfReportedClean,bypass,gateDelta}` + run-level `recon/summary/engine/status`. | See **D-LV-dep3**. |
| **D-LV-dep3** *(parallel to D8)* | The projection emitted by the **engine** on the **polled** `/runs/{id}` surface (`D-Q15` — no streaming) | **Not built** (prototype writes a local file). | **IN SCOPE NOW (F2, 2026-06-19):** port the per-turn arc/beat/derive-outcome projection into the engine + expose it on the poll, as a Stage-6+ backend task alongside D8. Outcome derivation **reuses the canonical rule** (`D-Q4`/`D-Q10`/`D-Q19`), not the hand-rolled prototype copy. |
| **D-LV-dep4** *(F3 coverage)* | The duel to span **both Security + Compliance** pillars | **Compliance-only today.** Root cause: the prototype `PLAYS` list (`run_stream.py:56-65`) is 8 hardcoded **compliance** objectives; the catalog **has 4 Security-pillar objectives** (`objectives.yaml` L167/185/220/322) that are never selected. D8 (the Security observation) also unbuilt. | **IN SCOPE NOW (F3, 2026-06-19):** the engine-driven run selects from the **full catalog across both pillars**; **double the coverage budget** (play/objective count — today `len(PLAYS)=8`) so both pillars get real coverage; D8 emits the paired Security+Compliance observations. The Arena renders whatever pillars the run produces (`ModuleTag`), honest if a pillar is absent. |
| *(inherited)* `D6` `D7` `D8` | per-pillar split, frozen fields, bypass source | per `../03-mapping.md §3.4` — **referenced, not re-keyed here** | V3 inherits C6's handling; V2 degrades gracefully (M21). |
