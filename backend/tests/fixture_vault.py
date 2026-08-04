"""Помощники для тестов: сборка fixture-vault и запись заметок."""

from __future__ import annotations

from pathlib import Path

import yaml


def write_md(root: Path, rel_path: str, frontmatter: dict | None, body: str = "") -> Path:
    """Пишет .md файл с YAML frontmatter в fixture vault."""
    path = root / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    text = ""
    if frontmatter is not None:
        text += "---\n" + yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False) + "---\n"
    text += body
    path.write_text(text, encoding="utf-8")
    return path


FM_BASE = {
    "id": None,  # подставляется вызывающим
    "title": None,
    "schema_version": 2,
    "type": "concept",
    "area": "ml",
    "status": "active",
    "language": "ru",
    "rag": "exclude",
    "app": "source",
}


def make_vault(root: Path) -> Path:
    """Минимальный реалистичный vault для тестов парсера/синка/API."""
    vault = root / "vault"
    vault.mkdir(parents=True, exist_ok=True)

    # --- Курс (05 Курсы) ---
    write_md(
        vault,
        "05 Курсы/Классический ML/00 Курс — Классический ML.md",
        {
            **FM_BASE,
            "id": "course.classic-ml",
            "title": "Классический ML",
            "type": "course",
            "app": "include",
        },
        "# Классический ML\n\n## Маршрут\n\n1. [[01 Модуль]]\n",
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Модули/01 Модуль.md",
        {
            **FM_BASE,
            "id": "module.classic-ml.one",
            "title": "Модуль 1",
            "type": "module",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_order": 1,
        },
        "# Модуль 1\n\n## Уроки\n\n1. [[01 Урок 1]]\n2. [[02 Урок 2]]\n",
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Уроки/01 Урок 1.md",
        {
            **FM_BASE,
            "id": "lesson.classic-ml.one.one",
            "title": "Урок 1",
            "type": "lesson",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_id": "module.classic-ml.one",
            "module_order": 1,
            "lesson_order": 1,
            "content_path": "10 Знания/ML/Concept A.md",
        },
        "# Урок 1\n\nCanonical source: [[Concept A]].\n\n## Связи\n\n"
        "- [[Concept B]] — следующий шаг.\n",
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Уроки/02 Урок 2.md",
        {
            **FM_BASE,
            "id": "lesson.classic-ml.one.two",
            "title": "Урок 2",
            "type": "lesson",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_id": "module.classic-ml.one",
            "module_order": 1,
            "lesson_order": 2,
            "content_path": "10 Знания/ML/Concept B.md",
        },
        "# Урок 2\n\nCanonical source: [[Concept B]].\n",
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Кейсы/01 Кейс.md",
        {
            **FM_BASE,
            "id": "case.classic-ml.one",
            "title": "Кейс 1",
            "type": "practice",
            "practice_kind": "mini-case",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_order": 1,
        },
        "# Кейс 1\n\n[[Concept A]] — теория.\n",
    )

    # --- Знания (10 Знания) ---
    write_md(
        vault,
        "10 Знания/ML/Concept A.md",
        {
            **FM_BASE,
            "id": "concept.ml.a",
            "title": "Concept A",
            "rag": "include",
            "rag_collection": "knowledge",
        },
        "# Concept A\n\n## Связи\n\n- [[Concept B]] — связанная идея.\n",
    )
    write_md(
        vault,
        "10 Знания/ML/Concept B.md",
        {**FM_BASE, "id": "concept.ml.b", "title": "Concept B"},
        "# Concept B\n\n## Связи\n\n- [[Concept A]] — обратная связь.\n",
    )

    # --- Служебные (исключаются) ---
    write_md(vault, ".obsidian/app.json", {"x": 1}, "{}")
    write_md(
        vault,
        "_meta/VAULT_SPEC.md",
        {**FM_BASE, "id": "meta.vault.spec", "type": "meta", "app": "exclude"},
        "# SPEC",
    )
    write_md(
        vault,
        "00 Главная/Главная.md",
        {**FM_BASE, "id": "moc.home", "type": "moc", "app": "exclude"},
        "# Главная",
    )
    write_md(vault, ".hermes.md", None, "# Hermes rules")

    # --- Без frontmatter (предупреждение) ---
    write_md(vault, "15 Практика/no-frontmatter.md", None, "# Заметка без frontmatter\n")

    return vault


def write_broken_frontmatter(root: Path, rel_path: str = "10 Знания/ML/Broken.md") -> Path:
    path = root / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("---\ntitle: [unclosed\n---\n# Broken\n", encoding="utf-8")
    return path
