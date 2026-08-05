"""Тесты Фазы 4: Alembic-миграция новых таблиц на чистой БД."""

from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def _make_alembic_config(db_path: Path) -> Config:
    backend_dir = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend_dir / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    return cfg


def test_alembic_upgrade_creates_progress_tables(tmp_path) -> None:
    db_path = tmp_path / "migrated.db"
    cfg = _make_alembic_config(db_path)
    command.upgrade(cfg, "head")

    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected = {
        "learning_events",
        "skill_assessments",
        "lesson_progress",
        "lab_attempts",
        "case_attempts",
        "content_items",
        "content_links",
        "content_issues",
        "sync_runs",
    }
    assert expected <= tables

    # Ключевые колонки.
    event_columns = {col["name"] for col in inspector.get_columns("learning_events")}
    assert {
        "id",
        "event_type",
        "source_type",
        "source_id",
        "skill_id",
        "knowledge_axis",
        "outcome",
        "score",
        "confidence",
        "hints_used",
        "attempts",
        "error_code",
        "metadata",
        "dedup_key",
        "created_at",
    } <= event_columns

    assessment_columns = {col["name"] for col in inspector.get_columns("skill_assessments")}
    assert {"skill_id", "axes", "confidence", "evidence_count", "state"} <= assessment_columns

    lesson_columns = {col["name"] for col in inspector.get_columns("lesson_progress")}
    assert {
        "lesson_id",
        "current_scene_id",
        "completed_scenes",
        "started_at",
        "completed_at",
        "updated_at",
    } <= lesson_columns

    lab_columns = {col["name"] for col in inspector.get_columns("lab_attempts")}
    assert {
        "id",
        "lab_id",
        "lesson_id",
        "parameters",
        "result_summary",
        "score",
        "evidence",
        "dedup_key",
        "created_at",
    } <= lab_columns

    case_columns = {col["name"] for col in inspector.get_columns("case_attempts")}
    assert {"id", "case_id", "mode", "answers", "result", "completed_at"} <= case_columns
    engine.dispose()


def test_alembic_downgrade_drops_progress_tables(tmp_path) -> None:
    db_path = tmp_path / "migrated.db"
    cfg = _make_alembic_config(db_path)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "a1b2c3d4e5f6")

    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    assert "learning_events" not in tables
    assert "skill_assessments" not in tables
    assert "lesson_progress" not in tables
    assert "lab_attempts" not in tables
    assert "case_attempts" not in tables
    # Контентные таблицы остаются.
    assert "content_items" in tables
    engine.dispose()
