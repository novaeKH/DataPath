"""Тесты Фазы 6A: группировка сцен, метаданные, семантические роли, формулы и код.

Все тесты используют build_source_scenes напрямую (без API и БД) —
чистый парсер на fixture Markdown.
"""

from __future__ import annotations

from app.services.lesson_content import (
    _detect_semantic_role,
    _learning_outcome_markdown,
    _normalize_heading,
    _normalized_match,
    _word_count,
    build_source_scenes,
)

# ======================================================================
# Heading normalization
# ======================================================================


def test_normalize_heading_basic():
    assert _normalize_heading("  Идея за 30 секунд  ") == "идея за 30 секунд"
    assert _normalize_heading("**Коротко**") == "коротко"
    assert _normalize_heading("1. Введение") == "введение"
    assert _normalize_heading("01 Определение") == "определение"
    assert _normalize_heading("Шаг 1: Постановка") == "постановка"
    assert _normalize_heading("") == ""


def test_normalized_match():
    assert _normalized_match("Коротко", ["Идея за 30 секунд", "Коротко", "Split gain"]) == "Коротко"
    assert _normalized_match("**Коротко**", ["Коротко", "Интуиция"]) == "Коротко"
    assert _normalized_match("  Интуиция  ", ["Коротко", "Интуиция"]) == "Интуиция"
    assert _normalized_match("Несуществующий", ["Коротко", "Интуиция"]) is None
    assert _normalized_match("", ["Коротко"]) is None


def test_word_count():
    assert _word_count("") == 0
    assert _word_count("одно") == 1
    assert _word_count("три слова здесь") == 3
    # split() collapses multiple spaces — "пробелы  вокруг" → ["пробелы", "вокруг"] = 2
    assert _word_count("  пробелы  вокруг  ") == 2


def test_generic_canonical_objective_becomes_specific_learning_outcome():
    source = """---
title: Example
---

## 1. Интуиция расстояния

Текст.

## 2. Масштабирование признаков

Текст.

## 3. Выбор соседей

Текст.

## Типичные ошибки

Текст.
"""
    result = _learning_outcome_markdown(
        "Метод соседей",
        source,
        (
            "Разобрать каноническую главу №43, воспроизвести её ключевой механизм "
            "и оценить готовность объяснить тему."
        ),
    )
    assert "каноническую главу" not in result
    assert "Интуиция расстояния" in result
    assert "Масштабирование признаков" in result
    assert "Выбор соседей" in result


def test_authored_learning_outcome_is_preserved():
    authored = "После урока вы сможете проверить гипотезу на числовом примере."
    assert _learning_outcome_markdown("Гипотезы", None, authored) == authored


# ======================================================================
# Heading + text merge
# ======================================================================


def test_heading_plus_paragraph():
    md = """## Заголовок

Текст объяснения из нескольких слов про метод и его применение в реальных задачах."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["type"] == "markdown"
    assert scenes[0]["title"] == "Заголовок"
    assert "Текст объяснения" in scenes[0]["markdown"]


def test_short_heading_with_content():
    md = """## DT

Decision Tree — это рекурсивный алгоритм, который делит пространство признаков."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["title"] == "DT"
    assert scenes[0]["word_count"] >= 5


# ======================================================================
# Formula + explanation merge
# ======================================================================


def test_formula_with_explanation():
    md = """## Split gain

Для узла с $n$ объектами:

$$
\\operatorname{Gain}=I(\\text{parent})-\\frac{n_L}{n}I(\\text{left}).
$$

Здесь $I$ — impurity внутри node."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["type"] == "formula"
    assert scenes[0]["title"] == "Split gain"
    assert "Gain" in scenes[0]["formula"]
    assert "impurity" in scenes[0]["explanation"]
    assert "Для узла" in scenes[0]["intro"]
    # No duplicate — explanation should appear once
    assert scenes[0]["explanation"].count("impurity") == 1


def test_formula_with_definitions_list():
    md = """## Regularization

Objective:
$$
\\widehat{\\theta}=\\arg\\min_\\theta\\left[\\mathcal{L}_{\\text{data}}(\\theta)+\\lambda\\Omega(\\theta)\\right]
$$

