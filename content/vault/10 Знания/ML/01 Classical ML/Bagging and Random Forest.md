---
title: Bagging and Random Forest
type: concept
area: ml
status: active
aliases:
  - Bagging
  - Random Forest
  - Случайный лес
  - Бэггинг
tags:
  - ml/classical
  - ml/ensembles
math_depth: 2
id: concept.ml.bagging-and-random-forest
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---


**Рекомендуемое время:** 60–75 минут.

## Результаты обучения
- понимать bootstrap и averaging
- объяснять снижение variance через decorrelation
- использовать OOB evaluation
- разбирать параметры n_estimators, max_features и tree constraints

## Вход в тему

Одно глубокое дерево нестабильно: небольшое изменение train может полностью перестроить верхние splits. Random Forest обучает много разных деревьев и усредняет их ответы. Ключ не только в количестве деревьев, но и в том, чтобы их ошибки не были слишком похожими.

## Полная теория

## Идея за 30 секунд

Bagging обучает base models независимо на bootstrap samples и усредняет predictions. Он особенно полезен для high-variance estimators вроде deep trees. Random Forest добавляет случайный subset features на каждом split, чтобы trees меньше коррелировали. Averaging снижает variance только когда ошибки моделей не полностью одинаковы.

## Bootstrap

Из $n$ train objects выбирают $n$ раз с возвращением. Probability, что конкретный object не выбран:

$$
\left(1-\frac{1}{n}\right)^n
\approx e^{-1}\approx0.368.
$$

Значит одна bootstrap sample содержит около $63.2\%$ unique objects. Остальные для данного tree — out-of-bag.

Bootstrap имитирует variation training sample и создаёт разные fitted trees.

## Bagging prediction

Regression:

$$
\widehat{f}(x)
=\frac{1}{M}
\sum_{m=1}^{M}
\widehat{f}_m(x).
$$

Classification агрегирует class probabilities или votes.

Если individual model errors имеют variance $\sigma^2$ и pairwise correlation $\rho$, variance average приблизительно:

$$
\operatorname{Var}(\bar{f})
\approx
\rho\sigma^2
+\frac{1-\rho}{M}\sigma^2.
$$

Увеличение $M$ уменьшает independent component, но не убирает correlated error. Поэтому diversity важна.

## Random Forest

Каждый tree:

1. получает bootstrap sample;
2. на каждом split рассматривает случайный subset features;
3. растёт с заданными structural constraints;
4. участвует в averaging.

Feature subsampling может сделать отдельный tree слабее, но снижает correlation: один очень сильный feature не захватывает одинаковый first split во всех trees.

## Bias и variance

**Интуиция с монеткой:** подбросьте одну монетку 10 раз — можете получить 8 орлов (сильная случайная ошибка). Подбросьте 100 монеток по 10 раз и усредните — результат будет близок к 50%. Усреднение многих независимых «голосований» сглаживает случайные ошибки.

Для деревьев: одно глубокое дерево сильно зависит от конкретной обучающей выборки — небольшое изменение данных может полностью изменить структуру дерева (high variance). Если обучить $M$ деревьев на разных bootstrap-выборках и усреднить предсказания:
- каждое дерево имеет низкий bias (глубокое) и высокую индивидуальную variance;
- но ошибки деревьев **нескоррелированы** (разные выборки, разные features на каждом split);
- при усреднении независимые ошибки компенсируют друг друга.

- Более глубокие trees: lower bias, higher individual variance.
- Больше trees: обычно ниже Monte Carlo variance, но больше latency/memory.
- Меньше `max_features`: больше diversity, возможен higher bias.
- Больше `min_samples_leaf`: smoother probabilities и lower variance.

Random Forest обычно не переобучается просто от добавления trees после stabilization, но может overfit из-за leakage, слишком маленьких leaves, noisy features или неправильной validation.

## Out-of-bag estimate

Для object prediction агрегируют только trees, где он был OOB. Это даёт internal estimate без отдельного fold split.

Ограничения:

- не заменяет time/group-aware validation;
- preprocessing должен быть leakage-safe;
- OOB metric может отличаться от final decision metric;
- tuning многократно по OOB тоже создаёт selection bias.

## Probability quality

