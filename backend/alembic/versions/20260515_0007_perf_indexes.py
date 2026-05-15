"""perf indexes (Day 2)

Adds composite + trigram indexes that match the hot query paths:
- Active list ordered by visited_date DESC
- Search across name / short_desc / full_description
- Popular-this-week scan over location_views

Revision ID: 20260515_0007
Revises: 20260427_0006
Create Date: 2026-05-15
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260515_0007"
down_revision: Union[str, None] = "20260427_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite for the hot list query: WHERE is_archived = 0 ORDER BY visited_date DESC
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_locations_active_visited "
        "ON locations (is_archived, visited_date DESC);"
    )

    # Useful for the chapter uniqueness check on active rows
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_locations_active_chapter "
        "ON locations (is_archived, chapter);"
    )

    # Trigram search index for ILIKE '%term%' across the searchable columns.
    # pg_trgm is required; safe to call repeatedly.
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_locations_search_trgm "
        "ON locations USING gin ("
        "  (coalesce(name,'') || ' ' || coalesce(short_desc,'') || ' ' || coalesce(full_description,'')) "
        "  gin_trgm_ops"
        ");"
    )

    # Popular-this-week filters by viewed_at then groups by location_id.
    # The existing idx_location_views_weekly indexes (viewed_at, location_id) ascending; we want DESC.
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_location_views_recent "
        "ON location_views (viewed_at DESC, location_id);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_location_views_recent;")
    op.execute("DROP INDEX IF EXISTS idx_locations_search_trgm;")
    op.execute("DROP INDEX IF EXISTS idx_locations_active_chapter;")
    op.execute("DROP INDEX IF EXISTS idx_locations_active_visited;")
