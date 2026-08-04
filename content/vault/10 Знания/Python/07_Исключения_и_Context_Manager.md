---
title: "07. Исключения и context manager"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.07-iskliucheniia-i-context-manager
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 07. Исключения и context manager

[[06_OOP_и_магические_методы|← Предыдущий]] · [[08_Декораторы_и_замыкания|Следующий →]]

## Полная конструкция

```python
def parse_positive(text: str) -> int:
    try:
        value = int(text)
    except ValueError as error:
        raise ValueError(f"not an integer: {text!r}") from error
    else:
        if value <= 0:
            raise ValueError("value must be positive")
        return value
    finally:
        pass  # выполняется при успехе, ошибке и return
```

- `except` обрабатывает выбранные ошибки из `try`;
- `else` выполняется, если в `try` не было исключения;
- `finally` выполняется почти всегда и нужен для освобождения ресурса;
- `raise ... from error` сохраняет причинную цепочку.

Не используйте голый `except:`: он ловит даже `KeyboardInterrupt` и `SystemExit`. Ловите самое узкое ожидаемое исключение. Не оборачивайте слишком большой блок `try`.

## Собственное исключение

```python
class InvalidDatasetError(ValueError):
    """Датасет нарушает проверяемый контракт."""
```

Пользовательское исключение полезно, если вызывающий код должен отличить доменную ошибку от технической.

## `with` и context manager

Context manager гарантирует парный вход/выход:

```python
from pathlib import Path

def first_line(path: Path) -> str:
    with path.open(encoding="utf-8") as stream:
        return stream.readline().rstrip("\n")
```

Даже при исключении вызывается `stream.__exit__`.

```python
class ManagedResource:
    def __enter__(self) -> "ManagedResource":
        self.opened = True
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> bool:
        self.opened = False
        return False
```

`True` из `__exit__` подавляет исключение — используйте это только осознанно.

### Функциональный вариант

```python
from collections.abc import Iterator
from contextlib import contextmanager

@contextmanager
def temporary_mode(config: dict[str, bool]) -> Iterator[None]:
    old = config.get("training", False)
    config["training"] = True
    try:
        yield
    finally:
        config["training"] = old
```

## В ML-пайплайне

Context manager подходит для файлов, транзакций, временных каталогов, lock, режима логирования. Исключение не должно молча превращать повреждённые данные в правдоподобный результат.

## Мини-контрольная

1. Когда выполняется `else`?
2. Для чего `finally`?
3. Почему `except Exception` лучше голого `except`, но всё ещё часто слишком широк?
4. Что означает `False` из `__exit__`?
5. Зачем `raise ... from ...`?

<details><summary>Ответы</summary>
1. Если `try` завершился без исключения. 2. Гарантированная очистка. 3. Ловит много неожиданных программных ошибок. 4. Не подавлять исключение. 5. Сохранить причину.
</details>
