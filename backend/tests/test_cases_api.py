"""Тесты Фазы 4: кейсы (mini-case, module-case, режимы, идемпотентность).

Используют fixture-vault (make_vault) и временную SQLite.
"""

from __future__ import annotations

from app.services.cases.registry import DEFAULT_CASE_REGISTRY
from app.services.content_sync import ContentSyncService

MINI_CASE = "case.classic-ml.tree-ensemble-choice"
MODULE_CASE = "case.classic-ml.churn-end-to-end"


def test_case_registry_has_two_cases() -> None:
    assert MINI_CASE in DEFAULT_CASE_REGISTRY.ids()
    assert MODULE_CASE in DEFAULT_CASE_REGISTRY.ids()


def test_list_cases(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/cases")
    assert response.status_code == 200
    data = response.json()
    ids = [case["id"] for case in data["cases"]]
    assert MINI_CASE in ids
    assert MODULE_CASE in ids
    # В spec нет правильных ответов (correct скрыт).
    for case in data["cases"]:
        for question in case["questions"]:
            assert "correct" not in question


def test_get_case_guided_has_hints(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get(f"/api/cases/{MINI_CASE}?mode=guided")
    assert response.status_code == 200
    spec = response.json()
    assert spec["mode"] == "guided"
    assert any(q.get("hint") for q in spec["questions"])


def test_get_case_standard_no_hints(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    spec = make_client().get(f"/api/cases/{MINI_CASE}?mode=standard").json()
    assert all("hint" not in q for q in spec["questions"])


def test_get_case_interview(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    spec = make_client().get(f"/api/cases/{MINI_CASE}?mode=interview").json()
    assert spec["mode"] == "interview"
    assert all("interview_prompt" in q for q in spec["questions"])


def test_case_not_found(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    assert make_client().get("/api/cases/case.nope").status_code == 404


def test_case_invalid_mode(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get(f"/api/cases/{MINI_CASE}?mode=evil")
    assert response.status_code == 422


def _correct_answers(spec: dict) -> dict:
    """Правильные ответы для мини-кейса (известны из registry)."""
    from app.services.cases.registry import DEFAULT_CASE_REGISTRY

    case = DEFAULT_CASE_REGISTRY.get(spec["id"])
    answers = {}
    for q in case.questions:
        if q.type in ("single", "select"):
            answers[q.id] = q.correct
        elif q.type == "multiple":
            answers[q.id] = list(q.correct)
        elif q.type == "numeric":
            answers[q.id] = q.correct
        elif q.type == "order":
            answers[q.id] = list(q.correct)
    return answers


def test_submit_mini_case_correct(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    spec = client.get(f"/api/cases/{MINI_CASE}?mode=standard").json()
    answers = _correct_answers(spec)
    response = client.post(
        f"/api/cases/{MINI_CASE}/submit", json={"mode": "standard", "answers": answers}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["passed"] is True
    assert result["total_score"] >= 0.99
    assert result["attempt_id"] is not None
    # Evidence создан по навыкам кейса.
    assert result["evidence"]
    assert any(e["skill_id"] == "ml.tree_ensembles" for e in result["evidence"])


def test_submit_mini_case_wrong(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    spec = client.get(f"/api/cases/{MINI_CASE}?mode=standard").json()
    answers = {q["id"]: None for q in spec["questions"]}
    response = client.post(
        f"/api/cases/{MINI_CASE}/submit", json={"mode": "standard", "answers": answers}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["passed"] is False
    assert result["total_score"] == 0.0
    # Каждый вопрос имеет объяснение.
    assert all("explanation" in q for q in result["question_results"])


def test_submit_case_unknown(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/cases/case.nope/submit", json={"mode": "standard", "answers": {}}
    )
    assert response.status_code == 404


def test_submit_case_invalid_mode(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        f"/api/cases/{MINI_CASE}/submit", json={"mode": "evil", "answers": {}}
    )
    assert response.status_code == 422


def test_submit_same_answers_no_duplicate_evidence(
    make_client, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    client = make_client()
    spec = client.get(f"/api/cases/{MINI_CASE}?mode=standard").json()
    answers = _correct_answers(spec)
    first = client.post(
        f"/api/cases/{MINI_CASE}/submit", json={"mode": "standard", "answers": answers}
    ).json()
    second = client.post(
        f"/api/cases/{MINI_CASE}/submit", json={"mode": "standard", "answers": answers}
    ).json()
    first_evidence = {e["skill_id"]: e["evidence_count"] for e in first["evidence"]}
    second_evidence = {e["skill_id"]: e["evidence_count"] for e in second["evidence"]}
    # Повторная отправка того же набора ответов не начисляет evidence повторно.
    assert first_evidence == second_evidence
    assert any(e["deduplicated"] for e in second["evidence"])


def test_attempts_history(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    spec = client.get(f"/api/cases/{MINI_CASE}?mode=standard").json()
    client.post(
        f"/api/cases/{MINI_CASE}/submit",
        json={"mode": "standard", "answers": _correct_answers(spec)},
    )
    response = client.get(f"/api/cases/{MINI_CASE}/attempts")
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == MINI_CASE
    assert len(data["attempts"]) >= 1
    assert data["attempts"][0]["mode"] == "standard"


def test_attempts_unknown_case(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    assert make_client().get("/api/cases/case.nope/attempts").status_code == 404


def test_module_case_evidence_stronger(make_client, sync_service: ContentSyncService) -> None:
    """Итоговый кейс создаёт evidence по 7 навыкам (политика case_module)."""
    sync_service.sync()
    client = make_client()
    spec = client.get(f"/api/cases/{MODULE_CASE}?mode=guided").json()
    answers = _correct_answers(spec)
    result = client.post(
        f"/api/cases/{MODULE_CASE}/submit", json={"mode": "guided", "answers": answers}
    ).json()
    assert result["passed"] is True
    skill_ids = {e["skill_id"] for e in result["evidence"]}
    assert "ml.tree_ensembles" in skill_ids
    assert "ml.data_leakage" in skill_ids
    assert "ml.metrics_threshold" in skill_ids
