#!/usr/bin/env bash
set -eu

# Run from backend/. Only public curated catalog data is stored in SQLite.
# Recreate it on hosts with ephemeral disks before accepting requests.
python -m alembic upgrade head
python -m app.seed
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --no-access-log
