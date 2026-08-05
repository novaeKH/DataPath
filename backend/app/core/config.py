"""Конфигурация приложения через environment variables (pydantic-settings).

Все переменные имеют префикс `DATAPATH_` и читаются из `.env` в корне проекта
(или из переменных окружения, например в Docker Compose).
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[2] = backend/, parents[3] = корень репозитория
BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Настройки DataPath. Дефолты рассчитаны на локальный запуск."""

    model_config = SettingsConfigDict(
        env_prefix="DATAPATH_",
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
    )

    app_name: str = "DataPath"
    app_version: str = "0.1.0"
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    # Корень проекта: используется для резолва относительных путей.
    # По умолчанию определяется по расположению файла; в Docker задаётся /app.
    project_root: Path = PROJECT_ROOT

    # SQLite: относительный путь вида sqlite:///./data/datapath.db резолвится
    # от корня проекта, поэтому backend можно запускать из любой директории.
    database_url: str = "sqlite:///./data/datapath.db"

    # Канонический Obsidian vault (относительно корня проекта).
    vault_path: str = "content/vault"

    # Origins для CORS (локальный Vite dev server и Docker frontend).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # IANA timezone для границ «сегодня» в интервальном повторении (Фаза 5).
    # Алгоритм не зависит от timezone контейнера: только эта настройка.
    timezone: str = "Europe/Moscow"

    @property
    def resolved_project_root(self) -> Path:
        root = self.project_root
        return root if root.is_absolute() else PROJECT_ROOT / root

    @property
    def resolved_database_url(self) -> str:
        """Абсолютный SQLAlchemy URL для SQLite (иначе — как есть)."""
        url = self.database_url
        if url.startswith("sqlite:///./"):
            rel = url.removeprefix("sqlite:///./")
            return f"sqlite:///{self._resolve(rel)}"
        if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
            rel = url.removeprefix("sqlite:///")
            if rel == ":memory:":
                return url
            return f"sqlite:///{self._resolve(rel)}"
        return url

    @property
    def vault_dir(self) -> Path:
        """Абсолютный путь к content/vault. Клиенту НЕ возвращается."""
        path = Path(self.vault_path)
        return path if path.is_absolute() else self.resolved_project_root / path

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def _resolve(self, rel: str) -> Path:
        path = Path(rel)
        return path if path.is_absolute() else self.resolved_project_root / path


@lru_cache
def get_settings() -> Settings:
    """Кэшированный экземпляр настроек (FastAPI dependency)."""
    return Settings()
