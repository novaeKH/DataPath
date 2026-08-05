"""Тесты модели знаний (Фаза 4): байесовские оси, состояния, слабые темы.

Используют временную SQLite (db_session_factory) и фиксированное время.
"""

from __future__ import annotations

from app.db.models import LearningEvent, SkillAssessment
from app.services.knowledge_model import (
    STATE_DEVELOPING,
    STATE_EXPLORING,
    STATE_NEEDS_ATTENTION,
    STATE_NOT_STARTED,
    STATE_STRONG,
    KnowledgeModelService,
    compute_state,
    is_weak_skill,
)
from sqlalchemy import select


def test_record_event_creates_learning_event(db_session_factory) -> None:
    service = KnowledgeModelService()
    service.freeze("2026-08-05T10:00:00+00:00")
    with db_session_factory() as db:
        event = service.record_event(
            db,
            event_type="checkpoint",
            source_type="lesson",
            source_id="lesson.classic-ml.one.one",
            skill_id="ml.tree_ensembles",
            axis="theory",
            outcome="correct",
            score=1.0,
            dedup_key="scene:lesson.classic-ml.one.one:scene-01",
        )
        assert event.id is not None
        assert event.event_type == "checkpoint"
        assert (
            db.scalar(
                select(LearningEvent).where(
                    LearningEvent.dedup_key == "scene:lesson.classic-ml.one.one:scene-01"
                )
            )
            is not None
        )


