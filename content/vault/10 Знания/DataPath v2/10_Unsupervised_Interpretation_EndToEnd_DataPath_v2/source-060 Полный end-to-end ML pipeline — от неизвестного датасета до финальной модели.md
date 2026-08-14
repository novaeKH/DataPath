---
title: "Полный end-to-end ML pipeline — от неизвестного датасета до финальной модели"
id: concept.datapath-v2.060
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 60
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Полный end-to-end ML pipeline

Этот урок не добавляет новый алгоритм.

Он отвечает на более важный вопрос:

> **Что делать, если завтра вам дадут совершенно незнакомый dataset и скажут: постройте хорошую ML-модель?**

Новичок часто начинает:

```text
CatBoost
```

Опытный Data Scientist начинает намного раньше.

Полный workflow:

```text
1. задача и prediction moment
2. data audit
3. target
4. leakage
5. EDA
6. split
7. baseline
8. preprocessing
9. feature engineering
10. candidate models
11. metrics
12. cross-validation
13. tuning
14. error analysis
15. interpretation
16. final model choice
17. final test
18. artifact
19. inference contract
```

Позже MLOps-блок продолжит:

```text
FastAPI
→ Docker
→ monitoring
→ drift
→ retraining
```

---

# Фаза 1. Понять задачу

## 1. Не открывать notebook с model.fit

Сначала сформулируйте:

```text
объект
target
prediction moment
horizon
business decision
cost FP/FN
```

Пример:

> В первый день месяца предсказать вероятность churn активного клиента в следующие 30 дней по информации, доступной на начало месяца.

Теперь можно проверять допустимость каждого feature.

---

## 2. Определить baseline business process

Что происходит без model?

Например:

```text
маркетинг выбирает клиентов случайно
или
всем с inactivity > 30 days
```

ML должен сравниваться не только с другим ML, но и с текущим decision rule.

---

# Фаза 2. Audit данных

## 3. Schema

Проверяем:

```text
shape
dtypes
unique values
missingness
duplicates
target distribution
time range
entity IDs
```

Не просто вызываем `df.info()`, а задаём вопросы.

Пример:

```text
age dtype=object
```

Почему?

Может быть:

```text
"unknown"
"18 years"
```

---

## 4. Единица строки

Что одна row?

```text
client
client-month
transaction
order
session
```

Это определяет split и aggregation.

Если один client встречается много раз, обычный random split может течь.

---

## 5. Target audit

Проверить:

- meaning;
- prevalence/distribution;
- missing target;
- time label definition;
- duplicates/conflicts.

Нужно понимать, как target был создан.

Target column может быть технически корректной, но плохо соответствовать business event.

---

## 6. Leakage audit

Для каждого suspicious feature:

> существует ли он в prediction moment?

Ищем:

- future timestamps;
- post-event status;
- target derivatives;
- aggregations through future;
- export artifacts;
- split leakage;
- same entity across folds.

Очень высокий baseline score — повод не праздновать, а проверить leakage.

---

# Фаза 3. EDA

## 7. Цель EDA

EDA — не коллекция красивых графиков.

Каждый plot должен отвечать на вопрос:

```text
Что за distribution?
Есть ли broken values?
Есть ли drift?
Как связаны features?
Есть ли segments?
Как устроен target?
```

---

## 8. Числовые features

Смотрим:

- quantiles;
- tails;
- impossible values;
- missing;
- target relation;
- temporal stability.

Не удаляем outliers автоматически.

---

## 9. Категории

Смотрим:

```text
cardinality
rare values
unknown-like strings
distribution over time
target rates
```

Но target rates считаем осторожно: rare categories дают шумные estimates.

---

## 10. Время

Если есть timestamp:

```text
target rate over months
feature distributions over months
sample count
missing rate
```

Time plot часто обнаруживает schema changes и drift, невидимые в aggregate EDA.

---

# Фаза 4. Split до model experiments

## 11. Выбрать validation scheme

Варианты:

- random;
- stratified;
- group;
- time;
- group + time.

Split должен моделировать production generalization.

Final test фиксируем заранее и больше не трогаем.

---

## 12. Почему split должен появиться рано

После split все fitted preprocessing steps используют только training data:

```text
imputer
scaler
encoder
PCA
feature selection
target encoding
SMOTE
```

Это защищает validation.

---

# Фаза 5. Baseline

## 13. Dummy baseline

Регрессия:

```text
mean / median
```

Классификация:

```text
most frequent
prior probability
```

Он проверяет, что model вообще добавляет value.

---

## 14. Simple ML baseline

Для tabular:

```text
Logistic/Linear Regression
Decision Tree / Random Forest
simple CatBoost
```

Не тюним 200 parameters.

Сначала понимаем structure task.

---

# Фаза 6. Preprocessing

## 15. Pipeline

Для linear model:

```text
numeric:
impute → scale

categorical:
impute → OHE

→ estimator
```

Для CatBoost preprocessing может быть другим.

Нельзя один generic pipeline навязывать всем candidate models.

---

## 16. Feature engineering

Создаём только features, доступные в prediction moment.

