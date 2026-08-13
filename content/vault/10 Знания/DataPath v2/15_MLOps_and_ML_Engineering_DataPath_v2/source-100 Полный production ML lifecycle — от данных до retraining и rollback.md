---
title: "Полный production ML lifecycle — от данных до retraining и rollback"
id: concept.datapath-v2.100
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 100
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Полный production ML lifecycle

Это финальная глава канонического корпуса DataPath v2.

Её задача — соединить всё, что до этого было отдельными темами:

```text
data science
+
software engineering
+
monitoring
+
model lifecycle
```

В реальной работе модель не заканчивается на:

```python
model.fit(...)
```

Она живёт в цикле:

```text
problem
→ data
→ model
→ artifact
→ service
→ deployment
→ monitoring
→ labels
→ evaluation
→ challenger
→ deployment
→ ...
```

---

# Фаза 1. Business problem

## 1. Prediction contract before training

Example:
> On first day of month predict probability active client will churn in next 30 days.

Define:
```text
entity
prediction moment
horizon
target
business action
metric
latency mode
```

This contract later determines serving and monitoring.

---

## 2. Online vs batch

If marketing runs once/day:
```text
batch predictions
```
may be simpler than HTTP API.

If checkout needs risk score in 30 ms:
```text
online service
```

MLOps architecture follows product need, not fashion.

---

# Фаза 2. Data and validation

## 3. Source lineage

Record:
```text
data sources
cutoff
schema
query/version
```

Build point-in-time correct features.

No production infrastructure rescues leakage.

---

## 4. Split

Choose:
- random;
- group;
- time;
- group-time.

Final test untouched.

This same temporal/entity logic must later be used in monitoring cohorts.

---

# Фаза 3. Experiment

## 5. Baseline

Build:
```text
simple business rule
simple ML baseline
```

Then stronger model.

Track experiments:
```text
run_id
code
data
parameters
metrics
```

---

## 6. Model selection

Compare:
```text
quality
stability
calibration
latency
size
interpretability
```

Not only leaderboard maximum.

---

# Фаза 4. Artifact

## 7. Freeze winning pipeline

Store:
```text
preprocessing
model
threshold
schema
metadata
dependencies
validation report
```

Assign immutable version.

---

## 8. Golden examples

Create known requests:
```text
A → expected probability ~0.21
B → ~0.88
```

They become contract regression tests across serving/container changes.

---

# Фаза 5. Serving

## 9. FastAPI

Endpoints:
```text
POST /predict
POST /predict-batch
GET /health
GET /ready
GET /model-info
```

Pydantic validates input/output.

Model loads once at startup.

---

## 10. Error policy

Invalid request:
```text
4xx
```

Internal failure:
```text
5xx
```

Never silently return default prediction after exception.

---

# Фаза 6. Container

## 11. Docker

Build image containing:
```text
application code
dependencies
optionally model artifact
startup command
```

Run golden integration request in container.

Record:
```text
image tag
image digest
model version
```

---

# Фаза 7. Deployment

## 12. First production release

Before traffic:
```text
readiness
artifact checksum
schema
smoke test
```

Then start controlled traffic.

For first simple project, one stable instance may be enough.

No Kubernetes needed to understand lifecycle.

---

# Фаза 8. Service observability

## 13. Monitor immediately

```text
request rate
5xx rate
p50/p95/p99
memory/CPU
in-flight
model version
```

Structured logs with request IDs.

---

## 14. Prediction behavior

Without labels:
```text
score distribution
class distribution
unknown category rate
fallback rate
```

This detects strange behavior quickly.

---

# Фаза 9. Data monitoring

## 15. Reference window

Save reference statistics from appropriate training/stable production data.

Compare current:
```text
missing
quantiles
category frequencies
drift
```

Use both rules and statistics.

---

## 16. Don't overreact

Data drift:
```text
alert
```
means:
```text
investigate
```

not:
```text
retrain automatically now
```

Check:
- upstream bug;
- seasonality;
- segment change.

---

# Фаза 10. Delayed labels

## 17. Prediction ledger

Store:
```text
prediction_id
time
entity
score
decision
model_version
```

Later join true labels.

Respect privacy/data retention.

---

## 18. Cohort maturity

For 30-day target:
```text
do not evaluate yesterday's predictions
```

Only mature cohorts.

Plot metric by prediction date.

---

# Фаза 11. Quality monitoring

## 19. Track same metrics as validation

Example:
```text
AP
recall at required precision
calibration
business cost
```

Also segments.

If offline metric and production metric definitions differ, comparisons meaningless.

---

## 20. Diagnose degradation

If AP dropped:
1. labels correct?
2. data pipeline?
3. model version?
4. drift?
5. segment?
6. concept change?
7. calibration?
8. threshold?

Do not jump straight to algorithm change.

---

# Фаза 12. Retraining trigger

