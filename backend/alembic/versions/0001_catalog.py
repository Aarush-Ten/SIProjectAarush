"""Create the Phase 1 catalog only; profile evaluation remains stateless."""

import sqlalchemy as sa

from alembic import op

revision = "0001_catalog"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("label_en", sa.String(100), nullable=False),
        sa.Column("label_mr", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
    )
    op.create_table(
        "careers",
        sa.Column("slug", sa.String(80), primary_key=True),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("interest_tags", sa.JSON(), nullable=False),
        sa.Column("device_requirement", sa.String(20), nullable=False),
        sa.Column("recommended_hours_per_week", sa.Integer(), nullable=False),
        sa.Column("practice_budget_inr", sa.Integer(), nullable=False),
        sa.Column("device_note", sa.Text(), nullable=False),
        sa.Column("source_note", sa.String(100), nullable=False),
        sa.Column("tasks", sa.JSON(), nullable=False),
        sa.CheckConstraint("device_requirement IN ('computer', 'any')"),
        sa.CheckConstraint("recommended_hours_per_week BETWEEN 1 AND 30"),
        sa.CheckConstraint("practice_budget_inr >= 0"),
    )
    op.create_table(
        "career_skills",
        sa.Column(
            "career_id",
            sa.String(80),
            sa.ForeignKey("careers.slug", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("skill_id", sa.String(80), sa.ForeignKey("skills.id"), primary_key=True),
        sa.Column("required_level", sa.Integer(), nullable=False),
        sa.Column("importance", sa.String(12), nullable=False),
        sa.Column("weight", sa.Integer(), nullable=False),
        sa.CheckConstraint("required_level BETWEEN 1 AND 3"),
        sa.CheckConstraint("weight BETWEEN 1 AND 5"),
        sa.CheckConstraint("importance IN ('essential', 'optional')"),
    )


def downgrade() -> None:
    op.drop_table("career_skills")
    op.drop_table("careers")
    op.drop_table("skills")
