# DataPath backend — production image (Фаза 1)
# Контекст сборки: backend/ (см. compose.yaml build.context)

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    DATAPATH_PROJECT_ROOT=/app

WORKDIR /app

# Сначала зависимости — используем кэш слоёв Docker.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Затем код приложения.
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

# python -m uvicorn — надёжный sys.path из любой директории.
CMD ["./entrypoint.sh"]