Пример transaction history:

```text
count_7d
count_30d
sum_30d
mean_90d
recency
trend
```

Каждая feature group — hypothesis, которую проверяем по CV.

---

# Фаза 7. Метрика

## 17. Выбираем primary metric до массового tuning

При imbalance:

```text
AP
precision at recall
recall at precision
```

При regression:

```text
MAE / RMSE
```

в зависимости от cost error.

Secondary metrics тоже фиксируем.

---

## 18. Threshold отдельно

Для classifier:

```text
model score
≠
business decision
```

Threshold выбирается по validation/OOF после model training.

Не на final test.

---

# Фаза 8. Candidate models

## 19. Зачем несколько families

Разные inductive biases:

```text
linear
distance-based
tree
boosting
```

Если boosting резко выигрывает linear baseline, это сигнал о nonlinear structure/interactions.

Если scores почти одинаковые, simple model может быть выгоднее production.

---

## 20. Экспериментальная таблица

Ведём:

| Experiment | Features | Model | CV metric | std | Latency | Notes |
|---|---|---|---:|---:|---:|---|
| E01 | base | Logistic | 0.42 | .01 | 1ms | baseline |
| E02 | base | CatBoost | 0.51 | .02 | 8ms | nonlinear gain |
| E03 | +history | CatBoost | 0.58 | .01 | 9ms | strong feature gain |

Так видно, **почему** качество выросло.

---

# Фаза 9. Tuning

## 21. Сначала понять failure mode

Если:

```text
train low
validation low
```

вероятен high bias/weak features.

Если:

```text
train high
validation much lower
```

variance/overfit.

Не нужно автоматически запускать search.

---

## 22. Ограниченный search

Для promising model:

```text
reasonable parameter ranges
→ RandomizedSearchCV / model-specific tuning
→ same folds
```

Смотрим не только best mean, но:

- std;
- fit time;
- complexity;
- plateau parameters.

---

# Фаза 10. Error analysis

## 23. False positives и false negatives

Не ограничиваемся aggregate score.

Создаём tables:

```text
largest errors
false positives
false negatives
low-confidence cases
high-confidence errors
```

И анализируем segments.

---

## 24. Segment metrics

Например:

```text
new vs old clients
city
product
age group
month
device
```

Global AP=0.60 может скрывать:

```text
segment A = 0.75
segment B = 0.22
```

Это важно и для quality, и для fairness/business safety.

---

## 25. Ошибка как источник новых features

False negatives могут показать:

```text
не хватает recency
```

False positives:

```text
особый merchant type
```

Error analysis → hypothesis → new feature → CV.

Это более зрелый process, чем случайное добавление columns.

---

# Фаза 11. Interpretation

## 26. Проверить, на что model опирается

Используем:

- coefficients;
- permutation importance;
- SHAP;
- PDP/ICE;
- group analyses.

Главный вопрос:

> соответствует ли behavior model доступной и допустимой information?

Если top feature выглядит как leakage, возвращаемся назад.

---

# Фаза 12. Выбор финальной модели

## 27. Победитель — не просто max score

Сравниваем:

```text
mean CV
std
final latency
model size
training time
interpretability
operational complexity
calibration
```

Пример:

| Model | AP | Latency | Size |
|---|---:|---:|---:|
| Logistic | .54 | 1 ms | 2 MB |
| CatBoost | .57 | 12 ms | 80 MB |
| Giant ensemble | .575 | 150 ms | 1.5 GB |

При SLA 20 ms третий model не candidate.

---

## 28. Freeze

После выбора фиксируем:

```text
feature list
preprocessing
hyperparameters
threshold
metric calculation
software versions
random seeds where relevant
```

После freeze прекращаем tuning по final test.

---

# Фаза 13. Final test

## 29. Один независимый запуск

Final pipeline refit на разрешённых training data.

Затем:

```text
test predictions
→ predefined metrics
→ segment analysis
```

Если result хуже ожиданий, не надо 30 раз tuning по test.

Иначе test перестаёт быть test.

---

## 30. Что сохранить

Model artifact должен включать всё, что нужно для same transformation:

```text
preprocessor
encoder
scaler
model
```

Например sklearn Pipeline можно сериализовать как единый object.

Дополнительно:

```text
model version
training date
feature schema
metric
threshold
git commit
data version/reference
```

---

# Фаза 14. Inference contract

## 31. Какие inputs принимает модель

Нужно явно определить:

```text
age: int
income: float | null
city: str
...
```

Что делать:

- missing;
- unknown category;
- invalid type;
- extreme value.

Notebook обычно не проверяет это, API должен.

---

## 32. Batch vs online inference

Batch:

```text
раз в день посчитать scores всех clients
```

Online:

```text
prediction на один request за 20 ms
```

Это влияет на:

- latency;
- model size;
- feature availability;
- architecture.

Model selection должна учитывать способ inference заранее.

---

# Полный пример mental model

## 33. Churn project

### Постановка

```text
кто: активный client
когда: первый день месяца
target: churn next 30 days
```

### Data

```text
profile
transactions
sessions
support
```

### Features

