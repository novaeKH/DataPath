"""Тесты GET /api/system/status и сервиса SystemStatusService."""

from pathlib import Path

from app.core.config import Settings
from app.services.system import SystemStatusService
from fastapi.testclient import TestClient


def _fill_vault(vault: Path) -> None:
    """Создаёт файлы: контент + служебные (не считаются)."""
    (vault / "05 Курсы").mkdir()
    (vault / "05 Курсы" / "course.md").write_text("# Course", encoding="utf-8")
    (vault / "10 Знания").mkdir()
    (vault / "10 Знания" / "concept.md").write_text("# Concept", encoding="utf-8")
    (vault / ".obsidian").mkdir()
    (vault / ".obsidian" / "workspace.json").write_text("{}", encoding="utf-8")
    (vault / "_meta").mkdir()
    (vault / "_meta" / "internal.md").write_text("# Meta", encoding="utf-8")
    (vault / ".trash").mkdir()
    (vault / ".trash" / "deleted.md").write_text("# Deleted", encoding="utf-8")


def test_system_status_shape(make_client, test_settings):
    _fill_vault(test_settings.vault_dir)
    client: TestClient = make_client()
    response = client.get("/api/system/status")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["environment"] == "test"
    assert body["database"] == {"available": True}
    assert body["vault"]["exists"] is True
    assert body["vault"]["markdown_files"] == 2
    assert body["ollama"] == "not_configured"
    assert body["chromadb"] == "not_configured"


def test_system_status_no_absolute_paths(make_client, test_settings):
    """Клиенту не должны утекать абсолютные пути файловой системы."""
    _fill_vault(test_settings.vault_dir)
    client: TestClient = make_client()
    response = client.get("/api/system/status")

    assert response.status_code == 200
    text = response.text
    assert str(test_settings.vault_dir) not in text
    assert "/Users/" not in text
    assert "content/vault" not in text


def test_system_status_vault_missing(tmp_path):
    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        vault_path=str(tmp_path / "no-such-vault"),
    )
    service = SystemStatusService(settings=settings)
    status = service.get_status()

    assert status["vault"]["exists"] is False
    assert status["vault"]["markdown_files"] == 0


def test_count_markdown_files_excludes_service_dirs(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    _fill_vault(vault)

    count = SystemStatusService.count_markdown_files(vault)
    assert count == 2
