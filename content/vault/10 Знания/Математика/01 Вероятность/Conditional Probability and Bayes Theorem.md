---
title: Conditional Probability and Bayes Theorem
type: concept
area: math
status: active
aliases:
  - Условная вероятность и теорема Байеса
  - Bayes rule
tags:
  - math/probability
  - ml/foundations
math_depth: 2
id: concept.math.conditional-probability-and-bayes-theorem
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Conditional Probability and Bayes Theorem

## Идея за 30 секунд

Conditional probability отвечает: «какова вероятность $A$, если известно $B$?». Bayes theorem переставляет направление conditioning: из того, насколько вероятно наблюдение при гипотезе, получает вероятность гипотезы после наблюдения. В ML это связывает prior, likelihood и posterior; в классификации — признаки и класс.

## Conditional probability

Для событий $A$ и $B$ при $P(B)>0$:

$$
P(A\mid B)=\frac{P(A\cap B)}{P(B)}.
$$

Знаменатель ограничивает пространство исходов теми случаями, где $B$ уже произошло. Отсюда multiplication rule:

$$
P(A\cap B)=P(A\mid B)P(B).
$$

В общем случае порядок важен:

$$
P(A\mid B)\ne P(B\mid A).
$$

Именно смешение этих величин порождает base-rate fallacy.

## Law of total probability

Пусть события $H_1,\ldots,H_k$ образуют partition: не пересекаются и покрывают все исходы. Тогда:

$$
P(B)=\sum_{j=1}^{k}P(B\mid H_j)P(H_j).
$$

Мы рассматриваем все способы, которыми могло произойти $B$, и суммируем их вероятности. Это denominator Bayes theorem.

## Bayes theorem

$$
P(H_j\mid B)
=\frac{P(B\mid H_j)P(H_j)}
{\sum_{\ell=1}^{k}P(B\mid H_\ell)P(H_\ell)}.
$$

Здесь:

- $P(H_j)$ — prior: вероятность гипотезы до наблюдения;
- $P(B\mid H_j)$ — likelihood наблюдения при гипотезе;
- $P(H_j\mid B)$ — posterior;
- denominator — evidence, нормирующая сумма по гипотезам.

В форме пропорциональности:

$$
p(\theta\mid D)\propto p(D\mid\theta)p(\theta).
$$

Это центральная связь Bayesian inference: posterior равен likelihood, умноженному на prior и нормированному по всем $\theta$.

## Числовой пример и base rate

Пусть болезнь встречается у $1\%$ людей. Тест имеет sensitivity $90\%$ и false positive rate $5\%$. Для положительного результата:

$$
P(\text{болезнь}\mid +)
=\frac{0.90\cdot0.01}
{0.90\cdot0.01+0.05\cdot0.99}
\approx 0.154.
$$

Несмотря на хороший sensitivity, posterior около $15.4\%$, потому что исходная болезнь редка. Одна только величина $P(+\mid\text{болезнь})$ не отвечает на вопрос пациента.

## Independence и conditional independence

События независимы, если:

$$
P(A\cap B)=P(A)P(B).
$$

Эквивалентно $P(A\mid B)=P(A)$ при положительной вероятности $B$.

Conditional independence записывается:

$$
X\perp Y\mid Z,
$$

$$
p(x,y\mid z)=p(x\mid z)p(y\mid z).
$$

Две величины могут быть зависимы marginally, но независимы после conditioning. Например, признаки могут коррелировать в общей выборке из-за класса, но быть приблизительно независимыми внутри каждого класса. Именно такое сильное предположение использует Naive Bayes.

## Bayes для классификации

Для класса $C_k$ и признаков $x$:

$$
P(C_k\mid x)
\propto p(x\mid C_k)P(C_k).
$$

Классификатор сравнивает posterior scores классов. Prior отражает prevalence класса, class-conditional likelihood — насколько признаки типичны для этого класса.

Если prior в production отличается от train, posterior probabilities могут сместиться даже при неизменном $p(x\mid C_k)$.

## Что если предположения нарушены

- Ошибочный prior влияет сильнее при малом количестве данных и слабом likelihood.
- Нарушение conditional independence не всегда уничтожает классификацию, но ухудшает calibration и может двойным счётом усиливать коррелированные признаки.
- Selection bias меняет base rate и conditional distributions.
- Causal направление нельзя вывести из Bayes theorem: это правило согласования вероятностей, а не causal graph.

## Связи

- [[Random Variables and Distributions]] — задаёт probability models для observations.
- [[Expectation Variance Covariance and Correlation]] — conditioning раскладывает mean и variance.
- [[Likelihood MLE and MAP]] — likelihood становится частью posterior и objective estimation.
- [[Hypothesis Testing and Confidence Intervals]] — Bayes posterior и frequentist p-value отвечают на разные вопросы.
