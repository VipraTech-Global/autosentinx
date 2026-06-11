# BACKEND-UPDATE-2 — AutoSentinx pull diff vs design dependencies

**Date:** 2026-06-12
**Baseline:** `b1dd5bc` (Phase-3 Objective catalog)
**New HEAD:** `bad0619` (Cloud Run deploy scaffolding; D7 resolved)
**Status:** REPO CHANGED — 6 new commits (Phases 4–7 + deploy/docs). Major backend evolution.

---

## 1. PULL — new commits since `b1dd5bc`

`git pull` fast-forwarded `b1dd5bc..bad0619` (36 files, +2412/-287). New commits, newest first:

```
bad0619 deploy: Cloud Run Dockerfile + build scaffolding; refresh requirements; D7 resolved (DB now AutoSentinx-only)
b1a6e44 docs: D9 resolved (early-stop fix shipped in Phase 6)
620370a docs: rewrite README for the full system
7b34431 Phase 7: ingestion (autonomous) + governance (approval gate + hash-chained audit)
c14fecb Phase 6: advanced oracles (fairness + vulnerability + mis-selling) — all 16 modes gradeable
4269157 Phase 5: budget-driven Discounted-UCB selection + MAP-Elites coverage
0b97ff1 Phase 4: composable Technique library (Objective × Technique × Persona × CSRT)
b1dd5bc Phase 3: Objective catalog  <-- our previous baseline
```

---

## 2. DIFF — what changed (substantive)

- **Phase 4 (composable techniques):** new `Technique`/`Persona` tables fully populated (6 techniques in `technique-seed/`, 5 personas in `persona-seed/`), materialized M:N `objective_technique_map`. The 28 hardcoded plays / `prompt-lib` are retired. `Attempt` gained `technique_slug`, `persona_slug`, `csrt`. New `autosentinx/attacker/composable.py`, `library.py`.
- **Phase 5 (selection + coverage):** new `TechniqueStat` table (Discounted-UCB bandit memory), `selection.py`, `coverage.py` (MAP-Elites). New routes `/coverage`, `/selection/stats`.
- **Phase 6 (advanced oracles):** new `oracle/fairness.py` and `oracle/special.py`. Three previously-`draft` catalog objectives (FAIRNESS_VIOLATION, VULNERABILITY_FAIL, MIS_SELLING) flipped to `active`. **D9 early-stop fix** shipped (runner.py:335). The StrongREJECT `oracle/panel.py` is BYTE-FOR-BYTE UNCHANGED.
- **Phase 7 (governance + ingestion):** new `AuditEvent` (hash-chained) and `IngestionRecord` tables; `Run` gained `roe`, `approved_by`, `approved_at`, and a `pending_approval` status. `/scan` now creates a pending run; new routes `/runs/{id}/approve`, `/ingest`, `/audit`. New `audit.py`, `ingestion.py`.
- **Deploy / D7:** Dockerfile + Cloud Run scaffolding; the 17 RegSentinel tables were DROPPED — Neon is now AutoSentinx-only (13 tables).
- 3 new Alembic migrations: `8f88ef9f21f4` (Phase 4), `0c960bf51bc5` (Phase 5), `2ddc53662209` (Phase 7).

---

## 3. IMPACT ASSESSMENT — 18 design-load-bearing facts

### a. FINAL GRADER = StrongREJECT 3-judge panel, majority vote, per-turn classifier only early-stops
**CHANGED (additive — partly BREAKS the "always 3-judge panel" assumption).**
- The StrongREJECT panel (`oracle/panel.py`) is unchanged: strict majority over full transcript, surviving-judge fallback (panel.py:52). Classifier still only early-stops (runner.py:335–336, with the D9 fix: early-stop only fires after the technique reaches its final phase).
- **BUT** Phase 6 added a per-mode oracle router (`runner._oracle_verdict`, runner.py:67–73). Three modes now bypass the 3-judge panel:
  - `VULNERABILITY_FAIL` and `MIS_SELLING` → **single specialized judge** (`oracle/special.py`, `n_judges=1`, `n_committed ∈ {0,1}`).
  - `FAIRNESS_VIOLATION` → **paired cross-run fairness oracle** (`oracle/fairness.py`), a different flow entirely (`run_fairness`, runner.py:214) with `judge_votes` carrying a `FairnessVerdict`/`PairVerdict` shape, NOT `JudgeVerdict`s.
