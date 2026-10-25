"""Export the backend truth without running a server or initializing the database."""

import argparse
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the checked-in schema is stale")
    args = parser.parse_args()
    # Settings resolve .env relative to the backend's documented working directory.
    os.chdir(ROOT / "backend")
    from app.main import app

    target = ROOT / "docs" / "openapi.json"
    content = json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != content:
            raise SystemExit("OpenAPI is stale: run backend Python with scripts/export_openapi.py, then npm run types:api.")
        print("OpenAPI snapshot is current.")
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8", newline="\n")
        print(f"Exported {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
