---
title: "Проверка гипотез и A/B: p-value, ошибки I/II рода, power и multiple testing"
id: concept.datapath-v2.032
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 32
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Проверка гипотез и A/B: p-value, ошибки I/II рода, power и multiple testing

A/B test — не просто сравнить две averages. Нужно заранее определить metric, unit randomization, null hypothesis, минимально важный effect и stopping rule. Иначе p-value легко превратить в генератор случайных побед.

## H0/H1

Null hypothesis H0 обычно утверждает отсутствие определённого effect. Alternative H1 — effect есть/имеет направление. Test statistic измеряет несовместимость data with H0.

## p-value

p-value = вероятность получить statistic не менее экстремальную при условии, что H0 верна и assumptions выполнены. Это не probability H0 true и не probability result случайный.

## Type I/II

Type I: reject true H0 (false positive), probability alpha. Type II: fail to reject false H0. Power=1-beta — probability detect effect определённого размера.

## Effect size

Statistical significance не равна practical significance. На millions users tiny +0.01% can be significant but worthless. Define minimum detectable/important effect before test.

## Randomization unit

Если treatment assigned user-level, анализировать события как independent rows может завысить effective n. Unit analysis/variance should respect randomization/clustering.

## Multiple testing

Проверили 100 independent hypotheses at alpha=0.05 — несколько false positives expected. Use planned metrics, corrections like Bonferroni/FDR depending goal, not post-hoc cherry-picking.

## Peeking

Repeatedly checking p-value and stopping when <0.05 inflates false-positive rate under fixed-horizon test. Use fixed horizon or sequential-testing method designed for peeking.

## Практический код

```python
# Conceptual experiment table
# user_id | variant | converted | revenue

summary = (
    df.groupby("variant")["converted"]
      .agg(["mean", "count"])
)
print(summary)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- p-value трактовать как P(H0 true)
- игнорировать effect size
- randomize users but analyze events iid
- peeking до significance
- тестировать десятки metrics без correction
- после результата менять primary metric

## Проверка понимания

1. Что такое H0?
2. p-value interpretation?
3. Type I vs II?
4. Power?
5. Why effect size?
6. What is randomization unit?
7. Why multiple testing/peeking dangerous?

## Мини-практика

Спроектируйте A/B для новой checkout page: primary metric, randomization unit, guardrails, minimum effect, sample-size/power inputs, stopping rule и post-analysis.

## Что нужно унести

Хороший A/B test — заранее спроектированное измерение causal effect через randomization. p-value — один инструмент решения, а не сама цель.

## Куда дальше

Финал математического блока — MLE/MAP: почему многие loss functions являются отрицательным log-likelihood.
