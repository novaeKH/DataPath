---
title: Probability Math and AB Testing — Interview
type: interview
area: career
status: active
aliases:
  - Probability and AB Interview
tags:
  - interview/math
id: interview.career.probability-math-and-ab-testing-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Probability Math and AB Testing — Interview

> Knowledge: [[00 Математика — карта]], [[A-B Testing]].

## Вопрос 1 — Чем conditional probability отличается от Bayes theorem?

### Ответ 20–30 секунд

Conditional probability $P(A\mid B)$ — вероятность $A$ при известном $B$. Bayes theorem переставляет условие:

$$
P(A\mid B)=P(B\mid A)P(A)/P(B).
$$
Он объединяет prior belief и likelihood evidence, чтобы получить posterior.

### Если попросят глубже

Знаменатель нормализует posterior и может быть записан через law of total probability. Base rate нельзя игнорировать: высокий sensitivity не гарантирует высокий posterior при редком событии.

### Follow-up

- Объясните false positive в медицинском тесте.
- Что произойдёт с posterior при очень малом prior?

### Связанные знания

- [[Conditional Probability and Bayes Theorem]]
- [[Random Variables and Distributions]]

## Вопрос 2 — Что связывает expectation, variance и covariance?

### Ответ 20–30 секунд

Expectation описывает средний уровень random variable, variance — средний squared разброс вокруг него, covariance — совместное линейное изменение двух variables. Correlation нормирует covariance на standard deviations и поэтому безразмерна.

### Если попросят глубже

Нулевая covariance не означает independence, кроме специальных семейств вроде jointly Gaussian. Variance суммы содержит covariance terms, поэтому зависимости важны для uncertainty агрегатов.

### Follow-up

- Когда correlation вводит в заблуждение?
- Почему covariance matrix должна быть positive semidefinite?

### Связанные знания

- [[Expectation Variance Covariance and Correlation]]
- [[Eigenvalues Covariance Matrix and PCA Foundations]]

## Вопрос 3 — Чем likelihood отличается от probability?

### Ответ 20–30 секунд

Probability рассматривает данные как variable при фиксированных parameters. Likelihood фиксирует наблюдённые данные и сравнивает значения parameters. MLE выбирает parameter с максимальным likelihood; обычно максимизируют log-likelihood, потому что product превращается в sum.

### Если попросят глубже

Log не меняет argmax, но улучшает numerical stability. MAP добавляет prior: максимизируется log-likelihood плюс log-prior, что часто выглядит как regularization.

### Follow-up

- Почему likelihood не является probability distribution по parameter?
- Как Gaussian likelihood приводит к MSE?

### Связанные знания

- [[Likelihood MLE and MAP]]
- [[Linear Regression]]
- [[Logistic Regression]]

## Вопрос 4 — Что такое p-value?

### Ответ 20–30 секунд

p-value — вероятность получить statistic не менее экстремальный, если null hypothesis и assumptions теста верны. Это не вероятность истинности null и не размер эффекта. Решение нужно дополнять confidence interval и practical significance.

### Если попросят глубже

Малый p-value может возникнуть у практически неважного эффекта на огромной sample. Multiple testing увеличивает false-positive risk, поэтому нужен заранее заданный primary metric и correction при множестве проверок.

### Follow-up

- Чем statistical significance отличается от practical?
- Что меняется при peeking?

### Связанные знания

- [[Hypothesis Testing and Confidence Intervals]]
- [[A-B Testing]]


## Вопрос 5 — Как спроектировать A/B test?

### Ответ 20–30 секунд

Фиксирую unit of randomization, primary metric, guardrails, MDE, alpha, power и длительность до запуска. Проверяю sample-ratio mismatch и качество instrumentation. После теста оцениваю effect и interval, а не только p-value.

### Если попросят глубже

Unit analysis должна учитывать unit randomization и cluster dependence. Досрочная остановка по понравившемуся p-value ломает nominal error rate; нужны заранее заданное правило или sequential method.

### Follow-up

- Как выбрать MDE?
- Что делать с network effects?

### Связанные знания

- [[A-B Testing]]
- [[LLN CLT and Standard Error]]
- [[Hypothesis Testing and Confidence Intervals]]
