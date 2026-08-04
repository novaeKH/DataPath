"""FastAPI entry point DataPath."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, system
from app.core.config import Settings, get_settings
from app.core.logging import setup_logging
from app.db.session import ensure_database_ready

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    setup_logging(settings.log_level)
    ensure_database_ready(settings)
    logger.info(
        "DataPath %s запущен (%s), vault: %s",
        settings.app_version,
        settings.environment,
        settings.vault_path,
    )
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    """Фабрика приложения; позволяет подменить настройки в тестах."""
    resolved = settings or get_settings()
    app = FastAPI(
        title=resolved.app_name,
        version=resolved.app_version,
        description="DataPath — учебная платформа DS (backend)",
        lifespan=lifespan,
    )
    app.state.settings = resolved

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(system.router, prefix="/api")
    return app


app = create_app()
