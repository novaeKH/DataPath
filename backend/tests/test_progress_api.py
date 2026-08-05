"""Тесты Фазы 4: Progress API, Today, Atlas states, интеграция.

Используют fixture-vault (make_vault) и временную SQLite.
"""

from __future__ import annotations

from app.services.content_sync import ContentSyncService

LESSON_ONE = "lesson.classic-ml.one.one"
LESSON_TWO = "lesson.classic-ml.one.two"
LESSON_THREE = "lesson.classic-ml.two.one"
LESSON_FOUR = "lesson.classic-ml.two.two"
SKILL = "ml.tree_ensembles"


# --- Progress API: сцены и уроки ---


def test_complete_scene_saves_position(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-02/complete",
        json={"scene_type": "markdown", "skill_id": SKILL},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["lesson_id"] == LESSON_ONE
    assert data["current_scene_id"] == "scene-02"
    assert data["completed_scenes"] == ["scene-02"]

    # Повторная отправка — идемпотентна.
    second = client.post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-02/complete",
        json={"scene_type": "markdown", "skill_id": SKILL},
    )
    assert second.status_code == 200
    assert second.json()["completed_scenes"] == ["scene-02"]


def test_complete_scene_unknown_lesson(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/progress/lessons/lesson.nope/scenes/scene-01/complete", json={}
    )
    assert response.status_code == 404


def test_complete_scene_rejects_path_scene_id(
    make_client, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    response = make_client().post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/%2Fetc%2Fpasswd/complete", json={}
    )
    # %2F декодируется в / — API должен отклонить (422), а не писать файл.
    assert response.status_code in (404, 422)


def test_lesson_progress_created_after_scene(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-01/complete", json={})
    response = client.get(f"/api/progress/lessons/{LESSON_ONE}")
    assert response.status_code == 200
    data = response.json()
    assert data["lesson_id"] == LESSON_ONE
    assert data["started_at"]
    assert data["completed_at"] is None


def test_lesson_progress_not_found(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/progress/lessons/lesson.nope")
    assert response.status_code == 404


def test_complete_lesson_updates_skill(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.post(f"/api/progress/lessons/{LESSON_ONE}/complete")
    assert response.status_code == 200
    data = response.json()
    assert data["lesson_id"] == LESSON_ONE
    assert data["completed_at"]
    assert any(skill["skill_id"] == SKILL for skill in data["skills"])

    skills = client.get("/api/progress/skills").json()["skills"]
    assert any(skill["skill_id"] == SKILL and skill["evidence_count"] >= 1 for skill in skills)


def test_complete_lesson_unknown(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post("/api/progress/lessons/lesson.nope/complete")
    assert response.status_code == 404


def test_skill_detail(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(f"/api/progress/lessons/{LESSON_ONE}/complete")
    response = client.get(f"/api/progress/skills/{SKILL}")
    assert response.status_code == 200
    data = response.json()
    assert data["skill_id"] == SKILL
    assert "axes" in data
    assert "recent_events" in data
    assert "levels" in data
    assert data["evidence_count"] >= 1


def test_skill_detail_unknown(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/progress/skills/ml.nope")
    assert response.status_code == 404


def test_summary_empty(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/progress/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["lessons_started"] == 0
    assert data["lessons_completed"] == 0
    assert data["skill_distribution"] == {}
    assert data["recommended_action"]["action"] in ("next_lesson", "explore")


def test_summary_after_activity(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-01/complete",
        json={"skill_id": SKILL},
    )
    data = client.get("/api/progress/summary").json()
    assert data["lessons_started"] == 1
    assert data["recent_events"]
    assert data["recommended_action"]["action"] == "continue_lesson"


# --- Labs ---


def test_record_lab_creates_attempt(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    response = client.post(
        "/api/progress/labs/decision-tree-split-lab/record",
        json={
            "lesson_id": LESSON_ONE,
            "parameters": {"max_depth": 3},
            "result_summary": {"train_auc": 0.85},
            "score": 0.9,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["lab_id"] == "decision-tree-split-lab"
    assert data["deduplicated"] is False
    assert data["evidence"]

    # Повторная отправка тех же параметров — без дубликата.
    second = client.post(
        "/api/progress/labs/decision-tree-split-lab/record",
        json={
            "lesson_id": LESSON_ONE,
            "parameters": {"max_depth": 3},
            "result_summary": {"train_auc": 0.85},
            "score": 0.9,
        },
    )
    assert second.status_code == 200
    assert second.json()["deduplicated"] is True


def test_record_lab_unknown_lab(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/progress/labs/lab.nope/record",
        json={"parameters": {}},
    )
    assert response.status_code == 404


def test_record_lab_invalid_score(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/progress/labs/decision-tree-split-lab/record",
        json={"parameters": {}, "score": 1.7},
    )
    assert response.status_code == 422


# --- Today ---


def test_today_empty_start(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/today")
    assert response.status_code == 200
    data = response.json()
    assert data["continue_lesson"] is None
    assert data["next_lesson"] is not None
    assert data["weak_skills"] == []
    assert data["recent_activity"] == []
    assert data["suggested_case"] is not None


def test_today_continue_lesson(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-03/complete",
        json={"skill_id": SKILL},
    )
    data = client.get("/api/today").json()
    assert data["continue_lesson"]["lesson_id"] == LESSON_ONE
    assert data["continue_lesson"]["current_scene_id"] == "scene-03"


def test_today_weak_skills_requires_evidence(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    # Один слабый сигнал — недостаточно evidence, weak не показываем.
    client.post(
        f"/api/progress/lessons/{LESSON_ONE}/scenes/scene-01/complete",
        json={"skill_id": SKILL},
    )
    data = client.get("/api/today").json()
    assert data["weak_skills"] == []


def test_today_weak_skills_after_enough_evidence(
    make_client, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    client = make_client()
    # Два провала → низкая оценка + повторяющиеся ошибки → weak.
    for i in range(2):
        client.post(
            "/api/progress/labs/decision-tree-split-lab/record",
            json={
                "lesson_id": LESSON_ONE,
                "parameters": {"attempt": i},
                "result_summary": {},
                "score": 0.1,
            },
        )
    data = client.get("/api/today").json()
    assert len(data["weak_skills"]) >= 1


# --- Atlas states ---


def test_atlas_not_started_without_activity(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    data = make_client().get("/api/atlas").json()
    node = next(n for n in data["nodes"] if n["id"] == LESSON_ONE)
    assert node["status"] == "not_started"


def test_atlas_lesson_state_after_activity(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(f"/api/progress/lessons/{LESSON_ONE}/complete")
    data = client.get("/api/atlas").json()
    node = next(n for n in data["nodes"] if n["id"] == LESSON_ONE)
    assert node["status"] in ("exploring", "developing", "strong")


def test_atlas_concept_state_from_lesson(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    client.post(f"/api/progress/lessons/{LESSON_ONE}/complete")
    data = client.get("/api/atlas").json()
    # Concept A связан с уроком 1 (content_path) → его состояние не пустое.
    concept = next((n for n in data["nodes"] if n["id"] == "concept.ml.a"), None)
    if concept is not None:
        assert concept["status"] in ("exploring", "developing", "strong", "needs_attention")
