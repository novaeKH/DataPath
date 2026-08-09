"""Синхронизация content/vault → SQLite каталог.

Идемпотентна:
- повторный запуск без изменений не создаёт дубликатов (unchanged);
- изменённый файл обновляется (updated);
- новый файл добавляется (created);
- удалённый файл убирается из каталога (removed);
- материалы с ошибками валидации не публикуются и фиксируются в content_issues.

Исходные Markdown-файлы не изменяются.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ContentIssue, ContentItem, ContentLink, SyncRun
from app.db.session import SessionLocal
from app.services.content_parser import (
    MarkdownParser,
    VaultScanner,
    json_safe,
    now_iso,
    slugify_stem,
)
from app.services.content_validator import ContentValidator, ValidationResult


@dataclass
class SyncReport:
    scanned: int = 0
    created: int = 0
    updated: int = 0
    unchanged: int = 0
    removed: int = 0
    errors: int = 0
    warnings: int = 0
    last_sync_at: str | None = None

    def as_dict(self) -> dict:
        return {
            "scanned": self.scanned,
            "created": self.created,
            "updated": self.updated,
            "unchanged": self.unchanged,
            "removed": self.removed,
            "errors": self.errors,
            "warnings": self.warnings,
            "last_sync_at": self.last_sync_at,
        }


def _fm_str(fm: dict, key: str) -> str | None:
    value = fm.get(key)
    if value is None:
        return None
    return str(value)


def _fm_int(fm: dict, key: str) -> int | None:
    value = fm.get(key)
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _fm_float(fm: dict, key: str) -> float | None:
    value = fm.get(key)
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _fm_list(fm: dict, key: str) -> list | None:
    value = fm.get(key)
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value.strip():
        return [item.strip() for item in value.split(",") if item.strip()]
    return None


class ContentSyncService:
    """Оркестратор: сканирование → парсинг → валидация → запись в SQLite."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.scanner = VaultScanner(self.settings.vault_dir)
        self.parser = MarkdownParser()
        self.validator = ContentValidator(self.settings.vault_dir, parser=self.parser)

    def sync(self) -> SyncReport:
        started_at = now_iso()
        files = self.scanner.scan()
        notes = [self.parser.parse(path, self.settings.vault_dir) for path in files]
        validation = self.validator.validate(notes)

        report = SyncReport(
            scanned=len(files), errors=validation.errors, warnings=validation.warnings
        )

        with self.session_factory() as db:
            existing = {item.id: item for item in db.scalars(select(ContentItem)).all()}
            keep_ids: set[str] = set()

            for candidate in validation.candidates:
                keep_ids.add(candidate.item_id)
                item = existing.get(candidate.item_id)
                note = candidate.note
                if item is not None and item.content_hash == note.content_hash:
                    report.unchanged += 1
                    continue
                if item is not None:
                    self._apply_to_item(item, candidate)
                    db.add(item)
                    report.updated += 1
                else:
                    item = ContentItem(id=candidate.item_id)
                    self._apply_to_item(item, candidate)
                    db.add(item)
                    report.created += 1

            removed = [cid for cid in existing if cid not in keep_ids]
            if removed:
                db.execute(delete(ContentItem).where(ContentItem.id.in_(removed)))
            report.removed = len(removed)

            # Рёбра пересоздаются целиком (детерминированно, идемпотентно).
            db.execute(delete(ContentLink))
            seen_edges: set[tuple[str, str, str, str]] = set()
            for candidate in validation.candidates:
                for source_id, target_id, relation, kind in candidate.edges:
                    if source_id in keep_ids and target_id in keep_ids:
                        edge_key = (source_id, target_id, relation, kind)
                        if edge_key in seen_edges:
                            continue  # одна и та же ссылка может встречаться несколько раз
                        seen_edges.add(edge_key)
                        db.add(
                            ContentLink(
                                source_id=source_id,
                                target_id=target_id,
                                relation=relation,
                                kind=kind,
                            )
                        )

            # Ошибки/предупреждения последнего прогона.
            # Для элементов, не попавших в keep_ids (не прошли валидацию),
            # item_id = None — FK ondelete=SET NULL позволяет orphan issues.
            db.execute(delete(ContentIssue))
            for issue in validation.issues:
                db.add(
                    ContentIssue(
                        item_id=issue.item_id if issue.item_id in keep_ids else None,
                        path=issue.path,
                        severity=issue.severity,
                        code=issue.code,
                        message=issue.message,
                        synced_at=started_at,
                    )
                )

            finished_at = now_iso()
            run = SyncRun(
                started_at=started_at,
                finished_at=finished_at,
                scanned=report.scanned,
                created=report.created,
                updated=report.updated,
                unchanged=report.unchanged,
                removed=report.removed,
                errors=report.errors,
                warnings=report.warnings,
            )
            db.add(run)
            db.commit()
            report.last_sync_at = finished_at

        return report

    def validate_only(self) -> ValidationResult:
        """Только валидация: не изменяет БД (команда validate)."""
        files = self.scanner.scan()
        notes = [self.parser.parse(path, self.settings.vault_dir) for path in files]
        return self.validator.validate(notes)

    @staticmethod
    def _apply_to_item(item: ContentItem, candidate) -> None:
        note = candidate.note
        fm = note.frontmatter or {}
        now = now_iso()
        item.path = note.path
        item.type = str(fm.get("type", ""))
        item.title = note.title or note.stem
        item.slug = slugify_stem(note.stem)
        item.area = _fm_str(fm, "area")
        item.status = _fm_str(fm, "status")
        item.language = _fm_str(fm, "language")
        item.app = str(fm.get("app", "source"))
        item.rag = _fm_str(fm, "rag")
        item.rag_collection = _fm_str(fm, "rag_collection")
        item.publish = item.app == "include"
        item.course_id = _fm_str(fm, "course_id")
        item.module_id = _fm_str(fm, "module_id")
        item.module_order = _fm_int(fm, "module_order")
        item.lesson_order = _fm_int(fm, "lesson_order")
        item.content_path = _fm_str(fm, "content_path")
        item.practice_kind = _fm_str(fm, "practice_kind")
        item.skill_ids = _fm_list(fm, "skill_ids")
        item.difficulty = _fm_str(fm, "difficulty")
        item.estimated_minutes = _fm_int(fm, "estimated_minutes")
        item.estimated_hours = _fm_float(fm, "estimated_hours")
        item.accent = _fm_str(fm, "accent")
        item.icon = _fm_str(fm, "icon")
        item.aliases = _fm_list(fm, "aliases")
        item.tags = _fm_list(fm, "tags")
        item.math_depth = _fm_int(fm, "math_depth")
        item.frontmatter = json_safe(fm)
        item.prerequisites = candidate.explicit_prereqs if candidate.explicit_prereqs else None
        item.content_hash = note.content_hash
        item.file_mtime = note.mtime
        item.synced_at = now
        if item.created_at is None:
            item.created_at = now
        item.updated_at = now
        item.validation_status = "ok"