- **Design impact:** the UI can no longer assume `judge_votes` always has length 3. For VULNERABILITY_FAIL/MIS_SELLING it's length 1; for FAIRNESS_VIOLATION it's a different object. See fact (b)/(i) below — this directly affects the RISK-tier synthesis and the judge-panel render.

### b. OUTCOME enum lowercase `succeeded|defended|unknown|blocked|error`; binary; UI synthesizes RISK from judge_votes (1 of 3 committed)
**CHANGED.**
- Enum still lowercase and still the authoritative set, mapped in runner.py:348. `error` (runner.py:116,131,196), `blocked` (runner.py:278,316) still emitted. `models.py:79` default is now `"defended"` (was already, immaterial).
- **NEW value: `"sample"`** — emitted by `_run_fairness_sample` (runner.py:296) for the two raw per-persona transcripts in a fairness pair. These are NOT findings; they're paired evidence rows. The real fairness verdict is a separate summary `Attempt` with `outcome=succeeded|defended` (runner.py:251). **The UI must filter out `outcome=="sample"` rows** or they'll appear as bogus findings.
- **RISK-synthesis BREAKS for 3 modes:** "exactly 1 of 3 committed = RISK" assumes a 3-vote panel. For VULNERABILITY_FAIL/MIS_SELLING there is only 1 vote (1-of-1 → SUCCEEDED, 0-of-1 → DEFENDED; no "split" possible, so no RISK tier is derivable). For FAIRNESS_VIOLATION the votes aren't `JudgeVerdict`s at all. RISK synthesis remains valid for the 13 panel-graded modes. **Recommendation:** gate the RISK rule on `judge_votes.length === 3 && all entries have a `committed` field`, else fall back to binary outcome.

### c. Attempt fields; severity + primary_pillar on joined Objective via objective_slug
**CHANGED (additive — does not break; new joinable fields).**
- All previously-relied-on fields still present (`objective_id, objective_slug, mode, rule, persona, outcome, verdict_score, judge_votes, detector_hits, num_turns, error`). Confirmed `Attempt` in models.py:64–84.
- **NEW Attempt fields:** `technique_slug`, `persona_slug`, `csrt` (bool). Severity + `primary_pillar` still live ONLY on `Objective`, joined via `objective_slug` — UNCHANGED. Note `objective_id`'s meaning shifted to a human run label (e.g. `"actor-attack→disclosure.undisclosed-ai"`) — don't treat it as a stable id; use `objective_slug` for the join (you already do).
- `/runs/{id}/transcript` now also returns `technique`, `persona` (= persona_slug), `csrt` (app.py diff). `/runs/{id}` returns the full `{run, attempts:[{attempt, turns}]}` blob unchanged.

### d. SEVERITY `low|medium|high|critical`; MODULE = primary_pillar (compliance|security); 18 compliance / 4 security
**UNCHANGED.**
- Severity scale intact (`Objective.severity`, models.py). Catalog counts verified: **18 `primary_pillar: compliance`, 4 `security`** (unchanged). Severity distribution: 2 critical / 15 high / 4 medium / 1 low across 22 objectives.
- Only catalog change: 3 compliance objectives flipped `draft→active` (now gradeable via Phase-6 oracles). Pillar split and severity scale untouched.

