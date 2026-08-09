"""Динамические review-шаблоны для любого опубликованного урока.

Ключевые темы Classic ML по-прежнему используют точные объективные вопросы
из реестра. Эти шаблоны закрывают остальные курсы содержательным recall и
application prompt, не требуя второго набора вручную синхронизируемых карточек.
"""

from __future__ import annotations

from app.db.models import ContentItem
from app.services.reviews.registry import ReviewTemplate

PREFIX = "auto.lesson."
KINDS = ("concept", "application")


def template_id(lesson_id: str, kind: str) -> str:
    return f"{PREFIX}{lesson_id}.{kind}"


def parse_template_id(value: str) -> tuple[str, str] | None:
    if not value.startswith(PREFIX):
        return None
    payload = value[len(PREFIX) :]
    lesson_id, separator, kind = payload.rpartition(".")
    if not separator or kind not in KINDS or not lesson_id:
        return None
    return lesson_id, kind


def build_dynamic_template(db, value: str) -> ReviewTemplate | None:
    parsed = parse_template_id(value)
    if parsed is None:
        return None
    lesson_id, kind = parsed
    lesson = db.get(ContentItem, lesson_id)
    if lesson is None or lesson.type != "lesson":
        return None
    skill = next(iter(lesson.skill_ids or []), f"course.{lesson.course_id or 'general'}")
    if kind == "concept":
        prompt = (
            f"Без конспекта объясните тему «{lesson.title}»: какую проблему она решает, "
            "как работает механизм и какое у него главное ограничение. Добавьте один пример."
        )
        explanation = (
            "Сверьте ответ с уроком: в хорошем объяснении есть проблема, причинный механизм, "
            "конкретный пример и хотя бы одно ограничение. Если один из элементов потерян, "
            "выберите Hard или Again."
        )
        title = f"Recall: {lesson.title}"
        axes = {"theory": 0.18, "interpret": 0.12}
    else:
        prompt = (
            f"Мини-кейс по теме «{lesson.title}»: придумайте небольшой набор входных данных, "
            "опишите ожидаемый результат, один способ проверки и типичную ошибку реализации."
        )
        explanation = (
            "Проверьте четыре части: входные данные, ожидаемый результат, измеримая проверка и "
            "реалистичная ошибка. Ответ должен показывать применение, а не повторять определение."
        )
        title = f"Применение: {lesson.title}"
        axes = {"apply": 0.2, "interpret": 0.12}
    return ReviewTemplate(
        id=value,
        title=title,
        prompt=prompt,
        question_type="reveal_and_rate",
        explanation=explanation,
        primary_skill=skill,
        knowledge_axes=axes,
        source_content_id=lesson.id,
        source_lesson_id=lesson.id,
        source_type="lesson",
        source_id=lesson.id,
        difficulty="standard",
        evidence_weight=0.7,
    )
