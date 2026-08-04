"""Валидация каталога: ссылки, id, типы, prerequisites, slug.

Валидация — чистая функция: сканирование + проверки, без записи в БД.
Команда `validate` использует её напрямую; `sync` — тоже, а затем применяет
результат к SQLite.

Уровни:
- error    — материал нельзя публиковать (не попадает в каталог);
- warning  — материал можно использовать, но metadata неполные.
"""

from __future__ import annotations

import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import frontmatter

from app.services.content_parser import (
    ALL_KNOWN_TYPES,
    APP_VALUES,
    RAG_VALUES,
    STATUS_DEPRECATED,
    TYPE_CATALOGUED,
    TYPE_EXCLUDED,
    MarkdownParser,
    ParsedNote,
    slugify_stem,
)


@dataclass
class Issue:
    path: str
    severity: str  # error | warning
    code: str
    message: str
    item_id: str | None = None

    def as_dict(self) -> dict:
        return {
            "path": self.path,
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "item_id": self.item_id,
        }


@dataclass
class CatalogCandidate:
    """Заметка, прошедшая базовые проверки и готовая к записи в каталог."""

    note: ParsedNote
    item_id: str
    issues: list[Issue] = field(default_factory=list)
    # рёбра: (source_id, target_id, relation, kind)
    edges: list[tuple[str, str, str, str]] = field(default_factory=list)
    explicit_prereqs: list[str] = field(default_factory=list)


@dataclass
class ValidationResult:
    issues: list[Issue] = field(default_factory=list)
    candidates: list[CatalogCandidate] = field(default_factory=list)

    @property
    def errors(self) -> int:
        return sum(1 for i in self.issues if i.severity == "error")

    @property
    def warnings(self) -> int:
        return sum(1 for i in self.issues if i.severity == "warning")


class FileIndex:
    """Индекс всех .md файлов vault для резолва wiki-ссылок и content_path.

    Включает и служебные каталоги: ссылка на MOC/router — нормальное явление,
    но такие цели не становятся рёбрами каталога.
    """

    def __init__(self, vault_dir: Path) -> None:
        self.by_stem: dict[str, str] = {}
        self.by_stem_ci: dict[str, str] = {}
        self.by_path: dict[str, str] = {}
        self.by_alias: dict[str, str] = {}
        self.by_alias_ci: dict[str, str] = {}
        self.all_paths: set[str] = set()
        self._build(vault_dir)

    def _build(self, vault_dir: Path) -> None:
        if not vault_dir.is_dir():
            return
        for path in sorted(vault_dir.rglob("*.md")):
            rel = path.relative_to(vault_dir).as_posix()
            self.all_paths.add(rel)
            stem = path.stem
            self.by_stem.setdefault(stem, rel)
            self.by_stem_ci.setdefault(stem.lower(), rel)
            self.by_path.setdefault(rel.removesuffix(".md"), rel)
            try:
                post = frontmatter.loads(path.read_text(encoding="utf-8", errors="replace"))
                aliases = post.metadata.get("aliases") if isinstance(post.metadata, dict) else None
            except Exception:  # noqa: BLE001 — битый frontmatter не ломает индекс
                aliases = None
            if isinstance(aliases, list):
                for alias in aliases:
                    if isinstance(alias, str) and alias.strip():
                        key = alias.strip()
                        self.by_alias.setdefault(key, rel)
                        self.by_alias_ci.setdefault(key.lower(), rel)

    def resolve(self, target: str) -> str | None:
        """Резолв цели wiki-ссылки/content_path в относительный путь файла (или None)."""
        t = unicodedata.normalize("NFC", target).strip()
        if not t:
            return None
        suffix = Path(t).suffix.lower()
        if suffix and suffix != ".md":
            return None  # вложение (.canvas, .png, ...) — не заметка
        if suffix == ".md":
            t = t.removesuffix(".md")
        stem = t.rsplit("/", 1)[-1]
        if t in self.by_path:
            return self.by_path[t]
        if stem in self.by_stem:
            return self.by_stem[stem]
        if stem.lower() in self.by_stem_ci:
            return self.by_stem_ci[stem.lower()]
        if t in self.by_alias:
            return self.by_alias[t]
        if t.lower() in self.by_alias_ci:
            return self.by_alias_ci[t.lower()]
        return None

    @staticmethod
    def is_attachment(target: str) -> bool:
        """Цель — файл-вложение (не .md): такие ссылки не считаются битыми."""
        suffix = Path(target).suffix.lower()
        return bool(suffix) and suffix != ".md"


