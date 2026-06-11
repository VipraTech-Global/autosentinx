"""Async SQLModel engine on Neon Postgres (plain Postgres — no pgvector in Phase 0)."""
import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings
from . import models  # noqa: F401  (register tables on import)

_settings = get_settings()
_ssl_ctx = ssl.create_default_context()  # Neon requires TLS; asyncpg takes ssl via connect_args

engine = create_async_engine(
    _settings.async_db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": _ssl_ctx},
)

SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Schema is managed by Alembic (see alembic/). Run `alembic upgrade head` (the app also does this on startup).
