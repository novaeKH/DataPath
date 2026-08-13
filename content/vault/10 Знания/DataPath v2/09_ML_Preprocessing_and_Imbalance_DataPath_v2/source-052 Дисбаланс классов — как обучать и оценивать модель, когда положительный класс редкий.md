---
title: "Дисбаланс классов — как обучать и оценивать модель, когда положительный класс редкий"
id: concept.datapath-v2.052
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 52
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Дисбаланс классов: как обучать и оценивать модель, когда положительный класс редкий

Представим задачу мошенничества.

Из 100 000 транзакций:

```text
99 500 обычных
500 мошеннических
```

Модель, которая всегда говорит:

```text
обычная транзакция
```

получит:

```text
accuracy = 99.5%
```

Но не найдёт ни одного случая fraud.

Именно поэтому **дисбаланс классов (class imbalance)** — не просто «неравное количество строк». Это ситуация, где стандартная интуиция про качество легко вводит в заблуждение, а ошибки разных типов обычно имеют разную цену.

Главная цель урока — научиться разделять три разных рычага:

```text
1. как мы оцениваем model;
2. как мы обучаем model;
3. как мы выбираем decision threshold.
```

Они связаны, но это не одно и то же.

---

## 1. Дисбаланс сам по себе не является ошибкой dataset

Если fraud реально составляет 0.5%, то dataset может честно отражать production.

Не нужно автоматически «исправлять» distribution до 50/50.

Первый вопрос:

> редкий class действительно редкий в реальном мире или это артефакт sampling?

Если production prevalence 0.5%, model должна в конечном счёте работать именно в таком режиме.

---

## 2. Почему accuracy часто бесполезна

Напомним терминологию:

> **accuracy — доля правильных ответов**, а не «точность».

Для always-negative classifier:

\[
accuracy=\frac{99\,500}{100\,000}=0.995.
\]

Но:

\[
recall=\frac{TP}{TP+FN}=0.
\]

Модель совершенно не решает задачу обнаружения positives.

Поэтому при imbalance обязательно смотреть на confusion-matrix based metrics и ranking quality.

---

## 3. Precision и recall

**Точность (precision)**:

\[
precision=\frac{TP}{TP+FP}.
\]

Отвечает:

> среди объектов, которые мы назвали positive, сколько действительно positive?

**Полнота (recall)**:

\[
recall=\frac{TP}{TP+FN}.
\]

Отвечает:

> какую долю всех реальных positives мы нашли?

Для fraud:

- FP → зря заблокировали нормальную транзакцию;
- FN → пропустили мошенничество.

Эти ошибки имеют разную стоимость.

---

## 4. Threshold важнее, чем кажется

Пусть model выдаёт probabilities/scores.

При threshold 0.8:

```text
positive predictions мало
precision обычно выше
recall ниже
```

При threshold 0.2:

```text
positive predictions больше
recall выше
precision может снизиться
```

Поэтому class imbalance нельзя обсуждать только через training weights.

Иногда сильная ranking model уже есть, а нужное business behavior достигается настройкой threshold.

---

## 5. ROC-AUC и PR-AUC / AP

ROC-AUC измеряет ranking quality по всему диапазону thresholds.

Но при огромном числе negatives даже небольшой false positive rate может означать много FP в абсолютных числах.

Поэтому при редком positive class особенно полезна precision-recall кривая и Average Precision (AP).

Если positive prevalence:

```text
0.5%
```

случайный ranking имеет очень низкий baseline AP. Поэтому AP=0.20 может быть гораздо сильнее, чем кажется по числу «20%».

---

![Учебная иллюстрация: Дисбаланс классов. Высокая доля правильных ответов может скрывать нулевую полноту редкого класса; порог меняет компромисс.](content-assets/datapath-v2/figures/52_class_imbalance.png "Высокая доля правильных ответов может скрывать нулевую полноту редкого класса; порог меняет компромисс.")

## 6. Начинаем с baseline без resampling

Перед SMOTE полезно обучить обычный baseline:

```text
Logistic Regression
Random Forest
CatBoost
```

с корректной metric.

Почему?

Чтобы понять, существует ли проблема обучения вообще.

