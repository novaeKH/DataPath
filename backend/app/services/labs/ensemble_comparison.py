"""Лаборатория 3: Decision Tree vs Random Forest vs Gradient Boosting.

Один фиксированный датасет и одинаковое разбиение. Пользователь меняет
число деревьев, глубину и learning rate; backend обучает модели и сравнивает
validation-качество, время и decision boundary.

CatBoost добавляется в сравнение, когда CPU-пакет установлен и работает.
"""

from __future__ import annotations

import time
from typing import Any

import numpy as np
from pydantic import BaseModel, Field
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier

from app.services.labs.base import Lab, parameter
from app.services.labs.datasets import grid_2d, make_moons, train_test_split

GRID_SIZE = 30

try:  # CatBoost — опционально (см. docs/lesson-system.md)
    from catboost import CatBoostClassifier  # type: ignore[import-untyped]

    CATBOOST_AVAILABLE = True
except Exception:  # noqa: BLE001 — отсутствие пакета не ломает лабораторию
    CatBoostClassifier = None  # type: ignore[assignment,misc]
    CATBOOST_AVAILABLE = False


class EnsembleParams(BaseModel):
    n_estimators: int = Field(50, ge=5, le=100)
    max_depth: int = Field(3, ge=1, le=10)
    learning_rate: float = Field(0.1, ge=0.01, le=1.0)


def _predict_grid(model, x_range: list[float], y_range: list[float]) -> list[int]:
    xx, yy = grid_2d(x_range, y_range, GRID_SIZE)
    grid = np.c_[xx.ravel(), yy.ravel()]
    return [int(v) for v in model.predict(grid).ravel()]


def _fit_models(X_train, y_train, X_val, y_val, p: EnsembleParams) -> list[dict[str, Any]]:
    models: list[dict[str, Any]] = []

    def evaluate(name: str, key: str, model, params_label: str) -> None:
        started = time.perf_counter()
        model.fit(X_train, y_train)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
        models.append(
            {
                "key": key,
                "name": name,
                "train_accuracy": round(float(model.score(X_train, y_train)), 6),
                "val_accuracy": round(float(model.score(X_val, y_val)), 6),
                "time_ms": elapsed_ms,
                "params": params_label,
            }
        )

    evaluate(
        "Decision Tree",
        "tree",
        DecisionTreeClassifier(max_depth=p.max_depth, random_state=42),
        f"max_depth={p.max_depth}",
    )
    evaluate(
        "Random Forest",
        "forest",
        RandomForestClassifier(
            n_estimators=p.n_estimators,
            max_depth=p.max_depth,
            random_state=42,
            n_jobs=1,
        ),
        f"n_estimators={p.n_estimators}, max_depth={p.max_depth}",
    )
    evaluate(
        "Gradient Boosting",
        "boosting",
        GradientBoostingClassifier(
            n_estimators=p.n_estimators,
            max_depth=p.max_depth,
            learning_rate=p.learning_rate,
            random_state=42,
        ),
        f"n_estimators={p.n_estimators}, max_depth={p.max_depth}, lr={p.learning_rate}",
    )
    if CATBOOST_AVAILABLE and CatBoostClassifier is not None:
        evaluate(
            "CatBoost",
            "catboost",
            CatBoostClassifier(
                iterations=p.n_estimators,
                depth=p.max_depth,
                learning_rate=p.learning_rate,
                random_seed=42,
                verbose=False,
                allow_writing_files=False,
            ),
            f"iterations={p.n_estimators}, depth={p.max_depth}, lr={p.learning_rate}",
        )
    return models


