# Sentinx — Live Views Foundation (addendum to `../DESIGN.md`)

> **Dated addendum — 2026-06-19.** This document extends, and is subordinate to, `../DESIGN.md`. Where this file and `../DESIGN.md` conflict, `../DESIGN.md` wins. A live-view rule may be **stricter** than DESIGN.md, **never looser** (README §2.4). Its job: define how the **"duel / arena"** idea is expressed **inside** the existing foundation — so the Live View is *engaging and dynamics-legible* without becoming the gamified/hacker-toy aesthetic DESIGN.md §1/§6 forbids.

**Governing decision — `D-LV1`:** *The duel/arena is a design **philosophy and mental model**, not a visual style.* It shapes **what we make legible** (a contest of evidence: attacker presses, target holds or breaks, judges rule) — **not** how it is skinned. The skin is `../DESIGN.md`, unchanged: Palantir/Bloomberg "calm instrument", dual-theme, Geist, severity-only colour, line icons, composed copy, causal motion.

---

## LV-1. The reconciliation, rule by rule

Each row is a concrete translation of the gamified prototype into a DESIGN.md-compliant rule. The left column is what the prototype did; the right is the binding rule for the spec.

| Prototype (to retire) | Binding rule (DESIGN.md ref) |
|---|---|
| Emoji as UI affordances (⚔ 🛡 ★ ✗) | **`D-LV4`: no emoji.** Use **line icons** (Lucide/Phosphor, ~1.5px stroke — §3.3). Mapping in LV-3. |
| Dark-only "war-room" | **Dual-theme, light default** (§2). The Arena ships a first-class **light** instrument skin *and* the dark console; structure identical, only the skin changes. |
| `-apple-system / Roboto / SF Mono` | **Geist + Geist Mono + Noto Sans Devanagari** (§3.2). Evidence (turns, IDs, scores, timestamps, clause refs) is **mono**, by construction. No system/Inter/Roboto. |
| Ad-hoc tokens (`--brand #5E9BFF`, `--crit #F2555A`) | **Canonical tokens only** (§3.1): Azure-Cobalt brand; `--fail/--warn/--pass`; severity ramp; both light + dark values. No new palette. |
| Arcade "juice" (looping siege strain, seismic shockwave, pip pops) | **Motion confirms causality, never entertains** (§3.4). Exactly **one** orchestrated moment (LV-4); everything else ≤200ms, ease-out, functional; honour `prefers-reduced-motion`. |
| Gamey copy ("kill node", "the defense broke", "siege") | **Composed, verdict-first, unhyped** (§4). Re-voiced in LV-5. |
| Ad-hoc widgets | **Compose the named component system** (§7) + the new named live components in LV-6. |
| Full transcript / strategy shown to a *customer* | **Disclosure is AUDIENCE-scoped (`D-LV6`), not depth-scoped.** **Internal tiers are UNRESTRICTED:** V2 Arena (owner P5 / operator P3 — AutoSentinx team) may show full strategy, intents, phase-names, and chain. The IP rule (`../DECISIONS.md D-Q12`) binds only **customer-facing** tiers: **V1** (NBFC exec) = landing + abstraction; the **customer's Observation Detail (C6)** = landing exchange + anonymized judge panel + detectors + crosswalk, **no full chain**. *(Corrects the draft's reliance on stale `../DESIGN.md §1` text and its wrong assumption that V2 is customer-facing.)* |

**What is kept (the value the prototype earned — re-expressed on-foundation):** the gate-delta promoted to the climax (= `BypassSignal`, §7); honest `nJudges` (3 / 1-oracle / degraded); advisory signals demoted ("classifier — not the ruling"); honest degraded/blocked states; the per-play **integrity** read; calm-is-suspense for held plays.

---

## LV-2. The zoom continuum (roll-up / roll-down) — `D-LV2`

The three views are **one surface at three densities**, not three screens. The operator/admin can **roll down** (abstract → forensic) and **roll up** (forensic → abstract); state (focused play, scroll, filters) is **preserved across zoom**.

```
   roll up  ◀──────────────────────────────────────────────  abstraction
   ┌───────────────┐     ┌────────────────────┐     ┌────────────────────────┐
   │  V1 · GLANCE  │ ◀─▶ │     V2 · ARENA     │ ◀─▶ │     V3 · FORENSIC      │
   │  posture in   │     │  the live duel +   │     │  full evidence,        │
   │  one read     │     │  crucial detail    │     │  secured detail (= C6) │
   └───────────────┘     └────────────────────┘     └────────────────────────┘
   roll down ─────────────────────────────────────────────▶  detail
   P4 (deferred build)    P5 / P3                            P2 (Arjun)
```