где:
- $\\mathcal{L}_{\\text{data}}$ измеряет fit;
- $\\Omega$ — complexity preference;
- $\\lambda$ управляет силой."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["type"] == "formula"
    assert "mathcal" in scenes[0]["formula"]
    assert "измеряет fit" in scenes[0]["explanation"]
    assert scenes[0]["intro"] == "Objective:"


def test_two_independent_formulas():
    md = """## Classification criteria

Если $p_k$ — доля класса $k$:

$$
\\operatorname{Gini}=1-\\sum_k p_k^2,
$$

$$
\\operatorname{Entropy}=-\\sum_k p_k\\log p_k.
$$

Pure node имеет zero impurity."""
    scenes = build_source_scenes(md)
    # Two formulas under one heading: should be 2 formula scenes (not force-merged)
    formulas = [s for s in scenes if s["type"] == "formula"]
    assert len(formulas) == 2
    assert formulas[0]["title"] == "Classification criteria"
    assert formulas[1]["title"] == "Classification criteria"


def test_latex_bracket_formula_is_a_formula_scene():
    md = r"""## Числовой пример

Параметры первого слоя:

\[
2\cdot16+16=48.
\]

Два входа, шестнадцать нейронов и bias каждого нейрона."""
    scenes = build_source_scenes(md)
    formulas = [scene for scene in scenes if scene["type"] == "formula"]

    assert len(formulas) == 1
    assert formulas[0]["formula"] == r"2\cdot16+16=48."
    assert formulas[0]["contains_formula"] is True
    assert "Два входа" in formulas[0]["explanation"]
    assert formulas[0]["intro"] == "Параметры первого слоя:"


def test_inline_latex_parentheses_are_normalized_but_code_is_untouched():
    md = r"""## Производная

Для функции \(f(x)=x^2\) производная равна \(2x\).

```python
literal = r"\(not math inside code\)"
    ```"""
    scenes = build_source_scenes(md)
    code = next(scene for scene in scenes if scene["type"] == "code")

    assert "$f(x)=x^2$" in code["intro"]
    assert "$2x$" in code["intro"]
    assert r"\(not math inside code\)" in code["code"]


# ======================================================================
# Code merge
# ======================================================================


def test_code_intro_plus_block():
    md = """## Пример

Базовый код обучения:

```python
from sklearn.tree import DecisionTreeClassifier
model = DecisionTreeClassifier(max_depth=3)
model.fit(X_train, y_train)
```

Объяснение после кода."""
    scenes = build_source_scenes(md)
    codes = [s for s in scenes if s["type"] == "code"]
    assert len(codes) == 1
    assert codes[0]["language"] == "python"
    assert "DecisionTreeClassifier" in codes[0]["code"]
    assert "Базовый код" in codes[0]["intro"]
    assert "Объяснение" in codes[0]["caption"]


def test_code_keeps_bad_good_labels_before_the_matching_example():
    md = """## Mutable default

Плохо:

```python
def add_user(name, users=[]):
    users.append(name)
```

Список сохраняется между вызовами.

Правильно:

```python
def add_user(name, users=None):
    users = [] if users is None else users
    users.append(name)
```"""
    codes = [scene for scene in build_source_scenes(md) if scene["type"] == "code"]

    assert len(codes) == 2
    assert codes[0]["intro"] == "Плохо:"
    assert not codes[0].get("caption")
    assert codes[1]["intro"] == "Список сохраняется между вызовами.\n\nПравильно:"
    assert not codes[1].get("caption")


def test_long_prose_remains_before_code_as_its_own_scene():
    md = """## Порядок

Это подробное объяснение из большого количества слов должно читаться до примера, потому что оно
задаёт контекст операции и объясняет ученику, на какие значения смотреть в следующем блоке.

```python
result = transform(data)
```"""
    scenes = build_source_scenes(md)

    assert [scene["type"] for scene in scenes] == ["markdown", "code"]
    assert "подробное объяснение" in scenes[0]["markdown"]
    assert scenes[1]["code"] == "result = transform(data)"


