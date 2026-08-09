---
title: Experiment tracking, reproducibility and versioning
id: concept.mlops.experiments-reproducibility
schema_version: 2
type: concept
area: mlops
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [mlops/experiments, mlops/versioning]
---

# Experiment tracking, reproducibility and versioning

## Зачем это нужно

Модель вчера дала PR-AUC 0.42, сегодня — 0.36. Без сохранённых split, code revision, data snapshot, parameters и environment невозможно понять, улучшился алгоритм или просто изменился эксперимент.

Минимальная запись run:

- task and target definition;
- dataset/version и cutoff;
- train/validation/test ids или правило split;
- feature schema;
- code revision;
- library versions;
- random seeds;
- parameters;
- metrics и artifacts;
- notes об известных ограничениях.

Для личного проекта достаточно локальной папки runs + JSON/CSV index или MLflow. Важна дисциплина контракта, а не конкретный SaaS.

## Воспроизводимость

Seed контролирует источники случайности, но не исправляет leakage и не гарантирует bitwise equality на разных devices. Сохраняйте raw-data hash, sorted ids и deterministic preprocessing. Проверяйте, что pipeline можно заново обучить одной командой в чистом environment.

```python
run = {
    "data_version": "orders-2026-08-01",
    "split": "group:user_id;seed:42",
    "git_revision": revision,
    "params": model.get_params(),
    "metrics": {"pr_auc": 0.42, "recall_at_p80": 0.31},
}
Path("runs/run-017/metadata.json").write_text(json.dumps(run, indent=2))
```

## Data и model versioning

Версия данных должна обозначать content, не только filename `final_v2.csv`. Для малых файлов годится hash + manifest; для больших — DVC или immutable snapshots. Model artifact связан с exact preprocessing artifact и schema.

Serialization через pickle/joblib выполняет Python code при загрузке, поэтому загружайте только собственные trusted artifacts. Храните checksum и smoke-test example. Версия модели — не только binary: это artifact + preprocessing + threshold + label mapping + runtime.

## Experiment comparison

Сравнивайте runs на одном validation protocol. Разница 0.003 без uncertainty может быть шумом. Смотрите per-segment metrics, calibration и error categories. Победитель по average metric может ухудшить критичный редкий сегмент.

## Типичные ошибки и self-check

- логировать только финальную metric;
- менять data и parameters одновременно;
- сохранять model без feature order;
- верить seed без сохранённого split;
- перезаписывать artifact `model.pkl`;
- не хранить threshold и postprocessing.

1. Какие пять полей нужны, чтобы повторить run?
2. Почему git commit не является data version?
3. Что входит в deployable model version?
4. Создайте manifest для churn baseline и опишите один smoke input с ожидаемой формой output.

## Связи

До: sklearn Pipeline и evaluation. После: inference service, monitoring и retraining decision.
