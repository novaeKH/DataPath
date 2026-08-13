---
title: "Логирование, метрики сервиса и observability"
id: concept.datapath-v2.095
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 95
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Логирование, метрики сервиса и observability

ML service may return correct predictions in tests and still fail in production because:
- latency grows;
- requests fail;
- one model version crashes;
- input volume spikes;
- memory leaks;
- downstream dependency slows down.

You need **наблюдаемость (observability)**: enough signals to answer:

> что происходит с системой сейчас и почему?

Three classic signal families:
```text
logs
metrics
traces
```

For a first ML service, logs + metrics already give enormous value.

---

## 1. Logs are events

A log is one event:
```text
2026-08-13 request_id=abc status=200 latency_ms=18 model=1.4.0
```

Useful for:
- individual failures;
- debugging request path;
- deployment investigation.

Bad logs are unstructured walls of text.

Better logs have consistent fields.

---

## 2. Structured logging

Instead of:
```text
"prediction worked for user abc"
```

prefer fields:
```json
{
  "event": "prediction_completed",
  "request_id": "abc",
  "status": 200,
  "latency_ms": 18.4,
  "model_version": "1.4.0"
}
```

Then systems can aggregate/filter reliably.

---

## 3. What not to log

Avoid raw:
- names;
- card/account numbers;
- medical text;
- full feature payloads;
- secrets/tokens.

If you need input monitoring, log:
- aggregates;
- hashed/pseudonymous IDs where appropriate;
- safe feature statistics;
- sampling.

Observability must respect privacy.

---

## 4. Request ID

Each request gets:
```text
request_id
```

Use same ID in:
- API log;
- model inference log;
- downstream calls.

Then one incident can be reconstructed across components.

---

## 5. Metrics are aggregates

Metrics answer:
```text
How many?
How fast?
How often failed?
```

Prometheus instrumentation guidance emphasizes for online-serving systems:
- request count;
- errors;
- latency.

This maps perfectly to ML inference API.

---

## 6. Counter

A **counter** only increases.

Examples:
```text
requests_total
prediction_errors_total
```

Use rate over time:
```text
requests / second
errors / minute
```

Don't use counter for current memory usage.

---

## 7. Gauge

A **gauge** can increase/decrease.

Examples:
```text
in_flight_requests
queue_size
loaded_model_info
memory_bytes
```

Useful for current state.

---

## 8. Histogram

Latency distribution cannot be understood from average alone.

Histogram buckets allow approximate quantiles:
```text
p50
p95
p99
```

Example:
```text
average = 30 ms
p95 = 40 ms
p99 = 900 ms
```

Average hides rare severe slowdown.

---

## 9. Why p95 matters

If SLA:
```text
95% requests < 100 ms
```

then p95 directly matches user experience target.

p99 captures tail incidents.

Do not optimize only mean latency.

---

## 10. Basic service metrics

Minimum:

```text
prediction_requests_total
prediction_errors_total
prediction_latency_seconds
in_flight_requests
```

Optionally:
```text
batch_size
model_load_time
```

Keep label dimensions controlled.

---

## 11. Labels / dimensions

Metric:
```text
requests_total{
  endpoint="/predict",
  status="200",
  model="1.4.0"
}
```

Labels let aggregate by dimension.

Danger:
```text
user_id as label
```

Millions unique values → cardinality explosion.

Never use high-cardinality values as metric labels.

---

## 12. High-cardinality trap

Bad metric labels:
```text
request_id
email
customer_id
raw error message
```

These belong logs, not time-series labels.

Good labels:
```text
endpoint
status_class
model_version
region
```
with bounded values.

---

## 13. ML-specific inference metrics

In addition to service health:
```text
prediction class distribution
probability/score histogram
fallback rate
abstention rate
batch size
```

These reveal model behavior changes before labels arrive.

But these are not true model-quality metrics yet.

---

## 14. Score distribution

Yesterday:
```text
mean risk score = 0.12
```

Today:
```text
0.46
```

Possible causes:
- input drift;
- product incident;
- model version changed;
- preprocessing bug.

This is a signal to investigate, not proof of model degradation.

---

## 15. Prediction rate by class

Classification:
```text
class A 70%
class B 20%
class C 10%
```

After deployment:
```text
class C 60%
```

Could be real business change or bug.

Monitor trend.

---

## 16. Model version on every metric/log

When rolling out:
```text
model=1.4.0
model=1.5.0
```

You need compare:
- latency;
- errors;
- prediction distribution.

Otherwise incident coinciding with model change is hard to diagnose.

---

## 17. Health metrics vs model quality

Service:
```text
200 responses
20 ms latency
```

