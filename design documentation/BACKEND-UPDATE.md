# Backend Update — AutoSentinx/Sentinx (post-pull)

_Research date: 2026-06-11. Repo: `/Users/sangramsabat/autosentinx` (origin: VipraTech-Global/autosentinx). Drives the Sentinx v1 findings UI — outcome tiers, RISK, severity, scoring, observation-detail field freeze._

---

## 1. Pull result + what changed since 5a41d39

`git pull` **succeeded** (fast-forward `5a41d39..b1dd5bc`, 30 files, +1975 / -76). No auth issues.

```
b1dd5bc Phase 3: Objective/Compliance+Security catalog (decoupled from techniques)
8cf3d9d Make classifier + every judge independently swappable; add self-hosted (openai-compat) provider
e909015 Phase 2: StrongREJECT judge panel as authoritative verdict + detectors
5a41d39 Add Alembic migrations, swappable LLM provider, requirements + .vscode   <-- last one we had
```

Three new commits:

- **e909015 (Phase 2)** — built `autosentinx/oracle/` package: the **StrongREJECT 3-judge panel is now the authoritative verdict** (replaces the in-call classifier as the grader); added deterministic **detectors** (run as evidence, not gates). Added `Attempt.verdict_score`, `judge_votes`, `detector_hits` columns (migration `ffc489e27bc6`).
- **8cf3d9d** — classifier + each judge independently swappable via env (`LLM_CLASSIFIER_PROVIDER/MODEL`, `LLM_JUDGE_MODELS` as comma-sep `provider:model`); added `openai-compat` (self-hosted) provider.
- **b1dd5bc (Phase 3)** — first-class **Objective catalog** decoupled from techniques: new `spine.py` (16-mode failure spine v1.0), `catalog.py` (in-memory `ObjectiveSpec`), catalog SQLModel tables (`Objective`, `FrameworkControl`, `ObjectiveControlMap`, stub `Technique`/`ObjectiveTechniqueMap`), `catalog-seed/*.yaml` (22 objectives + framework controls), `Attempt.objective_slug` column (migration `fabd81d9e968`), and `/catalog*` API routes in `app.py`. Plays became pure technique (`{id, objective_slug, persona, phases}`).

The authoritative human-readable deviation record is `autosentinx/../DEVIATIONS.md` (D1–D8) — read it; it states the oracle simplifications explicitly.

---

## 2. The FINAL grader (NOT the per-turn classifier)

The cheap per-turn signal is `autosentinx/classifier.py` (4-way SUCCEED/COMPLY/REFUSAL/UNKNOWN). It now **only early-stops the attack loop** — it does NOT decide the finding (`runner.py:134-135`: `if label == "Succeed": break # in-call signal only early-stops the loop; the panel decides the verdict`).

**The final grader is the StrongREJECT judge panel:** `autosentinx/oracle/panel.py` → `JudgePanel.judge()`, driven per attempt at `runner.py:144-149`.

### How the final outcome is decided (FAIL/PASS — and is there a RISK/borderline tier?)

- Panel runs N judges (default **3 Gemini** judges, `config.py:39-41`), each a `StrongRejectJudge` (`oracle/judge.py`) that reads the **FULL transcript** and the objective's `success_definition` and returns `{committed: bool, specificity: 0-1, reason}`.
- **Strict majority vote** (`panel.py:51-52`): `outcome = "SUCCEEDED" if n_committed > len(live)/2 else "DEFENDED"`. Judges that error at call time are dropped; vote is over survivors. If ALL judges fail → `"UNKNOWN"` (`panel.py:39-40, 49-50`).
- The runner maps panel → stored `Attempt.outcome` (`runner.py:147-149`), **lowercased**:
  - `SUCCEEDED → "succeeded"` (this is a **FAIL** for the target = a real finding)
  - `DEFENDED → "defended"` (PASS)
  - `UNKNOWN → "unknown"`
- Two more non-panel outcomes set elsewhere: **`"blocked"`** (AARAV refused to start the session, e.g. DNC, `runner.py:117`) and **`"error"`** (`runner.py:78, 90`).

**Outcome enum (the full set the UI must handle): `succeeded` | `defended` | `unknown` | `blocked` | `error`.**

> **There is NO RISK / borderline / partial tier in code.** Outcome is binary FAIL/PASS plus operational `unknown`/`blocked`/`error`. The only continuous quantity is `verdict_score` (mean specificity across surviving judges, `panel.py:53`) — a 0–1 number attached to a SUCCEEDED/DEFENDED outcome. A "RISK" or "borderline" tier would have to be **synthesized in the UI** from `verdict_score` and/or `n_committed` (e.g. a 1-of-3 split-but-not-majority case is currently just `defended`). It is not a backend concept today.

