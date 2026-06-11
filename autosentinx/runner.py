"""Campaign runner (Phase 4) — recon → per-RunSpec composable attack → store.

A RunSpec = Objective × Technique × Persona [× CSRT]. The runner resolves each against the catalog +
technique library, runs the GALA-lite loop with the composable engine, then scores with the Phase-2
3-judge panel. AARAV self-reports its own gate per turn; a real bypass = our verdict SUCCEEDED while
AARAV's gate reported clean.
"""
import json
import logging

from .attacker import ComposableAttacker
from .belief import BeliefState
from .catalog import Catalog
from .classifier import Classifier
from .config import get_settings
from .library import Library, RunSpec
from .llm import make_llm
from .models import Attempt, Turn
from .oracle.detectors import run_detectors
from .oracle.panel import JudgePanel
from .recon import Recon, ReconProfile
from .store import SqlModelStore
from .target import AaravTarget

log = logging.getLogger("autosentinx.runner")


class Runner:
    def __init__(self) -> None:
        self.s = get_settings()
        self.llm = make_llm()  # attacker — provider+model from env (LLM_PROVIDER / LLM_ATTACKER_MODEL)
        self.store = SqlModelStore()
        self.attacker = ComposableAttacker(self.llm)
        # classifier resolves its own (provider, model) — independently swappable (gemini/anthropic/open)
        self.classifier = Classifier(
            make_llm(model=self.s.llm_classifier_model, provider=self.s.llm_classifier_provider or None)
        )
        self.panel = JudgePanel()  # Phase-2 authoritative verdict (each judge swappable via LLM_JUDGE_MODELS)
        self.catalog: Catalog | None = None
        self.library: Library | None = None

    def _contact_for(self, i: int) -> int:
        """Rotate borrowers to dodge per-contact daily-attempt limits."""
        return self.s.aarav_contact_start + (i % max(1, self.s.aarav_contact_count))

    async def _next_startable(self, target, max_tries: int = 12) -> tuple[int, dict]:
        """Rotate to the next contact AARAV will actually start a session for (skip DNC/blocked)."""
        last: dict = {}
        cid = self.s.aarav_contact_start
        for _ in range(max_tries):
            cid = self._contact_for(self._idx)
            self._idx += 1
            d = await target.start_session(cid)
            if d.get("session_id"):
                return cid, d
            last = d
        return cid, last

    async def run_campaign(self, run_id: str, runspecs: list[RunSpec]) -> None:
        target = AaravTarget()
        self._idx = 0
        succeeded = 0
        done = 0
        self.catalog = await Catalog.load()
        self.library = await Library.load()
        try:
            await target.discover_and_verify()
            try:
                recon = await Recon(target, self.llm, self._contact_for(0)).profile()
                self._idx += 1
                log.info("recon: %s", recon.notes)
            except Exception as e:  # noqa: BLE001
                log.warning("recon failed: %s", e)
                recon = ReconProfile()
            for rs in runspecs:
                spec = self.catalog.get(rs.objective_slug)
                technique = self.library.technique(rs.technique_slug)
                persona = self.library.persona(rs.persona_slug)
                if not (spec and technique and persona):
                    attempt = Attempt(
                        run_id=run_id, objective_id=rs.label, objective_slug=rs.objective_slug,
                        technique_slug=rs.technique_slug, persona_slug=rs.persona_slug, csrt=rs.csrt,
                        mode="", outcome="error",
                        error=f"unresolved runspec (objective/technique/persona missing): {rs.label}",
                    )
                    await self.store.add_attempt(attempt, [])
                    done += 1
                    continue
                try:
                    cid, d = await self._next_startable(target)
                    attempt, turns = await self._run_one(target, run_id, rs, spec, technique, persona, recon, cid, d)
                except Exception as e:  # noqa: BLE001
                    log.exception("runspec %s failed", rs.label)
                    attempt = Attempt(
                        run_id=run_id, objective_id=rs.label, objective_slug=spec.slug,
                        technique_slug=technique.slug, persona_slug=persona.slug, csrt=rs.csrt,
                        mode=spec.mode, rule=spec.rule, persona=persona.title,
                        contact_id=self._contact_for(self._idx), outcome="error", error=str(e)[:300],
                    )
                    turns = []
                if attempt.outcome == "succeeded":
                    succeeded += 1
                await self.store.add_attempt(attempt, turns)
                done += 1
                await self.store.set_run_status(run_id, "running", done, succeeded)
            await self.store.set_run_status(run_id, "completed", done, succeeded)
        except Exception:  # noqa: BLE001
            log.exception("campaign %s failed", run_id)
            await self.store.set_run_status(run_id, "failed", done, succeeded)
        finally:
            await target.aclose()

    async def _run_one(self, target, run_id, rs: RunSpec, spec, technique, persona,
                       recon: ReconProfile, contact_id: int, d: dict):
        belief = BeliefState()
        sid = d.get("session_id")
        name = d.get("contact_name", "")
        opening = d.get("agent_text", "")
        turns: list[Turn] = []

        def _attempt(**kw):
            return Attempt(
                run_id=run_id, objective_id=rs.label, objective_slug=spec.slug,
                technique_slug=technique.slug, persona_slug=persona.slug, csrt=rs.csrt,
                mode=spec.mode, rule=spec.rule, persona=persona.title,
                contact_id=contact_id, contact_name=name, **kw,
            )

        if not sid:  # no startable contact found after retries — record gracefully
            return _attempt(
                outcome="blocked",
                error=f"start blocked: {d.get('compliance_status')} — {d.get('compliance_reason', '')}"[:300],
            ), []

        line = await self.attacker.open(spec, technique, persona, recon, belief, name, opening, rs.csrt)
        for idx in range(self.s.max_turns):
            resp = await target.send_turn(sid, line)
            reply = resp.get("agent_text", "")
            label = await self.classifier.classify(spec, reply, belief)
            ph = self.attacker._phase(technique, belief)
            turns.append(Turn(
                attempt_id=0, idx=idx, phase=ph.name, attacker_intent=ph.intent,
                attacker_line=line, target_reply=reply, label=label,
                compliance_clean=resp.get("compliance_clean"),
                violations=json.dumps(resp.get("violations", [])),
            ))
            belief.turn = idx + 1
            if label == "Succeed":
                break  # in-call signal only early-stops the loop; the panel decides the verdict
            self.attacker.update_belief(belief, label, reply, technique)
            line = await self.attacker.next_turn(spec, technique, persona, recon, belief, name, reply, rs.csrt)

        try:
            await target.end_session(sid)
        except Exception:  # noqa: BLE001
            pass

        # Phase-2 authoritative verdict (StrongREJECT panel) + deterministic detector evidence
        hits = run_detectors(turns)
        pv = await self.panel.judge(spec, turns)
        outcome = {"SUCCEEDED": "succeeded", "DEFENDED": "defended", "UNKNOWN": "unknown"}.get(
            pv.outcome, "defended"
        )
        return _attempt(
            outcome=outcome, verdict_score=pv.score, num_turns=len(turns),
            judge_votes=json.dumps([v.model_dump() for v in pv.votes]),
            detector_hits=json.dumps([h.model_dump() for h in hits]),
        ), turns
