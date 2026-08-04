---
title: Анализ ошибок и интерпретация регрессии
aliases:
  - Regression Error Analysis
  - Диагностика регрессии
tags:
  - ml
  - regression
  - diagnostics
  - oof
  - interpretation
type: practice
area: ml
status: active
rag: exclude
id: practice.ml.analiz-oshibok-i-interpretatsiia-regressii
schema_version: 2
language: ru
app: source
---
# Анализ ошибок и интерпретация регрессии

> [!summary] Главная идея
> **Сначала получить честные OOF-прогнозы, затем исследовать размер, направление и сегменты ошибок. Final test для поиска улучшений не использовать.**

Эту заметку открывают после выбора модели по CV и до финального test.

## Навигация

- Основной маршрут: [[Universal_Regression_Pipeline]]
- Подготовка признаков: [[Tabular_ML_Preprocessing]]
- Методы для найденных проблем: [[Regression_Optional_Methods]]

---

## 1. Зачем нужны OOF-прогнозы

Средняя CV-метрика говорит, насколько хорошо модель работает в целом. OOF-прогнозы дают честный прогноз для каждой development-строки:

- строка попадает в validation одного фолда;
- модель для этого фолда не видит строку при обучении;
- прогноз возвращается на исходный индекс;
- после всех фолдов можно анализировать ошибки по объектам и сегментам.

```python
from sklearn.model_selection import cross_val_predict

oof_pred = cross_val_predict(
    estimator=best_pipeline,
    X=X_dev,
    y=y_dev,
    cv=cv,
    method="predict",
    n_jobs=-1,
)
```

> [!note] CV mean и общая OOF-метрика
> Они могут немного отличаться: CV сначала считает метрику на каждом фолде и усредняет, а OOF-метрика считается один раз по всем собранным прогнозам.

---

## 2. Собрать единый отчёт по ошибкам

```python
import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

print(
    "OOF MAE:",
    mean_absolute_error(y_dev, oof_pred),
)

print(
    "OOF RMSE:",
    np.sqrt(
        mean_squared_error(y_dev, oof_pred)
    ),
)

print(
    "OOF R²:",
    r2_score(y_dev, oof_pred),
)
```

```python
error_df = X_dev.copy()

error_df["actual"] = y_dev
error_df["predicted"] = oof_pred

error_df["residual"] = (
    error_df["actual"]
    - error_df["predicted"]
)

error_df["absolute_error"] = (
    error_df["residual"].abs()
)

error_df["percentage_error"] = np.where(
    error_df["actual"].ne(0),
    (
        error_df["absolute_error"]
        / error_df["actual"].abs()
        * 100
    ),
    np.nan,
)
```

### Знак residual

Используется определение:

```text
residual = actual - predicted
```

- `residual > 0` — модель занизила target;
- `residual < 0` — модель завысила target;
- `residual ≈ 0` — прогноз близок к факту.

---

## 3. Минимальная диагностика

Для обычной задачи достаточно четырёх проверок.

### 3.1 Самые большие ошибки

```python
display(
    error_df
    .sort_values(
        "absolute_error",
        ascending=False,
    )
    .head(10)
)
```

Спросить:

1. Это ошибка данных или реальный редкий объект?
2. Были ли признаки объекта доступны модели?
3. Есть ли похожие объекты в development data?
4. Связаны ли ошибки с особым типом события?

> [!danger] Нельзя удалять строку только из-за большой ошибки
> Иначе модель сама определяет, какие наблюдения считать «неудобными». Удаление допустимо при независимом правиле качества данных или подтверждённой ошибке источника.

### 3.2 Среднее направление ошибки

```python
print(
    "Mean residual:",
    error_df["residual"].mean(),
)
```

Среднее около нуля не гарантирует отсутствия проблемы: завышение одного сегмента может компенсировать занижение другого.

### 3.3 Факт против прогноза

