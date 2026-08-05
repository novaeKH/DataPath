"""Общие фикстуры для тестов.

Тесты используют временный vault и отдельную SQLite-базу, чтобы
не трогать реальные data/ и content/vault.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import pytest
from app.api.cases import get_case_service
from app.api.content import get_catalog_service, get_lesson_service
from app.api.labs import get_lab_registry
from app.api.progress import get_progress_service
from app.api.reviews import get_review_answer_service, get_review_queue_service
from app.api.system import get_system_service
from app.api.today import (
    get_progress_service as get_today_progress_service,
)
from app.api.today import (
    get_review_queue_service as get_today_review_queue_service,
)
from app.core.config import Settings
from app.db.base import Base
from app.main import create_app
from app.services.cases.registry import DEFAULT_CASE_REGISTRY
from app.services.cases.service import CaseService
from app.services.content_catalog import ContentCatalogService
from app.services.content_sync import ContentSyncService
from app.services.labs.decision_tree_split import DecisionTreeSplitLab
from app.services.labs.ensemble_comparison import EnsembleComparisonLab
from app.services.labs.registry import LabRegistry
from app.services.labs.tree_overfitting import TreeOverfittingLab
from app.services.lesson_content import LessonContentService
from app.services.progress import ProgressService
from app.services.reviews.answer import ReviewAnswerService
from app.services.reviews.queue import ReviewQueueService
from app.services.reviews.templates import get_default_registry as get_default_review_registry
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
def lab_registry() -> LabRegistry:
    """Registry лабораторий, привязанный к fixture-урокам."""
    return LabRegistry(
        [
            DecisionTreeSplitLab(lesson_ids=["lesson.classic-ml.one.one"]),
            TreeOverfittingLab(lesson_ids=["lesson.classic-ml.one.one"]),
            EnsembleComparisonLab(lesson_ids=["lesson.classic-ml.one.two"]),
        ]
    )


@pytest.fixture
def lesson_service(
    tmp_path, fixture_vault: Path, db_session_factory, lab_registry: LabRegistry
) -> LessonContentService:
    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        vault_path=str(fixture_vault),
    )
    return LessonContentService(
        settings=settings, session_factory=db_session_factory, registry=lab_registry
    )


@pytest.fixture
def make_client(
    tmp_path,
    fixture_vault: Path,
    db_session_factory,
    lab_registry: LabRegistry,
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
        app.dependency_overrides[get_lesson_service] = lambda: LessonContentService(
            settings=settings, session_factory=db_session_factory, registry=lab_registry
        )
        app.dependency_overrides[get_lab_registry] = lambda: lab_registry
        app.dependency_overrides[get_progress_service] = lambda: ProgressService(
            settings=settings, session_factory=db_session_factory, registry=lab_registry
        )
        app.dependency_overrides[get_today_progress_service] = lambda: ProgressService(
            settings=settings, session_factory=db_session_factory, registry=lab_registry
        )
        app.dependency_overrides[get_case_service] = lambda: CaseService(
            settings=settings, session_factory=db_session_factory, registry=DEFAULT_CASE_REGISTRY
        )
        app.dependency_overrides[get_review_queue_service] = lambda: ReviewQueueService(
            settings=settings,
            session_factory=db_session_factory,
            registry=get_default_review_registry(),
        )
        app.dependency_overrides[get_review_answer_service] = lambda: ReviewAnswerService(
            settings=settings,
            session_factory=db_session_factory,
            registry=get_default_review_registry(),
        )
        app.dependency_overrides[get_today_review_queue_service] = lambda: ReviewQueueService(
            settings=settings,
            session_factory=db_session_factory,
            registry=get_default_review_registry(),
        )
        return TestClient(app)

    return _make
