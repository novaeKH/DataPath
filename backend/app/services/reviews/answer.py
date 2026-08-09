"""ReviewAnswerService (Фаза 5).

Обрабатывает ответы на повторения:
- детерминированная проверка структурированного ответа (без LLM);
- effective rating: объективная правильность важнее самооценки;
- dedup: повторная HTTP-отправка не создаёт вторую попытку;
- расчёт следующего интервала (ReviewSchedulerService);
- создание learning event и обновление KnowledgeModelService
  (единая модель mastery — второй модели нет);
- skip: без отрицательного evidence и без роста lapses.

Вес evidence:
- правильный ответ после реального интервала — полный вес;
- немедленный повтор после ошибки (interval < 1 дня) — ослабленный (×0.5);
- Again умеренно снижает связанные оси (success = 0.15, одна ошибка
  не обнуляет навык);
- Hard — слабее положительное evidence, чем Good;
- Easy — сильное, но не мгновенный strong (байесовское обновление);
- hints_used снижают вес (×0.4);
- reveal_and_rate: только слабое evidence, самооценка не даёт strong mastery.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ReviewAttempt, ReviewItem, SkillAssessment
from app.db.session import SessionLocal
from app.services.knowledge_model import HINT_WEIGHT_FACTOR, KnowledgeModelService
from app.services.reviews.clock import ReviewClock
from app.services.reviews.dynamic import build_dynamic_template
from app.services.reviews.registry import (
    RATING_AGAIN,
    RATING_EASY,
    RATING_GOOD,
    RATING_HARD,
    RATINGS,
    ReviewTemplate,
    ReviewTemplateRegistry,
)
from app.services.reviews.scheduler import ReviewSchedulerService
from app.services.reviews.templates import get_default_registry

# success по effective rating для объективных типов.
SUCCESS_BY_RATING: dict[str, float] = {
    RATING_AGAIN: 0.15,
    RATING_HARD: 0.6,
    RATING_GOOD: 0.85,
    RATING_EASY: 1.0,
}

# reveal_and_rate: самооценка не даёт сильный mastery (потолок 0.6).
REVEAL_SUCCESS_BY_RATING: dict[str, float] = {
    RATING_AGAIN: 0.1,
    RATING_HARD: 0.3,
    RATING_GOOD: 0.5,
    RATING_EASY: 0.6,
}

# Немедленный повтор после ошибки — слабое evidence.
RETRY_WEIGHT_FACTOR = 0.5
# Интервал, начиная с которого ответ считается «после реального интервала».
FULL_EVIDENCE_INTERVAL_DAYS = 1.0

# error_code для журнала ошибок.
ERROR_REVIEW_INCORRECT = "review_incorrect"
ERROR_REVIEW_PARTIAL = "review_partial"


class ReviewNotFoundError(Exception):
    """Review item не найден."""


class ReviewSuspendedError(Exception):
    """Review item suspended."""


class InvalidRatingError(Exception):
    """Недопустимая пользовательская оценка."""


class InvalidAnswerError(Exception):
    """Недопустимая структура ответа для типа вопроса."""


def validate_answer_type(template: ReviewTemplate, answer: Any) -> None:
    """Структурная валидация типа ответа (без раскрытия answer key)."""
    if template.question_type in (
        "single_choice",
        "parameter_selection",
        "error_diagnosis",
    ) and (not isinstance(answer, int) or isinstance(answer, bool)):
        raise InvalidAnswerError(
            "Для этого типа вопроса ответ должен быть индексом варианта (целым числом)."
        )
    if template.question_type in ("multiple_choice", "ordering") and (
        not isinstance(answer, list) or not all(isinstance(x, int) for x in answer)
    ):
        raise InvalidAnswerError(
            "Для этого типа вопроса ответ должен быть списком индексов вариантов."
        )
    if template.question_type == "numeric" and (
        not isinstance(answer, (int, float)) or isinstance(answer, bool)
    ):
        raise InvalidAnswerError("Для числового вопроса ответ должен быть числом.")


class ReviewAnswerService:
    """Проверка ответов, расписание и evidence."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
        registry: ReviewTemplateRegistry | None = None,
        clock: ReviewClock | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.registry = registry or get_default_registry()
        self.clock = clock or ReviewClock(self.settings.timezone)
        self.knowledge = KnowledgeModelService()
        self.scheduler = ReviewSchedulerService(self.clock)

    # --- Валидация и effective rating ---

    def _effective_rating(
        self,
        evaluation: dict[str, Any],
        user_rating: str,
    ) -> str:
        """Правило effective rating (объективность важнее самооценки).

        - неправильный объективный ответ → Again;
        - частично правильный → не выше Hard;
        - полностью правильный → допустимая пользовательская оценка;
        - reveal_and_rate → пользовательская оценка (без объективной проверки).
        """
        if user_rating not in RATINGS:
            raise InvalidRatingError(f"Недопустимая оценка {user_rating!r}")

        score = evaluation.get("score")
        if score is None:
            return user_rating
        if score <= 0.0:
            return RATING_AGAIN
        if score < 1.0:
            # Частично правильный: не выше Hard.
            return RATING_HARD if user_rating != RATING_AGAIN else RATING_AGAIN
        return user_rating

    def _error_code(self, evaluation: dict[str, Any]) -> str | None:
        score = evaluation.get("score")
        if score is None:
            return None
        if score <= 0.0:
            return ERROR_REVIEW_INCORRECT
        if score < 1.0:
            return ERROR_REVIEW_PARTIAL
        return None

    # --- Knowledge evidence ---

    def _apply_knowledge(
        self,
        db,
        item: ReviewItem,
        template: ReviewTemplate,
        evaluation: dict[str, Any],
        effective_rating: str,
        prev_interval_days: float,
        hints_used: int,
        attempt: ReviewAttempt,
    ) -> list[dict[str, Any]]:
        """Обновляет KnowledgeModelService по осям шаблона.

        Создаёт один learning event на ось (dedup по попытке). Возвращает
        сводку изменения для API.
        """
        if evaluation.get("score") is None:
            success = REVEAL_SUCCESS_BY_RATING.get(effective_rating, 0.5)
        else:
            success = SUCCESS_BY_RATING.get(effective_rating, 0.5)

        # Ослабление немедленного повтора (интервал перед ответом < 1 дня).
        weight_factor = 1.0
        if prev_interval_days < FULL_EVIDENCE_INTERVAL_DAYS:
            weight_factor = RETRY_WEIGHT_FACTOR
        if hints_used > 0:
            weight_factor *= HINT_WEIGHT_FACTOR

        impact: list[dict[str, Any]] = []
        assessment = db.get(SkillAssessment, item.primary_skill_id)
        for axis, axis_weight in template.axes().items():
            before = None
            if assessment is not None and (assessment.axes or {}).get(axis):
                before = assessment.axes[axis].get("score")

            weight = template.evidence_weight * axis_weight * weight_factor
            event = self.knowledge.record_event(
                db,
                event_type="review_answer",
                source_type="review",
                source_id=template.id,
                skill_id=item.primary_skill_id,
                axis=axis,
                outcome=(
                    "correct" if success >= 0.85 else ("partial" if success >= 0.5 else "incorrect")
                ),
                score=success,
                hints_used=hints_used,
                attempts=1,
                error_code=self._error_code(evaluation),
                metadata={
                    "review_item_id": item.id,
                    "attempt_id": attempt.id,
                    "question_type": template.question_type,
                    "effective_rating": effective_rating,
                },
                dedup_key=f"review:{item.id}:{attempt.id}:{axis}",
            )
            update = self.knowledge.apply_evidence(
                db,
                skill_id=item.primary_skill_id,
                axis=axis,
                success=success,
                weight=weight,
                error_code=self._error_code(evaluation),
            )
            impact.append(
                {
                    "skill_id": item.primary_skill_id,
                    "axis": axis,
                    "score_before": before,
                    "score_after": update.score,
                    "weight": round(weight, 4),
                    "event_id": event.id,
                }
            )
        db.flush()
        return impact

    # --- Submit ---

    def submit(
        self,
        review_item_id: int,
        *,
        answer: Any,
        user_rating: str,
        hints_used: int = 0,
        response_time_ms: int | None = None,
        dedup_key: str | None = None,
    ) -> dict[str, Any]:
        """Проверяет ответ, сохраняет попытку, обновляет расписание и знания."""
        hints_used = max(0, int(hints_used or 0))
        with self.session_factory() as db:
            item = db.get(ReviewItem, review_item_id)
            if item is None:
                raise ReviewNotFoundError(f"Review item {review_item_id!r} не найден")
            if item.status == "suspended":
                raise ReviewSuspendedError("Элемент повторения приостановлен")
            template = self.registry.get(item.template_id) or build_dynamic_template(
                db, item.template_id
            )
            if template is None:
                raise ReviewNotFoundError(f"Шаблон {item.template_id!r} не найден")
            validate_answer_type(template, answer)

            # Dedup: повторная отправка одной попытки.
            if dedup_key:
                existing = db.scalar(
                    select(ReviewAttempt).where(ReviewAttempt.dedup_key == dedup_key)
                )
                if existing is not None:
                    return self._result_payload(
                        db,
                        item,
                        template,
                        existing,
                        deduplicated=True,
                    )

            evaluation = template.evaluate(answer)
            try:
                effective = self._effective_rating(evaluation, user_rating)
            except InvalidRatingError as exc:
                db.rollback()
                raise InvalidRatingError(str(exc)) from exc

            prev_interval_days = item.interval_days
            schedule = self.scheduler.next_schedule(
                current_stage=item.stage,
                current_interval_days=item.interval_days,
                current_ease_factor=item.ease_factor,
                repetitions=item.repetitions,
                lapses=item.lapses,
                effective_rating=effective,
            )

            now = self.clock.now_iso()
            item.stage = schedule.stage
            item.status = "active"
            item.due_at = schedule.due_at
            item.interval_days = schedule.interval_days
            item.ease_factor = schedule.ease_factor
            item.repetitions = schedule.repetitions
            item.lapses = schedule.lapses
            item.last_reviewed_at = now
            item.updated_at = now

            attempt = ReviewAttempt(
                review_item_id=item.id,
                answer={"value": answer} if not isinstance(answer, dict) else answer,
                objective_score=evaluation.get("score"),
                is_correct=evaluation.get("correct"),
                user_rating=user_rating,
                effective_rating=effective,
                hints_used=hints_used,
                response_time_ms=response_time_ms,
                dedup_key=dedup_key,
                created_at=now,
            )
            db.add(attempt)
            db.flush()

            impact = self._apply_knowledge(
                db,
                item,
                template,
                evaluation,
                effective,
                prev_interval_days,
                hints_used,
                attempt,
            )
            db.commit()
            return self._result_payload(
                db, item, template, attempt, deduplicated=False, impact=impact
            )

    def _result_payload(
        self,
        db,
        item: ReviewItem,
        template: ReviewTemplate,
        attempt: ReviewAttempt,
        *,
        deduplicated: bool,
        impact: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        assessment = db.get(SkillAssessment, item.primary_skill_id)
        axes = assessment.axes if assessment else {}
        return {
            "review_item_id": item.id,
            "template_id": template.id,
            "title": template.title,
            "objective_score": attempt.objective_score,
            "is_correct": attempt.is_correct,
            "user_rating": attempt.user_rating,
            "effective_rating": attempt.effective_rating,
            "explanation": template.explanation,
            "correct_answer": (
                None if template.is_objective() is False else template._display_correct()
            ),
            "interval_days": item.interval_days,
            "ease_factor": item.ease_factor,
            "stage": item.stage,
            "next_due_at": item.due_at,
            "repetitions": item.repetitions,
            "lapses": item.lapses,
            "knowledge_impact": impact or [],
            "skill_state": assessment.state if assessment else None,
            "skill_axes": axes,
            "attempt_id": attempt.id,
            "deduplicated": deduplicated,
        }

    # --- Skip ---

    def skip(self, review_item_id: int) -> dict[str, Any]:
        """Skip: без отрицательного evidence и без роста lapses.

        Элемент остаётся due (расписание не меняется) — пользователь просто
        отложил его внутри текущей сессии.
        """
        with self.session_factory() as db:
            item = db.get(ReviewItem, review_item_id)
            if item is None:
                raise ReviewNotFoundError(f"Review item {review_item_id!r} не найден")
            if item.status == "suspended":
                raise ReviewSuspendedError("Элемент повторения приостановлен")
            template = self.registry.get(item.template_id) or build_dynamic_template(
                db, item.template_id
            )
            return {
                "review_item_id": item.id,
                "template_id": item.template_id,
                "title": template.title if template else item.template_id,
                "skipped": True,
                "due_at": item.due_at,
                "stage": item.stage,
                "interval_days": item.interval_days,
                "lapses": item.lapses,
                "message": "Пропущено: расписание не изменилось, элемент остаётся в очереди.",
            }

    # --- GET (без answer key) ---

    def get_item(self, review_item_id: int) -> dict[str, Any]:
        """Спецификация элемента для сессии (без правильного ответа)."""
        with self.session_factory() as db:
            item = db.get(ReviewItem, review_item_id)
            if item is None:
                raise ReviewNotFoundError(f"Review item {review_item_id!r} не найден")
            template = self.registry.get(item.template_id) or build_dynamic_template(
                db, item.template_id
            )
            if template is None:
                raise ReviewNotFoundError(f"Шаблон {item.template_id!r} не найден")
            spec = template.spec()
            spec["review_item_id"] = item.id
            spec["stage"] = item.stage
            spec["status"] = item.status
            spec["due_at"] = item.due_at
            spec["interval_days"] = item.interval_days
            spec["repetitions"] = item.repetitions
            spec["lapses"] = item.lapses
            return spec
