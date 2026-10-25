from app.core.config import get_settings
from app.core.database import make_engine, session_for
from app.seed.catalog import CAREERS, SKILLS
from app.seed.resources import RESOURCES
from app.seed.runner import seed_catalog


def main() -> None:
    engine = make_engine(get_settings().database_url)
    try:
        with session_for(engine) as session:
            seed_catalog(session)
        print(
            f"Seeded curated demo catalog: {len(SKILLS)} skills, {len(CAREERS)} careers, "
            f"{len(RESOURCES)} resources (idempotent)."
        )
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
