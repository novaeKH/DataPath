"""База данных: SQLAlchemy engine, сессии, WAL для SQLite."""

from pathlib import Path

from app.core.config import Settings, get_settings
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import sessionmaker

_settings = get_settings()


def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
    """Включаем WAL и foreign keys для SQLite (см. docs/architecture.md)."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def _ensure_data_dir(settings: Settings) -> None:
    """Создаёт директорию для локальной SQLite-базы, если её нет."""
    url = settings.resolved_database_url
    if url.startswith("sqlite:///"):
        path = url.removeprefix("sqlite:///")
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)


def create_engine_for(settings: Settings) -> Engine:
    """Создаёт SQLAlchemy engine под конкретные настройки."""
    url = settings.resolved_database_url
    kwargs: dict = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    engine = create_engine(url, **kwargs)
    if url.startswith("sqlite"):
        event.listen(engine, "connect", _set_sqlite_pragma)
    return engine


def ensure_database_ready(settings: Settings | None = None) -> None:
    """Подготовка: создание директории БД. Вызывается при старте приложения."""
    _ensure_data_dir(settings or get_settings())


engine = create_engine_for(_settings)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """FastAPI dependency: сессия SQLAlchemy на время запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
