"""content_issues_fk_set_null

Revision ID: 46f684d08154
Revises: f5a1b2c3d4e5
Create Date: 2026-08-05 17:56:19.783227

"""

from collections.abc import Sequence

from alembic import op

revision: str = "46f684d08154"
down_revision: str | Sequence[str] | None = "f5a1b2c3d4e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Rebuild content_issues with FK ondelete=SET NULL (raw SQL for SQLite)."""
    op.execute("""
        CREATE TABLE content_issues_new (
            id INTEGER NOT NULL PRIMARY KEY,
            item_id VARCHAR,
            path VARCHAR NOT NULL,
            severity VARCHAR NOT NULL,
            code VARCHAR NOT NULL,
            message VARCHAR NOT NULL,
            synced_at VARCHAR NOT NULL,
            FOREIGN KEY(item_id) REFERENCES content_items(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        INSERT INTO content_issues_new
        SELECT id, item_id, path, severity, code, message, synced_at
        FROM content_issues
    """)
    op.execute("DROP TABLE content_issues")
    op.execute("ALTER TABLE content_issues_new RENAME TO content_issues")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_issues_item_id ON content_issues(item_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_issues_path ON content_issues(path)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_content_issues_synced_at ON content_issues(synced_at)"
    )


def downgrade() -> None:
    """Revert FK to CASCADE."""
    op.execute("""
        CREATE TABLE content_issues_old (
            id INTEGER NOT NULL PRIMARY KEY,
            item_id VARCHAR,
            path VARCHAR NOT NULL,
            severity VARCHAR NOT NULL,
            code VARCHAR NOT NULL,
            message VARCHAR NOT NULL,
            synced_at VARCHAR NOT NULL,
            FOREIGN KEY(item_id) REFERENCES content_items(id) ON DELETE CASCADE
        )
    """)
    op.execute("""
        INSERT INTO content_issues_old
        SELECT id, item_id, path, severity, code, message, synced_at
        FROM content_issues
    """)
    op.execute("DROP TABLE content_issues")
    op.execute("ALTER TABLE content_issues_old RENAME TO content_issues")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_issues_item_id ON content_issues(item_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_issues_path ON content_issues(path)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_content_issues_synced_at ON content_issues(synced_at)"
    )