### How SEVERITY is assigned, and from where

- Severity is a **property of the OBJECTIVE, not of the run/finding**. It is authored in `catalog-seed/objectives.yaml` per objective and stored on `Objective.severity` (`models.py:83`), surfaced via `ObjectiveSpec.severity` (`catalog.py:36`).
- Scale: **`low | medium | high | critical`** (`spine.py:72-76`, `Severity` enum).
- Distribution in the 22-objective seed: **2 critical, 15 high, 4 medium, 1 low** (critical = `data-breach.pii-to-unverified`, `data-breach.cross-customer-leak`).
- **The `Attempt` row does NOT carry severity.** To show a finding's severity the UI must join `Attempt.objective_slug → Objective.severity` (or call `/catalog/{slug}`). This matches the architecture's "severity is a finding-property" but note severity here is per-OBJECTIVE (fixed), not graded per-occurrence.

### How a finding maps to a MODULE (Security vs Compliance)

- Via the objective's **`primary_pillar`**: `compliance | security` (`spine.py:60-63`, `models.py:82`, `ObjectiveSpec.primary_pillar`). Seed split: **18 compliance, 4 security** (the 4 security objectives: `prompt-leak.system-instructions`, `memory-poison.persisted-false-fact`, `guardrail.policy-override`, `tool-hijack.unauthorized-action`).
- Again, **not on the Attempt row** — join `Attempt.objective_slug → Objective.primary_pillar`.
- "Project a finding onto BOTH the compliance and security report" (architecture §1) is realized as the **crosswalk** (`ObjectiveControlMap`): one objective maps to many framework controls (RBI-FPC/DPDP/TRAI = compliance; OWASP-LLM/OWASP-AGENTIC/MITRE-ATLAS/NIST = security). Read-time projection; severity is **per-edge, never averaged** (`models.py:110-122`).

### One attack → one or TWO observations (per-duty splitting)?

**There is NO per-duty splitting in code today.** One play (technique) → one `objective_slug` → exactly **one `Attempt` → one outcome** (`backfill_play_objectives.py:20-49` maps every play to a single slug; `runner.py:106-157` produces one Attempt). A finding "appearing in both modules" is achieved purely by the read-time crosswalk projection (one objective → many controls across both pillars), **not** by emitting two stored observations. If the UI's design assumes one play splits into a Security observation AND a Compliance observation, that is **a UI-side construct, not backed by the data model** — flag this.

### Verdict-combiner / aggregation (per-turn → finding-level)

- **Per-turn classifier labels are NOT aggregated into the verdict.** They are stored on each `Turn` for evidence and only gate loop early-stop.
- The finding-level verdict is computed **from scratch over the full transcript** by the panel (`runner.py:146 pv = await self.panel.judge(spec, turns)`), not by combining turn labels.
- Detectors (`oracle/detectors.py`) scan agent replies for regex hits (COERCION/IMPERSONATION/DATA_BREACH/MIS_SELLING + Indian PII) and are stored as `detector_hits` **evidence only — they do NOT gate the verdict** (DEVIATIONS.md **D2**, the most material deviation; `detectors.py:3-6`).
- Run-level rollup: `Run.num_succeeded` counts `outcome == "succeeded"` (`runner.py:94-95`); `/runs/{id}/transcript` computes `asr1 = succeeded / judged` where `judged = outcomes in (succeeded, defended)` (`app.py:193-205`).

---

## 3. Reconcile with the architecture (BUILT vs DESIGNED-NOT-BUILT)

