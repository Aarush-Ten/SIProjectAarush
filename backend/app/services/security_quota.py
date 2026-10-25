from time import time
from sqlalchemy import case, insert, or_, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.models.security import SecurityQuota


class DatabaseProviderBudget:
    """Atomic fixed UTC windows shared by workers/restarts using the same database."""
    def __init__(self, engine):
        self.engine = engine

    def acquire(self, minute_limit, day_limit):
        now = int(time())
        minute, day = now // 60, now // 86400
        table = SecurityQuota.__table__
        try:
            with self.engine.begin() as connection:
                try:
                    with connection.begin_nested():
                        connection.execute(insert(table).values(scope="ai", minute=0, day=0, minute_count=0, day_count=0))
                except IntegrityError:
                    pass  # another worker already initialized the quota
                result = connection.execute(update(table).where(
                    table.c.scope == "ai",
                    or_(table.c.minute != minute, table.c.minute_count < minute_limit),
                    or_(table.c.day != day, table.c.day_count < day_limit),
                ).values(
                    minute=minute, day=day,
                    minute_count=case((table.c.minute == minute, table.c.minute_count + 1), else_=1),
                    day_count=case((table.c.day == day, table.c.day_count + 1), else_=1),
                ))
                return result.rowcount == 1
        except SQLAlchemyError:
            return False  # missing migration, outage or contention must never permit a paid call
