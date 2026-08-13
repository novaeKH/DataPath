---
title: "Model artifact, сериализация и контракт инференса"
id: concept.datapath-v2.092
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 92
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Model artifact: почему `model.pkl` ещё не является готовой ML-системой

Мы закончили обучение и получили:

```python
model.fit(X_train, y_train)
```

В notebook всё работает.

Но через неделю появляется другой процесс:

```text
JSON request
→ ?
→ prediction
```

И сразу возникают вопросы:

- где взять preprocessing;
- в каком порядке columns;
- как кодировать unknown category;
- какая версия sklearn использовалась;
- какой threshold выбран;
- что означает output;
- какая model version сейчас активна.

Поэтому production unit — не просто estimator.

Это **артефакт модели (model artifact)** плюс явный контракт получения предсказаний.

---

## 1. Что должно быть воспроизводимо

Для одного prediction должны повторяться те же steps, что и при validation:

```text
raw input
→ validation
→ feature transformations
→ model
→ probability/score
→ threshold/postprocessing
→ response
```

Если training notebook делал:

```python
df["age"] = ...
df = pd.get_dummies(df)
df = scaler.transform(df)
```

а API реализовал это заново вручную, training-serving skew почти неизбежен.

---

## 2. Лучший artifact для sklearn-задачи

Если возможно:

```text
ColumnTransformer
→ Pipeline
→ estimator
```

сохраняются как один fitted object.

Пример:

```python
pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("model", LogisticRegression()),
])

pipeline.fit(X_train, y_train)
```

Теперь artifact знает:
- fitted imputer;
- fitted scaler;
- OHE vocabulary;
- estimator parameters.

---

## 3. Model artifact ≠ исходный notebook

Notebook полезен для исследования.

Production artifact должен быть:
- однозначным;
- сериализуемым;
- версионированным;
- загружаемым без ручного выполнения 30 cells.

Notebook history не является inference contract.

---

## 4. Сериализация

Для sklearn часто используют `joblib` или `pickle`-совместимые механизмы:

```python
import joblib

joblib.dump(
    pipeline,
    "model.joblib",
)

model = joblib.load(
    "model.joblib",
)
```

Но сериализация Python objects имеет важное ограничение:

> загружать artifact нужно только из доверенного источника.

`pickle`-подобные форматы способны выполнять код при десериализации.

---

## 5. Зависимости

Artifact, созданный в одной версии library, не гарантированно будет корректно работать в совершенно другой.

Поэтому рядом фиксируют:

```text
python version
scikit-learn
numpy
pandas
catboost / xgboost / torch
```

Например:
```text
requirements.txt
lock file
container image
```

---

## 6. PyTorch artifact

Для PyTorch обычно сохраняют:

```python
torch.save(
    model.state_dict(),
    "model.pt",
)
```

`state_dict` хранит parameters/buffers, но не полный Python class source.

Чтобы загрузить:

```python
model = MyArchitecture(...)
model.load_state_dict(
    torch.load("model.pt")
)
model.eval()
```

Architecture/config должны быть известны.

---

## 7. Artifact metadata

Полезный `metadata.json`:

```json
{
  "model_name": "churn",
  "model_version": "1.4.0",
  "trained_at": "2026-08-01",
  "target": "churn_30d",
  "prediction_horizon_days": 30,
  "primary_metric": "average_precision",
  "validation_score": 0.58,
  "threshold": 0.31,
  "git_commit": "abc123"
}
```

Это превращает binary file в traceable model release.

---

## 8. Input schema

Model ожидает не «какой-то DataFrame», а конкретные поля.

Например:

```text
age: integer
income: float | null
city: string
transactions_30d: integer >= 0
days_since_last_login: float >= 0
```

Это **контракт входа (input contract)**.

---

## 9. Почему order columns опасен

Некоторые estimators работают с positional arrays:

```text
column 0
column 1
...
```

Если production случайно поменял order:

```text
age, income
→ income, age
```

model получит valid numbers wrong semantics.

Использование named DataFrame/Pipeline/schema сильно снижает риск.

---

## 10. Missing vs invalid

Нужно различать:

### Missing allowed
```text
income = null
```
если Pipeline умеет impute.

### Invalid
```text
age = -800
```

Type validation не поймает semantic invalidity автоматически.

Нужны constraints.

---

## 11. Unknown category

Train:
```text
city = Moscow, Kazan
```

Production:
```text
city = Perm
```

Если OHE:
```python
handle_unknown="ignore"
```
service не падает.

Если ручной mapping:
```text
KeyError
```

Handling unknown must be part of fitted preprocessing design.

---

## 12. Output contract

Binary classifier может вернуть:

```json
{
  "score": 0.73,
  "prediction": 1
}
```

Но нужно определить:
- `score` — probability или raw score;
- threshold;
- class meaning;
- model version.

Better:

```json
{
  "default_probability": 0.73,
  "decision": "high_risk",
  "threshold": 0.31,
  "model_version": "1.4.0"
}
```

Если probability not calibrated, call it `score`, not `probability`.

