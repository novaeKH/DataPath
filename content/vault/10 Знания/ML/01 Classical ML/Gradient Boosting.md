---
title: Gradient Boosting
type: concept
area: ml
status: active
aliases:
  - Градиентный бустинг
  - Gradient Boosted Trees
  - GBDT
tags:
  - ml/classical
  - ml/ensembles
math_depth: 2
id: concept.ml.gradient-boosting
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---


**Рекомендуемое время:** 70–85 минут.

## Результаты обучения
- понимать additive model и pseudo-residuals
- проследить несколько boosting-итераций вручную
- объяснять роль learning_rate и n_estimators
- использовать early stopping и depth constraints

## Вход в тему

Random Forest строит деревья независимо и усредняет. Gradient Boosting строит их последовательно: каждое следующее дерево учится исправлять текущую ошибку ансамбля. Это делает boosting мощным, но требует аккуратной регуляризации.

## Полная теория

## Идея за 30 секунд

Gradient Boosting строит additive model последовательно. На каждом шаге новый weak learner приближает negative gradient текущего loss по predictions — pseudo-residuals. Затем его contribution добавляется с learning rate. Для squared error pseudo-residual совпадает с обычным residual; для других losses это уже gradient signal.

## Additive model

$$
F_M(x)
=F_0(x)
+\sum_{m=1}^{M}
\eta\,\gamma_m h_m(x),
$$

где:

- $F_0$ — initial constant prediction;
- $h_m$ — base learner, обычно shallow tree;
- $\gamma_m$ — step/leaf values;
- $\eta$ — learning rate;
- $M$ — number of iterations.

## От loss к pseudo-residuals

Для differentiable loss $L(y,F(x))$ на iteration $m$:

$$
r_{im}
=-
\left.
\frac{\partial L(y_i,F(x_i))}
{\partial F(x_i)}
\right|_{F=F_{m-1}}.
$$

Это direction, который локально сильнее всего уменьшает loss в prediction space.

Алгоритм:

1. вычислить current predictions $F_{m-1}(x_i)$;
2. посчитать pseudo-residuals $r_{im}$;
3. fit tree $h_m(x)$ на pairs $(x_i,r_{im})$;
4. оценить leaf values/step $\gamma_m$;
5. update:

$$
F_m(x)
=F_{m-1}(x)
+\eta\gamma_mh_m(x).
$$

6. повторять до early stopping/limit.

## Squared error

$$
L(y,F)=\frac{1}{2}(y-F)^2.
$$

Тогда:

$$
-\frac{\partial L}{\partial F}
=y-F.
$$

Pseudo-residual равен обычному residual. Отсюда популярная, но неполная формулировка «каждое дерево учится на ошибках». Общий метод учится на negative gradients выбранного loss.

## Пример: 3 шага boosting

**Задача:** регрессия — предсказать цену квартиры по площади.

| Площадь (м²) | Цена (млн ₽) |
|---|---|
| 30 | 3.0 |
| 45 | 4.5 |
| 60 | 6.0 |
| 75 | 7.0 |
| 90 | 9.5 |

**Шаг 0 — начальное приближение:**

$$
F_0 = \text{mean}(y) = \frac{3.0 + 4.5 + 6.0 + 7.0 + 9.5}{5} = 6.0.
$$

**Шаг 1:**
- Считаем остатки: $r_i = y_i - F_0(x_i)$ → [-3.0, -1.5, 0.0, +1.0, +3.5].
- Обучаем stump (глубина 1) на остатках: split «площадь ≤ 52.5?» → левый лист: mean(-3.0, -1.5) = -2.25; правый лист: mean(0, 1.0, 3.5) = +1.5.
- Обновление с $\eta = 0.3$: $F_1(x) = F_0(x) + 0.3 \cdot h_1(x)$.

| Площадь | $F_0$ | $h_1$ | $0.3 \cdot h_1$ | $F_1$ | Остаток после шага 1 |
|---|---|---|---|---|---|
| 30 | 6.0 | -2.25 | -0.675 | 5.325 | -2.325 |
| 45 | 6.0 | -2.25 | -0.675 | 5.325 | -0.825 |
| 60 | 6.0 | +1.5 | +0.45 | 6.45 | -0.45 |
| 75 | 6.0 | +1.5 | +0.45 | 6.45 | +0.55 |
| 90 | 6.0 | +1.5 | +0.45 | 6.45 | +3.05 |

**Шаг 2:** обучаем новое дерево $h_2$ на остатках после шага 1; шаг 3 — аналогично. Каждый шаг исправляет ошибки предыдущего ансамбля.

**Результат после 3 шагов (приблизительно):**

| Площадь | Истинная цена | $F_3$ (предсказание) | Ошибка |
|---|---|---|---|
| 30 | 3.0 | 3.2 | +0.2 |
| 45 | 4.5 | 4.7 | +0.2 |
| 60 | 6.0 | 5.9 | -0.1 |
| 75 | 7.0 | 7.1 | +0.1 |
| 90 | 9.5 | 9.1 | -0.4 |

Ошибка уменьшилась с [-3.0, +3.5] на шаге 0 до [-0.4, +0.2] на шаге 3.

