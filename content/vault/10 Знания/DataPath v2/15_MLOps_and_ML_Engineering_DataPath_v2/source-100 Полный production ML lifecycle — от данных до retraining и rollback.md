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

# Фаза 1. Бизнес-задача

## 1. Контракт прогноза до обучения

Пример:
> В первый день месяца оценить вероятность того, что активный клиент уйдёт в следующие 30 дней.

Нужно зафиксировать:
```text
entity
prediction moment
horizon
target
business action
metric
latency mode
```

Этот контракт позже определит устройство serving и monitoring.

---

## 2. Online или batch

Если маркетинговая кампания запускается раз в день, то:
```text
batch predictions
```
может оказаться проще HTTP API.

Если checkout должен получить risk score за 30 мс, нужен:
```text
online service
```

MLOps-архитектура следует потребности продукта, а не моде.

---

# Фаза 2. Данные и валидация

## 3. Происхождение данных

Зафиксируйте:
```text
data sources
cutoff
schema
query/version
```

Стройте признаки, корректные на момент прогноза.

Никакая production-инфраструктура не исправит leakage.

---

## 4. Разбиение данных

Выберите подходящую схему:
- random;
- group;
- time;
- group-time.

Финальный test остаётся нетронутым.

Та же логика времени и сущностей должна затем использоваться при формировании monitoring-когорт.

---

# Фаза 3. Эксперимент

## 5. Базовый уровень

Постройте:
```text
simple business rule
simple ML baseline
```

Только после этого переходите к более сильной модели.

Для каждого эксперимента сохраняйте:
```text
run_id
code
data
parameters
metrics
```

---

## 6. Выбор модели

Сравнивайте:
```text
quality
stability
calibration
latency
size
interpretability
```

Максимума одной leaderboard-метрики недостаточно.

---

# Фаза 4. Artifact

## 7. Зафиксировать выбранный pipeline

Сохраните вместе:
```text
preprocessing
model
threshold
schema
metadata
dependencies
validation report
```

Назначьте неизменяемую версию.

---

## 8. Эталонные примеры

Подготовьте заранее проверенные запросы:
```text
A → expected probability ~0.21
B → ~0.88
```

Они станут контрактными regression-тестами при изменениях serving или контейнера.

---

# Фаза 5. Serving

## 9. FastAPI

Эндпоинты:
```text
POST /predict
POST /predict-batch
GET /health
GET /ready
GET /model-info
```

Pydantic валидирует вход и выход.

Модель загружается один раз при запуске приложения.

---

## 10. Политика ошибок

Некорректный запрос:
```text
4xx
```

Внутренняя ошибка:
```text
5xx
```

Нельзя молча возвращать прогноз по умолчанию после исключения.

---

# Фаза 6. Контейнер

## 11. Docker

Соберите image, содержащий:
```text
application code
dependencies
optionally model artifact
startup command
```

Запустите внутри контейнера эталонный интеграционный запрос.

Зафиксируйте:
```text
image tag
image digest
model version
```

---

# Фаза 7. Deployment

## 12. Первый production-релиз

До подключения трафика проверьте:
```text
readiness
artifact checksum
schema
smoke test
```

Затем начинайте подавать трафик контролируемо.

Для первого простого проекта может быть достаточно одного стабильного instance.

Чтобы понять lifecycle, Kubernetes не нужен.

---

# Фаза 8. Наблюдаемость сервиса

## 13. Что наблюдать сразу

```text
request rate
5xx rate
p50/p95/p99
memory/CPU
in-flight
model version
```

Используйте структурированные логи с request ID.

---

## 14. Поведение прогнозов

Пока меток нет, отслеживайте:
```text
score distribution
class distribution
unknown category rate
fallback rate
```

Так необычное поведение можно заметить быстро.

---

# Фаза 9. Мониторинг данных

## 15. Референсное окно

Сохраните референсные статистики по подходящим train-данным или стабильному production-периоду.

Сравнивайте с текущими:
```text
missing
quantiles
category frequencies
drift
```

Используйте и бизнес-правила, и статистические методы.

---

## 16. Не реагировать автоматически

Data drift:
```text
alert
```
означает:
```text
investigate
```

а не:
```text
retrain automatically now
```

