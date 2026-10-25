from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SecurityQuota(Base):
    __tablename__ = "security_quotas"
    scope: Mapped[str] = mapped_column(String(30), primary_key=True)
    minute: Mapped[int] = mapped_column(BigInteger)
    minute_count: Mapped[int] = mapped_column(Integer)
    day: Mapped[int] = mapped_column(BigInteger)
    day_count: Mapped[int] = mapped_column(Integer)