can still make terrible predictions.

Therefore observability has layers:
```text
system health
data health
model behavior
ground-truth quality
business outcomes
```

Next lessons cover latter layers.

---

## 18. Traces

Distributed tracing follows one request through:
```text
API
→ feature service
→ model
→ database
```

Each segment becomes span.

For simple single-process FastAPI, traces may be overkill.

Once multiple dependencies appear, they help localize latency.

---

## 19. Error budget mental model

If target availability:
```text
99.9%
```

some failures allowed.

Reliability engineering can define SLO:
```text
99% prediction requests < 100 ms
99.9% successful
```

ML service should have explicit service objectives too.

---

## 20. Alerting

Alerts should represent actionable conditions.

Bad:
```text
alert every single 500
```

Better:
```text
5xx rate > 2% for 5 minutes
p95 latency > 200 ms
readiness failing
```

Avoid alert fatigue.

---

## 21. Logging exceptions

Catch only when you can add context or handle.

If prediction fails:
```text
log exception with request_id/model_version
return safe 500
```

Do not:
```python
except Exception:
    return {"prediction": 0}
```

Silent fallback corrupts business behavior.

---

## 22. Correlation between logs and metrics

Metric says:
```text
errors spiked at 14:05
```

Then logs filter:
```text
14:05
model_version=1.5
```

and reveal:
```text
unknown feature dtype
```

Metrics detect, logs explain.

---

## 23. Deployment markers

Record when:
```text
app v2.0
model v1.5
```

deployed.

Dashboard timeline should show release markers.

Then anomalies can be correlated with change events.

---

## 24. Dashboard

Beginner dashboard:
```text
request rate
error rate
p50/p95/p99 latency
in-flight requests
prediction distribution
model version
```

Don't create 50 charts no one watches.

---

## 25. Synthetic health checks

Periodically call known safe prediction request.

This tests:
```text
HTTP
validation
artifact
inference
response
```

not only process liveness.

Use test request identifiable/excluded from business metrics where needed.

---

## 26. Capacity

Load test:
```text
1 req/s
10
50
100
```

Measure:
- throughput;
- p95;
- CPU;
- memory;
- errors.

Find saturation point before production traffic does.

---

## 27. Queueing effect

As service approaches capacity:
```text
CPU ~100%
```
requests wait.

Latency can rise sharply even if individual inference compute unchanged.

This is why throughput and in-flight requests matter together.

---

## 28. Batch throughput

For GPU/large model:
```text
batching ↑ throughput
```

but waiting to fill batch can ↑ latency.

Trade-off:
```text
latency vs throughput
```

Benchmark real workload.

---

## 29. Интерактивная визуализация DataPath

### Logs vs metrics

Incident:
- metric spike;
- click period;
- inspect logs.

### Percentiles

Same average latency, two distributions with very different p99.

### Cardinality

Add `user_id` label → time series count explodes.

### Load test

Increase request rate and observe queue/p95 curve.

---

## 30. Типичные ошибки

**«Logs и metrics одинаковы».**\
Нет.

**«Average latency enough».**\
Нет.

**«User ID useful Prometheus label».**\
Dangerous cardinality.

**«200 status means model good».**\
Only service success.

**«Catch exception and return default prediction».**\
Can silently corrupt decisions.

**«Alert on every event».**\
Creates alert fatigue.

---

## 31. Проверка понимания

1. Log vs metric?
2. Counter vs gauge?
3. Why histogram?
4. p95 meaning?
5. What labels are safe?
6. High-cardinality problem?
7. What ML behavior metrics without labels?
8. Why model version in telemetry?
9. Why deployment markers?
10. What load test shows?

---

## 32. Мини-практика

Design observability for churn API:
```text
SLA p95 < 80ms
100 req/s peak
two model versions during rollout
```

Define:
- 5 metrics;
- structured log fields;
- 3 alerts;
- one dashboard;
- privacy rules.

---

## Что нужно унести

1. Observability starts with structured logs + bounded metrics.
2. Online service needs request count, errors and latency.
3. Percentiles reveal tail latency.
4. High-cardinality IDs belong logs, not metric labels.
5. Model version must be traceable.
6. Prediction distributions are early signals, not quality truth.
7. Metrics detect incidents; logs explain them.
8. Load testing identifies capacity/queue behavior.
9. Alerts should be actionable.
10. Next: monitor input/model distributions themselves.

## Куда дальше

Service can be healthy while the world changes.

Next:
> **data drift and prediction drift: how to detect that production data no longer resembles the training regime.**

## Источники
- Prometheus official instrumentation guidance.
- General service observability principles.
