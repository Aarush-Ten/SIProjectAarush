from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(database_url: str) -> Engine:
    options: dict = {"pool_pre_ping": True}
    if database_url.startswith("sqlite"):
        options["connect_args"] = {"check_same_thread": False}
        if database_url in {"sqlite://", "sqlite:///:memory:"}:
            options["poolclass"] = StaticPool
    engine = create_engine(database_url, **options)
    if database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _record):
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def session_for(engine: Engine) -> Session:
    return Session(engine, expire_on_commit=False)
