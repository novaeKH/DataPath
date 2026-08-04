"""Тесты парсера: frontmatter, ссылки, исключение служебных каталогов."""

from __future__ import annotations

from pathlib import Path

from app.services.content_parser import MarkdownParser, VaultScanner

from tests.fixture_vault import make_vault, write_broken_frontmatter, write_md


def test_scanner_excludes_service_dirs(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    files = VaultScanner(vault).scan()
    rel_paths = {p.relative_to(vault).as_posix() for p in files}
    assert ".obsidian/app.json" not in rel_paths
    assert "_meta/VAULT_SPEC.md" not in rel_paths
    assert "00 Главная/Главная.md" not in rel_paths
    assert ".hermes.md" not in rel_paths  # dot-файлы не сканируются
    # учебные файлы на месте
    assert "05 Курсы/Классический ML/Уроки/01 Урок 1.md" in rel_paths
    assert "10 Знания/ML/Concept A.md" in rel_paths


def test_parser_reads_correct_frontmatter(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    note = MarkdownParser().parse(vault / "05 Курсы/Классический ML/Уроки/01 Урок 1.md", vault)
    assert note.frontmatter is not None
    assert note.frontmatter["id"] == "lesson.classic-ml.one.one"
    assert note.frontmatter["type"] == "lesson"
    assert note.frontmatter["app"] == "include"
    assert note.title == "Урок 1"
    assert note.path == "05 Курсы/Классический ML/Уроки/01 Урок 1.md"
    assert len(note.content_hash) == 64


def test_parser_quoted_yaml_values(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    path = vault / "10 Знания/ML/Quoted.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    # Реальный vault содержит значения в кавычках: type: "concept" — это валидный YAML.
    path.write_text(
        '---\ntitle: Quoted\nid: concept.ml.quoted\ntype: "concept"\narea: "ml"\n'
        'status: "active"\napp: source\n---\n# Quoted\n',
        encoding="utf-8",
    )
    note = MarkdownParser().parse(path, vault)
    assert note.frontmatter["type"] == "concept"
    assert note.frontmatter["area"] == "ml"


def test_parser_broken_frontmatter(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    path = write_broken_frontmatter(vault)
    note = MarkdownParser().parse(path, vault)
    assert note.frontmatter is None
    assert note.parse_error is not None


def test_parser_no_frontmatter(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    note = MarkdownParser().parse(vault / "15 Практика/no-frontmatter.md", vault)
    assert note.frontmatter is None
    assert note.parse_error is None


def test_parser_extracts_wiki_links(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    parser = MarkdownParser()
    note = parser.parse(vault / "05 Курсы/Классический ML/Уроки/01 Урок 1.md", vault)
    targets = {link.target for link in note.raw_links if link.kind == "wiki"}
    assert "Concept A" in targets
    assert "Concept B" in targets


def test_parser_ignores_code_block_links(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/CodeLinks.md",
        {
            "title": "CodeLinks",
            "id": "concept.ml.codelinks",
            "type": "concept",
            "area": "ml",
            "app": "source",
        },
        """# CodeLinks

```python
# [[NotARealLink]] — код, не ссылка
links = ["[[fake]]", "[[Callable[P, R"]
```

Inline `[[AlsoFake]]` тоже не ссылка.

Реальная ссылка: [[Concept A]].
""",
    )
    note = MarkdownParser().parse(vault / "10 Знания/ML/CodeLinks.md", vault)
    targets = [link.target for link in note.raw_links]
    assert "Concept A" in targets
    assert "NotARealLink" not in targets
    assert "fake" not in targets
    assert "Callable[P, R" not in targets
    assert "AlsoFake" not in targets


def test_parser_wiki_alias_and_heading(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/Alias.md",
        {
            "title": "Alias",
            "id": "concept.ml.alias",
            "type": "concept",
            "area": "ml",
            "app": "source",
        },
        "# Alias\n\n[[Concept A|Текст ссылки]] и [[Concept B#Heading|alias с heading]].\n",
    )
    note = MarkdownParser().parse(vault / "10 Знания/ML/Alias.md", vault)
    targets = {(link.target, link.display, link.heading, link.kind) for link in note.raw_links}
    assert ("Concept A", "Текст ссылки", None, "wiki") in targets
    assert ("Concept B", "alias с heading", "Heading", "wiki") in targets


def test_parser_extracts_markdown_links(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    write_md(
        vault,
        "10 Знания/ML/MdLinks.md",
        {
            "title": "MdLinks",
            "id": "concept.ml.mdlinks",
            "type": "concept",
            "area": "ml",
            "app": "source",
        },
        "# MdLinks\n\nВнешняя [ссылка](https://example.com) и внутренняя "
        "[файл](10%20Знания/ML/Concept%20A.md).\n",
    )
    note = MarkdownParser().parse(vault / "10 Знания/ML/MdLinks.md", vault)
    markdown = [link for link in note.raw_links if link.kind == "markdown"]
    assert len(markdown) == 1
    assert markdown[0].target == "10 Знания/ML/Concept A.md"


def test_hash_changes_with_content(tmp_path: Path) -> None:
    vault = make_vault(tmp_path)
    parser = MarkdownParser()
    path = vault / "10 Знания/ML/Concept A.md"
    first = parser.parse(path, vault)
    path.write_text(path.read_text(encoding="utf-8") + "\nДополнение.\n", encoding="utf-8")
    second = parser.parse(path, vault)
    assert first.content_hash != second.content_hash
