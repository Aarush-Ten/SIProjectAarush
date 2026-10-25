from sqlalchemy import Boolean, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Expert(Base):
    __tablename__ = "experts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str] = mapped_column(Text)
    expertise: Mapped[list[str]] = mapped_column(JSON)
    contact: Mapped[str | None] = mapped_column(String(250), nullable=True)
    availability: Mapped[str] = mapped_column(String(300))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=False)
    public_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
