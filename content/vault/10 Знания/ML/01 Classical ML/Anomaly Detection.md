---
title: Anomaly Detection
id: concept.ml.anomaly-detection
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Поиск аномалий
- Outlier detection
tags:
- ml/anomaly
- ml/unsupervised
math_depth: 1
---

# Anomaly Detection

## Что является anomaly

Anomaly — объект, необычный относительно выбранной reference population и representation. Необычный не означает fraudulent, ошибочный или плохой.

Различайте:

- point anomaly;
- contextual anomaly;
- collective anomaly;
- data quality error;
- novelty in future data.

## Supervised vs unsupervised

Если есть labels fraud/defect, это classification с extreme imbalance. Unsupervised detection используется без достаточной разметки, но evaluation сложнее.

## Методы

### Statistical rules

Domain bounds, robust z-score, quantiles. Хороши для понятных одномерных контрактов.

### Isolation Forest

Случайные splits быстрее изолируют rare points. Score основан на path length. Хорош для tabular, но зависит от contamination/threshold и representation.

### Local Outlier Factor

Сравнивает local density объекта с neighbours. Находит local anomalies, но prediction нового data имеет ограничения в стандартном режиме.

### One-Class SVM

Строит boundary вокруг normal data. Чувствителен к scaling и hyperparameters, дорог на больших данных.

### Autoencoder

Large reconstruction error может сигнализировать anomaly, но model может хорошо реконструировать неожиданные patterns или плохо — normal rare cases.

## Evaluation

Нужны:

- labeled review sample;
- precision@K;
- recall по известным incidents;
- analyst capacity;
- stability;
- time split;
- false-positive analysis;
- domain review.

ROC-AUC может быть misleading при rare anomalies.

## Threshold

Выбирается по review capacity/cost, не только по algorithm contamination. Production prevalence меняется.

## Числовой пример и operational view

Пусть система оценивает 1 000 000 операций в день, а аналитики могут проверить только 500. Даже хороший anomaly score нельзя использовать без ranking и capacity threshold. Полезная metric — precision@500: сколько реальных incidents находится среди 500 самых подозрительных объектов.

Если среди top-500 обнаружено 75 подтверждённых incidents, precision@500 равна 15%. Чтобы оценить recall, нужно знать или приблизительно оценить общее число incidents, что часто требует delayed labels и sampling ниже threshold.

## Contextual anomaly

Температура 30°C нормальна летом и необычна зимой. Транзакция на 50 000 рублей может быть нормальной для corporate client и аномальной для нового retail client. Поэтому detector должен учитывать контекст: время, сегмент, историю объекта и representation.

## Как строить baseline

1. Определить unit of analysis: transaction, user-day, device session.
2. Удалить post-event leakage.
3. Создать простые domain rules и robust statistics.
4. Сравнить Isolation Forest/LOF с baseline.
5. Выбрать threshold по analyst capacity.
6. Собрать feedback и размеченную review sample.
7. Проверять drift normal population.

## Novelty detection и outlier detection

Outlier detection предполагает, что training data уже может содержать anomalies. Novelty detection обычно обучается на clean normal data и оценивает новые объекты. Это различие влияет на training protocol и interpretation score.

## Мини-проверка

Isolation Forest помечает 1% объектов как anomalies. Это не означает, что fraud rate равен 1%. `contamination` или threshold управляет количеством alerts, а business meaning появляется только после review и labels.

## Когда использовать

- есть разметка аномалий и они редки → supervised/сэмплинг;
- разметки нет → unsupervised (Isolation Forest, LOF, One-Class SVM);
- fraud detection, monitoring, дефекты, novelty detection на новых данных;
- НЕ использовать без контекста: «аномалия» ≠ «мошенничество»; всегда оценивать threshold и стоимость ошибок.

## Визуализация

Компонент `anomaly-methods-lab`:

- normal cloud и contextual point;
- Isolation Forest partitions;
- LOF neighbourhood;
- threshold/capacity;
- false positives;
- drift.

## Ответ для собеседования

> Задача — найти объекты, сильно отличающиеся от нормы. Методы делятся на supervised (есть метки), unsupervised (Isolation Forest изолирует аномалии короткими деревьями; LOF по плотности; One-Class SVM; autoencoder по reconstruction error) и статистические правила. Ключевое — выбор threshold по бизнес-стоимости и проверка, что «редкое» действительно значит «плохое».

## Частые ошибки

- anomaly = fraud;
- обучать на data, уже содержащей post-incident features;
- выбирать threshold по test;
- не scaling distance models;
- оценивать только красивый 2D plot;
- игнорировать drift normal behavior.

## Связи

- [[Data Quality Missing Values and Outliers]]
- [[DBSCAN and Hierarchical Clustering]]
- [[Class Imbalance and Resampling]]

## Код: Isolation Forest и contamination

```python
from sklearn.ensemble import IsolationForest

detector = IsolationForest(
    n_estimators=300,
    contamination=0.01,
    random_state=42,
)
detector.fit(X_train)
anomaly_score = -detector.score_samples(X_valid)
```

`contamination` задаёт ожидаемую долю anomalies для порога, но не улучшает
ranking автоматически. Порог калибруют на validation labels или capacity.
