"""Построение интерактивных уроков и модели сцен (Фаза 3, улучшения — Фаза 6A).

LessonContentService читает из SQLite только метаданные урока, а из vault —
только два файла: сам урок (для datapath-сценария и проверки понимания) и
source-заметку по content_path. Весь парсинг Markdown и построение сцен
происходит здесь, на Python; frontend получает готовые сцены.

Модель сцен (расширяемая):
- markdown        — связное объяснение (заголовок секции + текст/списки/таблицы)
- formula         — LaTeX-формула с пояснением
- code            — fenced code block (язык + код)
- callout         — Obsidian callout (> [!type])
- checkpoint      — вопрос для самопроверки (без сохранения оценки)
- interactive_lab — ссылка на зарегистрированную лабораторию
- visual          — изображение/график с подписью (Фаза 6A)
- table           — таблица сравнения (Фаза 6A)

Правила разбора детерминированы и не требуют изменения Markdown ради парсера:
секции отделяются заголовками H2, специализированные блоки (math/code/callout)
выделяются в отдельные сцены, остальной текст группируется в связные markdown.

Фаза 6A добавляет:
- смысловую группировку сцен (heading+text, intro+list, formula+explanation);
- предотвращение дублирования пояснений формул;
- метаданные сцен: word_count, source_content_id, source_heading, semantic_role;
- нормализацию заголовков для сопоставления source_heading;
- слияние коротких сцен с соседними.

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
SCENE_TYPES = (
    "markdown",
    "formula",
    "code",
    "callout",
    "checkpoint",
    "interactive_lab",
    "visual",
    "table",
)

# Порог для слияния короткой сцены с соседней (слов).
TINY_SCENE_WORD_THRESHOLD = 15

# Локализованные метки semantic_role для пользовательских заголовков сцен.
SEMANTIC_ROLE_LABELS: dict[str, str] = {
    "motivation": "Зачем это нужно",
    "intuition": "Интуиция",
    "mechanism": "Как это работает",
    "mathematics": "Математика",
    "example": "Пример",
    "visualization": "Визуализация",
    "code": "Код",
    "hyperparameters": "Гиперпараметры",
    "pitfalls": "Типичные ошибки",
    "comparison": "Сравнение",
    "checkpoint": "Проверка понимания",
    "lab": "Практика",
    "interview_summary": "Ответ для собеседования",
}

# Явная таблица синонимов заголовков (детерминированная, без fuzzy-магии).
# Используется ТОЛЬКО для диагностики статуса source_heading; отбор секций
# продолжает использовать нормализованное сопоставление.
HEADING_ALIASES: dict[str, str] = {
    "коротко": "Идея за 30 секунд",
}

# Роли заголовков, указывающие на определённый semantic_role (эвристика).
HEADING_ROLE_HINTS: dict[str, str] = {
    "идея за 30 секунд": "intuition",
    "интуиция": "intuition",
    "мотивация": "motivation",
    "зачем": "motivation",
    "как строится": "mechanism",
    "как работает": "mechanism",
    "алгоритм": "mechanism",
    "механизм": "mechanism",
    "split gain": "mathematics",
    "критерий": "mathematics",
    "формула": "mathematics",
    "пример": "example",
    "код": "code",
    "реализация": "code",
    "гиперпараметр": "hyperparameters",
    "hyperparameter": "hyperparameters",
    "tuning": "hyperparameters",
    "сравнение": "comparison",
    "сравни": "comparison",
    "типичные ошибки": "pitfalls",
    "ошибки": "pitfalls",
    "failure": "pitfalls",
    "что если": "pitfalls",
    "визуализация": "visualization",
    "график": "visualization",
    "проверка": "checkpoint",
    "лаборатория": "lab",
    "практика": "lab",
    "интервью": "interview_summary",
    "ответ для собеседования": "interview_summary",
}


@dataclass
class _Block:
    """Промежуточный блок разбора Markdown."""

    kind: str  # heading | markdown | math | code | callout
    text: str = ""
    language: str | None = None
    callout_type: str | None = None
    level: int = 0
    consumed: bool = False  # Фаза 6A: блок поглощён другой сценой


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


def _word_count(text: str) -> int:
    """Количество слов в тексте (для метаданных сцены)."""
    return len(text.split()) if text else 0


def _contains_formula(text: str) -> bool:
    """Есть ли LaTeX-формулы в тексте."""
    return bool(
        re.search(
            r"\$\$|\$[^$]+\$|\\operatorname|\\frac|\\sum|\\int|\\alpha|\\beta|\\theta"
            r"|\\widehat|\\sigma|\\Omega|\\lambda|\\gamma|\\eta|\\mathcal|\\text\{|\\left|\\right",
            text,
        )
    )


def _is_math_heavy(text: str) -> bool:
    """Структурная математика: block math или серьёзные LaTeX-конструкции.

    Одинокое inline $x$ в предложении («увеличение $M$ уменьшает…») — это
    объяснение, а не математическая сцена.
    """
    return bool(
        re.search(
            r"\$\$|\\frac|\\sum|\\int|\\operatorname|\\partial|\\left|\\right|\\begin\{",
            text,
        )
    )


def _contains_code(text: str) -> bool:
    """Есть ли code blocks в тексте."""
    return "```" in text


def _contains_visual(text: str) -> bool:
    """Есть ли изображения/embeds в тексте."""
    return bool(re.search(r"!\[|!\[\[", text))


def _normalize_heading(heading: str) -> str:
    """Нормализация заголовка для сопоставления source_heading.

    - trimming и lowercase;
    - удаление нумерации («1.», «01», «Шаг 1»);
    - удаление markdown-форматирования (**bold**, *italic*, `code`);
    - нормализация пробелов.
    """
    if not heading:
        return ""
    h = heading.strip()
    # Удалить markdown-форматирование
    h = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", h)
    h = re.sub(r"`([^`]+)`", r"\1", h)
    # Удалить нумерацию в начале
    h = re.sub(r"^\d+[.)]\s*", "", h)
    h = re.sub(r"^\d+\s+", "", h)  # "01 Определение" → "Определение"
    h = re.sub(r"^(Шаг|Step)\s*\d+[.:]?\s*", "", h, flags=re.IGNORECASE)
    # Нормализовать пробелы
    h = re.sub(r"\s+", " ", h).strip().lower()
    return h


def _normalized_match(heading: str, candidates: list[str]) -> str | None:
    """Ищет совпадение нормализованного заголовка среди кандидатов.

    Возвращает оригинальный (ненормализованный) заголовок-кандидат при совпадении.
    """
    norm = _normalize_heading(heading)
    if not norm:
        return None
    for c in candidates:
        if _normalize_heading(c) == norm:
            return c
    return None


def _detect_semantic_role(title: str | None, content: str, scene_type: str) -> str | None:
    """Детерминированная эвристика semantic_role на основе заголовка и контента."""
    # Явные типы сцен
    if scene_type == "checkpoint":
        return "checkpoint"
    if scene_type == "interactive_lab":
        return "lab"
    if scene_type == "visual":
        return "visualization"
    if scene_type == "code":
        return "code"
    if scene_type == "table":
        return "comparison"

    # По заголовку
    if title:
        title_lower = title.lower().strip()
        # Точное совпадение
        if title_lower in HEADING_ROLE_HINTS:
            return HEADING_ROLE_HINTS[title_lower]
        # Частичное совпадение (подстрока)
        for hint, role in HEADING_ROLE_HINTS.items():
            if hint in title_lower:
                return role

    # По содержимому (для callout/markdown)
    if scene_type == "callout":
        return "pitfalls"  # большинство callout — предупреждения

    # Структурная математика внутри markdown указывает на mathematics
    if _is_math_heavy(content):
        return "mathematics"

    return None


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


def _consume_next_short_text(
    blocks: list[_Block], idx: int, max_len: int
) -> tuple[str | None, bool]:
    """Поглощает короткий текст после блока (для formula/code).

    Возвращает (text, was_heading_merged).
    В отличие от _next_short_text, помечает блок как consumed,
    чтобы он не создал отдельную сцену-дубликат.

    Если короткий текст сам является intro следующего formula/code
    (сразу за ним идёт math/code блок), он НЕ поглощается: это
    вводная строка следующего специального блока, а не explanation.
    """
    for j in range(idx + 1, len(blocks)):
        block = blocks[j]
        if block.kind == "markdown" and not block.consumed:
            text = block.text.strip()
            if len(text) <= max_len and not text.startswith("|"):
                # Текст-переход к следующей формуле/коду — не наш explanation.
                nxt = blocks[j + 1] if j + 1 < len(blocks) else None
                if nxt is not None and nxt.kind in ("math", "code") and not nxt.consumed:
                    return None, False
                block.consumed = True
                return text, False
            return None, False
        if block.kind == "heading":
            return None, False
    return None, False


def _consume_prev_short_text(blocks: list[_Block], idx: int, max_len: int) -> str | None:
    """Поглощает короткий текст НЕПОСРЕДСТВЕННО перед формулой/кодом (intro).

    Смотрим только соседний блок: вводная строка относится к ближайшему
    специальному блоку, а не к формуле через одну.
    """
    j = idx - 1
    if j >= 0:
        block = blocks[j]
        if block.kind == "markdown" and not block.consumed:
            text = block.text.strip()
            if len(text) <= max_len and not text.startswith("|"):
                block.consumed = True
                return text
    return None


def _strip_frontmatter(text: str) -> str:
    """Убирает YAML frontmatter (--- ... ---), если он есть в начале текста."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2]
    return text