### e. ONE attempt → ONE objective → ONE pillar; NO per-duty two-observation split (contract D8 still backend work)
**UNCHANGED — still required backend work; NOT yet built.**
- Searched the whole tree: no `observation` table/concept, no per-pillar / two-observation / dual-evidence emission. One `Attempt` still maps to one `objective_slug` → one `Objective.primary_pillar`.
- The closest new structure (fairness) emits multiple rows per logical test but they're all the SAME objective/pillar (paired evidence), not a security+compliance split.
- **Design impact:** contract D8 (emit a Security observation AND a Compliance observation, each linked, each with its own evidence turn) is still entirely on the backend to-do list. No help, no break — assumption holds, work outstanding.

### f. BYPASS signal: Turn.compliance_clean / violations captured per-turn, NOT computed into a field
**UNCHANGED.**
- `Turn.compliance_clean: Optional[bool]` and `Turn.violations` (JSON string) still per-turn, still AARAV's own self-report, still NOT rolled up into any Attempt field (models.py Turn; populated runner.py:329–330). There is still no derived "bypass" flag. The runner docstring still defines a real bypass as "our verdict SUCCEEDED while AARAV's gate reported clean" — computed nowhere; the UI must derive it.

### g. CONNECTIVITY fixed to AARAV sandbox (no arbitrary-endpoint targeting)
**UNCHANGED.**
- `target_url`/`AaravTarget.base` still resolves to `settings.aarav_base_url` (target.py:42, app.py:115). The new RoE records a `target` field but it is just `s.aarav_base_url` (app.py:113) — no operator-supplied arbitrary endpoint. No allowlist/arbitrary-target plumbing was added. (Minor: `start_session` now soft-fails on HTTP errors and rotates contacts — internal robustness only.)

### h. NO event-streaming endpoint (UI polls /runs/{id}); runs persist in Neon
**UNCHANGED (with a polling nuance).**
- No websocket / SSE / StreamingResponse anywhere (grep clean). `/runs/{id}` still the poll target (app.py:301) and runs persist in Neon. UI polling model intact.
- **Nuance:** a run now starts in `status: pending_approval` and does NOT execute until `POST /runs/{id}/approve`. So polling `/runs/{id}` after `/scan` will sit at `pending_approval` (num_attempts=0) until approval. If the findings UI ever triggers scans, it must call the approve route (or the run never progresses). Pure read/poll of existing completed runs is unaffected.

### i. judge_votes shape `{model, committed, specificity, reason}`; detector_hits `{turn, group, detector, match}`
**CHANGED for some modes; UNCHANGED for panel-graded modes.**
- `detector_hits` shape UNCHANGED: `DetectorHit{turn:int, group:str, detector:str, match:str}` (detectors.py:50–53). `group ∈ {COERCION, IMPERSONATION, DATA_BREACH, MIS_SELLING}`.
- `judge_votes` for **panel + special (VULNERABILITY/MIS_SELLING)** modes: still a list of `JudgeVerdict{model, committed, specificity, reason, error}` (judge.py; runner.py:353) — UNCHANGED shape (note `error` field also present; an errored judge has `error` set + counts as not-live).
- `judge_votes` for **FAIRNESS_VIOLATION** summary attempts: a **DIFFERENT shape** — `json.dumps([FairnessVerdict.model_dump()])` (runner.py:252), i.e. `{outcome, varied_attribute, effect_size, n_pairs, disparate_pairs, dominant_worse, pairs:[{pair_id, varied_attribute, disparate, worse_group, gap, reason, error}]}`. **A UI that blindly reads `vote.committed/specificity` will get undefined for fairness rows.**

---

## 4. CHANGED items — concrete design impact (HELPS / BREAKS)

