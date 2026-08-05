"""Построение интерактивных уроков и модели сцен (Фаза 3).

LessonContentService читает из SQLite только метаданные урока, а из vault —
только два файла: сам урок (для datapath-сценария и проверки понимания) и
source-заметку по content_path. Весь парсинг Markdown и построение сцен
происходит здесь, на Python; frontend получает готовые сцены.

Модель сцен (расширяемая):
- markdown        — связное объяснение (заголовок секции + текст/списки/таблицы)
- formula         — LaTeX-формула с кратким пояснением
- code            — fenced code block (язык + код)
- callout         — Obsidian callout (> [!type])
- checkpoint      — вопрос для самопроверки (без сохранения оценки)
- interactive_lab — ссылка на зарегистрированную лабораторию

Правила разбора детерминированы и не требуют изменения Markdown ради парсера:
секции отделяются заголовками H2, специализированные блоки (math/code/callout)
выделяются в отдельные сцены, остальной текст группируется в связные markdown.

Безопасность:
- пути резолвятся строго внутри vault_dir (защита от path traversal);
- клиенту не возвращаются абсолютные пути и сырой frontmatter;
- произвольный HTML/JS из Markdown не исполняется (санитизация на frontend).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings
from app.db.models import ContentItem
from app.db.session import SessionLocal
from app.services.labs.registry import LabRegistry, get_default_registry

# Заголовки-мета, которые не становятся учебными сценами.
META_SECTION_TITLES = {"Связи", "Источники", "Ссылки", "Links", "Sources"}

# Типы сцен, поддерживаемые frontend.
SCENE_TYPES = ("markdown", "formula", "code", "callout", "checkpoint", "interactive_lab")


@dataclass
class _Block:
    """Промежуточный блок разбора Markdown."""

    kind: str  # heading | markdown | math | code | callout
    text: str = ""
    language: str | None = None
    callout_type: str | None = None
    level: int = 0


def _extract_datapath(body: str) -> dict | None:
    """Достаёт первый fenced-блок ```datapath ... ``` и парсит JSON."""
    match = re.search(r"```datapath\s*\n(.*?)```", body, flags=re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _extract_summary_callout(body: str) -> str | None:
    """Возвращает Obsidian-callout `> [!summary] ...` целиком, если он есть."""
    match = re.search(r"^> \[!summary\][^\n]*\n(?:> .*\n?)+", body, flags=re.MULTILINE)
    if not match:
        return None
    return match.group(0).rstrip()


def _extract_checkpoints(body: str) -> list[str]:
    """Вопросы из раздела «Проверка понимания» (нумерованный список)."""
    match = re.search(
        r"^##\s+Проверка понимания\s*\n(.*?)(?=^##|\Z)",
        body,
        flags=re.MULTILINE | re.DOTALL,
    )
    if not match:
        return []
    questions: list[str] = []
    for line in match.group(1).splitlines():
        stripped = line.strip()
        item = re.match(r"^\d+\.\s+(.*)$", stripped)
        if item:
            questions.append(item.group(1).strip())
    return questions


def _split_blocks(text: str) -> list[_Block]:
    """Детерминированное блочное разбиение Markdown.

    Поддерживает: H1/H2/H3-заголовки, параграфы, списки, таблицы, blockquote,
    fenced code blocks, LaTeX-блоки ($$...$$) и Obsidian callouts.
    """
    lines = text.splitlines()
    blocks: list[_Block] = []
    buffer: list[str] = []
    i = 0
    n = len(lines)

    def flush_markdown() -> None:
        if buffer:
            content = "\n".join(buffer).strip()
            if content:
                blocks.append(_Block(kind="markdown", text=content))
            buffer.clear()

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Заголовки.
        if re.match(r"^#{1,4}\s+", stripped):
            flush_markdown()
            level = len(re.match(r"^(#+)", stripped).group(1))
            blocks.append(_Block(kind="heading", level=level, text=stripped.lstrip("#").strip()))
            i += 1
            continue

        # Fenced code block.
        fence = re.match(r"^```(\S*)\s*$", stripped)
        if fence:
            flush_markdown()
            language = fence.group(1) or None
            code_lines: list[str] = []
            i += 1
            while i < n and not re.match(r"^```\s*$", lines[i].strip()):
                code_lines.append(lines[i])
                i += 1
            i += 1  # закрывающий fence
            blocks.append(
                _Block(kind="code", language=language, text="\n".join(code_lines).rstrip())
            )
            continue

        # LaTeX-блок $$...$$ (отдельная строка или блок).
        if stripped.startswith("$$"):
            flush_markdown()
            formula_lines: list[str] = []
            if stripped == "$$":
                i += 1
                while i < n and lines[i].strip() != "$$":
                    formula_lines.append(lines[i])
                    i += 1
                i += 1  # закрывающий $$
            else:
                # Однострочный $$...$$
                formula_lines.append(stripped.strip("$"))
                i += 1
            formula = "\n".join(formula_lines).strip()
            if formula:
                blocks.append(_Block(kind="math", text=formula))
            continue

        # Obsidian callout.
        callout_match = re.match(r"^>\s*\[!(\w+)\](.*)$", stripped)
        if callout_match:
            flush_markdown()
            callout_type = callout_match.group(1).lower()
            title = callout_match.group(2).strip()
            callout_lines: list[str] = []
            if title:
                callout_lines.append(title)
            i += 1
            while i < n:
                q = lines[i].strip()
                if not q.startswith(">"):
                    break
                callout_lines.append(q.lstrip(">").strip())
                i += 1
            blocks.append(
                _Block(
                    kind="callout",
                    callout_type=callout_type,
                    text="\n".join(callout_lines).strip(),
                )
            )
            continue

        buffer.append(line)
        i += 1

    flush_markdown()
    return blocks


def _next_short_text(blocks: list[_Block], idx: int, max_len: int) -> str | None:
    """Короткий пояснительный текст сразу после блока (для formula/code)."""
    for j in range(idx + 1, len(blocks)):
        block = blocks[j]
        if block.kind == "markdown":
            text = block.text.strip()
            if len(text) <= max_len and not text.startswith("|"):
                return text
            return None
        if block.kind == "heading":
            return None
    return None


def _strip_frontmatter(text: str) -> str:
    """Убирает YAML frontmatter (--- ... ---), если он есть в начале текста."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2]
    return text