## 21. Conditions

Possible:
```text
mature AP below 0.50 for 2 cohorts
AND
>= 20k new labeled examples
```

or scheduled monthly review.

Trigger should be explicit and measurable.

---

# Фаза 13. Retraining run

## 22. Rebuild from versioned inputs

Training job receives:
```text
data cutoff
feature version
code commit
config
```

Logs run.

Outputs:
```text
candidate artifact
evaluation report
validation predictions
```

---

# Фаза 14. Champion/challenger

## 23. Same benchmark

Evaluate:
```text
champion
challenger
```
on same current holdout.

Compare:
```text
quality
segments
calibration
latency
model size
```

---

## 24. Candidate gate

Example:
```text
AP >= champion + .01
p95 <= 50ms
no critical segment worse > .02
artifact/container tests pass
```

If fail:
```text
reject
```

No deployment just because retraining completed.

---

# Фаза 15. Registry

## 25. Register exact artifact

```text
churn_prediction
version 19
source_run=...
validation_status=passed
```

Set candidate/challenger alias/tag as workflow requires.

Lineage preserved.

---

# Фаза 16. Shadow / canary

## 26. Shadow first

Champion continues decisions.

Challenger gets same live inputs, output logged.

Check:
```text
latency
errors
input compatibility
score distribution
```

---

## 27. Canary if appropriate

Small traffic:
```text
5%
```

Monitor guardrails.

Increase:
```text
5 → 20 → 50 → 100
```

only if stable.

For high-stakes tasks, approval process may be stricter.

---

# Фаза 17. Promotion

## 28. Champion changes

Current alias/deployment pointer moves to challenger only after gates.

Record deployment event:
```text
time
app version
model version
config/threshold
```

Monitoring dashboard gets marker.

---

# Фаза 18. Rollback

## 29. Something goes wrong

At 20% canary:
```text
p95 40→400ms
```

Immediate:
```text
route back old champion
```

Then debug challenger offline.

Rollback is a designed feature, not emergency improvisation.

---

# Фаза 19. Post-deploy quality

## 30. Labels arrive later

Now compare champion-era/challenger-era cohorts carefully.

If new model:
- service healthy;
- but mature quality bad,

rollback/revise according to risk.

---

# Фаза 20. Documentation

## 31. Minimal release record

For each production model:
```text
purpose
owner
source run
data cutoff
metrics
threshold
known limitations
artifact checksum
container/image
deploy time
rollback version
```

This can be one Markdown/registry record in small team.

---

# Full project structure

## 32. Example repository

```text
project/
├── src/
│   ├── features.py
│   ├── train.py
│   ├── evaluate.py
│   └── model.py
├── service/
│   ├── main.py
│   └── schemas.py
├── tests/
│   ├── test_features.py
│   ├── test_api.py
│   └── test_golden.py
├── monitoring/
│   └── reference.json
├── configs/
│   └── train.yaml
├── Dockerfile
├── requirements.lock
└── README.md
```

No need 40 microservices to demonstrate mature ML engineering.

---

# What to test

## 33. Unit tests

Examples:
```text
feature calculation
schema validators
threshold logic
```

---

## 34. Integration tests

```text
load real artifact
→ API request
→ expected response structure
```

---

## 35. Golden regression tests

Known sample produces expected score within tolerance.

---

## 36. Data tests

Training:
```text
schema
target
time windows
```

Production:
```text
required fields
ranges
missing spikes
```

---

## 37. Performance test

```text
p95 latency
throughput
memory
```

for candidate.

---

# Interview-level system design

## 38. Strong answer

Question:
> How would you deploy and monitor your model?

Strong compact answer:

> I would save preprocessing and estimator as one versioned artifact with input/output schema and threshold. Serve it through FastAPI with Pydantic validation, health/readiness and structured logs, package the runtime in Docker and expose service latency/error metrics. I would monitor input missingness/distributions and prediction scores immediately, then join delayed ground truth to predictions and track the same quality/calibration metrics used offline. Each training run is tied to code/data/config in experiment tracking, selected artifacts go to a model registry. A new challenger must beat the champion on the same holdout and pass latency/schema/segment checks, then goes through shadow or canary rollout with rollback available.

This demonstrates end-to-end understanding without buzzword soup.

---

# What not to add yet

## 39. Kubernetes

Useful at larger orchestration scale, but not needed to learn core ML lifecycle.

## 40. Kafka

Useful for event streaming when requirements demand it.

Not every prediction service needs message broker.

## 41. Feature Store

Useful when many models share online/offline features.

For one project:
```text
well-tested feature code + Pipeline
```
may be enough.

## 42. Airflow

Useful for scheduled DAG orchestration.

A simple cron/script can teach first retraining workflow.

Principle:
> add infrastructure when a concrete constraint requires it.

---

# Failure scenarios capstone

