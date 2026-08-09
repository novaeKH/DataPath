from app.services.content_sync import ContentSyncService


def test_backup_roundtrip_preserves_learning_state(
    make_client, sync_service: ContentSyncService
) -> None:
    sync_service.sync()
    client = make_client()
    client.post(
        "/api/progress/lessons/lesson.classic-ml.one.one/scenes/hook-0/complete",
        json={"scene_type": "markdown", "outcome": "completed"},
    )

    exported = client.get("/api/system/backup")
    assert exported.status_code == 200
    payload = exported.json()
    assert payload["format"] == "datapath-learning-state"
    assert payload["checksum"]
    assert len(payload["tables"]["lesson_progress"]) == 1

    restored = client.post("/api/system/restore", json=payload)
    assert restored.status_code == 200
    assert restored.json()["rows"]["lesson_progress"] == 1


def test_backup_rejects_tampering(make_client) -> None:
    client = make_client()
    payload = client.get("/api/system/backup").json()
    payload["tables"]["lesson_progress"].append({"lesson_id": "tampered"})
    response = client.post("/api/system/restore", json=payload)
    assert response.status_code == 422
    assert "Checksum" in response.json()["detail"]
