---
title: ML Metrics and Threshold Selection
type: concept
area: ml
status: active
aliases:
  - Метрики машинного обучения
  - Classification regression ranking metrics
tags:
  - ml/metrics
  - ml/validation
math_depth: 2
id: concept.ml.ml-metrics-and-threshold-selection
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---


**Рекомендуемое время:** 60–75 минут.

## Результаты обучения
- считать confusion matrix и понимать Precision/Recall/F1
- различать ROC-AUC, PR-AUC, LogLoss и calibration
- выбирать threshold по стоимости ошибок и capacity
- понимать top-K, lift и сегментную оценку

## Вход в тему

Модель редко принимает бизнес-решение сама: она выдаёт score, а продукт выбирает, кого проверить, кому отказать или кому показать оффер. Поэтому качество ranking, качество вероятностей и качество конкретного threshold — три разные задачи.

## Полная теория

## Идея за 30 секунд

Metric должна соответствовать output модели и решению. Ranking metric оценивает порядок, probability metric — качество probabilities, threshold metric — конкретную decision rule, business metric — последствия решений. Нельзя выбирать F1, ROC-AUC или RMSE без class balance, costs, aggregation unit и deployment action.

## Сначала определить, что оцениваем

1. **Score/ranking**: кто выше.
2. **Probability**: насколько прогноз calibrated и sharp.
3. **Decision**: что происходит после threshold/top-$K$.
4. **Business outcome**: value, cost, capacity, risk.

Одна model может хорошо rank, плохо calibrate и после неверного threshold давать плохое решение.

## Confusion matrix

Для positive class:

- TP — правильно найденный positive;
- FP — false alarm;
- FN — пропущенный positive;
- TN — правильно отклонённый negative.

$$
\operatorname{Precision}
=\frac{TP}{TP+FP},
$$

$$
\operatorname{Recall}
=\frac{TP}{TP+FN},
$$

$$
\operatorname{Specificity}
=\frac{TN}{TN+FP}.
$$

Precision отвечает про качество выбранных positives; recall — какую долю всех positives нашли.

## Accuracy и balanced accuracy

$$
\operatorname{Accuracy}
=\frac{TP+TN}{TP+FP+FN+TN}.
$$

При rare positive constant-negative model может иметь высокую accuracy. Balanced accuracy усредняет recall классов и меньше зависит от prevalence, но business costs всё равно не кодирует.

## F-score

$$
F_\beta
=(1+\beta^2)
\frac{\operatorname{Precision}\cdot\operatorname{Recall}}
{\beta^2\operatorname{Precision}+\operatorname{Recall}}.
$$

$\beta>1$ сильнее ценит recall, $\beta<1$ — precision. F-score:

- зависит от threshold;
- игнорирует TN;
- не является proper probability score;
- должен сопровождаться support и выбранной operating point.

## ROC-AUC

ROC-AUC можно интерпретировать как probability, что случайный positive получит score выше случайного negative:

$$
\operatorname{AUC}
=P(s(X^+)>s(X^-)).
$$

Он threshold-free и invariant к monotonic score transform. При extreme imbalance ROC curve может выглядеть хорошо, хотя precision в рабочем region низка.

## Precision–Recall и PR-AUC

PR curve фокусируется на positive class. Baseline precision равна prevalence positives, поэтому PR-AUC нельзя сравнивать между datasets с разной prevalence без контекста.

Нужно проверять:

- какая implementation area используется: average precision или trapezoid;
- какие points рабочие с учётом capacity/cost;
- uncertainty по folds/time.

## LogLoss и Brier score

Binary LogLoss:

$$
-\frac{1}{n}
\sum_{i=1}^{n}
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
$$

Она строго штрафует confident wrong predictions и соответствует Bernoulli negative log-likelihood.

Brier score:

$$
\frac{1}{n}
\sum_{i=1}^{n}(p_i-y_i)^2.
$$

Обе proper scoring rules: в expectation оптимально сообщать истинную probability. Но aggregate score нужно дополнять calibration curve и segment checks.

## Threshold selection

Decision:

$$
\widehat{y}_i=\mathbb{1}[p_i\ge t].
$$

Threshold выбирается на validation/OOF predictions:

- minimize expected cost;
- maximize expected utility;
- обеспечить recall не ниже requirement;
- обеспечить precision при limited review capacity;
- выбрать top-$K$ вместо fixed $t$.

Expected cost:

$$
\operatorname{Cost}(t)
=c_{FP}FP(t)+c_{FN}FN(t).
$$

Threshold $0.5$ не является универсальным. После class weighting/resampling raw probability может требовать calibration.

## Multiclass averaging

- **Macro**: одинаковый вес каждому классу.
- **Weighted macro**: вес по support.
- **Micro**: агрегирует все decisions и доминируется частыми классами.

Нужно показывать per-class metrics и confusion matrix: одно среднее скрывает minority failure.

## Regression metrics

#### MAE