**Foundation rules for the continuum:**
- **One data contract, three projections.** Every tier reads the same `state.json` fields; a tier may *hide* detail but must never *invent* it (honesty, §4). Rolling between tiers changes density, never facts.
- **Honest at every tier.** A tier that cannot show a signal honestly (e.g. V1 cannot show a degraded `nJudges`) **omits** it, never fakes it.
- **`D-LV6` — disclosure is AUDIENCE-scoped, not depth-scoped.** **Internal** tiers (V2 Arena, P5/operator) are **unrestricted** — full strategy, intents, phase-names, and (on drill) the full chain. **Customer-facing** tiers apply `../DECISIONS.md D-Q12`: **V1** (NBFC exec) = landing + abstraction; the **customer's Observation Detail (C6)** = landing + judge-panel/detectors/crosswalk, **no full chain**. The customer never sees V2.
- **V2 shows the full duel — strategy, intents, the breach exchange — because it is internal.** The *abstracted* duel (shape/beats only, no method) is the **customer-facing V1** treatment, not a V2 limit. Roll-down within the internal continuum deepens evidence toward an internal full-detail forensic view; what a *customer* may see is governed separately by `D-Q12`.
- **State-preserving.** Roll-up/down keeps the focused play and position, so an admin can drop into evidence and pop back to posture without losing place (the `ZoomControl`, LV-6).
- **Reduced-motion / keyboard / link parity.** The zoom is a real control (a segmented `ZoomControl` + deep links `?view=v1|v2|v3`), keyboard-operable, focus-preserving (already proven in the prototype); the transition is a ≤200ms cross-fade, instant under reduced-motion.

---

## LV-3. Icon mapping (emoji → line icons) — `D-LV4`

Line icons only (Lucide names; Phosphor equivalents acceptable). All ~1.5px stroke, never filled/duotone (§3.3). Colour earned by severity only (§3.1) — an icon is ink-coloured unless it encodes an outcome/severity.

| Concept | Was | Line icon | Colour |
|---|---|---|---|
| Attacker / offensive side | ⚔ | `crosshair` (or `target`) | ink / brand on action |
| Strategy advance (after 2-turn timer) | blue ripple | `chevrons-right` along the arc | **ink** (shape carries it — `--brand` is reserved for actions) |
| Concession (target gave ground) | amber ripple | `corner-down-right` from the target lane | **ink** (shape carries it — `--warn` is reserved for a RISK badge) |
| Target / defence | 🛡 | `shield` (line) | ink; `--pass` **only** on the settled HELD outcome |
| Held the line (outcome) | green shield | `shield-check` | `--pass-text` |
| Breach point — *advisory* pivot | "kill node" ✗ | `shield-off` at the phase node, **captioned advisory** | ink (the **panel** verdict owns `--fail`, not the pivot) |
| Critical-held laurel | ★ | `award` | `--metric` (non-severity) |
| Gate-delta / bypass climax | seismic ring | `git-compare` (depicts our-verdict-vs-self-report; **not** `alert-triangle` — §6 alarmist ban) | `--fail` (verdict only) |
| Judging (panel grading) | breathing pulse | `scale` / `gavel` | ink |

### LV-3b. Redundant non-colour encoding for the new live states (extends `../DESIGN.md §5`)
Per §5, every state is **colour AND a redundant non-colour channel** — never colour/hue-distance alone:

| Live state | Colour | Redundant channel (shape / fill) |
|---|---|---|
| Arc node — reached | brand fill | **filled** disc + check |
| Arc node — current | brand ring | **ringed** (hollow centre) disc |
| Arc node — future | ink-faint | **hollow** disc + index numeral |
| Arc node — breach-point (advisory) | ink + `shield-off` | **struck** disc (slash), captioned advisory |
| Integrity — held | ink (or `--pass` tint) | **solid** segment |
| Integrity — wavered | `--sev-low` slate | **half** segment |
| Integrity — yielded (advisory) | ink | **hollow / hatched** segment |

The IntegrityStrip reads **without colour** (solid/half/hollow) with the always-on legend; any tint is decorative-only and must never be `--warn`/`--fail`/`--pass` (LV-6).

---

## LV-4. The one orchestrated moment — `D-LV5`

`../DESIGN.md §3.4` allows exactly **one** orchestrated "delight" beat **per path**. The funnel's is the **Processing→Findings reveal**; the Live View's is the **`VerdictReveal`**. They are **mutually exclusive in a single path** — watching the run *in the Arena* **is** that path's reveal, so the demo goes **Processing → Arena (`VerdictReveal`)**, never Processing → Findings-reveal → Arena (which would fire two). The Live View's moment is the verdict reveal on a real gate-delta — a **composed settle**, not a shockwave:

- On the focal play's transition to `done ∧ productOutcome=FAIL ∧ bypass=true`, the verdict block **settles in with weight** (a brief, single ease-out entrance of the `OutcomeBadge` + the `BypassSignal` line + a thin connector to the breach-point node) — **≤ 320ms, once, no loop, no radial shockwave, no desaturating the rest.**
- A plain FAIL settles without the bypass connector; a HELD settles to a composed "held the line" state. Severity adds *weight* (a slightly longer settle), never a bounce (§3.4).
- Everywhere else, motion is functional ≤200ms: arc nodes fill as turns arrive; an advance draws a single directional tick; the judging state is a **static** "panel grading" (no looping breathe — that read as "toy"). All instant under `prefers-reduced-motion`; **no information lives only in motion** (the breach-point icon, the trigger tag, the integrity strip all encode the event statically).

