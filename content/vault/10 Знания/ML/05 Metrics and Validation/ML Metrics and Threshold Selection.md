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
# ML Metrics and Threshold Selection

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

### MAE

$$
\operatorname{MAE}
=\frac{1}{n}\sum_i|y_i-\widehat{y}_i|.
$$

Устойчива к крупным errors относительно MSE; в population ориентирована на conditional median.

### MSE и RMSE

$$
\operatorname{MSE}
=\frac{1}{n}\sum_i(y_i-\widehat{y}_i)^2,
$$

$$
\operatorname{RMSE}=\sqrt{\operatorname{MSE}}.
$$

Крупные residuals доминируют. RMSE возвращает units target.

### $R^2$

$$
R^2
=1-
\frac{\sum_i(y_i-\widehat{y}_i)^2}
{\sum_i(y_i-\bar{y})^2}.
$$

В приведённой формуле $\bar{y}$ — mean именно evaluation targets. Поэтому на test $R^2<0$ означает результат хуже constant prediction, равного mean этого evaluation set. Production baseline с train/reference mean нужно считать отдельно, не подменяя denominator стандартного $R^2$. Метрика не измеряет causal fit и плохо сравнима между datasets с разной target variability.

### Percentage metrics

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

## Визуализация

Confusion matrix показывает ошибки по классам; ROC-кривая — trade-off TPR/FPR по threshold; PR-кривая — precision/recall при дисбалансе. Интерактивный «порог» (slider) помогает увидеть, как меняются precision, recall и число объектов по классам при сдвиге threshold.

## Частые ошибки

- accuracy при сильном дисбалансе классов;
- выбор метрики «как все», без стоимости ошибок бизнеса;
- PR-AUC вместо ROC-AUC для редкого позитивного класса (и наоборот);
- threshold, подобранный на test и выданный за «обобщение»;
- усреднение multiclass метрик без понимания averaging scheme;
- сравнивать модели по метрике, не соответствующей решению.

## Сравнение метрик

| Метрика | Спрашивает | Когда использовать |
|---|---|---|
| Accuracy | доля верных | баланс классов |
| Precision | сколько из предсказанных — верные | дорогие ложные срабатывания |
| Recall | сколько из истинных нашли | дорогие пропуски |
| ROC-AUC | разделение классов | сравнение моделей, баланс |
| PR-AUC | качество на редком классе | сильный дисбаланс |
| LogLoss | уверенность вероятностей | нужны вероятности |

## Простой пример

Кредитный скор: 2% дефолтов. Accuracy ≈ 98% у «всегда не дефолт» — бесполезна. PR-AUC и threshold по стоимости ошибок дают осмысленную оценку.

## Пример кода

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    roc_auc_score, log_loss, confusion_matrix,
)

print(confusion_matrix(y_val, y_pred))
print(precision_score(y_val, y_pred), recall_score(y_val, y_pred))
print(roc_auc_score(y_val, y_proba), log_loss(y_val, y_proba))
```

## Связи

- [[Validation Splits and Data Leakage]] — metric считается на честном split; threshold не выбирают на test.
- [[Logistic Regression]] — LogLoss и probability interpretation.
- [[Likelihood MLE and MAP]] — proper probabilistic losses.
- [[Recommendation Systems]] — candidate generation и ranking evaluation.
- [[A-B Testing]] — online causal effect и guardrails.
- [[Validation and Metrics — Interview]] — короткий формат.
