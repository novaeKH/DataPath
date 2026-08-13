---
title: "FastAPI для ML inference — от Pydantic-схемы до predict endpoint"
id: concept.datapath-v2.093
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 93
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# FastAPI для ML inference

Теперь есть artifact:

```text
model.joblib
metadata
threshold
schema
```

Нужно дать другим программам понятный interface:

```text
POST /predict
JSON input
→ prediction JSON
```

Для Python ML-проектов удобный вариант — `FastAPI`.

Он хорошо сочетается с Pydantic schemas и автоматически генерирует OpenAPI documentation.

Но ML service — это не просто:

```python
@app.post("/predict")
def predict(x: dict):
    ...
```

Нужно правильно решить:
- validation;
- startup model loading;
- errors;
- health/readiness;
- concurrency;
- logging;
- versioning.

---

## 1. Request body через Pydantic

Актуальный FastAPI использует Pydantic models для request-body validation.

```python
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    age: int = Field(ge=0, le=120)
    income: float | None = Field(default=None, ge=0)
    city: str
    transactions_30d: int = Field(ge=0)
```

FastAPI:
- reads JSON;
- validates/converts types where permitted;
- generates JSON Schema/OpenAPI.

---

## 2. Почему не `dict`

```python
def predict(payload: dict):
```

перекладывает validation на manual code.

Pydantic gives:
- expected fields;
- types;
- constraints;
- editor support;
- API docs.

Schema is executable contract.

---

## 3. Response model

```python
class PredictResponse(BaseModel):
    score: float
    decision: str
    model_version: str
```

Then:
```python
@app.post(
    "/predict",
    response_model=PredictResponse,
)
```

Response schema helps prevent accidental output drift.

---

## 4. Load model once, not every request

Плохо:

```python
@app.post("/predict")
def predict(...):
    model = joblib.load("model.joblib")
```

Each request pays disk/deserialization cost.

Model should load at application startup/lifespan.

---

## 5. Lifespan

Conceptual:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    state["model"] = load_model()
    yield
    state.clear()

app = FastAPI(lifespan=lifespan)
```

Exact project design can use `app.state` or dependency injection.

Key principle:
> expensive artifact loading occurs once per process.

---

## 6. One process can mean one model copy

If server starts multiple worker processes, each process usually has its own memory/model instance.

For 2 GB neural model:
```text
4 workers
```
can imply huge memory use.

Worker count isn't free parallelism.

---

## 7. Sync vs async

`async def` shines for awaiting I/O:
- network;
- DB;
- file APIs.

CPU-bound sklearn prediction doesn't magically become parallel just because endpoint is async.

For heavy compute:
- carefully manage workers/thread pools;
- batch;
- GPU queue.

Do not wrap CPU inference in `async` expecting speedup.

---

## 8. Endpoint implementation

```python
@app.post(
    "/predict",
    response_model=PredictResponse,
)
def predict(req: PredictRequest):
    row = pd.DataFrame([req.model_dump()])

    proba = model.predict_proba(row)[0, 1]
    decision = (
        "high_risk"
        if proba >= threshold
        else "low_risk"
    )

    return PredictResponse(
        score=float(proba),
        decision=decision,
        model_version=MODEL_VERSION,
    )
```

This is enough for first real ML API.

---

## 9. Preserve field names

If Pipeline expects DataFrame columns, construct named columns.

Do not:
```python
np.array([
    req.age,
    req.income,
    req.transactions_30d,
])
```
unless positional order is explicitly guaranteed/tested.

---

## 10. `/health`

Simple liveness:

```python
@app.get("/health")
def health():
    return {"status": "ok"}
```

Answers:
> process/API alive?

But not:
> model successfully loaded?

---

## 11. `/ready`

Readiness:
```python
@app.get("/ready")
def ready():
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="model not loaded",
        )
    return {"status": "ready"}
```

Separating liveness/readiness prevents routing traffic before model usable.

---

## 12. Startup failure

If model missing/corrupt:
- log clear error;
- fail startup/readiness.

Do not start service with:
```text
model = None
```
and produce 500 for every prediction.

Fail early.

---

## 13. 4xx vs 5xx

### 4xx
Client request wrong:
- validation error;
- unsupported category policy;
- malformed field.

### 5xx
Server failed:
- model crash;
- dependency unavailable;
- internal bug.

This distinction matters monitoring.

---

## 14. Do not expose internals in errors

Bad:
```text
FileNotFoundError /srv/private/model...
full stack trace to client
```

Client receives safe error.

Detailed stack trace stays in logs.

---

## 15. Request ID

For each request:
```text
request_id
```

Return/log it.

Then user reports:
```text
request_id=abc
```
and you can trace:
- latency;
- model version;
- error.

---

## 16. Don't log raw sensitive features by default

Medical/financial/user text can contain sensitive information.

Log:
```text
request_id
status
latency
model_version
```

Input logging should be explicitly justified, minimized/anonymized.

Observability cannot ignore privacy.

---

## 17. Batch endpoint

```python
class BatchRequest(BaseModel):
    items: list[PredictRequest]
