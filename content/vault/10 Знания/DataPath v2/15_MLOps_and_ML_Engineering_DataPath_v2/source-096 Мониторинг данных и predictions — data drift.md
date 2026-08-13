---
title: "Мониторинг данных и predictions — data drift"
id: concept.datapath-v2.096
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 96
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Мониторинг данных и predictions: data drift

Model trained on:
```text
January–June
```

Production runs:
```text
July–December
```

Even if code never changes, input population can.

Examples:
- prices rise;
- users migrate devices;
- marketing changes audience;
- upstream schema changes;
- sensor calibration shifts.

**Дрейф данных (data drift)** means distribution of model inputs changes between reference and current data.

Important:

> data drift is not automatically model-quality degradation.

It is a warning that model operates in a different regime.

---

## 1. Reference vs current window

Need define:
```text
reference data
current data
```

Reference can be:
- training set;
- recent stable production period;
- rolling baseline.

Current:
- today;
- last 7 days;
- last 10k predictions.

Choice affects sensitivity.

---

## 2. Schema drift before statistical drift

First check deterministic data quality:
```text
missing column
wrong dtype
category renamed
units changed
null spike
range impossible
```

If income suddenly stored in cents instead of dollars, complex drift metric unnecessary.

Data validation comes first.

---

## 3. Feature monitoring layers

For every important feature:
```text
missing rate
mean/median/quantiles
min/max
category frequency
histogram
```

Then statistical distance.

Simple descriptive charts catch many incidents.

---

## 4. Numeric drift

Reference:
```text
age median 36
p90 61
```

Current:
```text
median 55
p90 78
```

Clear population shift.

Could affect model if age used strongly.

---

## 5. Categorical drift

Reference device:
```text
iOS 40%
Android 55%
Other 5%
```

Current:
```text
iOS 25%
Android 35%
Other 40%
```

Maybe new device category or parsing bug.

Monitor:
- known categories;
- unseen rate;
- frequency distribution.

---

## 6. Missing-value drift

Training:
```text
income missing 2%
```

Production:
```text
45%
```

Even if imputer handles nulls, model receives less information.

This is high-priority signal.

---

## 7. Population Stability Index (PSI)

PSI is commonly used heuristic for binned distribution changes:

\[
PSI=
\sum_i
(p_i-q_i)
\ln\frac{p_i}{q_i}
\]

where \(p_i,q_i\) are proportions reference/current bins.

Useful because interpretable via bins.

But:
- depends on binning;
- threshold conventions are heuristic;
- small samples unstable.

Don't treat PSI=0.2 as universal law.

---

## 8. Kolmogorov–Smirnov statistic

For continuous distributions:
\[
KS=\sup_x |F_{ref}(x)-F_{cur}(x)|.
\]

Measures maximum difference between empirical CDFs.

Statistical p-value becomes extremely sensitive with huge samples: tiny irrelevant differences can be significant.

So monitor effect size + practical impact, not p-value alone.

---

## 9. Jensen–Shannon divergence

For discrete/binned distributions, JS divergence gives symmetric bounded-like measure derived from KL divergences.

Useful to compare:
- categories;
- histograms;
- score distributions.

Again threshold must be calibrated for your data.

---

## 10. Wasserstein distance

Intuitive for numeric values:
> amount of "mass movement" needed to transform one distribution into another.

Retains units of feature for 1D case, which can make business interpretation useful.

But scale-specific: 10 units income vs 10 units age are different.

---

## 11. Why no single drift metric

Different issues:
- mean shift;
- tail change;
- new category;
- missingness;
- multimodal shape.

One scalar cannot summarize all.

Use:
```text
data-quality rules
+ descriptive stats
+ selected drift tests
```

---

## 12. Multiple comparisons

1000 features × drift test each day:
many false alerts.

Need:
- prioritize model-important features;
- grouped alerts;
- effect-size thresholds;
- persistence over windows.

Don't page engineer because 37 weak features changed trivially.

---

## 13. Feature importance for monitoring priority

If model heavily depends on:
```text
recency
income
```

drift there more concerning than unused diagnostic column.

But don't monitor only top importance: a feature with low average importance may be critical in one segment.

---

## 14. Prediction drift

Even if inputs look stable:
```text
prediction score distribution
```
may change.

Reference:
```text
mean score 0.18
```

Current:
```text
0.31
```

Possible:
- feature interactions;
- drift in combination not marginally visible;
- model version change.

Monitor score/class distribution too.

---

## 15. Multivariate drift

Marginal features individually unchanged can have changed correlations.

Example:
```text
age distribution same
income distribution same
but age-income relationship changed
```

Multivariate detectors/classifier-based drift can detect this.

Simpler idea:
train classifier:
```text
reference=0
current=1
```

If classifier distinguishes periods well, joint distribution changed.

