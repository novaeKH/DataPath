"""review tables (spaced repetition)

Revision ID: f5a1b2c3d4e5
Revises: f4a1b2c3d4e5
Create Date: 2026-08-05 12:00:00.000000

Создаёт схему интервального повторения (Фаза 5):
review_items (текущее состояние элемента повторения) и
review_attempts (неизменяемая история ответов).
Согласовано с docs/review-system.md.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f5a1b2c3d4e5"
down_revision: str | Sequence[str] | None = "f4a1b2c3d4e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "review_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("template_id", sa.String(), nullable=False),
        sa.Column("primary_skill_id", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("stage", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("due_at", sa.String(), nullable=False),
        sa.Column("interval_days", sa.Float(), nullable=False),
        sa.Column("ease_factor", sa.Float(), nullable=False),
        sa.Column("repetitions", sa.Integer(), nullable=False),
        sa.Column("lapses", sa.Integer(), nullable=False),
        sa.Column("last_reviewed_at", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("template_id"),
    )
    op.create_index("ix_review_items_template_id", "review_items", ["template_id"])
    op.create_index("ix_review_items_primary_skill_id", "review_items", ["primary_skill_id"])
    op.create_index("ix_review_items_due_at", "review_items", ["due_at"])
    op.create_index("ix_review_items_status_due", "review_items", ["status", "due_at"])
    op.create_index("ix_review_items_source", "review_items", ["source_type", "source_id"])

    op.create_table(
        "review_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_item_id", sa.Integer(), nullable=False),
        sa.Column("answer", sa.JSON(), nullable=True),
        sa.Column("objective_score", sa.Float(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("user_rating", sa.String(), nullable=True),
        sa.Column("effective_rating", sa.String(), nullable=False),
        sa.Column("hints_used", sa.Integer(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("dedup_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["review_item_id"], ["review_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dedup_key"),
    )
    op.create_index("ix_review_attempts_review_item_id", "review_attempts", ["review_item_id"])
    op.create_index("ix_review_attempts_created_at", "review_attempts", ["created_at"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_review_attempts_created_at", table_name="review_attempts")
    op.drop_index("ix_review_attempts_review_item_id", table_name="review_attempts")
    op.drop_table("review_attempts")
    op.drop_index("ix_review_items_source", table_name="review_items")
    op.drop_index("ix_review_items_status_due", table_name="review_items")
    op.drop_index("ix_review_items_due_at", table_name="review_items")
    op.drop_index("ix_review_items_primary_skill_id", table_name="review_items")
    op.drop_index("ix_review_items_template_id", table_name="review_items")
    op.drop_table("review_items")