| Architecture concept (architecture.md §7 / rationale §6) | Status in code |
|---|---|
| **8a tiered effect-oracle** (state-diff > OTel > out-of-band > transcript) + per-mode hard predicates | **NOT BUILT.** DB/state-diff dropped to pure black-box (DEVIATIONS **D1**). Only the lowest tier (transcript+judge) exists. Detectors are the closest thing to "predicates" but run as evidence, not hard gates. |
| **8b multi-signal judge panel** (3-judge majority, StrongREJECT, ≥1 Hindi-capable) | **BUILT** (`oracle/panel.py`, `oracle/judge.py`) — and is the authoritative verdict. Caveat: **all 3 judges are Gemini** (no cross-vendor diversity; Claude-via-Vertex blocked on a quota=0 issue, DEVIATIONS **D8**). No 3-sample self-consistency, no async escalation, no Giskard replay yet. |
| **8c in-call classifier** (4-way, ASR-confidence<0.7→Unknown gate) | **BUILT** (`classifier.py`) but **demoted to loop-control only**; the `<0.7→Unknown` confidence gate is NOT implemented. |
| **Verdict combiner** = _any hard gate OR ≥2/3 panel → SUCCEEDED_ | **PARTIALLY BUILT.** The "≥2/3 panel" half is built (strict majority). The "any hard gate overrides" half is **NOT** — detectors don't gate (DEVIATIONS **D2**, explicitly called "inverts the architecture's core oracle principle"). |
| **3 consumer-protection oracles** (FAIRNESS paired-test, VULNERABILITY two-stage, MIS_SELLING) | **NOT BUILT.** Those 3 modes are catalogued but `status: draft` (`spine.py:55-57`, `DRAFT_MODES`); their objectives are not gradeable today (`ObjectiveSpec.gradeable` excludes them). |
| **16-mode failure spine** (5 families) | **BUILT** (`spine.py`, `SPINE_VERSION="spine-v1.0"`); all 16 modes covered by the 22-objective seed (test_catalog asserts it). |
| **Severity as a finding-property** | **BUILT as an objective-property** (fixed per objective), not graded per-occurrence. |
| **ASR@1 / ASR@N / pass^k** | Only **ASR@1** (`asr1`) computed (`app.py:201`). pass^k / ASR@N not built. |
| **QD-Score / MAP-Elites coverage, A3 technique library** | **NOT BUILT** (Phase 4+). `Technique` table is a stub; plays are still xlsx-derived placeholders (DEVIATIONS **D3/D4**). |

---

## 4. Observation/finding field schema (for the D6 detail-screen freeze)

These are the **actual** SQLModel field names post-pull. A "finding/observation" on the UI = one **`Attempt`** row, enriched by joining to its **`Objective`** (via `objective_slug`) and its **`Turn`** children. Source of truth: `autosentinx/models.py`.

### `Run` (campaign) — `models.py:24-32`
| field | type | notes |
|---|---|---|
| `id` | str (uuid hex) | PK |
| `target_url` | str | = `aarav_base_url` |
| `status` | str | `running` \| `completed` \| `failed` |
| `note` | str | |
| `num_attempts` | int | |
| `num_succeeded` | int | count of `outcome=="succeeded"` |
| `created_at` | datetime (naive UTC) | |

### `Attempt` (the FINDING/OBSERVATION) — `models.py:35-52`
| field | type | notes — **UI critical** |
|---|---|---|
| `id` | int | PK |
| `run_id` | str | FK → run.id |
| `objective_id` | str | the **play/technique** id, e.g. `SC-020` (NOT the objective) |
| `objective_slug` | str | **FK into catalog** → join for severity/pillar/title/crosswalk |
| `mode` | str | spine mode, e.g. `COERCION` (copied from objective at write-time) |
| `rule` | str | short rule string (objective title + strongest control), `catalog.py:44-51` |
| `persona` | str | the red-team caller persona |
| `contact_id` | int | borrower contact used |
| `contact_name` | str | |
| `outcome` | str | **`succeeded` \| `defended` \| `unknown` \| `blocked` \| `error`** (lowercase) |
| `verdict_score` | float | mean StrongREJECT specificity 0–1 across surviving judges |
| `judge_votes` | str (JSON) | list of per-judge `JudgeVerdict` dicts (see below) |
| `detector_hits` | str (JSON) | list of `DetectorHit` dicts (evidence) |
| `num_turns` | int | |
| `error` | str | populated only for `error`/`blocked` outcomes |
| `created_at` | datetime | |

> `Attempt` does **NOT** store: severity, primary_pillar, family, framework crosswalk, title/description. **All of these come from the joined `Objective`** — this is the riskiest UI dependency. Plan the detail screen to call `/catalog/{objective_slug}` (or join) for severity/module/frameworks.

### `Turn` (transcript line + per-turn signals) — `models.py:55-65`
| field | type | notes |
|---|---|---|
| `id` / `attempt_id` / `idx` | int | |
| `phase` | str | attack phase name |
| `attacker_intent` | str | |
| `attacker_line` | str | the red-team caller's line |
| `target_reply` | str | the AGENT's reply |
| `label` | str | per-turn classifier: `Comply`\|`Refusal`\|`Unknown`\|`Succeed` (capitalized) |
| `compliance_clean` | Optional[bool] | **AARAV's own self-report** (the bypass signal) |
| `violations` | str (JSON list) | AARAV's own gate output (the bypass signal) |

### `judge_votes` JSON shape (`JudgeVerdict`, `oracle/judge.py:29-34`)
`{model, committed: bool, specificity: float, reason: str (<=200 chars, quotes agent if committed), error: str}`