```python
import matplotlib.pyplot as plt

plt.figure(figsize=(7, 7))

plt.scatter(
    error_df["actual"],
    error_df["predicted"],
    alpha=0.5,
)

limits = [
    min(
        error_df["actual"].min(),
        error_df["predicted"].min(),
    ),
    max(
        error_df["actual"].max(),
        error_df["predicted"].max(),
    ),
]

plt.plot(
    limits,
    limits,
    linestyle="--",
    color="black",
)

plt.xlabel("Actual")
plt.ylabel("Predicted")
plt.title("OOF: actual vs predicted")
plt.grid(alpha=0.3)
plt.show()
```

Идеальные прогнозы лежат на диагонали.

### 3.4 Residual против прогноза

```python
plt.figure(figsize=(8, 5))

plt.scatter(
    error_df["predicted"],
    error_df["residual"],
    alpha=0.5,
)

plt.axhline(
    0,
    linestyle="--",
    color="black",
)

plt.xlabel("Predicted")
plt.ylabel("Residual = actual - predicted")
plt.title("OOF residuals")
plt.grid(alpha=0.3)
plt.show()
```

Искать:

- систематический наклон;
- расширение облака при больших прогнозах;
- отдельные кластеры;
- редкие огромные ошибки.

---

## 4. Анализ по диапазонам target

Квантили создают сегменты примерно одинакового размера:

```python
error_df["target_segment"] = pd.qcut(
    error_df["actual"],
    q=5,
    duplicates="drop",
)
```

```python
target_report = (
    error_df
    .groupby(
        "target_segment",
        observed=True,
    )
    .agg(
        objects=("actual", "size"),
        actual_mean=("actual", "mean"),
        predicted_mean=("predicted", "mean"),
        mae=("absolute_error", "mean"),
        rmse=(
            "residual",
            lambda values: np.sqrt(
                np.mean(values ** 2)
            ),
        ),
        bias=("residual", "mean"),
        percentage_error=(
            "percentage_error",
            "mean",
        ),
    )
    .reset_index()
)

display(target_report)
```

Интерпретация `bias`:

- положительный — модель в среднем занижает target;
- отрицательный — модель в среднем завышает target;
- около нуля — выраженного направления нет.

Частый паттерн — регрессия к среднему: низкие значения завышаются, высокие занижаются.

> [!note] Сегмент target — только для анализа
> Фактическое значение target неизвестно в момент будущего прогноза, поэтому такой сегмент нельзя использовать как входной признак.

---

## 5. Анализ по бизнес-сегментам

Пример для категории `region`:

```python
segment_report = (
    error_df
    .groupby(
        "region",
        dropna=False,
    )
    .agg(
        objects=("actual", "size"),
        actual_mean=("actual", "mean"),
        mae=("absolute_error", "mean"),
        bias=("residual", "mean"),
    )
    .query("objects >= 30")
    .sort_values("mae", ascending=False)
    .reset_index()
)

display(segment_report)
```

Всегда показывать размер сегмента. Большая ошибка среди трёх объектов ещё не доказывает систематическую проблему.

Полезные сегменты:

- регион;
- тип продукта;
- канал;
- новый/старый объект;
- календарный период;
- диапазон важного числового признака;
- группа, по которой выполнялся split.

Не перебирать сотни сегментов без гипотезы: случайно «плохая» группа найдётся почти всегда.

---

## 6. Что означает разница MAE и RMSE

```text
RMSE заметно больше MAE
```

Обычно это означает, что есть небольшое число крупных ошибок.

```text
RMSE близко к MAE
```

Ошибки более равномерны.

Это не автоматическое основание удалять выбросы. Сначала открыть самые большие ошибки и проверить их смысл.

---

## 7. Feature importance

### Главные ограничения

- важность не означает причинность;
- коррелирующие признаки делят или замещают важность;
- встроенная важность разных моделей считается по-разному;
- важный признак может оказаться утечкой;
- важность не показывает направление эффекта.

