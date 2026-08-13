---
title: "Градиентный бустинг — как ансамбль последовательно исправляет собственный прогноз"
id: concept.datapath-v2.048
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 48
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Градиентный бустинг: как ансамбль последовательно исправляет собственный прогноз

Random Forest решает нестабильность дерева через множество независимых моделей и усреднение.

Градиентный бустинг (Gradient Boosting) выбирает другой путь:

> **строить деревья по очереди и каждое новое направлять на слабые места уже построенного ансамбля.**

Это одна из центральных идей современного машинного обучения на табличных данных.

Цель урока — уйти от слишком грубой фразы:

> «новое дерево учится на ошибках предыдущего дерева»

и прийти к точной:

> **новое дерево добавляет поправку к текущей композиции моделей и в общем случае аппроксимирует антиградиент выбранной функции потерь.**

---

## 1. Начинаем с очень простой модели

Задача регрессии:

| Расстояние, км | Стоимость |
|---:|---:|
| 1 | 10 |
| 2 | 12 |
| 5 | 20 |
| 6 | 22 |

Пока всем объектам дадим один prediction.

Для squared error лучшая константа — средний target:

\[
F_0=\frac{10+12+20+22}{4}=16.
\]

То есть:

```text
любой заказ → 16
```

Ошибки:

| y | prediction | residual = y - prediction |
|---:|---:|---:|
| 10 | 16 | -6 |
| 12 | 16 | -4 |
| 20 | 16 | +4 |
| 22 | 16 | +6 |

Теперь видно, в какую сторону надо исправлять каждый prediction.

---

## 2. Первое дерево как поправка

Обучим маленькое regression tree предсказывать residuals.

Пусть оно находит:

```text
distance <= 3 → correction = -5
distance > 3  → correction = +5
```

После полной поправки:

| x | Было | Поправка | Стало |
|---:|---:|---:|---:|
| 1 | 16 | -5 | 11 |
| 2 | 16 | -5 | 11 |
| 5 | 16 | +5 | 21 |
| 6 | 16 | +5 | 21 |

Новая композиция:

\[
F_1(x)=F_0(x)+h_1(x).
\]

После неё residuals:

```text
-1, +1, -1, +1
```

Следующее дерево строится уже для **новой композиции**, а не для одного предыдущего tree.

Это принципиально:

> каждое новое дерево исправляет текущий ансамбль целиком.

---

## 3. Аддитивная модель

После \(M\) итераций:

\[
F_M(x)
=
F_0(x)+h_1(x)+h_2(x)+\dots+h_M(x).
\]

В реальном boosting вклад обычно уменьшается через скорость обучения (learning rate):

\[
F_m(x)=F_{m-1}(x)+\eta h_m(x).
\]

Итоговый prediction постепенно собирается из многих небольших corrections.

---

## 4. Почему residual — только частный случай

Для squared error:

\[
L(y,F)=\frac12(y-F)^2.
\]

Производная по текущему prediction:

\[
\frac{\partial L}{\partial F}=F-y.
\]

Чтобы уменьшать loss, двигаемся в противоположную сторону:

\[
-\frac{\partial L}{\partial F}=y-F.
\]

А это residual:

\[
r=y-\hat y.
\]

Поэтому в MSE-regression фраза «tree учится на residuals» точна.

Но общий принцип шире:

> новое дерево приближает направление изменения prediction, которое уменьшает текущую функцию потерь.

Для другой loss целевой training signal будет другим.

---

## 5. Почему бустинг называется градиентным

Обычный градиентный спуск (Gradient Descent) меняет параметры:

\[
\theta_{t+1}
=
\theta_t-\eta\nabla_\theta L.
\]

Gradient Boosting постепенно меняет **саму функцию prediction**:

\[
F_m=F_{m-1}+\eta h_m.
\]

Это можно понимать как градиентное движение в пространстве функций.

Для практики не нужно доказывать функциональный Gradient Descent. Важно понять, откуда появляются derivatives и почему residuals — лишь один частный случай.

---

## 6. Две итерации руками

Начальный prediction:

\[
F_0=16.
\]

Первое tree:

\[
h_1=
\begin{cases}
-5,&x\le3\\
+5,&x>3.
\end{cases}
\]

Пусть:

```text
learning_rate = 0.5
```

Тогда:

\[
F_1=F_0+0.5h_1.
\]

| x | y | F₀ | h₁ | F₁ |
|---:|---:|---:|---:|---:|
| 1 | 10 | 16 | -5 | 13.5 |
| 2 | 12 | 16 | -5 | 13.5 |
| 5 | 20 | 16 | +5 | 18.5 |
| 6 | 22 | 16 | +5 | 18.5 |

Новые residuals:

```text
-3.5
-1.5
+1.5
+3.5
```

