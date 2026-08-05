"""Registry лабораторий: единая точка регистрации и поиска."""

from __future__ import annotations

from typing import Any

from app.services.labs.base import Lab
from app.services.labs.decision_tree_split import DecisionTreeSplitLab
from app.services.labs.ensemble_comparison import EnsembleComparisonLab
from app.services.labs.tree_overfitting import TreeOverfittingLab


class LabRegistry:
    """Реестр лабораторий: id → Lab.

    Привязка lesson → lab задаётся внутри каждой лаборатории (lesson_ids);
    registry отвечает за поиск и формирование ответов API.
    """

    def __init__(self, labs: list[Lab] | None = None) -> None:
        self._labs: dict[str, Lab] = {}
        for lab in labs or []:
            self.register(lab)

    def register(self, lab: Lab) -> None:
        if not lab.id:
            raise ValueError("Лаборатория должна иметь id")
        self._labs[lab.id] = lab

    def get(self, lab_id: str) -> Lab | None:
        return self._labs.get(lab_id)

    def ids(self) -> list[str]:
        return sorted(self._labs)

    def labs_for_lesson(self, lesson_id: str) -> list[Lab]:
        return [lab for lab in self._labs.values() if lesson_id in lab.lesson_ids]

    def spec(self, lab_id: str) -> dict[str, Any] | None:
        lab = self.get(lab_id)
        return lab.spec() if lab is not None else None

    def run(self, lab_id: str, params: dict[str, Any]) -> dict[str, Any]:
        lab = self.get(lab_id)
        if lab is None:
            raise KeyError(lab_id)
        return lab.run(params)


def get_default_registry() -> LabRegistry:
    """Registry по умолчанию: три реализованные лаборатории MVP-маршрута."""
    return LabRegistry(
        [
            DecisionTreeSplitLab(),
            TreeOverfittingLab(),
            EnsembleComparisonLab(),
        ]
    )


DEFAULT_REGISTRY = get_default_registry()
