#!/bin/sh
set -eu

uv run alembic upgrade head
uv run python -m app.cli.content sync
exec uv run python -m uvicorn app.main:app --host "${DATAPATH_HOST:-0.0.0.0}" --port "${DATAPATH_PORT:-8000}"