class ContentValidator:
    """Сканирует и валидирует vault; не пишет в БД."""

    def __init__(self, vault_dir: Path, parser: MarkdownParser | None = None) -> None:
        self.vault_dir = vault_dir
        self.parser = parser or MarkdownParser()

    def validate(self, notes: list[ParsedNote]) -> ValidationResult:
        issues: list[Issue] = []
        file_index = FileIndex(self.vault_dir)

        # 1. Разделяем заметки: битые frontmatter / без frontmatter / кандидаты.
        candidates: list[CatalogCandidate] = []
        for note in notes:
            if note.parse_error:
                issues.append(
                    Issue(
                        note.path,
                        "error",
                        "broken_frontmatter",
                        f"Не удалось прочитать frontmatter: {note.parse_error}",
                    )
                )
                continue
            if note.frontmatter is None:
                issues.append(
                    Issue(
                        note.path,
                        "warning",
                        "no_frontmatter",
                        "Заметка без frontmatter — исключена из каталога",
                    )
                )
                continue
            candidate = self._make_candidate(note, issues)
            if candidate is not None:
                candidates.append(candidate)

        # 2. Дубликаты id — ошибка на всех файлах с одинаковым id.
        by_id: dict[str, list[CatalogCandidate]] = defaultdict(list)
        for c in candidates:
            by_id[c.item_id].append(c)
        duplicates = {cid: lst for cid, lst in by_id.items() if len(lst) > 1}
        if duplicates:
            candidates = [c for c in candidates if c.item_id not in duplicates]
            for cid, lst in duplicates.items():
                for c in lst:
                    issues.append(
                        Issue(
                            c.note.path,
                            "error",
                            "duplicate_id",
                            f"Content ID {cid!r} встречается в нескольких файлах",
                            item_id=cid,
                        )
                    )

        # 3. Конфликт slug.
        by_slug: dict[str, list[CatalogCandidate]] = defaultdict(list)
        for c in candidates:
            by_slug[slugify_stem(c.note.stem)].append(c)
        slug_conflicts = {s: lst for s, lst in by_slug.items() if len(lst) > 1}
        if slug_conflicts:
            candidates = [c for c in candidates if slugify_stem(c.note.stem) not in slug_conflicts]
            for slug, lst in slug_conflicts.items():
                for c in lst:
                    issues.append(
                        Issue(
                            c.note.path,
                            "error",
                            "slug_conflict",
                            f"Slug {slug!r} совпадает у нескольких файлов",
                            item_id=c.item_id,
                        )
                    )

        # 4. Полевая валидация + связи.
        id_set = {c.item_id for c in candidates}
        path_to_id: dict[str, str] = {c.note.path: c.item_id for c in candidates}

        for c in candidates:
            self._validate_fields(c, issues)
            self._validate_refs(c, issues, id_set, file_index, path_to_id)

        # 5. Prerequisites: битые ссылки и циклы.
        self._validate_prerequisites(candidates, issues, id_set)

        # 6. Резолв wiki/markdown ссылок в рёбра.
        self._resolve_links(candidates, issues, file_index, path_to_id)

        # 7. Отсев кандидатов с ошибками (error → нельзя публиковать).
        ok_candidates: list[CatalogCandidate] = []
        for c in candidates:
            if any(i.severity == "error" and i.item_id == c.item_id for i in issues):
                continue
            ok_candidates.append(c)

        return ValidationResult(issues=issues, candidates=ok_candidates)

    # ------------------------------------------------------------------ helpers

    def _make_candidate(self, note: ParsedNote, issues: list[Issue]) -> CatalogCandidate | None:
        fm = note.frontmatter or {}
        item_id = fm.get("id")
        note_type = fm.get("type")
        app = fm.get("app")
        status = fm.get("status")

        # Сначала исключения по типу/app/status: служебные заметки не каталогизируются,
        # даже если у них нет id.
        if isinstance(note_type, str) and note_type not in ALL_KNOWN_TYPES:
            issues.append(
                Issue(
                    note.path,
                    "error",
                    "unknown_type",
                    f"Неизвестный тип материала {note_type!r}",
                    item_id=item_id if isinstance(item_id, str) else None,
                )
            )
            return None

        if isinstance(note_type, str) and note_type in TYPE_EXCLUDED:
            # moc/meta/router/template/solution/source — не каталогизируются.
            return None

        if app not in APP_VALUES:
            if app is None:
                issues.append(
                    Issue(
                        note.path,
                        "warning",
                        "missing_app",
                        "Отсутствует поле app — материал исключён из каталога",
                        item_id=item_id if isinstance(item_id, str) else None,
                    )
                )
            else:
                issues.append(
                    Issue(
                        note.path,
                        "error",
                        "bad_app",
                        f"Недопустимое значение app {app!r}",
                        item_id=item_id if isinstance(item_id, str) else None,
                    )
                )
            return None

        if app == "exclude":
            return None

        if status == STATUS_DEPRECATED:
            return None

        if note_type is None or not isinstance(note_type, str) or note_type not in TYPE_CATALOGUED:
            issues.append(
                Issue(
                    note.path,
                    "error",
                    "unknown_type",
                    f"Отсутствует или неизвестен type {note_type!r}",
                    item_id=item_id if isinstance(item_id, str) else None,
                )
            )
            return None

        if not isinstance(item_id, str) or not item_id.strip():
            issues.append(
                Issue(
                    note.path,
                    "error",
                    "missing_id",
                    "Отсутствует обязательное поле id",
                    item_id=None,
                )
            )
            return None

        return CatalogCandidate(note=note, item_id=item_id)

    def _validate_fields(self, c: CatalogCandidate, issues: list[Issue]) -> None:
        fm = c.note.frontmatter or {}
        path, item_id = c.note.path, c.item_id

        if not c.note.title or not c.note.title.strip():
            issues.append(
                Issue(
                    path,
                    "error",
                    "missing_title",
                    "Отсутствует заголовок (title/H1)",
                    item_id=item_id,
                )
            )
        elif not fm.get("title"):
            # Заголовок есть только как H1 в теле: контракт требует title во frontmatter.
            issues.append(
                Issue(
                    path,
                    "warning",
                    "missing_title_frontmatter",
                    "Заголовок найден только в H1, поле title во frontmatter отсутствует",
                    item_id=item_id,
                )
            )
        if not fm.get("area"):
            issues.append(
                Issue(path, "warning", "missing_area", "Отсутствует поле area", item_id=item_id)
            )
        if not fm.get("status"):
            issues.append(
                Issue(path, "warning", "missing_status", "Отсутствует поле status", item_id=item_id)
            )
        if not fm.get("language"):
            issues.append(
                Issue(
                    path,
                    "warning",
                    "missing_language",
                    "Отсутствует поле language",
                    item_id=item_id,
                )
            )
        rag = fm.get("rag")
        if rag is not None and rag not in RAG_VALUES:
            issues.append(
                Issue(
                    path, "error", "bad_rag", f"Недопустимое значение rag {rag!r}", item_id=item_id
                )
            )
        app = fm.get("app")
        if app is not None and app not in APP_VALUES:
            issues.append(
                Issue(
                    path, "error", "bad_app", f"Недопустимое значение app {app!r}", item_id=item_id
                )
            )

    def _validate_refs(
        self,
        c: CatalogCandidate,
        issues: list[Issue],
        id_set: set[str],
        file_index: FileIndex,
        path_to_id: dict[str, str],
    ) -> None:
        fm = c.note.frontmatter or {}
        path, item_id = c.note.path, c.item_id

        course_id = fm.get("course_id")
        if course_id is not None and course_id not in id_set:
            issues.append(
                Issue(
                    path,
                    "error",
                    "broken_course_ref",
                    f"course_id {course_id!r} не существует в каталоге",
                    item_id=item_id,
                )
            )
        module_id = fm.get("module_id")
        if module_id is not None and module_id not in id_set:
            issues.append(
                Issue(
                    path,
                    "error",
                    "broken_module_ref",
                    f"module_id {module_id!r} не существует в каталоге",
                    item_id=item_id,
                )
            )

        if c.note.frontmatter.get("type") == "lesson" and not course_id:
            issues.append(
                Issue(path, "warning", "missing_course_ref", "Урок без course_id", item_id=item_id)
            )

        content_path = fm.get("content_path")
        if content_path:
            resolved = file_index.resolve(str(content_path))
            if resolved is None:
                issues.append(
                    Issue(
                        path,
                        "error",
                        "missing_content_path",
                        f"content_path {content_path!r} не существует в vault",
                        item_id=item_id,
                    )
                )
            else:
                target_id = path_to_id.get(resolved)
                if target_id is not None:
                    c.edges.append((item_id, target_id, "applied_in", "content_path"))

        explicit = fm.get("prerequisites")
        if isinstance(explicit, list):
            prereq_ids = [str(p) for p in explicit if isinstance(p, str) and p.strip()]
            c.explicit_prereqs = prereq_ids

    def _validate_prerequisites(
        self, candidates: list[CatalogCandidate], issues: list[Issue], id_set: set[str]
    ) -> None:
        id_to_candidate = {c.item_id: c for c in candidates}

        # Явные + неявные (порядок уроков в модуле) рёбра prerequisites.
        prereq_edges: dict[str, set[str]] = defaultdict(set)
        for c in candidates:
            for prereq in c.explicit_prereqs:
                if prereq not in id_set:
                    issues.append(
                        Issue(
                            c.note.path,
                            "error",
                            "broken_prerequisite",
                            f"Prerequisite {prereq!r} не существует в каталоге",
                            item_id=c.item_id,
                        )
                    )
                else:
                    prereq_edges[c.item_id].add(prereq)
                    c.edges.append((prereq, c.item_id, "prerequisite", "explicit"))

        # Неявный порядок уроков внутри модуля: lesson[i] → lesson[i+1].
        by_module: dict[str, list[CatalogCandidate]] = defaultdict(list)
        for c in candidates:
            fm = c.note.frontmatter or {}
            if fm.get("type") == "lesson" and fm.get("module_id"):
                by_module[str(fm["module_id"])].append(c)
        for _module_key, lessons in by_module.items():
            lessons.sort(
                key=lambda c: (
                    c.note.frontmatter.get("lesson_order") is None,
                    c.note.frontmatter.get("lesson_order") or 0,
                    c.note.path,
                )
            )
            for prev, nxt in zip(lessons, lessons[1:], strict=False):
                prereq_edges[nxt.item_id].add(prev.item_id)
                nxt.edges.append((prev.item_id, nxt.item_id, "prerequisite", "implied"))

        # Циклы: DFS.
        visited: dict[str, int] = {}  # 0=в процессе, 1=готово
        stack: list[str] = []

        def dfs(node: str) -> list[str] | None:
            visited[node] = 0
            stack.append(node)
            for neighbor in sorted(prereq_edges.get(node, ())):
                if visited.get(neighbor) == 0:
                    start = stack.index(neighbor)
                    return stack[start:] + [neighbor]
                if visited.get(neighbor) is None:
                    cycle = dfs(neighbor)
                    if cycle:
                        return cycle
            stack.pop()
            visited[node] = 1
            return None

        cycle_nodes: set[str] = set()
        for node in sorted(id_set):
            if visited.get(node) is None:
                cycle = dfs(node)
                if cycle:
                    cycle_nodes.update(cycle)

        for node in sorted(cycle_nodes):
            c = id_to_candidate[node]
            issues.append(
                Issue(
                    c.note.path,
                    "error",
                    "prerequisite_cycle",
                    "Обнаружен цикл в prerequisites",
                    item_id=node,
                )
            )

    def _resolve_links(
        self,
        candidates: list[CatalogCandidate],
        issues: list[Issue],
        file_index: FileIndex,
        path_to_id: dict[str, str],
    ) -> None:
        seen_warnings: set[tuple[str, str]] = set()
        for c in candidates:
            for raw in c.note.raw_links:
                target_path = file_index.resolve(raw.target)
                if target_path is None:
                    if file_index.is_attachment(raw.target):
                        continue  # вложение — не битая ссылка на заметку
                    key = (c.note.path, raw.target)
                    if key not in seen_warnings:
                        seen_warnings.add(key)
                        issues.append(
                            Issue(
                                c.note.path,
                                "warning",
                                "unresolved_wikilink",
                                f"Ссылка [[{raw.target}]] не разрешается ни в один файл vault",
                                item_id=c.item_id,
                            )
                        )
                    continue
                target_id = path_to_id.get(target_path)
                if target_id is None:
                    continue  # ссылка на файл вне каталога (MOC, router, вложение) — норма
                c.edges.append((c.item_id, target_id, "link", raw.kind))