Некоторые estimators вполне хорошо rank positives даже при сильном imbalance.

Автоматическое resampling до baseline лишает нас точки сравнения.

---

## 7. Class weights

Один из способов изменить обучение — увеличить стоимость ошибки на minority class.

В scikit-learn многие estimators поддерживают:

```python
class_weight="balanced"
```

Для режима `"balanced"` weights рассчитываются примерно обратно пропорционально частотам классов.

Интуитивно:

```text
редкий class
→ каждый его объект сильнее влияет на training objective
```

Но это не означает:

> probability output после weighting автоматически остаётся идеально calibrated.

Weights меняют objective и могут изменить probability scale.

---

## 8. Class weight и threshold — разные рычаги

Это один из самых важных пунктов.

**Class weight**

изменяет процесс обучения:

```text
model сильнее штрафуется за некоторые ошибки
```

**Threshold**

изменяет решение поверх уже полученного score/probability:

```text
score >= threshold → positive
```

Нельзя считать их взаимозаменяемыми.

Можно:

- обучить unweighted model и изменить threshold;
- обучить weighted model и всё равно отдельно выбрать threshold;
- сравнить оба подхода на validation.

---

## 9. Sample weights

Иногда стоимость зависит не только от class, но и от объекта.

Например fraud amount:

```text
мошенничество на $5
мошенничество на $50 000
```

Бизнес-цена FN разная.

Некоторые estimators позволяют передавать `sample_weight`, чтобы разные samples имели разный вклад.

Это потенциально ближе к бизнес-цене, чем просто одинаковый weight всех positives.

Но weights должны быть обоснованы, а не подобраны ради красивой validation metric.

---

## 10. Random oversampling

Самый простой resampling minority class:

> случайно дублировать minority examples.

В `imbalanced-learn` есть `RandomOverSampler`.

Плюс:

- minority чаще встречается во время обучения.

Минус:

- новой информации не появляется;
- repeated objects могут усилить overfit;
- размер training set растёт.

---

## 11. Random undersampling

Можно вместо увеличения minority уменьшить majority:

```text
99 500 negatives
500 positives

→ взять, например,
5 000 negatives
500 positives
```

Плюсы:

- обучение быстрее;
- balance лучше.

Минус:

- выбрасываем реальные majority information;
- можно потерять важные boundary cases.

На огромных datasets undersampling иногда очень практичен, но его нужно валидировать.

---

## 12. SMOTE: синтетические minority points

**SMOTE (Synthetic Minority Over-sampling Technique)** не просто копирует существующие minority examples.

Упрощённо:

1. выбрать minority object;
2. найти его minority neighbors;
3. выбрать neighbor;
4. создать synthetic point между ними.

Если:

\[
x_i=(1,2),
\quad
x_j=(3,4)
\]

то synthetic point может быть:

\[
x_{new}=x_i+\lambda(x_j-x_i),
\]

где \(\lambda\in[0,1]\).

При \(\lambda=0.5\):

\[
x_{new}=(2,3).
\]

---

## 13. Что SMOTE предполагает

SMOTE использует neighborhood geometry.

Значит, implicit assumption:

> промежуточная точка между похожими minority objects тоже правдоподобна как minority example.

Это может быть разумно для continuous feature space.

Но не всегда.

Если признаки имеют сложные constraints или category semantics, простая interpolation может создать невозможный объект.

---

## 14. Почему обычный SMOTE опасен для категорий

Представим:

```text
city_code:
0=Moscow
1=Kazan
```

Интерполяция может создать:

```text
city_code=0.4
```

что не имеет смысла.

В `imbalanced-learn` есть отдельные variants, например `SMOTENC` для mixed continuous/categorical data и `SMOTEN` для nominal data.

Но даже специальный variant не гарантирует, что synthetic business object реалистичен.

---

## 15. SMOTE может создавать плохую boundary geometry

Если minority class состоит из:

- нескольких clusters;
- outliers;
- noisy labels,

interpolation может соединять точки, между которыми в реальности проходит majority region.

Официальный user guide imbalanced-learn показывает, что SMOTE/ADASYN могут давать ill-posed synthetic examples.

