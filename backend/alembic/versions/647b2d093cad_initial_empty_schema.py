"""initial empty schema

Revision ID: 647b2d093cad
Revises:
Create Date: 2026-08-05 01:44:30.720559

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "647b2d093cad"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