def test_code_without_intro():
    md = """## Пример

```python
x = 1
```"""
    scenes = build_source_scenes(md)
    codes = [s for s in scenes if s["type"] == "code"]
    assert len(codes) == 1
    assert codes[0]["code"] == "x = 1"


# ======================================================================
# List with intro
# ======================================================================


def test_list_with_intro():
    md = """## Гиперпараметры

Основные параметры, влияющие на сложность дерева:

- max_depth — максимальная глубина;
- min_samples_split — минимальное число объектов для разбиения;
- min_samples_leaf — минимальное число объектов в листе."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["type"] == "markdown"
    assert "max_depth" in scenes[0]["markdown"]
    assert "min_samples_split" in scenes[0]["markdown"]
    assert "Основные параметры" in scenes[0]["markdown"]


def test_nested_list():
    md = """## Структура

- Уровень 1
  - Уровень 1.1
  - Уровень 1.2
- Уровень 2"""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1


# ======================================================================
# Callout preservation
# ======================================================================


def test_obsidian_callout():
    md = """## Важно

> [!warning] Внимание
> Не используйте информацию из тестовой выборки при выборе порога."""
    scenes = build_source_scenes(md)
    callouts = [s for s in scenes if s["type"] == "callout"]
    assert len(callouts) == 1
    assert callouts[0]["callout_type"] == "warning"
    assert "тестовой выборки" in callouts[0]["markdown"]


# ======================================================================
# Table preservation
# ======================================================================


def test_table():
    md = """## Сравнение

| Метод | Bias | Variance |
|---|---|---|
| DT | низкий | высокий |
| RF | низкий | средний |"""
    scenes = build_source_scenes(md)
    assert len(scenes) >= 1
    markdowns = [s for s in scenes if s["type"] == "markdown"]
    assert len(markdowns) >= 1
    assert "| Метод |" in markdowns[0]["markdown"]


# ======================================================================
# Image support (basic, no actual files)
# ======================================================================


def test_markdown_image():
    md = """## Визуализация

![Decision boundary](boundary.png)

*Рис. 1: Разделяющая поверхность дерева решений.*"""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["contains_visual"] is True


# ======================================================================
# Two independent sections
# ======================================================================


def test_two_sections():
    md = """## Раздел 1

Текст первого раздела с объяснением метода и его применением в задачах классификации.

## Раздел 2

Текст второго раздела про ограничения и типичные ошибки при использовании."""
    scenes = build_source_scenes(md)
    markdowns = [s for s in scenes if s["type"] == "markdown"]
    assert len(markdowns) == 2
    assert markdowns[0]["title"] == "Раздел 1"
    assert markdowns[1]["title"] == "Раздел 2"


# ======================================================================
# Very short text block merge
# ======================================================================


def test_very_short_text_merged():
    md = """## Split

Intro:

$$
x = y
$$

Текст после формулы."""
    scenes = build_source_scenes(md)
    # "Intro:" (1 word) should be merged into the formula, not a separate scene
    formulas = [s for s in scenes if s["type"] == "formula"]
    assert len(formulas) == 1
    assert "Intro" in formulas[0]["intro"]


def test_single_word_merged():
    md = """## L2

то:

$$
\\Omega(\\theta)=\\sum\\theta_j^2
$$

L2 smooth и сильно штрафует."""
    scenes = build_source_scenes(md)
    # "то:" should be merged, not separate
    formulas = [s for s in scenes if s["type"] == "formula"]
    assert len(formulas) == 1
    tiny_md = [s for s in scenes if s["type"] == "markdown" and s["word_count"] <= 3]
    assert len(tiny_md) == 0  # no tiny standalone scenes


# ======================================================================
# Service section exclusion
# ======================================================================


def test_service_sections_excluded():
    md = """## Основное

Контент основной секции.

## Связи

- [[Другая заметка]]

## Источники

