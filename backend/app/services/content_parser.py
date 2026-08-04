"""Парсер контента: обход vault, чтение Markdown, frontmatter, ссылки.

Вся логика контента живёт в Python backend (см. docs/architecture.md):
здесь нет ничего про UI, только чтение и структурирование vault.

Архитектурное правило из VAULT_SPEC: prerequisites задаются смысловыми
wikilinks, а не отдельным полем frontmatter. Парсер извлекает ВСЕ ссылки
(wiki + markdown); каталог решает, какие из них становятся рёбрами графа.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
import urllib.parse
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

import frontmatter
from markdown_it import MarkdownIt

# Служебные каталоги Obsidian: исключаются всегда, независимо от frontmatter.
EXCLUDED_DIRS: frozenset[str] = frozenset(
    {
        ".obsidian",
        ".trash",
        "_meta",
        "00 Главная",
        "01 Входящие",
        "02 Ежедневные заметки",
        "90 Шаблоны",
        "99 Вложения",
    }
)

# Типы, которые никогда не попадают в каталог приложения (навигация/служебные/справочные).
TYPE_EXCLUDED: frozenset[str] = frozenset(
    {"moc", "meta", "router", "template", "solution", "source"}
)

# Типы, которые каталогизируются (см. docs/content-system.md + реальный vault).
TYPE_CATALOGUED: frozenset[str] = frozenset(
    {"course", "module", "lesson", "practice", "concept", "interview", "project", "deep-dive"}
)

ALL_KNOWN_TYPES: frozenset[str] = TYPE_CATALOGUED | TYPE_EXCLUDED

APP_VALUES: frozenset[str] = frozenset({"include", "source", "exclude"})
RAG_VALUES: frozenset[str] = frozenset({"include", "exclude"})
STATUS_DEPRECATED = "deprecated"

_WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
_H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def slugify_stem(stem: str) -> str:
    """Стабильный slug из имени файла: NFC, lowercase, пробелы → дефис.

    Киррилица сохраняется (локальное приложение, URL-энкодинг решает остальное).
    """
    s = unicodedata.normalize("NFC", stem).lower()
    s = re.sub(r"[^a-zа-яё0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s


def json_safe(value):
    """Рекурсивно приводит YAML-значения к JSON-совместимым (date/datetime → ISO)."""
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [json_safe(v) for v in value]
    if isinstance(value, (datetime,)):
        return value.isoformat()
    if hasattr(value, "isoformat"):  # datetime.date и т.п.
        return value.isoformat()
    if isinstance(value, Path):
        return str(value)
    return value


@dataclass
class RawLink:
    """Ссылка в теле заметки (до резолва в content ID)."""

    target: str  # нормализованная цель: без alias/heading, без пробелов по краям
    display: str | None  # текст ссылки (alias), если был
    kind: str  # wiki | markdown
    heading: str | None = None  # #heading из wiki-ссылки


@dataclass
class ParsedNote:
    """Результат разбора одного .md файла vault."""

    path: str  # относительный путь в vault (posix)
    abs_path: Path
    stem: str
    content_hash: str
    mtime: str
    frontmatter: dict | None  # None — нет/нечитаем frontmatter
    body: str
    title: str | None
    raw_links: list[RawLink] = field(default_factory=list)
    parse_error: str | None = None


class VaultScanner:
    """Обход vault с исключением служебных каталогов."""

    def __init__(self, vault_dir: Path) -> None:
        self.vault_dir = vault_dir

    def scan(self) -> list[Path]:
        if not self.vault_dir.is_dir():
            return []
        files: list[Path] = []
        for path in self.vault_dir.rglob("*.md"):
            if any(part in EXCLUDED_DIRS for part in path.parts):
                continue
            if path.name.startswith("."):  # .hermes.md и прочие dot-файлы (docs/content-system.md)
                continue
            files.append(path)
        # Детерминированный порядок для идемпотентности и читаемых отчётов.
        files.sort(key=lambda p: p.relative_to(self.vault_dir).as_posix())
        return files


class MarkdownParser:
    """Разбор одного файла: frontmatter, заголовок, ссылки."""

    def __init__(self) -> None:
        self._md = MarkdownIt("commonmark", {"html": True}).enable("table")

    def parse(self, path: Path, vault_dir: Path) -> ParsedNote:
        rel = path.relative_to(vault_dir).as_posix()
        raw = path.read_bytes()
        content_hash = sha256_hex(raw)
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC).isoformat(timespec="seconds")
        text = raw.decode("utf-8", errors="replace")

        frontmatter_data: dict | None = None
        parse_error: str | None = None
        # Файл без YAML-блока "---" в начале — без frontmatter (исключается из каталога,
        # docs/content-system.md). Битый YAML — parse_error (error).
        if not text.startswith("---"):
            body = text
        else:
            try:
                post = frontmatter.loads(text)
                frontmatter_data = dict(post.metadata or {})
                body = post.content
            except Exception as exc:  # noqa: BLE001 — одна плохая заметка не роняет парсер
                parse_error = str(exc)
                frontmatter_data = None
                body = text

        title = None
        if frontmatter_data and isinstance(frontmatter_data.get("title"), str):
            title = frontmatter_data["title"].strip()
        if not title:
            m = _H1_RE.search(body)
            if m:
                title = m.group(1).strip()

        links = self.extract_links(body) if frontmatter_data is not None else []

        return ParsedNote(
            path=rel,
            abs_path=path,
            stem=path.stem,
            content_hash=content_hash,
            mtime=mtime,
            frontmatter=json_safe(frontmatter_data),
            body=body,
            title=title,
            raw_links=links,
            parse_error=parse_error,
        )

    def extract_links(self, body: str) -> list[RawLink]:
        """Ссылки из текстовых токенов markdown-it.

        Кодовые блоки (fence/code_block) и inline-код исключаются: внутри них
        `[[...]]` — это код, а не wikilink (в vault есть такие шумные вхождения).
        """
        links: list[RawLink] = []
        tokens = self._md.parse(body)
        for tok in tokens:
            if tok.type in ("fence", "code_block"):
                continue
            if tok.type == "inline" and tok.children:
                for child in tok.children:
                    if child.type == "text":
                        links.extend(self._wiki_links(child.content))
                    elif child.type == "link_open":
                        href = child.attrGet("href")
                        if href and not href.startswith(
                            ("http://", "https://", "mailto:", "tel:", "#", "data:")
                        ):
                            # CommonMark хранит href в percent-encoding (в т.ч. кириллица).
                            href = urllib.parse.unquote(href)
                            links.append(
                                RawLink(target=href.strip(), display=None, kind="markdown")
                            )
        return links

    @staticmethod
    def _wiki_links(text: str) -> list[RawLink]:
        out: list[RawLink] = []
        for match in _WIKILINK_RE.finditer(text):
            raw = match.group(1)
            parts = raw.split("|", 1)
            target_full = parts[0]
            display = parts[1].strip() if len(parts) > 1 else None
            if "#" in target_full:
                target_full, _, heading = target_full.partition("#")
            else:
                heading = None
            target = target_full.strip()
            if not target:
                continue
            out.append(RawLink(target=target, display=display, kind="wiki", heading=heading))
        return out
