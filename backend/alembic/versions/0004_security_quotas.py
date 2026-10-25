"""Durable AI request budget shared across application workers."""
import sqlalchemy as sa
from alembic import op

revision = "0004_security_quotas"
down_revision = "0003_experts"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("security_quotas",
        sa.Column("scope", sa.String(30), primary_key=True),
        sa.Column("minute", sa.BigInteger(), nullable=False),
        sa.Column("minute_count", sa.Integer(), nullable=False),
        sa.Column("day", sa.BigInteger(), nullable=False),
        sa.Column("day_count", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("security_quotas")