Только до cutoff:

```text
spend_30d
sessions_7d
recency
support_count_90d
```

### Split

Time-based:

```text
train → Jan–Apr
validation → May
test → June
```

### Baseline

```text
Logistic Regression
```

### Strong model

```text
CatBoost
```

### Metric

```text
AP
Recall at Precision >= 0.25
```

### Threshold

Выбран на validation.

### Analysis

```text
errors by tariff
permutation importance
calibration
```

### Final artifact

```text
preprocessing + model + threshold + schema
```

Вот это уже полноценное ML-решение, а не «я обучил CatBoost».

---

## 34. Что не надо делать

### Endless EDA

Если plot не меняет понимание/task decision, он не нужен.

### Endless tuning

0.001 score не всегда оправдывает неделю search.

### Test peeking

Самый частый способ случайно переобучить весь project.

### Feature leakage

Сильная model лишь лучше эксплуатирует ошибку.

### Notebook-only preprocessing

Production должен повторять transformations.

### One metric only

Нужны stability, segments и operational constraints.

---

## 35. Интерактивная карта DataPath

Для этого урока visualizer должен быть не математической сценой, а **flow simulator**.

Пользователь получает dataset scenario и проходит decisions:

```text
1. выбрать prediction moment
2. отметить leakage columns
3. выбрать split
4. выбрать baseline
5. выбрать metric
6. выбрать preprocessing
7. сравнить models
8. найти overfit
9. выбрать threshold
10. интерпретировать errors
11. выбрать final model
```

При неправильном выборе не просто красный «неверно», а consequence:

```text
random split при time data
→ validation score искусственно +0.12
→ production score падает
```

Так урок соединяет всю карту знаний.

---

## 36. Проверка понимания

1. Почему момент прогноза нужно определить до отбора признаков?
2. Чем бизнес-процесс без модели отличается от простого `DummyClassifier`?
3. Почему схема разбиения выбирается раньше массового feature engineering?
4. Какие преобразования обязаны обучаться внутри каждого fold?
5. Почему улучшение средней метрики недостаточно без проверки разброса и сегментов?
6. В какой момент разрешено посмотреть на test и что делать после этого?
7. Какие части preprocessing и входного контракта должны войти в model artifact?

Сначала ответьте без конспекта. Если ответ получается только списком терминов, вернитесь к соответствующему этапу pipeline и восстановите причинную связь.

---

## 37. Capstone-практика

Дан dataset банковских клиентов.

Columns:

```text
client_id
snapshot_date
age
income
transactions_30d
transactions_next_30d
days_since_last_login
future_collection_status
city
target_default_next_90d
```

Constraints:

```text
positive rate = 4%
API latency < 15 ms
explanation required
```

Составьте полный план:

1. prediction moment;
2. leakage columns;
3. group/time split;
4. EDA questions;
5. baseline;
6. preprocessing;
7. primary/secondary metrics;
8. candidate models;
9. tuning strategy;
10. threshold;
11. error analysis;
12. interpretation;
13. final decision criteria;
14. artifact metadata;
15. inference input schema.

---

## 38. Как рассказать end-to-end проект на собеседовании

Сильный рассказ имеет структуру:

### Задача

Что предсказывали и зачем.

### Данные

Какие sources, размер, основные проблемы.

### Validation

Почему именно такой split и как избегали leakage.

### Baseline

С чего начали.

### Improvement

Какие features/models реально улучшили result.

### Metric

Почему она соответствует задаче.

### Error analysis

Где model ошибалась.

### Final choice

Почему выбрали именно эту model, учитывая не только score.

### Production

Как сохранили pipeline и как планируется inference/monitoring.

Это гораздо сильнее списка:

> «Использовал pandas, sklearn, CatBoost, SHAP».

---

## 39. Что нужно унести

1. ML project начинается с prediction problem, не estimator.
2. Prediction moment определяет допустимые features.
3. Audit и leakage checks идут до model.
4. Split моделирует production future.
5. Baseline нужен всегда.
6. Preprocessing должен быть reproducible и train-only fitted.
7. Feature engineering проверяется как hypothesis.
8. Primary metric выбирается до tuning.
9. Threshold — отдельная decision layer.
10. Candidate families сравниваются на одинаковых folds.
11. Hyperparameter search ограничен budget/hypotheses.
12. Error analysis создаёт следующие улучшения.
13. Interpretation помогает debugging и trust.
14. Final model выбирается по quality + stability + engineering constraints.
15. Test остаётся независимым до freeze.
16. Model artifact включает preprocessing.
17. Inference schema — часть решения.
18. Следующий этап — превратить artifact в сервис и наблюдать за ним.

## Куда дальше

Классический ML-цикл завершён.

Следующие части DataPath пойдут в двух направлениях:

```text
Deep Learning
```

— чтобы понять модели, которые сами учат сложные представления;

и:

```text
MLOps / ML Engineering
```

— чтобы превратить обученную модель в надёжную работающую систему.

## Источники
- scikit-learn User Guide — model selection, pipelines, metrics and inspection.
- Предыдущие канонические уроки DataPath №37–59.