def _latex_to_readable(text: str) -> str:
    """Преобразует LaTeX-фрагмент в читаемый текст (для заголовков).

    - снимает $$...$$ и $...$;
    - преобразует греческие команды в символы (\\Omega → Ω);
    - заменяет частые escape (\\% → %, \\_ → _);
    - удаляет оставшиеся \\commands и фигурные скобки.
    """
    if not text:
        return ""
    greek = {
        "alpha": "α",
        "beta": "β",
        "gamma": "γ",
        "delta": "δ",
        "epsilon": "ε",
        "theta": "θ",
        "lambda": "λ",
        "mu": "μ",
        "nu": "ν",
        "pi": "π",
        "rho": "ρ",
        "sigma": "σ",
        "tau": "τ",
        "phi": "φ",
        "chi": "χ",
        "psi": "ψ",
        "omega": "ω",
        "Gamma": "Γ",
        "Delta": "Δ",
        "Theta": "Θ",
        "Lambda": "Λ",
        "Sigma": "Σ",
        "Phi": "Φ",
        "Psi": "Ψ",
        "Omega": "Ω",
        "eta": "η",
        "xi": "ξ",
        "zeta": "ζ",
        "kappa": "κ",
    }
    out = re.sub(r"\$\$([^$]+)\$\$", r"\1", text)
    out = re.sub(r"\$([^$]+)\$", r"\1", out)
    out = out.replace("\\%", "%").replace("\\_", "_").replace("\\ ", " ")
    for cmd, sym in greek.items():
        out = out.replace(f"\\{cmd}", sym)
    for fn in ("log", "exp", "max", "min", "argmin", "argmax", "mean", "sum", "prod", "sqrt"):
        out = out.replace(f"\\{fn}", fn)
    out = re.sub(r"\\operatorname\{([^}]+)\}", r"\1", out)
    out = re.sub(r"\\text\{([^}]+)\}", r"\1", out)
    out = re.sub(r"\\widehat\{([^}]+)\}", r"\1", out)
    out = re.sub(r"\\[a-zA-Z]+", "", out)
    out = re.sub(r"[{}]", "", out)
    out = re.sub(r"\s+", " ", out).strip()
    return out


