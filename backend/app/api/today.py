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

from app.services.practice import PracticeService
from app.services.progress import ProgressService
from app.services.reviews.queue import ReviewQueueService
from app.services.roadmap import RoadmapService

router = APIRouter(prefix="/today", tags=["today"])


def get_progress_service() -> ProgressService:
    return ProgressService()


def get_review_queue_service() -> ReviewQueueService:
    return ReviewQueueService()


def get_practice_service() -> PracticeService:
    return PracticeService()


ProgressDep = Annotated[ProgressService, Depends(get_progress_service)]
ReviewQueueDep = Annotated[ReviewQueueService, Depends(get_review_queue_service)]
PracticeDep = Annotated[PracticeService, Depends(get_practice_service)]


@router.get("")
def today(service: ProgressDep, reviews: ReviewQueueDep, practice: PracticeDep) -> dict[str, Any]:
    data = service.today()
    summary = reviews.summary()
    data["review_summary"] = summary
    data["due_reviews"] = summary["due_count"]
    data["overdue_reviews"] = summary["overdue_count"]
    data["next_review_at"] = summary["next_due_at"]
    data["review_action"] = "review_session" if summary["due_count"] > 0 else None
    data["suggested_practice"] = practice.recommendation()
    roadmap = RoadmapService(session_factory=service.session_factory).build()
    data["roadmap_context"] = {
        "current_stage": roadmap["current_stage"],
        "current_lesson": roadmap["current_lesson"],
        "completed_lessons": roadmap["completed_lessons"],
        "total_lessons": roadmap["total_lessons"],
    }
    return data