def test_record_event_is_idempotent(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        first = service.record_event(
            db,
            event_type="checkpoint",
            source_type="lesson",
            source_id="lesson.classic-ml.one.one",
            skill_id="ml.tree_ensembles",
            dedup_key="scene:lesson.classic-ml.one.one:scene-01",
        )
        second = service.record_event(
            db,
            event_type="checkpoint",
            source_type="lesson",
            source_id="lesson.classic-ml.one.one",
            skill_id="ml.tree_ensembles",
            dedup_key="scene:lesson.classic-ml.one.one:scene-01",
        )
        assert first.id == second.id
        count = len(db.query(LearningEvent).all())  # noqa: S110
        assert count == 1


def test_apply_evidence_updates_single_axis(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        update = service.apply_evidence(
            db, skill_id="ml.tree_ensembles", axis="theory", success=1.0, weight=1.0
        )
        assert update.evidence_count == 1
        # score = (2 + 1) / (2 + 1 + 2) = 0.6
        assert abs(update.score - 0.6) < 1e-9
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        assert assessment is not None
        assert assessment.evidence_count == 1
        assert assessment.axes["theory"]["alpha"] == 3.0
        assert assessment.axes["theory"]["beta"] == 2.0


def test_error_lowers_axis_but_does_not_zero(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        first = service.apply_evidence(
            db, skill_id="ml.tree_ensembles", axis="theory", success=1.0, weight=1.0
        )
        second = service.apply_evidence(
            db, skill_id="ml.tree_ensembles", axis="theory", success=0.0, weight=1.0
        )
        assert first.score > second.score
        # После ошибки оценка падает, но остаётся в (0, 1) — навык не обнулён.
        assert 0.0 < second.score < first.score


def test_axes_update_independently(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        service.apply_evidence(
            db, skill_id="ml.tree_ensembles", axis="theory", success=1.0, weight=1.0
        )
        service.apply_evidence(
            db, skill_id="ml.tree_ensembles", axis="apply", success=0.0, weight=1.0
        )
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        assert assessment.axes["theory"]["evidence_count"] == 1
        assert assessment.axes["apply"]["evidence_count"] == 1
        assert assessment.axes["theory"]["score"] > assessment.axes["apply"]["score"]


def test_lab_affects_apply_more_than_theory(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        service.apply_event_evidence(
            db, event_type="lab_recorded", skill_id="ml.tree_ensembles", success=1.0
        )
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        axes = assessment.axes
        # apply и interpret имеют weight 1.0, theory — 0.3 → сильнее сдвиг.
        assert axes["apply"]["alpha"] > axes["theory"]["alpha"]
        assert axes["interpret"]["evidence_count"] == 1


def test_hints_reduce_evidence_weight(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        no_hint = service.apply_event_evidence(
            db,
            event_type="checkpoint",
            skill_id="ml.tree_ensembles",
            success=1.0,
            hints_used=0,
        )[0]
        db.rollback()
        db.expunge_all()
    with db_session_factory() as db:
        with_hint = service.apply_event_evidence(
            db,
            event_type="checkpoint",
            skill_id="ml.tree_ensembles",
            success=1.0,
            hints_used=1,
        )[0]
        assert no_hint.alpha - with_hint.alpha > 0.05  # подсказка ослабляет сигнал


def test_retry_after_failure_reduces_weight(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        single = service.apply_event_evidence(
            db,
            event_type="checkpoint",
            skill_id="ml.tree_ensembles",
            success=0.0,
            attempts=1,
        )[0]
        db.rollback()
        db.expunge_all()
    with db_session_factory() as db:
        retried = service.apply_event_evidence(
            db,
            event_type="checkpoint",
            skill_id="ml.tree_ensembles",
            success=0.0,
            attempts=3,
        )[0]
        assert retried.beta < single.beta  # повторные попытки — менее сильный сигнал


def test_states_progression(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        update = service.record_and_assess(
            db,
            event_type="checkpoint",
            source_type="lesson",
            source_id="lesson.a",
            skill_id="ml.tree_ensembles",
            success=1.0,
            dedup_key="e1",
        )
        assert update.state == STATE_EXPLORING

    with db_session_factory() as db:
        update = service.record_and_assess(
            db,
            event_type="lab_recorded",
            source_type="lab",
            source_id="lab.a",
            skill_id="ml.tree_ensembles",
            success=1.0,
            dedup_key="e2",
        )
        # 1 checkpoint + 1 lab = 3 оси (theory+apply+interpret) → развивается
        assert update.state in (STATE_EXPLORING, STATE_DEVELOPING)

    with db_session_factory() as db:
        update = service.record_and_assess(
            db,
            event_type="case_module",
            source_type="case",
            source_id="case.a",
            skill_id="ml.tree_ensembles",
            success=1.0,
            dedup_key="e3",
        )
        assert update.state in (STATE_DEVELOPING, STATE_STRONG)


def test_needs_attention_on_repeated_errors(db_session_factory) -> None:
    service = KnowledgeModelService()
    with db_session_factory() as db:
        for i in range(2):
            service.record_and_assess(
                db,
                event_type="case_mini",
                source_type="case",
                source_id=f"case.{i}",
                skill_id="ml.tree_ensembles",
                success=0.2,
                error_code="confuses_concepts",
                dedup_key=f"err{i}",
            )
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        state, reason = compute_state(
            assessment.axes,
            assessment.evidence_count,
            service.repeated_errors(db, "ml.tree_ensembles"),
        )
        assert state == STATE_NEEDS_ATTENTION
        assert "ошиб" in reason


def test_weak_skill_requires_enough_evidence() -> None:
    # 1 измерение — ещё не слабая тема (недостаточно данных).
    axes = {"theory": {"score": 0.4, "evidence_count": 1}}
    assert is_weak_skill(axes, 1, 0) is False
    # 2+ измерений с низкой оценкой — слабая.
    axes2 = {
        "theory": {"score": 0.45, "evidence_count": 2},
        "apply": {"score": 0.5, "evidence_count": 2},
    }
    assert is_weak_skill(axes2, 2, 0) is True
    # Достаточно evidence, но высокая оценка — не слабая.
    axes3 = {
        "theory": {"score": 0.8, "evidence_count": 3},
        "apply": {"score": 0.9, "evidence_count": 3},
    }
    assert is_weak_skill(axes3, 3, 0) is False


def test_weak_skill_by_repeated_errors() -> None:
    axes = {"theory": {"score": 0.7, "evidence_count": 3}}
    assert is_weak_skill(axes, 3, 2) is True


def test_not_started_without_evidence() -> None:
    state, _ = compute_state({}, 0, 0)
    assert state == STATE_NOT_STARTED