### Permutation importance на отдельном validation-фолде

```python
from sklearn.base import clone
from sklearn.inspection import permutation_importance

train_index, valid_index = next(
    cv.split(X_dev, y_dev)
)

interpretation_model = clone(best_pipeline)

interpretation_model.fit(
    X_dev.iloc[train_index],
    y_dev.iloc[train_index],
)

importance = permutation_importance(
    estimator=interpretation_model,
    X=X_dev.iloc[valid_index],
    y=y_dev.iloc[valid_index],
    scoring="neg_root_mean_squared_error",
    n_repeats=10,
    random_state=42,
    n_jobs=-1,
)

importance_df = pd.DataFrame({
    "feature": X_dev.columns,
    "importance_mean": (
        importance.importances_mean
    ),
    "importance_std": (
        importance.importances_std
    ),
}).sort_values(
    "importance_mean",
    ascending=False,
)

display(importance_df.head(15))
```

Положительная важность означает: при перемешивании признака качество ухудшилось. Большой `importance_std` означает нестабильность оценки.

> [!warning] Не использовать final test как рабочую панель
> Если важности на test приводят к изменению модели, test уже участвует в подборе. Для итераций использовать development-фолд или вложенную CV.

---

## 8. OOF для временных данных

`TimeSeriesSplit` не выдаёт validation-прогноз для первых обучающих наблюдений. Поэтому OOF собирается вручную:

```python
oof_pred_time = pd.Series(
    index=y_dev.index,
    dtype=float,
)

for train_index, valid_index in cv.split(X_dev):
    fold_model = clone(best_pipeline)

    fold_model.fit(
        X_dev.iloc[train_index],
        y_dev.iloc[train_index],
    )

    oof_pred_time.iloc[valid_index] = (
        fold_model.predict(
            X_dev.iloc[valid_index]
        )
    )

valid_mask = oof_pred_time.notna()

time_rmse = np.sqrt(
    mean_squared_error(
        y_dev.loc[valid_mask],
        oof_pred_time.loc[valid_mask],
    )
)
```

Первые наблюдения без прогноза не включаются в OOF-метрику.

---

## 9. Когда переходить к дополнительным методам

| Диагноз | Следующее действие |
|---|---|
| Несколько подтверждённых ошибок данных | исправить источник или применить заранее определённое правило |
| Реальные экстремальные значения сильно влияют на результат | проверить robust loss |
| Ошибка растёт вместе с target, важны проценты | проверить log-target |
| Модель недообучается во всех сегментах | более гибкая модель или признаки |
| Модель отлично работает на train и хуже на CV | регуляризация, ограничение сложности, больше данных |
| Слаб только один важный сегмент | проверить данные и признаки этого сегмента |
| Test намного хуже OOF | проверить drift и схему split, не настраивать по test |

Код находится в [[Regression_Optional_Methods]].

---

## 10. Шаблон вывода

> По OOF-прогнозам модель получила `MAE = ...`, `RMSE = ...`, `R² = ...`. RMSE выше MAE на `...`, что указывает на наличие крупных ошибок. Средний residual равен `...`. Модель систематически завышает/занижает target в сегменте `...`; в остальных крупных сегментах bias близок к нулю. Наиболее важные признаки по permutation importance — `...`, однако их важность не интерпретируется как причинный эффект.

---

## Короткий чек-лист

- [ ] Прогнозы для анализа получены OOF-способом.
- [ ] Зафиксировано определение и знак residual.
- [ ] Проверены самые большие абсолютные ошибки.
- [ ] Построены actual vs predicted и residual plot.
- [ ] Проверены диапазоны target.
- [ ] Проверены 1–3 важных бизнес-сегмента с указанием размера.
- [ ] Строки не удалялись только из-за большой ошибки.
- [ ] Feature importance не названа причинностью.
- [ ] Final test не использовался для поиска улучшений.
