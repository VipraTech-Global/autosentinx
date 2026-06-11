# Architecture Deviations Log

A living record of where the **POC build** deviates from the locked architecture
(`architecture-v1/architecture-FINAL.md` + the ADRs). **Append an entry whenever we deviate** —
note what the architecture says, what we did, why, and the path to re-converge.

Legend: **Accepted** = a deliberate product decision · **Simplification** = planned, will re-converge in a
later phase · **Benign** = nuance, no real divergence · **Not-yet** = on the roadmap, not built.

---

## Active deviations (as of Phase 1 complete / Phase 2 planned — 2026-06-11)

### D1 — No hard effect-oracle (DB dropped)  — *Accepted*
- **Architecture:** tiered effect oracle; deterministic backend state-diff is the gold-standard hard gate.
- **POC:** AARAV DB access dropped → pure black-box; evidence = transcript + detectors + judge only.
- **Why:** your decision; mirrors a real customer who won't expose their DB.
- **Re-converge:** add out-of-band signals (test SMS/OTP) or a gray-box tier per the 8a tiering when available.

### D2 — Verdict is judge-only (not hard-gates-override-soft)  — *Deliberate; most material*
- **Architecture (ADR 0010):** verdict = any hard gate OR ≥2/3 soft judges; hard gates override soft.
- **POC (Phase 2 plan):** 3-judge panel majority IS the verdict; detectors run as *evidence/signals*, not gates.
- **Why:** your call to keep the verdict simple for now.
- **Re-converge:** promote detectors to hard gates in the combiner (one change) when we want regulator-grade.
- *Keep this most visible — it inverts the architecture's core oracle principle.*

### D3 — Objective ↔ Technique fused 1:1 in the prompt-lib  — *Simplification*
- **Architecture (ADR 0014):** three *decoupled* registries (Objective × Technique → Oracle), many-to-many.
- **POC:** each xlsx scenario = its own objective **and** its play (1:1, fused in one YAML).
- **Why:** fastest path for Phase 1; pre-shaped toward the catalog.
- **Re-converge:** split objectives → the catalog (Phase 3) and techniques → the A3 library (Phase 4).

### D4 — Prompt-lib built FROM the xlsx  — *Approved tension*
- **Architecture (ADR 0011):** objectives authored from scratch; the xlsx is reference-only.
- **POC:** plays/objectives Gemini-generated from the xlsx scenarios.
- **Why:** you asked to build the prompt-lib from the xlsx for the POC.
- **Re-converge:** when the from-scratch catalog + ingestion subsystem land (Phase 3/7), treat the xlsx as one
  reference source among many, not the seed of record.

### D5 — A2A "dropped" but the connection is A2A-flavored  — *Benign*
- **Architecture (ADR 0013):** A2A dropped; use AARAV's native REST.
- **POC:** we fetch + HMAC-verify AARAV's **signed agent-card** (A2A-style discovery/trust), then call REST.
- **Why:** that's how AARAV actually authenticates external scanners.
- **Re-converge:** none needed — "A2A is not our internal model," but the card-based connect is fine.

### D6 — Governance not yet present  — *Not-yet*
- **Architecture (P2/A12):** per-campaign human approval + RoE + immutable audit.
- **POC:** scans run freely against our own AARAV sandbox; no approval gate.
- **Re-converge:** add the approval/RoE/audit layer before any real customer target.

### D7 — Shared Neon DB with a parallel RegSentinel schema  — *Not-yet / reconciliation debt*
- **Context:** the Neon DB already holds a fuller RegSentinel schema (probes/findings/scores/…). Our POC added
  `run`/`attempt`/`turn` alongside it (Alembic scoped to our tables only).
- **Re-converge:** reconcile the POC with that schema, or give the POC its own DB/schema.

### D8 — Verdict panel running 2× Gemini, not 2× Gemini + Claude  — *Not-yet / config*  (added Phase 2)
- **Architecture / plan:** multi-provider judge diversity (2× Gemini + 1× Claude-via-Vertex).
- **Reality:** the Claude-via-Vertex judge 404s (model `claude-sonnet-4@20250514` not enabled in project
  `regsentinel-vipra-demo` / region `us-east5`) → gracefully dropped → panel runs on **2 Gemini judges**
  (strict majority = both must agree).
- **Why:** Claude on Vertex Model Garden isn't enabled / the model-id+region don't match in this GCP project.
- **Re-converge:** enable the Claude model in Vertex Model Garden and set a valid `LLM_JUDGE_MODELS` entry
  (correct model id + `ANTHROPIC_VERTEX_REGION`); the panel picks it up automatically (env-driven).

---

## How to use
When you make a new deviation while building, add `### D<n> — <title> — <category>` with the same five lines
(Architecture / POC / Why / Re-converge). Mark a deviation **Resolved** (don't delete) once a later phase
re-converges it, with the date/phase.