Второе tree уже пытается описать эту новую структуру.

Так сложный prediction складывается постепенно.

---

![Учебная иллюстрация: Градиентный бустинг. Начальный прогноз, residuals и последовательные деревья-коррекции.](content-assets/datapath-v2/figures/48_gradient_boosting.png "Начальный прогноз, residuals и последовательные деревья-коррекции.")

## 7. Зачем нужен `learning_rate`

Если tree нашло полезную correction, почему не добавить её полностью?

Потому что локально хороший шаг может оказаться слишком агрессивным.

Большой `learning_rate`:

```text
быстро меняет ensemble
→ нужно меньше iterations
→ выше риск резкой подгонки
```

Маленький:

```text
небольшие corrections
→ нужно больше iterations
→ обучение обычно плавнее
```

Главное правило:

> `learning_rate` и число итераций нужно рассматривать вместе.

---

## 8. Почему base trees часто неглубокие

В Random Forest deep tree допустим: variance потом уменьшается averaging.

В boosting каждое дерево — очередная correction.

Если correction слишком сложная, она может сразу подхватить noise.

Поэтому часто начинают с относительно слабых деревьев.

Но универсального `max_depth=3` нет: complexity выбирается по validation.

---

## 9. Что происходит после `fit()`

Концептуально:

```text
1. выбрать initial prediction F0;
2. получить current predictions;
3. вычислить negative gradient loss;
4. обучить regression tree приближать этот signal;
5. определить leaf corrections;
6. умножить вклад на learning_rate;
7. обновить ensemble;
8. повторить.
```

После обучения модель хранит последовательность trees.

`predict()`:

```text
initial prediction
+ correction 1
+ correction 2
+ ...
```

---

## 10. Почему classification trees здесь не «голосуют»

В бинарной классификации boosting часто оптимизирует logloss.

Внутри next tree аппроксимирует числовой gradient signal, а не голосует за hard class.

Поэтому описание:

> «много классификационных деревьев голосуют»

гораздо ближе к Random Forest.

Boosting — это сумма последовательных числовых corrections.

---

## 11. Loss и metric — разные уровни

Модель может обучаться по:

```text
logloss
```

сравниваться по:

```text
PR-AUC
```

а production threshold выбираться по:

```text
стоимости FP и FN
```

Boosting уменьшает training loss. Он не обязан на каждой новой итерации улучшать любую бизнес-метрику.

---

## 12. Где возникает переобучение

Пример:

```text
train ROC-AUC      = 0.997
validation ROC-AUC = 0.812
```

Возможные причины:

- слишком глубокие base trees;
- слишком большой `learning_rate`;
- слишком много iterations;
- слабая regularization;
- leakage;
- неправильный split.

Перед tuning complexity сначала проверяем корректность эксперимента.

---

## 13. Early stopping

Пусть допускается до:

```text
5000 iterations
```

Validation quality:

```text
100  → лучше
300  → лучше
700  → лучше
900  → почти без изменений
1200 → хуже
```

Ранняя остановка (early stopping) позволяет сохранить лучшую итерацию и остановить дальнейшую подгонку.

Правильная иерархия:

```text
train
→ обучение

validation / CV
→ tuning + early stopping

test
→ финальная независимая оценка
```

Если бесконечно менять модель, глядя на один validation set, можно переобучиться уже на validation.

---

## 14. Stochastic boosting

Можно на каждой итерации использовать только часть объектов:

```text
subsample < 1
```

Это добавляет случайность и может работать как regularization.

Похожим образом применяется feature subsampling.

Эти идеи активно используются современными boosting libraries.

---

## 15. Главные параметры как карта поведения

### `n_estimators` / `iterations`

Мало:

```text
ensemble не успел описать signal
→ underfit
```

Слишком много без контроля:

```text
начинает описывать noise
```

### `learning_rate`

Размер correction.

### Tree depth / leaves

Сложность одного шага.

### `min_samples_leaf`

Не позволяет строить corrections на слишком маленьких группах.

### `subsample`

Добавляет stochasticity по объектам.

### Feature subsampling

Добавляет stochasticity по признакам.

---

## 16. Random Forest vs Gradient Boosting

| Аспект | Random Forest | Gradient Boosting |
|---|---|---|
| Trees | Независимые | Последовательные |
| Aggregation | Усреднение | Сумма corrections |
| Главная идея | variance ↓ | loss ↓ шаг за шагом |
| Base trees | Часто глубокие | Часто слабее |
| Parallelization | Легко | Stages зависят друг от друга |
| Tuning | Обычно проще | Чувствительнее |
| Early stopping | Не центральный | Очень важен |

Обе модели надо сравнивать на одной validation scheme.

---

## 17. Реальный код

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import average_precision_score

model = GradientBoostingClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=3,
    random_state=42,
)