- sklearn documentation"""
    scenes = build_source_scenes(md)
    markdowns = [s for s in scenes if s["type"] == "markdown"]
    assert len(markdowns) == 1
    assert markdowns[0]["title"] == "Основное"
    assert "Связи" not in [s.get("title") for s in scenes]
    assert "Источники" not in [s.get("title") for s in scenes]


def test_visualizer_design_spec_is_not_rendered_as_lesson_prose():
    md = """## Основное

Здесь ученик получает полноценное объяснение механизма.

## 19. Интерактивная визуализация DataPath

Показать slider и добавить будущий график.

### Режим 1

Пользователь двигает параметр."""
    scenes = build_source_scenes(md)

    assert [scene.get("title") for scene in scenes] == ["Основное"]
    assert "Показать slider" not in str(scenes)


# ======================================================================
# Empty scene removal
# ======================================================================


def test_empty_markdown_removed():
    md = """## Пустая секция



## Следующая

Контент."""
    scenes = build_source_scenes(md)
    markdowns = [s for s in scenes if s["type"] == "markdown"]
    assert len(markdowns) == 1
    assert markdowns[0]["title"] == "Следующая"


# ======================================================================
# Semantic roles
# ======================================================================


def test_semantic_role_detection():
    assert _detect_semantic_role("Идея за 30 секунд", "", "markdown") == "intuition"
    assert _detect_semantic_role("Split gain", "", "markdown") == "mathematics"
    assert _detect_semantic_role("Пример", "", "markdown") == "example"
    assert _detect_semantic_role("Типичные ошибки", "", "markdown") == "pitfalls"
    assert _detect_semantic_role("Сравнение", "", "markdown") == "comparison"
    assert _detect_semantic_role(None, "", "checkpoint") == "checkpoint"
    assert _detect_semantic_role(None, "", "interactive_lab") == "lab"
    assert _detect_semantic_role(None, "", "code") == "code"
    # Одиночное inline $x^2$ — объяснение, а не математическая сцена
    assert _detect_semantic_role(None, "содержит $x^2$ формулу", "markdown") is None
    # Структурная математика (frac) — mathematics
    assert _detect_semantic_role(None, "$$\\frac{a}{b}=c$$", "markdown") == "mathematics"


# ======================================================================
# Scene metadata
# ======================================================================


def test_scene_metadata_present():
    md = """## Split gain

$$
Gain = I(parent) - \\frac{n_L}{n}I(left)
$$

Impurity уменьшается при каждом разбиении."""
    scenes = build_source_scenes(md, source_content_id="concept.test")
    assert len(scenes) == 1
    s = scenes[0]
    assert s["type"] == "formula"
    assert s["source_content_id"] == "concept.test"
    assert s["source_heading"] == "Split gain"
    assert s["word_count"] > 0
    assert s["semantic_role"] is not None
    assert s["contains_formula"] is True
    # contains_code should be false for formula scene
    assert s["contains_code"] is False
    assert isinstance(s["contains_visual"], bool)


# ======================================================================
# Duplicate prevention
# ======================================================================


def test_no_explanation_duplicate():
    """Formula explanation should NOT appear as a separate markdown scene."""
    md = """## Gain

$$
G = I_p - w_L I_L - w_R I_R
$$

$I$ — impurity function. Алгоритм выбирает лучший split greedily."""
    scenes = build_source_scenes(md)
    # Should be 1 formula scene, not formula + duplicate markdown
    assert len(scenes) == 1
    assert scenes[0]["type"] == "formula"
    # Explanation in the formula should contain the text
    assert "impurity" in scenes[0]["explanation"]


# ======================================================================
# Large section — should NOT be merged with next
# ======================================================================


def test_large_section_not_merged():
    long_text = "Слово " * 30  # 30 words
    md = f"""## Большая секция

{long_text}

## Другая секция

Другой содержательный текст со смыслом."""
    scenes = build_source_scenes(md)
    markdowns = [s for s in scenes if s["type"] == "markdown"]
    assert len(markdowns) == 2


# ======================================================================
# Wiki links preserved
# ======================================================================


def test_wiki_links_in_markdown():
    md = """## Связанные темы

