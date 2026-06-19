# Live Views — Stage 4: UI/UX Plan (the approval artifact)

> **Structure, not pixels.** IA, navigation, journeys, and the *bones* of each tier — before any visual flair. Styling/colour/motion choreography come in the spec (post-approval). Every region traces to a mapping ID (`M14+ [LV]`) and obeys `../DESIGN.md` + `00-foundation.md`. **Stop-for-approval after this document** (`../00-PROCESS.md §0.5`).

---

## A. Information architecture — the Live View as a zoom continuum on the funnel

The Live View is **one surface, three zoom tiers**, not new funnel steps. It overlays the existing funnel at the two points where "the run itself" is the subject:

The run has a durable home with **two tab-switched result screens** (`D-Q21`): **Overview** (`/runs/[id]`) and **Findings** (`/runs/[id]/findings`). The Live View is a **projection mode** of a run — **orthogonal** to those tabs — reachable from Processing (live) and the run home:

```
                                         ┌──── in-run tab nav (D-Q21) ────┐
Landing ─▶ Login ─▶ Run Config ─▶ Processing ─▶ Overview ⇄ Findings ─▶ Observation Detail
  (M12)    (M13)      (M1)        (M2)  │       /runs/[id]  /…/findings │      (C6 = V3)
                              watch live│       │  open the duel        │ row→  ▲
                                        ▼       ▼                       │ obs   │ roll-down (M19)
                                  ┌─────────────────────────────────────┴───────┴──┐
                                  │   LIVE VIEW (M14+) — a projection of the run     │
                                  │   V1 Glance ◀▶ V2 Arena ◀▶ V3 Forensic (= C6)    │
                                  │    (M17)        (M14-16)        (M19)            │
                                  │      └────── ZoomControl (M18, projection mode) ─┘
                                  └──────────────────────────────────────────────────┘
```

