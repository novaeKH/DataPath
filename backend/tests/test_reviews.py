"""Тесты Фазы 5: интервальное повторение.

Покрывают: bootstrap, очередь и приоритеты, scheduler (SM-2-like),
effective rating, dedup, evidence в KnowledgeModelService, Today, API.
Используют временную БД (db_session_factory) и фиксированный ReviewClock.
"""

from __future__ import annotations

import pytest
from app.db.models import (
    CaseAttempt,
    LabAttempt,
    LearningEvent,
    LessonProgress,
    ReviewAttempt,
    ReviewItem,
    SkillAssessment,
)
from app.services.reviews.answer import (
    ReviewAnswerService,
    ReviewNotFoundError,
    ReviewSuspendedError,
)
from app.services.reviews.clock import ReviewClock
from app.services.reviews.queue import ReviewQueueService
from app.services.reviews.registry import (
    RATING_AGAIN,
    RATING_EASY,
    RATING_GOOD,
    RATING_HARD,
)
from app.services.reviews.scheduler import (
    MAX_EASE_FACTOR,
    MIN_EASE_FACTOR,
    ReviewSchedulerService,
)
from app.services.reviews.templates import DEFAULT_REVIEW_REGISTRY
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

FROZEN_NOW = "2026-08-05T12:00:00+00:00"

# Реальные ID маршрута (существуют в vault/реестрах).
LESSON_TREE = "lesson.classic-ml.trees.tree"
LESSON_BV = "lesson.classic-ml.linear.regularization"
LESSON_FOREST = "lesson.classic-ml.trees.forest"
LESSON_BOOSTING = "lesson.classic-ml.trees.boosting"
LESSON_LIBRARIES = "lesson.classic-ml.trees.libraries"
LAB_SPLIT = "decision-tree-split-lab"
LAB_COMPARE = "ensemble-comparison-lab"
CASE_MINI = "case.classic-ml.tree-ensemble-choice"


@pytest.fixture
def review_clock() -> ReviewClock:
    clock = ReviewClock("Europe/Moscow")
    clock.freeze(FROZEN_NOW)
    return clock


@pytest.fixture
def queue_service(db_session_factory, review_clock: ReviewClock) -> ReviewQueueService:
    return ReviewQueueService(
        session_factory=db_session_factory,
        registry=DEFAULT_REVIEW_REGISTRY,
        clock=review_clock,
    )


@pytest.fixture
def answer_service(db_session_factory, review_clock: ReviewClock) -> ReviewAnswerService:
    return ReviewAnswerService(
        session_factory=db_session_factory,
        registry=DEFAULT_REVIEW_REGISTRY,
        clock=review_clock,
    )


def _complete_lesson(db, lesson_id: str, completed_at: str = FROZEN_NOW) -> None:
    db.add(
        LessonProgress(
            lesson_id=lesson_id,
            current_scene_id=None,
            completed_scenes=[],
            started_at=completed_at,
            completed_at=completed_at,
            updated_at=completed_at,
        )
    )
    db.commit()


def _record_lab(db, lab_id: str, score: float = 0.8) -> None:
    db.add(
        LabAttempt(
            lab_id=lab_id,
            lesson_id=None,
            parameters={},
            result_summary={},
            score=score,
            evidence=[],
            dedup_key=f"test-lab:{lab_id}:{score}",
            created_at=FROZEN_NOW,
        )
    )
    db.commit()


def _record_case(db, case_id: str = CASE_MINI) -> None:
    db.add(
        CaseAttempt(
            case_id=case_id,
            mode="standard",
            answers={},
            result={},
            completed_at=FROZEN_NOW,
        )
    )
    db.commit()


def _item_ids(queue_result: dict) -> list[str]:
    return [item["template_id"] for item in queue_result["items"]]


def _correct_answer(template_id: str):
    """Правильный ответ для шаблона (для тестов submit)."""
    template = DEFAULT_REVIEW_REGISTRY.get(template_id)
    assert template is not None, template_id
    if template.question_type in ("single_choice", "parameter_selection", "error_diagnosis"):
        return template.answer_spec["correct"]
    if template.question_type in ("multiple_choice", "ordering"):
        return list(template.answer_spec["correct"])
    if template.question_type == "numeric":
        return float(template.answer_spec["correct"])
    return None


