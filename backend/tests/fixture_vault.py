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
        "# Классический ML\n\n## Маршрут\n\n1. [[01 Модуль]]\n2. [[02 Модуль]]\n",
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
        "05 Курсы/Классический ML/Модули/02 Модуль.md",
        {
            **FM_BASE,
            "id": "module.classic-ml.two",
            "title": "Модуль 2",
            "type": "module",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_order": 2,
        },
        "# Модуль 2\n\n## Уроки\n\n1. [[03 Урок 3]]\n2. [[04 Урок 4]]\n",
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
            "estimated_minutes": 30,
            "difficulty": "core",
            "skill_ids": ["ml.tree_ensembles"],
        },
        (
            "# Урок 1\n\n"
            "> [!summary] Результат урока\n"
            "> - объяснить split по impurity\n\n"
            "## Сценарий урока\n\n"
            "```datapath\n"
            "{\n"
            '  "schema_version": 1,\n'
            '  "layout": "focus",\n'
            '  "content_path": "10 Знания/ML/Concept A.md",\n'
            '  "scenes": [\n'
            '    {"type": "hook", "title": "Зачем это нужно"},\n'
            '    {"type": "content", "source_heading": "Коротко"},\n'
            '    {"type": "interactive", "component": "decision-tree-split-lab"}\n'
            "  ]\n"
            "}\n"
            "```\n\n"
            "## Проверка понимания\n\n"
            "1. Сформулируй главную идею одним абзацем.\n"
            "2. Приведи пример из табличной ML-задачи.\n\n"
            "## Связи\n\n"
            "- [[Concept B]] — следующий шаг.\n"
        ),
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
        (
            "# Урок 2\n\n"
            "Canonical source: [[Concept B]].\n\n"
            "## Проверка понимания\n\n"
            "1. Что такое bagging?\n"
        ),
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Уроки/03 Урок 3.md",
        {
            **FM_BASE,
            "id": "lesson.classic-ml.two.one",
            "title": "Урок 3",
            "type": "lesson",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_id": "module.classic-ml.two",
            "module_order": 2,
            "lesson_order": 1,
            "content_path": "10 Знания/ML/Concept A.md",
        },
        "# Урок 3\n\nCanonical source: [[Concept A]].\n\n## Связи\n\n"
        "- [[Concept B]] — связанная идея.\n",
    )
    write_md(
        vault,
        "05 Курсы/Классический ML/Уроки/04 Урок 4.md",
        {
            **FM_BASE,
            "id": "lesson.classic-ml.two.two",
            "title": "Урок 4",
            "type": "lesson",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_id": "module.classic-ml.two",
            "module_order": 2,
            "lesson_order": 2,
            "content_path": "10 Знания/ML/Concept B.md",
        },
        "# Урок 4\n\nCanonical source: [[Concept B]].\n",
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
    write_md(
        vault,
        "05 Курсы/Классический ML/Кейсы/02 Кейс.md",
        {
            **FM_BASE,
            "id": "case.classic-ml.two",
            "title": "Кейс 2",
            "type": "practice",
            "practice_kind": "mini-case",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_order": 2,
        },
        "# Кейс 2\n\n[[Concept B]] — теория.\n",
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
        (
            "# Concept A\n\n"
            "## Идея за 30 секунд\n\n"
            "Decision Tree делит пространство условиями.\n\n"
            "## Split gain\n\n"
            "Для узла с $n$ объектами:\n\n"
            "$$\n"
            "\\operatorname{Gain}=I(\\text{parent})-\\frac{n_L}{n}I(\\text{left}).\n"
            "$$\n\n"
            "Здесь $I$ — impurity.\n\n"
            "## Пример\n\n"
            "```python\n"
            "def split(X, t):\n"
            "    return X[:, 0] <= t\n"
            "```\n\n"
            "## Важно\n\n"
            "> [!warning] Внимание\n"
            "> Не используйте информацию из тестовой выборки при выборе порога.\n\n"
            "## Связи\n\n"
            "- [[Concept B]] — связанная идея.\n"
        ),
    )
    write_md(
        vault,
        "10 Знания/ML/Concept B.md",
        {**FM_BASE, "id": "concept.ml.b", "title": "Concept B"},
        "# Concept B\n\n## Идея за 30 секунд\n\n"
        "Bagging усредняет предсказания деревьев.\n\n## Связи\n\n"
        "- [[Concept A]] — обратная связь.\n",
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
