"""ReviewQueueService (Фаза 5).

Отвечает за:
- ленивый идемпотентный bootstrap: из существующего прогресса Фазы 4
  (completed lessons, lab attempts, case attempts) создаются отсутствующие
  review items; повторные вызовы ничего не дублируют;
- формирование очереди с приоритетом:
  1. overdue + needs_attention (достаточное evidence — состояние уже это гарантирует);
  2. overdue;
  3. due today;
  4. более низкая confidence;
  5. более ранний due_at;
- summary для Today и экрана Review;
- историю попыток.

Никакой логики очереди во frontend: frontend только отображает.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import (
    CaseAttempt,
    ContentItem,
    LabAttempt,
    LessonProgress,
    ReviewAttempt,
    ReviewItem,
    SkillAssessment,
)
from app.db.session import SessionLocal
from app.services.knowledge_model import STATE_NEEDS_ATTENTION
from app.services.reviews.clock import ReviewClock, parse_utc
from app.services.reviews.dynamic import KINDS, build_dynamic_template, template_id
from app.services.reviews.registry import ReviewTemplate, ReviewTemplateRegistry
from app.services.reviews.templates import get_default_registry

DEFAULT_LIMIT = 10
MIN_LIMIT = 1
MAX_LIMIT = 30
# Лаборатория считается «успешной», если результат сохранён с score >= 0.6.
LAB_SUCCESS_SCORE = 0.6


class ReviewQueueService:
    """Чтение очереди повторений и bootstrap review items."""

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

    # --- Bootstrap (ленивый, идемпотентный) ---

    def _template_triggered(self, db, template: ReviewTemplate) -> bool:
        """Активирован ли шаблон существующим прогрессом."""
        if template.source_type == "lesson":
            progress = db.get(LessonProgress, template.source_id)
            return progress is not None and progress.completed_at is not None
        if template.source_type == "lab":
            row = db.scalar(
                select(LabAttempt).where(
                    LabAttempt.lab_id == template.source_id,
                    LabAttempt.score >= LAB_SUCCESS_SCORE,
                )
            )
            return row is not None
        if template.source_type == "case":
            row = db.scalar(select(CaseAttempt).where(CaseAttempt.case_id == template.source_id))
            return row is not None
        return False

    def bootstrap(self, db) -> int:
        """Создаёт отсутствующие review items. Возвращает число созданных.

        Идемпотентность: template_id уникален — повторный вызов ничего
        не создаёт. Старые learning events не изменяются.
        """
        existing_ids = set(db.scalars(select(ReviewItem.template_id)).all())
        created = 0
        now = self.clock.now_iso()
        registered_templates = self.registry.all()
        covered_lesson_ids = {
            template.source_lesson_id
            for template in registered_templates
            if template.source_lesson_id
        }
        for template in registered_templates:
            if template.id in existing_ids:
                continue
            if not self._template_triggered(db, template):
                continue
            db.add(
                ReviewItem(
                    template_id=template.id,
                    primary_skill_id=template.primary_skill,
                    source_type=template.source_type,
                    source_id=template.source_id,
                    stage="learning",
                    status="active",
                    due_at=now,  # новый элемент due сразу после активации
                    interval_days=0.0,
                    ease_factor=2.5,
                    repetitions=0,
                    lapses=0,
                    created_at=now,
                    updated_at=now,
                )
            )
            existing_ids.add(template.id)
            created += 1
        completed_lessons = db.scalars(
            select(LessonProgress).where(LessonProgress.completed_at.is_not(None))
        ).all()
        for progress in completed_lessons:
            lesson = db.get(ContentItem, progress.lesson_id)
            if lesson is None or lesson.type != "lesson" or not lesson.publish:
                continue
            if lesson.id in covered_lesson_ids:
                continue
            skill = next(iter(lesson.skill_ids or []), f"course.{lesson.course_id or 'general'}")
            for kind in KINDS:
                dynamic_id = template_id(lesson.id, kind)
                if dynamic_id in existing_ids:
                    continue
                db.add(
                    ReviewItem(
                        template_id=dynamic_id,
                        primary_skill_id=skill,
                        source_type="lesson",
                        source_id=lesson.id,
                        stage="learning",
                        status="active",
                        due_at=now,
                        interval_days=0.0,
                        ease_factor=2.5,
                        repetitions=0,
                        lapses=0,
                        created_at=now,
                        updated_at=now,
                    )
                )
                existing_ids.add(dynamic_id)
                created += 1
        if created:
            db.flush()
        return created

    # --- Вспомогательное ---

    def _item_payload(
        self,
        item: ReviewItem,
        template: ReviewTemplate,
        assessment: SkillAssessment | None,
    ) -> dict[str, Any]:
        """Безопасный payload элемента очереди (без answer key)."""
        return {
            "id": item.id,
            "template_id": item.template_id,
            "title": template.title,
            "prompt": template.prompt,
            "question_type": template.question_type,
            "options": list(template.options),
            "source_content_id": template.source_content_id,
            "source_lesson_id": template.source_lesson_id,
            "source_type": template.source_type,
            "source_id": template.source_id,
            "primary_skill_id": item.primary_skill_id,
            "difficulty": template.difficulty,
            "objective": template.is_objective(),
            "stage": item.stage,
            "status": item.status,
            "due_at": item.due_at,
            "interval_days": item.interval_days,
            "ease_factor": item.ease_factor,
            "repetitions": item.repetitions,
            "lapses": item.lapses,
            "skill_state": assessment.state if assessment else None,
            "skill_confidence": assessment.confidence if assessment else None,
            "skill_evidence_count": assessment.evidence_count if assessment else None,
        }

    def _template_for(self, db, item: ReviewItem) -> ReviewTemplate | None:
        return self.registry.get(item.template_id) or build_dynamic_template(db, item.template_id)

    def _lesson_id_of(self, db, item: ReviewItem) -> str:
        template = self._template_for(db, item)
        return template.source_lesson_id if template else ""

    def overdue_counts_by_lesson(self) -> dict[str, int]:
        """lesson_id → число просроченных активных повторений (для Atlas)."""
        with self.session_factory() as db:
            self.bootstrap(db)
            db.commit()
            start_iso = self.clock.start_of_day_utc().isoformat(timespec="seconds")
            counts: dict[str, int] = {}
            rows = db.scalars(
                select(ReviewItem).where(
                    ReviewItem.status == "active", ReviewItem.due_at < start_iso
                )
            ).all()
            for row in rows:
                lesson_id = self._lesson_id_of(db, row)
                if lesson_id:
                    counts[lesson_id] = counts.get(lesson_id, 0) + 1
            return counts

    # --- Summary ---

    def summary(self, lesson_id: str | None = None) -> dict[str, Any]:
        """Сводка для Today и экрана Review."""
        with self.session_factory() as db:
            self.bootstrap(db)
            db.commit()
            now = self.clock.now()
            start, end = self.clock.day_bounds(now)
            start_iso = start.isoformat(timespec="seconds")
            end_iso = end.isoformat(timespec="seconds")

            items = list(db.scalars(select(ReviewItem).where(ReviewItem.status == "active")).all())
            if lesson_id:
                items = [item for item in items if self._lesson_id_of(db, item) == lesson_id]

            due_items = [item for item in items if item.due_at <= end_iso]
            overdue_items = [item for item in items if item.due_at < start_iso]

            completed_today = len(
                db.scalars(
                    select(ReviewAttempt.id).where(ReviewAttempt.created_at >= start_iso)
                ).all()
            )

            future = [item for item in items if item.due_at > end_iso]
            next_due_at = min((item.due_at for item in future), default=None)

            stages: dict[str, int] = {}
            for item in items:
                stages[item.stage] = stages.get(item.stage, 0) + 1

            return {
                "due_count": len(due_items),
                "overdue_count": len(overdue_items),
                "completed_today": completed_today,
                "next_due_at": next_due_at,
                "active_items": len(items),
                "stages": stages,
                "recommendation": self._recommendation(due_items, overdue_items, next_due_at),
            }

    @staticmethod
    def _recommendation(
        due_items: list[ReviewItem],
        overdue_items: list[ReviewItem],
        next_due_at: str | None,
    ) -> str:
        if overdue_items:
            return (
                f"Просрочено повторений: {len(overdue_items)}. Начните короткую "
                "review-сессию, чтобы вернуть материал."
            )
        if due_items:
            return (
                f"На сегодня запланировано повторений: {len(due_items)}. "
                "Короткая сессия закрепит материал."
            )
        if next_due_at:
            return f"На сегодня всё. Следующее повторение: {next_due_at}."
        return "Пройдите уроки — повторения появятся здесь."

    # --- Очередь ---

    def queue(
        self,
        *,
        limit: int = DEFAULT_LIMIT,
        skill_id: str | None = None,
        lesson_id: str | None = None,
    ) -> dict[str, Any]:
        """Очередь готовых к повторению элементов (без answer key)."""
        limit = max(MIN_LIMIT, min(MAX_LIMIT, int(limit)))
        with self.session_factory() as db:
            self.bootstrap(db)
            db.commit()
            now = self.clock.now()
            start, end = self.clock.day_bounds(now)
            end_iso = end.isoformat(timespec="seconds")

            items = list(
                db.scalars(
                    select(ReviewItem)
                    .where(ReviewItem.status == "active", ReviewItem.due_at <= end_iso)
                    .order_by(ReviewItem.due_at)
                ).all()
            )
            if lesson_id:
                items = [item for item in items if self._lesson_id_of(db, item) == lesson_id]
            if skill_id:
                items = [item for item in items if item.primary_skill_id == skill_id]

            assessments = {a.skill_id: a for a in db.scalars(select(SkillAssessment)).all()}
            candidates = []
            for item in items:
                template = self._template_for(db, item)
                if template is None:
                    continue
                assessment = assessments.get(item.primary_skill_id)
                priority = self._priority(item, assessment, start)
                candidates.append((priority, item, template, assessment))
            candidates.sort(key=lambda row: row[0])

            queue_items = [
                self._item_payload(item, template, assessment)
                for _, item, template, assessment in candidates[:limit]
            ]

            all_due = len(items)
            future = db.scalars(
                select(ReviewItem).where(ReviewItem.status == "active", ReviewItem.due_at > end_iso)
            ).all()
            next_due_at = min((item.due_at for item in future), default=None)
            overdue_count = sum(
                1 for item in items if item.due_at < start.isoformat(timespec="seconds")
            )

            return {
                "items": queue_items,
                "returned": len(queue_items),
                "due_count": all_due,
                "overdue_count": overdue_count,
                "next_due_at": next_due_at,
                "limit": limit,
            }

    def _priority(
        self,
        item: ReviewItem,
        assessment: SkillAssessment | None,
        start_of_day: datetime,
    ) -> tuple[int, float, str]:
        """Приоритет: чем меньше кортеж, тем раньше элемент в очереди."""
        due = parse_utc(item.due_at)
        overdue = due < start_of_day
        needs_attention = (
            overdue and assessment is not None and assessment.state == STATE_NEEDS_ATTENTION
        )
        if needs_attention:
            bucket = 0
        elif overdue:
            bucket = 1
        else:
            bucket = 2
        confidence = assessment.confidence if assessment is not None else 0.0
        return (bucket, confidence, item.due_at)

    # --- История ---

    def history(self, limit: int = 20) -> dict[str, Any]:
        """Краткая история попыток (последние)."""
        limit = max(1, min(50, int(limit)))
        with self.session_factory() as db:
            rows = db.scalars(
                select(ReviewAttempt).order_by(ReviewAttempt.id.desc()).limit(limit)
            ).all()
            items = {
                item.id: item
                for item in db.scalars(
                    select(ReviewItem).where(
                        ReviewItem.id.in_([row.review_item_id for row in rows])
                    )
                ).all()
            }
            history = []
            for row in rows:
                item = items.get(row.review_item_id)
                template = self._template_for(db, item) if item else None
                history.append(
                    {
                        "id": row.id,
                        "review_item_id": row.review_item_id,
                        "template_id": item.template_id if item else None,
                        "title": template.title if template else None,
                        "objective_score": row.objective_score,
                        "is_correct": row.is_correct,
                        "user_rating": row.user_rating,
                        "effective_rating": row.effective_rating,
                        "hints_used": row.hints_used,
                        "deduplicated": False,
                        "created_at": row.created_at,
                    }
                )
            return {"attempts": history, "count": len(history)}
