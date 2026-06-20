"""attempt P7 domain-findings shadow fields

Revision ID: 7f3a9c2b1e08
Revises: bf08efd4d1fa
Create Date: 2026-06-20 00:00:00.000000

Adds the P7 shadow-layer columns: `domain_findings` (JSON regex-tier domain candidates, advisory)
and `policy_mode` (off | shadow | enforced). Both defaulted so the migration is additive and the
shadow feature is off by default (no behavior change).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '7f3a9c2b1e08'
down_revision: Union[str, Sequence[str], None] = 'bf08efd4d1fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('attempt', sa.Column('domain_findings', sqlmodel.sql.sqltypes.AutoString(),
                                       nullable=False, server_default=''))
    op.add_column('attempt', sa.Column('policy_mode', sqlmodel.sql.sqltypes.AutoString(),
                                       nullable=False, server_default='off'))


def downgrade() -> None:
    op.drop_column('attempt', 'policy_mode')
    op.drop_column('attempt', 'domain_findings')
