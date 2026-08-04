"""Общие фикстуры для тестов.

Тесты используют временный vault и отдельную SQLite-базу, чтобы
не трогать реальные data/ и content/vault.
"""

from collections.abc import Callable

import pytest
from app.api.system import get_system_service
from app.core.config import Settings
from app.main import create_app
from app.services.system import SystemStatusService
from fastapi.testclient import TestClient
from sqlalchemy import create_engine


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
def make_client(
    test_settings: Settings,
) -> Callable[[], TestClient]:
    """Фабрика TestClient с подменённым сервисом статуса."""

    def _make() -> TestClient:
        engine = create_engine(
            test_settings.resolved_database_url,
            connect_args={"check_same_thread": False},
        )
        app = create_app(test_settings)
        app.dependency_overrides[get_system_service] = lambda: SystemStatusService(
            settings=test_settings, engine=engine
        )
        return TestClient(app)

    return _make
