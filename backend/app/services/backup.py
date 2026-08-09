"""Portable backup/restore for the local learner state.

Content is intentionally excluded: it is versioned in the vault and restored
with sync-content.  The backup contains only personal learning evidence.
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import sessionmaker

from app.db.models import (
    CaseAttempt,
    LabAttempt,
    LearningEvent,
    LessonProgress,
    ReviewAttempt,
    ReviewItem,
    SkillAssessment,
)
from app.db.session import SessionLocal

BACKUP_VERSION = 1
MODELS = (
    LessonProgress,
    SkillAssessment,
    LearningEvent,
    LabAttempt,
    CaseAttempt,
    ReviewItem,
    ReviewAttempt,
)
DELETE_ORDER = tuple(reversed(MODELS))


class BackupService:
    def __init__(self, session_factory: sessionmaker | None = None) -> None:
        self.session_factory = session_factory or SessionLocal

    def export(self) -> dict[str, Any]:
        with self.session_factory() as db:
            tables = {
                model.__tablename__: [self._row(model, item) for item in db.scalars(select(model))]
                for model in MODELS
            }
        payload = {
            "format": "datapath-learning-state",
            "version": BACKUP_VERSION,
            "exported_at": datetime.now(UTC).isoformat(),
            "tables": tables,
        }
        payload["checksum"] = self._checksum(payload)
        return payload

    def restore(self, payload: dict[str, Any]) -> dict[str, int]:
        self._validate(payload)
        tables = payload["tables"]
        with self.session_factory() as db:
            try:
                for model in DELETE_ORDER:
                    db.execute(delete(model))
                restored: dict[str, int] = {}
                for model in MODELS:
                    rows = tables.get(model.__tablename__, [])
                    for row in rows:
                        db.add(model(**row))
                    db.flush()
                    restored[model.__tablename__] = len(rows)
                db.commit()
                return restored
            except Exception:
                db.rollback()
                raise

    @staticmethod
    def _row(model, item) -> dict[str, Any]:  # noqa: ANN001
        return {prop.key: getattr(item, prop.key) for prop in model.__mapper__.column_attrs}

    @staticmethod
    def _checksum(payload: dict[str, Any]) -> str:
        canonical = {key: value for key, value in payload.items() if key != "checksum"}
        raw = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _validate(self, payload: dict[str, Any]) -> None:
        if payload.get("format") != "datapath-learning-state":
            raise ValueError("Это не backup DataPath")
        if payload.get("version") != BACKUP_VERSION:
            raise ValueError("Версия backup не поддерживается")
        if not isinstance(payload.get("tables"), dict):
            raise ValueError("В backup отсутствуют таблицы")
        if payload.get("checksum") != self._checksum(payload):
            raise ValueError("Checksum backup не совпадает")
        allowed = {
            model.__tablename__: {prop.key for prop in model.__mapper__.column_attrs}
            for model in MODELS
        }
        for table, rows in payload["tables"].items():
            if table not in allowed or not isinstance(rows, list):
                raise ValueError(f"Неизвестная таблица backup: {table}")
            for row in rows:
                if not isinstance(row, dict) or not set(row).issubset(allowed[table]):
                    raise ValueError(f"Некорректная строка backup: {table}")