def _explain(models: list[dict[str, Any]], p: EnsembleParams) -> str:
    best = max(models, key=lambda m: m["val_accuracy"])
    parts = [
        "Bagging (Random Forest) обучает деревья независимо на bootstrap-выборках и усредняет "
        "предсказания: это снижает variance нестабильных деревьев. Boosting (Gradient Boosting, "
        "CatBoost) обучает деревья последовательно, исправляя ошибки предыдущих: это снижает "
        "bias, но при малом learning rate требует больше деревьев."
    ]
    if p.n_estimators >= 80:
        parts.append(
            "При большом числе деревьев следите за разрывом train/validation: если качество на "
            "validation перестало расти, а на train продолжает — модель переобучается (особенно "
            "при малом min-ограничении глубины)."
        )
    if p.learning_rate < 0.05:
        parts.append(
            "Низкий learning rate замедляет обучение boosting-моделей: обычно нужны десятки-сотни "
            "деревьев, зато итоговое качество устойчивее."
        )
    parts.append(
        f"Лучшая validation-точность здесь у {best['name']} ({best['val_accuracy']:.3f}); "
        "для финального выбора добавьте время обучения и объяснимость."
    )
    return " ".join(parts)


class EnsembleComparisonLab(Lab):
    id = "ensemble-comparison-lab"
    title = "Дерево, Random Forest и boosting"
    description = (
        "Сравните Decision Tree, Random Forest, Gradient Boosting (и CatBoost, если установлен) "
        "на одном датасете с одинаковым разбиением. Меняйте число деревьев, глубину и "
        "learning rate — смотрите на validation-качество, время и границу решения."
    )
    lesson_ids = [
        "lesson.classic-ml.trees.forest",
        "lesson.classic-ml.trees.boosting",
        "lesson.classic-ml.trees.libraries",
    ]
    parameters = [
        parameter(
            "n_estimators",
            "Число деревьев",
            "number",
            default=50,
            min=5,
            max=100,
            step=5,
            unit="шт.",
        ),
        parameter("max_depth", "Глубина", "number", default=3, min=1, max=10, step=1, unit="ур."),
        parameter(
            "learning_rate",
            "Learning rate",
            "number",
            default=0.1,
            min=0.01,
            max=1.0,
            step=0.01,
        ),
    ]

    def __init__(self, lesson_ids: list[str] | None = None) -> None:
        if lesson_ids is not None:
            self.lesson_ids = lesson_ids

    def run(self, params: dict[str, Any]) -> dict[str, Any]:
        validated = EnsembleParams(**params)
        X_raw, y_raw = make_moons(n_samples=300, noise=0.28)
        X = np.asarray(X_raw, dtype=float)
        y = np.asarray(y_raw, dtype=int)
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.3)

        x_range = [round(float(X[:, 0].min()) - 0.3, 2), round(float(X[:, 0].max()) + 0.3, 2)]
        y_range = [round(float(X[:, 1].min()) - 0.3, 2), round(float(X[:, 1].max()) + 0.3, 2)]

        models = _fit_models(X_train, y_train, X_val, y_val, validated)

        grids: dict[str, list[int]] = {}
        for m in models:
            if m["key"] == "tree":
                model = DecisionTreeClassifier(max_depth=validated.max_depth, random_state=42)
            elif m["key"] == "forest":
                model = RandomForestClassifier(
                    n_estimators=validated.n_estimators,
                    max_depth=validated.max_depth,
                    random_state=42,
                    n_jobs=1,
                )
            elif m["key"] == "boosting":
                model = GradientBoostingClassifier(
                    n_estimators=validated.n_estimators,
                    max_depth=validated.max_depth,
                    learning_rate=validated.learning_rate,
                    random_state=42,
                )
            else:  # catboost
                model = CatBoostClassifier(  # type: ignore[union-attr]
                    iterations=validated.n_estimators,
                    depth=validated.max_depth,
                    learning_rate=validated.learning_rate,
                    random_seed=42,
                    verbose=False,
                    allow_writing_files=False,
                )
            model.fit(X_train, y_train)
            grids[m["key"]] = _predict_grid(model, x_range, y_range)

        return {
            "dataset": {
                "x_range": x_range,
                "y_range": y_range,
                "train_size": int(len(X_train)),
                "val_size": int(len(X_val)),
                "catboost_available": CATBOOST_AVAILABLE,
            },
            "models": models,
            "boundary": {
                "x": [round(float(v), 4) for v in np.linspace(x_range[0], x_range[1], GRID_SIZE)],
                "y": [round(float(v), 4) for v in np.linspace(y_range[0], y_range[1], GRID_SIZE)],
                "grids": grids,
            },
            "explanation": _explain(models, validated),
        }
