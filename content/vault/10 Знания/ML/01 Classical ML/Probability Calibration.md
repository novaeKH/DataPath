---
title: Probability Calibration
id: concept.ml.probability-calibration
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
- Калибровка вероятностей
tags:
- ml/probability
- ml/calibration
math_depth: 2
---

# Probability Calibration

## Что значит calibrated

Если среди объектов с prediction около `0.7` положительный класс встречается примерно в 70% случаев, probabilities calibrated.

Ranking и calibration различаются: monotonic transform сохраняет ROC-AUC, но меняет probabilities.

## Диагностика

- reliability diagram;
- Brier score;
- LogLoss;
- calibration intercept/slope;
- segment/time checks.

Binning создаёт noise, поэтому показывайте support и uncertainty.

## Методы

### Platt scaling

Logistic mapping score → probability. Подходит при sigmoid-like distortion и малом calibration set.

### Isotonic regression

Monotonic flexible mapping. Требует больше данных и может overfit.

### Temperature scaling

Для multiclass/neural logits делит logits на temperature, сохраняя predicted class ordering.

## Правильный split

Calibrator fit на held-out или out-of-fold predictions, которые model не видела при fit. Нельзя calibrate на той же train prediction.

Sequence:

```text
train base model → held-out/OOF scores → fit calibrator
→ choose threshold on validation → final test
```

## Drift и prevalence

Calibration зависит от distribution. При prior shift probabilities меняются даже при том же ranking. Проверяйте по времени и сегментам.

## Пример с кредитным риском

Предположим, модель выдала 100 клиентам вероятность дефолта около 0.8. Если модель хорошо откалибрована, примерно 80 из этих 100 клиентов действительно должны оказаться в положительном классе на данных с тем же распределением. Если дефолт произошёл только у 45 клиентов, модель систематически завышает риск, даже если она правильно расставляет клиентов по порядку.

Это важно, когда вероятность участвует в расчёте ожидаемого ущерба:

$$
\operatorname{Expected\ Loss}=PD\cdot LGD\cdot EAD,
$$

где $PD$ — вероятность дефолта, $LGD$ — доля потерь при дефолте, $EAD$ — сумма под риском. Хороший ROC-AUC не гарантирует, что $PD$ можно напрямую подставлять в такую формулу.

## Как читать reliability diagram

1. Разделите predictions на интервалы, например 0–0.1, 0.1–0.2 и так далее.
2. Для каждого интервала вычислите среднюю prediction.
3. Посчитайте фактическую долю positive class.
4. Сравните точки с диагональю $y=x$.

Точки ниже диагонали означают, что модель завышает вероятность. Точки выше — занижает. Но один маленький bin может сильно шуметь, поэтому рядом полезно показывать число объектов.

## Когда calibration действительно нужна

Calibration особенно полезна, когда:

- probability используется в pricing, risk или expected value;
- решения принимаются разными thresholds;
- probabilities сравниваются между сегментами;
- downstream system использует их как вход;
- нужно объяснить вероятность пользователю или аналитику.

Она менее критична, когда нужен только фиксированный top-K ranking и decision rule не использует абсолютное значение probability.

## Мини-проверка

Модель A имеет ROC-AUC 0.88, но для объектов с prediction 0.9 positive class встречается в 55% случаев. Модель хорошо ранжирует, но плохо откалибрована. Правильный следующий шаг — не менять test labels и не подбирать mapping на test, а получить held-out или OOF scores и обучить calibrator на них.

## Визуализация

Компонент `calibration-reliability-lab`:

- score distortion;
- reliability curve;
- histogram support;
- Platt/isotonic/temperature;
- Brier/LogLoss;
- shift prevalence.

## Частые ошибки

- считать AUC calibration metric;
- calibrate на train;
- маленький sample для isotonic;
- выбирать method по test;
- не сохранять calibrator вместе с model;
- использовать old calibrator после drift.

## Связи

- [[ML Metrics and Threshold Selection]]
- [[Logistic Regression]]
- [[Class Imbalance and Resampling]]
