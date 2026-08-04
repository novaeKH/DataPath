"""Чтение каталога для API: status, courses, item, atlas.

Только запросы к SQLite — никакого парсинга vault и абсолютных путей.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ContentIssue, ContentItem, SyncRun
from app.db.session import SessionLocal
from app.services.atlas import AtlasBuilder
from app.services.content_parser import VaultScanner


class ContentCatalogService:
    """Сервис чтения контентного каталога (API-слой)."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal

    def status(self) -> dict:
        with self.session_factory() as db:
            total = db.scalar(select(func.count()).select_from(ContentItem)) or 0
            published = (
                db.scalar(
                    select(func.count())
                    .select_from(ContentItem)
                    .where(ContentItem.publish.is_(True))
                )
                or 0
            )
            by_type_rows = db.execute(
                select(ContentItem.type, func.count()).group_by(ContentItem.type)
            ).all()
            by_type = {row[0]: row[1] for row in by_type_rows}
            last_sync = db.scalar(select(func.max(SyncRun.finished_at)))
            errors = (
                db.scalar(
                    select(func.count())
                    .select_from(ContentIssue)
                    .where(ContentIssue.severity == "error")
                )
                or 0
            )
            warnings = (
                db.scalar(
                    select(func.count())
                    .select_from(ContentIssue)
                    .where(ContentIssue.severity == "warning")
                )
                or 0
            )

        vault_files = len(VaultScanner(self.settings.vault_dir).scan())
        return {
            "vault_files": vault_files,
            "total_catalogued": total,
            "published": published,
            "by_type": by_type,
            "last_sync_at": last_sync,
            "errors": errors,
            "warnings": warnings,
        }

    def courses(self) -> list[dict]:
        with self.session_factory() as db:
            courses = db.scalars(
                select(ContentItem)
                .where(ContentItem.type == "course", ContentItem.publish.is_(True))
                .order_by(ContentItem.path)
            ).all()
            result = []
            for course in courses:
                module_count = (
                    db.scalar(
                        select(func.count())
                        .select_from(ContentItem)
                        .where(ContentItem.course_id == course.id, ContentItem.type == "module")
                    )
                    or 0
                )
                lesson_count = (
                    db.scalar(
                        select(func.count())
                        .select_from(ContentItem)
                        .where(ContentItem.course_id == course.id, ContentItem.type == "lesson")
                    )
                    or 0
                )
                practice_count = (
                    db.scalar(
                        select(func.count())
                        .select_from(ContentItem)
                        .where(ContentItem.course_id == course.id, ContentItem.type == "practice")
                    )
                    or 0
                )
                result.append(
                    {
                        "id": course.id,
                        "title": course.title,
                        "slug": course.slug,
                        "area": course.area,
                        "difficulty": course.difficulty,
                        "estimated_hours": course.estimated_hours,
                        "accent": course.accent,
                        "icon": course.icon,
                        "module_count": module_count,
                        "lesson_count": lesson_count,
                        "practice_count": practice_count,
                    }
                )
            return result

    def item(self, content_id: str) -> dict | None:
        with self.session_factory() as db:
            item = db.get(ContentItem, content_id)
            if item is None:
                return None
            outgoing = [
                {
                    "target_id": link.target_id,
                    "relation": link.relation,
                    "kind": link.kind,
                }
                for link in sorted(item.out_links, key=lambda lnk: (lnk.relation, lnk.target_id))
            ]
            incoming = [
                {
                    "source_id": link.source_id,
                    "relation": link.relation,
                    "kind": link.kind,
                }
                for link in sorted(item.in_links, key=lambda lnk: (lnk.relation, lnk.source_id))
            ]
            issues = [
                {"severity": i.severity, "code": i.code, "message": i.message}
                for i in db.scalars(
                    select(ContentIssue).where(ContentIssue.item_id == content_id)
                ).all()
            ]
            return {
                "id": item.id,
                "path": item.path,
                "type": item.type,
                "title": item.title,
                "slug": item.slug,
                "area": item.area,
                "status": item.status,
                "language": item.language,
                "publish": item.publish,
                "rag": item.rag,
                "rag_collection": item.rag_collection,
                "course_id": item.course_id,
                "module_id": item.module_id,
                "module_order": item.module_order,
                "lesson_order": item.lesson_order,
                "content_path": item.content_path,
                "practice_kind": item.practice_kind,
                "skill_ids": item.skill_ids,
                "difficulty": item.difficulty,
                "estimated_minutes": item.estimated_minutes,
                "estimated_hours": item.estimated_hours,
                "accent": item.accent,
                "icon": item.icon,
                "aliases": item.aliases,
                "tags": item.tags,
                "prerequisites": item.prerequisites,
                "validation_status": item.validation_status,
                "issues": issues,
                "links": {"outgoing": outgoing, "incoming": incoming},
            }

    def atlas(self) -> dict:
        with self.session_factory() as db:
            return AtlasBuilder().build(db)