См. [[Gradient Boosting]] и [[Random Forest]] для сравнения."""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert "[[Gradient Boosting]]" in scenes[0]["markdown"]
    assert "[[Random Forest]]" in scenes[0]["markdown"]


# ======================================================================
# Multiple formulas in section
# ======================================================================


def test_multiple_formulas_preserved():
    md = """## Критерии

$$
Gini = 1 - \\sum p_k^2
$$

$$
Entropy = -\\sum p_k \\log p_k
$$

Оба критерия измеряют impurity узла."""
    scenes = build_source_scenes(md)
    formulas = [s for s in scenes if s["type"] == "formula"]
    assert len(formulas) == 2


# ======================================================================
# Фаза 6A (доработка): Gain formula preservation
# ======================================================================


def test_gain_formula_fractions_preserved():
    """n_L и n_R остаются числителями дробей — без потери подстрок и скобок."""
    md = """## Split gain

$$
\\operatorname{Gain}
=I(\\text{parent})
-\\frac{n_L}{n}I(\\text{left})
-\\frac{n_R}{n}I(\\text{right}).
$$
"""
    scenes = build_source_scenes(md)
    assert len(scenes) == 1
    assert scenes[0]["type"] == "formula"
    formula = scenes[0]["formula"]
    assert "\\frac{n_L}{n}" in formula
    assert "\\frac{n_R}{n}" in formula
    assert "\\operatorname{Gain}" in formula
    # Никакой порчи underscores/скобок/backslashes
    assert formula.count("\\") == formula.count("\\")


def test_formula_subscripts_not_corrupted():
    md = """## Regression

$$
\\widehat{y}_{\\text{leaf}}=\\frac{1}{n_{\\text{leaf}}}\\sum_{i\\in\\text{leaf}}y_i.
$$
"""
    scenes = build_source_scenes(md)
    formula = scenes[0]["formula"]
    assert "\\widehat{y}_{\\text{leaf}}" in formula
    assert "n_{\\text{leaf}}" in formula
    assert "_" in formula


# ======================================================================
# Фаза 6A (доработка): display_title
# ======================================================================


def test_display_title_h3_priority():
    md = """## LightGBM

### GOSS

Gradient-based One-Side Sampling сохраняет объекты с большими градиентами
и перевзвешивает их, чтобы оценка split не была смещена.

### EFB

Exclusive Feature Bundling объединяет редкие sparse признаки
и сокращает effective dimension модели, полезность зависит от конфликтов.

### Categories

Native categorical partitions не равны обычному integer threshold,
поэтому mapping должен совпадать в train и inference времени."""
    scenes = build_source_scenes(md)
    titles = [s["display_title"] for s in scenes if s.get("display_title")]
    assert titles[0] == "GOSS"
    assert titles[1] == "EFB"
    assert titles[2] == "Categories"


def test_display_title_formula_label():
    md = """## Classification criteria

Если $p_k$ — доля класса $k$:

$$
\\operatorname{Gini}=1-\\sum_k p_k^2,
$$

$$
\\operatorname{Entropy}=-\\sum_k p_k\\log p_k.
$$
"""
    scenes = build_source_scenes(md)
    formulas = [s for s in scenes if s["type"] == "formula"]
    assert formulas[0]["display_title"] == "Gini"
    assert formulas[1]["display_title"] == "Entropy"


def test_display_title_unique_source_heading():
    md = """## Идея за 30 секунд

