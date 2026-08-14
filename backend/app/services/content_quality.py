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

import ast
import json
import re
from pathlib import Path

from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ContentItem
from app.db.session import SessionLocal
from app.services.lesson_content import (
    META_SECTION_TITLES,
    VISUAL_DEMO_IDS,
    LessonContentService,
)

KEY_LESSON_PREFIXES = (
    "lesson.classic-ml.linear.regression",
    "lesson.classic-ml.linear.logistic",
    "lesson.classic-ml.trees",
    "lesson.classic-ml.unsupervised.pca",
    "lesson.deep-learning",
    "lesson.llm-rag",
)

PLACEHOLDER_MARKERS = (
    "lorem ipsum",
    "todo:",
    "tbd",
    "draft route",
    "контент готов как draft",
    "включать в приложение после реализации",
)

_BAD_EXAMPLE_MARKER = re.compile(r"(?mi)^(?:Плохо|Неправильно):\s*$")
_GOOD_EXAMPLE_MARKER = re.compile(r"(?mi)^(?:Правильно|Хорошо|Лучше):\s*$")
_PYTHON_FENCED_BLOCK = re.compile(
    r"```(?:python|py)[ \t]*\n(.*?)\n```",
    flags=re.IGNORECASE | re.DOTALL,
)
_INCOMPLETE_PYTHON_BLOCK = re.compile(
    r"(?:^[ \t]*(?:\.\.\.|…)(?:[ \t]*#.*)?$|(?:\+=|=|return)[ \t]*(?:\.\.\.|…)(?:[ \t]*#.*)?$)",
    flags=re.MULTILINE,
)
_GENERIC_OBJECTIVE_IN_OUTPUT = re.compile(r"Разобрать каноническую главу №\d+")


def _source_prose_word_count(markdown: str) -> int:
    """Считает объясняющую прозу source, не выдавая код и формулы за урок."""
    value = re.sub(r"\A---\n.*?\n---\n", "", markdown, flags=re.DOTALL)
    value = re.sub(r"```.*?```", "", value, flags=re.DOTALL)
    value = re.sub(r"\$\$.*?\$\$", "", value, flags=re.DOTALL)
    value = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", value)
    value = re.sub(r"(?m)^\s*\|.*$", "", value)
    return len(re.findall(r"[A-Za-zА-Яа-яЁё0-9_+-]+", value))


def _unpaired_contrast_sections(markdown: str) -> list[str]:
    """Разделы, где показана только одна половина пары «ошибка → исправление»."""
    result: list[str] = []
    for section in re.split(r"(?m)^##\s+", markdown)[1:]:
        lines = section.splitlines()
        if not lines:
            continue
        body = "\n".join(lines[1:])
        has_bad = bool(_BAD_EXAMPLE_MARKER.search(body))
        has_good = bool(_GOOD_EXAMPLE_MARKER.search(body))
        if has_bad != has_good:
            result.append(lines[0].strip())
    return result


def _invalid_python_examples(markdown: str) -> list[tuple[int, str]]:
    """Синтаксические ошибки в fenced Python-примерах с номером строки source."""
    result: list[tuple[int, str]] = []
    for match in _PYTHON_FENCED_BLOCK.finditer(markdown):
        line = markdown[: match.start()].count("\n") + 1
        try:
            ast.parse(match.group(1))
        except SyntaxError as exc:
            result.append((line, exc.msg))
    return result


