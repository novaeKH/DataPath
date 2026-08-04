"""Тесты GET /api/health."""

from fastapi.testclient import TestClient


def test_health_ok(make_client):
    client: TestClient = make_client()
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"] == "DataPath"
    assert "version" in body


def test_health_unknown_route_404(make_client):
    client: TestClient = make_client()
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