```

Then one DataFrame:

```python
rows = pd.DataFrame(
    [x.model_dump() for x in req.items]
)
```

and vectorized prediction.

This is much faster than calling estimator one row at a time in a loop for offline workloads.

---

## 18. Batch limits

Need:
```text
max batch size
max request body size
timeout
```

Otherwise one client can send million rows and exhaust memory.

---

## 19. Model version endpoint

Could expose:
```python
@app.get("/model-info")
```

Return non-sensitive:
```json
{
  "name": "churn",
  "version": "1.4.0"
}
```

Useful debugging/deployment checks.

---

## 20. API versioning

Breaking request schema:
```text
/v1/predict
→ /v2/predict
```

Model version and API version are not same thing.

You may deploy model v1.5 behind API v1 if contract compatible.

---

## 21. OpenAPI docs

FastAPI builds OpenAPI schema from route/type declarations and exposes interactive docs in common configurations.

This is useful for development:
- inspect required fields;
- try requests;
- see responses.

But production exposure of docs can be configured according to security needs.

---

## 22. Test endpoint

With test client:
```python
def test_predict(client):
    response = client.post(
        "/predict",
        json={...},
    )
    assert response.status_code == 200
    assert "score" in response.json()
```

Need tests:
- happy path;
- missing;
- wrong types;
- extremes;
- unknown category;
- batch limit.

---

## 23. Golden prediction test

API request:
```text
known example
```
should match artifact direct prediction within tolerance.

This checks:
```text
HTTP layer
→ serialization
→ DataFrame construction
→ model
```

end-to-end.

---

## 24. Concurrency and thread safety

Many sklearn estimators support prediction safely in common read-only usage, but external libraries/custom preprocessors may have thread/process constraints.

Do not assume arbitrary Python object is safe under any concurrency model.

Load-test actual stack.

---

## 25. GPU inference

If one GPU model receives many concurrent HTTP requests, running all independently can:
- exhaust VRAM;
- reduce throughput.

Often use:
```text
queue
→ dynamic batching
→ one inference worker
```

But for beginner ML service, first focus correctness and simple load test.

---

## 26. Timeouts

Prediction should have operational expectation:
```text
p95 < 50 ms
```

Client/server/proxy timeouts should be larger than normal latency but finite.

Hanging inference is incident, not infinite wait.

---

## 27. Интерактивная визуализация DataPath

### Request lifecycle

```text
JSON
→ Pydantic
→ DataFrame
→ Pipeline
→ score
→ response model
```

### Health vs ready

Model loading delayed 5 sec:
- `/health` alive;
- `/ready` 503 until loaded.

### Error classifier

Examples → choose 422/4xx vs 500.

### Worker memory

Model size slider × workers = approximate memory footprint.

---

## 28. Типичные ошибки

**«Load model inside endpoint».**\
Wasteful.

**«`async def` makes CPU prediction parallel».**\
No.

**«Health means model ready».**\
Not necessarily.

**«Log all request bodies for debugging».**\
Privacy risk.

**«API version == model version».**\
No.

**«Pydantic replaces all business validation».**\
No.

---

## 29. Проверка понимания

1. Why Pydantic?
2. What response model provides?
3. Why load at startup?
4. Health vs readiness?
5. 4xx vs 5xx?
6. Why request ID?
7. Why batch endpoint?
8. Why limit batch size?
9. API vs model version?
10. Why async doesn't solve CPU-bound inference?

---

## 30. Мини-практика

Implement design for:
```text
POST /v1/predict
POST /v1/predict-batch
GET /health
GET /ready
GET /model-info
```

Specify:
- schemas;
- startup;
- errors;
- logs;
- tests.

---

## Что нужно унести

1. FastAPI turns model artifact into typed HTTP contract.
2. Pydantic validates request/response structure.
3. Model loads once per process.
4. CPU inference and async are different concerns.
5. Health/readiness answer different questions.
6. Errors must distinguish client/server problems.
7. Request IDs enable traceability.
8. Batch inference can drastically improve throughput.
9. Sensitive feature logging needs strict policy.
10. Next step is package runtime reproducibly.

## Куда дальше

Service runs on your laptop.

Next:
> **how to make same Python/dependencies/service start reproducibly elsewhere?**

We package it in Docker.

## Источники
- FastAPI official request body, response and deployment documentation.
- Pydantic official model validation documentation.
