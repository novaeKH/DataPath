---
title: Regularization
id: concept.ml.regularization
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Регуляризация
- Bias variance
tags:
- ml/classical
- ml/regularization
math_depth: 2
---


**Рекомендуемое время:** 50–65 минут.

## Результаты обучения
- диагностировать underfit и overfit по train/validation
- понимать компромисс bias–variance
- различать L1, L2, early stopping и structural regularization
- выбирать regularization только внутри validation

## Вход в тему

Модель должна быть достаточно гибкой, чтобы выучить полезный сигнал, но не настолько гибкой, чтобы запомнить случайный шум. Regularization — это не одна формула, а общий принцип ограничения эффективной сложности модели.

## Полная теория

## Зачем нужна regularization

Модель может слишком точно подстроиться под train sample и использовать случайный noise. Regularization ограничивает эффективную complexity: добавляет penalty, ограничивает структуру или останавливает обучение раньше.

Это trade-off: немного увеличиваем bias, чтобы снизить variance и улучшить validation quality.

## L2 / Ridge

$$
\min_\beta
\mathcal L(\beta)+\lambda\sum_j\beta_j^2.
$$

L2 плавно уменьшает coefficients, особенно у correlated features. Обычно не зануляет их полностью.

Geometry: penalty предпочитает решения с маленькой Euclidean norm.

## L1 / Lasso

$$
\min_\beta
\mathcal L(\beta)+\lambda\sum_j|\beta_j|.
$$

L1 может занулять часть coefficients и выполнять feature selection. При correlated features выбирает один нестабильно; интерпретировать выбор как «истинно важный» нельзя.

## Elastic Net

$$
\mathcal L(\beta)+\lambda
\left[
\alpha\lVert\beta\rVert_1+(1-\alpha)\lVert\beta\rVert_2^2
\right].
$$

Совмещает sparsity L1 и stability L2.

## Почему scaling обязателен

Penalty зависит от величины coefficient. Если features имеют разные units, одинаковый effect требует разных coefficients и штрафуется неравномерно. Scaler fit внутри train folds.

## Structural regularization

Для trees:

- `max_depth`;
- `min_samples_leaf`;
- pruning;
- feature subsampling.

Для boosting:

- learning rate;
- число trees;
- depth;
- subsampling;
- early stopping.

Для neural networks:

- weight decay;
- dropout;
- data augmentation;
- early stopping;
- architecture capacity.

Regularization шире, чем добавление penalty в formula.

## Early stopping

Остановить обучение на iteration с лучшей validation metric. Validation становится частью model selection, test не используется.

## Data augmentation

Создаёт дополнительные examples, сохраняющие label. Это вносит prior о invariance. Неверная augmentation может менять label и ухудшать model.

## Bias–variance diagnostics

- train и validation плохие → вероятен underfit/high bias;
- train хороший, validation хуже → overfit/high variance;
- оба хорошие, production падает → drift/contract/leakage.

Сильнее regularization не лечит неверные labels и leakage.

## Выбор strength

$\lambda$, `C`, depth и dropout выбирают по CV/validation. Сравнивайте pipeline целиком. Для временных данных используйте time-aware split.

## Визуальная демонстрация

Компонент `regularization-path-lab`:

- slider $\lambda$;
- paths coefficients Ridge/Lasso;
- train/validation error;
- correlated features toggle;
- decision boundary;
- selected features.

## Частые ошибки

- scaling до split;
- штрафовать intercept без понимания;
- выбрать $\lambda$ по test;
- считать zero coefficient доказательством ненужности feature;
- применять dropout в evaluation;
- использовать weight decay как полную замену data quality;
- сравнивать models с разным preprocessing нечестно.

## Обязательная визуальная демонстрация

График train/validation error против complexity; переключатели noise, sample size и regularization.

## Практика

#### Задание 1. Диагностика

Train F1=0.99, validation F1=0.68. Назови минимум четыре возможные причины и план проверки.

#### Задание 2. L1 vs L2

Когда Lasso предпочтительнее Ridge, а когда наоборот?

#### Задание 3. Tree regularization

Какие параметры ограничивают capacity Decision Tree?

#### Задание 4. Learning curve

Train и validation error оба высокие и близкие. Что вероятнее: high bias или high variance?

## Разбор практики

**1.** Overfit, leakage, split mismatch, duplicates/group overlap. Проверить split, pipeline, learning curves, capacity, features и leakage.

**2.** L1 полезна для sparse selection, L2 — для стабильного shrinkage correlated coefficients; выбор зависит от CV и цели.

**3.** max_depth, min_samples_leaf, max_leaf_nodes, ccp_alpha и др.

**4.** High bias/underfit: модель не справляется даже с train.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что обычно происходит при росте capacity?

- A. Bias растёт, variance падает
- B. Bias падает, variance растёт
- C. Оба всегда падают
- D. Ничего

**Правильный ответ:** B

**Объяснение:** Гибкая модель лучше fit train, но сильнее зависит от sample.

#### Checkpoint 2

**Вопрос:** Regularization выбирают по...

- A. test
- B. validation/CV
- C. train score
- D. случайному правилу

**Правильный ответ:** B

**Объяснение:** Иначе возникает optimistic bias.

#### Checkpoint 3

**Вопрос:** L1 penalty может...

- A. создавать деревья
- B. занулять коэффициенты
- C. гарантировать causal effect
- D. заменять split

**Правильный ответ:** B

**Объяснение:** L1 способствует sparse solutions.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.

## Код: regularization внутри честного pipeline

```python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(C=0.3, penalty="l2", max_iter=1000),
)
model.fit(X_train, y_train)
```

Меньший `C` означает более сильный penalty. Scaling находится внутри pipeline,
чтобы статистики не подсматривали validation folds.