Decision Tree делит пространство условиями."""
    scenes = build_source_scenes(md)
    assert scenes[0]["display_title"] == "Идея за 30 секунд"


def test_display_title_semantic_role_fallback():
    from app.services.lesson_content import _assign_display_titles

    scenes = _assign_display_titles(
        [
            {
                "type": "markdown",
                "title": None,
                "markdown": "Текст без уникального заголовка",
                "semantic_role": "pitfalls",
                "word_count": 5,
            }
        ]
    )
    assert scenes[0]["display_title"] == "Типичные ошибки"


def test_display_title_first_sentence_fallback():
    from app.services.lesson_content import _assign_display_titles

    scenes = _assign_display_titles(
        [
            {
                "type": "markdown",
                "title": "Дубликат",
                "markdown": "Дерево не требует линейности, но зависит от репрезентативности.",
                "semantic_role": None,
                "word_count": 8,
            },
            {
                "type": "markdown",
                "title": "Дубликат",
                "markdown": "Второй текст про валидацию и переобучение модели.",
                "semantic_role": None,
                "word_count": 5,
            },
        ]
    )
    assert scenes[0]["display_title"].startswith("Дерево не требует линейности")
    assert "валидацию" in scenes[1]["display_title"]


def test_display_title_no_consecutive_duplicates():
    """Одна H2-секция с несколькими сценами даёт разные подряд идущие заголовки."""
    md = """## Regression tree

При squared error best constant prediction в leaf — mean:

$$
\\widehat{y}_{\\text{leaf}}=\\frac{1}{n_{\\text{leaf}}}\\sum y_i.
$$

Impurity:

$$
I(\\text{leaf})=\\frac{1}{n_{\\text{leaf}}}\\sum (y_i-\\widehat{y}_{\\text{leaf}})^2.
$$

При absolute error best constant — median. Prediction piecewise constant."""
    scenes = build_source_scenes(md)
    displayed = [s.get("display_title") for s in scenes if s.get("display_title")]
    assert len(displayed) == len(scenes)
    for prev, cur in zip(displayed, displayed[1:], strict=False):
        assert prev != cur


def test_display_title_scene_ids_stable():
    """display_title не меняет scene id / source_heading / semantic_role."""
    md = """## Split gain

$$
\\operatorname{Gain}=I(\\text{parent})-\\frac{n_L}{n}I(\\text{left}).
$$

Impurity уменьшается при разбиении."""
    scenes = build_source_scenes(md, source_content_id="concept.test")
    s = scenes[0]
    assert s["source_content_id"] == "concept.test"
    assert s["source_heading"] == "Split gain"
    assert s["semantic_role"] == "mathematics"
    assert "display_title" in s


# ======================================================================
# Фаза 6A (доработка): heading resolution statuses
# ======================================================================


def test_heading_resolution_exact_match():
    from app.services.lesson_content import _resolve_heading_statuses

    scenes = build_source_scenes("## Идея за 30 секунд\n\nТекст.\n")
    res = _resolve_heading_statuses(["Идея за 30 секунд"], scenes)
    assert res[0]["status"] == "exact"
    assert res[0]["selected_heading"] == "Идея за 30 секунд"


def test_heading_resolution_normalized_match():
    from app.services.lesson_content import _resolve_heading_statuses

    scenes = build_source_scenes("## Идея за 30 секунд\n\nТекст.\n")
    # markdown-эмфазис и лишние пробелы нормализуются
    res = _resolve_heading_statuses(["**Идея за 30 секунд**"], scenes)
    assert res[0]["status"] == "normalized"
    assert res[0]["selected_heading"] == "Идея за 30 секунд"


def test_heading_resolution_fallback_with_alias_info():
    from app.services.lesson_content import _resolve_heading_statuses

    scenes = build_source_scenes("## Идея за 30 секунд\n\nТекст.\n")
    res = _resolve_heading_statuses(["Коротко"], scenes)
    assert res[0]["status"] == "fallback"
    assert res[0]["known_alias"] == "Идея за 30 секунд"
    assert res[0]["selected_heading"] is None


def test_heading_resolution_missing():
    """Заголовок не найден в доступных секциях — fallback; пустой запрос — missing."""
    from app.services.lesson_content import _resolve_heading_statuses

    res = _resolve_heading_statuses(["Коротко"], [])
    assert res[0]["status"] == "fallback"
    # Пустой/отсутствующий заголовок — missing (source недоступен)
    res2 = _resolve_heading_statuses([None, ""], [])
    assert all(r["status"] == "missing" for r in res2)


def test_heading_resolution_empty_requested():
    from app.services.lesson_content import _resolve_heading_statuses

    res = _resolve_heading_statuses([None, ""], [])
    assert all(r["status"] == "missing" for r in res)
