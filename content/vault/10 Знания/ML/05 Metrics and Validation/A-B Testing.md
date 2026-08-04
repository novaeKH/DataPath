---
title: A-B Testing
type: concept
area: ml
status: active
aliases:
  - AB Testing
  - A/B-тестирование
  - Online experiment
tags:
  - experimentation
  - math/statistics
math_depth: 2
id: concept.ml.a-b-testing
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# A-B Testing

## Идея за 30 секунд

A/B test случайно назначает независимые units в control и treatment, чтобы оценить causal effect изменения. До запуска фиксируют estimand, randomization unit, primary metric, guardrails, MDE, power и stopping rule. После запуска сначала проверяют instrumentation и SRM, затем effect size и confidence interval, а не только p-value.

## Зачем нужен experiment

Offline correlation и model score не отвечают, что **изменение продукта** вызовет изменение outcome. Randomization делает treatment assignment независимым от потенциальных исходов в expectation и уменьшает confounding.

Experiment всё равно не защищает от broken logging, interference, attrition и неверного estimand.

## Design checklist

1. Hypothesis и mechanism.
2. Population eligibility.
3. Randomization unit.
4. Treatment/control definition.
5. Primary metric.
6. Guardrails.
7. Analysis unit и aggregation.
8. MDE, $\alpha$, power, sample size/duration.
9. Stopping/sequential rule.
10. Instrumentation и A/A readiness.

## Estimand

Average Treatment Effect:

$$
\operatorname{ATE}
=\mathbb{E}[Y(1)-Y(0)].
$$

$Y(1)$ и $Y(0)$ — potential outcomes одного unit под treatment/control. Одновременно наблюдаем только один; randomization позволяет сравнить group means.

Estimate:

$$
\widehat{\Delta}
=\bar{Y}_T-\bar{Y}_C.
$$

Важно назвать:

- intention-to-treat или treatment-on-treated;
- absolute или relative effect;
- user-level или event-level outcome;
- horizon.

## Randomization unit и analysis unit

Если randomize users, events одного user зависимы. Naive event-level SE переоценивает effective sample size.

Варианты:

- агрегировать metric на user;
- cluster-robust SE;
- randomize на cluster, если есть interference внутри cluster.

Unit выбирается по механизму exposure и spillover.

## MDE, power и sample size

MDE — smallest effect, который design должен reliably detect. Приблизительно required sample растёт как:

$$
n
\propto
\frac{
\sigma^2
(z_{1-\alpha/2}+z_{1-\beta})^2
}{
\delta^2
},
$$

где $\sigma^2$ — metric variance, $\delta$ — MDE, $1-\beta$ — power. Formula меняется по metric/design, но trade-offs сохраняются:

- smaller MDE → резко больше sample;
- higher variance → больше sample;
- higher power → больше sample.

Duration также должна покрывать weekly seasonality и label maturation.

## A/A test

A/A назначает одинаковый experience в обе groups и проверяет:

- randomization;
- logging;
- SRM rate;
- empirical false positive behavior;
- metric pipeline;
- variance/sample-size assumptions.

A/A не доказывает будущую корректность treatment implementation, но ловит инфраструктурные дефекты.

## Sample Ratio Mismatch

SRM — observed allocation существенно отличается от planned. Проверяется, например, chi-square test counts.

SRM может указывать на:

- assignment bug;
- eligibility после randomization;
- differential logging;
- bot/filter logic;
- treatment-specific crashes.

При SRM нельзя просто продолжать обычный effect analysis: сначала найти mechanism.

## Confidence interval и решение

Отчёт:

- $\widehat{\Delta}$ в business units;
- confidence interval;
- relative effect с корректным denominator;
- primary metric и guardrails;
- sample sizes и exclusions;
- SRM/instrumentation checks;
- planned MDE;
- segment analysis только с multiplicity/context.

Statistical significance без practical significance недостаточна.

## Multiple testing

Множество metrics/segments/variants увеличивает false positives.

- заранее выбрать primary metric;
- guardrails интерпретировать по назначению;
- Holm/Bonferroni для family-wise control;
- Benjamini–Hochberg для FDR при discovery;
- exploratory findings помечать и подтверждать.

## Sequential testing

Постоянный peeking с fixed-horizon p-value повышает Type I error. Варианты:

- не смотреть decision statistic до planned horizon;
- заранее применить group-sequential design/alpha spending;
- always-valid confidence sequences/e-values при подходящей процедуре.

Остановка по operational incident допустима, но analysis должен это отражать.

## CUPED

Использует pre-experiment covariate $X$ для уменьшения variance:

$$
Y_{\text{cuped}}
=Y-\theta(X-\mathbb{E}[X]).
$$

Если $X$ коррелирует с outcome и измерен до treatment, variance effect estimate уменьшается. Post-treatment covariate использовать нельзя: он может удалить часть causal effect или создать bias.

## Failure modes

- randomize user, считать events независимыми;
- фильтровать по post-treatment behavior;
- завершать при первом $p<0.05$;
- менять primary metric после просмотра;
- игнорировать novelty/seasonality;
- запускать overlapping experiments без interference policy;
- объявлять «нет эффекта» по non-significance без interval/MDE.

## Связи

- [[Hypothesis Testing and Confidence Intervals]] — test statistic, p-value, interval, power и multiplicity.
- [[LLN CLT and Standard Error]] — sampling uncertainty и effective sample size.
- [[Expectation Variance Covariance and Correlation]] — variance reduction и CUPED.
- [[Validation Splits and Data Leakage]] — offline generalization не заменяет causal experiment.
- [[ML Metrics and Threshold Selection]] — primary metric, guardrails и decision semantics.
- [[Probability Math and AB Testing — Interview]] — короткий формат.
