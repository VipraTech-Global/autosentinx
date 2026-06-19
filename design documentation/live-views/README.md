# Sentinx — Live Views (Duel / Arena) — Design Documentation

> The design documentation for the **Live View** surface — the real-time "attacker vs target" read of a running (or replayed) audit, delivered as a **roll-up / roll-down zoom continuum** of three tiers: **V1 Glance**, **V2 Arena**, **V3 Forensic**. This folder **extends** the canonical ladder in `../` (the `00-PROCESS → 01-research → 02-personas → 03-mapping → 04-uiux-plan → 05-critique` pipeline on top of `../DESIGN.md`). It does **not** replace it and does **not** fork the foundation.

This README is the **contract for how this documentation is written, read, and extended** — so it stays maintainable as new views, regions, personas, and features arrive.

---

## 1. What this surface is (one paragraph)

The Live View shows the audit **as it happens** — how the attacker forms its read (recon), presses a line, and shifts strategy; how the target holds or gives ground; and the decisive moments (the gate-delta, a breach, a held line). It is the same data as the documented `Processing → Findings → Observation Detail` funnel, presented as a **single zoomable surface** an operator/admin can **roll down** (abstract → detail) or **roll up** (detail → abstract):

| Tier | Name | Primary persona | Maps to canonical |
|---|---|---|---|
| **V1** | Glance (highly abstracted) | P4 NBFC engagement end-user *(impl. deferred; documented)* | Executive Summary register (M3) |
| **V2** | Arena (engagement + crucial detail) | P5 Product Admin · P3 Operator | Processing (M2) + Findings headline (M3) |
| **V3** | Forensic (full drill-down) | P2 Arjun (Security) | Observation Detail (M6/M7) |

The "duel / arena" is a **design philosophy and mental model only** — a way to make the dynamics legible and engaging. It is rendered **entirely within `../DESIGN.md`** (Palantir/Bloomberg calm-instrument, dual-theme, Geist, severity-only colour, line icons not emoji, composed copy, causal motion). See `00-foundation.md`.

---

## 2. The documentation rule (additive · ID-keyed · never-delete)

Every change to this folder follows ONE rule so it never becomes chaotic to read, refer to, edit, or extend, and nothing is accidentally lost:

1. **Additive & ID-keyed.** Every artifact has a **stable, immutable ID** in its series. New artifacts take the **next free ID**; IDs are never reused or renumbered.
   - Personas → `P4, P5, …` (continue the canonical `P1–P3` series).
   - Mapping rows → `M14, M15, …` (continue the canonical `M1–M13` series), tagged `[LV]`.
   - View tiers → `V1, V2, V3`; their regions → `V2-R1, V2-R2, …` (per-tier region IDs).
   - Live-view decisions → `D-LV1, D-LV2, …` (parallel to the canonical `D-Q*` ledger).
   - Backend/process deps specific to live views → `D-LV-dep1, …` (parallel to canonical `D1–D8`).
2. **Never delete — supersede with a dated note.** To change a decision or row, **add** a dated supersession note in prose; do **not** edit its meaning in place or remove it. Use a short, greppable lead-in: `Supersedes <ID> (YYYY-MM-DD): <what changed and why>` — the same *prose* discipline `../DECISIONS.md` uses ("Supersedes any earlier wording…", the D-Q21 CORRECTION blockquote). (We do **not** invent a glyph format the canonical docs don't use.)
3. **Cross-reference, don't duplicate.** Reference canonical IDs (`P1–P3`, `M1–M13`, `C1–C7`, `D-Q*`, `../DESIGN.md §x`) rather than restating them. **One fact has one home.** If a canonical fact must change, that change is proposed here and applied to the canonical doc **on approval**, not copied.
4. **Foundation supremacy.** `../DESIGN.md` wins. `00-foundation.md` may only **extend** it deliberately (dated, rule-numbered), per `../DESIGN.md §1` ("changed deliberately, not bypassed"). A live-view rule may be **stricter** than DESIGN.md, never **looser**.
5. **The traceability ladder is preserved.** Every new UI element must trace **element → mapping ID (`M*`) → persona goal (`P*`) → business rule**. If it has no `M*`, it is not in the plan (same rule as `../00-PROCESS.md`).
6. **One file per stage; extend the file, not the folder.** New work goes into the **existing** stage file's table/section, not a new ad-hoc file. New *files* are added only for a genuinely new stage artifact (e.g. a per-tier spec under `spec/`).

---

## 3. File map (mirrors the canonical convention)

| File | Stage | Status |
|---|---|---|
| `README.md` | — | this file: the rule + index |
| `DECISIONS.md` | — | interview log: locked `D-LV*` decisions + `§Open` unresolved items (mirrors `../DECISIONS.md`) |
| `00-foundation.md` | Foundation addendum to `../DESIGN.md` | governs the live-view design language |
| `01-research.md` | Stage 1 — research delta (derived synthesis, flagged) | inputs for the new audiences + surface |
| `02-personas.md` | Stage 2 — `P4`, `P5` + persona→tier ownership; `§2.4` supersession | who the views are for |
| `03-mapping.md` | Stage 3 — `M14+ [LV]` traceability rows incl. roll-up/down | why each view element exists |
| `04-uiux-plan.md` | **Stage 4 — UI/UX Plan (the approval artifact)** | **stop-for-approval here** |
| `05-critique.md` | Stage 5 — six-lens design-critic pass on the plan | weaknesses found + resolved |
| `spec/` *(post-approval)* | Stage 6 — per-tier specs + prompts | built only after the plan is approved |

**Gate (same as `../00-PROCESS.md §0.5`):** stages 1–5 are produced now; **specs + implementation happen only after the UI/UX Plan is approved.** View-1 implementation is additionally deferred by `D-LV3` (documented now, built later).

---

## 4. How to extend (recipes)

- **Add a new region to a view** → assign `V#-R#`; add its bones to `04-uiux-plan.md §C`; add a `M*[LV]` row tracing it; note persona ownership in `02-personas.md §ownership`.
- **Add a new view tier / new page** → assign the next `V#` (or a `C#` if it joins the funnel); add a screen-bones block (`04 §C`), a mapping row (`03`), persona ownership (`02`), and any decision (`D-LV#`).
- **Add a persona** → next `P#` in `02-personas.md`; add its `M*` rows; add ownership.
- **Change a decision** → append a dated `⊃ supersedes` note; never edit in place.
- **Touch the foundation** → only in `00-foundation.md`, dated + rule-numbered, and only to make a rule **stricter** or to fill a gap DESIGN.md leaves open.

---

## 5. Relationship to the canonical ladder

- **Obeys:** `../DESIGN.md` (foundation), `../00-PROCESS.md` (process + gate).
- **References (does not restate):** `../02-personas.md` `P1–P3`, `../03-mapping.md` `M1–M13`, `../04-uiux-plan.md` `C1–C7`, `../DECISIONS.md` `D-Q*`.
- **Proposes canonical edits (applied on approval):** add `P4/P5` to `../02-personas.md`; add `M14+` to `../03-mapping.md`; revise `../02-personas.md §2.4` (out-of-scope) and `../03-mapping.md §3.3` (cuts); register a "Live View" surface in `../04-uiux-plan.md §C`. These are listed in `04-uiux-plan.md §F` and are **not** applied to the canonical files until the plan is approved.
