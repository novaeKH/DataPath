"""Прозрачная модель знаний (Фаза 4).

Реализация правил из docs/knowledge-model.md:
- 7 осей оценки, байесовское обновление alpha/beta (conjugate priors);
- score = alpha / (alpha + beta), консервативно при малом evidence;
- вес evidence зависит от типа источника (слабее — checkpoint,
  сильнее — лаборатории и кейсы);
- ошибки снижают соответствующую ось, но не обнуляют навык;
- состояния: not_started | exploring | developing | strong | needs_attention;
- слабые темы определяются пороговыми правилами, без ML.

Сервис детерминирован и объясним: каждое событие возвращает обновлённые
значения осей и человекочитаемую причину состояния.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import LearningEvent, SkillAssessment

# Все оси из docs/knowledge-model.md (не каждый навык требует всех осей).
ALL_AXES: tuple[str, ...] = (
    "theory",
    "reproduce",
    "apply",
    "code",
    "interpret",
    "explain",
    "interview",
)

# Начальные байесовские псевдосчёты: score = 2/(2+2) = 0.5 при 0 evidence.
INITIAL_ALPHA = 2.0
INITIAL_BETA = 2.0

# Качественные уровни (docs/knowledge-model.md).
SCORE_LEVELS: list[tuple[float, str]] = [
    (0.85, "Свободно"),
    (0.70, "Уверенно"),
    (0.50, "Понимание"),
    (0.30, "Основы"),
    (0.00, "Начало"),
]

# Состояния навыка.
STATE_NOT_STARTED = "not_started"
STATE_EXPLORING = "exploring"
STATE_DEVELOPING = "developing"
STATE_STRONG = "strong"
STATE_NEEDS_ATTENTION = "needs_attention"

# Пороги для слабых тем (docs/knowledge-model.md).
WEAK_SCORE_THRESHOLD = 0.6
WEAK_MIN_EVIDENCE = 2
REPEATED_ERROR_THRESHOLD = 2
STRONG_SCORE_THRESHOLD = 0.75
STRONG_MIN_EVIDENCE = 3
DEVELOPING_SCORE_THRESHOLD = 0.5
DEVELOPING_MIN_EVIDENCE = 2
NEEDS_ATTENTION_SCORE = 0.45
NEEDS_ATTENTION_MIN_EVIDENCE = 2

# Множитель веса при использовании подсказки (MC без подсказки 0.5,
# с подсказкой 0.2 → ~0.4×).
HINT_WEIGHT_FACTOR = 0.4
# Множитель при повторных попытках без успеха.
RETRY_WEIGHT_FACTOR = 0.6

# Каноническая схема: какие оси обновляет тип события и с каким весом
# при success = 1.0 (полный успех). Ошибки снижают ту же ось.
EVIDENCE_POLICY: dict[str, dict[str, Any]] = {
    "checkpoint": {
        "axes": {"theory": 0.2},
        "note": "Самопроверка — слабый сигнал по теории.",
    },
    "scene_complete": {
        "axes": {"theory": 0.15},
        "note": "Просмотр сцены — минимальный сигнал ознакомления.",
    },
    "lesson_complete": {
        "axes": {"theory": 0.3},
        "note": "Завершение урока — умеренный сигнал по теории, без высокой оценки.",
    },
    "lab_recorded": {
        "axes": {"apply": 1.0, "interpret": 1.0, "theory": 0.3},
        "note": "Лаборатория: сильнее влияет на применение и интерпретацию.",
    },
    "case_mini": {
        "axes": {"apply": 1.5, "interpret": 1.5, "theory": 0.75},
        "note": "Мини-кейс — интегративный сигнал.",
    },
    "case_module": {
        "axes": {
            "apply": 2.0,
            "interpret": 2.0,
            "explain": 1.0,
            "theory": 1.0,
        },
        "note": "Итоговый кейс — самый сильный смешанный сигнал.",
    },
}


@dataclass
class AxisUpdate:
    """Результат обновления одной оси."""

    axis: str
    score: float
    alpha: float
    beta: float
    evidence_count: int


@dataclass
class AssessmentUpdate:
    """Результат обновления навыка одним событием."""

    skill_id: str
    state: str
    state_reason: str
    confidence: float
    evidence_count: int
    axes: dict[str, Any]
    events_created: int
    deduplicated: bool


def _score(alpha: float, beta: float) -> float:
    total = alpha + beta
    if total <= 0:
        return 0.0
    return alpha / total


def _confidence(evidence_count: int) -> float:
    """Уверенность растёт с числом измерений (насыщается к 1)."""
    return min(1.0, evidence_count / 6.0)


def score_level(score: float) -> str:
    """Качественный уровень для отображения."""
    for threshold, label in SCORE_LEVELS:
        if score >= threshold:
            return label
    return SCORE_LEVELS[-1][1]


def compute_state(
    axes: dict[str, Any],
    evidence_count: int,
    repeated_errors: int = 0,
) -> tuple[str, str]:
    """Определяет состояние навыка по совокупности осей.

    Приоритет: needs_attention > strong > developing > exploring > not_started.
    Возвращает (state, human_reason).
    """
    if evidence_count <= 0:
        return STATE_NOT_STARTED, "Нет измерений — навык ещё не изучался."

    scored = [data for data in axes.values() if data.get("evidence_count", 0) > 0]
    if not scored:
        return STATE_NOT_STARTED, "Нет измерений — навык ещё не изучался."
    avg_score = sum(data["score"] for data in scored) / len(scored)
    max_score = max(data["score"] for data in scored)

    # needs_attention: повторяющиеся ошибки одного типа или низкая оценка
    # при достаточном числе измерений.
    if repeated_errors >= REPEATED_ERROR_THRESHOLD:
        return (
            STATE_NEEDS_ATTENTION,
            f"Повторяющиеся ошибки одного типа ({repeated_errors} раз).",
        )
    if evidence_count >= NEEDS_ATTENTION_MIN_EVIDENCE and avg_score < NEEDS_ATTENTION_SCORE:
        return (
            STATE_NEEDS_ATTENTION,
            f"Средняя оценка {avg_score:.2f} ниже порога {NEEDS_ATTENTION_SCORE:.2f} "
            f"при {evidence_count} измерениях.",
        )

    if evidence_count >= STRONG_MIN_EVIDENCE and avg_score >= STRONG_SCORE_THRESHOLD:
        return (
            STATE_STRONG,
            f"Уверенное владение: {evidence_count} измерений, средняя оценка {avg_score:.2f}.",
        )
    if evidence_count >= DEVELOPING_MIN_EVIDENCE and avg_score >= DEVELOPING_SCORE_THRESHOLD:
        return (
            STATE_DEVELOPING,
            f"Навык развивается: средняя оценка {avg_score:.2f} по {evidence_count} измерениям.",
        )
    return (
        STATE_EXPLORING,
        f"Идёт изучение: {evidence_count} измерение(й), лучшая ось {max_score:.2f}.",
    )


def is_weak_skill(
    axes: dict[str, Any],
    evidence_count: int,
    repeated_errors: int = 0,
) -> bool:
    """Правило «слабая тема»: только при достаточном evidence.

    Не показывает фиктивную аналитику при 1 измерении.
    """
    if evidence_count < WEAK_MIN_EVIDENCE:
        return False
    scored = [data for data in axes.values() if data.get("evidence_count", 0) > 0]
    if not scored:
        return False
    avg_score = sum(data["score"] for data in scored) / len(scored)
    if avg_score < WEAK_SCORE_THRESHOLD:
        return True
    return repeated_errors >= REPEATED_ERROR_THRESHOLD


class KnowledgeModelService:
    """Обновление модели знаний по событиям обучения.

    Отвечает за:
    - запись LearningEvent (append-only, с дедупликацией по dedup_key);
    - байесовское обновление SkillAssessment по осям;
    - определение состояния навыка и причин;
    - типичные ошибки по кодам error_taxonomy.
    """

    def __init__(self) -> None:
        self._now: str | None = None

    # --- Время (переопределяется в тестах) ---

    def now(self) -> str:
        if self._now is not None:
            return self._now
        from datetime import datetime

        return datetime.now(UTC).isoformat(timespec="seconds")

    def freeze(self, iso: str) -> None:
        """Фиксирует время для детерминированных тестов."""
        self._now = iso

    def unfreeze(self) -> None:
        self._now = None

    # --- Журнал ---

    def event_exists(self, db: Session, dedup_key: str) -> LearningEvent | None:
        if not dedup_key:
            return None
        return db.scalar(select(LearningEvent).where(LearningEvent.dedup_key == dedup_key))

    # --- Обновление навыка ---

    def record_event(
        self,
        db: Session,
        *,
        event_type: str,
        source_type: str,
        source_id: str,
        skill_id: str | None = None,
        axis: str | None = None,
        outcome: str | None = None,
        score: float | None = None,
        hints_used: int = 0,
        attempts: int = 1,
        error_code: str | None = None,
        metadata: dict[str, Any] | None = None,
        dedup_key: str | None = None,
    ) -> LearningEvent:
        """Создаёт событие в журнале. Идемпотентно по dedup_key."""
        existing = self.event_exists(db, dedup_key) if dedup_key else None
        if existing is not None:
            return existing
        event = LearningEvent(
            event_type=event_type,
            source_type=source_type,
            source_id=source_id,
            skill_id=skill_id,
            knowledge_axis=axis,
            outcome=outcome,
            score=score,
            hints_used=hints_used,
            attempts=attempts,
            error_code=error_code,
            metadata=metadata,
            dedup_key=dedup_key,
            created_at=self.now(),
        )
        db.add(event)
        db.flush()
        return event

    def apply_evidence(
        self,
        db: Session,
        *,
        skill_id: str,
        axis: str,
        success: float,
        weight: float,
        error_code: str | None = None,
    ) -> AxisUpdate:
        """Байесовское обновление одной оси навыка.

        success: 0..1 (результат измерения), weight: сила сигнала по типу
        источника. Ошибка снижает ось, но не обнуляет навык: alpha/beta
        сдвигаются на weight, оценка остаётся в (0, 1).
        """
        assessment = db.get(SkillAssessment, skill_id)
        if assessment is None:
            assessment = SkillAssessment(
                skill_id=skill_id,
                axes={},
                confidence=0.0,
                evidence_count=0,
                state=STATE_NOT_STARTED,
                updated_at=self.now(),
            )
            db.add(assessment)
            db.flush()

        axes: dict[str, Any] = assessment.axes or {}
        entry = axes.get(axis)
        if entry is None:
            entry = {
                "alpha": INITIAL_ALPHA,
                "beta": INITIAL_BETA,
                "evidence_count": 0,
                "score": _score(INITIAL_ALPHA, INITIAL_BETA),
            }
            axes[axis] = entry

        entry["alpha"] += success * weight
        entry["beta"] += (1.0 - success) * weight
        entry["evidence_count"] += 1
        entry["score"] = _score(entry["alpha"], entry["beta"])
        axes[axis] = entry

        assessment.axes = axes
        assessment.evidence_count += 1
        assessment.confidence = _confidence(assessment.evidence_count)
        assessment.last_activity_at = self.now()
        assessment.updated_at = self.now()

        # Обновляем состояние сразу (ошибки считаются ниже отдельно по журналу).
        state, reason = compute_state(axes, assessment.evidence_count)
        assessment.state = state
        db.flush()

        return AxisUpdate(
            axis=axis,
            score=entry["score"],
            alpha=entry["alpha"],
            beta=entry["beta"],
            evidence_count=entry["evidence_count"],
        )

    def apply_event_evidence(
        self,
        db: Session,
        *,
        event_type: str,
        skill_id: str,
        success: float,
        hints_used: int = 0,
        attempts: int = 1,
        error_code: str | None = None,
    ) -> list[AxisUpdate]:
        """Применяет политику весов к событию: обновляет все оси типа."""
        policy = EVIDENCE_POLICY.get(event_type)
        if policy is None or not skill_id:
            return []

        weight = 1.0
        if hints_used > 0:
            weight *= HINT_WEIGHT_FACTOR
        if attempts > 1 and success < 1.0:
            weight *= RETRY_WEIGHT_FACTOR

        updates: list[AxisUpdate] = []
        for axis, base_weight in policy["axes"].items():
            updates.append(
                self.apply_evidence(
                    db,
                    skill_id=skill_id,
                    axis=axis,
                    success=success,
                    weight=base_weight * weight,
                    error_code=error_code,
                )
            )
        return updates

    def record_and_assess(
        self,
        db: Session,
        *,
        event_type: str,
        source_type: str,
        source_id: str,
        skill_id: str | None,
        success: float,
        hints_used: int = 0,
        attempts: int = 1,
        error_code: str | None = None,
        outcome: str | None = None,
        score: float | None = None,
        metadata: dict[str, Any] | None = None,
        dedup_key: str | None = None,
    ) -> AssessmentUpdate:
        """Полный цикл: событие + обновление осей + состояние.

        Возвращает агрегированный результат, пригодный для API.
        """
        existed = self.event_exists(db, dedup_key) if dedup_key else None
        self.record_event(
            db,
            event_type=event_type,
            source_type=source_type,
            source_id=source_id,
            skill_id=skill_id,
            outcome=outcome,
            score=score,
            hints_used=hints_used,
            attempts=attempts,
            error_code=error_code,
            metadata=metadata,
            dedup_key=dedup_key,
        )

        if existed is not None:
            # Повторное событие: не начисляем evidence повторно.
            assessment = db.get(SkillAssessment, skill_id) if skill_id else None
            axes = assessment.axes if assessment else {}
            repeated_errors = self.repeated_errors(db, skill_id) if skill_id else 0
            state, reason = compute_state(
                axes, assessment.evidence_count if assessment else 0, repeated_errors
            )
            return AssessmentUpdate(
                skill_id=skill_id or "",
                state=state,
                state_reason=reason,
                confidence=assessment.confidence if assessment else 0.0,
                evidence_count=assessment.evidence_count if assessment else 0,
                axes=axes,
                events_created=0,
                deduplicated=True,
            )

        if skill_id:
            self.apply_event_evidence(
                db,
                event_type=event_type,
                skill_id=skill_id,
                success=success,
                hints_used=hints_used,
                attempts=attempts,
                error_code=error_code,
            )

        return self.assessment_update(db, skill_id, events_created=1, deduplicated=False)

    def assessment_update(
        self,
        db: Session,
        skill_id: str | None,
        events_created: int,
        deduplicated: bool,
    ) -> AssessmentUpdate:
        if not skill_id:
            return AssessmentUpdate(
                skill_id="",
                state=STATE_NOT_STARTED,
                state_reason="Нет навыка.",
                confidence=0.0,
                evidence_count=0,
                axes={},
                events_created=events_created,
                deduplicated=deduplicated,
            )
        assessment = db.get(SkillAssessment, skill_id)
        if assessment is None:
            return AssessmentUpdate(
                skill_id=skill_id,
                state=STATE_NOT_STARTED,
                state_reason="Нет измерений — навык ещё не изучался.",
                confidence=0.0,
                evidence_count=0,
                axes={},
                events_created=events_created,
                deduplicated=deduplicated,
            )
        repeated_errors = self.repeated_errors(db, skill_id)
        state, reason = compute_state(assessment.axes, assessment.evidence_count, repeated_errors)
        # Пересчитываем состояние после учёта ошибок.
        assessment.state = state
        db.flush()
        return AssessmentUpdate(
            skill_id=skill_id,
            state=state,
            state_reason=reason,
            confidence=assessment.confidence,
            evidence_count=assessment.evidence_count,
            axes=assessment.axes,
            events_created=events_created,
            deduplicated=deduplicated,
        )

    # --- Ошибки и слабые темы ---

    def repeated_errors(self, db: Session, skill_id: str | None) -> int:
        """Сколько раз встречался самый частый код ошибки для навыка."""
        if not skill_id:
            return 0
        rows = db.execute(
            select(LearningEvent.error_code).where(
                LearningEvent.skill_id == skill_id,
                LearningEvent.error_code.is_not(None),
            )
        ).all()
        counts: dict[str, int] = {}
        for (code,) in rows:
            counts[code] = counts.get(code, 0) + 1
        return max(counts.values(), default=0)

    def typical_errors(self, db: Session, skill_id: str) -> list[dict[str, Any]]:
        """Типичные ошибки навыка по кодам error_taxonomy."""
        rows = db.execute(
            select(LearningEvent.error_code, LearningEvent.knowledge_axis, LearningEvent.source_id)
            .where(
                LearningEvent.skill_id == skill_id,
                LearningEvent.error_code.is_not(None),
            )
            .order_by(LearningEvent.created_at.desc())
        ).all()
        grouped: dict[str, dict[str, Any]] = {}
        for code, axis, source_id in rows:
            if code not in grouped:
                grouped[code] = {"error_code": code, "axis": axis, "count": 0, "examples": []}
            grouped[code]["count"] += 1
            if source_id and len(grouped[code]["examples"]) < 3:
                grouped[code]["examples"].append(source_id)
        return sorted(grouped.values(), key=lambda item: item["count"], reverse=True)

    def recent_events(self, db: Session, skill_id: str, limit: int = 6) -> list[dict[str, Any]]:
        rows = db.scalars(
            select(LearningEvent)
            .where(LearningEvent.skill_id == skill_id)
            .order_by(LearningEvent.created_at.desc())
            .limit(limit)
        ).all()
        return [
            {
                "id": event.id,
                "event_type": event.event_type,
                "source_type": event.source_type,
                "source_id": event.source_id,
                "outcome": event.outcome,
                "score": event.score,
                "hints_used": event.hints_used,
                "attempts": event.attempts,
                "error_code": event.error_code,
                "created_at": event.created_at,
            }
            for event in rows
        ]
