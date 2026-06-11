# AutoSentinx

**Autonomous black-box red-teaming for Indian NBFC Hindi/Hinglish voice AI agents** — continuously testing a
debt-collection (or similar) voice agent for both **security** weaknesses and **regulatory-compliance**
failures (RBI Fair Practices / FREE-AI · DPDP · TRAI), with full transcript evidence and a defensible
coverage report. This repository is the application code (API; no frontend yet).

> **Proprietary & confidential.** © 2026 VipraTech Global. All rights reserved. See `LICENSE`.

---

## What it is

AutoSentinx points a fleet of **multi-turn Hinglish attackers** at a target voice agent it treats as a pure
black box (it only speaks to the agent — no access to its code, prompts, or database), then grades each
conversation with an independent panel of judges and tells you **where the agent holds vs. breaks**, mapped to
the exact regulatory clauses and security controls at stake.

It is organized around a **three-layer model with many-to-many links** — the structure every mature
red-teaming platform converges on:

```
        OBJECTIVE                 ×            TECHNIQUE            →            ORACLE
   "what could go wrong"               "how to provoke it"              "did it actually happen?"
   (the catalog: 16-mode spine,        (the library: composable          (3-judge StrongREJECT panel
    RBI/DPDP/TRAI + OWASP/MITRE         strategies × personas × CSRT)      + specialized oracles)
    crosswalk)
```

A **selector** decides which Objective × Technique to spend the next attack on (a coverage-preserving
bandit), a **coverage map** reports how much of the hazard space was tested, an **ingestion** subsystem grows
the catalog from new regulations and research, and a **governance** layer gates every scan behind human
approval with a tamper-evident audit trail.

---

## The hazard spine (what it tests for)

The catalog is keyed on a stable **16-mode failure spine** in 5 families (every objective maps to one mode;
each crosswalks to RBI/DPDP/TRAI **and** OWASP-LLM/MITRE-ATLAS/NIST controls):

| Family | Modes |
|---|---|
| **Conduct** | COERCION · TIMING_VIOLATION · CHANNEL_VIOLATION · DOOM_LOOP |
| **Data & Privacy** | DATA_BREACH · CONSENT_BYPASS · SYSTEM_PROMPT_LEAK · MEMORY_POISONING |
| **Process & Transparency** | PROCESS_SKIP · DISCLOSURE_FAIL · IMPERSONATION |
| **Truthfulness & Action** | HALLUCINATION · TOOL_HIJACK |
| **Fair Treatment & Consumer Protection** | FAIRNESS_VIOLATION · VULNERABILITY_FAIL · MIS_SELLING |

## The attack library (how it provokes)

A **composable engine** builds each attack at runtime from `Objective (goal) × Technique (strategy) ×
Persona (modifier) [× CSRT]`:

- **Techniques** (objective-agnostic strategies): `direct-probe`, `plague-escalation`, `actor-attack`
  (multi-turn innocuous decomposition), `crescendo` (gradual escalation), `authority-pressure`,
  `refusal-suppression` (prompt injection).
- **Personas**: reusable Hinglish callers (distressed / aggressive / confused-elder / savvy-evader /
  cooperative-prying) + matched pairs for fairness testing.
- **CSRT**: an optional Hinglish code-switch / phonetic-obfuscation modifier that layers on any technique.

## The oracle (how it judges)

- **StrongREJECT 3-judge panel** (multi-model, strict majority) grades the 13 transcript-visible modes —
  conservative by design ("did the agent *commit* the violation?", not "did it refuse?").
- **Specialized oracles** for the 3 consumer-protection modes: **fairness** (cross-run paired audit — same
  script, vary one attribute, compare treatment), **vulnerability** (distress-then-pressure), **mis-selling**
  (manipulation + no affordability check).
- Detectors run as **evidence** (Indian PII, coercion keywords) alongside the judges.

## Selection & coverage

- **Selection** — a per-objective **Discounted-UCB bandit** spends a query budget where it counts (learns
  which technique breaks which objective) while round-robin over objectives preserves coverage. Stats persist
  across campaigns. (UCB, not greedy: optimizing *coverage*, the regulator-facing goal, not raw hit-rate.)
- **Coverage** — a **MAP-Elites archive** (hazard-family × tactic × Hinglish-register × turn-depth) with a
  **QD-Score**, **% cells filled**, and an explicit **gap register** ("you have not tested X").

## Ingestion (the catalog grows itself)

Feed a **regulation clause, research abstract, web page, or file** (xlsx/pdf/txt) → the pipeline extracts
candidate objectives with anchored provenance → dedups against the catalog → integrates them as
`source=ingested`. So the catalog tracks new RBI guidance and the latest attack research, each objective
traced to its source.

## Governance

Every scan is created **`pending_approval`** and does not run until explicitly approved; its **Rules of
Engagement** (scope, budget, target) are recorded; and a **hash-chained, tamper-evident audit log** records
every event (created → approved → started → completed, plus ingestion) — altering any past entry breaks chain
verification.

