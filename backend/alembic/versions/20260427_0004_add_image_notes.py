"""add image notes

Revision ID: 20260427_0004
Revises: 20260427_0003
Create Date: 2026-04-27 00:30:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260427_0004"
down_revision: Union[str, None] = "20260427_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS image_notes (
          id BIGSERIAL PRIMARY KEY,
          location_id VARCHAR NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
          image_src TEXT NOT NULL,
          nickname VARCHAR(80) NOT NULL DEFAULT 'Guest',
          comment TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_image_notes_id ON image_notes (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_image_notes_location_id ON image_notes (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_image_notes_image_src ON image_notes (image_src);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_image_notes_created_at ON image_notes (created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_image_notes_location_image ON image_notes (location_id, image_src);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_image_notes_location_image;")
    op.execute("DROP INDEX IF EXISTS ix_image_notes_created_at;")
    op.execute("DROP INDEX IF EXISTS ix_image_notes_image_src;")
    op.execute("DROP INDEX IF EXISTS ix_image_notes_location_id;")
    op.execute("DROP INDEX IF EXISTS ix_image_notes_id;")
    op.execute("DROP TABLE IF EXISTS image_notes;")
