---
title: XGBoost LightGBM and CatBoost
type: concept
area: ml
status: active
aliases:
  - XGBoost
  - LightGBM
  - CatBoost
  - Gradient boosting libraries
tags:
  - ml/classical
  - ml/boosting
math_depth: 2
id: concept.ml.xgboost-lightgbm-and-catboost
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---


**Рекомендуемое время:** 85–110 минут.

## Результаты обучения
- понимать, чем библиотеки отличаются от базового Gradient Boosting
- объяснять second-order optimization XGBoost
- понимать histogram/leaf-wise growth LightGBM
- объяснять ordered target statistics и ordered boosting CatBoost

## Вход в тему

Все три библиотеки строят boosting над деревьями, но оптимизируют разные узкие места: XGBoost — регуляризованный objective и точную работу с градиентами, LightGBM — скорость и histogram-based splits, CatBoost — категории и борьбу с target leakage.

## Полная теория

## Идея за 30 секунд

Все три библиотеки строят gradient-boosted trees, но оптимизируют разные bottlenecks. XGBoost делает explicit second-order regularized objective. LightGBM ускоряет large tabular training histograms и leaf-wise growth. CatBoost особенно силён в leakage-safe categorical statistics, ordered boosting и symmetric trees. Выбор проверяется на одинаковом split, metric и latency constraints.

## Общая основа

Все реализации наследуют цепочку [[Gradient Boosting]]:

```text
loss
→ gradients
→ tree structure and leaf values
→ additive update
→ next gradients
```

Различия находятся в approximation objective, поиске splits, growth strategy, categories и systems optimization.

## XGBoost: second-order objective

На step добавляется tree $f_t$. Taylor approximation loss:

$$
\mathcal{L}^{(t)}
\approx
\sum_{i=1}^{n}
\left[
g_i f_t(x_i)
+\frac{1}{2}h_i f_t(x_i)^2
\right]
+\Omega(f_t),
$$

где:

$$
g_i=\frac{\partial L_i}{\partial \widehat{y}_i},
\qquad
h_i=\frac{\partial^2 L_i}{\partial \widehat{y}_i^2}.
$$

$h_i$ — curvature/effective weight, а не универсальная «уверенность».

Regularization tree:

$$
\Omega(f)
=\gamma T
+\frac{\lambda}{2}
\sum_{j=1}^{T}w_j^2
+\alpha\sum_{j=1}^{T}|w_j|.
$$

Для leaf $j$:

$$
G_j=\sum_{i\in I_j}g_i,
\qquad
H_j=\sum_{i\in I_j}h_i,
$$

$$
w_j^*
=-\frac{G_j}{H_j+\lambda}
$$

без L1. Split gain:

$$
\operatorname{Gain}
=\frac{1}{2}
\left[
\frac{G_L^2}{H_L+\lambda}
+\frac{G_R^2}{H_R+\lambda}
-\frac{(G_L+G_R)^2}{H_L+H_R+\lambda}
\right]
-\gamma.
$$

Это объясняет `min_child_weight`, `gamma`, L1/L2 и роль Hessian.

#### XGBoost failure modes

- большой depth плюс слабая regularization;
- неправильные missing/category assumptions;
- class weights без последующей calibration/threshold;
- tuning десятков dependent parameters без fixed CV;
- сравнение по train speed без inference constraints.

## LightGBM: histograms и leaf-wise growth

Continuous features binning в histograms:

- candidate splits оцениваются по sums gradients/Hessians в bins;
- computation и memory уменьшаются;
- histogram child можно получить вычитанием из parent;
- слишком мало bins теряет resolution.

Leaf-wise growth выбирает текущий leaf с максимальным gain, а не равномерно растит level. Train loss часто падает быстрее, но локально глубокая branch на small data повышает overfit risk.

Главные controls:

- `num_leaves`;
- `max_depth`;
- `min_data_in_leaf`;
- `max_bin`;
- `feature_fraction`;
- `bagging_fraction`;
- L1/L2 и `min_gain_to_split`.

#### GOSS

Gradient-based One-Side Sampling сохраняет objects с большими $|g_i|$, subsample малые gradients и перевзвешивает их. Без reweighting estimator split statistics был бы biased.

#### EFB

Exclusive Feature Bundling объединяет sparse features, редко non-zero одновременно. Это сокращает effective dimension; полезность зависит от sparsity/conflicts.

#### Categories

Native categorical partitions не равны обычному integer threshold. Category mapping должен совпадать train/inference, а target-derived preprocessing всё равно выполняется внутри folds.

## CatBoost: ordered categories и ordered boosting

Naive target encoding:

$$
\operatorname{TE}(c)
=\operatorname{mean}(y\mid x=c)
$$

leaks current target, особенно для rare category.

Ordered statistic для object $i$ в permutation использует только предыдущие objects той же category:

$$
\operatorname{TS}_i
=
\frac{
\sum_{j<i,\;x_j=x_i}y_j
+a\cdot\operatorname{prior}
}{
\sum_{j<i,\;x_j=x_i}1+a
}.
$$

Current $y_i$ не участвует. Prior/smoothing снижает variance редких categories.

**Пример: почему наивный target encoding «подглядывает».** Задача — предсказать отток клиента ($y=1$ — ушёл). Признак: город.

| # | Город | Ушёл ($y$) |
|---|---|---|
| 1 | Москва | 0 |
| 2 | Питер | 1 |
| 3 | Москва | 1 |
| 4 | Питер | 0 |
| 5 | Москва | 0 |
| 6 | Питер | 1 |

