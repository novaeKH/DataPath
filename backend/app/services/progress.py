"""Сервис прогресса пользователя (Фаза 4).

Оркестрирует сохранение учебных событий и обновление модели знаний:

- lesson_progress: текущая сцена, завершённые сцены, завершение урока;
- lab_attempts: идемпотентное сохранение результата лаборатории;
- case_attempts: попытки кейсов (через CaseService);
- learning_events + skill_assessments — через KnowledgeModelService;
- рекомендации Today: продолжить урок, следующий урок маршрута,
  слабые темы (только при достаточном evidence), рекомендуемый кейс.

Вся логика — на backend; frontend только отображает результаты API.
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import (
    ContentItem,
    LabAttempt,
    LearningEvent,
    LessonProgress,
    ReviewItem,
    SkillAssessment,
)
from app.db.session import SessionLocal
from app.services.knowledge_model import (
    KnowledgeModelService,
    is_weak_skill,
)
from app.services.labs.registry import LabRegistry, get_default_registry
from app.services.reviews.dynamic import template_id

# Порядок ежедневного маршрута: фундамент прежде моделей, затем специализации.
# Неизвестные курсы остаются доступны и идут после явно заданных направлений.
COURSE_PRIORITY = (
    "course.python-ds",
    "course.math-ds",
    "course.data-analysis",
    "course.data-tools",
    "course.classic-ml",
    "course.deep-learning",
    "course.nlp",
    "course.llm-rag",
    "course.mlops",
)


def _stable_hash(*parts: Any) -> str:
    """Детерминированный hash для dedup_key."""
    payload = json.dumps(list(parts), ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


class ProgressService:
    """Чтение и запись прогресса (один локальный пользователь)."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
        registry: LabRegistry | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.registry = registry or get_default_registry()
        self.knowledge = KnowledgeModelService()

    # --- Вспомогательное ---

    def _lesson(self, db, lesson_id: str) -> ContentItem | None:
        item = db.get(ContentItem, lesson_id)
        if item is None or item.type != "lesson":
            return None
        return item

    def _skill_ids_for_lesson(self, db, lesson_id: str) -> list[str]:
        item = db.get(ContentItem, lesson_id)
        if item is None:
            return []
        return list(item.skill_ids or [])

    # --- Сцены и уроки ---

    @staticmethod
    def _schedule_self_assessment_review(db, lesson: ContentItem, outcome: str, now: str) -> None:
        intervals = {"self_confident": 4.0, "self_review": 1.0, "self_uncertain": 0.25}
        interval = intervals.get(outcome)
        if interval is None:
            return
        dynamic_id = template_id(lesson.id, "concept")
        item = db.scalar(select(ReviewItem).where(ReviewItem.template_id == dynamic_id))
        due_at = (datetime.fromisoformat(now) + timedelta(days=interval)).isoformat(
            timespec="seconds"
        )
        if item is None:
            skill_id = next(iter(lesson.skill_ids or []), f"course.{lesson.course_id or 'general'}")
            db.add(
                ReviewItem(
                    template_id=dynamic_id,
                    primary_skill_id=skill_id,
                    source_type="lesson",
                    source_id=lesson.id,
                    stage="relearning" if outcome == "self_uncertain" else "learning",
                    status="active",
                    due_at=due_at,
                    interval_days=interval,
                    ease_factor=2.5,
                    repetitions=0,
                    lapses=0,
                    created_at=now,
                    updated_at=now,
                )
            )
            return
        if item.due_at > due_at:
            item.due_at = due_at
            item.interval_days = interval
        if outcome == "self_uncertain":
            item.stage = "relearning"
        item.updated_at = now

    def complete_scene(
        self,
        lesson_id: str,
        scene_id: str,
        *,
        skill_id: str | None = None,
        scene_type: str | None = None,
        outcome: str = "completed",
    ) -> dict[str, Any]:
        """Сохраняет прохождение сцены и текущую позицию.

        Завершённая сцена — слабый сигнал по теории (просмотр материала).
        scene_id и lesson_id валидируются вызывающим API.
        """
        with self.session_factory() as db:
            progress = db.get(LessonProgress, lesson_id)
            now = datetime.now(UTC).isoformat(timespec="seconds")
            if progress is None:
                progress = LessonProgress(
                    lesson_id=lesson_id,
                    current_scene_id=scene_id,
                    completed_scenes=[],
                    started_at=now,
                    updated_at=now,
                )
                db.add(progress)
            progress.current_scene_id = scene_id
            if scene_id not in (progress.completed_scenes or []):
                progress.completed_scenes = [*(progress.completed_scenes or []), scene_id]
            progress.updated_at = now

            lesson = self._lesson(db, lesson_id)
            if lesson is not None:
                self._schedule_self_assessment_review(db, lesson, outcome, now)

            dedup_key = f"scene:{lesson_id}:{scene_id}"
            existing_event = db.scalar(
                select(LearningEvent).where(LearningEvent.dedup_key == dedup_key)
            )
            event = self.knowledge.record_event(
                db,
                event_type="scene_complete",
                source_type="lesson",
                source_id=lesson_id,
                skill_id=skill_id,
                axis="theory",
                outcome=outcome,
                metadata={"scene_id": scene_id, "scene_type": scene_type},
                dedup_key=dedup_key,
            )
            if skill_id and existing_event is None:
                self.knowledge.apply_event_evidence(
                    db,
                    event_type="scene_complete",
                    skill_id=skill_id,
                    success={
                        "correct": 1.0,
                        "incorrect": 0.0,
                        "self_confident": 0.7,
                        "self_review": 0.45,
                        "self_uncertain": 0.25,
                        "reflection": 0.5,
                    }.get(outcome, 0.6),
                )
            db.commit()
            return {
                "lesson_id": lesson_id,
                "scene_id": scene_id,
                "current_scene_id": progress.current_scene_id,
                "completed_scenes": progress.completed_scenes,
                "started_at": progress.started_at,
                "completed_at": progress.completed_at,
                "event_id": event.id,
                "deduplicated": event.created_at != now and False,  # не используется
            }

    def complete_lesson(self, lesson_id: str) -> dict[str, Any]:
        """Завершает урок: сохраняет позицию и слабое evidence по теории.

        Не присваивает высокий mastery — только сигнал «урок пройден».
        """
        with self.session_factory() as db:
            item = self._lesson(db, lesson_id)
            if item is None:
                raise ValueError(f"Урок {lesson_id!r} не найден")
            now = datetime.now(UTC).isoformat(timespec="seconds")
            progress = db.get(LessonProgress, lesson_id)
            if progress is None:
                progress = LessonProgress(
                    lesson_id=lesson_id,
                    current_scene_id=None,
                    completed_scenes=[],
                    started_at=now,
                    updated_at=now,
                )
                db.add(progress)
            progress.completed_at = now
            progress.updated_at = now

            skill_ids = list(item.skill_ids or [])
            results = []
            for skill_id in skill_ids:
                results.append(
                    self.knowledge.record_and_assess(
                        db,
                        event_type="lesson_complete",
                        source_type="lesson",
                        source_id=lesson_id,
                        skill_id=skill_id,
                        success=0.8,
                        outcome="completed",
                        score=0.8,
                        metadata={"lesson_id": lesson_id},
                        dedup_key=f"lesson_complete:{lesson_id}:{skill_id}",
                    )
                )
            db.commit()
            return {
                "lesson_id": lesson_id,
                "completed_at": now,
                "skills": [
                    {
                        "skill_id": result.skill_id,
                        "state": result.state,
                        "state_reason": result.state_reason,
                        "evidence_count": result.evidence_count,
                    }
                    for result in results
                ],
            }

    # --- Лаборатории ---

    def record_lab(
        self,
        lab_id: str,
        parameters: dict[str, Any],
        result_summary: dict[str, Any] | None,
        *,
        score: float | None = None,
        lesson_id: str | None = None,
        skill_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """Сохраняет фактический результат лаборатории (идемпотентно).

        Расчёт результата не дублируется: API принимает уже вычисленный
        результат Lab API. Повторная отправка с теми же параметрами
        не создаёт дубликат и не начисляет evidence повторно.
        """
        with self.session_factory() as db:
            from datetime import datetime

            now = datetime.now(UTC).isoformat(timespec="seconds")
            if score is None:
                score = 1.0  # лаборатория выполнена (сам факт запуска с результатом)
            score = max(0.0, min(1.0, float(score)))

            dedup = _stable_hash("lab", lab_id, parameters, score)
            existing = db.scalar(select(LabAttempt).where(LabAttempt.dedup_key == dedup))
            if existing is not None:
                return {
                    "lab_id": lab_id,
                    "lesson_id": existing.lesson_id,
                    "score": existing.score,
                    "created_at": existing.created_at,
                    "deduplicated": True,
                    "evidence": existing.evidence,
                }

            if skill_ids is None:
                # Навыки из урока, к которому привязана лаборатория.
                skill_ids = []
                lab = self.registry.get(lab_id)
                lesson_ids = lab.lesson_ids if lab else []
                for lid in lesson_ids:
                    skill_ids.extend(self._skill_ids_for_lesson(db, lid))
                skill_ids = list(dict.fromkeys(skill_ids))

            evidence = []
            for skill_id in skill_ids:
                result = self.knowledge.record_and_assess(
                    db,
                    event_type="lab_recorded",
                    source_type="lab",
                    source_id=lab_id,
                    skill_id=skill_id,
                    success=score,
                    outcome="completed" if score >= 0.6 else "partial",
                    score=score,
                    metadata={
                        "lesson_id": lesson_id,
                        "parameters": parameters,
                        "result_summary": result_summary,
                    },
                    dedup_key=f"lab:{lab_id}:{skill_id}:{dedup}",
                )
                evidence.append(
                    {
                        "skill_id": skill_id,
                        "state": result.state,
                        "evidence_count": result.evidence_count,
                    }
                )

            attempt = LabAttempt(
                lab_id=lab_id,
                lesson_id=lesson_id,
                parameters=parameters,
                result_summary=result_summary,
                score=score,
                evidence=evidence,
                dedup_key=dedup,
                created_at=now,
            )
            db.add(attempt)
            db.commit()
            return {
                "lab_id": lab_id,
                "lesson_id": lesson_id,
                "score": score,
                "created_at": now,
                "deduplicated": False,
                "evidence": evidence,
            }

    # --- Чтение прогресса ---

    def lesson_progress(self, lesson_id: str) -> dict[str, Any] | None:
        with self.session_factory() as db:
            progress = db.get(LessonProgress, lesson_id)
            if progress is None:
                return None
            return {
                "lesson_id": lesson_id,
                "current_scene_id": progress.current_scene_id,
                "completed_scenes": progress.completed_scenes or [],
                "started_at": progress.started_at,
                "completed_at": progress.completed_at,
                "updated_at": progress.updated_at,
            }

    def lesson_progress_map(self, db) -> dict[str, LessonProgress]:
        return {row.lesson_id: row for row in db.scalars(select(LessonProgress)).all()}

    # --- Сводка ---

    def summary(self) -> dict[str, Any]:
        with self.session_factory() as db:
            lessons = list(db.scalars(select(LessonProgress)).all())
            started = [p for p in lessons if p.completed_at is None]
            completed = [p for p in lessons if p.completed_at is not None]
            lab_events = db.scalars(
                select(LearningEvent).where(LearningEvent.event_type == "lab_recorded")
            ).all()
            lab_ids = sorted({e.source_id for e in lab_events})
            case_events = db.scalars(
                select(LearningEvent).where(LearningEvent.event_type == "case_submitted")
            ).all()
            case_ids = sorted({e.source_id for e in case_events})

            assessments = list(db.scalars(select(SkillAssessment)).all())
            distribution: dict[str, int] = {}
            for assessment in assessments:
                distribution[assessment.state] = distribution.get(assessment.state, 0) + 1

            recent_rows = db.scalars(
                select(LearningEvent).order_by(LearningEvent.created_at.desc()).limit(8)
            ).all()
            recent = [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "source_type": e.source_type,
                    "source_id": e.source_id,
                    "skill_id": e.skill_id,
                    "outcome": e.outcome,
                    "created_at": e.created_at,
                }
                for e in recent_rows
            ]

            recommendation = self._recommendation(db, started, completed, assessments)
            return {
                "lessons_started": len(started),
                "lessons_completed": len(completed),
                "labs_completed": len(lab_ids),
                "cases_completed": len(case_ids),
                "skill_distribution": distribution,
                "recent_events": recent,
                "recommended_action": recommendation,
            }

    def _recommendation(
        self,
        db,
        started: list[LessonProgress],
        completed: list[LessonProgress],
        assessments: list[SkillAssessment],
    ) -> dict[str, Any]:
        """Простое правило рекомендации: продолжить урок → следующий урок → кейс."""
        # 1. Продолжить начатый незавершённый урок.
        if started:
            lesson = started[0]
            return {
                "action": "continue_lesson",
                "lesson_id": lesson.lesson_id,
                "current_scene_id": lesson.current_scene_id,
            }
        # 2. Следующий урок маршрута.
        next_lesson = self.next_lesson()
        if next_lesson is not None:
            return {
                "action": "next_lesson",
                "lesson_id": next_lesson["id"],
                "title": next_lesson["title"],
            }
        # 3. Слабые темы или кейс.
        weak = self.weak_skills(limit=1)
        if weak:
            return {"action": "weak_skill", "skill_id": weak[0]["skill_id"]}
        return {"action": "explore", "message": "Изучите Atlas или выберите кейс в Studio."}

    def next_lesson(self) -> dict[str, Any] | None:
        """Следующий доступный урок общего DataPath-маршрута."""
        with self.session_factory() as db:
            lessons = list(
                db.scalars(
                    select(ContentItem).where(
                        ContentItem.type == "lesson",
                        ContentItem.publish.is_(True),
                    )
                ).all()
            )
            course_order = {course_id: index for index, course_id in enumerate(COURSE_PRIORITY)}
            lessons.sort(
                key=lambda lesson: (
                    course_order.get(lesson.course_id or "", len(COURSE_PRIORITY)),
                    lesson.course_id or "",
                    lesson.module_order if lesson.module_order is not None else 10**6,
                    lesson.lesson_order if lesson.lesson_order is not None else 10**6,
                    lesson.path,
                )
            )
            progresses = {p.lesson_id: p for p in db.scalars(select(LessonProgress)).all()}
            unfinished: list[ContentItem] = []
            for lesson in lessons:
                progress = progresses.get(lesson.id)
                if progress is not None and progress.completed_at is not None:
                    continue
                unfinished.append(lesson)
                lesson_prerequisites = [
                    prerequisite
                    for prerequisite in (lesson.prerequisites or [])
                    if isinstance(prerequisite, str) and prerequisite.startswith("lesson.")
                ]
                if all(
                    progresses.get(prerequisite) is not None
                    and progresses[prerequisite].completed_at is not None
                    for prerequisite in lesson_prerequisites
                ):
                    return {
                        "id": lesson.id,
                        "title": lesson.title,
                        "skills": list(lesson.skill_ids or []),
                        "estimated_minutes": lesson.estimated_minutes,
                        "course_id": lesson.course_id,
                    }
            # Защита от циклических или устаревших prerequisite-ссылок: маршрут
            # не должен полностью исчезать из Today.
            if unfinished:
                lesson = unfinished[0]
                return {
                    "id": lesson.id,
                    "title": lesson.title,
                    "skills": list(lesson.skill_ids or []),
                    "estimated_minutes": lesson.estimated_minutes,
                    "course_id": lesson.course_id,
                }
            return None

    def weak_skills(self, limit: int = 3) -> list[dict[str, Any]]:
        """Слабые темы: только при достаточном evidence (>=2 измерений).

        Пустой список — не «фиктивная аналитика», а честный ответ.
        """
        with self.session_factory() as db:
            assessments = list(db.scalars(select(SkillAssessment)).all())
            result = []
            for assessment in assessments:
                repeated = self.knowledge.repeated_errors(db, assessment.skill_id)
                if is_weak_skill(assessment.axes, assessment.evidence_count, repeated):
                    result.append(
                        {
                            "skill_id": assessment.skill_id,
                            "state": assessment.state,
                            "evidence_count": assessment.evidence_count,
                            "axes": assessment.axes,
                        }
                    )
            result.sort(key=lambda item: (item["evidence_count"], item["skill_id"]), reverse=True)
            return result[:limit]

    def skill_detail(self, skill_id: str) -> dict[str, Any] | None:
        with self.session_factory() as db:
            assessment = db.get(SkillAssessment, skill_id)
            if assessment is None:
                return None
            repeated = self.knowledge.repeated_errors(db, skill_id)
            return {
                "skill_id": skill_id,
                "state": assessment.state,
                "confidence": assessment.confidence,
                "evidence_count": assessment.evidence_count,
                "axes": assessment.axes,
                "typical_errors": self.knowledge.typical_errors(db, skill_id),
                "recent_events": self.knowledge.recent_events(db, skill_id),
                "weak": is_weak_skill(assessment.axes, assessment.evidence_count, repeated),
                "mastery_percent": self._mastery_percent(assessment.axes),
            }

    def skills_overview(self) -> list[dict[str, Any]]:
        with self.session_factory() as db:
            assessments = list(
                db.scalars(select(SkillAssessment).order_by(SkillAssessment.skill_id)).all()
            )
            result = []
            for assessment in assessments:
                repeated = self.knowledge.repeated_errors(db, assessment.skill_id)
                result.append(
                    {
                        "skill_id": assessment.skill_id,
                        "state": assessment.state,
                        "confidence": assessment.confidence,
                        "evidence_count": assessment.evidence_count,
                        "axes": assessment.axes,
                        "weak": is_weak_skill(assessment.axes, assessment.evidence_count, repeated),
                        "mastery_percent": self._mastery_percent(assessment.axes),
                    }
                )
            return result

    @staticmethod
    def _mastery_percent(axes: dict[str, Any]) -> int:
        scores = [
            float(axis.get("score", 0.0))
            for axis in (axes or {}).values()
            if axis.get("evidence_count", 0) > 0
        ]
        return round(100 * sum(scores) / len(scores)) if scores else 0

    def today(self) -> dict[str, Any]:
        """Экран Today: главная карточка, маршрут, слабые темы, активность."""
        with self.session_factory() as db:
            lessons = list(db.scalars(select(LessonProgress)).all())
            started = [p for p in lessons if p.completed_at is None]
            completed_ids = {p.lesson_id for p in lessons if p.completed_at is not None}

            # 1. Продолжить незавершённый урок.
            continue_lesson = None
            if started:
                progress = started[0]
                item = db.get(ContentItem, progress.lesson_id)
                continue_lesson = {
                    "lesson_id": progress.lesson_id,
                    "title": item.title if item else progress.lesson_id,
                    "current_scene_id": progress.current_scene_id,
                    "completed_scenes": progress.completed_scenes or [],
                    "started_at": progress.started_at,
                    "estimated_minutes": item.estimated_minutes if item else None,
                }

            # 2. Следующий урок маршрута.
            next_lesson = self.next_lesson()

            # 3. Слабые темы (только с достаточным evidence).
            weak = self.weak_skills(limit=3)

            # 4. Недавняя активность.
            recent_rows = db.scalars(
                select(LearningEvent).order_by(LearningEvent.created_at.desc()).limit(6)
            ).all()
            recent_activity = [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "source_type": e.source_type,
                    "source_id": e.source_id,
                    "skill_id": e.skill_id,
                    "outcome": e.outcome,
                    "created_at": e.created_at,
                }
                for e in recent_rows
            ]

            # 5. Рекомендуемый кейс (если есть не пройденный).
            suggested_case = self._suggested_case(db, completed_ids)

            # 6. Сводка прогресса.
            lab_events = db.scalars(
                select(LearningEvent).where(LearningEvent.event_type == "lab_recorded")
            ).all()
            case_events = db.scalars(
                select(LearningEvent).where(LearningEvent.event_type == "case_submitted")
            ).all()
            assessments = list(db.scalars(select(SkillAssessment)).all())
            distribution: dict[str, int] = {}
            for assessment in assessments:
                distribution[assessment.state] = distribution.get(assessment.state, 0) + 1

            return {
                "continue_lesson": continue_lesson,
                "next_lesson": next_lesson,
                "weak_skills": weak,
                "recent_activity": recent_activity,
                "suggested_case": suggested_case,
                "progress_summary": {
                    "lessons_started": len(lessons),
                    "lessons_completed": len(completed_ids),
                    "labs_completed": len({e.source_id for e in lab_events}),
                    "cases_completed": len({e.source_id for e in case_events}),
                    "skill_distribution": distribution,
                },
            }

    def _suggested_case(self, db, completed_lesson_ids: set[str]) -> dict[str, Any] | None:
        """Кейс, связанный с текущим прогрессом (если ещё не пройден)."""
        from app.services.cases.registry import DEFAULT_CASE_REGISTRY

        completed_cases = {
            e.source_id
            for e in db.scalars(
                select(LearningEvent).where(LearningEvent.event_type == "case_submitted")
            ).all()
        }
        for case_id in DEFAULT_CASE_REGISTRY.ids():
            if case_id in completed_cases:
                continue
            spec = DEFAULT_CASE_REGISTRY.spec(case_id)
            if spec is None:
                continue
            return {"case_id": case_id, "title": spec["title"]}
        return None
