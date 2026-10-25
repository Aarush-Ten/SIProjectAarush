#!/usr/bin/env bash
set -eu

# Run from backend/. Expert contacts and AI quotas require durable storage.
# Catalog seeding must not reset expert records or security quotas.
python -m alembic upgrade head
python -m app.seed
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --no-access-log --no-proxy-headers