---

## 13. Threshold — часть production artifact

Model:
```python
predict_proba
```
не знает business threshold.

Если validation выбрала:
```text
0.31
```
а API uses:
```text
0.5
```
production system is different model decision rule.

Therefore threshold must be versioned with model.

---

## 14. Feature code version

Sometimes feature engineering happens outside sklearn Pipeline:
- SQL aggregation;
- feature store;
- image transforms;
- tokenizer.

Then artifact metadata must reference exact feature pipeline/version.

Model version without feature-version is incomplete.

---

## 15. Prediction signature

A **model signature** describes input/output types/shapes.

Example:
```text
Input:
  age float
  city string
  amount float

Output:
  probability float [0,1]
```

Model registry tools can store signatures, but concept matters even without platform.

---

## 16. Batch vs online contract

### Online
One object:
```json
{"age": 31, ...}
```

### Batch
Table / list:
```json
{"items": [{...}, {...}]}
```

Batch processing can be much faster, but API/validation shapes differ.

Define both deliberately.

---

## 17. Prediction wrapper

Instead of exposing estimator directly:

```python
class ChurnPredictor:
    def __init__(self, pipeline, threshold, version):
        ...

    def predict_one(self, data):
        ...
```

Wrapper can centralize:
- schema transformation;
- threshold;
- metadata;
- output naming.

But avoid duplicating transformations already inside Pipeline.

---

## 18. Startup validation

When service loads artifact:

```text
does file exist?
can deserialize?
expected model version?
expected feature schema?
dummy prediction works?
```

If no, service should fail startup/readiness rather than accept traffic and crash requests.

---

## 19. Golden examples

Keep 5–20 fixed test inputs with expected outputs/tolerances.

After:
- library update;
- serialization change;
- container rebuild,

run:
```text
input A → expected score
```

This catches serving drift.

---

## 20. Backward compatibility

If API clients send schema v1:
```text
income
```

but model v2 needs:
```text
income
employment_type
```

You need policy:
- make new field optional;
- create `/v2/predict`;
- translate old schema;
- coordinated client migration.

Changing model can imply API contract change.

---

## 21. Artifact directory

A simple personal/production-like layout:

```text
artifacts/
  churn_1.4.0/
    model.joblib
    metadata.json
    requirements.lock
    schema.json
    validation_report.json
```

No enterprise platform needed to learn the principle.

---

## 22. Artifact checksum

Hash:
```text
SHA-256
```
can identify exact binary artifact.

Useful to ensure:
```text
"version 1.4.0"
```
actually corresponds to exact file deployed.

---

## 23. Security

Never:
- accept arbitrary uploaded pickle and load it;
- expose artifact filesystem paths from user request;
- log secrets embedded in features.

Artifact trust chain is software security concern.

---

## 24. Интерактивная визуализация DataPath

### Training-serving skew

Left:
```text
training transforms
```
Right:
```text
API transforms
```

User spots mismatch.

### Contract checker

Send:
```text
valid
missing allowed
wrong type
unknown category
impossible value
```

### Artifact bundle

Click files:
```text
model
metadata
schema
dependencies
test examples
```
and see role.

---

## 25. Типичные ошибки

**«`model.pkl` достаточно».**\
Нет.

**«Threshold можно помнить в коде».**\
Лучше version with artifact/config.

**«Pickle безопасно загружать от любого пользователя».**\
Нет.

**«Pydantic type validation заменяет domain validation».**\
Нет.

**«state_dict хранит весь PyTorch class».**\
Нет.

**«Feature pipeline можно переписать вручную в API».**\
Это источник skew.

---

## 26. Проверка понимания

1. Что входит model artifact?
2. Training-serving skew?
3. Почему Pipeline useful?
4. Что фиксировать dependencies?
5. `state_dict` что хранит?
6. Input vs output contract?
7. Почему threshold versioned?
8. Что такое model signature?
9. Что дают golden examples?
10. Почему artifact security важна?

---

## 27. Мини-практика

У вас:
```text
CatBoost
numeric + categorical features
threshold 0.27
FastAPI service
```

Составьте artifact bundle:
1. model;
2. feature schema;
3. category handling;
4. metadata;
5. dependencies;
6. golden tests;
7. versioning.

---

## Что нужно унести

1. Production unit — model + preprocessing + contract + metadata.
2. Serving должен повторять validation transformations.
3. Serialized Python artifacts only from trusted source.
4. Dependencies affect reproducibility.
5. Threshold belongs to released decision system.
6. Input/output schemas must be explicit.
7. Model signature and golden tests catch incompatibilities.
8. Model/feature versions must travel together.
9. Startup should fail early if artifact invalid.
10. Следующий шаг — дать artifact HTTP interface.

## Куда дальше

Теперь модель можно reproducibly загрузить.

Следующий урок:
> **как превратить `predict()` в простой и корректный FastAPI service.**

## Источники
- scikit-learn model persistence guidance.
- PyTorch saving/loading guidance.
- MLflow model signature / model packaging concepts.
