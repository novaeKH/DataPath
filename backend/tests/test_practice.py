"""SQL runner and structured code practice."""


def test_practice_catalog_has_tracks(make_client) -> None:
    data = make_client().get("/api/practice").json()
    assert data["total_count"] >= 13
    tracks = {item["track"] for item in data["exercises"]}
    assert {"sql", "pandas", "numpy", "sklearn", "deep-learning"} <= tracks
    assert "algorithms" not in tracks
    assert all("solution" not in item for item in data["exercises"])


def test_sql_runner_executes_and_grades(make_client) -> None:
    response = make_client().post(
        "/api/practice/sql/run",
        json={
            "exercise_id": "sql.select-filter",
            "query": "SELECT order_id, customer_id, amount FROM orders "
            "WHERE status='paid' AND amount > 100 ORDER BY amount DESC, order_id",
        },
    )
    assert response.status_code == 200
    result = response.json()
    assert result["passed"] is True
    assert result["columns"] == ["order_id", "customer_id", "amount"]
    assert result["row_count"] == 3
    assert result["evidence"]


def test_sql_runner_rejects_mutation(make_client) -> None:
    response = make_client().post(
        "/api/practice/sql/run",
        json={"exercise_id": "sql.select-filter", "query": "DROP TABLE orders"},
    )
    assert response.status_code == 422


def test_code_practice_check(make_client) -> None:
    response = make_client().post(
        "/api/practice/code/check",
        json={
            "exercise_id": "numpy.vectorize",
            "code": "mse = ((y_true - y_pred) ** 2).mean()",
        },
    )
    assert response.status_code == 200
    result = response.json()
    assert result["passed"] is True
    assert "solution" in result


def test_completed_practice_is_persisted(make_client) -> None:
    client = make_client()
    client.post(
        "/api/practice/code/check",
        json={
            "exercise_id": "numpy.vectorize",
            "code": "mse = ((y_true - y_pred) ** 2).mean()",
        },
    )
    catalog = client.get("/api/practice").json()
    exercise = next(item for item in catalog["exercises"] if item["id"] == "numpy.vectorize")
    assert exercise["completed"] is True
