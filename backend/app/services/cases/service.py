"""Сервис кейсов: спецификация, валидация, оценка, сохранение попыток.

Оценка детерминированная (Case.evaluate); здесь — сохранение попытки в
case_attempts и создание evidence по навыкам кейса через
KnowledgeModelService (вес зависит от practice_kind: mini 1.5, module 2.0).
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import CaseAttempt
from app.db.session import SessionLocal
from app.services.cases.registry import DEFAULT_CASE_REGISTRY, CaseRegistry
from app.services.knowledge_model import KnowledgeModelService

ALLOWED_MODES = ("guided", "standard", "interview")


def _answers_hash(answers: dict[str, Any]) -> str:
    payload = json.dumps(answers, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:16]


class CaseService:
    """Работа с кейсами (один локальный пользователь)."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
        registry: CaseRegistry | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.registry = registry or DEFAULT_CASE_REGISTRY
        self.knowledge = KnowledgeModelService()

    def list_cases(self, mode: str = "standard") -> list[dict[str, Any]]:
        return self.registry.list_specs(mode)

    def get_case(self, case_id: str, mode: str = "standard") -> dict[str, Any] | None:
        return self.registry.spec(case_id, mode)

    def attempts(self, case_id: str) -> list[dict[str, Any]]:
        with self.session_factory() as db:
            rows = db.scalars(
                select(CaseAttempt)
                .where(CaseAttempt.case_id == case_id)
                .order_by(CaseAttempt.completed_at.desc())
                .limit(20)
            ).all()
            return [
                {
                    "id": row.id,
                    "case_id": row.case_id,
                    "mode": row.mode,
                    "answers": row.answers,
                    "result": row.result,
                    "completed_at": row.completed_at,
                }
                for row in rows
            ]

    def submit(
        self,
        case_id: str,
        mode: str,
        answers: dict[str, Any],
    ) -> dict[str, Any]:
        """Проверяет ответы, сохраняет попытку и создаёт evidence.

        Неизвестный case_id или недопустимый mode вызывают ValueError
        (обрабатывается API как 404/422).
        """
        if mode not in ALLOWED_MODES:
            raise ValueError(f"Недопустимый режим {mode!r}. Доступны: {', '.join(ALLOWED_MODES)}")
        case = self.registry.get(case_id)
        if case is None:
            raise KeyError(case_id)

        result = case.evaluate(answers, mode)

        with self.session_factory() as db:
            from datetime import datetime

            now = datetime.now(UTC).isoformat(timespec="seconds")
            attempt = CaseAttempt(
                case_id=case_id,
                mode=mode,
                answers=answers,
                result=result,
                completed_at=now,
            )
            db.add(attempt)
            db.flush()
            attempt_id = attempt.id

            # Evidence по навыкам кейса; вес зависит от типа кейса.
            # dedup по содержимому ответов: повторная отправка того же набора
            # ответов не начисляет evidence повторно (попытка сохраняется).
            dedup = f"case:{case_id}:{mode}:{_answers_hash(answers)}"
            event_type = "case_module" if case.practice_kind == "module-case" else "case_mini"
            evidence_updates = []
            for skill_id in case.skill_ids:
                update = self.knowledge.record_and_assess(
                    db,
                    event_type=event_type,
                    source_type="case",
                    source_id=case_id,
                    skill_id=skill_id,
                    success=result["total_score"],
                    outcome="completed" if result["passed"] else "partial",
                    score=result["total_score"],
                    error_code=result["error_codes"][0] if result["error_codes"] else None,
                    metadata={"mode": mode, "total_score": result["total_score"]},
                    dedup_key=f"{dedup}:{skill_id}",
                )
                evidence_updates.append(
                    {
                        "skill_id": skill_id,
                        "state": update.state,
                        "state_reason": update.state_reason,
                        "evidence_count": update.evidence_count,
                        "deduplicated": update.deduplicated,
                    }
                )
            db.commit()

            result["attempt_id"] = attempt_id
            result["evidence"] = evidence_updates
            return result