---

## Stack

- **Python 3.11+**, **FastAPI** (API), **httpx** (target client)
- **Swappable LLM seam** — `LLM_PROVIDER` selects **Gemini** (Dev API), **Gemini on Vertex**, **Claude on
  Vertex** (Model Garden), **Claude direct**, or a **self-hosted open model** behind an OpenAI-compatible
  endpoint (vLLM/TGI/Ollama). The attacker, the in-call classifier, and *each* judge resolve their own
  (provider, model) independently — change any via env only.
- **SQLModel** on **Neon Postgres**, schema managed by **Alembic** (async; auto-`upgrade head` on startup)
- **uv** for packaging (`requirements.txt` also provided for pip)

## Layout

```
app.py                       # FastAPI API (see API table below)
autosentinx/
  config.py                  # settings (env)
  db.py / models.py          # SQLModel engine + all tables
  spine.py                   # the 16-mode failure spine (controlled vocab)
  catalog.py                 # Objective catalog: in-memory cache + ObjectiveSpec resolver
  library.py                 # Technique/Persona library + RunSpec + enumerate_runs
  selection.py               # Discounted-UCB technique selector (persisted stats)
  coverage.py                # MAP-Elites coverage archive + QD-Score + gap register
  ingestion.py               # source fetch → LLM extract → dedup → autonomous integrate
  audit.py                   # hash-chained, tamper-evident governance audit log
  llm.py                     # LLM seam + provider factory (Gemini / Claude / Vertex / openai-compat)
  target.py                  # Target seam + AaravTarget (signed agent-card; drives /voice/call/*)
  recon.py / belief.py       # light target profiler + GALA belief state
  classifier.py              # in-call 4-way classifier (provider-agnostic)
  attacker/composable.py     # composable engine: Objective × Technique × Persona [× CSRT]
  oracle/
    panel.py / judge.py      # StrongREJECT 3-judge panel
    special.py               # vulnerability + mis-selling single-judge oracles
    fairness.py              # cross-run paired fairness oracle
    detectors.py             # deterministic evidence detectors (Indian PII, coercion, …)
  runner.py                  # campaign orchestration (budget / exhaustive / fairness)
  store.py                   # persistence (Neon)
catalog-seed/                # authored objectives + framework controls (committed)
technique-seed/              # the Core-6 techniques (committed)
persona-seed/                # personas incl. fairness matched pairs (committed)
scripts/                     # load_catalog · load_techniques · run_campaign · …
tests/                       # offline unit tests
```

> The **prompt-lib** (legacy generated plays) and any source scenario matrix / corpus are *not* committed.
> The catalog/technique/persona **seeds** are committed (authored IP, no customer data).

## Setup

```bash
uv sync                          # .venv + deps   (or: pip install -r requirements.txt)
cp .env.example .env             # DB, target card secret/kid, LLM provider + key
uv run alembic upgrade head      # apply migrations (the app also does this on startup)
uv run python scripts/load_catalog.py        # load the objective catalog into Postgres
uv run python scripts/load_techniques.py     # load techniques + personas + the objective↔technique map
```

Switch any LLM via `.env` only — e.g. Claude on Google Cloud:
`LLM_PROVIDER=anthropic-vertex`, `LLM_ATTACKER_MODEL=claude-sonnet-4@20250514`, `VERTEX_PROJECT_ID`,
`ANTHROPIC_VERTEX_REGION=global`. The 3-judge panel is `LLM_JUDGE_MODELS` (comma-separated `provider:model`).

## Running a scan

```bash
# API
uv run uvicorn app:app --host 127.0.0.1 --port 8080

# or the standalone runner (robust, long-running)
uv run python scripts/run_campaign.py --strategy ucb --budget 40          # budget-driven selection
uv run python scripts/run_campaign.py --strategy fairness --replicates 3  # fairness paired audit
uv run python scripts/run_campaign.py --strategy exhaustive --modes COERCION
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | checks LLM · target agent-card · Neon |
| POST | `/scan?strategy=ucb\|random\|exhaustive\|fairness&budget=K` | request a scan → **pending_approval** (governance) |
| POST | `/runs/{id}/approve` | approve a pending scan → it runs within its RoE |
| GET  | `/runs` · `/runs/{id}` · `/runs/{id}/transcript` | campaigns, raw attempts, readable transcripts |
| GET  | `/catalog` · `/catalog/{slug}` · `/catalog/coverage` | objective catalog + objective×technique coverage |
| GET  | `/techniques` · `/techniques/{slug}` | technique library |
| GET  | `/coverage?run_id=` | MAP-Elites coverage archive + QD-Score + gap register |
| GET  | `/selection/stats` | the Discounted-UCB bandit value table |
| POST | `/ingest?source_type=&content=` | autonomously ingest a source into the catalog |
| GET  | `/audit?run_id=` | the hash-chained audit log + chain verification |

## Tests

```bash
uv run pytest -q
```
