"""Тесты валидации: ошибки/предупреждения, связи, циклы, slug."""

from __future__ import annotations

from pathlib import Path

from app.services.content_parser import MarkdownParser, VaultScanner
from app.services.content_validator import ContentValidator

from tests.fixture_vault import make_vault, write_broken_frontmatter, write_md

FM = {
    "id": "concept.ml.x",
    "title": "X",
    "type": "concept",
    "area": "ml",
    "status": "active",
    "app": "source",
    "rag": "exclude",
}


def _validate(vault: Path):
    parser = MarkdownParser()
    notes = [parser.parse(path, vault) for path in VaultScanner(vault).scan()]
    return ContentValidator(vault).validate(notes)


def _codes(result, severity: str) -> list[str]:
    return sorted({issue.code for issue in result.issues if issue.severity == severity})


def _issue_paths(result, code: str) -> list[str]:
    return sorted(issue.path for issue in result.issues if issue.code == code)


def test_valid_fixture_vault_has_no_errors(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    result = _validate(vault)
    assert result.errors == 0
    # 6 каталогизируемых: course, module, 2 lessons, case, 2 concepts = 7
    assert len(result.candidates) == 7
    # no-frontmatter.md — предупреждение, moc/meta/router — исключены молча
    assert "no_frontmatter" in _codes(result, "warning")


def test_broken_frontmatter_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_broken_frontmatter(vault)
    result = _validate(vault)
    assert "broken_frontmatter" in _codes(result, "error")
    assert result.candidates and all(
        c.note.path != "10 Знания/ML/Broken.md" for c in result.candidates
    )


def test_missing_id_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(vault, "10 Знания/ML/NoId.md", {**FM, "id": None}, "# NoId\n")
    result = _validate(vault)
    assert "missing_id" in _codes(result, "error")


def test_duplicate_ids_are_errors(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(vault, "10 Знания/ML/Dup1.md", {**FM, "id": "concept.ml.dup"}, "# Dup1\n")
    write_md(vault, "10 Знания/ML/Dup2.md", {**FM, "id": "concept.ml.dup"}, "# Dup2\n")
    result = _validate(vault)
    assert "duplicate_id" in _codes(result, "error")
    assert len(_issue_paths(result, "duplicate_id")) == 2
    # дубликаты не попадают в каталог
    assert all(c.item_id != "concept.ml.dup" for c in result.candidates)


def test_unknown_type_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(vault, "10 Знания/ML/Unknown.md", {**FM, "type": "wizard"}, "# Unknown\n")
    result = _validate(vault)
    assert "unknown_type" in _codes(result, "error")


def test_missing_title_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(vault, "10 Знания/ML/NoTitle.md", {**FM, "title": None}, "")
    result = _validate(vault)
    assert "missing_title" in _codes(result, "error")


def test_bad_rag_and_bad_app_are_errors(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(vault, "10 Знания/ML/BadRag.md", {**FM, "rag": "sometimes"}, "# BadRag\n")
    write_md(vault, "10 Знания/ML/BadApp.md", {**FM, "app": "maybe"}, "# BadApp\n")
    result = _validate(vault)
    assert "bad_rag" in _codes(result, "error")
    assert "bad_app" in _codes(result, "error")


def test_missing_optional_fields_are_warnings(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/Partial.md",
        {"id": "concept.ml.partial", "title": "Partial", "type": "concept", "app": "source"},
        "# Partial\n",
    )
    result = _validate(vault)
    codes = _codes(result, "warning")
    assert "missing_area" in codes
    assert "missing_status" in codes
    assert "missing_language" in codes
    # материал остаётся в каталоге
    assert any(c.item_id == "concept.ml.partial" for c in result.candidates)


def test_unresolved_link_is_warning(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault, "10 Знания/ML/BrokenLink.md", FM, "# BrokenLink\n\n[[Несуществующая заметка]]\n"
    )
    result = _validate(vault)
    assert "unresolved_wikilink" in _codes(result, "warning")


def test_attachment_link_is_not_a_warning(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/Attachment.md",
        FM,
        "# Attachment\n\n[[Скриншот.png]] и [[Карта.canvas]]\n",
    )
    result = _validate(vault)
    assert "unresolved_wikilink" not in _codes(result, "warning")


def test_broken_content_path_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "05 Курсы/Уроки/01 Урок.md",
        {
            **FM,
            "id": "lesson.classic-ml.broken",
            "type": "lesson",
            "app": "include",
            "course_id": "course.classic-ml",
            "content_path": "10 Знания/ML/No Such File.md",
        },
        "# Урок\n",
    )
    result = _validate(vault)
    assert "missing_content_path" in _codes(result, "error")


def test_broken_course_and_module_refs_are_errors(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "05 Курсы/Уроки/01 Урок.md",
        {
            **FM,
            "id": "lesson.classic-ml.badrefs",
            "type": "lesson",
            "app": "include",
            "course_id": "course.nonexistent",
            "module_id": "module.nonexistent",
        },
        "# Урок\n",
    )
    result = _validate(vault)
    codes = _codes(result, "error")
    assert "broken_course_ref" in codes
    assert "broken_module_ref" in codes


def test_broken_prerequisite_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/Prereq.md",
        {**FM, "prerequisites": ["concept.ml.missing"]},
        "# Prereq\n",
    )
    result = _validate(vault)
    assert "broken_prerequisite" in _codes(result, "error")


def test_prerequisite_cycle_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/CycA.md",
        {**FM, "id": "concept.ml.cyca", "prerequisites": ["concept.ml.cycb"]},
        "# A\n",
    )
    write_md(
        vault,
        "10 Знания/ML/CycB.md",
        {**FM, "id": "concept.ml.cycb", "prerequisites": ["concept.ml.cyca"]},
        "# B\n",
    )
    result = _validate(vault)
    assert "prerequisite_cycle" in _codes(result, "error")
    assert len(_issue_paths(result, "prerequisite_cycle")) == 2


def test_slug_conflict_is_error(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/Decision Trees.md",
        {**FM, "id": "concept.ml.dt1"},
        "# Decision Trees\n",
    )
    write_md(
        vault,
        "10 Знания/ML/decision-trees.md",
        {**FM, "id": "concept.ml.dt2"},
        "# decision-trees\n",
    )
    result = _validate(vault)
    assert "slug_conflict" in _codes(result, "error")


def test_implied_prerequisites_between_lessons(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    result = _validate(vault)
    lesson_two = next(c for c in result.candidates if c.item_id == "lesson.classic-ml.one.two")
    prereq_edges = [e for e in lesson_two.edges if e[2] == "prerequisite"]
    assert (
        "lesson.classic-ml.one.one",
        "lesson.classic-ml.one.two",
        "prerequisite",
        "implied",
    ) in prereq_edges


def test_link_edges_created(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    result = _validate(vault)
    lesson_one = next(c for c in result.candidates if c.item_id == "lesson.classic-ml.one.one")
    edge_targets = {e[1] for e in lesson_one.edges if e[2] == "link"}
    assert "concept.ml.a" in edge_targets
    assert "concept.ml.b" in edge_targets
    applied = [e for e in lesson_one.edges if e[2] == "applied_in"]
    assert ("lesson.classic-ml.one.one", "concept.ml.a", "applied_in", "content_path") in applied
