---
title: Logistic Regression
id: concept.ml.logistic-regression
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
- Логистическая регрессия
tags:
- ml/classical
- ml/linear-models
math_depth: 2
---


**Рекомендуемое время:** 60–75 минут.

## Результаты обучения
- понимать sigmoid, log-odds и linear decision boundary
- объяснять LogLoss и maximum likelihood intuition
- интерпретировать коэффициенты и odds ratio
- выбирать regularization, class weights и threshold

## Вход в тему

Logistic Regression строит линейный score, но превращает его в число от 0 до 1. Это один из лучших baseline для классификации: быстрый, прозрачный, часто хорошо калиброванный и удобный для анализа влияния признаков.

## Полная теория

## Что предсказывает модель

Для binary classification Logistic Regression оценивает probability положительного класса. Сначала строится linear score:

$$
z=\beta_0+x^\top\beta.
$$

Затем sigmoid переводит его в интервал $(0,1)$:

$$
p(y=1\mid x)=\sigma(z)=\frac{1}{1+e^{-z}}.
$$

Название «regression» связано с моделированием log-odds, хотя задача является classification.

## Odds и log-odds

$$
\operatorname{odds}=\frac{p}{1-p},
\qquad
\log\frac{p}{1-p}=\beta_0+x^\top\beta.
$$

Увеличение $x_j$ на единицу умножает odds на $e^{\beta_j}$ при фиксированных остальных features. Это не означает, что probability увеличивается на постоянную величину: изменение зависит от текущего $p$.

## Пример

Если $\beta_{income}=0.2$, то увеличение standardized income на единицу умножает odds positive class на $e^{0.2}\approx1.22$. При $p=0.5$ effect на probability больше, чем около $p=0.99$ из-за saturation sigmoid.

## Обучение и LogLoss

Binary cross-entropy:

$$
\mathcal{L}
=-\frac{1}{n}\sum_i
\left[y_i\log p_i+(1-y_i)\log(1-p_i)\right].
$$

Это negative log-likelihood Bernoulli model. Уверенная неправильная probability штрафуется сильно.

В отличие от linear regression, closed-form solution обычно нет; параметры находят optimization.

## Decision boundary

При threshold $0.5$:

$$
\beta_0+x^\top\beta=0
$$

задаёт linear boundary. С polynomial/interactions boundary может стать nonlinear в original features, но остаётся linear по созданным features.

## Probability и threshold

Модель выдаёт probability/score, а class decision требует threshold:

$$
\widehat y=\mathbb{1}[p\ge t].
$$

$t=0.5$ не универсален. Его выбирают по costs, recall/precision constraint или capacity на validation.

## Regularization

По умолчанию практические implementations используют penalty:

$$
\min_\beta \mathcal L(\beta)+\lambda\lVert\beta\rVert_2^2.
$$

Ridge стабилизирует correlated features. L1 может занулять coefficients. Scaling особенно важен, потому что penalty применяется к величине coefficients.

## Class imbalance

Imbalance не делает Logistic Regression непригодной. Возможны:

- class weights;
- resampling только внутри train folds;
- threshold selection;
- PR-AUC/recall/precision;
- calibration check.

После class weighting raw probabilities могут не соответствовать production prevalence и требуют calibration/correction.

## Calibration

Logistic Regression часто даёт разумные probabilities при корректной specification, но не гарантирует calibration. Проверяйте reliability curve, Brier score и LogLoss на held-out data.

## Multiclass

Multinomial Logistic Regression использует softmax:

$$
p(y=k\mid x)=\frac{e^{z_k}}{\sum_j e^{z_j}}.
$$

One-vs-Rest обучает отдельные binary models. Multinomial обычно моделирует конкуренцию классов напрямую.

## Preprocessing

- numerical: imputation, часто scaling;
- categorical: OHE или leakage-safe encoding;
- missing indicators при необходимости;
- interactions/polynomial только по CV;
- preprocessing внутри Pipeline.

## Интерпретация

Coefficient показывает conditional association при фиксированных остальных features. Correlated predictors, selection bias, regularization и transformations усложняют интерпретацию. Это не causal effect.

## Визуальная демонстрация

Компонент `logistic-boundary-threshold-lab`:

- points двух классов;
- decision boundary;
- sigmoid и текущий score;
- slider threshold;
- confusion matrix, precision, recall;
- class imbalance toggle;
- regularization slider.

## sklearn пример

```python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("model", LogisticRegression(max_iter=1000, C=1.0)),
])
```

`C` — inverse regularization strength: меньше `C` означает сильнее regularization.

## Частые ошибки

- считать output до sigmoid probability;
- выбирать threshold на test;
- интерпретировать coefficient как прирост probability;
- применять scaling до split;
- использовать accuracy при rare positive;
- использовать class weight и считать probabilities calibrated автоматически;
- забыть regularization и convergence warning.

## Обязательная визуальная демонстрация

Ползунок linear score z, sigmoid, probability и threshold; второй экран показывает boundary в 2D и влияние регуляризации.

## Практика

#### Задание 1. Sigmoid

Посчитай σ(z) для z=0, z≈2.2 и z≈−2.2. Что это означает?

#### Задание 2. Odds ratio

Коэффициент признака равен 0.7. Во сколько раз меняются odds при увеличении признака на единицу?

#### Задание 3. Class imbalance

Почему class_weight="balanced" не заменяет выбор метрики и threshold?

#### Задание 4. Python lab

Обучи LogisticRegression в Pipeline, сравни ROC-AUC, PR-AUC, LogLoss и calibration curve.

## Разбор практики

**1.** σ(0)=0.5; σ(2.2)≈0.90; σ(−2.2)≈0.10.

**2.** Odds умножаются на exp(0.7)≈2.01 при прочих равных.

**3.** Вес меняет objective обучения, но не определяет бизнес-стоимость и рабочую точку.

**4.** Оценивать нужно на held-out/OOF predictions; threshold выбирается отдельно.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что линейно в Logistic Regression?

- A. Probability
- B. Log-odds
- C. Target
- D. F1

**Правильный ответ:** B

**Объяснение:** Линейная комбинация признаков моделирует log-odds.

#### Checkpoint 2

**Вопрос:** Почему используется LogLoss?

- A. Она не зависит от probability
- B. Она штрафует уверенные неправильные прогнозы
- C. Она равна Accuracy
- D. Она всегда балансирует классы

**Правильный ответ:** B

**Объяснение:** Уверенная ошибка получает большой loss.

#### Checkpoint 3

**Вопрос:** Что делает threshold?

- A. Переобучает коэффициенты
- B. Преобразует score/probability в действие или класс
- C. Калибрует probability
- D. Удаляет outliers

**Правильный ответ:** B

**Объяснение:** Threshold задаёт рабочую точку решения.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
