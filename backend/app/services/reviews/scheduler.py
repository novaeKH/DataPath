"""ReviewSchedulerService — прозрачный SM-2-like scheduler (Фаза 5).

Правила (docs/review-system.md):

Первый ответ (repetitions == 0):
- Again → ~10 минут, stage = relearning;
- Hard → ~1 день;
- Good → ~3 дня;
- Easy → ~7 дней.

Последующие ответы:
- Again: lapses += 1, ease −0.2 (не ниже минимума), короткий интервал ~10 минут,
  stage = relearning; модель знаний не обнуляется (это делает AnswerService);
- Hard: интервал ×1.2, ease −0.15;
- Good: интервал × ease;
- Easy: интервал × ease × 1.3, ease +0.1.

Ограничения:
- ease factor в [1.3, 2.8];
- interval_days ≥ 0, верхний предел 365 дней;
- просроченный ответ не ошибка (scheduler об этом не знает);
- все расчёты детерминированы и независимы от frontend;
- время передаётся через ReviewClock (в тестах фиксируется).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.reviews.clock import ReviewClock
from app.services.reviews.registry import RATING_AGAIN, RATING_EASY, RATING_GOOD, RATING_HARD

# ~10 минут в днях.
RELEARNING_INTERVAL_DAYS = 10.0 / (24.0 * 60.0)

# Первые интервалы по оценке.
INITIAL_INTERVALS: dict[str, float] = {
    RATING_AGAIN: RELEARNING_INTERVAL_DAYS,
    RATING_HARD: 1.0,
    RATING_GOOD: 3.0,
    RATING_EASY: 7.0,
}

MIN_EASE_FACTOR = 1.3
MAX_EASE_FACTOR = 2.8
MAX_INTERVAL_DAYS = 365.0

HARD_INTERVAL_FACTOR = 1.2  # небольшое увеличение при Hard
EASY_INTERVAL_BONUS = 1.3  # Easy растягивает интервал сильнее
EASE_AGAIN_DROP = 0.2
EASE_HARD_DROP = 0.15
EASE_EASY_RISE = 0.1


@dataclass
class ScheduleUpdate:
    """Новое состояние элемента после ответа."""

    interval_days: float
    ease_factor: float
    stage: str
    repetitions: int
    lapses: int
    due_at: str


class ReviewSchedulerService:
    """Расчёт следующего интервала по effective rating."""

    def __init__(self, clock: ReviewClock | None = None) -> None:
        self.clock = clock or ReviewClock()

    def initial_interval(self, rating: str) -> float:
        """Первый интервал для оценки (дни)."""
        return float(INITIAL_INTERVALS.get(rating, INITIAL_INTERVALS[RATING_GOOD]))

    def next_schedule(
        self,
        *,
        current_stage: str,
        current_interval_days: float,
        current_ease_factor: float,
        repetitions: int,
        lapses: int,
        effective_rating: str,
    ) -> ScheduleUpdate:
        """Детерминированный расчёт следующего расписания."""
        interval = float(current_interval_days)
        ease = float(current_ease_factor)
        new_lapses = lapses

        if repetitions == 0:
            # Первый ответ: интервалы по таблице, lapses не растёт.
            interval = self.initial_interval(effective_rating)
            stage = "relearning" if effective_rating == RATING_AGAIN else "review"
        else:
            if effective_rating == RATING_AGAIN:
                new_lapses += 1
                ease = max(MIN_EASE_FACTOR, ease - EASE_AGAIN_DROP)
                interval = RELEARNING_INTERVAL_DAYS
                stage = "relearning"
            elif effective_rating == RATING_HARD:
                ease = max(MIN_EASE_FACTOR, ease - EASE_HARD_DROP)
                interval = max(RELEARNING_INTERVAL_DAYS, interval * HARD_INTERVAL_FACTOR)
                stage = "relearning" if current_stage == "relearning" else "review"
            elif effective_rating == RATING_GOOD:
                interval = interval * ease
                stage = "review"
            elif effective_rating == RATING_EASY:
                ease = min(MAX_EASE_FACTOR, ease + EASE_EASY_RISE)
                interval = interval * ease * EASY_INTERVAL_BONUS
                stage = "review"
            else:  # неизвестная оценка — консервативно как Good
                interval = interval * ease
                stage = "review"

        interval = max(0.0, min(interval, MAX_INTERVAL_DAYS))
        ease = max(MIN_EASE_FACTOR, min(ease, MAX_EASE_FACTOR))

        return ScheduleUpdate(
            interval_days=round(interval, 6),
            ease_factor=round(ease, 4),
            stage=stage,
            repetitions=repetitions + 1,
            lapses=new_lapses,
            due_at=self.clock.add_interval(interval).isoformat(timespec="seconds"),
        )

    def to_dict(self, update: ScheduleUpdate) -> dict[str, Any]:
        return {
            "interval_days": update.interval_days,
            "ease_factor": update.ease_factor,
            "stage": update.stage,
            "repetitions": update.repetitions,
            "lapses": update.lapses,
            "due_at": update.due_at,
        }
