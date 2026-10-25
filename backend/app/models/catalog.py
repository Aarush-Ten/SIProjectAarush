from sqlalchemy import JSON, CheckConstraint, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    label_en: Mapped[str] = mapped_column(String(100))
    label_mr: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text)


class Career(Base):
    __tablename__ = "careers"
    __table_args__ = (
        CheckConstraint("device_requirement IN ('computer', 'any')"),
        CheckConstraint("recommended_hours_per_week BETWEEN 1 AND 30"),
        CheckConstraint("practice_budget_inr >= 0"),
    )

    slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    summary: Mapped[str] = mapped_column(Text)
    interest_tags: Mapped[list[str]] = mapped_column(JSON)
    device_requirement: Mapped[str] = mapped_column(String(20))
    recommended_hours_per_week: Mapped[int]
    practice_budget_inr: Mapped[int]
    device_note: Mapped[str] = mapped_column(Text)
    source_note: Mapped[str] = mapped_column(String(100))
    tasks: Mapped[list[str]] = mapped_column(JSON)
    skills: Mapped[list["CareerSkill"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="CareerSkill.skill_id"
    )


class CareerSkill(Base):
    __tablename__ = "career_skills"
    __table_args__ = (
        CheckConstraint("required_level BETWEEN 1 AND 3"),
        CheckConstraint("weight BETWEEN 1 AND 5"),
        CheckConstraint("importance IN ('essential', 'optional')"),
    )

    career_id: Mapped[str] = mapped_column(
        ForeignKey("careers.slug", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    required_level: Mapped[int]
    importance: Mapped[str] = mapped_column(String(12))
    weight: Mapped[int]
    skill: Mapped[Skill] = relationship(lazy="joined")
