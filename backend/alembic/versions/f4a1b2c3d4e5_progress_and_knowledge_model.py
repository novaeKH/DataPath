"""progress and knowledge model tables

Revision ID: f4a1b2c3d4e5
Revises: a1b2c3d4e5f6
Create Date: 2026-08-05 03:00:00.000000

Создаёт схему модели знаний и прогресса пользователя (Фаза 4):
learning_events, skill_assessments, lesson_progress, lab_attempts, case_attempts.
Согласовано с docs/knowledge-model.md и docs/progress-system.md.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f4a1b2c3d4e5"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "learning_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("skill_id", sa.String(), nullable=True),
        sa.Column("knowledge_axis", sa.String(), nullable=True),
        sa.Column("outcome", sa.String(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("hints_used", sa.Integer(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("error_code", sa.String(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("dedup_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dedup_key"),
    )
    op.create_index("ix_learning_events_event_type", "learning_events", ["event_type"])
    op.create_index("ix_learning_events_source_type", "learning_events", ["source_type"])
    op.create_index("ix_learning_events_source_id", "learning_events", ["source_id"])
    op.create_index("ix_learning_events_skill_id", "learning_events", ["skill_id"])
    op.create_index("ix_learning_events_created_at", "learning_events", ["created_at"])
    op.create_index("ix_learning_events_source", "learning_events", ["source_type", "source_id"])
    op.create_index(
        "ix_learning_events_skill_axis", "learning_events", ["skill_id", "knowledge_axis"]
    )

    op.create_table(
        "skill_assessments",
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("axes", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_count", sa.Integer(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("last_activity_at", sa.String(), nullable=True),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("skill_id"),
    )

    op.create_table(
        "lesson_progress",
        sa.Column("lesson_id", sa.String(), nullable=False),
        sa.Column("current_scene_id", sa.String(), nullable=True),
        sa.Column("completed_scenes", sa.JSON(), nullable=False),
        sa.Column("started_at", sa.String(), nullable=False),
        sa.Column("completed_at", sa.String(), nullable=True),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("lesson_id"),
    )

    op.create_table(
        "lab_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lab_id", sa.String(), nullable=False),
        sa.Column("lesson_id", sa.String(), nullable=True),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("result_summary", sa.JSON(), nullable=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("dedup_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dedup_key"),
    )
    op.create_index("ix_lab_attempts_lab_id", "lab_attempts", ["lab_id"])

    op.create_table(
        "case_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.String(), nullable=False),
        sa.Column("mode", sa.String(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_case_attempts_case_id", "case_attempts", ["case_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_case_attempts_case_id", table_name="case_attempts")
    op.drop_table("case_attempts")
    op.drop_index("ix_lab_attempts_lab_id", table_name="lab_attempts")
    op.drop_table("lab_attempts")
    op.drop_table("lesson_progress")
    op.drop_table("skill_assessments")
    op.drop_index("ix_learning_events_skill_axis", table_name="learning_events")
    op.drop_index("ix_learning_events_source", table_name="learning_events")
    op.drop_index("ix_learning_events_created_at", table_name="learning_events")
    op.drop_index("ix_learning_events_skill_id", table_name="learning_events")
    op.drop_index("ix_learning_events_source_id", table_name="learning_events")
    op.drop_index("ix_learning_events_source_type", table_name="learning_events")
    op.drop_index("ix_learning_events_event_type", table_name="learning_events")
    op.drop_table("learning_events")