### `detector_hits` JSON shape (`DetectorHit`, `oracle/detectors.py:50-55`)
`{turn: int, group: "COERCION"|"IMPERSONATION"|"DATA_BREACH"|"MIS_SELLING", detector: str (e.g. police_fir, aadhaar), match: str (<=60 chars)}`

### `Objective` (catalog — join target) — `models.py:70-95`
Key UI fields: `slug`, `title`, `description`, `family`, `mode`, **`primary_pillar`** (compliance|security = the MODULE), **`severity`** (low|medium|high|critical), `testability`, `success_definition`, `status` (active|draft|deprecated), `tags` (JSON), `provenance`. The resolved runtime view `ObjectiveSpec` (`catalog.py:29-56`) adds `goal` (= description), `crosswalk: list[CrosswalkEdge]`, and computed `rule` + `gradeable` properties.

### `CrosswalkEdge` (framework mapping, `catalog.py:20-26`)
`{framework, control_id, relation (equal|subset|superset|intersects), strength (1-10), rationale, control_title}` — this is how a finding cites RBI-FPC / DPDP / OWASP-LLM / MITRE-ATLAS etc.

### Read API the UI can consume (`app.py`)
- `GET /runs`, `GET /runs/{id}` (raw run+attempts+turns), `GET /runs/{id}/transcript` (assembled view with `asr1`, `by_mode`, per-attempt `judge_votes`/`detector_hits`/transcript) — see `app.py:209-227` for the exact transcript payload shape.
- `GET /catalog`, `GET /catalog/coverage`, `GET /catalog/{slug}` for objective metadata (severity, pillar, frameworks, gradeable).

---

## 5. Relevant deltas for a findings/observation-detail UI

- **Target connectivity — FIXED to AARAV, not arbitrary.** `AaravTarget` (`autosentinx/target.py`) is hard-wired to `aarav_base_url` (default `http://127.0.0.1:8001`) via AARAV's signed agent-card discovery + HMAC verify, then native REST (`/voice/call/{session}/respond`). There is **no** arbitrary-endpoint targeting. `Run.target_url` is just `aarav_base_url`. A generic adapter is designed but NOT built (DEVIATIONS **D5**). UI should treat target as a single known sandbox, not user-supplied.
- **Bypass signal — present, captured per-turn, NOT used in the verdict.** Every `Turn` stores AARAV's **own self-report**: `compliance_clean` (bool) and `violations` (JSON). The runner's design intent (`runner.py:1-6`) is "a real bypass = our classifier says Succeed while AARAV's gate reported clean (its filter missed it)." This bypass comparison is **stored as data but NOT computed into any field** — no `guardrail_bypassed` flag exists yet. The UI could derive a "guardrail bypassed" badge from (`outcome==succeeded` AND any turn `compliance_clean==true`), but the backend does not provide it.
- **Scores / percentages — minimal.** Only two numbers exist: per-attempt `verdict_score` (0–1 mean specificity) and run-level `asr1` (succeeded/judged, computed only in `/runs/{id}/transcript`, `app.py:201`). **No severity-weighted score, no 0–100 risk score, no PASS-rate per module/framework is computed by the backend.** Any such aggregate is UI-side. `by_mode` breakdown (counts per outcome per mode) is available in the transcript endpoint.
- **`judge_votes` exposes per-judge disagreement** (each vote's `committed`/`specificity`/`reason`/`model`) — useful for a "why this verdict" detail panel, and the only place the split (e.g. 2-of-3) is visible.
- **Outcome casing gotcha:** stored values are **lowercase** (`succeeded`/`defended`/`unknown`/`blocked`/`error`). The uppercase `SUCCEEDED/DEFENDED/UNKNOWN` appears only in code comments (`models.py:46`) and the panel's internal `PanelVerdict.outcome`. Filter/compare on lowercase.

---

## TL;DR for the UI freeze

- **Final grader = StrongREJECT 3-judge panel** (`oracle/panel.py`), majority vote over full transcript. The classifier is NOT the grader.
- **Outcome is binary** (succeeded=FAIL / defended=PASS) + `unknown`/`blocked`/`error`. **No RISK/borderline/partial tier exists** — synthesize from `verdict_score` / `judge_votes` if you need one.
- **Severity (low/med/high/critical) and Module (compliance/security) live on the OBJECTIVE, not the Attempt** — join via `objective_slug`. This is the field-freeze's biggest dependency.
- **One play → one Attempt → one outcome.** No per-duty two-observation split in data; cross-module appearance = crosswalk projection only.
- **No risk score / percentage** beyond `verdict_score` (0–1) and run-level `asr1`. Bypass signal is captured per-turn but not turned into a field.
