"""Store seam + SqlModelStore (Neon Postgres) — campaign-aware."""
from typing import Optional, Protocol

from sqlmodel import select

from .db import SessionLocal
from .models import Attempt, Run, Turn


class Store(Protocol):
    async def create_run(self, run: Run) -> Run: ...
    async def add_attempt(self, attempt: Attempt, turns: list[Turn]) -> None: ...
    async def set_run_status(self, run_id: str, status: str, num_attempts: int, num_succeeded: int) -> None: ...
    async def set_run_recon(self, run_id: str, recon_json: str) -> None: ...
    async def get_run(self, run_id: str) -> dict: ...
    async def list_runs(self) -> list[Run]: ...


class SqlModelStore:
    async def create_run(self, run: Run) -> Run:
        async with SessionLocal() as s:
            s.add(run)
            await s.commit()
            await s.refresh(run)
            return run

    async def add_attempt(self, attempt: Attempt, turns: list[Turn]) -> None:
        async with SessionLocal() as s:
            s.add(attempt)
            await s.commit()
            await s.refresh(attempt)
            for t in turns:
                t.attempt_id = attempt.id
                s.add(t)
            await s.commit()

    async def set_run_status(self, run_id: str, status: str, num_attempts: int, num_succeeded: int) -> None:
        async with SessionLocal() as s:
            run = await s.get(Run, run_id)
            if run:
                run.status = status
                run.num_attempts = num_attempts
                run.num_succeeded = num_succeeded
                s.add(run)
                await s.commit()

    async def set_run_recon(self, run_id: str, recon_json: str) -> None:
        async with SessionLocal() as s:
            run = await s.get(Run, run_id)
            if run:
                run.recon = recon_json
                s.add(run)
                await s.commit()

    async def get_run(self, run_id: str) -> dict:
        async with SessionLocal() as s:
            run = await s.get(Run, run_id)
            if not run:
                return {}
            atts = list((await s.execute(
                select(Attempt).where(Attempt.run_id == run_id).order_by(Attempt.id)
            )).scalars().all())
            out_atts = []
            for a in atts:
                turns = list((await s.execute(
                    select(Turn).where(Turn.attempt_id == a.id).order_by(Turn.idx)
                )).scalars().all())
                out_atts.append({"attempt": a, "turns": turns})
            return {"run": run, "attempts": out_atts}

    async def list_runs(self) -> list[Run]:
        async with SessionLocal() as s:
            return list((await s.execute(select(Run).order_by(Run.created_at.desc()))).scalars().all())

    async def all_attempts(self) -> list[Attempt]:
        async with SessionLocal() as s:
            return list((await s.execute(select(Attempt))).scalars().all())
