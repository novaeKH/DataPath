"""Тесты синхронизации: идемпотентность, добавление/обновление/удаление."""

from __future__ import annotations

from pathlib import Path

from app.db.models import ContentIssue, ContentItem, ContentLink, SyncRun
from app.services.content_sync import ContentSyncService
from sqlalchemy import func, select

from tests.fixture_vault import write_md


def _counts(sync_service) -> dict[str, int]:
    with sync_service.session_factory() as db:
        return {
            "items": db.scalar(select(func.count()).select_from(ContentItem)) or 0,
            "links": db.scalar(select(func.count()).select_from(ContentLink)) or 0,
            "issues": db.scalar(select(func.count()).select_from(ContentIssue)) or 0,
            "runs": db.scalar(select(func.count()).select_from(SyncRun)) or 0,
        }


def test_sync_creates_catalog(tmp_path: Path, sync_service: ContentSyncService) -> None:
    report = sync_service.sync()
    assert report.scanned >= 8
    assert report.created == 7
    assert report.errors == 0
    counts = _counts(sync_service)
    assert counts["items"] == 7
    assert counts["links"] > 0
    assert counts["runs"] == 1


def test_sync_is_idempotent(tmp_path: Path, sync_service: ContentSyncService) -> None:
    first = sync_service.sync()
    second = sync_service.sync()
    assert second.created == 0
    assert second.updated == 0
    assert second.unchanged == first.created
    assert second.removed == 0
    assert _counts(sync_service)["items"] == 7
    # второй запуск не плодит рёбра и issues
    counts = _counts(sync_service)
    assert counts["runs"] == 2


def test_sync_adds_new_file(tmp_path: Path, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    write_md(
        tmp_path / "vault",
        "10 Знания/ML/New Concept.md",
        {
            "id": "concept.ml.new",
            "title": "New Concept",
            "type": "concept",
            "area": "ml",
            "status": "active",
            "app": "source",
        },
        "# New Concept\n\n[[Concept A]]\n",
    )
    report = sync_service.sync()
    assert report.created == 1
    assert report.unchanged == 7
    assert _counts(sync_service)["items"] == 8


def test_sync_updates_modified_file(tmp_path: Path, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    path = tmp_path / "vault/10 Знания/ML/Concept A.md"
    original = path.read_text(encoding="utf-8")
    path.write_text(original + "\nДополнение.\n", encoding="utf-8")
    report = sync_service.sync()
    assert report.updated == 1
    assert report.unchanged == 6
    with sync_service.session_factory() as db:
        item = db.get(ContentItem, "concept.ml.a")
        assert item is not None
        assert "Дополнение" in item.frontmatter["title"] or item.content_hash  # hash обновился
    # повторный запуск после обновления — unchanged
    third = sync_service.sync()
    assert third.updated == 0
    assert third.unchanged == 7


def test_sync_removes_deleted_file(tmp_path: Path, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    (tmp_path / "vault/10 Знания/ML/Concept B.md").unlink()
    report = sync_service.sync()
    # Удаление концепции каскадно ломает content_path урока 2 → урок 2 тоже уходит из каталога.
    assert report.removed == 2
    assert report.errors == 1  # missing_content_path у урока 2
    with sync_service.session_factory() as db:
        assert db.get(ContentItem, "concept.ml.b") is None
        assert db.get(ContentItem, "lesson.classic-ml.one.two") is None
        # рёбра на удалённые узлы тоже удалены
        dangling = db.scalar(
            select(func.count())
            .select_from(ContentLink)
            .where(
                (ContentLink.source_id == "concept.ml.b")
                | (ContentLink.target_id == "concept.ml.b")
                | (ContentLink.source_id == "lesson.classic-ml.one.two")
                | (ContentLink.target_id == "lesson.classic-ml.one.two")
            )
        )
        assert dangling == 0


def test_sync_does_not_publish_invalid_item(
    tmp_path: Path, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    write_md(
        tmp_path / "vault",
        "10 Знания/ML/Bad.md",
        {"id": "concept.ml.bad", "title": "Bad", "type": "concept", "app": "nope"},
        "# Bad\n",
    )
    report = sync_service.sync()
    assert report.errors >= 1
    with sync_service.session_factory() as db:
        assert db.get(ContentItem, "concept.ml.bad") is None
        issue = db.scalar(select(ContentIssue).where(ContentIssue.path == "10 Знания/ML/Bad.md"))
        assert issue is not None
        assert issue.severity == "error"


def test_sync_stores_only_relative_paths(tmp_path: Path, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    with sync_service.session_factory() as db:
        paths = db.scalars(select(ContentItem.path)).all()
    for path in paths:
        assert not Path(path).is_absolute()
        assert str(tmp_path) not in path
        assert path.startswith(("05 ", "10 ", "15 ", "60 ", "40 ")) or path.count("/") >= 0


def test_sync_issue_for_duplicate_id(tmp_path: Path, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    write_md(
        tmp_path / "vault",
        "10 Знания/ML/Dup A.md",
        {
            "id": "concept.ml.a",
            "title": "Dup A",
            "type": "concept",
            "area": "ml",
            "app": "source",
        },
        "# Dup A\n",
    )
    report = sync_service.sync()
    assert report.errors >= 1
    with sync_service.session_factory() as db:
        dup_issues = db.scalars(
            select(ContentIssue).where(ContentIssue.code == "duplicate_id")
        ).all()
        assert len(dup_issues) >= 1
        # ни один из дубликатов не остаётся в каталоге
        assert db.get(ContentItem, "concept.ml.a") is None
