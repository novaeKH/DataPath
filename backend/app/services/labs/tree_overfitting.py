"""Лаборатория 2: глубина дерева и переобучение.

Детерминированный синтетический датасет (moons + шум) и фиксированный
train/test split. Пользователь меняет max_depth/min_samples_leaf и видит
train/val качество, decision boundary и кривую качества по глубине.
"""

from __future__ import annotations

import time
from typing import Any

import numpy as np
from pydantic import BaseModel, Field
from sklearn.tree import DecisionTreeClassifier

from app.services.labs.base import Lab, parameter
from app.services.labs.datasets import grid_2d, make_moons, train_test_split

MAX_DEPTH_SCAN = 12


class OverfitParams(BaseModel):
    max_depth: int = Field(4, ge=1, le=MAX_DEPTH_SCAN)
    min_samples_leaf: int = Field(1, ge=1, le=20)


def _predict_grid(model, x_range: list[float], y_range: list[float], size: int = 36):
    xx, yy = grid_2d(x_range, y_range, size)
    grid = np.c_[xx.ravel(), yy.ravel()]
    preds = model.predict(grid).reshape(size, size)
    return [int(v) for v in preds.ravel()]


def _interpret(train_acc: float, val_acc: float, depth: int) -> dict:
    gap = train_acc - val_acc
    if train_acc < 0.82:
        label = "underfit"
        text = (
            f"Модель слишком простая: train {train_acc:.2f} / validation {val_acc:.2f}. "
            "Дерево не доучилось — увеличьте max_depth (или уменьшите min_samples_leaf), "
            "чтобы оно могло поймать нелинейную границу."
        )
    elif gap > 0.14:
        label = "overfit"
        text = (
            f"Модель переобучается: train {train_acc:.2f}, а validation {val_acc:.2f} "
            f"(разрыв {gap:.2f}). Дерево запоминает шум датасета — уменьшите max_depth "
            "или увеличьте min_samples_leaf."
        )
    else:
        label = "good"
        text = (
            f"Сложность подходящая: train {train_acc:.2f} / validation {val_acc:.2f}, "
            "разрыв небольшой. Модель обобщает, а не запоминает выборку."
        )
    return {"label": label, "text": text}


class TreeOverfittingLab(Lab):
    id = "tree-depth-overfitting-lab"
    title = "Глубина дерева и переобучение"
    description = (
        "Обучите Decision Tree на фиксированном датасете с шумом и посмотрите, "
        "как max_depth и min_samples_leaf влияют на train/validation качество. "
        "Так выглядит bias-variance trade-off на практике."
    )
    lesson_ids = ["lesson.classic-ml.linear.regularization", "lesson.classic-ml.trees.tree"]
    parameters = [
        parameter(
            "max_depth",
            "Глубина дерева",
            "number",
            default=4,
            min=1,
            max=MAX_DEPTH_SCAN,
            step=1,
            unit="ур.",
        ),
        parameter(
            "min_samples_leaf",
            "Мин. объектов в листе",
            "number",
            default=1,
            min=1,
            max=20,
            step=1,
            unit="шт.",
        ),
    ]

    def __init__(self, lesson_ids: list[str] | None = None) -> None:
        if lesson_ids is not None:
            self.lesson_ids = lesson_ids

    def run(self, params: dict[str, Any]) -> dict[str, Any]:
        validated = OverfitParams(**params)
        X_raw, y_raw = make_moons(n_samples=220, noise=0.32)
        X = np.asarray(X_raw, dtype=float)
        y = np.asarray(y_raw, dtype=int)
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.3)

        started = time.perf_counter()
        model = DecisionTreeClassifier(
            max_depth=validated.max_depth,
            min_samples_leaf=validated.min_samples_leaf,
            random_state=42,
        )
        model.fit(X_train, y_train)
        train_acc = float(model.score(X_train, y_train))
        val_acc = float(model.score(X_val, y_val))
        elapsed_ms = round((time.perf_counter() - started) * 1000, 1)

        depth = int(model.get_depth())
        leaves = int(model.get_n_leaves())

        # Кривая качества по глубине (при текущем min_samples_leaf).
        depths = list(range(1, MAX_DEPTH_SCAN + 1))
        curve_train: list[float] = []
        curve_val: list[float] = []
        for d in depths:
            probe = DecisionTreeClassifier(
                max_depth=d,
                min_samples_leaf=validated.min_samples_leaf,
                random_state=42,
            )
            probe.fit(X_train, y_train)
            curve_train.append(round(float(probe.score(X_train, y_train)), 6))
            curve_val.append(round(float(probe.score(X_val, y_val)), 6))

        x_range = [round(float(X[:, 0].min()) - 0.3, 2), round(float(X[:, 0].max()) + 0.3, 2)]
        y_range = [round(float(X[:, 1].min()) - 0.3, 2), round(float(X[:, 1].max()) + 0.3, 2)]

        return {
            "dataset": {
                "x_range": x_range,
                "y_range": y_range,
                "train_size": int(len(X_train)),
                "val_size": int(len(X_val)),
            },
            "metrics": {
                "train_accuracy": round(train_acc, 6),
                "val_accuracy": round(val_acc, 6),
                "depth": depth,
                "leaves": leaves,
                "time_ms": elapsed_ms,
            },
            "boundary": {
                "x": [round(float(v), 4) for v in np.linspace(x_range[0], x_range[1], 36)],
                "y": [round(float(v), 4) for v in np.linspace(y_range[0], y_range[1], 36)],
                "preds": _predict_grid(model, x_range, y_range, 36),
            },
            "depth_curve": {
                "depths": depths,
                "train": curve_train,
                "val": curve_val,
            },
            "interpretation": _interpret(train_acc, val_acc, depth),
        }