def build_source_scenes(source_markdown: str) -> list[dict]:
    """Строит сцены из source-заметки (после H1), исключая мета-разделы."""
    blocks = _split_blocks(_strip_frontmatter(source_markdown))
    scenes: list[dict] = []
    current_title: str | None = None
    current_buffer: list[str] = []
    skipping = False

    def flush_current() -> None:
        nonlocal current_buffer
        if current_buffer:
            content = "\n".join(current_buffer).strip()
            if content:
                scenes.append({"type": "markdown", "title": current_title, "markdown": content})
        current_buffer = []

    for idx, block in enumerate(blocks):
        if block.kind == "heading":
            flush_current()
            if block.level == 1:
                current_title = None
                skipping = False
            elif block.level == 2:
                if block.text.strip() in META_SECTION_TITLES:
                    skipping = True
                else:
                    skipping = False
                    current_title = block.text.strip()
            else:
                # H3/H4 — подзаголовок внутри секции.
                if not skipping:
                    current_buffer.append(f"### {block.text}")
            continue
        if skipping:
            continue
        if block.kind == "markdown":
            current_buffer.append(block.text)
        elif block.kind == "math":
            flush_current()
            explanation = _next_short_text(blocks, idx, max_len=400)
            scenes.append(
                {
                    "type": "formula",
                    "title": None,
                    "formula": block.text,
                    "explanation": explanation or "",
                }
            )
        elif block.kind == "code":
            flush_current()
            caption = _next_short_text(blocks, idx, max_len=200)
            scenes.append(
                {
                    "type": "code",
                    "title": None,
                    "language": block.language,
                    "code": block.text,
                    "caption": caption,
                }
            )
        elif block.kind == "callout":
            flush_current()
            scenes.append(
                {
                    "type": "callout",
                    "callout_type": block.callout_type,
                    "title": None,
                    "markdown": block.text,
                }
            )

    flush_current()
    return scenes


def _markdown_scene(title: str | None, content: str) -> dict:
    return {"type": "markdown", "title": title, "markdown": content}


