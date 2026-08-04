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
