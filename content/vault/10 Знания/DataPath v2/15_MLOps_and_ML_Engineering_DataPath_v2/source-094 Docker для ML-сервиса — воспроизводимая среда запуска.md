---
title: "Docker для ML-сервиса — воспроизводимая среда запуска"
id: concept.datapath-v2.094
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 94
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Docker для ML-сервиса: как перестать зависеть от «у меня работает»

FastAPI service works locally because laptop has:
```text
Python 3.x
correct sklearn
correct model file
system libraries
environment variables
```

On another machine:
```text
ModuleNotFoundError
version conflict
different working directory
```

**Docker** packages application, dependencies, configuration expectations and runtime filesystem into a container image.

Main goal for ML Engineer:
> make serving environment repeatable.

---

## 1. Image vs container

**Image**
- immutable-ish build artifact;
- filesystem + metadata + command.

**Container**
- running isolated process created from image.

Mental model:
```text
Dockerfile
→ docker build
→ image
→ docker run
→ container
```

---

## 2. Minimal Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY artifacts ./artifacts

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

This is enough to understand core.

---

## 3. Why base image matters

```text
python:3.12
python:3.12-slim
```

different:
- size;
- included OS packages;
- attack surface;
- build convenience.

Slim usually good for simple Python services but native dependencies may require additional system packages.

---

## 4. Pin dependencies

Weak:
```text
scikit-learn
pandas
```

Rebuild next month may install different versions.

Better:
```text
scikit-learn==...
pandas==...
```

or lockfile from chosen package manager.

Container reproducibility depends on dependency reproducibility.

---

## 5. Layer cache

Dockerfile instruction layers cached.

If:

```dockerfile
COPY . .
RUN pip install ...
```

any source edit invalidates expensive install layer.

Better:
```dockerfile
COPY requirements.txt .
RUN pip install ...
COPY app .
```

Source changes reuse dependency layer.

---

## 6. `.dockerignore`

Exclude:
```text
.git
.venv
__pycache__
notebooks
large raw datasets
secrets
```

Like `.gitignore` for build context.

Without it builds slower and may accidentally copy sensitive files.

---

## 7. Do not bake secrets

Bad:
```dockerfile
ENV API_KEY=secret
```

Image can be shared/inspected.

Secrets should be injected at runtime by environment/secret mechanism.

Model artifact may be packaged, but credentials should not.

---

## 8. Environment config

Code:
```python
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    "/app/artifacts/model.joblib",
)
```

Run:
```bash
docker run \
  -e MODEL_PATH=/app/artifacts/model.joblib \
  ...
```

Configuration outside code reduces rebuilds.

---

## 9. Port mapping

Inside container:
```text
service listens 8000
```

Host:
```bash
docker run -p 8080:8000 image
```

Then:
```text
host 8080 → container 8000
```

`EXPOSE` documents expected port but actual publishing occurs through runtime mapping.

---

## 10. Why host `0.0.0.0`

Inside container, binding Uvicorn only to:
```text
127.0.0.1
```
may make service inaccessible via container network.

Usually:
```text
--host 0.0.0.0
```
to listen all container interfaces.

---

## 11. Model artifact in image vs mounted/downloaded

### Bake into image

Pros:
- exact image contains exact model;
- simple;
- immutable deployment pair.

Cons:
- large image;
- every model update rebuild image.

### External artifact

Container startup downloads/mounts model.

Pros:
- smaller app image;
- independent model release.

Cons:
- auth/network;
- startup complexity;
- version matching.

For learning/personal project, baking artifact is perfectly reasonable.

---

## 12. Container filesystem is not database

Runtime writes inside container can disappear when container replaced.

Do not store durable:
- user data;
- training history;
- important logs

only inside ephemeral filesystem.

Use volume/external store where persistence required.

---

## 13. Volumes

For local dev:
```bash
-v ./artifacts:/app/artifacts:ro
```

Mount model read-only.

This allows swapping local model without rebuilding image.

Production approach depends architecture.

---

## 14. Non-root user

Security best practice:
> service process doesn't need root privileges.

Dockerfile can create user and switch:
```dockerfile
USER appuser
```

Requires correct filesystem permissions.

For educational service, understand principle even if first minimal image uses default user.

---

## 15. Multi-stage builds

Useful when build requires compilers/assets but runtime doesn't.

Stage 1:
```text
build
```

Stage 2:
```text
copy only runtime results
```

Reduces final image.

Not mandatory for first FastAPI + sklearn service.

---

## 16. Healthcheck

Docker can define health command.

But application already has:
```text
/health
/ready
```

