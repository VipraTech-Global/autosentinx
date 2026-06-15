# RUNBOOK — run AutoSentinx end-to-end (backend + Sentinx console)

> **Audience:** a new developer cloning the monorepo who needs to bring up *both* halves (FastAPI backend + the
> Next.js `sentinx-web/` console) and confirm the live path works. **Anchored to `origin/main @ eabb173`** — the
> same revision the PL2 plan, `api-contract.md`, and `conformance-triage.md` are written against. All paths are
> repo-relative from the monorepo root.
>
> **What ships here:** the repo root is the **backend** (`app.py` + `autosentinx/`); `sentinx-web/` is the
> **frontend** console; `design documentation/` is the spec/plan set. The console talks to the backend only through
> a same-origin **BFF proxy** (`sentinx-web/app/api/[...path]/route.ts`), so the browser never holds the JWT.

---

## 0. Prerequisites

- **Python 3.11+** and [`uv`](https://docs.astral.sh/uv/) (or `pip`).
- **Node 20+** and `npm` (for `sentinx-web/`).
- A **Neon Postgres** database URL (or any async-Postgres URL).
- At least one **LLM provider key** — Gemini Developer API is the default and the cheapest to start with.

---

## 1. Backend — environment

```bash
cp .env.example .env      # then fill in the values below
```

| Var | What it is | Required? |
|---|---|---|
| `REGSENTINEL_DATABASE_URL` | Neon Postgres URL (`postgresql+asyncpg://…`) | **yes** |
| `AARAV_BASE_URL` | the target voice-agent under test (defaults to the AARAV sandbox) | yes (has a default) |
| `AARAV_DEFAULT_CONTACT_ID` | contact id the target call uses | yes (default `1`) |
| `AARAV_CARD_SHARED_SECRET`, `AARAV_CARD_KEY_ID` | signed agent-card auth to the target | only if the target requires it |
| `TARGET_BEARER_TOKEN` | optional bearer to the target | optional |
| `LLM_PROVIDER` | `gemini` \| `vertex` \| `anthropic-vertex` \| `anthropic` \| `openai-compat` | yes (default `gemini`) |
| `LLM_ATTACKER_MODEL`, `LLM_JUDGE_MODELS`, `LLM_CLASSIFIER_*` | per-role model selection (each resolves its own provider) | yes (have defaults) |
| `GEMINI_API_KEY` *or* `VERTEX_*` / `ANTHROPIC_*` | the key for the chosen provider | **yes** (for whichever provider) |
| `MAX_TURNS` | per-attack turn cap | yes (default `8`) |
| **`JWT_SECRET`** | secret for signing login tokens — **MUST be a strong random value in prod** (`python -c "import secrets; print(secrets.token_hex(32))"`) | **yes for real auth** (defaults to an insecure dev value) |
| **`JWT_EXPIRE_HOURS`** | token lifetime | yes (default `24`) |

> Verified against `.env.example` + `autosentinx/config.py:60-62` (`jwt_secret` / `jwt_expire_hours`) and
> `autosentinx/security.py` (bcrypt + HS256 JWT, `sub=email`). The `JWT_*` vars are what login/auth uses; leaving
> `JWT_SECRET` at its `dev-insecure-change-me` default is fine locally but must be set in any shared/deployed env.

---

## 2. Backend — install, migrate, seed

```bash
uv sync                                      # .venv + deps   (or: pip install -r requirements.txt)
uv run alembic upgrade head                  # apply migrations — the app ALSO does this on startup (lifespan)
uv run python scripts/load_catalog.py        # seed the Objective catalog into Postgres
uv run python scripts/load_techniques.py     # seed techniques + personas + the objective↔technique map
```

> **Seeding is not optional.** Until `load_catalog.py` + `load_techniques.py` have run against the DB, `/scan` has
> no objectives/techniques to plan against. Migrations auto-run on startup, but the seed scripts do not — run them
> once after the DB is reachable. (Script names verified in `scripts/`.)

---

## 3. Backend — run

```bash
uv run uvicorn app:app --host 127.0.0.1 --port 8080
```

Backend is now at `http://127.0.0.1:8080` (`/docs` for the live OpenAPI). All routes except `/`, `/health`,
`/auth/signup`, `/auth/login`, and the docs surfaces require `Authorization: Bearer <jwt>` (enforced by the global
middleware — see `api-contract.md` → Auth model).

---

## 4. Frontend (Sentinx console) — env + run

```bash
cd sentinx-web
cp .env.example .env.local        # sets BACKEND_BASE (see sentinx-web/.env.example)
npm install
npm run dev                       # Next.js dev server on http://localhost:3000
```

- The BFF proxy reads **`BACKEND_BASE`** (default `http://127.0.0.1:8080`) and forwards every browser `/api/<path>`
  call to `BACKEND/<path>` (`app/api/[...path]/route.ts:6`). If you ran the backend on a different host/port, set
  `BACKEND_BASE` in `.env.local` to match.
- The console pages `/new` and `/runs/*` are session-gated; you must sign in first (next step) so the `sx_jwt`
  cookie exists for the proxy to attach.

---

## 5. Auth bootstrap (how login actually works)

There is **real JWT auth** (this supersedes the old "cosmetic gate" framing in `spec/login.md`, which predates the
live wiring):

1. `POST /api/auth/login` (`app/api/auth/login/route.ts`) calls backend `POST /auth/login`; on `401` it **falls
   back to `POST /auth/signup`** (so the first sign-in for a new email creates the account).
2. The returned `access_token` is stored in an **httpOnly cookie `sx_jwt`** (24h) — the browser never sees it.
3. Every subsequent `/api/*` call goes through `app/api/[...path]/route.ts`, which reads `sx_jwt` and attaches
   `Authorization: Bearer <jwt>` server-side.
4. `POST /api/auth/logout` just deletes the cookie.

So: open `http://localhost:3000/login`, enter any email + a password ≥ 8 chars, sign in → you land on `/new`.

---

## 6. Smoke test — "is the live path healthy?"

Run these after both halves are up (browser or `curl` against the backend directly; the console uses the proxied
`/api/*` forms). Expected results:

| Step | Call | Expect |
|---|---|---|
| 1 | `GET http://127.0.0.1:8080/health` | `{"ok": true, "checks": {"llm": …, "aarav": …, "neon_db": …}}` |
| 2 | sign in via `/login` (signup-on-first-use) | response sets `sx_jwt` httpOnly cookie; redirect to `/new` |
| 3 | start a scan (`POST /api/scan?strategy=ucb&budget=6`) | `{"run_id": "…", "status": "pending_approval", …, "roe": …}` |
| 4 | approve it (`POST /api/runs/<run_id>/approve`) | `{"run_id": "…", "status": "running", "approved_by": "operator"}` |
| 5 | poll the run (`GET /api/console/runs/<run_id>`) | `200` with the camelCase view-model (`status`, `playsTotal`, `playsDone`, `observations[]`, …) |

**Known wrinkles to expect (documented, not bugs to chase):**
- The console view-model **collapses `pending_approval` → `"running"`** (`console.py:118`), so a created-but-not-yet-
  approved run already reads `status:"running"` at step 5. The FE approves immediately in the normal flow; a run that
  is never approved would poll forever (`api-contract.md` **F5** / pl2 gap #5 — the deferred poll-guard).
- The console always reports the agent as **"AARAV — NBFC voice debt-collection agent"** and the scan always targets
  the fixed `AARAV_BASE_URL` regardless of any endpoint/agent typed on `/new` (`api-contract.md` **F1/F2** — UI is
  honest-copy-pending; real targeting is **Milestone BE-1**).
- The UI default budget is **6** (`lib/api.ts`), not the backend's `/scan` default of **40** (`api-contract.md`
  **F3**).

A green run = steps 1–5 succeed and step 5 eventually shows `status:"succeeded"` with `playsDone === playsTotal`.

---

## 7. Standalone runner (no frontend)

For a long-running campaign without the API/console:

```bash
uv run python scripts/run_campaign.py --strategy ucb --budget 40            # budget-driven selection
uv run python scripts/run_campaign.py --strategy fairness --replicates 3    # fairness paired audit
uv run python scripts/run_campaign.py --strategy exhaustive --modes COERCION
```

## 8. Tests

```bash
uv run pytest -q
```

---

## Cross-references
- **API surface + auth model + FE↔BE gaps:** `api-contract.md`
- **What to change and in what order:** `pl2-plan.md` (phases 0–7) + `conformance-triage.md`
- **Deferred backend work for real targeting:** `pl2-plan.md §(b) → Milestone BE-1`
- **Login screen spec (note: cosmetic-gate framing is superseded by §5 here):** `spec/login.md`
