"""Интеграционная проверка Фазы 5 на реальном каталоге (временная БД).

Прогон: alembic upgrade → sync vault → завершить реальный урок →
bootstrap очереди → submit wrong/correct → dedup → history → today.
"""

from __future__ import annotations

import os

os.environ["DATAPATH_DATABASE_URL"] = "sqlite:///./data/review_integration_test.db"

from app.core.config import get_settings  # noqa: E402
from app.db.models import LearningEvent, SkillAssessment  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.services.progress import ProgressService  # noqa: E402
from app.services.reviews.answer import ReviewAnswerService  # noqa: E402
from app.services.reviews.clock import ReviewClock  # noqa: E402
from app.services.reviews.queue import ReviewQueueService  # noqa: E402
from app.services.reviews.registry import RATING_GOOD  # noqa: E402
from app.services.reviews.templates import DEFAULT_REVIEW_REGISTRY  # noqa: E402
from sqlalchemy import select  # noqa: E402

settings = get_settings()
clock = ReviewClock(settings.timezone)

progress = ProgressService(settings=settings, session_factory=SessionLocal)
queue_service = ReviewQueueService(
    settings=settings, session_factory=SessionLocal, registry=DEFAULT_REVIEW_REGISTRY, clock=clock
)
answer_service = ReviewAnswerService(
    settings=settings, session_factory=SessionLocal, registry=DEFAULT_REVIEW_REGISTRY, clock=clock
)

LESSON = "lesson.classic-ml.trees.tree"

# 1. Новый пользователь: reviews отсутствуют.
summary = queue_service.summary()
assert summary["active_items"] == 0, summary
print("PASS 1. Новый пользователь: reviews отсутствуют")

# 2. Завершение реальных уроков создаёт review items.
result = progress.complete_lesson(LESSON)
assert result["completed_at"], result
progress.complete_lesson("lesson.classic-ml.trees.forest")
summary = queue_service.summary()
assert summary["active_items"] >= 2, summary
print(f"PASS 2. Уроки завершены, активных повторений: {summary['active_items']}")

# 3. Очередь без answer key.
q = queue_service.queue(limit=10)
assert q["items"], q
assert all("answer_spec" not in item and "correct" not in item for item in q["items"])
print(f"PASS 3. Очередь: {len(q['items'])} элементов, answer key отсутствует")

# 4. Неправильный ответ → effective Again (объективно проверяемый элемент).
objective_items = [i for i in q["items"] if i["objective"]]
assert len(objective_items) >= 2, q["items"]
first = objective_items[0]
bad = answer_service.submit(
    first["id"], answer=999999, user_rating=RATING_GOOD, dedup_key="int-bad"
)
assert bad["is_correct"] is False
assert bad["effective_rating"] == "Again", bad["effective_rating"]
assert bad["stage"] == "relearning"
print("PASS 4. Неправильный ответ → Again, stage=relearning")

# 5. Правильный ответ на другом review → Good, интервал 3 дня.
second = next(i for i in objective_items if i["id"] != first["id"])
template = DEFAULT_REVIEW_REGISTRY.get(second["template_id"])
assert template is not None
answer = template.answer_spec["correct"]
good = answer_service.submit(
    second["id"], answer=answer, user_rating=RATING_GOOD, dedup_key="int-good"
)
assert good["is_correct"] is True
assert good["effective_rating"] == RATING_GOOD
assert good["interval_days"] == 3.0, good["interval_days"]
print(
    "PASS 5. Правильный ответ → Good, interval="
    f"{good['interval_days']} дн, next_due={good['next_due_at']}"
)

# 6. Dedup: повторная отправка не создаёт вторую попытку.
dup = answer_service.submit(
    second["id"], answer=answer, user_rating=RATING_GOOD, dedup_key="int-good"
)
assert dup["deduplicated"] is True
assert dup["attempt_id"] == good["attempt_id"]
print("PASS 6. Повторная отправка → deduplicated=True")

# 7. History содержит попытки.
hist = queue_service.history(limit=20)
assert hist["count"] >= 2, hist
print(f"PASS 7. History: {hist['count']} попыток")

# 8. Today продолжает работать (урок не скрывается).
today = progress.today()
assert today["continue_lesson"] is not None or today["next_lesson"] is not None
print("PASS 8. Today работает (continue/next урок сохранён)")

# 9. Knowledge Model обновилась.
with SessionLocal() as db:
    assessment = db.get(SkillAssessment, first["primary_skill_id"])
    assert assessment is not None and assessment.evidence_count >= 1
    events = db.scalars(
        select(LearningEvent).where(LearningEvent.event_type == "review_answer")
    ).all()
    assert len(events) >= 2, len(events)
print(f"PASS 9. Knowledge Model обновлена (review_answer events: {len(events)})")

# 10. Повторный bootstrap идемпотентен (дубликаты не создаются).
summary_again = queue_service.summary()
assert summary_again["active_items"] == summary["active_items"], (
    summary_again,
    summary,
)
print(f"PASS 10. Повторный bootstrap идемпотентен (active_items={summary_again['active_items']})")

# 11. Today API показывает reviews.
from app.main import create_app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(create_app(settings))
today = client.get("/api/today").json()
assert today["due_reviews"] > 0, today
assert today["review_action"] == "review_session", today
print(f"PASS 11. Today: due_reviews={today['due_reviews']}, review_action=review_session")

# 12. Atlas получает due state (просроченный review → review_due на узле урока).
from app.db.models import ReviewItem  # noqa: E402
from sqlalchemy import update  # noqa: E402

with SessionLocal() as db:
    db.execute(
        update(ReviewItem)
        .where(ReviewItem.template_id == second["template_id"])
        .values(due_at="2026-08-01T00:00:00+00:00")
    )
    db.commit()
atlas = client.get("/api/atlas").json()
lesson_nodes = [n for n in atlas["nodes"] if n["type"] == "lesson"]
assert any(n["review_due"] for n in lesson_nodes), [
    n for n in lesson_nodes if n.get("review_due_count")
]
due_lessons = [n["id"] for n in lesson_nodes if n["review_due"]]
print(f"PASS 12. Atlas due state: {due_lessons}")

print("\nINTEGRATION FLOW: ALL PASS")