Сначала проверьте:
- upstream bug;
- seasonality;
- segment change.

---

# Фаза 10. Отложенные метки

## 17. Журнал прогнозов

Сохраняйте:
```text
prediction_id
time
entity
score
decision
model_version
```

Позже присоединяйте фактические метки.

Учитывайте требования к приватности и срокам хранения данных.

---

## 18. Созревание когорты

Для target с горизонтом 30 дней:
```text
do not evaluate yesterday's predictions
```

Оценивайте только созревшие когорты.

Стройте метрику по дате прогноза.

---

# Фаза 11. Мониторинг качества

## 19. Те же метрики, что и на validation

Например:
```text
AP
recall at required precision
calibration
business cost
```

Проверяйте их и по важным сегментам.

Если offline- и production-метрики определены по-разному, их сравнение бессмысленно.

---

## 20. Диагностика деградации

Если AP упала, последовательно спросите:
1. labels correct?
2. data pipeline?
3. model version?
4. drift?
5. segment?
6. concept change?
7. calibration?
8. threshold?

Не переходите сразу к замене алгоритма.

---

# Фаза 12. Условие retraining

## 21. Условия

Например:
```text
mature AP below 0.50 for 2 cohorts
AND
>= 20k new labeled examples
```

или запланированный ежемесячный review.

Trigger должен быть явным и измеримым.

---

# Фаза 13. Запуск retraining

## 22. Пересборка из версионированных входов

Training job получает:
```text
data cutoff
feature version
code commit
config
```

Запуск записывается в experiment tracking.

Результаты запуска:
```text
candidate artifact
evaluation report
validation predictions
```

---

# Фаза 14. Champion/challenger

## 23. Одинаковый benchmark

Оцените:
```text
champion
challenger
```
на одном и том же актуальном holdout.

Сравните:
```text
quality
segments
calibration
latency
model size
```

---

## 24. Проверки кандидата

Пример условий:
```text
AP >= champion + .01
p95 <= 50ms
no critical segment worse > .02
artifact/container tests pass
```

Если хотя бы одно условие не выполнено:
```text
reject
```

Завершившийся retraining сам по себе не является причиной для deployment.

---

# Фаза 15. Registry

## 25. Зарегистрировать точный artifact

```text
churn_prediction
version 19
source_run=...
validation_status=passed
```

Назначьте alias или tag кандидата в соответствии с workflow.

Происхождение версии должно сохраняться.

---

# Фаза 16. Shadow / canary

## 26. Сначала shadow

Champion продолжает принимать реальные решения.

Challenger получает те же live-входы, но его ответы только записываются.

Проверьте:
```text
latency
errors
input compatibility
score distribution
```

---

## 27. Canary, если он уместен

Начните с небольшой доли трафика:
```text
5%
```

Наблюдайте guardrail-метрики.

Увеличивайте долю:
```text
5 → 20 → 50 → 100
```

только если система стабильна.

Для задач с высокой ценой ошибки процесс согласования должен быть строже.

---

# Фаза 17. Продвижение версии

## 28. Смена champion

Текущий alias или deployment pointer переключается на challenger только после всех проверок.

Запишите событие deployment:
```text
time
app version
model version
config/threshold
```

Добавьте отметку о релизе на monitoring dashboard.

---

# Фаза 18. Rollback

## 29. Если что-то пошло не так

Например, на 20% canary-трафика:
```text
p95 40→400ms
```

Немедленное действие:
```text
route back old champion
```

После отката исследуйте challenger offline.

Rollback — заранее спроектированная возможность, а не аварийная импровизация.

---

# Фаза 19. Качество после deployment

## 30. Метки приходят позже

После созревания меток аккуратно сравните когорты периодов champion и challenger.

Если новая модель:
- service healthy;
- but mature quality bad,

выполните rollback или пересмотрите модель в соответствии с риском.

---

# Фаза 20. Документация

## 31. Минимальная запись о релизе

Для каждой production-модели сохраните:
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

В небольшой команде это может быть одна Markdown-запись или карточка в registry.

---

# Структура полного проекта

## 32. Пример репозитория

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

Чтобы показать зрелый ML engineering, не нужны 40 микросервисов.

---

# Что тестировать

## 33. Unit-тесты

