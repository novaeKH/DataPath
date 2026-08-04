"""Общие фикстуры для тестов.

Тесты используют временный vault и отдельную SQLite-базу, чтобы
не трогать реальные data/ и content/vault.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import pytest
from app.api.content import get_catalog_service
from app.api.system import get_system_service
from app.core.config import Settings
from app.db.base import Base
from app.main import create_app
from app.services.content_catalog import ContentCatalogService
from app.services.content_sync import ContentSyncService
from app.services.system import SystemStatusService
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.fixture_vault import make_vault


@pytest.fixture
def test_settings(tmp_path) -> Settings:
    """Настройки с временным vault и временной SQLite."""
    vault = tmp_path / "vault"
    vault.mkdir()
    return Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        vault_path=str(vault),
    )


@pytest.fixture
def fixture_vault(tmp_path) -> Path:
    """Реалистичный fixture-vault для парсера/синка/API."""
    return make_vault(tmp_path)


@pytest.fixture
def db_session_factory(tmp_path):
    """SQLAlchemy sessionmaker на временной SQLite с созданной схемой."""
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return factory


@pytest.fixture
def sync_service(tmp_path, fixture_vault: Path, db_session_factory) -> ContentSyncService:
    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        vault_path=str(fixture_vault),
    )
    return ContentSyncService(settings=settings, session_factory=db_session_factory)


@pytest.fixture
def catalog_service(tmp_path, fixture_vault: Path, db_session_factory) -> ContentCatalogService:
    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        vault_path=str(fixture_vault),
    )
    return ContentCatalogService(settings=settings, session_factory=db_session_factory)


@pytest.fixture
def make_client(
    tmp_path,
    fixture_vault: Path,
    db_session_factory,
) -> Callable[[], TestClient]:
    """Фабрика TestClient с подменёнными сервисами на временной БД."""

    def _make() -> TestClient:
        settings = Settings(
            environment="test",
            database_url=f"sqlite:///{tmp_path / 'test.db'}",
            vault_path=str(fixture_vault),
        )
        app = create_app(settings)
        app.dependency_overrides[get_system_service] = lambda: SystemStatusService(
            settings=settings, engine=db_session_factory.kw["bind"]
        )
        app.dependency_overrides[get_catalog_service] = lambda: ContentCatalogService(
            settings=settings, session_factory=db_session_factory
        )
        return TestClient(app)

    return _make
