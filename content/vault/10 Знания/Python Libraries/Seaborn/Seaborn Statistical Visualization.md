---
title: Seaborn Statistical Visualization
id: concept.seaborn.statistical-visualization
type: concept
area: seaborn
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Основы Seaborn
tags:
- seaborn/core
- data/visualization
---

# Seaborn Statistical Visualization

## Зачем Seaborn

Seaborn строится поверх Matplotlib и удобно работает с tidy DataFrame. Он автоматически группирует данные по `hue`, строит distributions и statistical summaries. Но автоматическая агрегация может скрыть детали, поэтому нужно понимать, что именно посчитано.

## Tidy data

Каждая строка — observation, каждая колонка — variable, каждая ячейка — значение.

```python
import seaborn as sns

sns.scatterplot(
    data=frame,
    x="income",
    y="debt",
    hue="target",
)
```

`hue`, `style` и `size` кодируют дополнительные переменные. Не используйте все одновременно без необходимости.

## Distribution plots

```python
sns.histplot(data=frame, x="amount", hue="target", bins=40, stat="density")
sns.kdeplot(data=frame, x="amount", hue="target", common_norm=False)
sns.ecdfplot(data=frame, x="amount", hue="target")
```

KDE зависит от bandwidth и может создавать иллюзию значений за физическими границами. ECDF часто честнее для сравнения distributions.

## Categorical plots

```python
sns.boxplot(data=frame, x="segment", y="amount")
sns.violinplot(data=frame, x="segment", y="amount", inner="quartile")
sns.stripplot(data=sample, x="segment", y="amount", alpha=0.3)
```

Boxplot показывает robust summary, но скрывает multimodality. Violin зависит от KDE. На малых данных полезно показывать реальные точки.

## Statistical estimation

```python
sns.pointplot(data=frame, x="segment", y="target", errorbar=("ci", 95))
```

Seaborn может агрегировать значения и показывать interval. Уточняйте estimator, единицу наблюдения и метод uncertainty. Если строки одного пользователя зависимы, обычный bootstrap по строкам даёт ложную уверенность.

## Relational plots

```python
sns.lineplot(data=daily, x="date", y="metric", hue="model")
```

По умолчанию lineplot может агрегировать одинаковые x. Если каждая линия — отдельный run, укажите units и estimator:

```python
sns.lineplot(data=runs, x="epoch", y="loss", units="run_id", estimator=None)
```

## FacetGrid

```python
g = sns.displot(
    data=frame,
    x="amount",
    col="segment",
    col_wrap=3,
    kind="hist",
)
```

Facets полезны для сравнения сегментов с одинаковой шкалой. Слишком много facets превращает анализ в нечитаемую стену.

## Heatmap

```python
sns.heatmap(correlation, center=0, cmap="vlag")
```

Correlation heatmap не показывает nonlinear relation, causality и влияние пропусков. Для десятков колонок она часто бесполезна без отбора.

## Связь с Matplotlib

```python
fig, ax = plt.subplots(figsize=(8, 4))
sns.boxplot(data=frame, x="segment", y="amount", ax=ax)
ax.set_title("Amount by segment")
fig.tight_layout()
```

Seaborn создаёт artists Matplotlib, поэтому финальные подписи и layout управляются через Axes/Figure.

## Частые ошибки

- не понимать автоматическую агрегацию;
- строить KDE на малом sample;
- сравнивать facets с разными scales;
- показывать CI по зависимым строкам;
- использовать correlation heatmap как весь EDA;
- перегружать `hue`, `style`, `size`;
- интерпретировать visual separation как доказательство predictive quality.

## Связи

- [[Matplotlib Figure Axes and Plot Design]] — низкоуровневое управление.
- [[EDA Relationships Time and Groups]] — системный выбор графиков.
- [[Hypothesis Testing and Confidence Intervals]] — uncertainty.
