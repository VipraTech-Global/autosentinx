# AutoSentinx

Autonomous black-box red-teaming for Indian NBFC **Hindi/Hinglish voice AI agents** — testing both
**security** and **regulatory compliance** (RBI / DPDP / TRAI). This repository is the application code.

> **Proprietary & confidential.** © 2026 VipraTech Global. All rights reserved. See `LICENSE`.

---

## What it does

AutoSentinx drives **multi-turn Hinglish attacks** against a target voice agent, classifies each reply,
and reports where the agent holds vs. breaks — with full transcript evidence. It is organized around a
**three-layer model**: *Objective ("what to test") × Technique ("how to provoke") → Oracle ("how to
detect")*, with fixed interfaces (seams) so each layer can be swapped/upgraded independently.

The current build is the **API** (no frontend yet) and runs against a sandbox target (the AARAV mock NBFC
agent) on synthetic data.

## Stack

- **Python 3.11+**, **FastAPI** (API), **httpx** (target client)
- **Google Gemini** via `google-genai` (attacker + classifier; Vertex-capable) behind an `LLM` seam
- **SQLModel** on **Neon Postgres** (runs / attempts / turns)
- **uv** for packaging

## Layout

```
app.py                     # FastAPI API: /health /scan /runs /runs/{id}/transcript
autosentinx/
  config.py                # settings (env)
  db.py / models.py        # SQLModel engine + Run/Attempt/Turn tables
  llm.py                   # LLM seam + GeminiLLM
  target.py                # Target seam + AaravTarget (verifies signed agent-card, drives /voice/call/*)
  playlib.py               # Play/Phase models + YAML loader
  recon.py                 # light target profiler
  classifier.py            # in-call 4-way classifier
  attacker/promptlib.py    # GALA-lite multi-turn attacker
  runner.py                # campaign orchestration
  store.py                 # persistence (Neon)
scripts/build_prompt_lib.py# generate the prompt-lib (plays) from a scenario matrix
tests/                     # smoke tests
```

> Note: the **prompt-lib** (generated attack plays) and the source **scenario matrix** are *not* committed —
> regenerate the plays with `scripts/build_prompt_lib.py` against your scenario matrix.

## Setup

```bash
uv sync
cp .env.example .env          # fill in DB, target card secret/kid, and a Gemini key
```

Stand up a target (the AARAV sandbox agent), then generate the prompt-lib and run:

```bash
# 1) generate plays from the scenario matrix (provide the xlsx out-of-band)
uv run python scripts/build_prompt_lib.py

# 2) run the API
uv run uvicorn app:app --host 127.0.0.1 --port 8080
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | checks Gemini · target agent-card · Neon |
| POST | `/scan?modes=&ids=&limit=` | launch a campaign (recon + multi-turn attacks) — runs in the background |
| GET  | `/runs` | list campaigns |
| GET  | `/runs/{id}` | campaign + attempts + turns (raw) |
| GET  | `/runs/{id}/transcript` | readable transcripts per objective |

## Tests

```bash
uv run pytest -q
```
