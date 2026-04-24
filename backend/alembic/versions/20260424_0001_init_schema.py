"""init schema

Revision ID: 20260424_0001
Revises:
Create Date: 2026-04-24 00:00:00
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260424_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS locations (
          id VARCHAR PRIMARY KEY,
          name VARCHAR,
          chapter VARCHAR,
          short_desc TEXT,
          img VARCHAR,
          visited_date VARCHAR,
          highlight_type VARCHAR,
          lat VARCHAR,
          lng VARCHAR,
          hero_video VARCHAR,
          hero_poster VARCHAR,
          featured_images TEXT[],
          full_description TEXT,
          gallery_images TEXT[],
          gallery_nodes JSON
        );
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_locations_id ON locations (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_locations_name ON locations (name);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS reviews (
          id BIGSERIAL PRIMARY KEY,
          location_id VARCHAR NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
          stars INTEGER NOT NULL,
          nickname VARCHAR(80) NOT NULL DEFAULT 'Guest',
          comment TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT ck_reviews_stars_range CHECK (stars >= 0 AND stars <= 5)
        );
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_id ON reviews (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_location_id ON reviews (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reviews_created_at ON reviews (created_at);")

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

    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_location_id ON notifications (location_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_review_id ON notifications (review_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications CASCADE;")
    op.execute("DROP TABLE IF EXISTS reviews CASCADE;")
    op.execute("DROP TABLE IF EXISTS locations CASCADE;")
