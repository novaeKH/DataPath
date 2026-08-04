"""Сервис технического статуса системы.

Только проверки доступности и подсчёт файлов — без чтения содержимого vault.
"""

import logging
from pathlib import Path

from sqlalchemy import Engine, text

from app.core.config import Settings, get_settings
from app.db.session import engine as default_engine

logger = logging.getLogger(__name__)

# Служебные директории Obsidian, которые не считаются учебным контентом.
_EXCLUDED_DIRS = {".obsidian", "_meta", ".trash"}


class SystemStatusService:
    """Собирает ответ для GET /api/system/status."""

    def __init__(self, settings: Settings | None = None, engine: Engine | None = None) -> None:
        self.settings = settings or get_settings()
        self._engine = engine or default_engine

    def get_status(self) -> dict:
        vault = self.settings.vault_dir
        return {
            "status": "ok",
            "version": self.settings.app_version,
            "environment": self.settings.environment,
            "database": {"available": self._database_available()},
            "vault": {
                "exists": vault.is_dir(),
                "markdown_files": self.count_markdown_files(vault),
            },
            "ollama": "not_configured",
            "chromadb": "not_configured",
        }

    def _database_available(self) -> bool:
        """Проверяем SQLite простым SELECT 1."""
        try:
            with self._engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except Exception:
            logger.exception("SQLite недоступна")
            return False

    @staticmethod
    def count_markdown_files(vault_dir: Path) -> int:
        """Количество .md файлов в vault без чтения их содержимого.

        Служебные директории Obsidian (.obsidian, _meta, .trash) не учитываются.
        """
        if not vault_dir.is_dir():
            return 0
        return sum(
            1
            for path in vault_dir.rglob("*.md")
            if not any(part in _EXCLUDED_DIRS for part in path.parts)
        )