def _first_sentence(text: str, max_len: int = 48) -> str | None:
    """Короткое первое предложение текста для пользовательского заголовка.

    Преобразует inline-математику в читаемый текст; пропускает короткие
    вводные строки-переходы («Impurity:», «где:», «то:») и номера списков.
    """
    if not text:
        return None
    # Строки: пропускаем короткие вводные «X:» и нумерацию «6.» ДО преобразования
    # (иначе \n теряются при _latex_to_readable)
    raw_lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    while raw_lines:
        first_readable = _latex_to_readable(raw_lines[0])
        is_short_intro = len(first_readable.split()) <= 3 and first_readable.endswith(":")
        is_numbered = bool(re.match(r"^\d+[.)]\s*$", first_readable))
        if is_short_intro or is_numbered:
            raw_lines.pop(0)
        else:
            break
    clean = _latex_to_readable(" ".join(raw_lines))
    clean = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", clean)
    clean = re.sub(r"!\[\[[^\]]*\]\]", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    # Первое предложение
    for sep in (". ", "! ", "? ", "\n"):
        idx = clean.find(sep)
        if 0 < idx < max_len:
            clean = clean[: idx + 1]
            break
    if len(clean) > max_len:
        clean = clean[:max_len].rstrip() + "…"
    return clean or None


def _h3_heading(scene: dict) -> str | None:
    """Первый H3/H4-заголовок внутри сцены (приоритет 1 для display_title)."""
    md = scene.get("markdown") or scene.get("explanation") or ""
    match = re.search(r"^#{3,4}\s+(.+?)\s*$", md, flags=re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def _formula_label(scene: dict) -> str | None:
    """Смысловая метка формулы (приоритет 3 для display_title).

    Сначала осмысленное имя оператора (\\operatorname{Gini} → Gini),
    затем левая часть до '=' (L(y,F), F_m(x), R_α(T)).
    """
    formula = scene.get("formula") or ""
    match = re.search(r"\\operatorname\{([^}]+)\}", formula)
    if match:
        return match.group(1).strip()
    return _formula_lhs_label(scene)


def _formula_lhs_label(scene: dict) -> str | None:
    """Левая часть формулы до '=' в читаемом виде (для заголовка).

    Пропускает LHS со структурными командами (\\frac, \\partial, \\sum),
    которые не дают короткого читаемого заголовка.
    """
    formula = scene.get("formula") or ""
    if "=" not in formula:
        return None
    lhs = formula.split("=", 1)[0].strip()
    if re.search(r"\\frac|\\partial|\\sum|\\int|\\left|\\right", lhs):
        return None
    readable = _latex_to_readable(lhs)
    if not readable or len(readable) > 24:
        return None
    return readable


def _assign_display_titles(scenes: list[dict]) -> list[dict]:
    """Детерминированные пользовательские заголовки сцен (Фаза 6A, доработка).

    Приоритет:
    1. H3/H4-заголовок внутри сцены;
    2. уникальный source_heading (если в уроке он один);
    3. смысловая метка формулы / caption кода / таблицы / visual;
    4. локализованная метка semantic_role;
    5. короткое первое предложение;
    6. стабильный fallback.

    source_heading, source_content_id, semantic_role и scene ID сохраняются.
    Специальные типы (interactive_lab, checkpoint) не трогаем — у них свои метки.
    """
    from collections import Counter

    title_counts = Counter(s.get("title") for s in scenes if s.get("title"))
    prev_display: str | None = None
    prev_role: str | None = None

    for scene in scenes:
        stype = scene.get("type", "")
        if stype in ("interactive_lab", "checkpoint"):
            continue

        title = scene.get("title")
        display: str | None = None

        # 1. H3/H4 внутри сцены
        display = _h3_heading(scene)

        # 2. Уникальный source_heading
        if not display and title and title_counts.get(title, 0) == 1:
            display = title

        # 3. Смысловая метка формулы / caption
        if not display and stype == "formula":
            display = _formula_label(scene)
            if not display:
                display = _first_sentence(scene.get("explanation") or "")
        if not display and stype == "code":
            display = _first_sentence(scene.get("caption") or "")
        if not display and stype == "table":
            display = (
                "Сравнение"
                if title == "Сравнение"
                else _first_sentence(scene.get("markdown") or "")
            )
        if not display and stype == "visual":
            display = _first_sentence(scene.get("caption") or "") or "Визуализация"

        # 4. Локализованная метка semantic_role
        role = scene.get("semantic_role")
        if not display and role:
            display = SEMANTIC_ROLE_LABELS.get(role)

        # 5. Первое предложение
        if not display:
            display = _first_sentence(scene.get("markdown") or scene.get("explanation") or "")

        # 6. Fallback
        if not display:
            display = "Материал"

        # Предотвращение одинаковых подряд идущих заголовков
        if display == prev_display:
            if role and role != prev_role and SEMANTIC_ROLE_LABELS.get(role):
                display = f"{display} · {SEMANTIC_ROLE_LABELS[role]}"
            else:
                display = f"{display} (повтор)"

        scene["display_title"] = display
        prev_display = display
        prev_role = role

    return scenes


def _resolve_heading_statuses(
    requested: list[str | None],
    source_scenes: list[dict],
) -> list[dict]:
    """Статусы разрешения source_heading (exact | normalized | fallback | missing).

    Диагностика для quality CLI и Lesson API (обратно совместимое поле).
    Отбор секций не меняется: exact/normalized совпадение фильтрует сцены,
    иначе используется fallback (все секции по порядку).
    """
    source_titles = [s.get("title") for s in source_scenes if s.get("title")]
    statuses: list[dict] = []
    for heading in requested:
        h = heading.strip() if isinstance(heading, str) else ""
        if not h:
            statuses.append(
                {
                    "requested_heading": "",
                    "status": "missing",
                    "selected_heading": None,
                    "known_alias": None,
                }
            )
            continue
        # Точное совпадение
        if h in source_titles:
            statuses.append(
                {
                    "requested_heading": h,
                    "status": "exact",
                    "selected_heading": h,
                    "known_alias": None,
                }
            )
            continue
        # Нормализованное совпадение
        matched = _normalized_match(h, source_titles)
        if matched:
            statuses.append(
                {
                    "requested_heading": h,
                    "status": "normalized",
                    "selected_heading": matched,
                    "known_alias": None,
                }
            )
            continue
        # Явная таблица синонимов (диагностика; отбор секций не меняет)
        alias_target = HEADING_ALIASES.get(_normalize_heading(h))
        statuses.append(
            {
                "requested_heading": h,
                "status": "fallback",
                "selected_heading": None,
                "known_alias": alias_target,
            }
        )
    return statuses


def _scene_metadata(
    scene: dict,
    source_content_id: str | None = None,
    source_heading: str | None = None,
) -> dict:
    """Добавляет стандартные метаданные к сцене (Фаза 6A)."""
    stype = scene.get("type", "markdown")

    # Считаем word_count
    if stype == "markdown" or stype == "callout":
        wc = _word_count(scene.get("markdown", ""))
    elif stype == "formula":
        wc = _word_count(scene.get("explanation", ""))
    elif stype == "code":
        wc = _word_count(scene.get("caption", ""))
    else:
        wc = 0

    # Определяем contains_*
    full_text = ""
    if stype == "markdown" or stype == "callout":
        full_text = scene.get("markdown", "")
    elif stype == "formula":
        full_text = (scene.get("formula", "") or "") + " " + (scene.get("explanation", "") or "")

    title = scene.get("title")
    semantic_role = _detect_semantic_role(title, full_text, stype)

    scene["word_count"] = wc
    scene["source_content_id"] = source_content_id
    scene["source_heading"] = source_heading
    scene["semantic_role"] = semantic_role
    scene["contains_formula"] = _contains_formula(full_text)
    scene["contains_code"] = _contains_code(full_text)
    scene["contains_visual"] = _contains_visual(full_text)
    return scene


def _merge_tiny_scenes(scenes: list[dict]) -> list[dict]:
    """Пост-обработка: слияние коротких markdown-сцен с соседними.

    Правила:
    - Сцена < TINY_SCENE_WORD_THRESHOLD слов сливается со следующей сценой
      (если она markdown/callout/table) или с предыдущей.
    - Заголовок короткой сцены сохраняется в результирующей.
    - Пустые сцены (word_count == 0 и без специального типа) удаляются.
    """
    if not scenes:
        return scenes

    # Фильтруем пустые markdown-сцены (без текста и не специальный тип)
    filtered: list[dict] = []
    for s in scenes:
        stype = s.get("type", "")
        if stype in ("markdown",):
            md = (s.get("markdown") or "").strip()
            if not md:
                continue  # удаляем пустую markdown-сцену
        filtered.append(s)

    if len(filtered) <= 1:
        return filtered

    merged: list[dict] = []
    i = 0
    while i < len(filtered):
        scene = filtered[i]
        stype = scene.get("type", "")

        # Не сливаем специальные типы
        if stype not in ("markdown", "callout", "table"):
            merged.append(scene)
            i += 1
            continue

        wc = scene.get("word_count", 0)
        if wc >= TINY_SCENE_WORD_THRESHOLD:
            merged.append(scene)
            i += 1
            continue

        # Короткая сцена: пытаемся слить со следующей
        if i + 1 < len(filtered):
            next_scene = filtered[i + 1]
            next_type = next_scene.get("type", "")

            # НЕ сливаем сцены с разными H2-заголовками (разные смысловые секции)
            s_title = scene.get("title")
            n_title = next_scene.get("title")
            if s_title and n_title and s_title != n_title:
                merged.append(scene)
                i += 1
                continue

            if next_type in ("markdown", "callout", "table"):
                merged_content = _merge_two_markdown_scenes(scene, next_scene)
                merged.append(merged_content)
                i += 2
                continue
            elif next_type in ("formula", "code", "visual"):
                merged_content = _merge_intro_with_special(scene, next_scene)
                merged.append(merged_content)
                i += 2
                continue

        # Не удалось слить со следующей — пробуем с предыдущей
        if merged:
            prev = merged[-1]
            prev_type = prev.get("type", "")
            # НЕ сливаем сцены с разными H2-заголовками
            s_title = scene.get("title")
            p_title = prev.get("title")
            if s_title and p_title and s_title != p_title:
                merged.append(scene)
                i += 1
                continue
            if prev_type in ("markdown", "callout", "table"):
                merged[-1] = _merge_two_markdown_scenes(prev, scene)
                i += 1
                continue

        # Не удалось слить — оставляем как есть
        merged.append(scene)
        i += 1

    return merged


def _merge_two_markdown_scenes(first: dict, second: dict) -> dict:
    """Сливает две markdown/callout/table сцены в одну."""
    title = second.get("title") or first.get("title")
    md1 = (first.get("markdown") or "").strip()
    md2 = (second.get("markdown") or "").strip()
    merged_md = f"{md1}\n\n{md2}".strip()

    result = {
        "type": first.get("type", "markdown"),
        "title": title,
        "markdown": merged_md,
    }
    # Копируем callout_type если есть
    if first.get("callout_type"):
        result["callout_type"] = first["callout_type"]
    if second.get("callout_type"):
        result["callout_type"] = second["callout_type"]

    return _scene_metadata(
        result,
        source_content_id=first.get("source_content_id"),
        source_heading=first.get("source_heading"),
    )


def _merge_intro_with_special(intro: dict, special: dict) -> dict:
    """Сливает короткий intro с formula/code/visual сценой.

    Для formula: intro + explanation объединяются.
    Для code: intro становится частью caption.
    """
    intro_text = (intro.get("markdown") or "").strip()
    intro_title = intro.get("title")
    special_type = special.get("type", "")

    result = dict(special)  # копируем специальную сцену

    if special_type == "formula":
        expl = (special.get("explanation") or "").strip()
        combined = f"{intro_text}\n\n{expl}".strip() if intro_text else expl
        result["explanation"] = combined
    elif special_type == "code":
        cap = (special.get("caption") or "").strip()
        combined = f"{intro_text}\n\n{cap}".strip() if intro_text else cap
        result["caption"] = combined

    # Сохраняем заголовок intro если у special нет своего
    if intro_title and not special.get("title"):
        result["title"] = intro_title

    return _scene_metadata(
        result,
        source_content_id=special.get("source_content_id"),
        source_heading=special.get("source_heading"),
    )


def build_source_scenes(
    source_markdown: str,
    source_content_id: str | None = None,
) -> list[dict]:
    """Строит сцены из source-заметки (после H1), исключая мета-разделы.

    Фаза 6A: добавляет слияние коротких сцен, предотвращает дублирование
    пояснений формул, добавляет метаданные сцен.
    """
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
                scene = {"type": "markdown", "title": current_title, "markdown": content}
                scenes.append(_scene_metadata(scene, source_content_id, current_title))
        current_buffer = []

    def _drain_short_buffer() -> str | None:
        """Если буфер короткий — возвращает его содержимое и очищает (без создания сцены).

        Используется перед formula/code блоками, чтобы короткий intro стал частью
        специальной сцены, а не отдельной markdown-сценой.
        """
        nonlocal current_buffer
        if not current_buffer:
            return None
        content = "\n".join(current_buffer).strip()
        if not content:
            current_buffer = []
            return None
        wc = _word_count(content)
        if wc <= TINY_SCENE_WORD_THRESHOLD:
            current_buffer = []
            return content
        return None  # буфер длинный — пусть flush_current создаст нормальную сцену

    for idx, block in enumerate(blocks):
        if block.consumed:
            continue

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
            # Не сбрасываем короткий буфер в отдельную сцену — используем как intro.
            intro_text = _drain_short_buffer()
            if not intro_text:
                intro_text = _consume_prev_short_text(blocks, idx, max_len=100)
            # Поглощаем текст ПОСЛЕ формулы (explanation) — consume, не peek!
            explanation, _ = _consume_next_short_text(blocks, idx, max_len=400)

            combined_expl = ""
            if intro_text:
                combined_expl = intro_text
            if explanation:
                combined_expl = (
                    f"{combined_expl}\n\n{explanation}".strip() if combined_expl else explanation
                )

            scene = {
                "type": "formula",
                "title": current_title,
                "formula": block.text,
                "explanation": combined_expl,
            }
            scenes.append(_scene_metadata(scene, source_content_id, current_title))

        elif block.kind == "code":
            # Не сбрасываем короткий буфер в отдельную сцену — используем как intro.
            intro_text = _drain_short_buffer()
            if not intro_text:
                intro_text = _consume_prev_short_text(blocks, idx, max_len=100)
            # Поглощаем текст ПОСЛЕ кода (caption) — consume!
            caption, _ = _consume_next_short_text(blocks, idx, max_len=200)

            combined_caption = ""
            if intro_text:
                combined_caption = intro_text
            if caption:
                combined_caption = (
                    f"{combined_caption}\n\n{caption}".strip() if combined_caption else caption
                )

            scene = {
                "type": "code",
                "title": current_title,
                "language": block.language,
                "code": block.text,
                "caption": combined_caption,
            }
            scenes.append(_scene_metadata(scene, source_content_id, current_title))

        elif block.kind == "callout":
            flush_current()
            scene = {
                "type": "callout",
                "callout_type": block.callout_type,
                "title": current_title,
                "markdown": block.text,
            }
            scenes.append(_scene_metadata(scene, source_content_id, current_title))

    flush_current()

    # Пост-обработка: слияние коротких сцен
    scenes = _merge_tiny_scenes(scenes)

    # Пользовательские заголовки (display_title) для outline и заголовков сцен
    scenes = _assign_display_titles(scenes)

    return scenes


def _markdown_scene(title: str | None, content: str) -> dict:
    scene = {"type": "markdown", "title": title, "markdown": content}
    return _scene_metadata(scene)


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

            # Определяем source_content_id из каталога
            source_content_id = None
            if item.content_path:
                src_item = db.scalar(
                    select(ContentItem).where(ContentItem.path == item.content_path)
                )
                if src_item:
                    source_content_id = src_item.id

            scenes, heading_resolution = self._build_scenes(
                item, datapath, source_md, body, source_content_id
            )
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
                # Диагностика source_heading (Фаза 6A): exact | normalized | fallback | missing
                "heading_resolution": heading_resolution,
                "source_content_id": source_content_id,
                "source_path": item.content_path,
            }

    def _build_scenes(
        self,
        item: ContentItem,
        datapath: dict | None,
        source_md: str | None,
        body: str,
        source_content_id: str | None = None,
    ) -> tuple[list[dict], list[dict]]:
        """Возвращает (scenes, heading_resolution). heading_resolution — диагностика
        source_heading: exact | normalized | fallback | missing (обратно совместимо)."""
        scenes: list[dict] = []
        heading_resolution: list[dict] = []

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
            source_scenes = build_source_scenes(source_md, source_content_id)
            if datapath:
                content_scenes_raw = [
                    s
                    for s in datapath.get("scenes", [])
                    if isinstance(s, dict) and s.get("type") == "content"
                ]
                headings = [s.get("source_heading") for s in content_scenes_raw]
                # Нормализованное сопоставление (Фаза 6A)
                if headings:
                    selected = []
                    for s in source_scenes:
                        stitle = s.get("title")
                        if stitle and _normalized_match(stitle, headings):
                            selected.append(s)
                    content_scenes = selected if selected else source_scenes
                    heading_resolution = _resolve_heading_statuses(headings, source_scenes)
                else:
                    content_scenes = source_scenes
            else:
                content_scenes = source_scenes
            scenes.extend(content_scenes)
        else:
            # Запасной вариант: сам урок содержит теорию (нет content_path).
            theory = re.sub(r"```datapath.*?```", "", body, flags=re.DOTALL).strip()
            if theory:
                scenes.append(_markdown_scene("Основной материал", theory))
            # Нет доступного source — статус missing для запрошенных заголовков.
            if datapath:
                content_scenes_raw = [
                    s
                    for s in datapath.get("scenes", [])
                    if isinstance(s, dict) and s.get("type") == "content"
                ]
                headings = [s.get("source_heading") for s in content_scenes_raw]
                if headings:
                    heading_resolution = [
                        {
                            "requested_heading": h if isinstance(h, str) else "",
                            "status": "missing",
                            "selected_heading": None,
                            "known_alias": None,
                        }
                        for h in headings
                    ]

        # 3. Interactive labs из registry.
        for lab in self.registry.labs_for_lesson(item.id):
            scene = {
                "type": "interactive_lab",
                "title": None,
                "lab_id": lab.id,
                "lab_title": lab.title,
            }
            scenes.append(_scene_metadata(scene, source_content_id))

        # 4. Checkpoint: «Проверка понимания» урока.
        for question in _extract_checkpoints(body):
            scene = {"type": "checkpoint", "title": None, "question": question}
            scenes.append(_scene_metadata(scene, source_content_id))

        return scenes, heading_resolution

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

        if item.content_path:
            source_item = db.scalar(
                select(ContentItem).where(ContentItem.path == item.content_path)
            )
            add(source_item)
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
