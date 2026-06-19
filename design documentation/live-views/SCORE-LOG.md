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
- Verified: 0 type + 0 console errors. The full both-pillar run is still filling the Compliance band (breaches incoming) for a final complete-board capture.

**Trajectory: 71 → 83 → 89 → (round-4 closes the #1 gap + the staged overturn).** Loop continues; next: final both-pillar board capture + round-4 score.