Поэтому:

> SMOTE — experiment, а не обязательный этап любого imbalanced dataset.

---

## 16. Самая опасная ошибка: resampling до split

Неправильно:

```text
SMOTE на всём dataset
→ train/test split
```

Synthetic train objects могут быть созданы с использованием neighbors, которые потом оказываются в validation/test.

Это leakage.

Правильно:

```text
split
→ resampling только train
→ fit model
→ validation остаётся в реальном distribution
```

При CV sampler должен работать **внутри каждого fold train**.

Для этого удобно использовать pipeline из `imbalanced-learn`.

---

## 17. Почему validation нельзя балансировать искусственно

Production prevalence:

```text
1% positive
```

Если validation сделать:

```text
50/50
```

precision и многие probability-related metrics перестанут отражать production regime.

Training distribution можно намеренно изменять.

Validation/test желательно сохранять репрезентативными для реального use case, если только цель evaluation не иная и явно определена.

---

## 18. ADASYN и variants

ADASYN тоже создаёт synthetic minority samples, но больше концентрируется на трудных regions, определяемых через nearest neighbors.

Есть также:

- BorderlineSMOTE;
- KMeansSMOTE;
- SVMSMOTE;
- комбинации over/under sampling.

Не нужно запоминать зоопарк методов.

Главный mental model:

```text
разные samplers
→ разные assumptions о том,
где создавать или удалять samples
```

Сравнение — только через корректную validation scheme.

---

## 19. Balanced ensembles

Есть algorithms, которые встраивают balancing в ensemble.

Например в `imbalanced-learn` существуют balanced bagging/forest approaches.

Идея:

```text
каждый base learner
→ получает свой balanced subset
```

Это может быть эффективнее глобального resampling всего dataset.

Но снова: сначала простой baseline.

---

## 20. Threshold по бизнес-ограничению

Представим fraud team может проверить максимум 1000 транзакций в день.

Тогда не обязательно максимизировать F1.

Можно:

1. получить scores;
2. выбрать top 1000;
3. измерить precision/recall/Lift в этом capacity.

Другой бизнес требует:

```text
Recall >= 90%
```

и среди таких thresholds выбирает самый высокий precision.

Threshold selection должна моделировать downstream action.

---

## 21. Precision зависит от prevalence

Допустим model имеет одинаковые TPR/FPR в двух populations.

Если prevalence fraud изменилась с 5% до 0.5%, precision обычно резко упадёт.

Почему?

Потому что negatives стало намного больше, и даже небольшой FPR создаёт большой поток FP.

Это важнейший production effect: model quality может казаться той же по ROC, но operational burden изменится из-за prevalence shift.

---

## 22. Probability after resampling

Если обучить probabilistic classifier на искусственно изменённой class distribution, raw probabilities могут сместиться относительно реальной prevalence.

Например training after oversampling:

```text
50% positives
```

а production:

```text
1%
```

Модель обучалась в другой prior environment.

Поэтому после weighting/resampling особенно важно проверять **calibration** на реальном validation distribution.

Это мост к следующему уроку.

---

## 23. Практический baseline

```python
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score

model = LogisticRegression(
    class_weight="balanced",
    max_iter=1000,
)

model.fit(X_train, y_train)

proba = model.predict_proba(X_valid)[:, 1]
ap = average_precision_score(y_valid, proba)
```

Сравнить минимум:

```text
unweighted
weighted
```

на одних и тех же folds.

---

## 24. SMOTE внутри pipeline

```python
from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

model = Pipeline([
    ("scale", StandardScaler()),
    ("smote", SMOTE(random_state=42)),
    ("classifier", LogisticRegression(max_iter=1000)),
])
```

Во время CV SMOTE должен применяться только к fold train.

Validation fold остаётся untouched.

---

## 25. Что сравнивать

Для каждого approach:

```text
baseline
class_weight
undersampling
oversampling
SMOTE
```

смотреть:

- AP / PR curve;
- ROC-AUC;
- precision at useful recall;
- recall at useful precision;
- business cost;
- calibration;
- CV stability;
- training/inference cost.

Нельзя выбирать sampler по train distribution.

---

