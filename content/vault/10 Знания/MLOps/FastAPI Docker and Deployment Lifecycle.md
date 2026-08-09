---
title: FastAPI inference, Docker basics and deployment lifecycle
id: concept.mlops.serving-deployment
schema_version: 2
type: concept
area: mlops
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [mlops/serving, mlops/docker]
---

# FastAPI inference, Docker basics and deployment lifecycle

## Inference contract

Сервис превращает typed request в typed response. Он не должен обучать модель при каждом запросе. Artifact загружается один раз при startup, input валидируется, features строятся тем же pipeline, затем возвращается probability и version.

```python
class ChurnRequest(BaseModel):
    age: int = Field(ge=18, le=100)
    city: str
    monthly_spend: float = Field(ge=0)

class ChurnResponse(BaseModel):
    probability: float
    decision: bool
    model_version: str

@app.post("/predict", response_model=ChurnResponse)
def predict(payload: ChurnRequest):
    frame = pd.DataFrame([payload.model_dump()])
    probability = float(model.predict_proba(frame)[0, 1])
    return ChurnResponse(
        probability=probability,
        decision=probability >= threshold,
        model_version=MODEL_VERSION,
    )
```

Probability и decision разделены: threshold может быть business policy. Ошибки schema возвращаются как 4xx, внутренние — 5xx без утечки stack trace клиенту.

## FastAPI lifecycle и проверки

На startup загрузите artifact, проверьте checksum, feature schema и выполните smoke prediction. `/health` отвечает, жив ли процесс; `/ready` — загружена ли модель. Логи содержат request id, model version, latency и aggregate-safe diagnostics, но не чувствительные raw features.

Batch endpoint полезен, но имеет limits по числу объектов и payload size. Timeout и cancellation нужны даже локально, чтобы один тяжёлый запрос не блокировал интерфейс.

## Docker basics

Image фиксирует runtime, dependencies и application files; container — запущенный экземпляр image. Dockerfile копирует lockfile, устанавливает зависимости, затем код, чтобы cache не инвалидировался при каждом edit.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev
COPY app ./app
COPY artifacts ./artifacts
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Не кладите secrets в image. Для локального проекта environment variables и mounted data directory достаточно. Container не заменяет model/version manifest.

## Deployment lifecycle

```text
validated run → package artifact → contract tests → smoke → activate → monitor → rollback/retire
```

Сначала shadow или ручной smoke на representative requests. При замене версии храните предыдущий artifact и config для rollback. Database schema и API contract должны быть backward compatible или мигрироваться осознанно.

Simple CI может запускать lint, unit tests, content validation, model contract test и image build. CD для личного локального проекта — явная команда активации после зелёных checks; автоматический cloud deploy не нужен.

## Типичные ошибки и self-check

- загружать model внутри handler;
- возвращать только class без score/version;
- собирать features иначе, чем при training;
- использовать `latest.pkl` без checksum;
- health сообщает OK до загрузки artifact;
- писать PII в logs;
- считать container гарантией воспроизводимости данных.

1. Чем liveness отличается от readiness?
2. Почему threshold должен versionироваться?
3. Что проверить smoke request?
4. Опишите rollback с model v3 на v2 без переобучения.

## Связи

До: serialization и Pipeline. После: quality monitoring, drift, retraining и incident diagnosis.
