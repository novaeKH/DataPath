---
title: "Типизация, тестирование и качество Python-кода"
id: concept.datapath-v2.007
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 7
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Типизация и тестирование

Data Scientist часто начинает в notebook:
```text
исследование → быстрый код
```

Но когда код становится повторяемым pipeline, нужны:
- type hints;
- tests;
- formatter/linter;
- явные boundaries.

Это не бюрократия. Это способ быстрее замечать ошибки.

## 1. Type hints

```python
def mean(values: list[float]) -> float:
    return sum(values) / len(values)
```

Python runtime обычно не запрещает передать неправильный type только из-за annotation.

Type hints предназначены для:
- IDE;
- static checker;
- documentation;
- readers.

## 2. Optional

```python
def find_user(...) -> User | None:
    ...
```

Теперь caller обязан подумать о `None`.

## 3. `Any`

```python
from typing import Any
```

`Any` выключает большую часть type checking для значения.

Полезно на boundary динамической библиотеки, но не надо ставить `Any` везде.

## 4. `Protocol`

Можно описывать behavior, а не concrete class:

```python
from typing import Protocol

class Predictor(Protocol):
    def predict(self, X): ...
```

Это type-level duck typing.

## 5. Dataclass config

```python
@dataclass
class TrainConfig:
    lr: float
    epochs: int
```

Typed config лучше unstructured dict:
```python
config["epohcs"]  # typo only at runtime
```

## 6. Unit test

Проверяет маленькую unit behavior.

```python
def test_ratio():
    assert ratio(10, 2) == 5
```

Good tests:
- deterministic;
- fast;
- focus one behavior.

## 7. pytest mental model

```python
def test_clean_age():
    ...
```

`pytest` discovers tests by conventions and gives readable failures.

## 8. Parametrization

```python
import pytest

@pytest.mark.parametrize(
    "x, expected",
    [(1, 1), (2, 4), (3, 9)],
)
def test_square(x, expected):
    assert square(x) == expected
```

Avoid duplicated test functions.

## 9. Exceptions test

```python
with pytest.raises(ValueError):
    parse_age("-5")
```

Failure behavior is part of contract.

## 10. Floating-point comparisons

Плохо:
```python
assert result == 0.1 + 0.2
```

Use tolerance:
```python
assert result == pytest.approx(0.3)
```

or NumPy testing helpers.

## 11. ML feature tests

Useful:
- no target leakage column;
- output schema stable;
- no negative impossible values;
- split disjoint;
- transformation deterministic.

Not every ML issue unit-testable, but many pipeline bugs are.

## 12. Integration test

Checks components together:

```text
load tiny data
→ feature pipeline
→ model.predict
```

Different from unit test.

## 13. Golden test

Known input:
```text
prediction approximately fixed
```

Useful after packaging/library changes.

## 14. Mocking caution

Mocks useful for network/API dependencies.

But too much mocking can test fake system rather than real code.

Prefer small real components when cheap.

## 15. Formatting

Tools like `black`/`ruff format` make style automatic.

Don't spend review time arguing manually about spaces.

## 16. Linting

`ruff` can detect:
- unused imports;
- undefined names;
- many style/bug patterns.

Static checks are cheap.

## 17. Complexity vs readability

One-liner:
```python
...
```
is not automatically better than clear loop.

Interview and production code should expose intent.

## 18. Function size

A function doing:
```text
read CSV
clean
train
plot
save
email
```
is hard to test.

Separate responsibilities:
```text
load_data
build_features
train
evaluate
save_artifact
```

## 19. Documentation

Docstring useful when function behavior not obvious:

```python
def split_by_time(...):
    """Split observations before cutoff into train and later into validation."""
```

Don't write docstring repeating `x: input x`.

## 20. Reproducibility test

A training pipeline can have smoke test on tiny synthetic dataset:
```text
runs without crash
metric finite
artifact saved
```

This catches broken interfaces quickly.

## Визуализация DataPath

Test pyramid:
```text
many fast unit
some integration
few full end-to-end
```

## Типичные ошибки

- annotations but no checker;
- `Any` everywhere;
- only happy-path tests;
- exact float equality;
- slow full-training test for every function;
- giant function impossible to isolate.

## Проверка понимания

1. Do annotations enforce runtime types?
2. Why `T | None` useful?
3. Unit vs integration?
4. Why parametrization?
5. How test float?
6. What should feature pipeline test?
7. Why formatter/linter useful?

## Мини-практика

Для функции `split_by_time(df, cutoff)` придумайте:
- 3 unit tests;
- 1 integration test with model pipeline.

## Итог

Quality layer:
```text
types
→ small functions
→ fast tests
→ static checks
→ integration smoke
```

## Куда дальше

Последний урок Python Core: память, reference counting, garbage collection и GIL — ровно на уровне, нужном DS/ML Engineer.
