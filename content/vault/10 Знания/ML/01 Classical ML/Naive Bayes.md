---
title: Naive Bayes
type: concept
area: ml
status: active
aliases:
  - Наивный Байес
  - NB classifier
tags:
  - ml/classical
  - ml/probabilistic
math_depth: 2
id: concept.ml.naive-bayes
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Naive Bayes

## Идея за 30 секунд

Naive Bayes применяет Bayes theorem и предполагает conditional independence признаков внутри класса. Тогда сложный joint likelihood раскладывается в произведение простых feature likelihoods. Предположение почти всегда неточно, но classifier часто силён на sparse text и малых данных; probabilities могут быть переуверенными.

## Bayes classifier

Для класса $C_k$ и features $x$:

$$
P(C_k\mid x)
=\frac{p(x\mid C_k)P(C_k)}
{p(x)}.
$$

Для сравнения классов denominator общий:

$$
\widehat{C}(x)
=\arg\max_k
p(x\mid C_k)P(C_k).
$$

$P(C_k)$ — class prior, $p(x\mid C_k)$ — class-conditional likelihood.

## Naive conditional independence

Предположение:

$$
p(x_1,\ldots,x_d\mid C_k)
=\prod_{j=1}^{d}
p(x_j\mid C_k).
$$

Отсюда:

$$
\widehat{C}(x)
=\arg\max_k
P(C_k)
\prod_{j=1}^{d}
p(x_j\mid C_k).
$$

Это цепочка:

```text
Bayes theorem
→ class prior × class-conditional likelihood
→ conditional independence
→ product of feature likelihoods
→ classifier
```

## Почему считают в log-space

Произведение многих probabilities underflow:

$$
\log P(C_k\mid x)
=\text{const}
+\log P(C_k)
+\sum_{j=1}^{d}
\log p(x_j\mid C_k).
$$

Classifier сравнивает log-scores; normalization через softmax/log-sum-exp нужна, только если требуются posterior probabilities.

## Основные варианты

### Gaussian Naive Bayes

Для continuous feature:

$$
x_j\mid C_k
\sim
\mathcal{N}(\mu_{kj},\sigma_{kj}^2).
$$

Оцениваются mean/variance каждого feature внутри класса. Сильные correlations нарушают independence.

### Multinomial Naive Bayes

Подходит для non-negative counts, особенно bag-of-words. Class likelihood задаётся probabilities tokens/features.

### Bernoulli Naive Bayes

Работает с binary feature presence/absence. В отличие от Multinomial, отсутствие слова тоже несёт явный вклад.

Выбор варианта определяется data representation, а не только task label.

## Smoothing

Без smoothing невстречавшийся token даёт zero likelihood и обнуляет весь product. Additive smoothing:

$$
\widehat{P}(w_j\mid C_k)
=\frac{N_{kj}+\alpha}
{N_k+\alpha V},
$$

где $N_{kj}$ — count feature/token в классе, $N_k$ — total count, $V$ — vocabulary size, $\alpha>0$ — smoothing strength.

## Почему метод работает при неверной independence

Для classification важен правильный ordering class scores, а не точная joint density. Ошибки likelihood могут частично сокращаться. В high-dimensional sparse data оценка простых marginals имеет низкую variance, поэтому bias сильного assumption окупается малой sample complexity.

Но correlated features могут быть учтены несколько раз и создавать overconfident posterior.

## Priors и distribution shift

Class prior:

$$
\widehat{P}(C_k)=\frac{n_k}{n}
$$

или задаётся из production prevalence. Если train был artificially balanced, empirical train prior не равен production prior.

Изменение $P(C_k)$ при стабильном $p(x\mid C_k)$ — prior shift; score можно корректировать. Если меняется class-conditional distribution, простой prior correction недостаточен.

## Failure modes

- использовать Multinomial NB с negative standardized features;
- считать posterior хорошо calibrated без проверки;
- дублировать correlated/derived features;
- строить vocabulary до split;
- игнорировать class prior после resampling;
- путать conditional independence с unconditional independence.

## Связи

- [[Conditional Probability and Bayes Theorem]] — Bayes rule и conditional independence.
- [[Random Variables and Distributions]] — Gaussian, Bernoulli и count distributions.
- [[Likelihood MLE and MAP]] — оценка class-conditional parameters и priors.
- [[ML Foundations]] — strong bias может снижать variance.
- [[Validation Splits and Data Leakage]] — vocabulary и likelihood parameters fit только на train.
