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
# Decision Trees

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

## Когда использовать

- нужна интерпретируемость и явные правила принятия решений;
- табличные данные со смесью числовых и категориальных признаков;
- как базовый блок ансамблей (RF/GB) — отдельное дерево чаще всего для анализа;
- НЕ использовать для высокой точности в одиночку: одно дерево переобучается; для сложных задач — ансамбли.

## Ответ для собеседования

Decision Tree — алгоритм, который рекурсивно делит пространство признаков вопросами вида «feature ≤ threshold?». На каждом шаге выбирается разбиение, максимизирующее уменьшение impurity (Gini для классификации, MSE для регрессии). **Плюсы:** интерпретируемость (видны правила), не требует scaling признаков, автоматически отбирает признаки. **Минусы:** склонность к переобучению (глубокое дерево запоминает шум), нестабильность — малые изменения данных могут полностью изменить структуру. Решается регуляризацией (max_depth, min_samples_leaf) и ансамблями (Random Forest, Gradient Boosting).

## Визуализация

Компонент `decision-tree-split-lab`: меняется threshold и criterion, видно weighted impurity и gain от каждого split. Компонент `tree-depth-overfitting-lab`: рост глубины дерева, train/validation кривые и переобучение.

## Сравнение с линейными моделями и ансамблями

- **Дерево vs линейная модель**: дерево режет пространство параллельными осям границами и ловит interactions; линейная — гладкая граница и простая интерпретация;
- **Одно дерево vs ансамбли**: дерево интерпретируемо, но переобучается; RF/GB обобщают лучше ценой прозрачности;
- **Глубина дерева** — главный контрол capacity.

## Связи

- [[Bagging and Random Forest]] — averaging снижает variance нестабильных trees.
- [[Gradient Boosting]] — trees последовательно исправляют ошибки вместо независимого averaging.
- [[Categorical Features]] — leakage-safe обработка categories.
- [[ML Foundations]] — tree capacity и bias–variance.
- [[Validation Splits and Data Leakage]] — pruning/parameters выбираются внутри CV.
- [[Trees and Random Forest — Interview]] — краткие вопросы.
- [[Ensemble Comparison]] — когда выбирать дерево, а когда ансамбль.
