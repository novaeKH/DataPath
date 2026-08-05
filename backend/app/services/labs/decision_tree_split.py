"""Лаборатория 1: разбиение Decision Tree.

Пользователь выбирает признак, порог и критерий; backend считает impurity
и information gain для реального фиксированного датасета.
"""

from __future__ import annotations

from typing import Any, Literal

import numpy as np
from pydantic import BaseModel, Field

from app.services.labs.base import Lab, parameter
from app.services.labs.datasets import split_dataset

FEATURES = ("x1", "x2")


class SplitParams(BaseModel):
    feature: Literal["x1", "x2"] = "x1"
    threshold: float = Field(0.0, ge=-3.0, le=3.0)
    criterion: Literal["gini", "entropy"] = "gini"


def _impurity(class_counts: np.ndarray, criterion: str) -> float:
    total = int(class_counts.sum())
    if total == 0:
        return 0.0
    p = class_counts / total
    if criterion == "gini":
        value = 1.0 - float(np.sum(p * p))
    else:  # entropy, log2 как в scikit-learn
        value = -float(np.sum(p * np.log2(p + 1e-12)))
    return round(value, 6)


def _explain_split(
    parent: float,
    left_imp: float,
    right_imp: float,
    weighted: float,
    gain: float,
    left_count: int,
    right_count: int,
    criterion: str,
) -> str:
    criterion_label = "Gini" if criterion == "gini" else "Entropy"
    total = left_count + right_count
    if total == 0:
        return "Разбиение не содержит объектов — выберите порог внутри диапазона данных."
    parts = [
        f"Impurity родительского узла: {parent:.3f} ({criterion_label}). "
        f"После разбиения: {weighted:.3f} (лево {left_imp:.3f} на {left_count} объектах, "
        f"право {right_imp:.3f} на {right_count} объектах)."
    ]
    if gain <= 0.0:
        parts.append(
            "Information gain ≤ 0: разбиение не уменьшает impurity. Такой порог не улучшает "
            "разделение классов — дерево выберет другое условие."
        )
    elif gain < 0.05:
        parts.append(
            f"Information gain {gain:.3f} — улучшение небольшое. Порог почти не разделяет классы: "
            "смесь классов остаётся похожей на исходную."
        )
    else:
        parts.append(
            f"Information gain {gain:.3f} — разбиение заметно уменьшает impurity. "
            "Это хорошее условие: одна сторона стала заметно чище по классам."
        )
    if left_count > 0 and right_count > 0 and max(left_count, right_count) / total > 0.85:
        parts.append(
            "Разбиение сильно несбалансированное: почти все объекты попали в одну сторону. "
            "Попробуйте порог ближе к центру распределения."
        )
    return " ".join(parts)


class DecisionTreeSplitLab(Lab):
    id = "decision-tree-split-lab"
    title = "Разбиение Decision Tree"
    description = (
        "Попробуйте разные разбиения двумерного датасета: выбирайте признак и порог, "
        "сравнивайте Gini и Entropy. Backend считает impurity и information gain, "
        "как это делает дерево на каждом шаге."
    )
    lesson_ids = ["lesson.classic-ml.trees.tree"]
    parameters = [
        parameter("feature", "Признак", "enum", default="x1", values=list(FEATURES)),
        parameter("threshold", "Порог", "number", default=0.0, min=-3.0, max=3.0, step=0.05),
        parameter("criterion", "Критерий", "enum", default="gini", values=["gini", "entropy"]),
    ]

    def __init__(self, lesson_ids: list[str] | None = None) -> None:
        if lesson_ids is not None:
            self.lesson_ids = lesson_ids

    def run(self, params: dict[str, Any]) -> dict[str, Any]:
        validated = SplitParams(**params)
        dataset = split_dataset()
        points = dataset["points"]
        X = np.array([[p["x1"], p["x2"]] for p in points])
        y = np.array([p["y"] for p in points])

        feature_idx = FEATURES.index(validated.feature)
        mask = X[:, feature_idx] <= validated.threshold
        left_y = y[mask]
        right_y = y[~mask]

        parent_imp = _impurity(np.bincount(y, minlength=2), validated.criterion)
        left_imp = _impurity(np.bincount(left_y, minlength=2), validated.criterion)
        right_imp = _impurity(np.bincount(right_y, minlength=2), validated.criterion)
        total = len(y)
        left_count = int(mask.sum())
        right_count = total - left_count
        weighted = round((left_count * left_imp + right_count * right_imp) / total, 6)
        gain = round(parent_imp - weighted, 6)

        return {
            "dataset": dataset,
            "split": {
                "feature": validated.feature,
                "threshold": validated.threshold,
                "left_count": left_count,
                "right_count": right_count,
            },
            "impurity": {
                "criterion": validated.criterion,
                "parent": parent_imp,
                "left": left_imp,
                "right": right_imp,
                "weighted": weighted,
            },
            "gain": gain,
            "explanation": _explain_split(
                parent_imp,
                left_imp,
                right_imp,
                weighted,
                gain,
                left_count,
                right_count,
                validated.criterion,
            ),
        }