class LessonContentService:
    """Читает урок из каталога и строит нормализованную структуру со сценами."""

    def __init__(
        self,
        settings: Settings | None = None,
        session_factory: sessionmaker | None = None,
        registry: LabRegistry | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session_factory = session_factory or SessionLocal
        self.registry = registry or get_default_registry()

    # --- Безопасное чтение ---

    def _resolve_vault_file(self, rel_path: str) -> Path | None:
        """Резолвит относительный путь внутри vault; None при выходе наружу."""
        raw = Path(rel_path)
        if raw.is_absolute():
            return None
        vault_root = self.settings.vault_dir.resolve()
        candidate = (vault_root / raw).resolve()
        try:
            candidate.relative_to(vault_root)
        except ValueError:
            return None
        if candidate.suffix.lower() != ".md":
            return None
        return candidate if candidate.is_file() else None

    def _read_source(self, content_path: str | None) -> str | None:
        if not content_path:
            return None
        path = self._resolve_vault_file(content_path)
        if path is None:
            return None
        return path.read_text(encoding="utf-8", errors="replace")

    def _read_lesson_body(self, item: ContentItem) -> str:
        path = self._resolve_vault_file(item.path)
        if path is None:
            return ""
        text = path.read_text(encoding="utf-8", errors="replace")
        # Отрезаем frontmatter (до первого --- после заголовка frontmatter).
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) == 3:
                return parts[2]
        return text

    # --- Порядок уроков курса ---

    def _ordered_lessons(self, db, course_id: str) -> list[ContentItem]:
        return list(
            db.scalars(
                select(ContentItem)
                .where(
                    ContentItem.course_id == course_id,
                    ContentItem.type == "lesson",
                    ContentItem.publish.is_(True),
                )
                .order_by(
                    ContentItem.module_order,
                    ContentItem.lesson_order,
                    ContentItem.path,
                )
            ).all()
        )

    @staticmethod
    def _prev_next(ordered: list[ContentItem], lesson_id: str) -> tuple[str | None, str | None]:
        ids = [item.id for item in ordered]
        if lesson_id not in ids:
            return None, None
        idx = ids.index(lesson_id)
        prev = ids[idx - 1] if idx > 0 else None
        next_id = ids[idx + 1] if idx < len(ids) - 1 else None
        return prev, next_id

    # --- Сборка урока ---

    def lesson(self, lesson_id: str) -> dict | None:
        with self.session_factory() as db:
            item = db.get(ContentItem, lesson_id)
            if item is None or item.type != "lesson" or not item.publish:
                return None

            course = db.get(ContentItem, item.course_id) if item.course_id else None
            module = db.get(ContentItem, item.module_id) if item.module_id else None

            body = self._read_lesson_body(item)
            source_md = self._read_source(item.content_path)
            datapath = _extract_datapath(body)

            scenes = self._build_scenes(item, datapath, source_md, body)
            scenes = self._assign_scene_ids(scenes)

            labs = self.registry.labs_for_lesson(lesson_id)
            laboratory_ids = [lab.id for lab in labs]

            ordered = self._ordered_lessons(db, item.course_id) if item.course_id else []
            previous_lesson_id, next_lesson_id = self._prev_next(ordered, lesson_id)

            materials = self._build_materials(db, item, source_md)

            return {
                "id": item.id,
                "title": item.title,
                "slug": item.slug,
                "module": (
                    {"id": module.id, "title": module.title, "order": module.module_order}
                    if module
                    else None
                ),
                "course": ({"id": course.id, "title": course.title} if course else None),
                "estimated_minutes": item.estimated_minutes,
                "difficulty": item.difficulty,
                "skills": item.skill_ids or [],
                "previous_lesson_id": previous_lesson_id,
                "next_lesson_id": next_lesson_id,
                "scenes": scenes,
                "laboratory_ids": laboratory_ids,
                "materials": materials,
            }

    def _build_scenes(
        self,
        item: ContentItem,
        datapath: dict | None,
        source_md: str | None,
        body: str,
    ) -> list[dict]:
        scenes: list[dict] = []

        # 1. Hook: заголовок из datapath или summary-callout урока.
        hook_title = None
        hook_markdown = _extract_summary_callout(body) or ""
        if datapath:
            for scene in datapath.get("scenes", []):
                if isinstance(scene, dict) and scene.get("type") == "hook":
                    hook_title = scene.get("title")
                    break
        if hook_markdown:
            scenes.append(_markdown_scene(hook_title or "Результат урока", hook_markdown))

        # 2. Content: секции source-заметки.
        if source_md:
            source_scenes = build_source_scenes(source_md)
            if datapath:
                # Пытаемся использовать явные source_heading; при отсутствии
                # точного совпадения (реальный vault) берём все секции.
                content_scenes_raw = [
                    s
                    for s in datapath.get("scenes", [])
                    if isinstance(s, dict) and s.get("type") == "content"
                ]
                headings = [s.get("source_heading") for s in content_scenes_raw]
                selected = [s for s in source_scenes if headings and s.get("title") in headings]
                content_scenes = selected if selected else source_scenes
            else:
                content_scenes = source_scenes
            scenes.extend(content_scenes)
        else:
            # Запасной вариант: сам урок содержит теорию (нет content_path).
            theory = re.sub(r"```datapath.*?```", "", body, flags=re.DOTALL).strip()
            if theory:
                scenes.append(_markdown_scene("Основной материал", theory))

        # 3. Interactive labs из registry (добавляются после теории).
        for lab in self.registry.labs_for_lesson(item.id):
            scenes.append(
                {
                    "type": "interactive_lab",
                    "title": None,
                    "lab_id": lab.id,
                    "lab_title": lab.title,
                }
            )

        # 4. Checkpoint: «Проверка понимания» урока.
        for question in _extract_checkpoints(body):
            scenes.append({"type": "checkpoint", "title": None, "question": question})

        return scenes

    @staticmethod
    def _assign_scene_ids(scenes: list[dict]) -> list[dict]:
        for i, scene in enumerate(scenes, start=1):
            scene["id"] = f"scene-{i:02d}"
        return scenes

    def _build_materials(self, db, item: ContentItem, source_md: str | None) -> list[dict]:
        materials: list[dict] = []
        seen: set[str] = set()

        def add(mat: ContentItem | None) -> None:
            if mat is None or mat.id in seen:
                return
            seen.add(mat.id)
            materials.append(
                {
                    "id": mat.id,
                    "title": mat.title,
                    "type": mat.type,
                    "path": mat.path,
                }
            )

        # Source-заметка по content_path.
        if item.content_path:
            source_item = db.scalar(
                select(ContentItem).where(ContentItem.path == item.content_path)
            )
            add(source_item)
        # Прямые связи урока (курс, модуль, источники и т.п.).
        for link in sorted(item.out_links, key=lambda lnk: (lnk.relation, lnk.target_id)):
            if link.relation in {"link", "applied_in"}:
                add(db.get(ContentItem, link.target_id))
        return materials[:12]

    def course_detail(self, course_id: str) -> dict | None:
        """Детали курса: модули с уроками по порядку, кейсы, prev/next урок."""
        with self.session_factory() as db:
            course = db.get(ContentItem, course_id)
            if course is None or course.type != "course" or not course.publish:
                return None

            modules = list(
                db.scalars(
                    select(ContentItem)
                    .where(
                        ContentItem.course_id == course_id,
                        ContentItem.type == "module",
                    )
                    .order_by(ContentItem.module_order, ContentItem.path)
                ).all()
            )
            lessons = self._ordered_lessons(db, course_id)
            cases = list(
                db.scalars(
                    select(ContentItem)
                    .where(
                        ContentItem.course_id == course_id,
                        ContentItem.type == "practice",
                        ContentItem.publish.is_(True),
                    )
                    .order_by(ContentItem.module_order, ContentItem.path)
                ).all()
            )

            lessons_by_module: dict[str, list[ContentItem]] = {}
            for lesson in lessons:
                lessons_by_module.setdefault(lesson.module_id or "", []).append(lesson)

            modules_out = []
            for module in modules:
                module_lessons = [
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "lesson_order": lesson.lesson_order,
                        "estimated_minutes": lesson.estimated_minutes,
                        "difficulty": lesson.difficulty,
                        "skills": lesson.skill_ids or [],
                        "laboratory_ids": [
                            lab.id for lab in self.registry.labs_for_lesson(lesson.id)
                        ],
                    }
                    for lesson in lessons_by_module.get(module.id, [])
                ]
                modules_out.append(
                    {
                        "id": module.id,
                        "title": module.title,
                        "order": module.module_order,
                        "estimated_minutes": module.estimated_minutes,
                        "lessons": module_lessons,
                    }
                )

            # Уроки вне модулей (standalone) — на случай отсутствия привязки.
            standalone = [
                lesson for lesson in lessons if lesson.module_id not in {m.id for m in modules}
            ]
            if standalone:
                modules_out.append(
                    {
                        "id": "standalone",
                        "title": "Дополнительные уроки",
                        "order": None,
                        "estimated_minutes": None,
                        "lessons": [
                            {
                                "id": lesson.id,
                                "title": lesson.title,
                                "lesson_order": lesson.lesson_order,
                                "estimated_minutes": lesson.estimated_minutes,
                                "difficulty": lesson.difficulty,
                                "skills": lesson.skill_ids or [],
                                "laboratory_ids": [
                                    lab.id for lab in self.registry.labs_for_lesson(lesson.id)
                                ],
                            }
                            for lesson in standalone
                        ],
                    }
                )

            ids = [lesson.id for lesson in lessons]
            return {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "area": course.area,
                "difficulty": course.difficulty,
                "estimated_hours": course.estimated_hours,
                "accent": course.accent,
                "icon": course.icon,
                "modules": modules_out,
                "cases": [
                    {
                        "id": case.id,
                        "title": case.title,
                        "practice_kind": case.practice_kind,
                        "estimated_minutes": case.estimated_minutes,
                        "difficulty": case.difficulty,
                    }
                    for case in cases
                ],
                "first_lesson_id": ids[0] if ids else None,
                "last_lesson_id": ids[-1] if ids else None,
            }
