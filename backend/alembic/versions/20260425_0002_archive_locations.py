"""archive locations

Revision ID: 20260425_0002
Revises: 612519fa98ff
Create Date: 2026-04-25 12:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260425_0002"
down_revision: Union[str, None] = "612519fa98ff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_archived INTEGER NOT NULL DEFAULT 0;")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_locations_is_archived ON locations (is_archived);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_locations_is_archived;")
    op.execute("ALTER TABLE locations DROP COLUMN IF EXISTS archived_at;")
    op.execute("ALTER TABLE locations DROP COLUMN IF EXISTS is_archived;")
