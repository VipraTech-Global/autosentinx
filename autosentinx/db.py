"""Async SQLModel engine on Neon Postgres (plain Postgres — no pgvector in Phase 0)."""
import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings
from . import models  # noqa: F401  (register tables on import)

_settings = get_settings()
_async_url = _settings.async_db_url
# Neon requires TLS; a local/Docker Postgres has none — only attach an SSL context for remote hosts.
if "127.0.0.1" in _async_url or "localhost" in _async_url:
    _connect_args: dict = {}
else:
    _connect_args = {"ssl": ssl.create_default_context()}  # asyncpg takes ssl via connect_args

engine = create_async_engine(
    _async_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Schema is managed by Alembic (see alembic/). Run `alembic upgrade head` (the app also does this on startup).
