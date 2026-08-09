"""Three-pass learning roadmap built from the existing catalogue and progress."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.db.models import ContentItem, LessonProgress, SkillAssessment
from app.db.session import SessionLocal
from app.services.learning_modules import LearningModuleRegistry

STAGES = (
    {
        "id": "orientation",
        "number": 1,
        "title": "Ориентация и первый baseline",
        "short_title": "База",
        "description": (
            "Научиться читать данные, честно поставить задачу и собрать первый baseline."
        ),
        "depth": "orientation",
    },
    {
        "id": "understanding",
        "number": 2,
        "title": "Понимание механики",
        "short_title": "Под капотом",
        "description": "Разобраться в математике, моделях и training loop, научиться диагностике.",
        "depth": "understanding",
    },
    {
        "id": "application",
        "number": 3,
        "title": "Применение и эксплуатация",
        "short_title": "Профессиональный",
        "description": "Собирать воспроизводимые решения, оценивать и готовить их к serving.",
        "depth": "application",
    },
)

# Explicit curriculum decisions.  Unknown future modules safely land in the
# application pass until an editor assigns them deliberately.
STAGE_MODULES: dict[str, set[str]] = {
    "orientation": {
        "module.python-ds.basics",
        "module.data-analysis.numpy",
        "module.data-analysis.pandas",
        "module.data-tools.sql",
        "module.classic-ml.framing",
        "module.classic-ml.linear",
        "module.math-ds.probability",
        "module.algorithms.complexity",
        "module.algorithms.patterns",
    },
    "understanding": {
        "module.python-ds.structure",
        "module.python-ds.quality",
        "module.data-analysis.visualization",
        "module.data-analysis.eda",
        "module.data-tools.sklearn",
        "module.math-ds.linear-algebra",
        "module.math-ds.calculus",
        "module.math-ds.statistics",
        "module.classic-ml.trees",
        "module.classic-ml.unsupervised",
        "module.dl.foundations",
        "module.dl.architectures",
        "module.dl.transformers",
        "module.nlp.foundations",
        "module.nlp.sequences",
    },
}

COURSE_ORDER = {
    "course.python-ds": 10,
    "course.data-analysis": 20,
    "course.data-tools": 30,
    "course.math-ds": 40,
    "course.classic-ml": 50,
    "course.deep-learning": 60,
    "course.nlp": 70,
    "course.llm-rag": 80,
    "course.mlops": 90,
}

RELEASE_EXCLUDED_COURSES = frozenset({"course.algorithms"})


def stage_for_module(module_id: str) -> str:
    for stage_id, module_ids in STAGE_MODULES.items():
        if module_id in module_ids:
            return stage_id
    return "application"


class RoadmapService:
    def __init__(
        self,
        session_factory: sessionmaker | None = None,
        registry: LearningModuleRegistry | None = None,
    ) -> None:
        self.session_factory = session_factory or SessionLocal
        self.registry = registry or LearningModuleRegistry()

    def build(self) -> dict[str, Any]:
        with self.session_factory() as db:
            module_specs = self.registry.modules(db)
            lessons = {
                item.id: item
                for item in db.scalars(
                    select(ContentItem).where(
                        ContentItem.type == "lesson", ContentItem.publish.is_(True)
                    )
                ).all()
            }
            courses = {
                item.id: item
                for item in db.scalars(
                    select(ContentItem).where(
                        ContentItem.type == "course", ContentItem.publish.is_(True)
                    )
                ).all()
            }
            progress = {row.lesson_id: row for row in db.scalars(select(LessonProgress)).all()}
            assessments = {row.skill_id: row for row in db.scalars(select(SkillAssessment)).all()}

            stage_modules: dict[str, list[dict[str, Any]]] = defaultdict(list)
            all_items: list[dict[str, Any]] = []
            for module in module_specs:
                if module.course_id in RELEASE_EXCLUDED_COURSES:
                    continue
                lesson_rows: list[dict[str, Any]] = []
                for lesson_id in module.lesson_ids:
                    lesson = lessons.get(lesson_id)
                    if lesson is None:
                        continue
                    lesson_progress = progress.get(lesson_id)
                    status = "available"
                    if lesson_progress and lesson_progress.completed_at:
                        status = "completed"
                    elif lesson_progress:
                        status = "learning"
                    mastery_values = [
                        self._assessment_score(assessments[skill_id])
                        for skill_id in (lesson.skill_ids or [])
                        if skill_id in assessments
                    ]
                    row = {
                        "id": lesson.id,
                        "title": lesson.title,
                        "estimated_minutes": lesson.estimated_minutes,
                        "status": status,
                        "mastery_percent": (
                            round(sum(mastery_values) / len(mastery_values))
                            if mastery_values
                            else 0
                        ),
                    }
                    lesson_rows.append(row)
                    all_items.append(row)
                stage_id = stage_for_module(module.id)
                course = courses.get(module.course_id)
                stage_modules[stage_id].append(
                    {
                        "id": module.id,
                        "title": module.title,
                        "course_id": module.course_id,
                        "course_title": course.title if course else module.course_id,
                        "source_provider": module.source_provider,
                        "order": module.order,
                        "lessons": lesson_rows,
                    }
                )

            stages: list[dict[str, Any]] = []
            current: dict[str, Any] | None = next(
                (row for row in all_items if row["status"] == "learning"), None
            )
            for stage in STAGES:
                modules = sorted(
                    stage_modules.get(stage["id"], []),
                    key=lambda row: (COURSE_ORDER.get(row["course_id"], 999), row["order"]),
                )
                stage_lessons = [lesson for module in modules for lesson in module["lessons"]]
                completed = sum(lesson["status"] == "completed" for lesson in stage_lessons)
                percent = round(100 * completed / len(stage_lessons)) if stage_lessons else 0
                stage_payload = {
                    **stage,
                    "modules": modules,
                    "lesson_count": len(stage_lessons),
                    "completed_lessons": completed,
                    "progress_percent": percent,
                    "status": (
                        "completed" if percent == 100 else "learning" if completed else "available"
                    ),
                }
                stages.append(stage_payload)
                if current is None:
                    current = next(
                        (row for row in stage_lessons if row["status"] != "completed"), None
                    )

            current_stage = next(
                (
                    stage
                    for stage in stages
                    if current
                    and any(
                        current["id"] == lesson["id"]
                        for module in stage["modules"]
                        for lesson in module["lessons"]
                    )
                ),
                stages[-1] if stages else None,
            )
            return {
                "stages": stages,
                "total_lessons": len(all_items),
                "completed_lessons": sum(row["status"] == "completed" for row in all_items),
                "current_lesson": current,
                "current_stage": (
                    {
                        "id": current_stage["id"],
                        "number": current_stage["number"],
                        "title": current_stage["title"],
                        "depth": current_stage["depth"],
                        "progress_percent": current_stage["progress_percent"],
                    }
                    if current_stage
                    else None
                ),
            }

    @staticmethod
    def _assessment_score(assessment: SkillAssessment) -> int:
        scores = [
            float(axis.get("score", 0.0))
            for axis in (assessment.axes or {}).values()
            if axis.get("evidence_count", 0) > 0
        ]
        return round(100 * sum(scores) / len(scores)) if scores else 0
