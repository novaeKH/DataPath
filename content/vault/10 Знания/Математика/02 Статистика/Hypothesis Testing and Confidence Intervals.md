---
title: Hypothesis Testing and Confidence Intervals
type: concept
area: math
status: active
aliases:
  - Проверка гипотез и доверительные интервалы
  - Statistical inference
tags:
  - math/statistics
  - experimentation
math_depth: 2
id: concept.math.hypothesis-testing-and-confidence-intervals
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Hypothesis Testing and Confidence Intervals

## Идея за 30 секунд

Hypothesis test спрашивает, насколько наблюдаемый statistic необычен при заданной null hypothesis. Confidence interval показывает набор parameter values, совместимых с данными и процедурой на выбранном уровне. Ни p-value, ни interval сами по себе не говорят, важен ли эффект для продукта: нужны effect size, uncertainty, MDE и guardrails.

## Компоненты теста

1. **Estimand** — какой population effect хотим оценить.
2. **Null hypothesis** $H_0$ — базовое утверждение, например $\Delta=0$.
3. **Alternative** $H_1$ — допустимое отклонение: two-sided или one-sided.
4. **Test statistic** — нормированное отличие estimate от null.
5. **Sampling distribution under $H_0$**.
6. **Decision rule** с уровнем $\alpha$.

Типовая форма statistic:

$$
T
=\frac{\widehat{\theta}-\theta_0}
{\widehat{\operatorname{SE}}(\widehat{\theta})}.
$$

Числитель — observed effect относительно null, denominator — его sampling uncertainty.

## p-value

P-value — вероятность получить statistic не менее экстремальный, чем наблюдаемый, **если $H_0$ и предположения теста верны**:

$$
p
=P_{H_0}
\left(
|T|\ge |T_{\text{obs}}|
\right)
$$

для two-sided test.

P-value не равен:

- $P(H_0\mid D)$;
- вероятности случайности результата;
- размеру эффекта;
- вероятности успешной репликации.

Малый p-value может сопровождать practically negligible effect при огромном sample size.

## Confidence interval

При normal approximation:

$$
\widehat{\theta}
\pm
z_{1-\alpha/2}
\widehat{\operatorname{SE}}(\widehat{\theta}).
$$

В repeated sampling $100(1-\alpha)\%$ таких intervals покрывают истинный parameter. После вычисления конкретного frequentist interval parameter не считается случайным; корректная формулировка — процедура имеет заданное coverage.

Для двухстороннего test на уровне $\alpha$ null value вне соответствующего confidence interval эквивалентен rejection при согласованных assumptions.

## Type I, Type II и power

- Type I error: отвергли верную $H_0$; вероятность контролируется $\alpha$.
- Type II error: не отвергли ложную $H_0$; вероятность $\beta$.
- Power: $1-\beta$ — вероятность обнаружить заранее заданный effect при верной alternative.

Power растёт с:

- большим sample size;
- большим true effect;
- меньшей variance;
- большим $\alpha$;
- более эффективным estimator.

MDE — минимальный эффект, для которого experiment спроектирован с выбранными $\alpha$ и power. Это design input, а не постфактум граница важности.

## Как выбрать процедуру

- Difference of means: Welch t-test по умолчанию безопаснее equal-variance t-test.
- Paired observations: paired test на внутри-парных differences.
- Proportions: z-test, exact method или regression с корректным SE в зависимости от размера и дизайна.
- Counts: Poisson/Negative Binomial model при соответствующем data-generating process.
- Skewed metrics: bootstrap или robust estimator, сохраняя randomization unit.
- Arbitrary statistic: permutation test, если exchangeability согласуется с дизайном.
- Categories: chi-square при достаточных expected counts; exact methods для малых tables.

Название теста выбирается после estimand, unit, design и assumptions.

## Multiple testing и sequential peeking

При множестве hypotheses вероятность хотя бы одного false positive растёт. Методы:

- Bonferroni/Holm контролируют family-wise error rate;
- Benjamini–Hochberg контролирует false discovery rate.

Обычный fixed-horizon p-value становится некорректным при постоянном peeking и остановке «когда стало значимо». Нужны заранее заданный horizon или sequential design с alpha spending / always-valid inference.

## Практическая интерпретация

Результат должен содержать:

- estimate effect в бизнес-единицах;
- confidence interval;
- sample sizes и analysis unit;
- primary metric и guardrails;
- assumptions и data-quality checks;
- сравнение с MDE или decision threshold;
- решение и риск ошибки.

`p < 0.05` без этих пунктов — недостаточный вывод.

## Что если предположения нарушены

- Зависимые observations → cluster-aware SE или aggregation по randomization unit.
- Heteroscedasticity → Welch/robust SE.
- Skew/heavy tails → bootstrap/robust estimators, но не слепая вера в asymptotics.
- Sample ratio mismatch → сначала проверить instrumentation и randomization.
- Selection после просмотра данных → явно учитывать researcher degrees of freedom.

## Связи

- [[LLN CLT and Standard Error]] — источник normal approximation и denominator test statistic.
- [[Expectation Variance Covariance and Correlation]] — variance определяет precision.
- [[Conditional Probability and Bayes Theorem]] — posterior probability и p-value отвечают на разные вопросы.
- [[Random Variables and Distributions]] — data type и distribution влияют на выбор model/test.
