"""Alembic environment — async, wired to our SQLModel metadata + Neon engine."""
import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # project root

from sqlmodel import SQLModel  # noqa: E402
from autosentinx.db import engine  # noqa: E402  (configured async engine + SSL)
import autosentinx.models  # noqa: E402,F401  (register tables on SQLModel.metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def include_name(name, type_, parent_names) -> bool:
    """Scope Alembic to OUR tables only — the Neon DB is shared with other components."""
    if type_ == "table":
        return name is None or name == "alembic_version" or name in target_metadata.tables
    return True


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection, target_metadata=target_metadata,
        compare_type=True, include_name=include_name,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_offline() -> None:
    context.configure(
        url=str(engine.url), target_metadata=target_metadata,
        literal_binds=True, dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_async_migrations())
