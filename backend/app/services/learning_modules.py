"""Contracts for learning-content providers.

The registry keeps Roadmap/Today independent from the markdown catalogue.  A
future AlgoPath adapter can publish its own topics and attempts through the
same small surface without pretending that an algorithm problem is a lesson.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ContentItem


@dataclass(frozen=True)
class LearningModule:
    id: str
    title: str
    course_id: str
    order: int
    source_provider: str
    lesson_ids: tuple[str, ...]


class LearningModuleProvider(Protocol):
    """Read-only provider contract used by the learning-path layer."""

    provider_id: str

    def modules(self, db: Session) -> list[LearningModule]: ...


class ContentLearningModuleProvider:
    """Adapter for the current SQLite content catalogue."""

    provider_id = "datapath-content"

    def modules(self, db: Session) -> list[LearningModule]:
        modules = list(
            db.scalars(
                select(ContentItem)
                .where(ContentItem.type == "module", ContentItem.publish.is_(True))
                .order_by(ContentItem.course_id, ContentItem.module_order, ContentItem.path)
            ).all()
        )
        lessons = list(
            db.scalars(
                select(ContentItem)
                .where(ContentItem.type == "lesson", ContentItem.publish.is_(True))
                .order_by(ContentItem.module_order, ContentItem.lesson_order, ContentItem.path)
            ).all()
        )
        by_module: dict[str, list[str]] = {}
        for lesson in lessons:
            if lesson.module_id:
                by_module.setdefault(lesson.module_id, []).append(lesson.id)
        return [
            LearningModule(
                id=module.id,
                title=module.title,
                course_id=module.course_id or "course.unknown",
                order=module.module_order or 0,
                source_provider=self.provider_id,
                lesson_ids=tuple(by_module.get(module.id, [])),
            )
            for module in modules
        ]


class LearningModuleRegistry:
    def __init__(self, providers: list[LearningModuleProvider] | None = None) -> None:
        self.providers = providers or [ContentLearningModuleProvider()]

    def modules(self, db: Session) -> list[LearningModule]:
        result: list[LearningModule] = []
        seen: set[str] = set()
        for provider in self.providers:
            for module in provider.modules(db):
                if module.id in seen:
                    raise ValueError(f"Duplicate learning module id: {module.id}")
                seen.add(module.id)
                result.append(module)
        return result
