"""add music_url to locations

Revision ID: 20260427_0003
Revises: 20260425_0002
Create Date: 2026-04-27 00:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260427_0003"
down_revision: Union[str, None] = "20260425_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS music_url VARCHAR;")


def downgrade() -> None:
    op.execute("ALTER TABLE locations DROP COLUMN IF EXISTS music_url;")
