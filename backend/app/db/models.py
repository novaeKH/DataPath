"""Предметные модели контентного каталога (Фаза 2).

Таблицы:
- content_items   — каталог материалов из content/vault (одна строка = одна заметка)
- content_links   — связи между материалами (wiki/markdown ссылки, prerequisites)
- content_issues  — ошибки и предупреждения последней валидации
- sync_runs       — история запусков синхронизации

Схема согласована с docs/content-system.md и docs/architecture.md.
Абсолютные пути файловой системы в базе не хранятся: только относительный путь внутри vault.
"""

from __future__ import annotations

from app.db.base import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship


class ContentItem(Base):
    """Одна заметка vault, попавшая в каталог приложения."""

    __tablename__ = "content_items"

    id: Mapped[str] = mapped_column(
        String, primary_key=True
    )  # стабильный content ID из frontmatter
    path: Mapped[str] = mapped_column(
        String, nullable=False, unique=True
    )  # относительный путь в vault
    type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    area: Mapped[str | None] = mapped_column(String)
    status: Mapped[str | None] = mapped_column(String)
    language: Mapped[str | None] = mapped_column(String)
    app: Mapped[str] = mapped_column(
        String, nullable=False
    )  # include | source (exclude не хранится)
    rag: Mapped[str | None] = mapped_column(String)
    rag_collection: Mapped[str | None] = mapped_column(String)
    publish: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    course_id: Mapped[str | None] = mapped_column(
        ForeignKey("content_items.id", ondelete="SET NULL")
    )
    module_id: Mapped[str | None] = mapped_column(
        ForeignKey("content_items.id", ondelete="SET NULL"), index=True
    )
    module_order: Mapped[int | None] = mapped_column(Integer)
    lesson_order: Mapped[int | None] = mapped_column(Integer)
    content_path: Mapped[str | None] = mapped_column(String)
    practice_kind: Mapped[str | None] = mapped_column(String)
    skill_ids: Mapped[list | None] = mapped_column(JSON)
    difficulty: Mapped[str | None] = mapped_column(String)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer)
    estimated_hours: Mapped[float | None] = mapped_column(Float)
    accent: Mapped[str | None] = mapped_column(String)
    icon: Mapped[str | None] = mapped_column(String)
    aliases: Mapped[list | None] = mapped_column(JSON)
    tags: Mapped[list | None] = mapped_column(JSON)
    math_depth: Mapped[int | None] = mapped_column(Integer)

    frontmatter: Mapped[dict] = mapped_column(JSON, nullable=False)
    prerequisites: Mapped[list | None] = mapped_column(JSON)  # явные prerequisites из frontmatter

    content_hash: Mapped[str] = mapped_column(String, nullable=False)  # SHA-256 файла
    file_mtime: Mapped[str] = mapped_column(String, nullable=False)
    synced_at: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)

    validation_status: Mapped[str] = mapped_column(String, nullable=False, default="ok")

    out_links: Mapped[list[ContentLink]] = relationship(
        "ContentLink",
        foreign_keys="ContentLink.source_id",
        back_populates="source_item",
        cascade="all, delete-orphan",
    )
    in_links: Mapped[list[ContentLink]] = relationship(
        "ContentLink",
        foreign_keys="ContentLink.target_id",
        back_populates="target_item",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_content_items_type", "type"),
        Index("ix_content_items_publish", "publish"),
        Index("ix_content_items_course_id", "course_id"),
        Index("ix_content_items_slug", "slug"),
    )


class ContentLink(Base):
    """Связь между двумя материалами каталога."""

    __tablename__ = "content_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("content_items.id", ondelete="CASCADE"), index=True
    )
    target_id: Mapped[str] = mapped_column(
        ForeignKey("content_items.id", ondelete="CASCADE"), index=True
    )
    relation: Mapped[str] = mapped_column(String, nullable=False, default="link")
    # relation: link | prerequisite | applied_in
    kind: Mapped[str] = mapped_column(String, nullable=False)
    # kind: wiki | markdown | content_path | explicit | implied

    source_item: Mapped[ContentItem] = relationship(
        "ContentItem", foreign_keys=[source_id], back_populates="out_links"
    )
    target_item: Mapped[ContentItem] = relationship(
        "ContentItem", foreign_keys=[target_id], back_populates="in_links"
    )

    __table_args__ = (
        UniqueConstraint("source_id", "target_id", "relation", "kind", name="uq_content_links"),
    )


class ContentIssue(Base):
    """Ошибка/предупреждение валидации (пересоздаётся при каждой синхронизации)."""

    __tablename__ = "content_issues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[str | None] = mapped_column(
        ForeignKey("content_items.id", ondelete="CASCADE"), index=True
    )
    path: Mapped[str] = mapped_column(String, nullable=False, index=True)  # относительный путь
    severity: Mapped[str] = mapped_column(String, nullable=False)  # error | warning
    code: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    synced_at: Mapped[str] = mapped_column(String, nullable=False, index=True)


class SyncRun(Base):
    """Один запуск синхронизации vault → каталог."""

    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    started_at: Mapped[str] = mapped_column(String, nullable=False)
    finished_at: Mapped[str | None] = mapped_column(String)
    scanned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unchanged: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    removed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warnings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


# --- Фаза 4: модель знаний и прогресс пользователя (один локальный пользователь) ---


