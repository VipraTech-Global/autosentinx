"""run recon column (engine-port Wave 4)

Persist the campaign-start ReconProfile (scouting interrogation) on the run so the
RunView projection can emit a real ReconView instead of an honest 'skipped' stub.

Revision ID: 9a3f1c0d4e2b
Revises: bf08efd4d1fa
Create Date: 2026-06-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '9a3f1c0d4e2b'
down_revision: Union[str, Sequence[str], None] = 'bf08efd4d1fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('run', sa.Column('recon', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default=''))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('run', 'recon')
