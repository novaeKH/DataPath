"""Тесты лабораторий: API, детерминизм, валидация границ параметров."""

from __future__ import annotations

from app.services.content_sync import ContentSyncService
from app.services.labs.registry import LabRegistry


def _strip_time(value):
    """Убирает недетерминированные поля (time_ms) из результата."""
    if isinstance(value, dict):
        return {k: _strip_time(v) for k, v in value.items() if k != "time_ms"}
    if isinstance(value, list):
        return [_strip_time(v) for v in value]
    return value


def test_lab_spec(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().get("/api/labs/decision-tree-split-lab")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "decision-tree-split-lab"
    assert data["title"]
    assert data["description"]
    assert data["lesson_ids"] == ["lesson.classic-ml.one.one"]
    param_names = [p["name"] for p in data["parameters"]]
    assert param_names == ["feature", "threshold", "criterion"]
    threshold = data["parameters"][1]
    assert threshold["min"] == -3.0 and threshold["max"] == 3.0
    assert data["defaults"]["criterion"] == "gini"
    # initial_result для первого отображения
    assert "impurity" in data["initial_result"]
    assert "gain" in data["initial_result"]


def test_lab_run_split(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/labs/decision-tree-split-lab/run",
        json={"parameters": {"feature": "x1", "threshold": 0.5, "criterion": "gini"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["split"]["feature"] == "x1"
    assert data["split"]["threshold"] == 0.5
    total = data["split"]["left_count"] + data["split"]["right_count"]
    assert total == len(data["dataset"]["points"])
    assert 0.0 <= data["gain"] <= 0.5
    assert data["impurity"]["parent"] > 0
    assert data["explanation"]


def test_lab_run_overfitting(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/labs/tree-depth-overfitting-lab/run",
        json={"parameters": {"max_depth": 6, "min_samples_leaf": 2}},
    )
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["metrics"]["train_accuracy"] <= 1.0
    assert 0.0 <= data["metrics"]["val_accuracy"] <= 1.0
    assert data["metrics"]["depth"] <= 6
    assert len(data["depth_curve"]["depths"]) == 12
    assert len(data["depth_curve"]["train"]) == 12
    assert len(data["boundary"]["preds"]) == 36 * 36
    assert data["interpretation"]["label"] in {"underfit", "good", "overfit"}


def test_lab_run_ensemble(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    response = make_client().post(
        "/api/labs/ensemble-comparison-lab/run",
        json={"parameters": {"n_estimators": 30, "max_depth": 4, "learning_rate": 0.1}},
    )
    assert response.status_code == 200
    data = response.json()
    keys = [m["key"] for m in data["models"]]
    assert "tree" in keys and "forest" in keys and "boosting" in keys
    for model in data["models"]:
        assert 0.0 <= model["val_accuracy"] <= 1.0
    assert "explanation" in data
    assert data["dataset"]["catboost_available"] in {True, False}
    # decision boundary для каждой модели
    assert set(keys) <= set(data["boundary"]["grids"].keys())
    assert len(data["boundary"]["grids"][keys[0]]) == 30 * 30


def test_lab_determinism(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    for lab_id in (
        "decision-tree-split-lab",
        "tree-depth-overfitting-lab",
        "ensemble-comparison-lab",
    ):
        params = {"parameters": {}}
        first = _strip_time(client.post(f"/api/labs/{lab_id}/run", json=params).json())
        second = _strip_time(client.post(f"/api/labs/{lab_id}/run", json=params).json())
        assert first == second, f"Лаборатория {lab_id} не детерминирована"


def test_lab_validation_bounds(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    cases = [
        ("decision-tree-split-lab", {"threshold": 99.0}),
        ("decision-tree-split-lab", {"criterion": "bad"}),
        ("decision-tree-split-lab", {"feature": "x3"}),
        ("tree-depth-overfitting-lab", {"max_depth": 0}),
        ("tree-depth-overfitting-lab", {"min_samples_leaf": 100}),
        ("ensemble-comparison-lab", {"n_estimators": 2}),
        ("ensemble-comparison-lab", {"learning_rate": 2.0}),
        ("ensemble-comparison-lab", {"max_depth": 99}),
    ]
    for lab_id, params in cases:
        response = client.post(f"/api/labs/{lab_id}/run", json={"parameters": params})
        assert response.status_code == 422, f"{lab_id} {params} → {response.status_code}"
        body = response.json()
        assert "errors" in body["detail"] or "detail" in body


def test_lab_unknown_id(make_client, sync_service: ContentSyncService) -> None:
    sync_service.sync()
    client = make_client()
    assert client.get("/api/labs/no-such-lab").status_code == 404
    assert client.post("/api/labs/no-such-lab/run", json={"parameters": {}}).status_code == 404


def test_lab_registry_lookup(lab_registry: LabRegistry) -> None:
    assert lab_registry.get("decision-tree-split-lab") is not None
    assert lab_registry.get("no-such-lab") is None
    lesson_one_labs = {lab.id for lab in lab_registry.labs_for_lesson("lesson.classic-ml.one.one")}
    assert lesson_one_labs == {"decision-tree-split-lab", "tree-depth-overfitting-lab"}
    lesson_two_labs = {lab.id for lab in lab_registry.labs_for_lesson("lesson.classic-ml.one.two")}
    assert lesson_two_labs == {"ensemble-comparison-lab"}
