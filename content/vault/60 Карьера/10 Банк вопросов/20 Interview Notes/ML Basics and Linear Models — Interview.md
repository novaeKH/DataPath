---
title: ML Basics and Linear Models — Interview
type: interview
area: career
status: active
aliases:
  - ML Basics Interview
tags:
  - interview/ml
id: interview.career.ml-basics-and-linear-models-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# ML Basics and Linear Models — Interview

> Knowledge: [[ML Foundations]], [[Linear Regression]], [[Logistic Regression]], [[Regularization]].

## Вопрос 1 — Что такое overfitting и bias–variance?

### Ответ 20–30 секунд

Overfitting — модель хорошо fit train sample, но использует нестабильные закономерности и хуже работает на новых данных. Обычно это high variance. Underfitting — train и validation плохи из-за слишком ограниченной модели, слабых features или optimization; это high bias. Сначала проверяю split/leakage, затем capacity и regularization.

### Если попросят глубже

Большой train–validation gap не доказывает только excess capacity: возможны distribution shift, duplicates, group leakage и неверная metric. Bias–variance — diagnostic model, а не полный causal diagnosis.

### Follow-up

- Почему больше данных снижает variance, но не исправляет неверный target?
- Как отличить underfit от optimization failure?

### Связанные знания

- [[ML Foundations]]
- [[Validation Splits and Data Leakage]]

## Вопрос 2 — Почему Linear Regression использует MSE?

### Ответ 20–30 секунд

Если считать $y_i=x_i^\top\beta+\varepsilon_i$ и independent errors Gaussian с общей variance, likelihood — произведение Gaussian densities. Negative log-likelihood отличается от суммы squared residuals только positive scale и constant. Поэтому MLE по $\beta$ эквивалентен OLS/MSE.

### Если попросят глубже

При heteroscedastic Gaussian noise появляется weighted least squares, при Laplace noise — absolute error. Gauss–Markov отвечает на другой вопрос: когда OLS является BLUE без требования Gaussianity.

### Follow-up

- Нужна ли нормальность для prediction?
- Что меняется при heteroscedasticity?

### Связанные знания

- [[Linear Regression]]
- [[Likelihood MLE and MAP]]
- [[Gauss-Markov Theorem]]

## Вопрос 3 — Почему Logistic Regression использует LogLoss?

### Ответ 20–30 секунд

Model задаёт $p_i=\sigma(w^\top x_i+b)$ и Bernoulli distribution target. Likelihood observation равен $p_i^{y_i}(1-p_i)^{1-y_i}$. Maximum likelihood после log и смены знака даёт Binary Cross-Entropy/LogLoss.

### Если попросят глубже

Gradient loss по logit равен $p_i-y_i$; fused `BCEWithLogitsLoss` численно устойчивее отдельного sigmoid плюс log. Threshold выбирается отдельно и не является parameter likelihood model.

### Follow-up

- Почему boundary линейна?
- Когда probability требует calibration?

### Связанные знания

- [[Logistic Regression]]
- [[Random Variables and Distributions]]
- [[ML Metrics and Threshold Selection]]

## Вопрос 4 — Чем L1 отличается от L2?

### Ответ 20–30 секунд

L2 smooth сжимает coefficients и обычно стабилизирует correlated features. L1 имеет kink в нуле и часто даёт sparse solution, но выбор correlated feature может быть нестабилен. В MAP-интерпретации L2 соответствует Gaussian prior, L1 — Laplace prior.

### Если попросят глубже

Penalty зависит от feature scale, поэтому scaler fit внутри train/CV. Elastic Net сочетает sparsity и stability.

### Follow-up

- Почему intercept часто не штрафуют?
- Как $\lambda$ влияет на bias и variance?

### Связанные знания

- [[Regularization]]
- [[Likelihood MLE and MAP]]

## Вопрос 5 — Почему нельзя всегда использовать threshold 0.5?

### Ответ 20–30 секунд

Threshold переводит score/probability в решение и зависит от false-positive/false-negative costs, prevalence и capacity. Его выбирают на validation/OOF predictions по expected utility или constraints precision/recall. Test нужен только для финальной оценки зафиксированного threshold.

### Если попросят глубже

После class weighting/resampling raw probability может быть некалибрована. Хороший ranking не гарантирует хорошую operating point.

### Follow-up

- Чем calibration отличается от discrimination?
- Как выбрать threshold при ограничении review capacity?

### Связанные знания

- [[ML Metrics and Threshold Selection]]
- [[Validation Splits and Data Leakage]]