**Ключевые наблюдения:**
- каждый новый шаг корректирует ошибки предыдущего ансамбля;
- обучение **последовательное** — нельзя распараллелить;
- learning rate $\eta = 0.3$ замедляет обучение, но улучшает обобщение;
- при $\eta = 1.0$ остатки после первого шага обнулились бы (модель «запомнила» бы train — overfit).

## Binary LogLoss

Если $F$ — logit и $p=\sigma(F)$:

$$
L(y,F)
=-\left[
y\log p+(1-y)\log(1-p)
\right],
$$

$$
-\frac{\partial L}{\partial F}
=y-p.
$$

Tree исправляет probability error в logit space.

## Почему обучение последовательное

Gradient следующего step зависит от current ensemble. Trees нельзя обучить независимо и просто усреднить, как в bagging.

Это цепочка:

```text
loss
→ gradient по current prediction
→ pseudo-residual
→ tree approximation
→ sequential correction
```

## Tree complexity и interactions

Depth base tree ограничивает interaction order:

- stumps моделируют mainly additive effects;
- deeper trees ловят higher-order interactions;
- слишком deep trees быстро снижают train loss и повышают variance.

Boosting не требует каждому tree быть сильным; важна серия small corrections.

## Learning rate и iterations

Small $\eta$ требует больше iterations и часто даёт smoother generalization. Large $\eta$ быстрее fit, но может overshoot/overfit.

Связка `learning_rate × best_iteration` важнее каждого parameter отдельно. Используют большое upper bound iterations и early stopping на validation metric.

## Row/feature subsampling

Stochastic boosting обучает steps на subsample rows/features. Это:

- снижает correlation successive corrections;
- ускоряет fit;
- добавляет regularization;
- увеличивает stochastic noise.

Sampling strategy должна сохранять group/time logic и не исправляет leakage.

## Loss, training metric и business metric

Differentiable loss нужен optimization. Business metric может быть non-differentiable: F1, precision@k, expected profit.

Правильный порядок:

1. выбрать loss, согласованный с prediction semantics;
2. monitor validation metric;
3. отдельно выбрать threshold/ranking policy по business objective.

## Failure modes

- tuning по test;
- слишком complex trees при малых data;
- early stopping по noisy/неподходящей metric;
- интерпретировать raw score как calibrated probability;
- target encoding до folds;
- extrapolation ожидать как у linear model;
- считать feature importance causal;
- говорить, что pseudo-residual всегда равен $y-\widehat{y}$.

## Ответ для собеседования

Gradient Boosting строит ансамбль **последовательно**: каждая новая модель (обычно мелкое дерево, глубина 3–6) приближает **negative gradient функции потерь** по текущим предсказаниям — это pseudo-residuals. Для MSE они совпадают с обычными остатками, для LogLoss — с разностью $y - p$. Вклад нового дерева добавляется с **learning rate** $\eta < 1$, чтобы не переобучиться на одном шаге. **Ключевые гиперпараметры:** learning rate (чем меньше, тем больше итераций нужно, но лучше обобщение), число итераций (контролируется early stopping на validation), глубина деревьев. **Преимущества:** SOTA на табличных данных, гибкость (любая дифференцируемая функция потерь). **Ограничения:** последовательное обучение нельзя распараллелить, склонность к переобучению при малом $\eta$ и большом числе итераций без early stopping.

## Обязательная визуальная демонстрация

На каждом шаге показываются текущие predictions, residuals, новое слабое дерево и обновлённая сумма. Пользователь меняет learning rate.

## Практика

#### Задание 1. Три шага

Для regression начальный prediction=среднее. Даны y=[2,4,8]. Найди residuals первого шага.

#### Задание 2. Learning rate

Почему маленький learning_rate часто требует больше деревьев?

#### Задание 3. Overfit

Какие параметры одновременно контролируют capacity boosting?

#### Задание 4. Python lab

Построй validation curve по n_estimators для двух learning_rate и сравни best iteration.

## Разбор практики

**1.** Среднее=14/3≈4.667; residuals≈[-2.667,-0.667,3.333].

**2.** Каждое дерево вносит меньшую поправку, поэтому для той же общей функции нужно больше шагов.

**3.** learning_rate, n_estimators, tree depth/leaves, subsample, column sampling и regularization.

**4.** Малый learning rate обычно даёт более поздний optimum и может быть устойчивее, но дороже.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что изучает очередное дерево?

- A. Независимый bootstrap target
- B. Направление уменьшения текущего loss
- C. Test labels
- D. Только categories

**Правильный ответ:** B

**Объяснение:** Оно аппроксимирует negative gradient/pseudo-residuals.

#### Checkpoint 2

**Вопрос:** Learning rate и число деревьев...

- A. не связаны
- B. образуют важный trade-off
- C. всегда должны быть 1
- D. определяют scaling features

**Правильный ответ:** B

**Объяснение:** Меньшие шаги требуют большего числа итераций.

#### Checkpoint 3

**Вопрос:** Зачем early stopping?

- A. Выбрать число итераций по validation
- B. Ускорить scaler
- C. Создать OHE
- D. Устранить target

**Правильный ответ:** A

**Объяснение:** Он останавливает обучение до ухудшения generalization.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
