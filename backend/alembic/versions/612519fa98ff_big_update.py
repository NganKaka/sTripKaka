"""Big Update

Revision ID: 612519fa98ff
Revises: 20260424_0001
Create Date: 2026-04-25 00:03:17.432524
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '612519fa98ff'
down_revision: Union[str, None] = '20260424_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS hero_video VARCHAR;")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS hero_poster VARCHAR;")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS featured_images VARCHAR[];")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS full_description TEXT;")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS gallery_images VARCHAR[];")
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS gallery_nodes JSON;")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS reviews (
          id BIGSERIAL PRIMARY KEY,
          location_id VARCHAR NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
          stars INTEGER NOT NULL CHECK (stars >= 0 AND stars <= 5),
          nickname VARCHAR(80) NOT NULL DEFAULT 'Guest',
          comment TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
          id BIGSERIAL PRIMARY KEY,
          location_id VARCHAR NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
          review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
          title VARCHAR(160) NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_id ON reviews (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_location_id ON reviews (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_created_at ON reviews (created_at);")

    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_location_id ON notifications (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_review_id ON notifications (review_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);")

    op.execute("CREATE INDEX IF NOT EXISTS idx_reviews_location_id ON reviews (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_reviews_location_created_at ON reviews (location_id, created_at DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_location_id ON notifications (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_review_id ON notifications (review_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);")


def downgrade() -> None:
    pass
