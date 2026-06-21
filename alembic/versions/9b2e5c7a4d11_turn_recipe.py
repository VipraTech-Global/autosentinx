"""turn.recipe (generic provider firing-chain capture; P9-sensitive)

Revision ID: 9b2e5c7a4d11
Revises: 8a1c4d2e9f30
Create Date: 2026-06-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = '9b2e5c7a4d11'
down_revision: Union[str, Sequence[str], None] = '8a1c4d2e9f30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('turn', sa.Column('recipe', sqlmodel.sql.sqltypes.AutoString(),
                                    nullable=False, server_default=''))


def downgrade() -> None:
    op.drop_column('turn', 'recipe')
