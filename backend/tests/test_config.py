"""Тесты конфигурации: резолв относительных путей."""

from pathlib import Path

from app.core.config import Settings


def test_relative_database_url_resolved():
    settings = Settings(database_url="sqlite:///./data/datapath.db")
    url = settings.resolved_database_url
    assert url.startswith("sqlite:///")
    assert url.endswith("/data/datapath.db")


def test_absolute_database_url_kept(tmp_path):
    db = tmp_path / "x.db"
    settings = Settings(database_url=f"sqlite:///{db}")
    assert settings.resolved_database_url == f"sqlite:///{db}"


def test_memory_database_kept():
    settings = Settings(database_url="sqlite:///:memory:")
    assert settings.resolved_database_url == "sqlite:///:memory:"


def test_vault_dir_relative_resolved():
    settings = Settings(vault_path="content/vault")
    assert settings.vault_dir == settings.resolved_project_root / "content/vault"
    assert isinstance(settings.vault_dir, Path)


def test_vault_dir_absolute_kept(tmp_path):
    vault = tmp_path / "vault"
    settings = Settings(vault_path=str(vault))
    assert settings.vault_dir == vault


def test_cors_origins_split():
    settings = Settings(cors_origins="http://a.test, http://b.test ,")
    assert settings.cors_origin_list == ["http://a.test", "http://b.test"]
