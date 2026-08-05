---
title: 07. Исключения и context manager
id: concept.python.07-iskliucheniia-i-context-manager
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
---

# 07. Исключения и context manager

## Зачем это нужно

Ошибки во время выполнения неизбежны: файл может отсутствовать, число — иметь неверный формат, API — не ответить. Исключения позволяют отделить нормальный сценарий от обработки ошибки. Context manager гарантирует освобождение ресурса даже при сбое.

## Что такое исключение

Исключение — объект, который прерывает обычный поток выполнения. Python поднимает его в месте ошибки и ищет подходящий `except` выше по стеку вызовов.

```python
def parse_age(text: str) -> int:
    return int(text)

parse_age("abc")  # ValueError
```

Traceback показывает цепочку вызовов. Читать его лучше снизу вверх: последняя строка содержит тип и сообщение ошибки, строки выше — путь до неё.

## `try`, `except`, `else`, `finally`

```python
def parse_positive(text: str) -> int:
    try:
        value = int(text)
    except ValueError as error:
        raise ValueError(f"Ожидалось целое число: {text!r}") from error
    else:
        if value <= 0:
            raise ValueError("Число должно быть положительным")
        return value
    finally:
        pass
```

- `try` содержит минимальный код, который может породить ожидаемую ошибку;
- `except` обрабатывает конкретный тип;
- `else` выполняется, если исключения не было;
- `finally` выполняется почти всегда и подходит для очистки.

Не помещайте половину программы в один `try`: иначе невозможно понять, какая операция сломалась.

## Ловить узкое исключение

Плохо:

```python
try:
    value = load_and_transform(path)
except Exception:
    return None
```

Так код скрывает ошибки программирования и возвращает правдоподобный `None`.

Лучше:

```python
try:
    text = path.read_text(encoding="utf-8")
except FileNotFoundError:
    raise DatasetNotFoundError(path)
```

Голый `except:` ловит также `KeyboardInterrupt` и `SystemExit`; почти всегда он неуместен.

## Создание собственных исключений

```python
class DatasetError(Exception):
    """Базовая ошибка слоя данных."""

class InvalidDatasetError(DatasetError, ValueError):
    """Датасет нарушает проверяемый контракт."""
```

Собственный тип полезен, когда вызывающий код должен отличить доменную ошибку от технической. Сообщение должно объяснять, что нарушено и где искать причину.

## Повторное возбуждение и chaining

```python
try:
    value = int(raw_value)
except ValueError as error:
    raise InvalidDatasetError(
        f"Колонка age содержит неверное значение {raw_value!r}"
    ) from error
```

`from error` сохраняет исходную причину. `raise` без аргументов внутри `except` повторно поднимает текущее исключение.

## Когда не нужно исключение

Ожидаемая ветка бизнес-логики часто лучше выражается обычным условием:

```python
if user_id not in users:
    return None
```

Исключение уместно, когда контракт нарушен или продолжать выполнение небезопасно.

## Context manager и `with`

```python
from pathlib import Path

def first_line(path: Path) -> str:
    with path.open(encoding="utf-8") as stream:
        return stream.readline().rstrip("\n")
```

`with` вызывает `__enter__`, затем гарантированно вызывает `__exit__`. Файл закроется и при `return`, и при исключении.

## Собственный context manager

```python
class ManagedResource:
    def __enter__(self) -> "ManagedResource":
        self.opened = True
        return self

    def __exit__(self, exc_type, exc, traceback) -> bool:
        self.opened = False
        return False
```

Возврат `False` означает: не подавлять исключение. Возврат `True` скрывает его, поэтому применять это следует осознанно.

Функциональный вариант:

```python
from collections.abc import Iterator
from contextlib import contextmanager

@contextmanager
def temporary_mode(config: dict[str, bool]) -> Iterator[None]:
    previous = config.get("training", False)
    config["training"] = True
    try:
        yield
    finally:
        config["training"] = previous
```

## Практика в Data Science

Context manager полезен для:

- файлов и временных директорий;
- соединений и транзакций;
- блокировок;
- временного изменения конфигурации;
- измерения времени;
- управления режимом эксперимента.

Исключение не должно незаметно превращать повреждённые данные в пустой DataFrame. Лучше остановиться с понятной ошибкой, чем обучить модель на неверной выборке.

## Частые ошибки

- `except Exception: pass`;
- логировать ошибку и продолжать с некорректным состоянием;
- использовать `finally` для логики, которая может сама скрыть исходную ошибку;
- возвращать из `finally`;
- подавлять исключение в `__exit__` без причины;
- создавать десятки классов исключений без различимого поведения.

## Ответ интервьюеру

Исключение отделяет нормальный путь от аварийного и передаётся вверх по стеку, пока не встретится подходящий обработчик. Я ловлю самый узкий ожидаемый тип, добавляю контекст через `raise ... from ...` и не скрываю неожиданные ошибки. `with` использует context manager и гарантирует парный вход и выход, поэтому подходит для файлов, транзакций и временных ресурсов.

## Связи

- [[12_Модули_файлы_pathlib_и_окружения]] — работа с файлами и путями.
- [[11_Typing_Testing_Code_Quality]] — тестирование ошибок и контрактов.
