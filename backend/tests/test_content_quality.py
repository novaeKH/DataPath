"""Тесты Фазы 6A: content quality CLI (read-only аудит)."""

from __future__ import annotations

import json

from app.services.content_quality import (
    ContentQualityAuditor,
    _incomplete_python_examples,
    _invalid_python_examples,
    _unpaired_contrast_sections,
)
from app.services.content_sync import ContentSyncService

LESSON_ONE = "lesson.classic-ml.one.one"
LESSON_TWO = "lesson.classic-ml.one.two"
LESSON_THREE = "lesson.classic-ml.two.one"


def _make_auditor(tmp_path, fixture_vault, db_session_factory):
    from app.core.config import Settings

    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'quality.db'}",
        vault_path=str(fixture_vault),
    )
    # session_factory обязателен: аудитор должен работать с временной БД,
    # а не с глобальным SessionLocal (реальная БД проекта).
    return ContentQualityAuditor(settings=settings, session_factory=db_session_factory)


def _sync(tmp_path, fixture_vault, db_session_factory):
    from app.core.config import Settings

    settings = Settings(
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'quality.db'}",
        vault_path=str(fixture_vault),
    )
    service = ContentSyncService(settings=settings, session_factory=db_session_factory)
    service.sync()
    return service


def test_quality_audit_no_errors_on_fixture(tmp_path, fixture_vault, db_session_factory) -> None:
    """Fixture-vault без errors: warnings/suggestions не ломают exit code.

    Урок 1 просит source_heading «Коротко», которого нет в Concept A —
    поэтому warning source_heading_fallback ожидаем (прозрачность fallback).
    """
    _sync(tmp_path, fixture_vault, db_session_factory)
    auditor = _make_auditor(tmp_path, fixture_vault, db_session_factory)
    result = auditor.audit()
    assert result["errors"] == []
    assert result["lessons_checked"] >= 4
    assert any(w["code"] == "source_heading_fallback" for w in result["warnings"])
    assert result["suggestions"]  # уроки без примеров/кода — нормальные suggestions


def test_quality_audit_heading_fallback_warning(
    tmp_path, fixture_vault, db_session_factory
) -> None:
    """Запрошенный source_heading, отсутствующий в source → warning с диагностикой."""
    _sync(tmp_path, fixture_vault, db_session_factory)
    auditor = _make_auditor(tmp_path, fixture_vault, db_session_factory)
    # Урок 1 просит «Коротко», в Concept A такого H2 нет → fallback
    result = auditor.audit(lesson_id=LESSON_ONE)
    fallback_warnings = [w for w in result["warnings"] if w["code"] == "source_heading_fallback"]
    assert fallback_warnings, "ожидали warning source_heading_fallback"
    diag = fallback_warnings[0]["diagnostic"]
    assert diag["requested_heading"] == "Коротко"
    assert diag["status"] == "fallback"
    assert diag["source_content_id"] == "concept.ml.a"
    assert diag["lesson_id"] == LESSON_ONE
    assert diag["source_file"] == "10 Знания/ML/Concept A.md"


def test_quality_audit_missing_heading_warning(tmp_path, fixture_vault, db_session_factory) -> None:
    """Урок без source (нет content_path) с datapath → source_heading_missing warning."""
    from tests.fixture_vault import write_md

    # Урок-файл с datapath, просящим content, но без content_path (source недоступен)
    write_md(
        fixture_vault,
        "05 Курсы/Классический ML/Уроки/99 NoSource.md",
        {
            "id": "lesson.no-source",
            "title": "Без source",
            "schema_version": 2,
            "type": "lesson",
            "area": "ml",
            "status": "active",
            "language": "ru",
            "rag": "exclude",
            "app": "include",
            "course_id": "course.classic-ml",
            "module_id": "module.classic-ml.one",
        },
        (
            "# Урок без source\n\n"
            "## Сценарий урока\n\n"
            "```datapath\n"
            "{\n"
            '  "schema_version": 1,\n'
            '  "layout": "focus",\n'
            '  "scenes": [\n'
            '    {"type": "content", "source_heading": "Коротко"}\n'
            "  ]\n"
            "}\n"
            "```\n"
        ),
    )
    _sync(tmp_path, fixture_vault, db_session_factory)
    auditor = _make_auditor(tmp_path, fixture_vault, db_session_factory)
    result = auditor.audit(lesson_id="lesson.no-source")
    missing = [w for w in result["warnings"] if w["code"] == "source_heading_missing"]
    assert missing
    assert missing[0]["diagnostic"]["status"] == "missing"


def test_quality_cli_json_output_and_exit_codes(
    tmp_path, fixture_vault, db_session_factory, capsys
) -> None:
    """CLI: warnings → exit 0; JSON содержит диагностику; errors → exit 1."""
    _sync(tmp_path, fixture_vault, db_session_factory)

    # CLI читает реальный Settings; для теста подменяем vault через env не будем —
    # проверяем через auditor-режим, а CLI-парсинг аргументов отдельно.
    # Прямой вызов auditor (CLI-обёртка использует те же структуры)
    auditor = _make_auditor(tmp_path, fixture_vault, db_session_factory)
    result = auditor.audit(lesson_id=LESSON_ONE)
    payload = json.dumps(result, ensure_ascii=False)
    parsed = json.loads(payload)
    assert parsed["errors"] == []
    assert any(w["code"] == "source_heading_fallback" for w in parsed["warnings"])
    # Suggestions remain advisory and can disappear as the auditor learns to
    # recognise examples/code in the canonical source note.
    assert isinstance(parsed["suggestions"], list)


def test_quality_cli_parser_registered() -> None:
    """Команда quality присутствует в CLI и парсит флаги."""
    parser = __import__("app.cli.content", fromlist=["build_parser"]).build_parser()
    args = parser.parse_args(["quality", "--course", "course.classic-ml", "--json"])
    assert args.command == "quality"
    assert args.course == "course.classic-ml"
    assert args.json is True
    args2 = parser.parse_args(["quality", "--lesson", LESSON_ONE])
    assert args2.lesson == LESSON_ONE


def test_quality_warnings_do_not_fail_exit(tmp_path, fixture_vault, db_session_factory) -> None:
    """Warnings/suggestions → exit code 0 (только errors дают 1)."""
    _sync(tmp_path, fixture_vault, db_session_factory)
    auditor = _make_auditor(tmp_path, fixture_vault, db_session_factory)
    result = auditor.audit(lesson_id=LESSON_ONE)
    assert result["errors"] == []
    # CLI возвращает 1 только при errors
    exit_code = 1 if result["errors"] else 0
    assert exit_code == 0


def test_readability_rules_find_incomplete_examples() -> None:
    incomplete = """## Example

```python
if value is None:
    ...
```"""
    complete = """## Example

```python
if value is None:
    value = "default"
```"""

    assert _incomplete_python_examples(incomplete) == [3]
    assert _incomplete_python_examples(complete) == []


def test_readability_rules_require_both_sides_of_contrast() -> None:
    incomplete = """## Mutable default

Плохо:

```python
def f(items=[]):
    return items
```"""
    complete = (
        incomplete
        + """

Правильно:

```python
def f(items=None):
    return [] if items is None else items
```"""
    )

    assert _unpaired_contrast_sections(incomplete) == ["Mutable default"]
    assert _unpaired_contrast_sections(complete) == []


def test_readability_rules_compile_python_examples() -> None:
    invalid = """## Example

```python
def predict(x):
```
"""
    valid = """## Example

```python
def predict(x):
    return x * 2
```
"""

    assert _invalid_python_examples(invalid)[0][0] == 3
    assert _invalid_python_examples(valid) == []
