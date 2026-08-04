"""Базовый DeclarativeBase для моделей SQLAlchemy.

Предметные модели (content_catalog, skill_assessment и т.д.) появятся
в Фазе 2+ — см. docs/architecture.md.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Единая база для всех ORM-моделей."""