def _incomplete_python_examples(markdown: str) -> list[int]:
    """Строки fenced Python-блоков с учебным пропуском вместо действия."""
    return [
        markdown[: match.start()].count("\n") + 1
        for match in _PYTHON_FENCED_BLOCK.finditer(markdown)
        if _INCOMPLETE_PYTHON_BLOCK.search(match.group(1))
    ]


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

        canonical_numbers = {
            lesson.id: int((lesson.frontmatter or {}).get("canonical_number"))
            for lesson in lessons
            if (lesson.frontmatter or {}).get("canonical_number") is not None
        }

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
            lesson_body = self.lesson_service._read_lesson_body(lesson_item)
            source_body = self.lesson_service._read_source(lesson_item.content_path) or ""
            combined_body = f"{lesson_body}\n{source_body}".lower()
            canonical_number = canonical_numbers.get(lid)

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

            # Broken visualizer references are product errors: Focus would render
            # a dead block even though the lesson manifest itself is valid JSON.
            for scene in scenes:
                if scene.get("type") != "visual_demo":
                    continue
                demo_id = scene.get("demo_id")
                if not demo_id or demo_id not in VISUAL_DEMO_IDS:
                    errors.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "broken_visualizer_reference",
                            "message": f"Неизвестный visualizer id: {demo_id or '—'}",
                        }
                    )

            # Assessment semantics are part of content integrity. Reflective/self-rating
            # prompts never require a correct answer; objective quizzes always do.
            valid_assessment_types = {
                "self_assessment",
                "single_choice_quiz",
                "multiple_choice_quiz",
                "free_response",
                "reflection",
            }
            for scene in scenes:
                if scene.get("type") != "checkpoint":
                    continue
                assessment_type = scene.get("assessment_type")
                if assessment_type not in valid_assessment_types:
                    errors.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "invalid_assessment_type",
                            "message": f"Неизвестный assessment_type: {assessment_type or '—'}",
                        }
                    )
                    continue
                if assessment_type not in {"single_choice_quiz", "multiple_choice_quiz"}:
                    continue
                correct_count = len(
                    re.findall(
                        r"^[-*]\s*\[[xX]\]\s+.+$",
                        scene.get("question") or "",
                        flags=re.MULTILINE,
                    )
                )
                expected = 1 if assessment_type == "single_choice_quiz" else 2
                if correct_count < expected:
                    errors.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "objective_assessment_without_answer",
                            "message": "Objective quiz не содержит корректно размеченный ответ",
                        }
                    )

            for marker in PLACEHOLDER_MARKERS:
                if marker in combined_body:
                    errors.append(
                        {
                            "lesson_id": lid,
                            "code": "placeholder_content",
                            "message": f"Найден служебный placeholder marker: {marker}",
                        }
                    )
                    break

            incomplete_python = _incomplete_python_examples(source_body)
            if incomplete_python:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "incomplete_python_example",
                        "message": (
                            "Python-пример содержит исполняемый пропуск `...` вместо действия "
                            f"(строки: {', '.join(map(str, incomplete_python))})"
                        ),
                    }
                )

            if any(
                _GENERIC_OBJECTIVE_IN_OUTPUT.search(str(scene.get("markdown") or ""))
                for scene in scenes
            ):
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "generic_learning_objective_in_output",
                        "message": "В интерфейс попала служебная цель вместо результата урока",
                    }
                )

            if canonical_number is not None:
                for prerequisite_id in lesson_item.prerequisites or []:
                    prerequisite_number = canonical_numbers.get(prerequisite_id)
                    if prerequisite_number is not None and prerequisite_number >= canonical_number:
                        errors.append(
                            {
                                "lesson_id": lid,
                                "code": "forward_prerequisite",
                                "message": (
                                    f"Prerequisite №{prerequisite_number} стоит не раньше "
                                    f"урока №{canonical_number}"
                                ),
                            }
                        )

            invalid_python = _invalid_python_examples(source_body)
            if invalid_python:
                details = ", ".join(f"строка {line}: {message}" for line, message in invalid_python)
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "invalid_python_example",
                        "message": f"Python-пример не разбирается интерпретатором ({details})",
                    }
                )

            unpaired_sections = _unpaired_contrast_sections(source_body)
            if unpaired_sections:
                errors.append(
                    {
                        "lesson_id": lid,
                        "code": "unpaired_contrast_example",
                        "message": (
                            "Неполная пара «неправильно/правильно» в разделах: "
                            + ", ".join(unpaired_sections)
                        ),
                    }
                )

            for scene in scenes:
                if scene.get("type") != "code":
                    continue
                caption = scene.get("caption") or ""
                if _BAD_EXAMPLE_MARKER.search(caption) or _GOOD_EXAMPLE_MARKER.search(caption):
                    errors.append(
                        {
                            "lesson_id": lid,
                            "scene_id": scene.get("id"),
                            "code": "misordered_example_label",
                            "message": (
                                "Метка примера попала после code block вместо позиции перед ним"
                            ),
                        }
                    )

            # --- Warnings ---

            # Repeated level-2 headings usually indicate a mechanical merge or
            # duplicated section. Check each canonical file independently so
            # shared names between the lesson wrapper and source are not noise.
            for source_name, body in (("lesson", lesson_body), ("source", source_body)):
                headings = [
                    match.group(1).strip().casefold()
                    for match in re.finditer(r"^##\s+(.+?)\s*$", body, flags=re.MULTILINE)
                ]
                duplicates = sorted(
                    {heading for heading in headings if headings.count(heading) > 1}
                )
                if duplicates:
                    warnings.append(
                        {
                            "lesson_id": lid,
                            "code": "duplicate_section",
                            "message": (
                                f"Повторяющиеся разделы в {source_name}: " + ", ".join(duplicates)
                            ),
                        }
                    )

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

            # Пустые сцены
            for scene in scenes:
                if scene.get("word_count", 0) == 0 and scene.get("type") not in (
                    "interactive_lab",
                    "visual_demo",
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

            if not any(
                heading in lesson_body
                for heading in ("## Результат урока", "## Результат", "## Цели урока")
            ):
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "missing_learning_objectives",
                        "message": "Урок без learning objectives",
                    }
                )

            total_words = sum(int(scene.get("word_count") or 0) for scene in content_scenes)
            total_words += sum(
                len(str(scene.get("code") or "").split())
                for scene in content_scenes
                if scene.get("type") == "code"
            )
            minimum_words = 300 if lid.startswith(KEY_LESSON_PREFIXES) else 180
            if total_words < minimum_words:
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "lesson_too_short",
                        "message": (
                            f"Учебный материал содержит около {total_words} слов; "
                            f"минимум для этого типа урока — {minimum_words}"
                        ),
                    }
                )

            if canonical_number is not None and _source_prose_word_count(source_body) < 400:
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "canonical_source_prose_too_short",
                        "message": (
                            "Source содержит меньше 400 слов объясняющей прозы без учёта "
                            "кода и формул"
                        ),
                    }
                )

            if canonical_number not in {None, 1, 23, 27} and not lesson_item.prerequisites:
                warnings.append(
                    {
                        "lesson_id": lid,
                        "code": "missing_semantic_prerequisites",
                        "message": "Для урока не указаны смысловые prerequisite-темы",
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

            has_example = (
                "example" in semantic_roles
                or any(
                    marker in combined_body
                    for marker in ("пример", "например", "example", "mini-case", "мини-кейс")
                )
                or any(scene.get("type") == "code" for scene in scenes)
            )
            if not has_example:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_example",
                        "message": "Урок без сцены с примером",
                    }
                )
            has_visual = bool(
                {"visual", "visual_demo", "interactive_lab"} & {s.get("type") for s in scenes}
            ) or any(scene.get("contains_visual") for scene in scenes)
            if "visualization" not in semantic_roles and not has_visual:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_visualization",
                        "message": "Урок без визуализации",
                    }
                )
            has_code = "code" in semantic_roles or any(
                scene.get("type") == "code" for scene in scenes
            )
            if not has_code:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_code",
                        "message": "Урок без кода",
                    }
                )
            has_pitfalls = (
                "pitfalls" in semantic_roles
                or any(
                    marker in combined_body
                    for marker in ("частые ошибки", "типичные ошибки", "pitfall")
                )
                or bool(re.search(r"(?mi)^##\s+.*ошиб", source_body))
            )
            if not has_pitfalls:
                suggestions.append(
                    {
                        "lesson_id": lid,
                        "code": "no_pitfalls",
                        "message": "Урок без блока типичных ошибок",
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
