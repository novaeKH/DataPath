---
title: "Cross-validation, подбор гиперпараметров и сохранение Pipeline"
id: concept.datapath-v2.036
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 36
canonical_course: "scikit-learn"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Cross-validation, подбор гиперпараметров и сохранение Pipeline

Один holdout score может сильно зависеть от случайного split. Cross-validation повторяет train/validation на нескольких folds и показывает среднее качество и его разброс. Но CV должен уважать структуру задачи: классы, группы и время.

## KFold/StratifiedKFold

KFold делит observations на folds. Для classification StratifiedKFold приблизительно сохраняет class proportions. Stratification не решает leakage repeated clients.

## GroupKFold

Если один client имеет много rows, все его rows должны оставаться в одном fold. GroupKFold предотвращает entity overlap между train/validation.

## Time split

Future prediction требует time-aware validation. Обычный KFold перемешивает past/future и может завысить quality. `TimeSeriesSplit` — один базовый инструмент, но custom business cutoffs часто понятнее.

## `cross_validate`

Можно получать несколько metrics и train/test times. Смотрите mean и std, а не только одно число. Большой fold variance — сигнал нестабильности/segments.

## Grid vs randomized search

`GridSearchCV` перебирает все заданные combinations; `RandomizedSearchCV` фиксирует number sampled configurations и удобнее для больших spaces. Оба должны получать whole Pipeline, чтобы preprocessing fit inside CV.

## Scoring

scikit-learn scorers иногда используют sign conventions, например loss-like metrics могут быть представлены как negative score, потому что framework максимизирует scorer. Читайте название scorer и docs.

## Final fit and test

После выбора hyperparameters Pipeline refit-ится на разрешённой training data и один раз оценивается на untouched test. `best_score_` — результат model selection, не независимая final estimate.

## Persistence

Сохраните весь fitted Pipeline через `joblib`, а рядом — metadata, library versions, feature schema и metric. Загружайте pickle/joblib artifacts только из доверенного источника.

## Полный маршрут выбора модели

Сначала один раз отделяют test и больше не используют его для решений. На оставшейся обучающей части выбирают схему CV, соответствующую данным: стратификацию для долей классов, группы для повторных сущностей или временные границы для прогноза будущего. В каждый fold целиком попадает Pipeline, поэтому все обучаемые преобразования видят только локальную train-часть.

По результатам folds сравнивают не только среднее, но и разброс. Разница в две тысячных при большом разбросе редко оправдывает сложную модель. Поиск гиперпараметров также является частью выбора: `best_score_` оптимистично связан с просмотренными конфигурациями и не заменяет независимую test-оценку.

После выбора конфигурации лучший Pipeline заново обучается на всей разрешённой train-выборке и ровно один раз проверяется на test. Если результат приемлем, сохраняют весь объект вместе с версией библиотек, схемой признаков, датой данных и правилом формирования target. Один файл без этого контекста недостаточен для воспроизводимости.

Наконец, загрузка `joblib` исполняет механизм Python pickle и допустима только для доверенного файла. После загрузки полезен smoke-test на известном примере: он проверяет не качество модели целиком, а совместимость артефакта и входного контракта.

## Практический код

```python
from sklearn.model_selection import (
    StratifiedKFold,
    RandomizedSearchCV,
)
import joblib

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)

search = RandomizedSearchCV(
    pipe,
    param_distributions={
        "model__C": [0.01, 0.1, 1, 10],
    },
    n_iter=4,
    scoring="average_precision",
    cv=cv,
)

search.fit(X_train, y_train)

best_pipe = search.best_estimator_
joblib.dump(best_pipe, "model.joblib")
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- использовать StratifiedKFold при repeated clients и считать проблему решённой
- random CV для future forecasting
- search model отдельно от preprocessing
- считать `best_score_` final test quality
- сохранять только estimator без preprocessing
- загружать untrusted joblib/pickle

## Проверка понимания

1. KFold vs StratifiedKFold?
2. Когда GroupKFold?
3. Почему time split?
4. Что показывает CV std?
5. Grid vs Randomized?
6. Почему whole Pipeline inside search?
7. Why test untouched?
8. Что сохранять рядом с artifact?

## Мини-практика

Для задачи churn с repeated client snapshots и временем предложите validation scheme. Затем настройте search `model__C`, сохраните best Pipeline и перечислите metadata, необходимую для воспроизводимости.

## Что нужно унести

scikit-learn даёт полный безопасный цикл: Pipeline → appropriate CV → search → refit → final test → serialized whole pipeline. Это непосредственный мост к Classic ML.

## Куда дальше

Следующий блок начинается с постановки ML-задачи, train/validation/test и метрик, после чего переходит к линейным и нелинейным моделям.