---

## LV-5. Voice (re-voicing the prototype) — composed, §4

| Prototype | On-foundation copy |
|---|---|
| "kill node" / "✗ breached here" | "breach point — where the violation landed" |
| "the defense broke" | "the agent's guardrail gave way" |
| "siege in progress" | "live attack in progress" |
| "the agent gave the line" *(integrity red)* | "the agent yielded this turn (advisory)" |
| "The agent believed it held. The judges disagree." | **kept** — it is composed, verdict-first, and the single most decision-relevant line (= `BypassSignal` headline). |

Register: regulator-register for compliance copy (cite the clause), engineer-register for security detail (name the technique class) — each in its own zone (§4). No fake precision; honest empty states.

**Outcome labels:** `HELD` / `BREACHED` are **composed display-aliases** of the canonical `PASS` / `FAIL` (same `../DESIGN.md §5` shape channel: PASS = check ✓, FAIL = solid disc ●); `running` / `judging` are **run-states**, not outcomes. **Breach-point** copy is always **captioned advisory** ("pivot — in-call classifier; the panel ruled on the whole exchange") and never asserted as the ruling; when the panel rules FAIL with no classifier pivot (`pivotTurn=None`), show no breach-point node and the line "panel ruled on the full exchange".

---

## LV-6. New named components (additions to `../DESIGN.md §7`)

The Live View **composes** the existing components (`SeverityChip`, `OutcomeBadge`, `ModuleTag`, `EvidenceBlock`, `TranscriptTurn`, `BypassSignal`, `RegulationCite`, `RunProvenance`, `EmptyState`) and adds these — each inherits the §7 invariants (disclosure rule, accessibility, timestamp/provenance where evidentiary):

- **`ZoomControl`** — the roll-up/down segmented control (V1·V2·V3); keyboard-operable, focus-preserving, deep-linkable. It is a **projection-mode** control, **orthogonal** to the Overview·Findings tab nav (`D-Q21`) — not "the single nav primitive" (corrected per `05-critique.md` BL3). ≥24×24px targets (§5); §2.4.11 scroll-padding so a focused node isn't hidden under the sticky bar.
- **`CombatantHeader`** — the attacker (technique · persona) vs target (AARAV) matchup header; line icons; composes `ModuleTag` + `SeverityChip` + `RegulationCite`. No emoji.
- **`AttackArc`** — the technique-relative phase spine: position/state (reached/current/future/**breach-point**) + advance/concede **beat** + advisory pip row (captioned). **At V2 (internal) it shows the phase-names + intent text** (the full strategy read P5 needs); **the customer-facing V1 shows shape/beats only** (no method — `D-Q12`/`D-LV6`). Static-first; motion only on a real advance.
- **`StrategyBeat`** — a single phase-transition marker in **ink**, meaning carried by **shape + label** (`chevrons-right` = advanced; `corner-down-right` = conceded) — **never** `--brand`/`--warn` (BL8). Honest: only a Comply-as-**last**-label is "conceded"; a 2-turn-timer advance is "advanced", never narrated as deliberate strategy.
- **`IntegrityStrip`** — per-play defence read across turns (held / wavered / yielded — **advisory** classifier labels, captioned "not the ruling"), encoded by **shape/fill** (solid/half/hollow) in **ink + `--ink-faint`**; **forbids** `--warn`/`--fail`/`--pass`; always-legend'd; the resting "stakeout map". The run **scoreboard** posture uses the **panel** outcome, never the advisory strip (BL-major).
- **`VerdictReveal`** — the LV-4 orchestrated settle wrapping `OutcomeBadge` + `BypassSignal` + (when a classifier pivot exists) an advisory connector to the breach-point node.
- **`HeldState`** — the composed "held the line — N/N, ran the full plan" affordance + `award` on a critical-held (the zero/PASS success state, never an empty void; aligns with C5's zero-findings spec).

---

## LV-7. Inherited honesty invariants (non-negotiable, §4 + prior live-view work)

- Real `verdict.nJudges` (3 / 1-oracle "specialist judge" / 2-degraded "N of 3 · M unavailable") — never a hardcoded denominator.
- Advisory signals (classifier pips, keyword detectors) **always** captioned "advisory — not the ruling".
- Degraded/blocked/errored states are first-class and **never** a faked verdict; a 404 is "could not reach — not assessed", not a fabricated TRAI/DNC refusal.
- `BypassSignal` degrades gracefully for non-self-reporting targets (§7 / D7).
- Synthetic-data + handling frame on any V3/exported surface (§8).

---

## LV-8. What this addendum deliberately does NOT change

It does **not** touch `../DESIGN.md §1–§8` values (brand, tokens, type, a11y, components, reference data). It only **adds** `D-LV1–D-LV5`, the icon map, the continuum rules, and the new component names. If a future view needs to bend a §1–§8 rule, that is a **separate dated change to `../DESIGN.md` itself**, proposed via this folder and applied on approval — not a silent override here (README §2.4).
