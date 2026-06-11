"""Campaign runner — recon → per-play multi-turn GALA-lite loop → store.

AARAV self-reports its own gate (compliance_clean / violations) per turn, so we capture both
that AND our classifier label. A real bypass = our classifier says Succeed while AARAV's gate
reported clean (its filter missed it).
"""
import json
import logging

from .attacker import PromptLibAttacker
from .belief import BeliefState
from .classifier import GeminiClassifier
from .config import get_settings
from .llm import GeminiLLM
from .models import Attempt, Turn
from .playlib import Play
from .recon import Recon, ReconProfile
from .store import SqlModelStore
from .target import AaravTarget

log = logging.getLogger("autosentinx.runner")


class Runner:
    def __init__(self) -> None:
        self.s = get_settings()
        self.llm = GeminiLLM()
        self.store = SqlModelStore()
        self.attacker = PromptLibAttacker(self.llm)
        self.classifier = GeminiClassifier(self.llm)

    async def run_campaign(self, run_id: str, plays: list[Play], contact_id: int) -> None:
        target = AaravTarget()
        succeeded = 0
        done = 0
        try:
            await target.discover_and_verify()
            try:
                recon = await Recon(target, self.llm, contact_id).profile()
                log.info("recon: %s", recon.notes)
            except Exception as e:  # noqa: BLE001
                log.warning("recon failed: %s", e)
                recon = ReconProfile()
            for play in plays:
                try:
                    attempt, turns = await self._run_play(target, run_id, play, recon, contact_id)
                except Exception as e:  # noqa: BLE001
                    log.exception("play %s failed", play.id)
                    attempt = Attempt(
                        run_id=run_id, objective_id=play.id, mode=play.mode, rule=play.rule,
                        persona=play.persona, contact_id=contact_id, outcome="error", error=str(e)[:300],
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

    async def _run_play(self, target, run_id, play: Play, recon: ReconProfile, contact_id: int):
        belief = BeliefState()
        d = await target.start_session(contact_id)
        sid = d.get("session_id")
        name = d.get("contact_name", "")
        opening = d.get("agent_text", "")
        turns: list[Turn] = []
        outcome = "defended"

        if not sid:  # AARAV blocked the call (e.g., daily limit / window / DNC) — record gracefully
            return Attempt(
                run_id=run_id, objective_id=play.id, mode=play.mode, rule=play.rule,
                persona=play.persona, contact_id=contact_id, contact_name=name, outcome="blocked",
                error=f"start blocked: {d.get('compliance_status')} — {d.get('compliance_reason', '')}"[:300],
            ), []

        line = await self.attacker.open(play, recon, belief, name, opening)
        for idx in range(self.s.max_turns):
            resp = await target.send_turn(sid, line)
            reply = resp.get("agent_text", "")
            label = await self.classifier.classify(play, reply, belief)
            ph = self.attacker._phase(play, belief)
            turns.append(Turn(
                attempt_id=0, idx=idx, phase=ph.name, attacker_intent=ph.intent,
                attacker_line=line, target_reply=reply, label=label,
                compliance_clean=resp.get("compliance_clean"),
                violations=json.dumps(resp.get("violations", [])),
            ))
            belief.turn = idx + 1
            if label == "Succeed":
                outcome = "succeeded"
                break
            self.attacker.update_belief(belief, label, reply, play)
            line = await self.attacker.next_turn(play, recon, belief, name, reply)

        try:
            await target.end_session(sid)
        except Exception:  # noqa: BLE001
            pass

        attempt = Attempt(
            run_id=run_id, objective_id=play.id, mode=play.mode, rule=play.rule,
            persona=play.persona, contact_id=contact_id, contact_name=name,
            outcome=outcome, num_turns=len(turns),
        )
        return attempt, turns
