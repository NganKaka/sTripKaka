"""add location views

Revision ID: 20260427_0006
Revises: 20260427_0005
Create Date: 2026-04-27 11:30:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260427_0006"
down_revision: Union[str, None] = "20260427_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS location_views (
          id BIGSERIAL PRIMARY KEY,
          location_id VARCHAR NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
          view_type VARCHAR(32) NOT NULL,
          viewer_key VARCHAR(120),
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_location_views_id ON location_views (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_location_views_location_id ON location_views (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_location_views_view_type ON location_views (view_type);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_location_views_viewer_key ON location_views (viewer_key);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_location_views_viewed_at ON location_views (viewed_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_location_views_weekly ON location_views (viewed_at, location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_location_views_dedup ON location_views (viewer_key, location_id, view_type, viewed_at);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_location_views_dedup;")
    op.execute("DROP INDEX IF EXISTS idx_location_views_weekly;")
    op.execute("DROP INDEX IF EXISTS ix_location_views_viewed_at;")
    op.execute("DROP INDEX IF EXISTS ix_location_views_viewer_key;")
    op.execute("DROP INDEX IF EXISTS ix_location_views_view_type;")
    op.execute("DROP INDEX IF EXISTS ix_location_views_location_id;")
    op.execute("DROP INDEX IF EXISTS ix_location_views_id;")
    op.execute("DROP TABLE IF EXISTS location_views;")