| Fact | Change | HELPS / BREAKS | Affected screen/field |
|---|---|---|---|
| a | Per-mode oracle router; 3 modes are single-judge / paired, not the 3-judge panel | BREAKS the "always 3-judge" render assumption | Finding-detail judge-panel widget; any "3 judges" copy |
| b | New `outcome="sample"` (fairness evidence rows); RISK-from-3-votes only valid for 13 panel modes | BREAKS RISK synthesis for VULNERABILITY_FAIL / MIS_SELLING / FAIRNESS_VIOLATION; needs guard + sample filter | Findings list (filter `sample`); RISK badge logic |
| c | New `technique_slug`/`persona_slug`/`csrt` on Attempt; `objective_id` is now a label | HELPS (richer detail: show technique + persona + CSRT chip) | Finding-detail metadata row |
| i | `judge_votes` is `FairnessVerdict` for fairness, `JudgeVerdict[1]` for special modes | BREAKS uniform vote rendering | Judge-panel / evidence panel |
| d (catalog) | 3 compliance objectives draft→active (now gradeable) | HELPS (3 more live finding types) | Catalog/coverage views, mode filter |

**Net:** the central oracle still ends in a lowercase binary `outcome` + `verdict_score` + `judge_votes` + `detector_hits` per attempt, so the core findings table is intact. The breaks are concentrated in (1) the 3-judge-panel assumption and (2) the RISK-tier synthesis, both because Phase 6 introduced **non-3-judge oracles** for 3 of the 16 active modes. The D8 two-observation split (fact e) is still NOT built — still on the backend.

---

## 5. NEW fields / tables / routes / migrations relevant to a findings/observation-detail UI

**New tables (migration `2ddc53662209`, `0c960bf51bc5`, `8f88ef9f21f4`):**
- `auditevent` — hash-chained governance log: `{id, run_id, event_type, actor, detail(JSON), prev_hash, entry_hash, created_at}`. `event_type ∈ scan.created|scan.approved|scan.started|scan.completed|ingest.*`. Surfaceable as a per-run audit trail / chain-integrity badge.
- `ingestionrecord` — provenance of ingested objectives: `{objective_slug, source_type, source_ref, quote, created_at}`. Useful for an objective-provenance tooltip.
- `persona` — `{slug, title, description, attributes(JSON), status}`.
- `techniquestat` — bandit value table per `(objective_slug, technique_slug)`; exposed via `/selection/stats`.

**New / changed Attempt columns:** `technique_slug`, `persona_slug`, `csrt`.
**New Run columns:** `roe` (JSON), `approved_by`, `approved_at`, status value `pending_approval`.
**New Turn fields:** none (compliance_clean/violations already existed).

**New routes (read-side, relevant to UI):**
- `GET /techniques`, `GET /techniques/{slug}` — technique library (strategy, phase_plan, provenance) for finding-detail enrichment.
- `GET /coverage?run_id=` — MAP-Elites archive + QD-score + gap register.
- `GET /selection/stats` — per-objective×technique ASR/value table.
- `GET /audit?run_id=` — governance audit log + `intact` chain-verification flag.
- `GET /catalog/{slug}` now returns `techniques` (was `plays`); `/catalog/coverage` now technique-based.

**New write/flow routes:**
- `POST /scan` now returns `status: pending_approval` (does NOT run).
- `POST /runs/{id}/approve` — required to actually start a run.
- `POST /ingest` — autonomous catalog ingestion.

**Unchanged read contract the UI relies on:** `GET /runs`, `GET /runs/{id}` (full `{run, attempts:[{attempt, turns}]}`), `GET /runs/{id}/transcript`. No streaming endpoint.

---

## Uncertainty / flags
- The "RISK = exactly 1 of 3 committed" heuristic is **only meaningful for the 13 panel-graded modes**. For the 3 single/paired-oracle modes it cannot produce a RISK tier — confirm with backend whether a RISK signal is desired there, or render those as binary.
- `outcome="sample"` rows (fairness raw transcripts) are evidence, not findings — **must be filtered** from any findings list/count, or counts will be inflated (3 rows per fairness pair: A-sample, B-sample, summary).
- `verdict_score` semantics differ slightly per oracle: panel/special = mean StrongREJECT specificity; fairness summary = `pv.gap` (treatment-gap magnitude). Same column, different meaning — label accordingly if shown numerically.
- D8 two-observation (Security + Compliance) split is confirmed **NOT present** anywhere in the backend — still your contract request, unbuilt.