model.fit(X_train, y_train)

proba = model.predict_proba(X_valid)[:, 1]
ap = average_precision_score(y_valid, proba)
```

На больших tabular datasets стоит также знать histogram-based estimators, которые ускоряют split search через binning.

---

## 18. Как boosting выглядит в реальном проекте

Неправильно:

```text
прочитать CSV
→ CatBoost
→ ROC-AUC
→ готово
```

Правильно:

```text
prediction moment
→ leakage checks
→ split
→ baseline
→ preprocessing
→ metric
→ boosting
→ early stopping / CV
→ threshold
→ segment error analysis
→ final test
```

Сильная модель не заменяет правильный ML experiment.

---

## 19. Интерактивная визуализация DataPath

### Состояние 0

Показать точки и горизонтальный initial prediction.

От точки к prediction — residual arrows.

### Состояние 1

Первое tree строит correction.

### Состояние 2

Ползунок:

```text
learning_rate
```

Пользователь видит, какая доля correction добавляется.

### Состояние 3

Появляются новые residuals.

### Состояние 4

Увеличиваем:

```text
depth
iterations
```

Показываем train loss и validation loss.

Главный вопрос:

> почему train loss продолжает снижаться, а validation после некоторого момента растёт?

---

## 20. Типичные ошибки

**«Новое tree исправляет только предыдущее».**\
Нет, весь текущий ensemble.

**«Boosting всегда учится на residuals».**\
Residual — частный случай negative gradient.

**«Меньший learning rate делает overfit невозможным».**\
Нет.

**«Больше iterations всегда лучше».**\
Нет.

**«Boosting сам исправит leakage».**\
Нет.

**«Random Forest и Boosting почти одинаковы, потому что используют trees».**\
Механизм ансамбля принципиально разный.

---

## 21. Проверка понимания

1. Почему при MSE residual совпадает с negative gradient?
2. Что именно исправляет next tree?
3. Зачем нужен `learning_rate`?
4. Почему слишком глубокий base tree опасен?
5. Почему stages нельзя полностью parallelize по trees?
6. Чем loss отличается от metric?
7. Почему 2000 iterations могут быть хуже 700?
8. Что делает `subsample`?
9. Почему Random Forest и Gradient Boosting по-разному уменьшают ошибку?
10. Как leakage проявится даже в хорошо настроенном boosting?

---

## 22. Мини-практика

| Model | Train AP | CV AP | CV std | Latency |
|---|---:|---:|---:|---:|
| Logistic Regression | 0.46 | 0.44 | 0.01 | 2 ms |
| Random Forest | 0.81 | 0.51 | 0.05 | 35 ms |
| Boosting A | 0.70 | 0.57 | 0.02 | 18 ms |
| Boosting B | 0.98 | 0.55 | 0.07 | 42 ms |

Ответьте:

1. какая model выглядит устойчивее;
2. где сильнее variance;
3. почему max train score не критерий выбора;
4. что изменит SLA latency < 10 ms;
5. что нужно проверить в split.

---

## 23. Как объяснить на собеседовании

### Что такое Gradient Boosting?

**Коротко.**\
Последовательный аддитивный ансамбль. На каждой итерации новое дерево строится так, чтобы уменьшить loss текущей композиции; для squared error оно фактически приближает residuals.

**Глубже.**\
В общем случае tree аппроксимирует negative gradient loss по текущему prediction, после чего correction добавляется с коэффициентом `learning_rate`.

### Чем отличается от Random Forest?

Forest строит независимые trees и усредняет их, прежде всего снижая variance. Boosting строит trees последовательно и постепенно уменьшает loss.

---

## 24. Что нужно унести

1. Gradient Boosting — последовательный ансамбль.
2. Новое tree исправляет текущую композицию.
3. Residual — частный случай negative gradient.
4. Итог — аддитивная сумма corrections.
5. `learning_rate` связан с числом iterations.
6. Base tree complexity влияет на overfit.
7. Early stopping помогает выбрать длину ансамбля.
8. Loss и бизнес-метрика могут различаться.
9. Stochastic subsampling работает как regularization.
10. Boosting не отменяет leakage checks.
11. Random Forest и Gradient Boosting решают проблему дерева разными способами.

---

## Куда дальше

Базовый механизм Gradient Boosting понятен.

Но остаются инженерные и статистические вопросы:

- как быстрее искать splits;
- как использовать second-order information;
- как регуляризовать leaf weights;
- как работать с огромными datasets;
- как корректнее работать с категориальными признаками.

Из этих задач выросли XGBoost, LightGBM и CatBoost.

## Источники
- scikit-learn User Guide — Gradient Boosting.
- DataPath_ideal_lesson_reference_gradient_boosting.md — педагогический референс.
- Trees_and_Boosting_Interview_Guide_RU — структурный референс.