class LearningEvent(Base):
    """Неизменяемый журнал фактов обучения (append-only).

    Каждое событие — одно измерение: сцена, лаборатория, кейс, завершение урока.
    `dedup_key` защищает от повторного начисления одинакового evidence
    (уникален для конкретного источника и результата).
    """

    __tablename__ = "learning_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    # event_type: scene_complete | lesson_complete | lab_recorded | case_submitted | checkpoint
    source_type: Mapped[str] = mapped_column(
        String, nullable=False, index=True
    )  # lesson | lab | case
    source_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    skill_id: Mapped[str | None] = mapped_column(String, index=True)
    knowledge_axis: Mapped[str | None] = mapped_column(String)
    outcome: Mapped[str | None] = mapped_column(String)
    # outcome: completed | correct | incorrect | partial | started
    score: Mapped[float | None] = mapped_column(Float)
    confidence: Mapped[float | None] = mapped_column(Float)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    error_code: Mapped[str | None] = mapped_column(String)
    meta: Mapped[dict | None] = mapped_column("metadata", MutableDict.as_mutable(JSON))
    dedup_key: Mapped[str | None] = mapped_column(String, unique=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, index=True)

    __table_args__ = (
        Index("ix_learning_events_source", "source_type", "source_id"),
        Index("ix_learning_events_skill_axis", "skill_id", "knowledge_axis"),
    )


class SkillAssessment(Base):
    """Текущее агрегированное состояние навыка (одна строка на skill_id).

    Оси из docs/knowledge-model.md хранятся в JSON:
    {"theory": {"alpha": .., "beta": .., "evidence_count": N, "score": ..}, ...}

    score = alpha / (alpha + beta) — консервативная байесовская оценка.
    Состояние: not_started | exploring | developing | strong | needs_attention.
    """

    __tablename__ = "skill_assessments"

    skill_id: Mapped[str] = mapped_column(String, primary_key=True)
    axes: Mapped[dict] = mapped_column(MutableDict.as_mutable(JSON), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    state: Mapped[str] = mapped_column(String, nullable=False, default="not_started")
    last_activity_at: Mapped[str | None] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


class LessonProgress(Base):
    """Прогресс по уроку: текущая сцена и завершённые сцены."""

    __tablename__ = "lesson_progress"

    lesson_id: Mapped[str] = mapped_column(String, primary_key=True)
    current_scene_id: Mapped[str | None] = mapped_column(String)
    completed_scenes: Mapped[list] = mapped_column(
        MutableList.as_mutable(JSON), nullable=False, default=list
    )
    started_at: Mapped[str] = mapped_column(String, nullable=False)
    completed_at: Mapped[str | None] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


class LabAttempt(Base):
    """Сохранённый результат выполненной лаборатории (идемпотентно).

    Расчёт результата остаётся в Lab API; здесь только фактический результат
    и создание evidence. `dedup_key` = hash(lab_id + parameters + score).
    """

    __tablename__ = "lab_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lab_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    lesson_id: Mapped[str | None] = mapped_column(String)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result_summary: Mapped[dict | None] = mapped_column(JSON)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    evidence: Mapped[dict | None] = mapped_column(JSON)
    dedup_key: Mapped[str | None] = mapped_column(String, unique=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False)


class CaseAttempt(Base):
    """Одна попытка прохождения кейса (структурированные ответы)."""

    __tablename__ = "case_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String, nullable=False)  # guided | standard | interview
    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    completed_at: Mapped[str] = mapped_column(String, nullable=False)


# --- Фаза 5: интервальное повторение (review_items, review_attempts) ---


class ReviewItem(Base):
    """Текущее состояние элемента повторения (одна строка на template).

    template_id стабилен и уникален: один шаблон не создаёт несколько
    активных элементов. Даты — ISO-8601 UTC. stage: learning | review |
    relearning. status: active | suspended.
    """

    __tablename__ = "review_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    primary_skill_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # lesson | lab | case (что активировало элемент)
    source_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String, nullable=False, default="learning")
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    due_at: Mapped[str] = mapped_column(String, nullable=False, index=True)
    interval_days: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ease_factor: Mapped[float] = mapped_column(Float, nullable=False, default=2.5)
    repetitions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lapses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_reviewed_at: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)

    __table_args__ = (
        Index("ix_review_items_status_due", "status", "due_at"),
        Index("ix_review_items_source", "source_type", "source_id"),
    )


class ReviewAttempt(Base):
    """Неизменяемая история ответов на повторения (append-only).

    dedup_key предотвращает повторную запись одной отправки: повторный
    submit с тем же ключом возвращает существующую попытку и не начисляет
    evidence повторно.
    """

    __tablename__ = "review_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_item_id: Mapped[int] = mapped_column(
        ForeignKey("review_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    answer: Mapped[dict | None] = mapped_column(MutableDict.as_mutable(JSON))
    objective_score: Mapped[float | None] = mapped_column(Float)
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    user_rating: Mapped[str | None] = mapped_column(String)
    effective_rating: Mapped[str] = mapped_column(String, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_time_ms: Mapped[int | None] = mapped_column(Integer)
    dedup_key: Mapped[str | None] = mapped_column(String, unique=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, index=True)

    item: Mapped[ReviewItem] = relationship("ReviewItem")