Примеры:
```text
feature calculation
schema validators
threshold logic
```

---

## 34. Интеграционные тесты

```text
load real artifact
→ API request
→ expected response structure
```

---

## 35. Эталонные regression-тесты

Для известного примера модель должна вернуть ожидаемую оценку в заданном допуске.

---

## 36. Тесты данных

При обучении:
```text
schema
target
time windows
```

В production:
```text
required fields
ranges
missing spikes
```

---

## 37. Тест производительности

```text
p95 latency
throughput
memory
```

для модели-кандидата.

---

# System design для собеседования

## 38. Сильный ответ

Вопрос:
> Как вы развернёте модель и будете наблюдать за ней?

Короткий сильный ответ:

> Я сохраню preprocessing и estimator как единый версионированный artifact со схемами входа и выхода и выбранным threshold. Опубликую его через FastAPI с Pydantic-валидацией, health/readiness-проверками и структурированными логами, упакую runtime в Docker и выведу метрики задержки и ошибок сервиса. Сразу начну наблюдать пропуски, распределения входов и прогнозов, а после созревания меток соединю ground truth с журналом прогнозов и буду считать те же метрики качества и калибровки, что offline. Каждый запуск обучения свяжу с code/data/config в experiment tracking, а выбранные artifacts помещу в model registry. Новый challenger должен победить champion на одном holdout, пройти проверки latency, schema и сегментов, а затем пройти shadow- или canary-релиз с возможностью rollback.

Такой ответ показывает понимание всей системы, а не перечисление buzzwords.

---

# Что пока не добавлять

## 39. Kubernetes

Полезен при большом масштабе orchestration, но не нужен для понимания базового ML lifecycle.

## 40. Kafka

Полезна для event streaming, когда этого требуют ограничения задачи.

Message broker нужен не каждому prediction service.

## 41. Feature Store

Полезен, когда много моделей совместно используют online- и offline-признаки.

Для одного проекта:
```text
well-tested feature code + Pipeline
```
может быть достаточно.

## 42. Airflow

Полезен для запуска DAG по расписанию.

Первый retraining workflow можно понять на простом cron или script.

Принцип:
> добавляйте инфраструктуру, когда этого требует конкретное ограничение.

---

# Итоговые сценарии отказов

## 43. Сценарий A — API работает, модель плохая

```text
200 rate 100%
p95 20ms
AP 0.55→0.31
```

Исследуйте данные, метки, concept drift и модель, а не FastAPI.

---

## 44. Сценарий B — drift есть, качество стабильно

```text
income PSI high
AP stable
business metric stable
```

Исследуйте и наблюдайте; автоматический retraining не нужен.

---

## 45. Сценарий C — challenger лучше, но медленнее

```text
AP +0.04
p95 3× SLA
```

Отклоните или оптимизируйте кандидата.

---

## 46. Сценарий D — новая модель слишком часто возвращает класс C

Сразу после deployment:
```text
class C 10%→80%
```

Проверьте:
- model/config;
- preprocessing;
- threshold;
- schema;
- real traffic change.

Выполните rollback, если ситуация операционно небезопасна.

---

## 47. Сценарий E — после retraining доля target равна нулю

Остановите pipeline.

Проверьте извлечение меток.

Не продвигайте такую модель.

---

## 48. Сценарий F — резко выросла доля неизвестных категорий

Сервис не упал, потому что OHE игнорирует неизвестные категории.

Но доступная модели информация ухудшилась.

Исследуйте upstream-изменение или новую категорию и запускайте retraining только после объяснения причины.

---

## 49. Интерактивная визуализация DataPath

### Симулятор жизненного цикла

Полная карта системы:

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

Ученик получает описание инцидента и должен определить, на каком слое искать причину.

### Карточки инцидентов
- отсутствует обязательный признак;
- выросла задержка ответа;
- изменилось распределение входных данных;
- изменилась связь признаков с целевой переменной;
- новая модель не прошла проверку;
- версия model artifact не совпадает с контрактом сервиса.

После неверного действия показывается его последствие.

Пример:
```text
Ошибка в data pipeline
→ ученик выбирает переобучение
→ новая модель обучается на повреждённых данных
→ качество падает ещё сильнее
```

