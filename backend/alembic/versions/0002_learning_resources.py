"""Add the public resource catalog; guest plans remain stateless."""

import sqlalchemy as sa

from alembic import op

revision = "0002_learning_resources"
down_revision = "0001_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "learning_resources",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("provider", sa.String(100), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("cost_inr", sa.Float(), nullable=True),
        sa.Column("is_free", sa.Boolean(), nullable=False),
        sa.Column("estimated_hours", sa.Float(), nullable=False),
        sa.Column("source_note", sa.Text(), nullable=False),
        sa.Column("last_checked", sa.Date(), nullable=True),
        sa.Column("device_requirement", sa.String(20), nullable=False),
        sa.CheckConstraint("cost_inr IS NULL OR cost_inr >= 0"),
        sa.CheckConstraint("estimated_hours > 0 AND estimated_hours <= 200"),
        sa.CheckConstraint("device_requirement IN ('computer', 'any')"),
        sa.CheckConstraint("NOT is_free OR cost_inr IS NULL OR cost_inr = 0"),
    )
    op.create_table(
        "learning_resource_skills",
        sa.Column(
            "resource_id",
            sa.String(80),
            sa.ForeignKey("learning_resources.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("skill_id", sa.String(80), sa.ForeignKey("skills.id"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("learning_resource_skills")
    op.drop_table("learning_resources")
