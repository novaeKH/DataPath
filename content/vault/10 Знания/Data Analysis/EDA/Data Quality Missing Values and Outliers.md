---
title: Data Quality Missing Values and Outliers
id: concept.eda.data-quality-missing-outliers
type: concept
area: eda
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Качество данных и выбросы
tags:
- eda/quality
- data/cleaning
---

# Data Quality, Missing Values and Outliers

## Data quality как контракт

Качество означает соответствие данным ожидаемому смыслу. Проверка включает не только NaN, но и уникальность, диапазон, согласованность таблиц, время и доступность признака.

## Типы пропусков

Упрощённая статистическая классификация:

- MCAR — вероятность пропуска не зависит от наблюдаемых и скрытых значений;
- MAR — зависит от наблюдаемых переменных;
- MNAR — зависит от самого скрытого значения или ненаблюдаемого процесса.

В реальных данных точный механизм часто неизвестен. Главное — понять процесс появления пропуска.

## Диагностика пропусков

```python
missing = frame.isna().mean().sort_values(ascending=False)
```

Сравните missing rate:

- по target;
- времени;
- источнику;
- сегменту;
- устройству;
- версии продукта.

Сам факт отсутствия может быть predictive, но может также отражать будущую информацию или изменение процесса.

## Imputation

Варианты:

- median/mean для numerical;
- constant/category для categorical;
- model-based imputation;
- missing indicator;
- native missing handling модели;
- удаление строки/колонки.

Любые statistics fit только на train. Сложная imputation не гарантирует лучшую downstream metric.

## Outlier

Outlier — наблюдение, далёкое по выбранной мере. Он не обязательно ошибка.

Источники:

- неверная единица;
- опечатка;
- rare valid case;
- fraud;
- новый сегмент;
- sensor failure;
- изменение процесса.

## Методы обнаружения

Одномерные:

- quantiles;
- IQR rule;
- robust z-score по median/MAD;
- domain bounds.

Многомерные:

- distance;
- Isolation Forest;
- Local Outlier Factor;
- residual analysis;
- density methods.

Автоматический threshold должен подтверждаться domain logic.

## Что делать с outlier

- исправить источник;
- удалить доказанную ошибку;
- ограничить физическим диапазоном;
- log transform;
- robust scaler/loss;
- отдельный сегмент;
- оставить и выбрать устойчивую модель.

Решение валидируется на честном split и применяется одинаково к новым данным.

## Дубликаты и согласованность

Проверяйте:

- полный дубль;
- дубликат бизнес-ключа;
- conflicting duplicates;
- orphan foreign keys;
- несогласованные totals;
- overlapping validity intervals.

## Drift качества

Даже корректная train-таблица не гарантирует production quality. Нужен monitoring:

- missing rate;
- unknown categories;
- range violations;
- freshness;
- volume;
- schema;
- feature distribution.

## Частые ошибки

- median imputation на полном dataset;
- удалить верхний 1% без объяснения;
- считать любой редкий объект ошибкой;
- игнорировать, что missingness меняется во времени;
- объединить несколько единиц измерения;
- использовать target при очистке test.

## Связи

- [[pandas Cleaning and Data Types]] — реализация очистки.
- [[Anomaly Detection]] — модели необычных объектов.
- [[From EDA to ML Pipeline]] — перенос решений в production pipeline.
