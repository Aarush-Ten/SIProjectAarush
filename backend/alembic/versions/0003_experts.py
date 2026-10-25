"""Persist administrator-managed experts independently of the pitch team."""
import sqlalchemy as sa
from alembic import op

revision = "0003_experts"
down_revision = "0002_learning_resources"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "experts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("expertise", sa.JSON(), nullable=False),
        sa.Column("contact", sa.String(250), nullable=True),
        sa.Column("availability", sa.String(300), nullable=False),
        *[sa.Column(name, sa.Boolean(), nullable=False) for name in (
            "verified", "approved", "active", "public_visible", "public_contact", "is_demo"
        )],
    )


def downgrade():
    op.drop_table("experts")
