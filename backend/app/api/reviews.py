"""Review API (Фаза 5): /api/reviews.

- GET    /summary                    — сводка (due/overdue/completed_today/next_due);
- GET    /queue?limit=&skill_id=&lesson_id= — очередь без answer key;
- GET    /{review_item_id}           — спецификация вопроса без answer key;
- POST   /{review_item_id}/submit    — проверка ответа + расписание + evidence;
- POST   /{review_item_id}/skip      — пропуск (без отрицательного evidence);
- GET    /history?limit=             — краткая история попыток.

Вся логика (очередь, интервалы, оценка, evidence) — в Python backend.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.reviews.answer import (
    InvalidAnswerError,
    InvalidRatingError,
    ReviewAnswerService,
    ReviewNotFoundError,
    ReviewSuspendedError,
)
from app.services.reviews.queue import ReviewQueueService

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_review_queue_service() -> ReviewQueueService:
    return ReviewQueueService()


def get_review_answer_service() -> ReviewAnswerService:
    return ReviewAnswerService()


QueueDep = Annotated[ReviewQueueService, Depends(get_review_queue_service)]
AnswerDep = Annotated[ReviewAnswerService, Depends(get_review_answer_service)]


class SubmitRequest(BaseModel):
    answer: Any
    user_rating: Literal["Again", "Hard", "Good", "Easy"]
    hints_used: int = Field(default=0, ge=0, le=10)
    response_time_ms: int | None = Field(default=None, ge=0)
    dedup_key: str | None = Field(default=None, max_length=200)


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ReviewNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ReviewSuspendedError):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, (InvalidRatingError, InvalidAnswerError)):
        return HTTPException(status_code=422, detail=str(exc))
    return HTTPException(status_code=500, detail="Внутренняя ошибка повторения")


@router.get("/summary")
def review_summary(
    service: QueueDep,
    lesson_id: str | None = Query(default=None),
) -> dict[str, Any]:
    return service.summary(lesson_id=lesson_id)


@router.get("/queue")
def review_queue(
    service: QueueDep,
    limit: int = Query(default=10, ge=1, le=30),
    skill_id: str | None = Query(default=None),
    lesson_id: str | None = Query(default=None),
) -> dict[str, Any]:
    return service.queue(limit=limit, skill_id=skill_id, lesson_id=lesson_id)


@router.get("/history")
def review_history(
    service: QueueDep,
    limit: int = Query(default=20, ge=1, le=50),
) -> dict[str, Any]:
    return service.history(limit=limit)


@router.get("/{review_item_id}")
def review_item(review_item_id: int, service: AnswerDep) -> dict[str, Any]:
    try:
        return service.get_item(review_item_id)
    except ReviewNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{review_item_id}/submit")
def review_submit(
    review_item_id: int, payload: SubmitRequest, service: AnswerDep
) -> dict[str, Any]:
    try:
        return service.submit(
            review_item_id,
            answer=payload.answer,
            user_rating=payload.user_rating,
            hints_used=payload.hints_used,
            response_time_ms=payload.response_time_ms,
            dedup_key=payload.dedup_key,
        )
    except Exception as exc:  # noqa: BLE001 — единая карта ошибок сервиса
        raise _http_error(exc) from exc


@router.post("/{review_item_id}/skip")
def review_skip(review_item_id: int, service: AnswerDep) -> dict[str, Any]:
    try:
        return service.skip(review_item_id)
    except Exception as exc:  # noqa: BLE001
        raise _http_error(exc) from exc