## 43. Scenario A — API works, model bad

```text
200 rate 100%
p95 20ms
AP 0.55→0.31
```

Investigate data/labels/concept/model, not FastAPI.

---

## 44. Scenario B — drift but quality stable

```text
income PSI high
AP stable
business metric stable
```

Investigate/monitor, no automatic retrain.

---

## 45. Scenario C — challenger better but slow

```text
AP +0.04
p95 3× SLA
```

Reject/optimize.

---

## 46. Scenario D — new model returns many class C

Immediately after deployment:
```text
class C 10%→80%
```

Check:
- model/config;
- preprocessing;
- threshold;
- schema;
- real traffic change.

Rollback if operationally unsafe.

---

## 47. Scenario E — retraining job target rate 0

Stop pipeline.

Check label extraction.

Never promote.

---

## 48. Scenario F — unknown category spikes

Service didn't crash because OHE ignores unknown.

But model information degraded.

Investigate upstream/new category and retrain only after understanding.

---

# Интерактивная визуализация DataPath

## 49. Lifecycle simulator

Full map:

```text
DATA
↓
TRAIN
↓
TRACK
↓
REGISTER
↓
SERVE
↓
MONITOR
↓
LABELS
↓
RETRAIN
```

Learner receives incidents and must decide where to act.

### Incident cards
- missing feature;
- high latency;
- data drift;
- concept drift;
- failed challenger;
- model artifact mismatch.

Wrong action shows consequence.

Example:
```text
Data pipeline bug
→ learner chooses retrain
→ new model trains on corrupted data
→ quality drops further
```

This should be the final systems-thinking exercise.

---

# Capstone project

## 50. Assignment

Take a trained tabular model and build:

```text
1. sklearn Pipeline artifact
2. metadata/version
3. Pydantic request/response
4. FastAPI predict endpoint
5. health/readiness
6. Docker image
7. structured logging
8. latency/error metrics
9. reference feature stats
10. drift report
11. delayed-label evaluation script
12. experiment tracking
13. model registry record
14. challenger comparison
15. rollback procedure
```

No Kubernetes required.

This is enough for a serious junior DS/ML Engineer portfolio project.

---

# Final mental model

A production ML system has five layers:

## Data
Are inputs and labels correct/current?

## Model
Does predictor generalize and remain calibrated/useful?

## Software
Can artifact load and serve reliably?

## Observability
Can we detect and explain incidents?

## Lifecycle
Can we reproduce, compare, update and rollback safely?

If one layer missing, "production ML" is incomplete.

---

## Типичные ошибки

**«MLOps = Docker».**\
Docker is only runtime packaging.

**«Monitoring = CPU/RAM».**\
Need data/model/business quality too.

**«Drift = retrain».**\
No.

**«Registry automatically makes system production-ready».**\
No.

**«Best model should always become champion».**\
Only after full constraints.

**«Need Kubernetes to call project MLOps».**\
No.

**«Automation removes need for ML methodology».**\
No; it automates good or bad process equally.

---

## Проверка понимания

1. What components make artifact?
2. Why health/readiness?
3. Service metric vs model metric?
4. Data vs concept drift?
5. Why label maturity?
6. What experiment tracking gives?
7. Registry role?
8. Champion/challenger comparison?
9. Shadow vs canary?
10. Why rollback?
11. When retrain?
12. Why not infrastructure for its own sake?

---

## Что нужно унести из всего блока

1. Training is only the beginning of model lifecycle.
2. Artifact includes preprocessing/schema/threshold/metadata.
3. FastAPI exposes a typed inference contract.
4. Docker makes runtime reproducible.
5. Logs/metrics show service behavior.
6. Data drift and prediction drift are early warning signals.
7. True model quality needs labels and mature cohorts.
8. Concept drift can happen without visible X drift.
9. Experiment tracking gives run provenance.
10. Model registry manages selected release versions and lineage.
11. Challenger must pass quality and engineering gates.
12. Shadow/canary reduce rollout risk.
13. Rollback requires immutable previous releases.
14. Retraining is a controlled decision, not automatic reaction.
15. MLOps at DS/ML Engineer level is a disciplined lifecycle, not a pile of infrastructure.

## Куда дальше

Урок №100 завершает основную каноническую линию DataPath v2.

Следующий этап уже не добавление новой темы, а интеграция корпуса в приложение:
- сопоставить новые крупные уроки старым маленьким сценам;
- сохранить стабильную архитектуру DataPath 1.0;
- обновлять lessons по curriculum blocks;
- провести один content-validator и representative Focus smoke-test на блок;
- не переделывать Atlas/Review/schema без необходимости.

## Источники
- FastAPI official documentation.
- Docker official documentation.
- Prometheus instrumentation guidance.
- MLflow Tracking and Model Registry documentation.
- Previous canonical DataPath lessons and ML validation principles.