$$
\operatorname{MAE}
=\frac{1}{n}\sum_i|y_i-\widehat{y}_i|.
$$

Устойчива к крупным errors относительно MSE; в population ориентирована на conditional median.

#### MSE и RMSE

$$
\operatorname{MSE}
=\frac{1}{n}\sum_i(y_i-\widehat{y}_i)^2,
$$

$$
\operatorname{RMSE}=\sqrt{\operatorname{MSE}}.
$$

Крупные residuals доминируют. RMSE возвращает units target.

#### $R^2$

$$
R^2
=1-
\frac{\sum_i(y_i-\widehat{y}_i)^2}
{\sum_i(y_i-\bar{y})^2}.
$$

В приведённой формуле $\bar{y}$ — mean именно evaluation targets. Поэтому на test $R^2<0$ означает результат хуже constant prediction, равного mean этого evaluation set. Production baseline с train/reference mean нужно считать отдельно, не подменяя denominator стандартного $R^2$. Метрика не измеряет causal fit и плохо сравнима между datasets с разной target variability.

#### Percentage metrics

MAPE unstable при $y\approx0$, asymmetric и undefined при zero. Рассмотреть MAE/RMSE, WAPE, SMAPE или domain-specific normalized error, называя denominator.

## Ranking и recommender metrics

Для top-$K$:

$$
\operatorname{Precision@K}
=\frac{\#\text{relevant in top K}}{K},
$$

$$
\operatorname{Recall@K}
=\frac{\#\text{relevant in top K}}
{\#\text{all relevant}}.
$$

NDCG учитывает position и graded relevance:

$$
\operatorname{DCG@K}
=\sum_{i=1}^{K}
\frac{2^{rel_i}-1}{\log_2(i+1)},
$$

$$
\operatorname{NDCG@K}
=\frac{\operatorname{DCG@K}}{\operatorname{IDCG@K}}.
$$

Offline metric зависит от candidate set, negative sampling и exposure bias. Online experiment проверяет реальный product effect.

## Связь с бизнесом

Для каждой metric зафиксировать:

- unit aggregation: row/user/session/day;
- population/segment;
- time horizon;
- cost/benefit decisions;
- uncertainty;
- baseline;
- acceptable guardrails.

Metric без decision context легко оптимизировать в неверную сторону.

## Обязательная визуальная демонстрация

Один набор score и интерактивный threshold: одновременно меняются confusion matrix, Precision, Recall, F1, число действий и expected cost.

## Практика

#### Задание 1. Confusion matrix

В выборке 10 000 объектов, 100 положительных. Recall=0.8, FPR=0.03. Посчитай TP, FN, FP, TN и Precision.

#### Задание 2. Выбор метрики

Fraud встречается в 0.2% случаев. Что информативнее для сравнения моделей: Accuracy, ROC-AUC или PR-AUC?

#### Задание 3. Threshold

Цена FN в 8 раз выше FP. Как это должно влиять на threshold?

#### Задание 4. Top-K

Операторы могут обработать 500 из 50 000 клиентов. Какие метрики использовать?

## Разбор практики

**1.** TP=80, FN=20, FP=0.03×9900=297, TN=9603; Precision=80/(80+297)≈0.212.

**2.** Accuracy почти бесполезна. PR-AUC лучше отражает редкий positive; ROC-AUC можно оставить как дополнительную ranking-метрику.

**3.** Threshold обычно снижают, повышая Recall, но окончательно выбирают по expected cost на validation.

**4.** Precision@500, Recall@500, Lift@1%, cumulative gain и business value top-500.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что измеряет ROC-AUC?

- A. Calibration
- B. Вероятность, что positive получит больший score, чем negative
- C. Accuracy при 0.5
- D. Среднюю стоимость

**Правильный ответ:** B

**Объяснение:** ROC-AUC оценивает ranking по случайной positive-negative паре.

#### Checkpoint 2

**Вопрос:** Когда PR-AUC особенно полезна?

- A. При сильном дисбалансе
- B. Только для регрессии
- C. Когда нет target
- D. Только после calibration

**Правильный ответ:** A

**Объяснение:** Она фокусируется на качестве positive-класса.

#### Checkpoint 3

**Вопрос:** Threshold 0.5 является...

- A. универсально оптимальным
- B. обязательным для Logistic Regression
- C. одной из возможных рабочих точек
- D. эквивалентом ROC-AUC

**Правильный ответ:** C

**Объяснение:** Threshold должен выбираться по цели и ограничениям.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.

## Код: threshold как часть решения

```python
import numpy as np
from sklearn.metrics import precision_recall_curve

precision, recall, thresholds = precision_recall_curve(y_valid, probability)
valid = np.flatnonzero(precision[:-1] >= 0.70)
best = valid[np.argmax(recall[:-1][valid])]
threshold = thresholds[best]
prediction = (probability >= threshold).astype(int)
```

Порог выбирают на validation и фиксируют до test. Здесь constraint — precision
не ниже 0.70, а среди допустимых точек максимизируется recall.
