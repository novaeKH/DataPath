"""ReviewTemplateRegistry (Фаза 5).

Исполняемая структура review templates определена в Python-реестре
(аналогично CaseRegistry и LabRegistry). Контент vault остаётся каноном
и не изменяется: шаблон ссылается на content ID и lesson ID заметок.

Типы вопросов:
- single_choice        — один вариант;
- multiple_choice      — несколько вариантов (точный набор = 1.0, непустое
                         подмножество = 0.5, иначе 0.0);
- ordering             — упорядочивание (score = доля позиций на месте);
- numeric              — число с допуском;
- parameter_selection  — выбор параметра/настройки (оценивается как single);
- error_diagnosis      — распознать ошибочное объяснение (single);
- reveal_and_rate      — свободная самооценка: НЕ проверяется объективно,
                         создаёт только слабое evidence.

Оценка детерминированная, без LLM и без сравнения свободного текста.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# Значения user_rating / effective_rating.
RATING_AGAIN = "Again"
RATING_HARD = "Hard"
RATING_GOOD = "Good"
RATING_EASY = "Easy"
RATINGS: tuple[str, ...] = (RATING_AGAIN, RATING_HARD, RATING_GOOD, RATING_EASY)

# Тип → оси модели знаний, которые обновляет ответ (если шаблон не
# переопределяет knowledge_axes). Веса — базовая сила сигнала при success=1.
DEFAULT_AXES_BY_TYPE: dict[str, dict[str, float]] = {
    "single_choice": {"theory": 0.5},
    "multiple_choice": {"theory": 0.5},
    "ordering": {"apply": 0.6},
    "numeric": {"apply": 0.6},
    "parameter_selection": {"apply": 0.6},
    "error_diagnosis": {"interpret": 0.6},
    "reveal_and_rate": {"theory": 0.15},
}

# Объективно проверяемые типы (reveal_and_rate — нет).
OBJECTIVE_TYPES: frozenset[str] = frozenset(DEFAULT_AXES_BY_TYPE) - {"reveal_and_rate"}


@dataclass
class ReviewTemplate:
    """Один шаблон повторения."""

    id: str  # стабильный template_id (уникален в БД)
    title: str
    prompt: str
    question_type: str
    options: list[str] = field(default_factory=list)
    # Спецификация правильного ответа по типу:
    #   single/select/error_diagnosis: {"correct": int}
    #   multiple: {"correct": [int, ...]}
    #   ordering: {"correct": [int, ...]}
    #   numeric:  {"correct": float, "tolerance": float}
    #   reveal_and_rate: {} (не проверяется)
    answer_spec: dict[str, Any] = field(default_factory=dict)
    explanation: str = ""
    primary_skill: str = ""
    skills: list[str] = field(default_factory=list)  # дополнительные навыки
    knowledge_axes: dict[str, float] | None = None  # override DEFAULT_AXES_BY_TYPE
    source_content_id: str = ""  # content ID материала vault (источник)
    source_lesson_id: str = ""  # lesson ID, к которому относится повторение
    source_type: str = "lesson"  # lesson | lab | case — что активирует элемент
    source_id: str = ""  # id активатора (lesson_id | lab_id | case_id)
    difficulty: str = "standard"
    evidence_weight: float = 1.0  # базовый вес evidence (множитель оси)
    numeric_tolerance: float = 0.01

    def axes(self) -> dict[str, float]:
        """Оси, которые обновляет ответ на этот шаблон."""
        if self.knowledge_axes is not None:
            return dict(self.knowledge_axes)
        return dict(DEFAULT_AXES_BY_TYPE.get(self.question_type, {"theory": 0.5}))

    def is_objective(self) -> bool:
        return self.question_type in OBJECTIVE_TYPES

    # --- Детерминированная оценка ---

    def _check_single(self, answer: Any) -> tuple[float, bool, str]:
        correct = self.answer_spec.get("correct")
        if answer == correct:
            return 1.0, True, self.explanation or "Верно."
        return (
            0.0,
            False,
            self.explanation or f"Неверно. Правильный ответ: {self._display_correct()}.",
        )

    def _check_multiple(self, answer: Any) -> tuple[float, bool, str]:
        correct: list = list(self.answer_spec.get("correct") or [])
        if not isinstance(answer, list):
            answer = []
        answer_set = set(answer)
        correct_set = set(correct)
        if answer_set == correct_set:
            return 1.0, True, self.explanation or "Верно: выбраны все нужные варианты."
        if answer_set and answer_set <= correct_set:
            return 0.5, False, "Частично верно: выбраны правильные варианты, но не все."
        return (
            0.0,
            False,
            self.explanation or f"Неверно. Правильный набор: {self._display_correct()}.",
        )

    def _check_order(self, answer: Any) -> tuple[float, bool, str]:
        correct: list = list(self.answer_spec.get("correct") or [])
        if not isinstance(answer, list):
            answer = []
        if answer == correct:
            return 1.0, True, self.explanation or "Порядок верный."
        if len(answer) == len(correct):
            matches = sum(1 for a, c in zip(answer, correct, strict=True) if a == c)
            if matches > 0:
                return (
                    round(matches / len(correct), 3),
                    False,
                    f"Частично: {matches} из {len(correct)} позиций на месте.",
                )
        return (
            0.0,
            False,
            self.explanation or f"Неверный порядок. Правильный: {self._display_correct()}.",
        )

    def _check_numeric(self, answer: Any) -> tuple[float, bool, str]:
        try:
            value = float(answer)
        except (TypeError, ValueError):
            return 0.0, False, "Нужно ввести число."
        correct_value = self.answer_spec.get("correct")
        try:
            correct = float(correct_value)
        except (TypeError, ValueError):
            return 0.0, False, "Некорректная спецификация ответа."
        tolerance_value = self.answer_spec.get("tolerance", self.numeric_tolerance)
        tolerance = (
            float(tolerance_value) if tolerance_value is not None else self.numeric_tolerance
        )
        if abs(value - correct) <= tolerance:
            return 1.0, True, self.explanation or "Верно."
        return (
            0.0,
            False,
            self.explanation or f"Неверно. Ожидалось ≈ {correct:.3g}, получено {value:.3g}.",
        )

    def _display_correct(self) -> str:
        spec = self.answer_spec
        if self.question_type in ("single_choice", "parameter_selection", "error_diagnosis"):
            idx = spec.get("correct")
            if isinstance(idx, int) and 0 <= idx < len(self.options):
                return f"{idx + 1}. {self.options[idx]}"
            return str(idx)
        if self.question_type in ("multiple_choice", "ordering"):
            parts = []
            for idx in spec.get("correct") or []:
                if isinstance(idx, int) and 0 <= idx < len(self.options):
                    parts.append(f"{idx + 1}. {self.options[idx]}")
                else:
                    parts.append(str(idx))
            joiner = " → " if self.question_type == "ordering" else "; "
            return joiner.join(parts) if parts else "—"
        return str(spec.get("correct"))

    def evaluate(self, answer: Any) -> dict[str, Any]:
        """Оценивает ответ. Возвращает score/correct/explanation/display_correct.

        Для reveal_and_rate: score и correct равны None (не проверяется).
        """
        if not self.is_objective():
            return {
                "score": None,
                "correct": None,
                "explanation": self.explanation,
                "display_correct": None,
                "your_answer": answer,
            }
        if self.question_type == "single_choice":
            score, ok, explanation = self._check_single(answer)
        elif self.question_type == "multiple_choice":
            score, ok, explanation = self._check_multiple(answer)
        elif self.question_type == "ordering":
            score, ok, explanation = self._check_order(answer)
        elif self.question_type == "numeric":
            score, ok, explanation = self._check_numeric(answer)
        elif self.question_type in ("parameter_selection", "error_diagnosis"):
            score, ok, explanation = self._check_single(answer)
        else:
            return {
                "score": None,
                "correct": None,
                "explanation": f"Неизвестный тип вопроса {self.question_type}.",
                "display_correct": None,
                "your_answer": answer,
            }
        return {
            "score": score,
            "correct": ok,
            "explanation": explanation,
            "display_correct": self._display_correct(),
            "your_answer": answer,
        }

    def spec(self) -> dict[str, Any]:
        """Спецификация для UI (без правильных ответов)."""
        payload: dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "prompt": self.prompt,
            "question_type": self.question_type,
            "options": list(self.options),
            "source_content_id": self.source_content_id,
            "source_lesson_id": self.source_lesson_id,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "difficulty": self.difficulty,
            "objective": self.is_objective(),
        }
        # Допустимые параметры (для numeric/parameter_selection) — без ответа.
        if self.question_type == "numeric":
            payload["numeric_tolerance"] = self.answer_spec.get("tolerance", self.numeric_tolerance)
        return payload


class ReviewTemplateRegistry:
    """Реестр шаблонов повторений: единая точка регистрации и оценки."""

    def __init__(self, templates: list[ReviewTemplate] | None = None) -> None:
        self._templates: dict[str, ReviewTemplate] = {}
        for template in templates or []:
            self.register(template)

    def register(self, template: ReviewTemplate) -> None:
        if not template.id:
            raise ValueError("Шаблон должен иметь id")
        self._templates[template.id] = template

    def get(self, template_id: str) -> ReviewTemplate | None:
        return self._templates.get(template_id)

    def ids(self) -> list[str]:
        return sorted(self._templates)

    def all(self) -> list[ReviewTemplate]:
        return [self._templates[tid] for tid in self.ids()]

    def list_specs(self) -> list[dict[str, Any]]:
        return [self.get(tid).spec() for tid in self.ids()]  # type: ignore[union-attr]
