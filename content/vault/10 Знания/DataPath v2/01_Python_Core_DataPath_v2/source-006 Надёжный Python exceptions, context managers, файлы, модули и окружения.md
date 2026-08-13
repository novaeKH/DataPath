---
title: "Надёжный Python: exceptions, context managers, файлы, модули и окружения"
id: concept.datapath-v2.006
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 6
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Надёжный Python

ML-скрипт падает не только из-за плохой модели.

Он может:
- не найти файл;
- получить неправильный JSON;
- оставить файл открытым;
- проглотить exception;
- импортировать не ту версию module.

Надёжность начинается с базового Python.

## 1. Exception — сигнал о невозможности продолжить обычный путь

```python
int("abc")
# ValueError
```

Python прекращает normal control flow и ищет handler.

## 2. `try/except`

```python
try:
    value = int(raw)
except ValueError:
    value = None
```

Ловите конкретное exception.

Плохо:

```python
except Exception:
    pass
```

Вы потеряете реальные bugs.

## 3. `else` и `finally`

```python
try:
    data = parse()
except ValueError:
    ...
else:
    use(data)
finally:
    cleanup()
```

- `else` — если exception не было;
- `finally` — выполняется при выходе из try независимо от success/failure.

## 4. `raise`

```python
if age < 0:
    raise ValueError("age must be non-negative")
```

Создавайте ранний понятный failure вместо silent corrupted data.

## 5. Exception chaining

```python
try:
    ...
except KeyError as exc:
    raise ConfigError("missing field") from exc
```

Сохраняет original cause.

## 6. Context manager

```python
with open("data.txt") as f:
    text = f.read()
```

После block файл закрывается даже при exception.

Protocol:
```text
__enter__
__exit__
```

## 7. Свой context manager

```python
from contextlib import contextmanager

@contextmanager
def timer():
    ...
    yield
    ...
```

Полезен для resources:
- files;
- transactions;
- locks;
- temporary settings.

## 8. Paths

Используйте `pathlib`:

```python
from pathlib import Path

path = Path("data") / "train.csv"
```

Лучше manual string concat:
```python
"data/" + filename
```

`Path` понятнее и portable.

## 9. Encoding

Явно:

```python
path.read_text(encoding="utf-8")
```

Cross-platform data projects часто ломаются именно на encoding.

## 10. JSON

```python
import json

data = json.loads(text)
```

JSON:
- interoperability format;
- не сохраняет arbitrary Python objects.

Для config он безопаснее pickle-like artifact.

## 11. Modules

Файл:
```text
features.py
```

можно импортировать:
```python
from features import build_features
```

Module code executes on first import in process and result caches in `sys.modules`.

## 12. `if __name__ == "__main__"`

```python
def main():
    ...

if __name__ == "__main__":
    main()
```

При запуске file напрямую `__name__ == "__main__"`.

При import — нет.

Это отделяет reusable code от script entrypoint.

## 13. Packages

Directory with Python package structure allows:
```text
project/
  src/
    mypkg/
      __init__.py
      features.py
```

Avoid хаотичный notebook-only import structure.

## 14. Virtual environments

Project dependencies should not share one global Python environment.

Use:
```text
venv
conda
uv
poetry
```
depending workflow.

Core goal:
> isolated reproducible dependency environment.

## 15. Dependency pinning

```text
pandas>=...
```
может install future incompatible version.

For reproducibility use constraints/lock strategy.

Do not confuse:
- isolated environment;
- reproducibly pinned environment.

Both matter.

## 16. Environment variables

Secrets/config:
```python
import os
api_key = os.getenv("API_KEY")
```

Do not commit secrets in source code.

For local development `.env` may help, but `.env` with secrets should not be committed.

## 17. Logging instead of `print`

```python
import logging

logger = logging.getLogger(__name__)
logger.info("loaded %d rows", n)
```

Logging supports levels/handlers/structured systems.

Notebook exploratory `print` fine; service code needs logging.

## 18. Assertions

```python
assert len(X) == len(y)
```

Useful internal invariants during development.

But don't use `assert` for user input/business validation because optimized Python can remove assertions.

## 19. Fail fast

Good pipeline:
```text
validate schema
→ fail with clear error
```

Bad:
```text
continue with broken data
→ obscure error 20 steps later
```

## Визуализация DataPath

Exception flow graph and `with` resource timeline.

## Типичные ошибки

- bare `except`;
- swallow exception;
- no encoding;
- global Python env;
- secrets in repository;
- `assert` as external validation;
- script executing training on import.

## Проверка понимания

1. Why catch specific exceptions?
2. `finally`?
3. What does `with` guarantee?
4. Why `Path`?
5. What does `__main__` guard do?
6. Why virtual env?
7. Why env vars for secrets?
8. When logging better than print?

## Мини-практика

Напишите функцию:
```python
load_config(path)
```
которая:
- читает UTF-8 JSON;
- выдаёт clear error при missing file;
- проверяет наличие key `model_name`.

## Итог

Надёжный Python:
```text
явные ошибки
→ controlled resources
→ portable paths
→ modular code
→ isolated environment
```

## Куда дальше

Следующий урок — типизация, тестирование и качество кода: как уменьшать число ошибок ещё до запуска модели.
