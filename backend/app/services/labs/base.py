"""Базовый класс лабораторий и схема параметров."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Lab(ABC):
    """Контракт интерактивной лаборатории.

    - `parameters` — декларация параметров для формы (тип, диапазон, дефолт);
    - `run(params)` — строгая валидация (Pydantic) и детерминированный расчёт;
    - результаты содержат только сериализуемые данные для визуализации.
    """

    id: str = ""
    title: str = ""
    description: str = ""
    lesson_ids: list[str] = []
    parameters: list[dict[str, Any]] = []

    def spec(self) -> dict[str, Any]:
        """Метаданные + параметры + результат для первого отображения."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "lesson_ids": list(self.lesson_ids),
            "parameters": self.parameters,
            "defaults": self._defaults(),
            "initial_result": self.run(self._defaults()),
        }

    def _defaults(self) -> dict[str, Any]:
        return {
            param["name"]: param.get("default") for param in self.parameters if "default" in param
        }

    @abstractmethod
    def run(self, params: dict[str, Any]) -> dict[str, Any]:
        """Валидирует параметры и возвращает результат расчёта."""


def parameter(
    name: str,
    label: str,
    type_: str,
    default: Any,
    min: float | None = None,  # noqa: A002 — имя параметра совпадает с встроенной функцией
    max: float | None = None,  # noqa: A002
    step: float | None = None,
    values: list[str] | None = None,
    unit: str | None = None,
) -> dict[str, Any]:
    """Декларация параметра для UI (число или перечисление)."""
    param: dict[str, Any] = {
        "name": name,
        "label": label,
        "type": type_,
        "default": default,
    }
    if min is not None:
        param["min"] = min
    if max is not None:
        param["max"] = max
    if step is not None:
        param["step"] = step
    if values is not None:
        param["values"] = values
    if unit is not None:
        param["unit"] = unit
    return param