Infrastructure should align with correct endpoint.

Liveness should not depend on remote optional service if that causes destructive restart loops.

---

## 17. Build

```bash
docker build \
  -t churn-api:1.4.0 \
  .
```

Tag provides human version label.

For exact identity, image digest stronger than mutable tag.

---

## 18. Run

```bash
docker run --rm \
  -p 8000:8000 \
  churn-api:1.4.0
```

Then test:
```text
GET /ready
POST /predict
```

---

## 19. Image tag vs model version

Could use:
```text
app image 2.1.0
model 1.4.0
```

They need not match.

Service release may change:
- logging;
- API bugfix;

without changing model.

Keep both visible.

---

## 20. CPU architecture

Image/platform can matter:
```text
arm64
amd64
```

Mac Apple Silicon uses arm64.

Cloud host may amd64.

Multi-platform builds exist, but native Python wheels/library support must be checked.

Do not assume local ARM image runs everywhere.

---

## 21. Native ML libraries

XGBoost/LightGBM/OpenCV/PyTorch may depend on native binaries.

Container helps pin environment, but build errors may require:
- system libraries;
- architecture-compatible wheels;
- CUDA runtime for GPU.

---

## 22. GPU container

GPU serving adds:
- GPU-aware base image;
- matching driver/runtime;
- device passthrough.

This is beyond basic tabular FastAPI service.

First master CPU container path.

---

## 23. Container startup time

Huge model load:
```text
20 seconds
```

Container process may start but readiness remains false.

Deployment needs enough startup grace.

This is another reason separate readiness.

---

## 24. Docker Compose

For local multi-service development:
```text
api
monitoring
database
```

`compose.yaml` can declare them together.

But one ML API doesn't require Compose.

Use complexity only when multiple services actually needed.

---

## 25. Rebuild reproducibility

For better reproducibility store:
```text
Dockerfile
dependency lock
artifact checksum
image digest
git commit
```

Then deployment can be reconstructed.

---

## 26. Image scanning and dependency security

Container doesn't magically make dependencies safe.

Need:
- update base images intentionally;
- dependency vulnerability checks;
- don't install unnecessary tools.

Security remains lifecycle concern.

---

## 27. Test inside image

After build:
```text
start container
→ /ready
→ golden prediction
```

This catches:
- missing file;
- broken path;
- dependency mismatch.

Unit tests alone outside container cannot catch all packaging issues.

---

## 28. Интерактивная визуализация DataPath

### Layer cache

Change `main.py` and see which Docker layers rebuild.

### Filesystem

Show:
```text
image
container writable layer
volume
```

### Port map

Host 8080 → container 8000.

### Artifact strategy

Toggle:
```text
baked
mounted
downloaded
```
and compare release complexity.

---

## 29. Типичные ошибки

**«Docker = virtual machine».**\
Container isolation model is different/lighter; it shares host kernel conceptually.

**«Container guarantees code works on any CPU/GPU».**\
Architecture/native dependencies still matter.

**«Secrets can be stored in image because image private».**\
Bad practice.

**«Data written in container is durable».**\
Not necessarily.

**«EXPOSE publishes port automatically».**\
No.

**«Docker replaces dependency pinning».**\
No; build must be reproducible.

---

## 30. Проверка понимания

1. Image vs container?
2. Why dependency lock?
3. Why copy requirements before source?
4. What `.dockerignore` does?
5. Why no secrets in image?
6. `0.0.0.0` why?
7. Bake vs external model artifact?
8. Why volume?
9. ARM vs AMD issue?
10. What integration test after build?

---

## 31. Мини-практика

Package:
```text
FastAPI
sklearn Pipeline
model.joblib 200 MB
CPU serving
```

Create:
1. Dockerfile structure;
2. `.dockerignore`;
3. model location;
4. tag scheme;
5. runtime env vars;
6. `/ready` smoke;
7. golden prediction.

---

## Что нужно унести

1. Docker packages runtime environment reproducibly.
2. Image is build artifact; container is running instance.
3. Dependency versions remain important.
4. Layer order affects build speed.
5. Secrets stay outside image.
6. ML artifact can be baked or loaded externally.
7. Persistent data should not rely on ephemeral container layer.
8. Architecture/native libraries still matter.
9. Health/readiness integrate with container lifecycle.
10. Next step: observe running service rather than just know it started.

## Куда дальше

A container can be perfectly reproducible and still fail under real traffic.

Next:
> **logs, metrics and observability: how to know what the ML service is doing.**

## Источники
- Docker official Python guide.
- Docker build/container runtime documentation.
