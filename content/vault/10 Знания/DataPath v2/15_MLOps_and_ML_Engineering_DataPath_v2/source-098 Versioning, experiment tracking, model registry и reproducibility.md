---
title: "Versioning, experiment tracking, model registry и reproducibility"
id: concept.datapath-v2.098
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 98
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Versioning, experiment tracking и model registry

Production incident:

```text
model_version = 1.4.0
quality dropped
```

Questions:
- which code trained it?
- which dataset?
- which parameters?
- which validation split?
- which library versions?
- which artifact checksum?
- why was it selected?
- what model preceded it?

If answer is:
```text
"probably notebook_final_v7.ipynb"
```
you don't have a reproducible ML lifecycle.

---

## 1. Reproducibility has several layers

To reproduce a run need more than `random_state=42`.

### Code
```text
git commit
```

### Data
```text
dataset version / cutoff / query snapshot
```

### Configuration
```text
hyperparameters
feature settings
split
```

### Environment
```text
Python/library versions
```

### Randomness
```text
seeds where relevant
```

### Artifact
```text
saved model/checksum
```

---

## 2. Experiment tracking

Each training attempt becomes a **run**.

Store:
```text
run_id
start time
git commit
parameters
metrics
artifacts
tags
```

Instead of spreadsheet manually updated after experiments.

---

## 3. MLflow Tracking mental model

MLflow Tracking organizes training executions as runs and can log:
- parameters;
- metrics;
- artifacts;
- code/run metadata.

Conceptually:

```python
with mlflow.start_run():
    mlflow.log_param("max_depth", 6)
    mlflow.log_metric("valid_ap", 0.58)
    mlflow.log_artifact("report.json")
```

Exact integration can be manual or library-specific.

---

## 4. Why metrics need context

A table:
```text
AP=0.61
```
means little without:
```text
dataset
split
target
metric implementation
threshold
```

Tracking system stores relationship between result and experiment configuration.

---

## 5. Run name not identity

Name:
```text
catboost_best_final
```
is human label.

Stable identity:
```text
run_id
```

Names can repeat/change.

Never rely on filenames as provenance.

---

## 6. Data versioning

For small project:
```text
data/raw/customers_2026-08-01.parquet
checksum
```

or record:
```text
SQL query hash
snapshot date
source version
```

For larger project there are dedicated data-versioning tools.

Core principle:
> model metric without identifiable data cannot be reproduced.

---

## 7. Mutable database problem

Training query:
```sql
SELECT * FROM customers
```

rerun month later → different rows.

Need:
- point-in-time snapshot;
- cutoff;
- immutable table partition;
- dataset hash/version.

SQL text alone is insufficient if source mutates.

---

## 8. Feature versioning

If function:
```python
build_features_v3()
```
changes, same raw data produces different X.

Track:
```text
feature code git commit
feature config
```

Feature definitions are part of model version.

---

## 9. Environment capture

`requirements.txt` / lockfile / container digest.

Why:
- model serialization compatibility;
- numerical behavior;
- changed defaults/API.

"Same code" in different library environment may behave differently.

---

## 10. Randomness limitations

Set:
```python
random.seed(...)
np.random.seed(...)
torch.manual_seed(...)
```

But exact DL reproducibility can still depend:
- GPU kernels;
- parallelism;
- library versions;
- hardware.

Goal often:
```text
experiment reproducible enough to explain/replicate result
```
not mythical bitwise equality everywhere.

---

# Model Registry

## 11. What registry adds

Experiment tracking contains many runs.

**Реестр моделей (model registry)** answers:
> which trained artifacts are recognized as deployable model versions?

A registered model can contain:
```text
version 1
version 2
version 3
...
```

with metadata/lineage.

---

## 12. Version vs run

Run:
```text
one experiment execution
```

Model version:
```text
registered artifact produced by a run
```

Not every run deserves registry entry.

Most experiments remain experiments.

---

## 13. Lineage

Registry version should point back to:
```text
source run
metrics
data/code
artifact
```

Then production model is traceable to training.

Current MLflow Model Registry explicitly supports model versioning, lineage, aliases, tags and metadata around model lifecycle.

---

## 14. Alias

Instead of hardcode:
```text
models:/churn/17
```

a deployment workflow can use conceptual alias:
```text
champion
candidate
```

For example MLflow registry supports aliases attached to model versions.

Alias can move from v17 to v19 without renaming model.

---

## 15. Why alias is not magic deployment

Changing registry alias doesn't automatically update every serving architecture unless your deployment system reads/acts on it.

Registry stores lifecycle state.

Deployment still needs controlled process:
```text
approve
deploy
verify
```

