"""Today API: главный экран (Фаза 4 + Фаза 5).

Правила:
1. Если есть просроченные или due reviews — главное действие — короткая
   review-сессия (review_action = "review_session").
2. Незавершённый урок остаётся доступен как второе действие (continue_lesson
   не скрывается).
3. Затем следующий урок маршрута.
4. Слабые темы только при достаточном evidence.
5. При отсутствии данных — понятный стартовый сценарий.
6. Для нового пользователя без learning evidence повторения не создаются.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.services.progress import ProgressService
from app.services.reviews.queue import ReviewQueueService

router = APIRouter(prefix="/today", tags=["today"])


def get_progress_service() -> ProgressService:
    return ProgressService()


def get_review_queue_service() -> ReviewQueueService:
    return ReviewQueueService()


ProgressDep = Annotated[ProgressService, Depends(get_progress_service)]
ReviewQueueDep = Annotated[ReviewQueueService, Depends(get_review_queue_service)]


@router.get("")
def today(service: ProgressDep, reviews: ReviewQueueDep) -> dict[str, Any]:
    data = service.today()
    summary = reviews.summary()
    data["review_summary"] = summary
    data["due_reviews"] = summary["due_count"]
    data["overdue_reviews"] = summary["overdue_count"]
    data["next_review_at"] = summary["next_due_at"]
    data["review_action"] = "review_session" if summary["due_count"] > 0 else None
    return data
