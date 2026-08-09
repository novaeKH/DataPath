---
title: Decision Trees
type: concept
area: ml
status: active
aliases:
  - Decision Tree
  - Деревья решений
tags:
  - ml/classical
  - ml/trees
math_depth: 2
id: concept.ml.decision-trees
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---


**Рекомендуемое время:** 65–80 минут.

## Результаты обучения
- понимать рекурсивные splits и prediction в leaf
- вручную считать Gini/Entropy/MSE и Gain
- объяснять, почему дерево переобучается
- настраивать capacity и интерпретировать правила

## Вход в тему

Дерево решений превращает сложную зависимость в цепочку простых вопросов. Оно автоматически находит нелинейности и взаимодействия, но именно из-за этой гибкости легко запоминает шум. Чтобы понимать ансамбли, сначала нужно разобрать одно дерево по шагам.

## Полная теория

## Идея за 30 секунд

Decision Tree рекурсивно делит feature space условиями и даёт простой constant prediction в каждом leaf. Split выбирается по уменьшению impurity/loss. Дерево ловит nonlinearities и interactions без scaling, но greedy growth и малые листья дают высокий variance.

## Как строится prediction

```text
income <= 80 000?
├─ да: age <= 25?
│  ├─ да  → probability 0.18
│  └─ нет → probability 0.41
└─ нет → probability 0.67
```

Каждый internal node содержит feature и condition; leaf хранит class proportions, mean, median или иной constant estimator.

## Split gain

Для node с $n$ objects:

$$
\operatorname{Gain}
=I(\text{parent})
-\frac{n_L}{n}I(\text{left})
-\frac{n_R}{n}I(\text{right}).
$$

$I$ — impurity или loss внутри node. Algorithm greedily выбирает лучший текущий split, не перебирая все будущие tree structures.

Для numeric feature достаточно рассматривать boundaries между соседними различными sorted values.

## Classification criteria

Если $p_k$ — доля класса $k$:

$$
\operatorname{Gini}
=1-\sum_k p_k^2,
$$

$$
\operatorname{Entropy}
=-\sum_k p_k\log p_k.
$$

Pure node имеет zero impurity. Gini и entropy часто дают похожие splits; structural constraints обычно важнее выбора между ними.

Tree criterion — surrogate. Он не обязан совпадать с business metric вроде F1 или expected cost.

## Пример расчёта Gain

Рассмотрим бинарную классификацию. В узле 10 объектов: 6 класса A, 4 класса B (доли 0.6 и 0.4).

**Gini родительского узла:**

$$
\operatorname{Gini} = 1 - (0.6^2 + 0.4^2) = 1 - (0.36 + 0.16) = 0.48.
$$

**Кандидат-разбиение** по признаку $x_1 \leq 5$:

- Левый дочерний узел: 4 объекта (3A, 1B)
  → $\operatorname{Gini}_L = 1 - (0.75^2 + 0.25^2) = 0.375$;
- Правый дочерний узел: 6 объектов (3A, 3B)
  → $\operatorname{Gini}_R = 1 - (0.5^2 + 0.5^2) = 0.5$.

**Gain:**

$$
\begin{aligned}
\operatorname{Gain}
&= I(\text{parent}) - \frac{n_L}{n}I(\text{left}) - \frac{n_R}{n}I(\text{right}) \\[4pt]
&= 0.48 - \left(\frac{4}{10} \cdot 0.375 + \frac{6}{10} \cdot 0.5\right) \\[4pt]
&= 0.48 - (0.15 + 0.30) = 0.03.
\end{aligned}
$$

**Интерпретация:** Gain положительный, но небольшой — разбиение несёт мало информации. Алгоритм сравнивает Gain для всех признаков и порогов, выбирая максимальный. Если бы все объекты в узле были одного класса, Gini был бы 0 (pure node) и дальнейшее разбиение не требовалось. Если классы смешаны поровну (50/50), Gini = 0.5 — максимальная неопределённость.

**Checkpoint:** возьмите узел с 20 объектами (12 класса A, 8 класса B). Посчитайте Gini. Предложите разбиение, при котором оба дочерних узла чище родителя. Посчитайте Gain. Как изменится Gain, если один из дочерних узлов окажется чистым (все объекты одного класса)?

## Regression tree

При squared error best constant prediction в leaf — mean:

$$
\widehat{y}_{\text{leaf}}
=\frac{1}{n_{\text{leaf}}}
\sum_{i\in\text{leaf}}y_i.
$$

Impurity:

$$
I(\text{leaf})
=\frac{1}{n_{\text{leaf}}}
\sum_{i\in\text{leaf}}
(y_i-\widehat{y}_{\text{leaf}})^2.
$$

При absolute error best constant — median.

Prediction piecewise constant и обычно не extrapolate за train range.

## Почему дерево overfit

Без ограничений leaf может содержать один object и запоминать noise. Малое изменение sample может изменить ранний split и всю нижнюю structure.

