"""Тесты Фазы 3: course detail, lesson detail, сцены, безопасность Markdown."""

from __future__ import annotations

import json

from app.services.content_sync import ContentSyncService
from app.services.lesson_content import LessonContentService

LESSON_ONE = "lesson.classic-ml.one.one"
LESSON_TWO = "lesson.classic-ml.one.two"
LESSON_THREE = "lesson.classic-ml.two.one"
LESSON_FOUR = "lesson.classic-ml.two.two"


# --- Course detail ---


def test_course_detail_modules_order(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/content/courses/course.classic-ml")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "course.classic-ml"
    assert data["title"] == "Классический ML"
    module_ids = [m["id"] for m in data["modules"]]
    assert module_ids == ["module.classic-ml.one", "module.classic-ml.two"]
    # уроки в правильном порядке внутри модуля
    first_module = data["modules"][0]
    assert [lesson["id"] for lesson in first_module["lessons"]] == [LESSON_ONE, LESSON_TWO]
    assert [lesson["id"] for lesson in data["modules"][1]["lessons"]] == [
        LESSON_THREE,
        LESSON_FOUR,
    ]
    # кейсы
    assert [c["id"] for c in data["cases"]] == ["case.classic-ml.one", "case.classic-ml.two"]
    assert data["first_lesson_id"] == LESSON_ONE
    assert data["last_lesson_id"] == LESSON_FOUR
    # лаборатории привязаны к урокам через registry
    assert "decision-tree-split-lab" in first_module["lessons"][0]["laboratory_ids"]
    assert "tree-depth-overfitting-lab" in first_module["lessons"][0]["laboratory_ids"]
    assert "ensemble-comparison-lab" in first_module["lessons"][1]["laboratory_ids"]


def test_course_detail_not_found(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    assert make_client().get("/api/content/courses/no.such.course").status_code == 404


# --- Lesson detail ---


def test_lesson_detail_basic(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get(f"/api/content/lessons/{LESSON_ONE}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == LESSON_ONE
    assert data["title"] == "Урок 1"
    assert data["module"] == {"id": "module.classic-ml.one", "title": "Модуль 1", "order": 1}
    assert data["course"] == {"id": "course.classic-ml", "title": "Классический ML"}
    assert data["estimated_minutes"] == 30
    assert data["difficulty"] == "core"
    assert data["skills"] == ["ml.tree_ensembles"]
    assert data["scenes"]
    assert data["laboratory_ids"] == [
        "decision-tree-split-lab",
        "tree-depth-overfitting-lab",
    ]
    # использованные материалы: source-заметка + связи
    material_ids = [m["id"] for m in data["materials"]]
    assert "concept.ml.a" in material_ids


def test_lesson_prev_next(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()

    first = client.get(f"/api/content/lessons/{LESSON_ONE}").json()
    assert first["previous_lesson_id"] is None
    assert first["next_lesson_id"] == LESSON_TWO

    # переход между модулями: последний урок модуля 1 → первый урок модуля 2
    second = client.get(f"/api/content/lessons/{LESSON_TWO}").json()
    assert second["previous_lesson_id"] == LESSON_ONE
    assert second["next_lesson_id"] == LESSON_THREE

    last = client.get(f"/api/content/lessons/{LESSON_FOUR}").json()
    assert last["previous_lesson_id"] == LESSON_THREE
    assert last["next_lesson_id"] is None


def test_lesson_not_found(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/content/lessons/no.such.lesson")
    assert response.status_code == 404


# --- Сцены ---


def test_scene_normalization(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    data = make_client().get(f"/api/content/lessons/{LESSON_ONE}").json()
    scenes = data["scenes"]
    types = [s["type"] for s in scenes]
    # все сцены имеют стабильные id
    assert all(s["id"] for s in scenes)
    assert scenes[0]["id"] == "scene-01"
    # hook из datapath + summary callout урока
    assert scenes[0]["type"] == "markdown"
    assert scenes[0]["title"] == "Зачем это нужно"
    assert "summary" in scenes[0]["markdown"]
    # markdown, formula, code, callout из source-заметки
    assert "markdown" in types
    assert "formula" in types
    assert "code" in types
    assert "callout" in types
    # checkpoint из «Проверка понимания»
    assert "checkpoint" in types
    # interactive_lab из registry
    assert "interactive_lab" in types
    lab_scenes = [s for s in scenes if s["type"] == "interactive_lab"]
    assert {s["lab_id"] for s in lab_scenes} == {
        "decision-tree-split-lab",
        "tree-depth-overfitting-lab",
    }


def test_scene_content_blocks(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    data = make_client().get(f"/api/content/lessons/{LESSON_ONE}").json()
    scenes = data["scenes"]
    formula = next(s for s in scenes if s["type"] == "formula")
    assert "Gain" in formula["formula"]
    code = next(s for s in scenes if s["type"] == "code")
    assert code["language"] == "python"
    assert "def split" in code["code"]
    callout = next(s for s in scenes if s["type"] == "callout")
    assert callout["callout_type"] == "warning"
    checkpoints = [s for s in scenes if s["type"] == "checkpoint"]
    assert len(checkpoints) == 2


def test_scene_fallback_without_datapath(make_client, sync_service: ContentSyncService) -> None:
    """Урок без datapath получает детерминированные сцены из source-заметки."""
    sync_service.sync()
    data = make_client().get(f"/api/content/lessons/{LESSON_TWO}").json()
    scenes = data["scenes"]
    types = [s["type"] for s in scenes]
    assert "markdown" in types
    # в Concept B нет формул/кода — сцены markdown + checkpoint
    assert "checkpoint" in types
    checkpoint = next(s for s in scenes if s["type"] == "checkpoint")
    assert "bagging" in checkpoint["question"]


# --- Безопасность ---


def test_no_absolute_paths(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    for path in (
        "/api/content/courses/course.classic-ml",
        f"/api/content/lessons/{LESSON_ONE}",
    ):
        text = json.dumps(client.get(path).json(), ensure_ascii=False)
        assert "/Users" not in text
        assert "kheichiev" not in text
        assert "/tmp" not in text


def test_lesson_detail_no_frontmatter(make_client, sync_service: ContentSyncService) -> None:
    """Клиенту не отдаётся сырой frontmatter."""
    sync_service.sync()
    text = json.dumps(
        make_client().get(f"/api/content/lessons/{LESSON_ONE}").json(),
        ensure_ascii=False,
    )
    assert "schema_version" not in text
    assert "content_path" not in text


def test_path_traversal_blocked(lesson_service: LessonContentService) -> None:
    assert lesson_service._resolve_vault_file("../secret.md") is None
    assert lesson_service._resolve_vault_file("../../etc/passwd") is None
    assert lesson_service._resolve_vault_file("/etc/passwd") is None
    assert lesson_service._resolve_vault_file("10 Знания/ML/Concept A.md") is not None
    assert lesson_service._resolve_vault_file("10 Знания/ML/Concept A.png") is None


def test_lesson_with_malicious_content_path_not_read(
    make_client, sync_service: ContentSyncService, db_session_factory
) -> None:
    """Урок с content_path вне vault не читает файлы за пределами vault."""
    from app.db.models import ContentItem

    sync_service.sync()
    with db_session_factory() as db:
        item = ContentItem(
            id="lesson.classic-ml.malicious",
            path="05 Курсы/Классический ML/Уроки/99 Злой.md",
            type="lesson",
            title="Злой урок",
            slug="zlyy-urok",
            app="include",
            publish=True,
            content_path="../../../../etc/passwd",
            content_hash="x",
            file_mtime="2026-01-01T00:00:00",
            synced_at="2026-01-01T00:00:00",
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
            frontmatter={},
        )
        db.add(item)
        db.commit()

    response = make_client().get("/api/content/lessons/lesson.classic-ml.malicious")
    assert response.status_code == 200
    data = response.json()
    # source не прочитан: нет содержимого /etc/passwd в ответе
    text = json.dumps(data, ensure_ascii=False)
    assert "root:" not in text
    assert "daemon" not in text
