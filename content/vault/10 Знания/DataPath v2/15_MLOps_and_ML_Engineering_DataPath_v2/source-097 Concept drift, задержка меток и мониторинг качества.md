---
title: "Concept drift, задержка меток и мониторинг качества"
id: concept.datapath-v2.097
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 97
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Concept drift: когда прежняя зависимость между X и y перестала работать

Suppose credit model learned:
```text
income high
→ lower default risk
```

Later economic conditions change:
- layoffs affect a previously stable industry;
- repayment behavior changes;
- product rules change.

Inputs may look similar, but:

\[
P(Y|X)
\]

has changed.

This is **концептуальный дрейф (concept drift)**.

Unlike ordinary data drift, detecting true concept drift requires ground truth labels, at least eventually.

---

## 1. Why data drift cannot prove quality loss

Case A:
```text
age population changed
model remains equally accurate
```

Case B:
```text
features distributions stable
fraud strategy changed
model recall collapses
```

Therefore:
```text
P(X) monitor
```
is not enough.

Need:
```text
Y / business outcome
```

---

## 2. Label delay

Many targets arrive later.

Examples:
```text
fraud confirmed after 30 days
default after 90 days
churn after 30 days
medical outcome after weeks
```

At prediction time you don't know correctness.

This is **задержка метки (label delay)**.

Monitoring architecture must join predictions with labels later.

---

## 3. Prediction log for future join

Store safely:
```text
prediction_id
entity/event ID
prediction_time
model_version
score
decision
```

When label arrives:
```text
prediction_id/entity
target
label_time
```

Then build evaluation table.

Without this linkage, delayed quality cannot be calculated.

---

## 4. Point-in-time correctness

When joining labels, ensure target corresponds to prediction horizon.

Prediction:
```text
1 June → default in next 90 days
```

Label cannot be:
```text
ever defaulted in future
```

Monitoring target definition must exactly match training target.

---

## 5. Quality over time

Track:
```text
metric by prediction week/month
```

not label-arrival date.

A March prediction whose label arrived June belongs to March cohort.

Otherwise temporal quality trend is misaligned.

---

## 6. Classification metrics

Depending task:
- AP / PR-AUC;
- ROC-AUC;
- precision;
- recall;
- F1;
- calibration;
- threshold-specific cost.

Use same business-relevant metrics as validation.

---

## 7. Regression metrics

Track:
- MAE;
- RMSE;
- quantile errors;
- bias:
\[
mean(\hat y-y)
\]
- segment errors.

Average RMSE can hide systematic underprediction in one group.

---

## 8. Calibration monitoring

Reference:
```text
predicted risk ~0.2
actual rate ~0.2
```

Later:
```text
predicted ~0.2
actual ~0.4
```

Ranking might remain good while calibration deteriorates.

For expected-loss/business probability decisions, this is serious concept/prior change.

---

## 9. Delayed metric censoring

If today is August 13 and churn horizon 30 days, predictions from August 10 do not have mature labels.

Do not calculate quality on incomplete cohort.

Define:
```text
label maturity cutoff
```

Only evaluate predictions old enough.

---

## 10. Partial labels bias

Fraud labels may only exist for manually investigated transactions.

If model itself determines which cases investigators see, observed labels are selective.

Then measured precision/recall can be biased.

This is feedback loop / selective labels problem.

---

## 11. Feedback loops

Recommendation model promotes items → items get clicks → training data says promoted items popular.

Credit model approves certain applicants → repayment labels observed mainly among approved.

Model influences future data.

Monitoring must understand policy/data-collection mechanism.

---

## 12. Champion behavior changes business

Suppose fraud model blocks risky transactions.

Observed fraud rate drops.

This could mean:
- model works;
- attackers changed strategy;
- labels missing blocked attempts.

Business metric and model metric interpretation becomes causal/system-level.

---

## 13. Baseline comparison

Monitor model against simple baseline:
```text
constant
previous rule
seasonal baseline
```

If model metric drops but baseline drops equally, environment became harder.

If model collapses while baseline stable, model-specific degradation likely.

---

## 14. Slice quality

Track:
```text
region
product
new/existing users
device
language
risk band
```

Concept drift may occur in only one segment.

Global AP:
```text
0.58 → 0.56
```
looks minor.

But:
```text
new users 0.55 → 0.20
```
is severe.

---

## 15. Cohort volume

Metric with 20 positives is unstable.

Always show:
```text
sample count
positive count
confidence interval where useful
```

Don't alert on one week tiny cohort without uncertainty consideration.

---

## 16. Control charts / rolling windows

Track rolling metric:
```text
7-day
30-day
```

Compare reference range.