**Navigation model (M18, `D-LV2`):**
- **`ZoomControl`** — a segmented control `[ Glance · Arena · Forensic ]`; the **projection-mode** primitive of the Live View, **orthogonal** to the Overview·Findings tab nav (`D-Q21`) which still owns "where am I in the run." Entering V2/V3 is a *mode* of the current run, not a new tab; the tab nav persists. Persisted to `localStorage` + URL (`?view=v1|v2|v3`); a **deep-link `?view=` wins over stored preference**. **Default = Arena (V2)**; **Glance (V1)** is a `RoadmapLock` (deferred, `D-LV3`) — roll-up **caps at V2** until V1 ships.
- **State-preserving:** the focused **play**, scroll, and rail filter are **carried across zoom**.
- **Disclosure is AUDIENCE-scoped (`D-LV6`):** **V2 Arena is internal** (P5/operator, AutoSentinx team) → shows full strategy, intents, phase-names, and (on drill) the chain. **Customer-facing** tiers apply `../DECISIONS.md D-Q12`: **V1** (NBFC exec) = landing + abstraction; the **customer's Observation Detail (C6)** = landing + anonymized judge panel + detectors + crosswalk, **no full chain**, under the §8 handling frame. The customer never sees V2; roll-down *within* the internal continuum deepens evidence toward an internal full-detail forensic view.
- **play → observation (`D-Q2`/`D8`):** roll-down from a breached **dual-duty** play opens the **`primary_pillar` (or higher-severity) observation by default**, with a **paired-link** to the other (mirrors C6's paired-finding link); roll-**up** always returns to the originating **play**.
- **Entry / exit:** **Processing (C4)** "Watch the duel" → V2 (live). **Run home** "Open the duel" → V2 (completed, replayable). A **table row → V3** (existing C6 path) lands in Forensic with `ZoomControl` to roll *up* to the owning play. The two entry controls are **new affordances on canonical screens → proposed as canonical edits (§F).** `Back to Findings` (C6's own) and the `ZoomControl` roll-up coexist with **distinct destinations** (Back → Findings table/row focus; roll-up → V2 focused play) — both stated, never merged.
- **Wordmark / New audit / Export** reuse the post-run top bar; the Live View adds only the `ZoomControl`.

---

## B. Key user journeys (extend `../04-uiux-plan.md §B`)

- **J5 — Operator demo duel (P3).** Run Config → Processing → "Watch the duel" → **V2 Arena** (live, or a labelled replay, M22) — paced as its own timeline (recon prelude → arc fill → `StrategyBeat` → `VerdictReveal`) targeting **< 90s with narration**, inside the 3-min budget; the demo goes **Processing → Arena** (the Arena's `VerdictReveal` IS this path's one orchestrated moment — never also the Findings reveal, `00-foundation.md` LV-4). Operator narrates → roll **down** to V3 for one piece of proof → roll **up** to the **V2-R3 campaign scoreboard (the posture read this pass)**. *(V1 Glance is the future exec-only posture tier; deferred — roll-up caps at V2.)* *The persuasion path.*
- **J6 — Admin supervision (P5).** Open a completed run → **V2 Arena** → scan the **`IntegrityStrip` stakeout map** (6 held / 1 breached / 1 not-assessed) → focus the breach → read verdict + gate-delta + **real `nJudges`** → **roll down (V3)** to confirm → go/no-go or escalate to P2/P1. *Catches the silent bypass / quietly-degraded pass (M21).*
- **J7 — Exec glance (P4, deferred build).** Open run → **V1 Glance** → posture + worst-finding-in-a-sentence + one proof → (optionally) roll down to V2 if pressed. *Confidence in one read.*
- **J8 — Roll-up/down (cross-cutting, M18).** From any tier, `ZoomControl` (or `?view=`) moves up/down with state preserved; reduced-motion = instant; keyboard-operable.
- **J-fail — degraded live (M21).** recon blocked / play errored / judge 503'd → honest tiles, no faked verdict, roll-down shows "not assessed".

---

## C. Screen inventory & bones

Notation per `../04-uiux-plan.md §C`: `▭` region, top→bottom = priority. **Bones only.** Region IDs `V#-R#`.

### V2 · ARENA  · owner P5, drives P3 · M14–M16, M20–M22
**Purpose:** the live duel **with crucial detail preserved** — review the moments that matter without the wall of turns; one click to evidence.
**Bones:**
```
▭ V2-R1  top bar (reuses post-run bar): wordmark(→run home) · RunProvenance ref
          (ER-01 · agent · IST) · ZoomControl [Glance·Arena·Forensic] · New audit · Export · account
▭ V2-R2  RECON PRELUDE — "how the attacker forms its read"
          · 3 intel facts (discloses-AI? · stays-in-scope? · refusal-style) when present
          · the one honest intel→objective link  ·  HONEST BLOCKED STRIP when recon skipped (M21)
▭ V2-R3  CAMPAIGN SCOREBOARD + PLAY RAIL (the stakeout map)
          · one-line story ("1 breached — the agent never caught it · 6 held · 1 not assessed")
          · per-play tile: SeverityChip glyph · objective id · OutcomeBadge(running/judging/HELD/BREACHED)
            · IntegrityStrip (held/wavered/yielded per turn, advisory, always-legend'd) · breach scar · ★ critical-held
          · always-on strip legend (held · wavered · agent yielded — advisory)
▭ V2-R4  THE FOCAL DUEL
          · CombatantHeader: [attacker — technique · persona]  vs  [target — AARAV · shield/holding]
            (line icons, no emoji; composes ModuleTag + SeverityChip + RegulationCite)
          · AttackArc: technique-relative phase spine; nodes reached/current/future/BREACH-POINT;
            StrategyBeat tags (re-angle ▸ brand · concede ↳ warn); advisory pip row (captioned)
          · one-line "current line" caption (current phase intent)  ·  arc-complete vs ran-out-of-turns
▭ V2-R5  VERDICT / CLIMAX  (VerdictReveal — the one orchestrated settle, LV-4)
          · OutcomeBadge HELD/BREACHED (+ CRITICAL weight)
          · BypassSignal (gate-delta hero): "The agent believed it held. The judges disagree."
            — degrades to "Sentinx panel: FAIL" for non-self-reporting targets (D7)
          · one-line gate verdict: panel/oracle · N of <real nJudges> · self-report clean/flagged
            [▸ gate detail] → per-judge chips + detector hits (collapsed by default)
          · verbatim winning judge reason (mono) ·  HeldState band for PASS (+ ★ critical-held)
▭ V2-R6  ROLL-DOWN affordances
          · click an arc node → that phase's landing exchange (Probe + Target reply, mono, Devanagari-aware) — landing only
          · "Open full forensic view →" → V3 (=C6) with focus + pivot preserved
```
**Hierarchy:** verdict + gate-delta > the duel (arc) > scoreboard > recon. **Detail preserved, not overwhelming:** the gate triple-cell, per-judge chips, and detectors are **collapsed** behind "gate detail"; the full transcript is **V3 only**. **Honesty:** every advisory signal captioned "not the ruling"; real `nJudges` (M20); degraded states first-class (M21).
**States:** live-streaming · judging (static "panel grading", no loop) · done · **degraded** (blocked / errored / recon-skipped) · **replay** (labelled, M22) · queued/empty. **Theme:** light default + dark console (both first-class, §2). **Reduced motion:** all info static; the VerdictReveal degrades to an instant highlight (LV-4).

### V3 · FORENSIC  — **reuses Observation Detail (C6), entered live** · owner P2 · M19
**Not a new screen.** V3 **is** `../04-uiux-plan.md §C6` (Observation Detail) — full transcript, judge panel, bypass signal, detectors, regulation cites, against the frozen field schema (D6) and the two-row model (D8). The Live View only adds:
```
▭ V3-R1  the ZoomControl in the top bar (roll back UP to Arena/Glance), focus preserved
▭ V3-R2  entry context: arrived from the Arena's focused play at its pivot turn (scroll-to + highlight)
```
**Disclosure boundary (§1/M9):** V3 is the secured tier — full chain visible here and nowhere above it; the §8 handling/synthetic-data frame is mandatory here and on export. **Everything else in V3 follows C6 verbatim** (its states, mode-variants, accessibility) — *do not re-spec C6 here; reference it.*

### V1 · GLANCE  · owner P4 · M17 · **BUILD DEFERRED (`D-LV3`) — bones documented**
**Purpose:** posture + persuasion in one read for a non-technical sponsor; no forensic depth.
**Bones (for the continuum's completeness; not built in this pass):**
```
▭ V1-R1  POSTURE HEADLINE — plain verdict ("Your agent held under every attack" /
          "Your agent issued a legal threat after a medical-emergency plea") — verdict-first, one sentence
▭ V1-R2  ONE PROOF — the single worst landing exchange, abstracted (Probe + Target reply, glossed)
          + the bypass line if present ("its own safety check missed this")
▭ V1-R3  COVERAGE + ROLL-DOWN — "Sentinx ran N multi-turn Hinglish attacks across Security + Compliance"
          + "See the detail →" (roll down to V2)
```
**Hierarchy:** posture > one proof > coverage. **Honesty (the over-abstraction guard, R-3):** **omits, never fakes**; a degraded run says so plainly; always offers roll-down. **States:** running (posture forming) · clean ("held the line" affirmative, mirrors C5 zero-findings) · at-risk · degraded. *Full bones finalised when build is greenlit.*

---

## D. Content strategy (extends `../04-uiux-plan.md §D`)

- **One reusable content set** — the real F-COM-03 Hinglish coercion example (DESIGN.md §8), shared with the funnel mockups. No lorem.
- **Composed re-voicing** per `00-foundation.md` LV-5 ("breach point", "the agent's guardrail gave way", "live attack in progress") — never "kill node / siege / the defense broke".
- **Verdict-first** at every tier; bilingual evidence in the Devanagari-aware mono stack, `lang="hi"` on genuine Devanagari only (DESIGN.md §5).
- **Advisory captions** mandatory wherever a classifier/detector signal shows ("advisory — not the ruling").

## E. Responsive intent (extends `../04-uiux-plan.md §E`)
- **Desktop/laptop first** (supervision happens on big screens; the arc + rail need width).
- **Tablet:** rail wraps; the focal duel stacks (CombatantHeader → arc → verdict); ZoomControl persists.
- **Mobile:** read-only graceful degradation — scoreboard + focal verdict + roll-down link; the arc becomes a horizontally-scrollable strip; running an audit on mobile is not a goal (parity with `../04-uiux-plan.md §E`).

## F. Decision status & canonical edits proposed (applied ON APPROVAL only)

**Locked in this plan (live-view decisions):** `D-LV1` duel-as-philosophy; `D-LV2` roll-up/down state-preserving continuum; `D-LV3` defer V1 build; `D-LV4` no emoji → line icons; `D-LV5` one orchestrated VerdictReveal.

**Edits to the canonical ladder — proposed, NOT yet applied (per README §5; apply after approval):**
1. `../02-personas.md` — add **P4, P5** (from `02-personas.md` here); append the §2.3 ownership rows; apply the §2.4 supersession.
2. `../03-mapping.md` — add **M14–M22 `[LV]`**; add the "Live View" surface to §3.2; append the §3.3 cuts + §3.4 deps.
3. `../04-uiux-plan.md` — register the **Live View** as screen **C8** (three tiers) in §C, linking the bones here.
4. `../DESIGN.md` — add **§7** component names (`ZoomControl`, `CombatantHeader`, `AttackArc`, `StrategyBeat`, `IntegrityStrip`, `VerdictReveal`, `HeldState`); the **§5 redundant-encoding** rows for the new live states (`00-foundation.md` LV-3b); and a one-line pointer to `00-foundation.md`. No §1–§8 *value* changes.
5. `../04-uiux-plan.md` — register the two **entry affordances** on canonical screens: "Watch the duel" on **C4 Processing** and "Open the duel" on the **run home (C5/Overview)**.

**Forks needing your decision at approval (see `05-critique.md §5.5`):** **F1** how much attacker strategy V2 may show (abstracted-only vs a sanitised intent label = a `D-Q12` amendment); **F2** whether building the Arena's data contract into the engine (`D-LV-dep3`) is in scope now, or V2 stays prototype/demo-only; **F3** Compliance-only duel now vs gating on the security plays + D8.

**Remaining dependencies (not UI forks):** inherits **D6** (frozen detail fields — precondition for V3=C6), **D8** (two-row split), **D7** (bypass source) from `../03-mapping.md §3.4`; **`D-LV-dep3`** (port the Arena projection into the polled engine surface) is the V2 build precondition — see `03-mapping.md §dep`.

## G. What is explicitly NOT in this plan (guard scope creep)
V1 **build** (deferred, `D-LV3`); any new engine capability; the full attack chain above V3; multi-run / Audit-Cycle live views; a separate "Demo Mode" data switch (replay is the same component, M22); cross-run dashboards. *(Per `03-mapping.md §cuts` + `../03-mapping.md §3.3`.)*
