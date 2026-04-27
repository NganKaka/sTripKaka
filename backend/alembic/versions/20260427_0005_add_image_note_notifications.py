"""add image_note_id to notifications

Revision ID: 20260427_0005
Revises: 20260427_0004
Create Date: 2026-04-27 10:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260427_0005"
down_revision: Union[str, None] = "20260427_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE notifications ALTER COLUMN review_id DROP NOT NULL;")
    op.execute(
        """
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS image_note_id BIGINT
        REFERENCES image_notes(id) ON DELETE CASCADE;
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_notifications_image_note_id ON notifications (image_note_id);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_notifications_image_note_id;")
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS image_note_id;")
    op.execute("ALTER TABLE notifications ALTER COLUMN review_id SET NOT NULL;")