**Наивный target encoding (ошибка):** для каждого клиента считаем средний $y$ по городу, включая его собственный ответ. Москва: $(0+1+0)/3 \approx 0.33$, Питер: $(1+0+1)/3 \approx 0.67$. Проблема: клиент #3 (Москва, $y=1$) получает encoding $0.33$, который включает его собственный $y=1$ — модель видит ответ, который пытается предсказать. Это **data leakage.**

**Ordered TS (правильно):** для клиента $i$ encoding считается только по клиентам до него в перестановке:

| # | Город | $y$ | Ordered TS | Пояснение |
|---|---|---|---|---|
| 1 | Москва | 0 | 0.5 (prior) | Нет предыдущих — prior |
| 2 | Питер | 1 | 0.5 (prior) | Нет предыдущих — prior |
| 3 | Москва | 1 | 0.0 | Только #1: $0/1 = 0$ |
| 4 | Питер | 0 | 1.0 | Только #2: $1/1 = 1$ |
| 5 | Москва | 0 | 0.5 | #1, #3: $(0+1)/2 = 0.5$ |
| 6 | Питер | 1 | 0.5 | #2, #4: $(1+0)/2 = 0.5$ |

Собственный $y_i$ не участвует → нет leakage. Prior (0.5) сглаживает оценки для редких категорий. При повторном обучении CatBoost использует случайную перестановку (permutation) — это дополнительно снижает зависимость от порядка.

Ordered boosting аналогично стремится считать gradient object через model, которая не обучалась на этом object. Это уменьшает prediction shift между train и unseen data.

#### Symmetric trees

На каждом depth используется одно условие для всех текущих leaves. Путь кодируется bits:

- быстрый predictable inference;
- compact representation;
- structural regularization;
- меньше flexibility, чем arbitrary tree;
- число leaves до $2^d$.

#### CatBoost failure modes

- передать category как numeric continuous;
- target-derived feature до split;
- редкие ID-like categories без stability check;
- путать ordered statistics и ordered boosting;
- считать strong defaults заменой validation.

## Ответ для собеседования

XGBoost, LightGBM и CatBoost — три оптимизированные реализации Gradient Boosting. **XGBoost** использует вторые производные (Hessian) для более точного поиска splits и встроенную L1/L2-регуляризацию деревьев. **LightGBM** ускоряет обучение через histogram-based поиск splits и leaf-wise (вместо level-wise) рост деревьев — хорошо для больших данных, но глубокая ветка на малой выборке рискует overfit. **CatBoost** специализируется на категориальных признаках: ordered target statistic вычисляет encoding без утечки целевой переменной (data leakage), плюс symmetric trees для быстрого инференса. **Выбор:** CatBoost — когда много категорий, LightGBM — когда важна скорость на больших данных, XGBoost — когда нужна тонкая настройка и зрелая экосистема (Dask, Spark, MLOps-интеграции).

## Сравнение

| Аспект | XGBoost | LightGBM | CatBoost |
|---|---|---|---|
| Главная идея | regularized second-order trees | histogram + leaf-wise efficiency | ordered categories/boosting + symmetric trees |
| Growth | часто depth/level-oriented | обычно leaf-wise | symmetric/oblivious |
| Categories | зависит от режима/version | native partitions | ключевая специализация |
| Сильная сторона | explicit objective и controls | speed/scale | categories и robust defaults |
| Риск | complex coupled tuning | local deep overfit | category types/cost |

Нет универсального победителя. Сравнивать нужно:

- на одинаковых folds;
- по одинаковой business/ML metric;
- с одинаковым feature availability;
- с early stopping;
- с latency, memory и calibration evaluation.

## Практический tuning order

1. Зафиксировать split, metric и simple baseline.
2. Дать достаточно iterations и early stopping.
3. Настроить capacity: depth/leaves/min leaf.
4. Связать learning rate с best iteration.
5. Добавить row/feature sampling.
6. Усилить penalties при train/validation gap.
7. Проверить calibration, threshold, segments и inference cost.

## Обязательная визуальная демонстрация

Три вкладки: XGBoost gradient/hessian gain, LightGBM histogram + leaf-wise growth, CatBoost ordered encoding по permutation.

## Практика

#### Задание 1. Сравнение

Какой алгоритм первым попробовать на таблице с большим числом категорий и почему?

#### Задание 2. LightGBM risk

Почему leaf-wise growth может быстро переобучить маленький dataset?

#### Задание 3. CatBoost leakage

Почему обычный target mean по всей категории создаёт leakage?

#### Задание 4. Experiment

Сравни три модели на одном split и одинаковом budget; оцени не только metric, но и fit time, inference, stability.

## Разбор практики

**1.** CatBoost — сильный default при raw categories и умеренном размере данных, но решение подтверждается CV.

**2.** Алгоритм углубляет самый выгодный leaf, создавая сложные локальные regions с малым support.

**3.** Статистика объекта использует его собственный target и targets объектов, которые в реальном prediction неизвестны.

**4.** Сравнение должно включать одинаковый preprocessing/split, early stopping и несколько seeds/folds.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Ключевая идея CatBoost для категорий?

- A. Random integer codes
- B. Ordered target statistics
- C. Обязательный OHE
- D. PCA

**Правильный ответ:** B

**Объяснение:** Статистики строятся без использования будущих/собственных labels.

#### Checkpoint 2

**Вопрос:** LightGBM обычно использует...

- A. Histogram bins
- B. Только linear models
- C. KNN graph
- D. SVD target

**Правильный ответ:** A

**Объяснение:** Histogram-based split search ускоряет обучение.

#### Checkpoint 3

**Вопрос:** XGBoost использует second-order information как...

- A. Gradient и Hessian
- B. Mean и median
- C. TP и FP
- D. PCA components

**Правильный ответ:** A

**Объяснение:** Objective аппроксимируется через градиенты и гессианы.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
