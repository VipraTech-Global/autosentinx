"""technique.provider (P6 attack-provider seam)

Revision ID: 8a1c4d2e9f30
Revises: 7f3a9c2b1e08
Create Date: 2026-06-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = '8a1c4d2e9f30'
down_revision: Union[str, Sequence[str], None] = '7f3a9c2b1e08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('technique', sa.Column('provider', sqlmodel.sql.sqltypes.AutoString(),
                                         nullable=False, server_default='native'))


def downgrade() -> None:
    op.drop_column('technique', 'provider')
