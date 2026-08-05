---
title: 11. Typing, testing и качество кода
id: concept.python.11-typing-testing-i-kachestvo-koda
type: concept
area: python
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
source: Python_Interview_Preparation
tags:
- python/core
- interview/python
- testing
---

# 11. Typing, testing и качество кода

## Зачем это Data Scientist

Модель может быть математически правильной, но pipeline сломается из-за неверной колонки, формы массива или порядка аргументов. Типы, тесты и статические проверки уменьшают число таких ошибок и делают эксперимент воспроизводимым.

## Аннотации типов

```python
from collections.abc import Sequence


def mean(values: Sequence[float]) -> float:
    if not values:
        raise ValueError("values не должен быть пустым")
    return sum(values) / len(values)
```

Аннотации не проверяются Python автоматически. Их читают IDE, `mypy`, `pyright` и люди.

### Основные формы

```python
def find_user(user_id: int) -> str | None: ...
def load_rows(paths: list[str]) -> list[dict[str, object]]: ...
def normalize(values: tuple[float, ...]) -> tuple[float, ...]: ...
```

Используйте абстрактный тип, если функции не нужен конкретный контейнер: `Iterable`, `Sequence`, `Mapping`.

## `TypedDict`, dataclass и Protocol

```python
from typing import TypedDict

class UserRow(TypedDict):
    user_id: int
    age: int
    target: int
```

`TypedDict` описывает словарь фиксированной формы.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Metrics:
    roc_auc: float
    pr_auc: float
```

Dataclass подходит для структурированных объектов. `Protocol` задаёт поведение без жёсткого наследования.

## Ограничения типов для данных

Обычный `list[float]` не кодирует shape. Для NumPy/PyTorch можно использовать специализированные аннотации, но они не заменяют runtime-проверки формы и dtype.

```python
def check_binary_target(y) -> None:
    unique = set(y)
    if not unique <= {0, 1}:
        raise ValueError(f"Ожидались 0/1, получено: {sorted(unique)}")
```

## Что тестировать

Тест должен проверять контракт и важное поведение, а не внутренние строки реализации.

```python
def test_parse_positive_rejects_zero() -> None:
    with pytest.raises(ValueError, match="положительным"):
        parse_positive("0")
```

Полезные уровни:

- unit-тест одной функции;
- integration-тест связки компонентов;
- smoke-тест основного сценария;
- data contract тест схемы и диапазонов;
- regression-тест на уже исправленную ошибку.

## Arrange–Act–Assert

```python
def test_group_counts() -> None:
    rows = ["a", "b", "a"]          # Arrange
    result = count_labels(rows)      # Act
    assert result == {"a": 2, "b": 1}  # Assert
```

Один тест обычно проверяет одну идею.

## Параметризация

```python
import pytest

@pytest.mark.parametrize(
    ("text", "expected"),
    [("1", 1), ("10", 10), (" 7 ", 7)],
)
def test_parse_integer(text: str, expected: int) -> None:
    assert int(text) == expected
```

## Тестирование ML-кода

Не проверяйте точное качество модели на каждом запуске, если алгоритм недетерминирован. Лучше тестировать инварианты:

- pipeline обучается на маленьких данных;
- число predictions равно числу объектов;
- probabilities лежат в `[0, 1]`;
- preprocessing не fit на validation;
- train/test группы не пересекаются;
- сериализованная модель даёт тот же результат;
- метрика на простом вручную проверяемом примере корректна.

## Fixtures и mocks

Fixture создаёт повторяемую подготовку. Mock нужен на границе с внешней системой, но не должен заменять всю реальную логику. Для работы с файлами часто лучше временная директория `tmp_path`, чем сложный mock `Path`.

## Линтер и форматтер

- formatter делает стиль единообразным;
- linter ловит подозрительные конструкции;
- type checker проверяет совместимость типов;
- tests проверяют runtime-поведение.

Один инструмент не заменяет остальные.

## Читаемость

Хороший код:

- использует имена по смыслу;
- имеет короткие функции с одним уровнем абстракции;
- явно передаёт зависимости;
- отделяет I/O от преобразований;
- избегает скрытых side effects;
- документирует причину нестандартного решения.

Docstring нужен не каждой строке, а публичному контракту и нетривиальному поведению.

## Частые ошибки

- тип `Any` на всём пути;
- тесты только happy path;
- snapshot огромного DataFrame вместо проверки важных колонок;
- чрезмерный mock;
- тестировать приватные детали вместо результата;
- полагаться на seed как на единственную гарантию воспроизводимости;
- игнорировать warnings библиотек.

## Ответ интервьюеру

Типы документируют контракт и позволяют найти часть ошибок до запуска. Unit-тесты проверяют локальную логику, integration-тесты — взаимодействие частей, а data-contract тесты особенно важны для ML. Я стараюсь тестировать инварианты и границы, а не точное значение недетерминированной метрики, и использую formatter, linter и type checker как дополняющие инструменты.

## Связи

- [[07_Исключения_и_Context_Manager]] — тестирование ошибок.
- [[12_Модули_файлы_pathlib_и_окружения]] — структура проекта.
- [[Training Evaluation and Inference in PyTorch]] — тесты DL pipeline.
