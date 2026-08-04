---
title: Validation and Metrics — Interview
type: interview
area: career
status: active
aliases:
  - Validation Interview
tags:
  - interview/ml
id: interview.career.validation-and-metrics-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Validation and Metrics — Interview

> Knowledge: [[Validation Splits and Data Leakage]], [[ML Metrics and Threshold Selection]].

## Вопрос 1 — Зачем нужны train, validation и test?

### Ответ 20–30 секунд

На train модель учится, на validation выбираются features, hyperparameters и threshold, а test один раз оценивает уже зафиксированный pipeline. Если использовать test для выбора решения, он превращается в validation, и оценка становится оптимистичной.

### Если попросят глубже

Split должен повторять будущий способ применения модели. Для IID observations подходит random split, для связанных объектов — group split, для прогноза будущего — time split. Одного правильного соотношения частей нет.

### Follow-up

- Почему cross-validation не отменяет final test?
- Что делать при малом датасете?

### Связанные знания

- [[Validation Splits and Data Leakage]]
- [[ML Foundations]]

## Вопрос 2 — Когда нужны stratification, GroupKFold и time split?

### Ответ 20–30 секунд

Stratification сохраняет доли target между folds. GroupKFold не допускает один group одновременно в train и validation. Time split обучается только на прошлом и проверяется на более позднем периоде. Выбор определяется зависимостями данных, а не удобством API.

### Если попросят глубже

Stratification не устраняет leakage между observations одного пользователя. Group split может дополнительно сохранять time order. При temporal drift полезны rolling или expanding windows.

### Follow-up

- Как валидировать несколько событий одного клиента?
- Когда shuffled KFold опасен?

### Связанные знания

- [[Validation Splits and Data Leakage]]

## Вопрос 3 — Что такое data leakage?

### Ответ 20–30 секунд

Leakage — в training pipeline попадает информация, недоступная в момент real prediction. Это может быть future feature, target-derived field, duplicate между splits или preprocessing, fit на полном dataset. Offline metric растёт, но production quality не воспроизводится.

### Если попросят глубже

Нужно описать prediction timestamp и доступность каждого feature на этот момент. Imputer, scaler, encoder, feature selection и threshold следует fit только внутри training portion каждого fold.

### Follow-up

- Чем target leakage отличается от train–test contamination?
- Почему preprocessing до cross-validation опасен?

### Связанные знания

- [[Validation Splits and Data Leakage]]
- [[sklearn End-to-End Classification — Practice]]

## Вопрос 4 — Как выбрать classification metric?

### Ответ 20–30 секунд

Сначала перевожу ошибки в бизнес-смысл. Если важна стоимость false positives и false negatives при конкретном threshold, смотрю confusion-matrix metrics. Для ранжирования использую ROC-AUC или PR-AUC; при редком positive class PR-AUC обычно информативнее. Для качества probabilities — LogLoss и calibration.

### Если попросят глубже

Metric должна соответствовать decision layer: ranking metric сравнивает порядок, probability metric — probabilities, threshold metric — конкретное действие. Accuracy опасна при imbalance и неравных costs.

### Follow-up

- Почему ROC-AUC может выглядеть хорошо при слабой precision?
- Когда нужен F-beta вместо F1?

### Связанные знания

- [[ML Metrics and Threshold Selection]]

## Вопрос 5 — Как выбирать threshold?

### Ответ 20–30 секунд

Threshold — бизнес-решение поверх probability score, а не свойство обученной модели. Его выбирают на validation по cost function, capacity constraint или требованию вроде recall не ниже заданного уровня, затем фиксируют до test.

### Если попросят глубже

Если class balance или costs меняются, threshold нужно пересматривать. Некалиброванный score всё ещё можно threshold-ить, но его нельзя напрямую трактовать как вероятность.

### Follow-up

- Что делать при лимите 1 000 ручных проверок в день?
- Чем calibration отличается от discrimination?

### Связанные знания

- [[ML Metrics and Threshold Selection]]
- [[Logistic Regression]]

