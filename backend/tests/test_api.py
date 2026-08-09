"""Тесты Content API: status, courses, items, atlas, отсутствие абсолютных путей."""

from __future__ import annotations

import json

from app.services.content_sync import ContentSyncService


def test_api_content_status(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.get("/api/content/status")
    assert response.status_code == 200
    data = response.json()
    assert data["vault_files"] >= 12
    assert data["total_catalogued"] == 11
    assert data["published"] == 9  # course + 2 modules + 4 lessons + 2 cases
    assert data["by_type"]["concept"] == 2
    assert data["by_type"]["lesson"] == 4
    assert data["last_sync_at"] is not None
    assert data["errors"] == 0


def test_api_content_courses(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.get("/api/content/courses")
    assert response.status_code == 200
    courses = response.json()["courses"]
    assert len(courses) == 1
    course = courses[0]
    assert course["id"] == "course.classic-ml"
    assert course["module_count"] == 2
    assert course["lesson_count"] == 4
    assert course["practice_count"] == 2


def test_api_content_item(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.get("/api/content/items/lesson.classic-ml.one.one")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "lesson.classic-ml.one.one"
    assert data["path"] == "05 Курсы/Классический ML/Уроки/01 Урок 1.md"
    assert data["publish"] is True
    assert data["content_path"] == "10 Знания/ML/Concept A.md"
    relations = {link["relation"] for link in data["links"]["outgoing"]}
    assert "applied_in" in relations
    assert "prerequisite" in relations
    # нет абсолютных путей
    assert "/Users" not in json.dumps(data)


def test_api_content_item_not_found(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.get("/api/content/items/no.such.id")
    assert response.status_code == 404


def test_api_atlas_structure(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.get("/api/atlas")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) >= 11
    assert len(data["edges"]) > 0
    assert data["layout"]["mode"] == "deterministic"
    assert data["node_types"] == ["concept", "course", "lesson", "module", "practice"]
    assert "ml" in data["areas"]
    # маршрут курса
    route = data["routes"]["course.classic-ml"]
    assert route["modules"] == ["module.classic-ml.one", "module.classic-ml.two"]
    assert route["lessons"]["module.classic-ml.one"] == [
        "lesson.classic-ml.one.one",
        "lesson.classic-ml.one.two",
    ]
    assert route["lessons"]["module.classic-ml.two"] == [
        "lesson.classic-ml.two.one",
        "lesson.classic-ml.two.two",
    ]
    # узлы имеют координаты и backend-статус
    for node in data["nodes"]:
        assert "x" in node and "y" in node
        assert node["status"] == "not_started"


def test_api_atlas_excludes_algopath_release_areas(
    make_client, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    nodes = make_client().get("/api/atlas").json()["nodes"]
    assert all(node.get("area") not in {"algorithms", "python-algorithms"} for node in nodes)


def test_api_atlas_no_absolute_paths(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    data = client.get("/api/atlas").json()
    text = json.dumps(data, ensure_ascii=False)
    assert "/Users" not in text
    assert "kheichiev" not in text
    assert "/tmp" not in text
    # пути vault-относительные, но в atlas их вообще нет
    for node in data["nodes"]:
        assert "path" not in node


def test_api_atlas_deterministic(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    first = client.get("/api/atlas").json()
    second = client.get("/api/atlas").json()
    first_positions = {n["id"]: (n["x"], n["y"]) for n in first["nodes"]}
    second_positions = {n["id"]: (n["x"], n["y"]) for n in second["nodes"]}
    assert first_positions == second_positions


def test_api_roadmap_maps_each_lesson_once(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    data = make_client().get("/api/roadmap").json()
    assert [stage["id"] for stage in data["stages"]] == [
        "orientation",
        "understanding",
        "application",
    ]
    lesson_ids = [
        lesson["id"]
        for stage in data["stages"]
        for module in stage["modules"]
        for lesson in module["lessons"]
    ]
    assert sorted(lesson_ids) == [
        "lesson.classic-ml.one.one",
        "lesson.classic-ml.one.two",
        "lesson.classic-ml.two.one",
        "lesson.classic-ml.two.two",
    ]
    assert len(lesson_ids) == len(set(lesson_ids))
    assert data["total_lessons"] == 4


def test_api_health_and_system_still_work(make_client) -> None:
    client = make_client()
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/system/status").status_code == 200