Leaf class fractions, усреднённые по trees, дают score/probability-like output. Small leaves и imbalance могут ухудшать calibration. Threshold и calibration выбираются на held-out/CV predictions.

## Feature importance и uncertainty

Impurity importance наследует biases tree splits. Permutation importance считать на validation/OOB и интерпретировать с учётом correlation.

Spread predictions между trees не является автоматически calibrated predictive uncertainty: trees зависимы и bootstrap не отражает все sources shift/noise.

## Extra Trees

Extremely Randomized Trees добавляют randomness thresholds/splits. Это может ещё сильнее снизить correlation и ускорить fit ценой дополнительного bias.

## Когда использовать

- нелинейный tabular baseline;
- mixed interactions без сложного feature engineering;
- достаточно data для leaves;
- важны robust defaults и parallel training;
- boosting overfit или слишком чувствителен к tuning.

## Failure modes

- считать OOB честным при time series;
- задавать integer categories как ordered numbers;
- использовать tiny leaves для probability estimation;
- сравнивать forests с разным preprocessing/split;
- трактовать importance causally;
- ожидать extrapolation в regression.

## Ответ для собеседования

Random Forest — ансамбль Decision Trees, где каждое дерево обучается на bootstrap-выборке строк и случайном подмножестве признаков на каждом split. Предсказание — усреднение (регрессия) или голосование (классификация). **Ключевая идея:** усреднение некоррелированных деревьев снижает variance. Одно дерево может сильно переобучиться; $M$ деревьев на разных выборках ошибаются по-разному, и при усреднении ошибки компенсируются. **Преимущества:** стабильнее одного дерева, OOB-оценка заменяет validation set для baseline, feature importance, параллельное обучение. **Ограничения:** не экстраполирует за пределы train-диапазона, хуже boosting на сложных зависимостях, требует кодирования категорий.

## Обязательная визуальная демонстрация

Один dataset → несколько bootstrap samples → деревья → голоса/среднее. Ползунок correlation показывает, почему одинаковые деревья почти не снижают variance.

## Практика

#### Задание 1. Bootstrap

Почему в bootstrap sample примерно 63.2% уникальных объектов? Объясни интуитивно.

#### Задание 2. Decorrelation

Зачем ограничивать max_features на каждом split?

#### Задание 3. OOB

Что такое out-of-bag prediction и когда оно полезно?

#### Задание 4. Python lab

Сравни одно дерево и RandomForest на нескольких random seeds; измерь variance validation score.

## Разбор практики

**1.** Вероятность не попасть в n draws стремится к e^-1≈0.368, значит попасть хотя бы раз ≈0.632.

**2.** Чтобы сильные признаки не заставляли все деревья строиться одинаково; это снижает корреляцию ошибок.

**3.** Для каждого объекта используются деревья, которые не видели его в bootstrap; это внутренняя оценка без отдельного holdout, но не замена корректной временной проверки.

**4.** Forest обычно стабильнее по seed и split, хотя может иметь схожий bias.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Главный эффект bagging для нестабильных моделей?

- A. Снижение variance
- B. Гарантированное снижение bias до нуля
- C. Calibration
- D. Feature scaling

**Правильный ответ:** A

**Объяснение:** Усреднение снижает вариативность ошибок.

#### Checkpoint 2

**Вопрос:** Что делает max_features?

- A. Увеличивает target
- B. Декоррелирует деревья
- C. Удаляет bootstrap
- D. Выбирает threshold

**Правильный ответ:** B

**Объяснение:** Разные subsets признаков делают деревья менее похожими.

#### Checkpoint 3

**Вопрос:** Больше n_estimators обычно...

- A. снижает stability
- B. стабилизирует ансамбль, но увеличивает вычисления
- C. обязательно overfit
- D. меняет тип target

**Правильный ответ:** B

**Объяснение:** Ошибка усреднения стабилизируется по мере роста числа деревьев.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.

## Код: baseline и probability

```python
from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(
    n_estimators=400,
    min_samples_leaf=5,
    max_features="sqrt",
    class_weight="balanced_subsample",
    n_jobs=-1,
    random_state=42,
)
forest.fit(X_train, y_train)
probability = forest.predict_proba(X_valid)[:, 1]
```

`[:, 1]` берёт probability положительного класса. `min_samples_leaf`
ограничивает variance отдельных trees.
