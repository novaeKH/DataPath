"""Content quality auditor — read-only CLI (Фаза 6A).

Проверки:
- Errors: битый content_path, path traversal, битый asset, пустой урок, parser crash.
- Warnings: отсутствующий source_heading, пустая сцена, короткая/длинная сцена,
  урок без skills/checkpoint, битое изображение, служебная секция в выводе.
- Suggestions: урок без примера/визуализации/кода/pitfalls/comparison/practice/review/case.

Использование:
    PYTHONPATH= uv run python -m app.cli.content quality
    PYTHONPATH= uv run python -m app.cli.content quality --course course.classic-ml
    PYTHONPATH= uv run python -m app.cli.content quality --lesson lesson.classic-ml.trees.tree
    PYTHONPATH= uv run python -m app.cli.content quality --json
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ContentItem
from app.db.session import SessionLocal
from app.services.lesson_content import (
    META_SECTION_TITLES,
    LessonContentService,
)


class ContentQualityAuditor:
    """Read-only аудитор качества контента."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.lesson_service = LessonContentService(
            settings=self.settings,
            session_factory=self.session_factory,
        )

    def audit(
        self,
        course_id: str | None = None,
        lesson_id: str | None = None,
    ) -> dict:
        """Запускает аудит и возвращает структурированный результат."""
        errors: list[dict] = []
        warnings: list[dict] = []
        suggestions: list[dict] = []

        with self.session_factory() as db:
            query = db.query(ContentItem).where(
                ContentItem.type == "lesson",
                ContentItem.publish.is_(True),
            )
            if course_id:
                query = query.where(ContentItem.course_id == course_id)
            if lesson_id:
                query = query.where(ContentItem.id == lesson_id)

            lessons = query.order_by(ContentItem.module_order, ContentItem.lesson_order).all()

        if not lessons:
            return {
                "lessons_checked": 0,
                "errors": [],
                "warnings": [],
                "suggestions": [],
            }

        for lesson_item in lessons:
            lid = lesson_item.id
            try:
                lesson_data = self.lesson_service.lesson(lid)
            except Exception as exc:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "parser_crash",
                        "message": f"Parser crashed: {exc}",
                    }
                )
                continue

            if lesson_data is None:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "lesson_not_found",
                        "message": "Урок не найден в каталоге",
                    }
                )
                continue

            scenes = lesson_data.get("scenes", [])
            skills = lesson_data.get("skills", [])

            # --- Errors ---

            # Проверка content_path
            if not lesson_item.content_path:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "missing_content_path",
                        "message": "Урок без content_path",
                    }
                )
            else:
                # Проверка на path traversal
                raw = Path(lesson_item.content_path)
                if raw.is_absolute() or ".." in str(raw):
                    errors.append(
                        {
                            "lesson_id": lid,
                            "code": "path_traversal",
                            "message": (
                                f"content_path содержит path traversal: {lesson_item.content_path}"
                            ),
                        }
                    )

            # Проверка на пустой урок (нет сцен кроме labs/checkpoints)
            content_scenes = [
                s for s in scenes if s.get("type") not in ("interactive_lab", "checkpoint")
            ]
            if not content_scenes and not scenes:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "empty_lesson",
                        "message": "Урок не содержит учебных сцен",
                    }
                )

            # --- Warnings ---

            # source_heading resolution: fallback/missing → warning (Фаза 6A).
            # Внимание: все пять уроков MVP настраивают «Коротко»/«Интуиция»,
            # которых нет в реальных source-заметках — это осознанный fallback,
            # и он теперь виден в аудите.
            for resolution in lesson_data.get("heading_resolution", []):
                status = resolution.get("status")
                if status in ("fallback", "missing"):
                    requested = resolution.get("requested_heading") or ""
                    selected = resolution.get("selected_heading")
                    alias = resolution.get("known_alias")
                    extra = ""
                    if alias:
                        extra = f"; известный синоним: «{alias}»"
                    if status == "fallback":
                        message = (
                            f"source_heading «{requested}» не найден в source-заметке; "
                            f"используются все секции по порядку{extra}"
                        )
                    else:
                        message = (
                            f"source_heading «{requested}» не может быть разрешён: "
                            f"source-заметка недоступна или пуста"
                        )
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "code": f"source_heading_{status}",
                            "message": message,
                            "diagnostic": {
                                "lesson_id": lid,
                                "source_content_id": lesson_data.get("source_content_id"),
                                "requested_heading": requested,
                                "selected_heading": selected,
                                "status": status,
                                "source_file": lesson_data.get("source_path"),
                            },
                        }
                    )

            # Проверка source_heading (hook-сцены не от source — ок)
            for scene in scenes:
                stype = scene.get("type", "")
                if stype in ("markdown", "formula", "code", "callout", "visual", "table"):
                    # Hook сцены (первая сцена, title из datapath)
                    # не обязаны иметь source_heading
                    if (
                        scene.get("source_content_id") is None
                        and scene.get("source_heading") is None
                    ):
                        continue
                    if not scene.get("source_heading"):
                        warnings.append(
                            {
                                "lesson_id": lid,
                                "scene_id": scene.get("id"),
                                "code": "missing_source_heading",
                                "message": "Сцена без source_heading",
                            }
                        )

            # Пустые сцены
            for scene in scenes:
                if scene.get("word_count", 0) == 0 and scene.get("type") not in (
                    "interactive_lab",
                    "checkpoint",
                    "code",
                    "formula",
                    "visual",
                ):
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "empty_scene",
                            "message": "Пустая сцена (word_count=0)",
                        }
                    )

            # Слишком короткая текстовая сцена
            for scene in scenes:
                if scene.get("type") == "markdown" and 0 < scene.get("word_count", 0) < 5:
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "very_short_scene",
                            "message": f"Markdown-сцена из {scene['word_count']} слов",
                        }
                    )

            # Слишком большая сцена
            for scene in scenes:
                if scene.get("type") == "markdown" and scene.get("word_count", 0) > 400:
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "very_large_scene",
                            "message": f"Markdown-сцена из {scene['word_count']} слов",
                        }
                    )

            # Урок без skills
            if not skills:
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "no_skills",
                        "message": "Урок без skills",
                    }
                )

            # Урок без checkpoint
            checkpoints = [s for s in scenes if s.get("type") == "checkpoint"]
            if not checkpoints:
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "no_checkpoint",
                        "message": "Урок без checkpoint",
                    }
                )

            # Служебные секции в выводе
            for scene in scenes:
                title = (scene.get("title") or "").strip()
                if title in META_SECTION_TITLES:
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "meta_section_in_output",
                            "message": f"Служебная секция '{title}' в выводе урока",
                        }
                    )

            # --- Suggestions ---

            semantic_roles = {s.get("semantic_role") for s in scenes}

            if "example" not in semantic_roles:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_example",
                        "message": "Урок без сцены с примером",
                    }
                )
            has_visual = "visual" in {s.get("type") for s in scenes}
            if "visualization" not in semantic_roles and not has_visual:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_visualization",
                        "message": "Урок без визуализации",
                    }
                )
            if "code" not in semantic_roles:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_code",
                        "message": "Урок без кода",
                    }
                )
            if "pitfalls" not in semantic_roles:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_pitfalls",
                        "message": "Урок без блока типичных ошибок",
                    }
                )
            if "comparison" not in semantic_roles:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_comparison",
                        "message": "Урок без сравнения",
                    }
                )

        return {
            "lessons_checked": len(lessons),
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions,
        }

    def print_report(self, result: dict, json_output: bool = False) -> None:
        """Выводит отчёт в читаемом или JSON формате."""
        if json_output:
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return

        n = result["lessons_checked"]
        errs = result["errors"]
        warns = result["warnings"]
        suggs = result["suggestions"]

        print(f"Content Quality Audit: проверено уроков — {n}")
        print(f"  Errors:      {len(errs)}")
        print(f"  Warnings:    {len(warns)}")
        print(f"  Suggestions: {len(suggs)}")

        if errs:
            print("\n=== ERRORS ===")
            for e in errs:
                lid = e.get("lesson_id", "")
                sid = e.get("scene_id", "")
                loc = f"{lid}/{sid}" if sid else lid
                print(f"  [{e['code']}] {loc}: {e['message']}")

        if warns:
            print("\n=== WARNINGS ===")
            for w in warns:
                lid = w.get("lesson_id", "")
                sid = w.get("scene_id", "")
                loc = f"{lid}/{sid}" if sid else lid
                print(f"  [{w['code']}] {loc}: {w['message']}")
                diag = w.get("diagnostic")
                if diag:
                    src = diag.get("source_file") or diag.get("source_content_id") or ""
                    print(f"      → source: {src}")

        if suggs:
            print("\n=== SUGGESTIONS ===")
            for s in suggs:
                print(f"  [{s['code']}] {s['lesson_id']}: {s['message']}")
