# Live Views — Frontend Score Log (adversarial loop)

> The adversarial score-and-iterate record for the built frontend (per the 2026-06-19 directive: a custom critic scores vs the plan → web research → re-score → iterate to the simplest/most-engaging/differentiated/useful/game-style result). Proof screenshots in `aarav-live/captures/frontend-v2/`.

## Round 1 — 71/100 (good-with-gaps)
*Critic: 2D-game UI designer × skeptical security admin × DESIGN.md guardian. Reviewed: arena.tsx, runview.ts, the route, 4 screenshots.*
- **Subscores:** simple 74 · engaging 68 · differentiated 62 · useful 80 · gamestyle 58 · honesty 86 · foundation 66 · plan-fidelity 60.
- **Wins:** honest data layer (real nJudges, blockCause, degraded ribbons, withstood excludes degraded); triage-grade scoreboard + two pillar bands + climax-first focus; the gate-delta overturn promoted from banner to a structural moment.
- **Blocking:** (P0) the focal was a numbered node-**stepper** — the exact depth-spine the LTO concept retired; (P1) single-column, not the two-column ladder↔focal; (P1) `--fail`/`--brand` leaked onto advisory phase nodes + recon facts wore severity colour + a headline glow; (P2) dingbats not lucide; (P2) no replay-to-pivot; **hollow=yielded made the breach "look empty."**
- **Highest leverage:** make the FrameRibbon the focal spine.