def _first_item(queue_service) -> dict:
    q = queue_service.queue(limit=10)
    return q["items"][0]


def _lesson_templates(lesson_id: str) -> list[str]:
    return [
        t.id
        for t in DEFAULT_REVIEW_REGISTRY.all()
        if t.source_type == "lesson" and t.source_id == lesson_id
    ]


# --- Bootstrap ---


def test_new_user_has_no_reviews(db_session_factory, queue_service) -> None:
    summary = queue_service.summary()
    assert summary["due_count"] == 0
    assert summary["overdue_count"] == 0
    assert summary["active_items"] == 0
    assert summary["next_due_at"] is None
    q = queue_service.queue(limit=10)
    assert q["items"] == []
    assert q["due_count"] == 0
    assert q["next_due_at"] is None


def test_bootstrap_creates_items_from_completed_lesson(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    expected = _lesson_templates(LESSON_TREE)
    assert expected, "у шаблонов урока должен быть lesson-источник"
    q = queue_service.queue(limit=30)
    created = _item_ids(q)
    for template_id in expected:
        assert template_id in created
    assert q["due_count"] >= len(expected)


def test_bootstrap_lesson_not_completed_no_items(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        db.add(
            LessonProgress(
                lesson_id=LESSON_TREE,
                current_scene_id="s1",
                completed_scenes=[],
                started_at=FROZEN_NOW,
                completed_at=None,
                updated_at=FROZEN_NOW,
            )
        )
        db.commit()
    assert queue_service.summary()["active_items"] == 0


def test_bootstrap_lab_and_case(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _record_lab(db, LAB_SPLIT)
        _record_case(db, CASE_MINI)
    ids = _item_ids(queue_service.queue(limit=30))
    assert "rev.dt.split-gain" in ids  # lab-based
    assert "rev.cmp.model-choice-biz" in ids  # case-based


def test_bootstrap_weak_lab_does_not_activate(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _record_lab(db, LAB_SPLIT, score=0.4)
    assert "rev.dt.split-gain" not in _item_ids(queue_service.queue(limit=30))


def test_bootstrap_is_idempotent(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    first = queue_service.queue(limit=30)
    second = queue_service.queue(limit=30)
    assert _item_ids(first) == _item_ids(second)
    with db_session_factory() as db:
        count = len(db.scalars(select(ReviewItem)).all())
    assert count == len(_item_ids(first))


def test_template_id_unique(db_session_factory) -> None:
    with db_session_factory() as db:
        now = FROZEN_NOW
        db.add(
            ReviewItem(
                template_id="rev.test.unique",
                primary_skill_id="ml.tree_ensembles",
                source_type="lesson",
                source_id=LESSON_TREE,
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
        db.commit()
    with pytest.raises(IntegrityError), db_session_factory() as db:
        db.add(
            ReviewItem(
                template_id="rev.test.unique",
                primary_skill_id="ml.tree_ensembles",
                source_type="lesson",
                source_id=LESSON_TREE,
                stage="learning",
                status="active",
                due_at=FROZEN_NOW,
                interval_days=0.0,
                ease_factor=2.5,
                repetitions=0,
                lapses=0,
                created_at=FROZEN_NOW,
                updated_at=FROZEN_NOW,
            )
        )
        db.commit()


# --- Scheduler ---


def test_initial_intervals(review_clock: ReviewClock) -> None:
    scheduler = ReviewSchedulerService(review_clock)
    cases = [
        (RATING_AGAIN, 10 / 1440),
        (RATING_HARD, 1.0),
        (RATING_GOOD, 3.0),
        (RATING_EASY, 7.0),
    ]
    for rating, expected in cases:
        update = scheduler.next_schedule(
            current_stage="learning",
            current_interval_days=0.0,
            current_ease_factor=2.5,
            repetitions=0,
            lapses=0,
            effective_rating=rating,
        )
        assert update.interval_days == pytest.approx(expected, abs=1e-5)
        assert update.repetitions == 1
    assert (
        scheduler.next_schedule(
            current_stage="learning",
            current_interval_days=0.0,
            current_ease_factor=2.5,
            repetitions=0,
            lapses=0,
            effective_rating=RATING_AGAIN,
        ).stage
        == "relearning"
    )


def test_subsequent_intervals(review_clock: ReviewClock) -> None:
    scheduler = ReviewSchedulerService(review_clock)
    good1 = scheduler.next_schedule(
        current_stage="learning",
        current_interval_days=0.0,
        current_ease_factor=2.5,
        repetitions=0,
        lapses=0,
        effective_rating=RATING_GOOD,
    )
    assert good1.interval_days == pytest.approx(3.0)
    good2 = scheduler.next_schedule(
        current_stage="review",
        current_interval_days=good1.interval_days,
        current_ease_factor=good1.ease_factor,
        repetitions=good1.repetitions,
        lapses=good1.lapses,
        effective_rating=RATING_GOOD,
    )
    assert good2.interval_days == pytest.approx(3.0 * 2.5)
    assert good2.stage == "review"
    # Again после Good: lapses растёт, интервал короткий, relearning.
    again = scheduler.next_schedule(
        current_stage="review",
        current_interval_days=good2.interval_days,
        current_ease_factor=good2.ease_factor,
        repetitions=good2.repetitions,
        lapses=good2.lapses,
        effective_rating=RATING_AGAIN,
    )
    assert again.lapses == 1
    assert again.stage == "relearning"
    assert again.interval_days == pytest.approx(10 / 1440, abs=1e-5)
    # Easy растягивает сильнее и поднимает ease.
    easy = scheduler.next_schedule(
        current_stage="relearning",
        current_interval_days=again.interval_days,
        current_ease_factor=again.ease_factor,
        repetitions=again.repetitions,
        lapses=again.lapses,
        effective_rating=RATING_EASY,
    )
    assert easy.stage == "review"
    assert easy.ease_factor > again.ease_factor


def test_ease_factor_clamped(review_clock: ReviewClock) -> None:
    scheduler = ReviewSchedulerService(review_clock)
    ease = 2.5
    interval = 3.0
    reps = 1
    for _ in range(20):
        update = scheduler.next_schedule(
            current_stage="review",
            current_interval_days=interval,
            current_ease_factor=ease,
            repetitions=reps,
            lapses=0,
            effective_rating=RATING_EASY,
        )
        ease, interval, reps = update.ease_factor, update.interval_days, update.repetitions
    assert ease <= MAX_EASE_FACTOR
    assert interval <= 365.0
    ease = 2.5
    reps = 1
    for _ in range(20):
        update = scheduler.next_schedule(
            current_stage="review",
            current_interval_days=30.0,
            current_ease_factor=ease,
            repetitions=reps,
            lapses=0,
            effective_rating=RATING_AGAIN,
        )
        ease, reps = update.ease_factor, update.repetitions
    assert ease >= MIN_EASE_FACTOR
    assert update.interval_days >= 0.0


# --- Submit / effective rating ---


def _first_item_id(queue_service) -> int:
    return _first_item(queue_service)["id"]


def test_wrong_answer_effective_again(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item_id = _first_item_id(queue_service)
    result = answer_service.submit(item_id, answer=999, user_rating=RATING_EASY, dedup_key="w1")
    assert result["is_correct"] is False
    assert result["effective_rating"] == RATING_AGAIN
    assert result["stage"] == "relearning"
    assert result["interval_days"] == pytest.approx(10 / 1440, abs=1e-5)


def test_partial_answer_not_above_hard(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_FOREST)  # rev.rf.steps — ordering (partial возможен)
    items = queue_service.queue(limit=30)["items"]
    step_item = next(item for item in items if item["template_id"] == "rev.rf.steps")
    item_id = step_item["id"]
    # Ответ с одной ошибкой в порядке → частично правильный.
    correct = _correct_answer("rev.rf.steps")
    wrong_order = [correct[1], correct[0], correct[2], correct[3]]
    result = answer_service.submit(
        item_id, answer=wrong_order, user_rating=RATING_EASY, dedup_key="p1"
    )
    assert result["objective_score"] is not None
    assert result["objective_score"] < 1.0
    assert result["effective_rating"] == RATING_HARD


def test_correct_answer_easy(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    result = answer_service.submit(
        item_id,
        answer=_correct_answer(item["template_id"]),
        user_rating=RATING_EASY,
        dedup_key="c1",
    )
    assert result["is_correct"] is True
    assert result["effective_rating"] == RATING_EASY
    assert result["interval_days"] == pytest.approx(7.0)
    assert result["stage"] == "review"
    assert result["next_due_at"] > FROZEN_NOW


def test_hints_reduce_weight(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    answer = _correct_answer(item["template_id"])
    no_hint = answer_service.submit(item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="h0")
    hint = answer_service.submit(
        item_id, answer=answer, user_rating=RATING_GOOD, hints_used=1, dedup_key="h1"
    )
    weight_no_hint = no_hint["knowledge_impact"][0]["weight"]
    weight_hint = hint["knowledge_impact"][0]["weight"]
    assert weight_hint < weight_no_hint


def test_immediate_retry_weak_evidence(db_session_factory, queue_service, answer_service) -> None:
    """Правильный ответ после реального интервала — полное evidence;
    немедленный повтор (интервал < 1 дня) — ослабленное."""
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    answer = _correct_answer(item["template_id"])
    # Первый ответ: prev_interval = 0 (немедленный) → слабое evidence.
    first = answer_service.submit(item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="i1")
    # Второй ответ: prev_interval = 3 дня → полное evidence.
    second = answer_service.submit(item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="i2")
    first_weight = first["knowledge_impact"][0]["weight"]
    second_weight = second["knowledge_impact"][0]["weight"]
    assert second_weight > first_weight


def test_skip_no_negative_evidence(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item_id = _first_item_id(queue_service)
    before = answer_service.get_item(item_id)
    result = answer_service.skip(item_id)
    assert result["skipped"] is True
    after = answer_service.get_item(item_id)
    assert after["due_at"] == before["due_at"]
    assert after["interval_days"] == before["interval_days"]
    assert after["lapses"] == before["lapses"]
    with db_session_factory() as db:
        events = db.scalars(
            select(LearningEvent).where(LearningEvent.source_type == "review")
        ).all()
    assert len(events) == 0


def test_submit_creates_learning_event_and_updates_skill(
    db_session_factory, queue_service, answer_service
) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    answer = _correct_answer(item["template_id"])
    with db_session_factory() as db:
        assert db.get(SkillAssessment, "ml.tree_ensembles") is None
    result = answer_service.submit(item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="e1")
    with db_session_factory() as db:
        events = db.scalars(
            select(LearningEvent).where(
                LearningEvent.event_type == "review_answer",
                LearningEvent.source_id == result["template_id"],
            )
        ).all()
        assert len(events) >= 1
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        assert assessment is not None
        assert assessment.evidence_count >= 1
        # Правильный Good-ответ поднял ось шаблона выше prior 0.5.
        template = DEFAULT_REVIEW_REGISTRY.get(result["template_id"])
        for axis in template.axes():
            entry = assessment.axes.get(axis)
            assert entry is not None, axis
            assert entry["score"] > 0.5, axis


def test_single_error_does_not_zero_skill(
    db_session_factory, queue_service, answer_service
) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    answer = _correct_answer(item["template_id"])
    template = DEFAULT_REVIEW_REGISTRY.get(item["template_id"])
    answer_service.submit(item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="z1")
    answer_service.submit(item_id, answer=999, user_rating=RATING_AGAIN, dedup_key="z2")
    with db_session_factory() as db:
        assessment = db.get(SkillAssessment, "ml.tree_ensembles")
        assert assessment is not None
        assert assessment.state != "not_started"
        for axis in template.axes():
            entry = assessment.axes.get(axis)
            assert entry is not None, axis
            assert entry["score"] > 0.0
            assert entry["score"] < 1.0


def test_dedup_submit(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item = _first_item(queue_service)
    item_id = item["id"]
    answer = _correct_answer(item["template_id"])
    first = answer_service.submit(
        item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="dup-1"
    )
    second = answer_service.submit(
        item_id, answer=answer, user_rating=RATING_GOOD, dedup_key="dup-1"
    )
    assert second["deduplicated"] is True
    assert second["attempt_id"] == first["attempt_id"]
    with db_session_factory() as db:
        attempts = db.scalars(
            select(ReviewAttempt).where(ReviewAttempt.review_item_id == item_id)
        ).all()
        assert len(attempts) == 1
        # evidence не начисляется повторно: ровно один review_answer на ось.
        theory_events = db.scalars(
            select(LearningEvent).where(
                LearningEvent.event_type == "review_answer",
                LearningEvent.source_id == first["template_id"],
            )
        ).all()
        assert len(theory_events) == len(DEFAULT_REVIEW_REGISTRY.get(first["template_id"]).axes())


# --- Queue ordering / limits ---


def test_overdue_ordering(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
        _complete_lesson(db, LESSON_BV)
    # Bootstrap создаёт элементы (все due на now). Затем часть уводим в прошлое.
    queue_service.queue(limit=30)
    with db_session_factory() as db:
        rows = db.scalars(select(ReviewItem)).all()
        assert len(rows) >= 4
        for idx, row in enumerate(rows):
            if idx % 2 == 0:
                row.due_at = "2026-08-01T00:00:00+00:00"
        db.commit()
    q = queue_service.queue(limit=30)
    due = [item["due_at"] for item in q["items"]]
    # Просроченные идут раньше запланированных на сегодня.
    overdue = [d for d in due if d < "2026-08-05T00:00:00+00:00"]
    today = [d for d in due if d >= "2026-08-05T00:00:00+00:00"]
    assert overdue
    assert today
    assert q["items"][0]["due_at"] in overdue
    assert q["overdue_count"] >= len(overdue)


def test_needs_attention_priority(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
        db.add(
            SkillAssessment(
                skill_id="ml.tree_ensembles",
                axes={
                    "theory": {
                        "alpha": 2.0,
                        "beta": 5.0,
                        "evidence_count": 2,
                        "score": 2 / 7,
                    }
                },
                confidence=0.34,
                evidence_count=2,
                state="needs_attention",
                updated_at=FROZEN_NOW,
            )
        )
        db.commit()
    q = queue_service.queue(limit=30)
    first = q["items"][0]
    assert first["primary_skill_id"] == "ml.tree_ensembles"
    assert first["skill_state"] == "needs_attention"


def test_low_evidence_not_needs_attention(db_session_factory, queue_service) -> None:
    """Слабая тема без достаточного evidence не получает приоритет needs_attention."""
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
        db.add(
            SkillAssessment(
                skill_id="ml.tree_ensembles",
                axes={
                    "theory": {
                        "alpha": 2.0,
                        "beta": 5.0,
                        "evidence_count": 1,
                        "score": 2 / 7,
                    }
                },
                confidence=0.17,
                evidence_count=1,
                state="exploring",
                updated_at=FROZEN_NOW,
            )
        )
        db.commit()
    q = queue_service.queue(limit=30)
    assert q["items"][0]["skill_state"] != "needs_attention"


def test_daily_limit_and_clamp(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        for lesson_id in [LESSON_TREE, LESSON_BV, LESSON_FOREST, LESSON_BOOSTING, LESSON_LIBRARIES]:
            _complete_lesson(db, lesson_id)
    q = queue_service.queue(limit=5)
    assert len(q["items"]) == 5
    assert q["limit"] == 5
    q = queue_service.queue(limit=100)  # clamp 30
    assert q["limit"] == 30
    assert len(q["items"]) <= 30
    q = queue_service.queue(limit=0)  # clamp 1
    assert q["limit"] == 1


def test_queue_filter_by_lesson_and_skill(db_session_factory, queue_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
        _complete_lesson(db, LESSON_BV)
    by_lesson = queue_service.queue(limit=30, lesson_id=LESSON_TREE)
    for item in by_lesson["items"]:
        template = DEFAULT_REVIEW_REGISTRY.get(item["template_id"])
        assert template is not None
        assert template.source_lesson_id == LESSON_TREE
    by_skill = queue_service.queue(limit=30, skill_id="ml.tree_ensembles")
    assert by_skill["items"]
    for item in by_skill["items"]:
        assert item["primary_skill_id"] == "ml.tree_ensembles"


def test_next_due_at_empty_queue(db_session_factory, queue_service) -> None:
    q = queue_service.queue(limit=10)
    assert q["items"] == []
    assert q["due_count"] == 0
    assert q["next_due_at"] is None
    summary = queue_service.summary()
    assert summary["due_count"] == 0
    assert summary["next_due_at"] is None


def test_suspended_item_rejected(db_session_factory, queue_service, answer_service) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    item_id = _first_item_id(queue_service)
    with db_session_factory() as db:
        item = db.get(ReviewItem, item_id)
        item.status = "suspended"
        db.commit()
    with pytest.raises(ReviewSuspendedError):
        answer_service.submit(item_id, answer=0, user_rating=RATING_GOOD, dedup_key="s1")


def test_unknown_item_id(db_session_factory, queue_service, answer_service) -> None:
    with pytest.raises(ReviewNotFoundError):
        answer_service.get_item(999999)
    with pytest.raises(ReviewNotFoundError):
        answer_service.submit(999999, answer=0, user_rating=RATING_GOOD)


# --- API ---


def test_api_queue_no_answer_key(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    resp = client.get("/api/reviews/queue")
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"]
    item = body["items"][0]
    assert "answer_spec" not in item
    assert "correct" not in item
    assert "explanation" not in item


def test_api_get_item_no_answer_key(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    item_id = client.get("/api/reviews/queue").json()["items"][0]["id"]
    resp = client.get(f"/api/reviews/{item_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["prompt"]
    assert "answer_spec" not in body
    assert "correct" not in body
    assert body["question_type"] in {
        "single_choice",
        "multiple_choice",
        "ordering",
        "numeric",
        "parameter_selection",
        "error_diagnosis",
        "reveal_and_rate",
    }


def test_api_unknown_item_404(make_client) -> None:
    client = make_client()
    assert client.get("/api/reviews/999999").status_code == 404
    resp = client.post("/api/reviews/999999/submit", json={"answer": 0, "user_rating": "Good"})
    assert resp.status_code == 404
    assert client.post("/api/reviews/999999/skip").status_code == 404


def test_api_submit_wrong_type_422(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    item_id = client.get("/api/reviews/queue").json()["items"][0]["id"]
    resp = client.post(
        f"/api/reviews/{item_id}/submit",
        json={"answer": "не число", "user_rating": "Good", "dedup_key": "t1"},
    )
    assert resp.status_code == 422


def test_api_submit_invalid_rating_422(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    item_id = client.get("/api/reviews/queue").json()["items"][0]["id"]
    resp = client.post(
        f"/api/reviews/{item_id}/submit", json={"answer": 0, "user_rating": "Amazing"}
    )
    assert resp.status_code == 422


def test_api_dedup_and_history(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    item_id = client.get("/api/reviews/queue").json()["items"][0]["id"]
    payload = {"answer": 0, "user_rating": "Good", "dedup_key": "api-dup"}
    first = client.post(f"/api/reviews/{item_id}/submit", json=payload)
    assert first.status_code == 200
    second = client.post(f"/api/reviews/{item_id}/submit", json=payload)
    assert second.json()["deduplicated"] is True
    hist = client.get("/api/reviews/history")
    assert hist.status_code == 200
    assert hist.json()["count"] >= 1


def test_api_no_absolute_paths(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    for path in ["/api/reviews/queue", "/api/reviews/summary"]:
        text = client.get(path).text
        assert "/Users/" not in text
        assert "content/vault" not in text


# --- Today ---


def test_today_new_user_no_reviews(make_client) -> None:
    client = make_client()
    resp = client.get("/api/today")
    assert resp.status_code == 200
    body = resp.json()
    assert body["review_summary"]["due_count"] == 0
    assert body["due_reviews"] == 0
    assert body["overdue_reviews"] == 0
    assert body["next_review_at"] is None
    assert body["review_action"] is None


def test_today_with_due_reviews(make_client, db_session_factory) -> None:
    with db_session_factory() as db:
        _complete_lesson(db, LESSON_TREE)
    client = make_client()
    body = client.get("/api/today").json()
    assert body["due_reviews"] > 0
    assert body["review_action"] == "review_session"
    assert body["review_summary"]["active_items"] > 0
    # Продолжение урока не скрывается (поля остаются).
    assert "continue_lesson" in body