**Интуитивный пример — классификация «кошка или собака» по весу и росту:**

- **Дерево глубины 1 (stump):** один вопрос «вес > 5 кг?». Ошибка на train ~20%, на test ~22%. Простая модель, стабильные предсказания. **High bias, low variance.**
- **Дерево глубины 10:** десятки вопросов вида «вес > 5.1?», «рост > 30.2?», «вес > 5.3 И рост > 30.1?»… Ошибка на train ~2%, на test ~18%. Модель запомнила train (включая шум), но не обобщает. **Low bias, high variance.**

Ключевая закономерность: с ростом глубины **bias падает** (можем выучить сложные паттерны), но **variance растёт** (малые изменения данных сильно меняют структуру дерева). Random Forest сохраняет низкий bias глубоких деревьев, но снижает variance через усреднение некоррелированных деревьев на bootstrap-выборках — см. [[Bagging and Random Forest]].

Capacity controls:

| Parameter | Смысл |
|---|---|
| `max_depth` | maximum interaction order/path length |
| `min_samples_split` | можно ли делить текущий node |
| `min_samples_leaf` | minimum support каждого child/leaf |
| `max_leaf_nodes` | прямое ограничение числа regions |
| `max_features` | candidate features на split |
| `ccp_alpha` | cost-complexity pruning |

Cost-complexity objective:

$$
R_\alpha(T)=R(T)+\alpha|T|.
$$

## Scaling, missing values и categories

Monotonic scaling сохраняет order объектов и эквивалентные thresholds, поэтому самому tree standardization обычно не нужна.

Missing/category handling зависит от implementation:

- imputation plus missing indicator;
- learned default direction;
- native categorical partitions;
- OHE;
- leakage-safe statistical encoding.

Integer category code нельзя автоматически трактовать как meaningful order.

## Feature importance

Impurity importance смещена в пользу continuous/high-cardinality features и делится между correlated variables. Permutation importance на validation ближе к вопросу «насколько model использует feature», но также страдает при correlation.

Ни одна model importance не является causal effect.

## Что если предположения нарушены

Tree не требует linearity или Gaussian noise, но всё равно зависит от:

- representative train sample;
- честного feature availability;
- достаточного support в листьях;
- стабильности categories/time;
- корректной validation scheme.

Small leaf с высоким score может быть noise или leakage, а не «найденный сегмент».

## Ответ для собеседования

Decision Tree — алгоритм, который рекурсивно делит пространство признаков вопросами вида «feature ≤ threshold?». На каждом шаге выбирается разбиение, максимизирующее уменьшение impurity (Gini для классификации, MSE для регрессии). **Плюсы:** интерпретируемость (видны правила), не требует scaling признаков, автоматически отбирает признаки. **Минусы:** склонность к переобучению (глубокое дерево запоминает шум), нестабильность — малые изменения данных могут полностью изменить структуру. Решается регуляризацией (max_depth, min_samples_leaf) и ансамблями (Random Forest, Gradient Boosting).

## Обязательная визуальная демонстрация

Набор 2D-точек, выбор feature/threshold, расчёт impurity parent/children и прироста. После каждого split строится дерево и regions.

## Практика

#### Задание 1. Gini

В узле 20 объектов: 12 positive и 8 negative. Посчитай Gini.

#### Задание 2. Gain

Разбиение даёт left: 8/2 и right: 4/6. Посчитай weighted Gini и Gain.

#### Задание 3. Overfit

Почему leaf из одного объекта даёт идеальный train score, но плохую generalization?

#### Задание 4. Python lab

Сравни max_depth=2,5,None; построй train/validation curve и объясни результат.

## Разбор практики

**1.** Gini=1−0.6²−0.4²=0.48.

**2.** GiniL=0.32, GiniR=0.48; weighted=0.4; Gain=0.08.

**3.** Leaf запоминает noise и имеет минимальный support; малое изменение sample меняет правило.

**4.** Ожидается падение train error с глубиной и U-shaped/plateau validation behavior.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Как дерево выбирает split?

- A. Глобально перебирает все деревья
- B. Жадно максимизирует текущий impurity decrease
- C. Случайно
- D. По test score

**Правильный ответ:** B

**Объяснение:** Стандартный алгоритм выбирает лучший локальный split.

#### Checkpoint 2

**Вопрос:** Нужен ли StandardScaler дереву?

- A. Обычно нет
- B. Всегда да
- C. Только для Gini
- D. Только при бинарном target

**Правильный ответ:** A

**Объяснение:** Порядковые thresholds сохраняются при монотонном scaling.

#### Checkpoint 3

**Вопрос:** Что сильнее всего ограничивает переобучение?

- A. Цвет графика
- B. max_depth/min_samples_leaf
- C. shuffle labels
- D. увеличение test

**Правильный ответ:** B

**Объяснение:** Это прямые controls capacity.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