## 26. Интерактивная визуализация DataPath

### Экран 1. Accuracy trap

99 negatives и 1 positive.

Кнопка:

```text
Always predict 0
```

Показывать:

```text
accuracy = 99%
recall = 0%
```

### Экран 2. Threshold

Slider probability threshold.

В реальном времени:

- confusion matrix;
- precision;
- recall;
- number of flagged objects.

### Экран 3. Sampling

2D minority/majority cloud.

Modes:

```text
Original
RandomOverSampler
SMOTE
Undersampling
```

Показывать, что SMOTE создаёт points между neighbors.

### Экран 4. Leakage

Если SMOTE выполняется до split, synthetic connections пересекают validation boundary — красное предупреждение.

---

## 27. Типичные ошибки

**«Imbalance надо обязательно сделать 50/50».**\
Нет.

**«Высокая accuracy значит model хорошая».**\
Нет при редком positive class.

**«Class weights и threshold — одно и то же».**\
Нет.

**«SMOTE всегда улучшает model».**\
Нет.

**«SMOTE можно делать до CV».**\
Нет, leakage.

**«Validation тоже надо oversample».**\
Обычно нет: evaluation должна отражать реальный distribution.

**«ROC-AUC полностью описывает rare-event problem».**\
Нет, нужны PR/business metrics.

**«Weights сохраняют probability calibration автоматически».**\
Не гарантируется.

---

## 28. Проверка понимания

1. Почему 99% accuracy может быть бесполезна?
2. Чем precision отличается от recall?
3. Что меняет class weight?
4. Что меняет threshold?
5. Как работает RandomOverSampler?
6. Чем SMOTE отличается от duplication?
7. Какое assumption делает interpolation?
8. Почему SMOTE до split — leakage?
9. Почему validation не надо искусственно балансировать?
10. Почему prevalence влияет на precision?

---

## 29. Мини-практика

Dataset:

```text
200 000 объектов
positives = 0.8%
```

Модели:

| Approach | ROC-AUC | AP | Precision@Recall=0.8 |
|---|---:|---:|---:|
| Baseline | 0.91 | 0.18 | 0.11 |
| class_weight | 0.90 | 0.20 | 0.15 |
| SMOTE | 0.92 | 0.19 | 0.12 |

Ответьте:

1. какая approach лучше при requirement Recall=0.8;
2. почему ROC-AUC alone дал бы другой impression;
3. нужно ли ещё сравнить thresholds;
4. что проверить по calibration;
5. как CV должен применять SMOTE.

---

## 30. Как объяснить на собеседовании

### Что делать при class imbalance?

**Коротко.**\
Сначала выбрать корректную metric и validation scheme, затем построить baseline. После этого сравнить class weights, threshold tuning и при необходимости resampling. SMOTE применять только внутри training folds.

### Чем class weight отличается от threshold?

Class weight меняет objective во время обучения; threshold меняет hard decision поверх model score после обучения.

### Когда полезен SMOTE?

Когда synthetic interpolation minority neighborhood осмысленна и validation показывает улучшение. Это не универсальное решение.

---

## 31. Что нужно унести

1. Imbalance не означает, что dataset неправильный.
2. Accuracy может быть бесполезна при rare positives.
3. Precision и recall отражают разные ошибки.
4. Threshold — отдельный business lever.
5. Class weights меняют training objective.
6. Resampling меняет training distribution.
7. SMOTE интерполирует между minority neighbors.
8. Synthetic sampling имеет assumptions и может вредить.
9. Sampling применяется только внутри train folds.
10. Validation/test должны отражать реальный regime.
11. Prevalence влияет на precision.
12. Weighting/resampling могут повлиять на calibration.

---

## Куда дальше

После imbalance мы можем получить model, которая отлично ранжирует объекты.

Но если model говорит:

```text
P(default)=0.8
```

можно ли это понимать как:

> примерно 80 из 100 похожих клиентов действительно default?

Не всегда.

Следующий урок — калибровка вероятностей (probability calibration).

## Источники
- scikit-learn — class/sample weights and classification metrics.
- imbalanced-learn User Guide — over-sampling, SMOTE, under-sampling and pipelines.
