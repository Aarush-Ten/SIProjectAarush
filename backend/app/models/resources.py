from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LearningResource(Base):
    __tablename__ = "learning_resources"
    __table_args__ = (
        CheckConstraint("cost_inr IS NULL OR cost_inr >= 0"),
        CheckConstraint("estimated_hours > 0 AND estimated_hours <= 200"),
        CheckConstraint("device_requirement IN ('computer', 'any')"),
        CheckConstraint("NOT is_free OR cost_inr IS NULL OR cost_inr = 0"),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(100))
    url: Mapped[str] = mapped_column(Text)
    cost_inr: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean)
    estimated_hours: Mapped[float] = mapped_column(Float)
    source_note: Mapped[str] = mapped_column(Text)
    last_checked: Mapped[date | None] = mapped_column(Date, nullable=True)
    device_requirement: Mapped[str] = mapped_column(String(20))
    skills: Mapped[list["LearningResourceSkill"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="LearningResourceSkill.skill_id"
    )


class LearningResourceSkill(Base):
    __tablename__ = "learning_resource_skills"

    resource_id: Mapped[str] = mapped_column(
        ForeignKey("learning_resources.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"), primary_key=True)
