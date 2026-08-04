"""content catalog tables

Revision ID: a1b2c3d4e5f6
Revises: 647b2d093cad
Create Date: 2026-08-05 02:30:00.000000

Создаёт предметную схему контентного каталога (Фаза 2):
content_items, content_links, content_issues, sync_runs.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "647b2d093cad"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "content_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("area", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("app", sa.String(), nullable=False),
        sa.Column("rag", sa.String(), nullable=True),
        sa.Column("rag_collection", sa.String(), nullable=True),
        sa.Column("publish", sa.Boolean(), nullable=False),
        sa.Column("course_id", sa.String(), nullable=True),
        sa.Column("module_id", sa.String(), nullable=True),
        sa.Column("module_order", sa.Integer(), nullable=True),
        sa.Column("lesson_order", sa.Integer(), nullable=True),
        sa.Column("content_path", sa.String(), nullable=True),
        sa.Column("practice_kind", sa.String(), nullable=True),
        sa.Column("skill_ids", sa.JSON(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("estimated_hours", sa.Float(), nullable=True),
        sa.Column("accent", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("aliases", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("math_depth", sa.Integer(), nullable=True),
        sa.Column("frontmatter", sa.JSON(), nullable=False),
        sa.Column("prerequisites", sa.JSON(), nullable=True),
        sa.Column("content_hash", sa.String(), nullable=False),
        sa.Column("file_mtime", sa.String(), nullable=False),
        sa.Column("synced_at", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.Column("validation_status", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["content_items.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["module_id"], ["content_items.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("path"),
    )
    op.create_index("ix_content_items_type", "content_items", ["type"])
    op.create_index("ix_content_items_publish", "content_items", ["publish"])
    op.create_index("ix_content_items_course_id", "content_items", ["course_id"])
    op.create_index("ix_content_items_slug", "content_items", ["slug"])

    op.create_table(
        "content_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("target_id", sa.String(), nullable=False),
        sa.Column("relation", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["content_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_id"], ["content_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_id", "target_id", "relation", "kind", name="uq_content_links"),
    )
    op.create_index("ix_content_links_source_id", "content_links", ["source_id"])
    op.create_index("ix_content_links_target_id", "content_links", ["target_id"])

    op.create_table(
        "content_issues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("item_id", sa.String(), nullable=True),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("synced_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_content_issues_item_id", "content_issues", ["item_id"])
    op.create_index("ix_content_issues_path", "content_issues", ["path"])
    op.create_index("ix_content_issues_synced_at", "content_issues", ["synced_at"])

    op.create_table(
        "sync_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.String(), nullable=False),
        sa.Column("finished_at", sa.String(), nullable=True),
        sa.Column("scanned", sa.Integer(), nullable=False),
        sa.Column("created", sa.Integer(), nullable=False),
        sa.Column("updated", sa.Integer(), nullable=False),
        sa.Column("unchanged", sa.Integer(), nullable=False),
        sa.Column("removed", sa.Integer(), nullable=False),
        sa.Column("errors", sa.Integer(), nullable=False),
        sa.Column("warnings", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("sync_runs")
    op.drop_index("ix_content_issues_synced_at", table_name="content_issues")
    op.drop_index("ix_content_issues_path", table_name="content_issues")
    op.drop_index("ix_content_issues_item_id", table_name="content_issues")
    op.drop_table("content_issues")
    op.drop_index("ix_content_links_target_id", table_name="content_links")
    op.drop_index("ix_content_links_source_id", table_name="content_links")
    op.drop_table("content_links")
    op.drop_index("ix_content_items_slug", table_name="content_items")
    op.drop_index("ix_content_items_course_id", table_name="content_items")
    op.drop_index("ix_content_items_publish", table_name="content_items")
    op.drop_index("ix_content_items_type", table_name="content_items")
    op.drop_table("content_items")