---

## 16. Drift classifier

Combine ref/current:
```text
label period
```

Train validation classifier.

If AUC ~0.5:
hard to distinguish.

If high:
current differs.

Feature importance of drift classifier suggests what changed.

But avoid leakage from timestamp/technical IDs.

---

## 17. Segment drift

Global data stable but one region changes:
```text
region A normal
region B severe drift
```

Monitor key business segments.

Global averages hide local incidents.

---

## 18. Time windows

Too short:
- noisy alerts.

Too long:
- slow detection.

Possible:
```text
daily fast checks
7-day stable drift report
```

Choose based rate/seasonality.

---

## 19. Seasonality

Retail:
```text
December != July
```

Comparing December to November may flag expected seasonality.

Better reference:
- same month last year;
- rolling seasonal baseline;
- season-aware thresholds.

Drift does not mean anomaly if expected periodic behavior.

---

## 20. Data drift vs covariate shift

Often production monitoring uses "data drift" broadly.

More formal:
- covariate shift: \(P(X)\) changes while \(P(Y|X)\) assumed stable;
- prior/label shift: \(P(Y)\) changes;
- concept drift: relationship \(P(Y|X)\) changes.

Monitoring terminology should be explicit.

---

## 21. Drift ≠ retrain trigger automatically

If age shifts but model score/quality stable:
retraining might be unnecessary.

Drift should trigger:
```text
investigation
```

Retrain when evidence says current model no longer appropriate and new labeled data can improve it.

---

## 22. Upstream bug vs real drift

Missing rate spike:
```text
2% → 80%
```

Could be:
- genuine behavior?
- broken data pipeline.

Always first ask:
> did data generation change?

Retraining model on corrupted pipeline would make incident worse.

---

## 23. Monitoring unseen category rate

For OHE:
```text
handle_unknown="ignore"
```
keeps API alive.

But model sees all zeros for new categories.

Monitor:
```text
unknown_rate
```

Operational robustness is not semantic robustness.

---

## 24. Feature range validation

Training:
```text
age 18–90
```

Current:
```text
999
```

Better to alert/reject upstream rather than include in drift histogram and continue.

Quality rules and drift complement each other.

---

## 25. Dashboard

For each important feature:
```text
reference/current hist
missing %
drift score
sample count
```

Plus:
```text
prediction score distribution
unknown category rate
```

Avoid dashboard of 1000 unprioritized features.

---

## 26. Alerts

Example:
```text
income missing > 10%
OR
unknown city > 5%
OR
persistent high drift for 3 windows
```

Alert should include:
- feature;
- reference/current stats;
- model version;
- source pipeline.

---

## 27. Интерактивная визуализация DataPath

### Distribution shift

Move mean/variance and see PSI/KS/Wasserstein react differently.

### Hidden multivariate shift

Marginals same, correlation flips; univariate monitors miss it.

### Seasonality

December compared to November vs previous December.

### Incident diagnosis

Choose:
```text
real population shift
upstream bug
expected seasonality
```

---

## 28. Типичные ошибки

**«Any drift means model bad».**\
No.

**«p-value significant means business-important drift».**\
Not necessarily.

**«PSI thresholds universal».**\
No.

**«handle_unknown ignore means no need monitor new categories».**\
No.

**«Retrain immediately after drift alert».**\
First investigate.

**«Only marginal feature monitoring enough».**\
Can miss multivariate change.

---

## 29. Проверка понимания

1. Reference vs current?
2. Schema drift vs statistical drift?
3. PSI limitations?
4. KS meaning?
5. Why p-values problematic at large N?
6. What prediction drift says?
7. How detect multivariate drift?
8. Why seasonality?
9. Drift vs concept drift?
10. Why drift isn't automatic retrain trigger?

---

## 30. Мини-практика

Model trained Jan–Jun.

August:
```text
age stable
income median +8%
income missing 2→3%
new tariff 25%
score positive rate 10→28%
```

Plan:
1. what is strongest signal;
2. what upstream checks;
3. what segments;
4. whether retrain immediately;
5. what labels wait for.

---

## Что нужно унести

1. Data drift means input distribution changed.
2. Validate schema/quality before statistical tests.
3. Use descriptive stats + selected drift measures.
4. Drift thresholds are context-dependent.
5. Prediction drift is additional behavioral signal.
6. Multivariate relationships can change while marginals look stable.
7. Seasonality affects reference choice.
8. Unknown/missing rates are practical high-value metrics.
9. Drift triggers investigation, not automatic retrain.
10. To know actual quality, labels are needed.

## Куда дальше

Data drift can be detected without target.

But the more important question:
> **did the mapping from features to target stop working?**

That is concept drift and delayed quality monitoring.

## Источники
- Statistical distribution-comparison principles.
- Practical ML monitoring methodology.