---

## 16. Tags

Model version tags:
```text
validation_status=passed
owner=risk_team
data_cutoff=2026-07-31
```

Useful for automation/governance.

Don't encode everything into model name:
```text
churn_catboost_final_v4_really_final
```

---

## 17. Model signature

Registry can store expected input/output schema.

This catches:
```text
deployed model expects feature 12
serving app only sends 11
```

Signature should complement application validation.

---

## 18. Artifact storage vs registry metadata

Conceptually:
- artifact store contains model files;
- registry tracks model versions/metadata/lineage.

Implementation differs by platform, but separation helps understanding.

---

## 19. Approval gates

Before model becomes challenger/champion:
```text
tests pass
offline metrics pass
latency pass
schema compatible
fairness/safety checks if relevant
```

Registration alone is not approval.

---

## 20. Experiment comparison

Don't choose model by max metric blindly.

Tracking UI/table:
```text
run
metric mean/std
latency
size
features
notes
```

Model selection includes engineering constraints.

---

## 21. Store artifacts beyond model

Useful:
```text
confusion_matrix.png
calibration.json
feature_importance.csv
validation_predictions.parquet
data_drift_reference.json
```

This becomes audit/debug package.

---

## 22. Validation predictions

Saving OOF/validation predictions enables later:
- threshold re-analysis;
- calibration;
- paired comparison;
- segment analysis.

Much stronger than storing only final score.

---

## 23. Model card / release note

Short release note:
```text
purpose
training cutoff
known limitations
metrics
threshold
intended use
owner
```

helps future team/self understand artifact.

No huge governance bureaucracy needed for personal project.

---

## 24. Naming strategy

Registered model:
```text
churn_prediction
```

Versions:
```text
automatic numeric/immutable IDs
```

Application release:
```text
api 2.3.0
```

Don't overload one version number with all components.

---

## 25. Reproduce a run exercise

Given run ID, you should be able to answer:
```text
checkout code commit
obtain data version
install environment
load config
run train
compare metrics within tolerance
```

If impossible, tracking is incomplete.

---

## 26. Artifact immutability

Never silently overwrite:
```text
models/champion/model.joblib
```
without preserving previous exact artifact.

Need rollback.

Use immutable versioned artifact and separate pointer/alias to current.

---

## 27. Registry does not replace Git

Git:
- source code.

Tracking:
- experiment runs.

Registry:
- model lifecycle.

Artifact store:
- binary model/files.

They solve related but distinct problems.

---

## 28. Интерактивная визуализация DataPath

### Lineage graph

```text
git commit
data v8
config
↓
run 241
↓
model version 17
↓
champion alias
↓
deployment
```

### Missing provenance challenge

Remove one element and ask why reproduction fails.

### Registry

Drag alias `champion` from v17 to v19 only after validation cards turn green.

---

## 29. Типичные ошибки

**«Random seed = full reproducibility».**\
No.

**«Git stores trained model lifecycle».**\
Not by itself.

**«Every experiment should be registered».**\
No.

**«Model alias automatically deploys everywhere».**\
Depends deployment integration.

**«Dataset query text is enough versioning».**\
Not if source changes.

**«Overwrite champion artifact to save disk».**\
Breaks rollback.

---

## 30. Проверка понимания

1. What needed for reproducibility?
2. Run vs model version?
3. What is lineage?
4. Why data snapshot?
5. Why environment lock?
6. What alias gives?
7. Why tags?
8. Model signature?
9. Why save validation predictions?
10. Git vs registry?

---

## 31. Мини-практика

Design tracking for training:
```text
CatBoost churn model
weekly experiments
monthly release
```

Record:
1. data version;
2. git;
3. params;
4. metrics;
5. artifacts;
6. registry tags;
7. champion alias;
8. rollback artifact.

---

## Что нужно унести

1. Reproducibility requires code, data, config, environment and artifact identity.
2. Experiment tracking records every meaningful run.
3. Registry contains selected model versions, not all experiments.
4. Lineage connects production artifact to source run.
5. Aliases/tags simplify lifecycle management.
6. Data and feature versions are as important as model parameters.
7. Validation predictions/reports are valuable artifacts.
8. Versioned artifacts must be immutable enough for rollback.
9. Registry complements Git and artifact storage.
10. Next step: safely replace champion with challenger.

## Куда дальше

A new model scores better offline.

Should it immediately replace production?

No.

Next lesson:
> **retraining pipeline, champion/challenger comparison, staged validation and rollback.**

## Источники
- MLflow Tracking official documentation.
- MLflow Model Registry official documentation.