Short window detects fast degradation but noisy.

Long window stable but slow.

Often show both.

---

## 17. Statistical uncertainty

A metric change:
```text
0.60 → 0.57
```
may be sampling noise.

Use:
- bootstrap confidence interval;
- paired testing where appropriate;
- minimum sample threshold.

Operational alert should consider magnitude and persistence.

---

## 18. Concept drift forms

### Sudden
Policy/economy changes overnight.

### Gradual
User behavior slowly shifts.

### Recurring
Seasonal regime returns.

### Local
Only one segment.

Monitoring window design should match possible dynamics.

---

## 19. Prior/label shift

If:
```text
P(Y)
```
changes but class-conditional structure maybe stable.

Example fraud prevalence:
```text
1% → 3%
```

Precision/calibration can change significantly.

This may require threshold/calibration adjustment even without full model retrain.

---

## 20. Threshold decay

Model ranking same, but business cost/prevalence changed.

Old threshold:
```text
0.31
```
may no longer satisfy:
```text
recall >= 80%
```

Threshold is a monitored/revalidated parameter too.

---

## 21. Retrain signal

A reasonable retrain trigger can combine:
```text
mature quality below threshold
+
enough new labeled data
+
stable degradation
```

Not:
```text
one drift alert
```

Retraining without new relevant labels cannot magically learn new concept.

---

## 22. Recalibration vs retraining

If:
```text
ranking AUC stable
calibration poor
```

maybe recalibrate.

If:
```text
ranking quality collapses
```

likely need feature/model retraining.

Diagnosis matters.

---

## 23. Business metric

Model metric:
```text
AP
```

Business:
```text
fraud loss prevented
manual review workload
conversion
```

Production success should monitor both.

A higher recall may overwhelm review team and worsen actual business process.

---

## 24. Counterfactual problem

If model denies loan, we don't observe whether person would have defaulted under approval.

Some decisions create unobservable counterfactual outcomes.

This is beyond simple supervised monitoring and leads to causal/off-policy evaluation concerns.

Know the limitation rather than fabricating "true accuracy".

---

## 25. Model degradation incident workflow

Alert:
```text
recall mature cohort down 20%
```

Investigate:
1. label pipeline correct?
2. metric code/version?
3. data drift?
4. segment?
5. model version?
6. business/policy change?
7. enough labels?
8. challenger available?

---

## 26. Quality dashboard

Show:
```text
mature cohort date
sample count
positive count
primary metric
threshold metric
calibration
segment table
model version
```

Do not mix immature recent predictions into same curve.

---

## 27. Интерактивная визуализация DataPath

### Label delay timeline

Prediction → waiting → mature label.

### Same P(X), changed P(Y|X)

Input distributions identical, decision boundary moves.

### Calibration drift

Reliability curve reference/current.

### Feedback loop

Model decision changes which labels become observable.

---

## 28. Типичные ошибки

**«No data drift means model quality stable».**\
False.

**«Evaluate recent predictions before labels mature».**\
Biased/incomplete.

**«Label arrival date is prediction cohort date».**\
No.

**«Observed labels always representative».**\
Selective-label bias possible.

**«Quality drop always means retrain».**\
Could be label bug/calibration/threshold/business change.

**«Business metric equals model metric».**\
No.

---

## 29. Проверка понимания

1. Data drift vs concept drift?
2. Why labels required?
3. What is label delay?
4. Why prediction logging needed?
5. What is maturity cutoff?
6. Feedback loop example?
7. Why slice quality?
8. Calibration vs ranking degradation?
9. When recalibrate instead of retrain?
10. Why business metric needed?

---

## 30. Мини-практика

Default model:
```text
90-day label delay
ROC-AUC stays 0.78
calibration worsens
default rate 4→9%
```

Decide:
1. what changed?
2. should threshold change?
3. recalibration or retrain?
4. which cohorts mature?
5. what business metric track.

---

## Что нужно унести

1. Concept drift changes relationship between X and y.
2. It can happen without visible input drift.
3. Delayed labels require prediction-to-label joins.
4. Evaluate by prediction cohort after maturity.
5. Selective labels/feedback loops can bias monitoring.
6. Ranking, calibration and threshold behavior are distinct.
7. Quality must be sliced and uncertainty-aware.
8. Retrain requires evidence and relevant new labels.
9. Recalibration may be enough when ranking remains good.
10. Next: make every experiment/model version traceable and reproducible.

## Куда дальше

Once degradation detected, you need answer:
> **which training run produced current model, with which data/code/parameters?**

This is versioning, experiment tracking and model registry.

## Источники
- Standard supervised model-monitoring and delayed-label methodology.
