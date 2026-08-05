---
title: Logistic Regression
id: concept.ml.logistic-regression
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
- Логистическая регрессия
tags:
- ml/classical
- ml/linear-models
math_depth: 2
---

# Logistic Regression

## Что предсказывает модель

Для binary classification Logistic Regression оценивает probability положительного класса. Сначала строится linear score:

$$
z=\beta_0+x^\top\beta.
$$

Затем sigmoid переводит его в интервал $(0,1)$:

$$
p(y=1\mid x)=\sigma(z)=\frac{1}{1+e^{-z}}.
$$

Название «regression» связано с моделированием log-odds, хотя задача является classification.

## Odds и log-odds

$$
\operatorname{odds}=\frac{p}{1-p},
\qquad
\log\frac{p}{1-p}=\beta_0+x^\top\beta.
$$

Увеличение $x_j$ на единицу умножает odds на $e^{\beta_j}$ при фиксированных остальных features. Это не означает, что probability увеличивается на постоянную величину: изменение зависит от текущего $p$.

## Пример

Если $\beta_{income}=0.2$, то увеличение standardized income на единицу умножает odds positive class на $e^{0.2}\approx1.22$. При $p=0.5$ effect на probability больше, чем около $p=0.99$ из-за saturation sigmoid.

## Обучение и LogLoss

Binary cross-entropy:

$$
\mathcal{L}
=-\frac{1}{n}\sum_i
\left[y_i\log p_i+(1-y_i)\log(1-p_i)\right].
$$

Это negative log-likelihood Bernoulli model. Уверенная неправильная probability штрафуется сильно.

В отличие от linear regression, closed-form solution обычно нет; параметры находят optimization.

## Decision boundary

При threshold $0.5$:

$$
\beta_0+x^\top\beta=0
$$

задаёт linear boundary. С polynomial/interactions boundary может стать nonlinear в original features, но остаётся linear по созданным features.

## Probability и threshold

Модель выдаёт probability/score, а class decision требует threshold:

$$
\widehat y=\mathbb{1}[p\ge t].
$$

$t=0.5$ не универсален. Его выбирают по costs, recall/precision constraint или capacity на validation.

## Regularization

По умолчанию практические implementations используют penalty:

$$
\min_\beta \mathcal L(\beta)+\lambda\lVert\beta\rVert_2^2.
$$

Ridge стабилизирует correlated features. L1 может занулять coefficients. Scaling особенно важен, потому что penalty применяется к величине coefficients.

## Class imbalance

Imbalance не делает Logistic Regression непригодной. Возможны:

- class weights;
- resampling только внутри train folds;
- threshold selection;
- PR-AUC/recall/precision;
- calibration check.

После class weighting raw probabilities могут не соответствовать production prevalence и требуют calibration/correction.

## Calibration

Logistic Regression часто даёт разумные probabilities при корректной specification, но не гарантирует calibration. Проверяйте reliability curve, Brier score и LogLoss на held-out data.

## Multiclass

Multinomial Logistic Regression использует softmax:

$$
p(y=k\mid x)=\frac{e^{z_k}}{\sum_j e^{z_j}}.
$$

One-vs-Rest обучает отдельные binary models. Multinomial обычно моделирует конкуренцию классов напрямую.

## Preprocessing

- numerical: imputation, часто scaling;
- categorical: OHE или leakage-safe encoding;
- missing indicators при необходимости;
- interactions/polynomial только по CV;
- preprocessing внутри Pipeline.

## Интерпретация

Coefficient показывает conditional association при фиксированных остальных features. Correlated predictors, selection bias, regularization и transformations усложняют интерпретацию. Это не causal effect.

## Когда использовать

- нужна вероятность класса, а не только метка (credit scoring, churn, threshold);
- baseline для бинарной/мультиклассовой классификации;
- данные табличные, признаков умеренно много;
- НЕ использовать, если зависимости сильно нелинейные и данных много — деревья/boosting дадут лучшее качество; если нужна максимальная калибровка на сложных данных — post-hoc calibration.

## Визуализация

Компонент `logistic-boundary-threshold-lab`:

- points двух классов;
- decision boundary;
- sigmoid и текущий score;
- slider threshold;
- confusion matrix, precision, recall;
- class imbalance toggle;
- regularization slider.

## sklearn пример

```python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("model", LogisticRegression(max_iter=1000, C=1.0)),
])
```

`C` — inverse regularization strength: меньше `C` означает сильнее regularization.

## Ответ для собеседования

> Логистическая регрессия моделирует $\log\frac{p}{1-p}$ как линейную комбинацию признаков и обучается минимизацией LogLoss (cross-entropy). Результат — калиброванная вероятность. От линейной регрессии её отличает сигмоида и loss для вероятностей; threshold выбирается отдельно по бизнес-стоимости ошибок.

## Частые ошибки

- считать output до sigmoid probability;
- выбирать threshold на test;
- интерпретировать coefficient как прирост probability;
- применять scaling до split;
- использовать accuracy при rare positive;
- использовать class weight и считать probabilities calibrated автоматически;
- забыть regularization и convergence warning.

## Сравнение с другими моделями

- **Logistic vs Linear Regression**: разный target (класс vs число) и разный loss (LogLoss vs MSE); у логистической — сигмоида и вероятность;
- **Logistic vs деревья**: логистическая — проще, быстрее, интерпретируемее, хуже на сложных нелинейных границах;
- **Logistic vs SVM**: обе линейные по умолчанию; логистическая даёт калиброванные вероятности, SVM — зазор и kernel.

## Связи

- [[ML Metrics and Threshold Selection]]
- [[Probability Calibration]]
- [[Class Imbalance and Resampling]]
- [[Likelihood MLE and MAP]]
