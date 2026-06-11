"""GALA-lite belief-state: the attacker's per-conversation scratchpad."""
from pydantic import BaseModel, Field


class BeliefState(BaseModel):
    phase_idx: int = 0                     # current phase in the play
    turns_in_phase: int = 0
    turn: int = 0
    last_label: str = ""                   # Comply | Refusal | Unknown | Succeed
    revealed: list[str] = Field(default_factory=list)   # what the agent disclosed/conceded
    refused: list[str] = Field(default_factory=list)     # what the agent refused
    notes: list[str] = Field(default_factory=list)       # recon facts + observations

    def summary(self) -> str:
        bits = []
        if self.revealed:
            bits.append("agent has revealed/conceded: " + "; ".join(self.revealed[-4:]))
        if self.refused:
            bits.append("agent has refused: " + "; ".join(self.refused[-4:]))
        if self.notes:
            bits.append("recon/notes: " + "; ".join(self.notes[-4:]))
        return " | ".join(bits) if bits else "(no observations yet)"
