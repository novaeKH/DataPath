---
title: 10. Python для Data Science
id: concept.python.10-python-dlia-data-science
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
- data-science
---

# 10. Python для Data Science

## Главная идея

В Data Science Python связывает несколько уровней: чтение данных, преобразование таблиц, численные вычисления, обучение модели, оценку и воспроизводимый эксперимент. Хороший код не обязан быть сложным: он должен явно показывать контракт данных и не скрывать leakage.

## Базовый путь данных

```text
источник → чтение → проверка схемы → очистка → признаки → split
→ fit preprocessing → fit model → оценка → артефакты
```

Каждый этап лучше выражать отдельной функцией с понятными входами и выходами.

```python
from pathlib import Path
import pandas as pd


def load_events(path: Path) -> pd.DataFrame:
    frame = pd.read_parquet(path)
    required = {"user_id", "event_time", "target"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Не хватает колонок: {sorted(missing)}")
    return frame
```

## Коллекции стандартной библиотеки

### Подсчёт: `Counter`

```python
from collections import Counter

counts = Counter(labels)
```

Нужно понимать базовый dict-шаблон, но в рабочем коде `Counter` точнее выражает намерение.

### Группировка: `defaultdict`

```python
from collections import defaultdict

rows_by_group: defaultdict[str, list[int]] = defaultdict(list)
for index, group in enumerate(groups):
    rows_by_group[group].append(index)
```

### Очередь и окно: `deque`

```python
from collections import deque

window: deque[float] = deque(maxlen=100)
```

`deque.popleft()` имеет амортизированную сложность `O(1)`, тогда как удаление первого элемента списка требует сдвига.

## Чистые преобразования

Функция легче тестируется, если не меняет скрытое внешнее состояние:

```python
def add_ratio(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["ratio"] = result["income"] / result["debt"].clip(lower=1)
    return result
```

Не обязательно копировать DataFrame на каждом шаге. Важно, чтобы политика изменения была ясной и не возникало неожиданного side effect.

## Работа с путями

```python
from pathlib import Path

DATA_DIR = Path("data")
train_path = DATA_DIR / "train.parquet"
```

`Path` переносим между ОС, умеет проверять существование, создавать каталоги и читать файлы без ручной сборки строк.

## Воспроизводимость

Seed нужен не «для магии», а чтобы повторить конкретный эксперимент:

```python
import random
import numpy as np

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
```

Seed не гарантирует полную детерминированность всех GPU-операций или распределённых вычислений. Нужно также фиксировать данные, версии пакетов, split и конфигурацию.

## Конфигурация вместо магических чисел

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class TrainConfig:
    seed: int = 42
    test_size: float = 0.2
    max_depth: int = 6
```

Конфигурация делает эксперимент читаемым и сохраняемым. Не превращайте каждую константу в сложную систему настроек.

## Логирование

Для библиотечного или долгого кода используйте `logging`, а не десятки `print`:

```python
import logging

logger = logging.getLogger(__name__)
logger.info("Loaded %d rows", len(frame))
```

Лог должен отвечать на вопросы: что запущено, на каких данных, сколько объектов, сколько времени, где сохранён результат.

## Векторизация и границы Python

Цикл Python хорош для логики по небольшому числу объектов. Для миллионов чисел предпочитайте NumPy/pandas operations, которые выполняются в оптимизированном коде.

Плохо:

```python
frame["double"] = [value * 2 for value in frame["value"]]
```

Лучше:

```python
frame["double"] = frame["value"] * 2
```

Но «vectorized» не всегда значит экономно: временные массивы и `apply(axis=1)` могут быть дорогими. Профилируйте.

## Ошибки данных должны быть явными

Проверяйте:

- обязательные колонки;
- типы;
- уникальность ключа;
- допустимый диапазон;
- долю пропусков;
- порядок времени;
- отсутствие пересечения групп между split.

```python
assert frame["user_id"].notna().all()
assert frame["event_time"].is_monotonic_increasing
```

Для production лучше поднимать информативное исключение, а не полагаться только на `assert`, который может быть отключён.

## Организация проекта

Минимальная структура:

```text
project/
  pyproject.toml
  src/project/
    data.py
    features.py
    train.py
    evaluate.py
  tests/
  notebooks/
  configs/
  README.md
```

Notebook полезен для исследования. Повторяемую логику переносите в функции и модули, чтобы её можно было тестировать и запускать без ручного порядка ячеек.

## Частые ошибки

- огромный notebook как единственный источник логики;
- preprocessing до split;
- глобальные переменные с данными;
- неявное изменение DataFrame;
- `except Exception: return empty_frame`;
- путаница между списком, Series и ndarray;
- циклы по строкам там, где есть векторная операция;
- отсутствие сохранённой конфигурации эксперимента.

## Связи

- [[NumPy Foundations]] — массивы и векторизация.
- [[pandas Foundations and Selection]] — табличная работа.
- [[Exploratory Data Analysis Workflow]] — исследование до модели.
- [[sklearn End-to-End Classification — Practice]] — полный pipeline.