Это итоговое упражнение на системное мышление: наблюдаемый симптом ещё не определяет правильное действие.

---

## 50. Практика: сквозной проект

### Задание

Возьмите обученную табличную модель и соберите вокруг неё минимальный воспроизводимый цикл:

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

Kubernetes для этой задачи не нужен.

Такого объёма достаточно для серьёзного портфолио-проекта начинающего Data Scientist или ML Engineer: в нём видны не только обучение, но и контракт, наблюдаемость и безопасное обновление.

---

## 51. Итоговая модель системы

У production ML-системы есть пять взаимосвязанных слоёв.

### Данные
Корректны и актуальны ли входы и метки?

### Модель
Обобщает ли предиктор на новые данные и остаются ли его оценки полезными и, где требуется, откалиброванными?

### Программная часть
Можно ли надёжно загрузить artifact и получить прогноз через сервис?

### Наблюдаемость
Можем ли мы заметить инцидент и объяснить, где он возник?

### Жизненный цикл
Можем ли мы воспроизвести результат, сравнить версии, безопасно обновиться и откатиться?

Если один слой отсутствует, production ML-система остаётся неполной.

---

## Типичные ошибки

**«MLOps = Docker».**\
Docker решает только задачу упаковки среды выполнения.

**«Monitoring = CPU/RAM».**\
Нужно также наблюдать данные, прогнозы, качество модели и бизнес-результат.

**«Drift = retrain».**\
Нет: сначала нужно проверить источник изменения и доступные метки.

**«Registry automatically makes system production-ready».**\
Нет: registry хранит версии и lineage, но не заменяет проверки, сервис и мониторинг.

**«Best model should always become champion».**\
Только после прохождения всех ограничений по качеству и инженерной надёжности.

**«Need Kubernetes to call project MLOps».**\
Нет: зрелость определяется управляемым жизненным циклом, а не количеством инфраструктуры.

**«Automation removes need for ML methodology».**\
Нет: автоматизация одинаково быстро повторяет и хороший, и ошибочный процесс.

---

## Проверка понимания

1. Из каких частей состоит model artifact?
2. Чем readiness-проверка отличается от простой проверки, что процесс запущен?
3. Чем метрика сервиса отличается от метрики модели?
4. В чём разница между data drift и concept drift?
5. Почему качество нельзя честно оценивать до созревания меток?
6. Что даёт experiment tracking, чего не даёт имя файла модели?
7. Какова роль model registry?
8. Как сравниваются champion и challenger?
9. Чем shadow-запуск отличается от canary?
10. Какие условия делают быстрый rollback возможным?
11. Когда drift действительно должен привести к retraining?
12. Почему инфраструктура без измеримой задачи не улучшает ML-систему?

---

## Что нужно унести из всего блока

1. Обучение — только начало жизненного цикла модели.
2. Artifact включает preprocessing, схему, threshold и metadata.
3. FastAPI задаёт типизированный контракт инференса.
4. Docker делает среду выполнения воспроизводимой.
5. Логи и метрики показывают поведение сервиса.
6. Data drift и prediction drift служат ранними сигналами, а не готовым диагнозом.
7. Для честной оценки качества нужны метки и созревшие когорты.
8. Concept drift возможен без заметного изменения распределения `X`.
9. Experiment tracking связывает результат с конфигурацией запуска.
10. Model registry управляет выбранными версиями релиза и их происхождением.
11. Challenger обязан пройти проверки качества и инженерные ограничения.
12. Shadow и canary уменьшают риск обновления.
13. Для rollback нужны неизменяемые предыдущие релизы.
14. Retraining — контролируемое решение, а не автоматическая реакция.
15. MLOps на уровне Data Scientist или ML Engineer — дисциплинированный жизненный цикл, а не набор инфраструктурных инструментов.

## Куда дальше

Урок №100 завершает основную каноническую линию DataPath v2.

Дальше полезнее не добавлять ещё один инструмент, а пройти сквозной проект из этого урока: связать artifact, API, monitoring, delayed labels, challenger и rollback в одну проверяемую систему.

## Источники
- FastAPI official documentation.
- Docker official documentation.
- Prometheus instrumentation guidance.
- MLflow Tracking and Model Registry documentation.
- Previous canonical DataPath lessons and ML validation principles.