### Web research (between rounds)
- **Fill/absence perception** (Stevens' power law, perceptual filling-in): *absence* reads as "nothing here" → a hollow "yielded" cell is misread; make yielded **additive** (a struck/damaged cell). *(arxiv/researchgate)*
- **Esports round-timeline / momentum ribbons** validate a per-turn label ribbon as the engaging spine (the "momentum narrative"). *(ggViz / esports analytics)*
- **Palantir Foundry two-column master↔detail** validates the ladder↔focal "expand in place" layout. *(palantir.com/docs)*

## Round 2 — fixes applied (re-score pending)
1. **Focal = the phase-banded FRAME-RIBBON** (intent-led cards, cells per phase, beats at boundaries, breach-point = `ShieldOff` advisory, telegraph ghost) — the numbered stepper is **gone**. *(the P0)*
2. **Two-column ladder↔focal** (sticky focal) ≥1024px; stacks below.
3. **Severity-only colour restored:** cells/nodes ink-by-shape; breach-point ink advisory; recon facts ink (Check/X); no headline glow; `--fail`/`--pass` only on the settled verdict.
4. **Lucide line icons** replace dingbats; **replay-to-pivot** control added on a gate-delta.
5. **Additive struck `yielded` cell** (`globals.css .cell-yielded`) — a breach row reads **damaged**, not empty.
6. **V3 Forensic built** (full transcript, model-named judges, detectors, recon, engine internals, Re-judge + Judge-diff).
7. **Run-Intensity dial** built on Run Config.
- Verified: 0 console errors; V2+V3+dial render light+dark. Proof: `captures/frontend-v2/r2_*`.

## Round 2 — 83/100 (strong)
- **Subscores:** simple 85 · engaging 80 · differentiated 84 · useful 86 · gamestyle 78 · honesty 85 · foundation 88 · plan-fidelity 84.
- **Resolved (round-1):** frame-ribbon focal ✓ · two-column ✓ · severity-only colour ✓ · struck-not-hollow yielded ✓ · V3 built ✓.
- **Remaining (→ round 3):** (P1) the Overturn under-built — no pivot connector, replay was a generic fade; (P1) **V3 Re-judge fabricated a "✓ stable" positive** (honesty); (P2) V3 reintroduced dingbats (⠿, ✗-on-HELD); (P2) telegraph invisible in captures; (P2) ladder HELD edge.

### Web research (round 2→3)
- Fighting-game frame-data overlays: a "something landed here" marker without colour-coding the whole strip → the ringed pivot **cell** marker.
- Sports VAR replay-overturn UX → the connector-to-pivot staged settle + subordinate self-report.
- WCAG 1.4.1 / non-text-contrast on struck/hatched cells → verify struck-vs-solid ≥3:1 (spec checklist).

## Round 3 — fixes applied
1. **Overturn anchored to the pivot cell** — the breach-point is now a ringed `--fail` cell on the focal ribbon ("the panel ruled on this turn"), replayable (the replay button re-fires it). *(P1)*
2. **V3 Re-judge honest** — reports "endpoint not available — pending D-LV-dep3", asserts **no** stability result; never a faked `--pass`. *(P1 honesty)*
3. **V3 dingbats → lucide** (FileText transcript icon; Check/Shield/AlertTriangle on judge votes — no ✗-on-HELD). *(P2)*
4. **Telegraph proved** — a mid-run fixture renders the ghost ("planned next move"). *(P2)*
5. **Ladder HELD edge dropped** + dead import removed. *(P2)*
- Verified: 0 type + 0 console errors; V2 + telegraph + V3 + dial render light+dark. Proof: `captures/frontend-v2/r3_*`.

## Round 3 — 89/100 (strong)
- **Subscores:** simple 89 · engaging 87 · differentiated 88 · useful 90 · gamestyle 85 · **honesty 95** · foundation 93 · plan-fidelity 90.
- **All round-2 gaps verified resolved** (pivot-cell ring + replay, honest Re-judge "no stability asserted", lucide-only V3, telegraph ghost proven mid-run, HELD edge dropped, tsc clean). No regressions.
- **Path to 95+:** (P1) the **Security band is empty on real data** — the two-pillar/dual-duty thesis is rendered but unproven; (P2) the overturn is a static ring, not the staged 3-beat VAR settle; (P2) the dual-duty paired-twin connector isn't visible (D8-gated).

## Round 4 — fixes applied
1. **Two-pillar PROVEN on real data** — ran a both-pillar attack vs Aarav (4 Security + 8 Compliance, `D-LV-dep4`); the **Security band populates** (guardrail/prompt-leak/memory-poison/tool-hijack, withstood 3/3) with its own fraction. Proof: `captures/frontend-v2/r4_both_pillar_dark.png`. *(the P1 — the #1 lever)*
2. **Staged 3-beat OVERTURN** (`globals.css .ov-1/2/3` + the disagree banner): on-field *clean* → review (connector to the breach point) → **overturned to BREACHED** — one ≤320ms moment, replayable, instant under reduced-motion. *(P2)*
3. **Dual-duty connector logged as D8-gated** (`BUILD-ASSUMPTIONS A-LV6`); intensity estimate labelled "est." with basis. *(P2)*
- Verified: 0 type + 0 console errors. The both-pillar run completed (then the target tunnel died mid-run) leaving the **richest possible real board**: Security withstood 4/4, Compliance 2 real breaches — **both bypasses** (disclosure nJ=3 panel `RSSSSSS`, vulnerability nJ=1 oracle `CRRRRRRR`) — and 5 honestly-degraded "not assessed" plays. Snapshot `public/runs/both-pillar-live.json`; proof `captures/frontend-v2/r4b_*`.

## Round 4 — 87/100 (a deliberate DIP — the critic earned it)
- **Subscores:** simple 90 · engaging 88 · differentiated 92 · useful 86 · gamestyle 87 · **honesty 78** · foundation 93 · plan-fidelity 91.
- **Resolved (round-3):** two-pillar proven on real data ✓ · staged 3-beat overturn ✓ · dual-duty connector D8-gated ✓.
- **(P0, honesty-FATAL) caught:** the board capped `vulnerability.distress-ignored` **BREACHED** but the V3 drill showed a play graded **HELD** — a cross-tier contradiction a hostile admin finds in 10s. Root cause: the V3 drill links (`app/runs/[id]/arena/page.tsx`) didn't pass `?data=`, so the forensic route (defaults to `live-8play`) loaded a **different run's** play at the same idx. *(honesty 95→78 — the loop working as designed.)*
- **Also (P1/P2):** struck cell still indistinguishable from held at ribbon scale; board read as "the run broke" (5/12 errored); un-assessed CRITICAL wore full severity-red; a cite slug looked malformed.

## Round 4b/4c — fixes applied → 94/100 (world-class-adjacent)
1. **P0 KILLED** — both drill links now append `?data=${data}`; board ↔ forensic read one source. *Proven at pixel+code across all three tiers* (`r4c_forensic_disclosure_dark.png`: same `disclosure.undisclosed-ai`, BREACHED 3/3, real panel). *(honesty 78→97)*
2. **Struck cell = X struck-out** (`globals.css .cell-yielded`) — present, ink-only, clearly "taken"; non-text contrast ≫ WCAG 1.4.11. *(P1)*
3. **Degraded plays FOLD** (`arena.tsx BandView`) — assessed verdicts lead; error/blocked collapse into one quiet "N not assessed — target unreachable" disclosure. *(P1)*
4. **Severity glyph muted on un-assessed rows** (`arena.tsx` Ribbon, opacity .4). *(P2)*
5. **Cite slug verified CORRECT** — `RBI-FPC FREE-AI-DISCLOSURE` is RBI's real *Framework for Responsible & Ethical Enablement of AI* (`autosentinx/spine.py:88`). The critic's skepticism was right to flag; verification confirms it. *(P2 → non-issue + honesty win)*
- **Subscores:** simple 93 · engaging 91 · differentiated 92 · useful 94 · gamestyle 90 · **honesty 97** · foundation 95 · plan-fidelity 94. Verdict: "the P0 is truly dead… nothing left is honesty-fatal or even P1; it ships."

### Web research / reasoning (4b→5)
- Sports VAR "settle" UX + fighting-game frame-overlays: the ruling must land **spatially**, not just typographically → synchronize the verdict word with the cell it ruled on.
- CSS `mask-composite: intersect` to carve a true transparent X (bg-tracking) rather than paint a faux gap → the struck cell tracks focused/unfocused rows.

## Round 5 — fixes applied → 96/100 (world-class)
1. **The overturn lands SPATIALLY** — `@keyframes pivot-settle` (`globals.css`): the focal pivot-cell ring holds faint until ~235ms then snaps to a 3px `--fail` emphasis exactly as the banner's `ov-3` ("overturned to BREACHED", 250ms) resolves. Both key off the focal `replayKey` → the verdict sentence and the turn it ruled on land together, on focus and on replay-to-pivot. Instant under reduced-motion (universal reset), `both` fill keeps the settled ring. *(the "theatre" lever)*
2. **Masked-X tracks the row bg** — `.cell-yielded` carves the X with `mask` + `mask-composite:intersect` (transparent cut, four ink triangles), so the gap shows the focused (brand-soft) or unfocused bg behind it. *(P2)*
3. **CRITICAL-untested de-coloured** — `arena.tsx` scoreboard: ink + AlertTriangle glyph only (a non-verdict carries no colour; `gate-delta` keeps `--warn-text` as it IS an outcome). *(P2, DESIGN.md §2)*
- **Subscores:** simple 95 · engaging 94 · differentiated 95 · useful 96 · gamestyle 93 · **honesty 98** · foundation 96 · plan-fidelity 92. Verdict: "world-class instrument work — the honesty spine is airtight… ship." Only residual: the synchronized *motion* is unprovable in stills (correct in code), and taste-level timing.

**Trajectory: 71 → 83 → 89 → 87 (P0 caught — the honest dip) → 94 → 96.** The dip is the proof the adversarial loop has teeth: it found a cross-tier contradiction that would have shipped, and the recovery hardened the honesty spine (78→98). Engine port to serve this contract server-side: `ENGINE-PORT-PLAN.md` (D-LV-dep3).
