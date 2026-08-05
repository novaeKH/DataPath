---
title: Matplotlib Figure Axes and Plot Design
id: concept.matplotlib.figure-axes-plot-design
type: concept
area: matplotlib
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Основы Matplotlib
- Figure Axes
tags:
- matplotlib/core
- data/visualization
---

# Matplotlib Figure, Axes and Plot Design

## Ментальная модель

`Figure` — весь холст, `Axes` — конкретная область с координатами и графиком. Большинство методов вызываются у `Axes`.

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 4.5))
ax.plot(x, y, label="validation")
ax.set(
    title="Validation metric by iteration",
    xlabel="Iteration",
    ylabel="PR-AUC",
)
ax.legend()
fig.tight_layout()
plt.show()
```

Object-oriented API удобнее глобального `plt.*`, особенно при нескольких графиках.

## Выбор типа графика

- line — изменение по упорядоченной оси, особенно время;
- scatter — связь двух числовых признаков;
- bar — сравнение категорий;
- histogram — распределение одного числового признака;
- box/violin — распределения по группам;
- heatmap — матрица, например confusion matrix;
- error bars — estimate с uncertainty.

Тип графика должен отвечать на вопрос, а не просто красиво выглядеть.

## Несколько Axes

```python
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].hist(train_scores, bins=30)
axes[1].hist(test_scores, bins=30)
```

Сравниваемые графики должны иметь совместимые оси и binning, иначе визуальное сравнение обманчиво.

## Подписи и единицы

График должен объяснять:

- что на x и y;
- единицы;
- период и выборку;
- что означает цвет;
- sample size, если он важен;
- uncertainty.

Не используйте легенду, если линию можно подписать напрямую.

## Масштаб

Обрезанная y-axis может усиливать небольшую разницу. Для bar chart ноль обычно важен. Для line chart диапазон может быть ограничен, но это нужно делать осознанно.

Log scale полезен для величин разных порядков:

```python
ax.set_yscale("log")
```

Нули и отрицательные значения требуют отдельной обработки.

## Цвет

Используйте цвет для смысла:

- один акцент для главного ряда;
- спокойный neutral для контекста;
- устойчивые semantic colors для success/warning/error;
- palette, различимую при color-vision deficiency.

Не кодируйте категорию только цветом: добавьте marker, line style или label.

## Аннотации

```python
ax.axvline(best_iteration, linestyle="--", linewidth=1)
ax.annotate(
    "best validation",
    xy=(best_iteration, best_score),
    xytext=(best_iteration + 10, best_score - 0.02),
    arrowprops={"arrowstyle": "->"},
)
```

Аннотация должна выделять важное, а не дублировать каждую точку.

## Layout и экспорт

```python
fig.savefig("metric.png", dpi=160, bbox_inches="tight")
```

Для отчёта используйте достаточное разрешение, но не сохраняйте гигантские изображения без причины. Проверяйте читаемость после вставки в реальный документ.

## Частые ошибки

- смешивать `plt.*` и Axes API в сложной фигуре;
- не подписывать оси;
- строить line для неупорядоченных категорий;
- использовать разные масштабы при сравнении;
- показывать среднее без distribution;
- перегружать график сеткой, цветами и legend;
- делать 12 маленьких subplots, которые невозможно прочитать.

## Связи

- [[Seaborn Statistical Visualization]] — high-level статистические графики.
- [[Exploratory Data Analysis Workflow]] — выбор графика по вопросу.
- [[ML Metrics and Threshold Selection]] — curves и operating points.
