---
title: Linear Regression
id: concept.ml.linear-regression
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
- Линейная регрессия
tags:
- ml/classical
- ml/linear-models
math_depth: 2
---


**Рекомендуемое время:** 65–80 минут.

## Результаты обучения
- понимать линейную модель и интерпретацию коэффициентов
- объяснять MSE, normal equation и residual analysis
- работать с категориальными признаками и interactions
- сравнивать Linear, Ridge, Lasso и ElasticNet

## Вход в тему

Линейная регрессия — не просто «прямая на графике». Это базовый язык, через который удобно понимать функцию потерь, параметры, регуляризацию, интерпретацию и диагностику ошибок. Даже когда финальная модель сложнее, линейный baseline часто показывает, насколько задача вообще предсказуема.

## Полная теория

## Задача с нуля

Нужно предсказать число: стоимость квартиры, время доставки, сумму покупок. Linear Regression предполагает, что prediction складывается из вкладов признаков:

$$
\widehat{y}=\beta_0+\beta_1x_1+\dots+\beta_px_p.
$$

$\beta_0$ — intercept, $\beta_j$ — изменение prediction при увеличении $x_j$ на единицу при фиксированных остальных признаках.

## Простой пример

Если:

$$
\widehat{price}=2.5+0.12\cdot area,
$$

то при увеличении площади на 10 м² prediction растёт на $1.2$ условных единицы. Это интерпретация модели, а не автоматически causal effect.

## Как обучается

Обычный least squares минимизирует сумму квадратов ошибок:

$$
\operatorname{MSE}
=\frac{1}{n}\sum_{i=1}^{n}(y_i-\widehat{y}_i)^2.
$$

Квадрат сильнее штрафует крупные ошибки и делает objective differentiable. Для matrix $X$:

$$
\widehat{y}=X\beta.
$$

При полном rank аналитическое решение:

$$
\widehat{\beta}=(X^\top X)^{-1}X^\top y.
$$

На практике не вычисляют inverse напрямую: используют QR/SVD или iterative optimization.

## Почему MSE

Если residuals условно Gaussian с постоянной variance, minimization MSE совпадает с maximum likelihood. Но для prediction модель может быть полезной и без нормальности residuals. Нормальность важнее для классических inference formulas.

## Геометрия

Model projection ищет точку $X\widehat{\beta}$ в column space $X$, ближайшую к target $y$ по Euclidean distance. Residual vector ортогонален columns $X$ в обычной least-squares постановке.

## Категориальные признаки

Категория требует encoding. Для one-hot одну категорию обычно удаляют или используют regularization, чтобы избежать полной collinearity с intercept.

```text
city = Moscow / SPb / Other
→ city_Moscow, city_SPb
```

Coefficient сравнивает категорию с reference group при прочих фиксированных признаках.

## Scaling

Prediction ordinary Linear Regression не требует scaling для самой representational capacity, но scaling:

- улучшает optimization;
- делает regularization сопоставимой;
- помогает сравнивать standardized coefficients;
- необходима для стабильности некоторых solvers.

Scaler fit только на train.

## Multicollinearity

Если features почти линейно зависимы, predictions могут оставаться приемлемыми, но coefficients становятся нестабильными и имеют большую uncertainty. Решения:

- удалить duplicate/redundant features;
- объединить;
- Ridge;
- собрать больше данных;
- не делать сильные выводы по individual coefficient.

## Нелинейность

Linear model линейна по parameters, но может использовать transformed features:

$$
\widehat{y}=\beta_0+\beta_1x+\beta_2x^2.
$$

Interactions:

$$
\widehat{y}=\beta_0+\beta_1x_1+\beta_2x_2+\beta_3x_1x_2.
$$

Feature engineering повышает capacity и риск overfit.

## Residual analysis

Residual:

$$
e_i=y_i-\widehat{y}_i.
$$

Проверяйте:

- residual vs prediction;
- residual по времени и сегментам;
- heteroscedasticity;
- крупные influential points;
- systematic curve;
- train-validation gap.

Структура residual означает, что модель не использовала доступный pattern или данные нарушают contract.

## Metrics

- MAE — средняя absolute error, понятна в target units;
- RMSE — сильнее штрафует крупные ошибки;
- $R^2$ — доля variance относительно constant mean baseline;
- MAPE опасна при target около нуля.

Метрику выбирают по cost ошибок и distribution target.

## Regularization

Ridge:

$$
\min_\beta \sum_i(y_i-x_i^\top\beta)^2+\lambda\sum_j\beta_j^2.
$$

Lasso использует $L_1$ penalty и может занулять coefficients. Intercept обычно не штрафуется. $\lambda$ выбирают внутри CV.

## Предположения и интерпретация

Для unbiased classical coefficient estimates нужны корректная specification и exogeneity. Gauss–Markov добавляет условия для minimum variance среди linear unbiased estimators. Для чистого prediction главный вопрос — generalization и stability.

Coefficient нельзя автоматически читать причинно: omitted variables, selection и reverse causality остаются.

## Визуальная демонстрация

Компонент `linear-fit-residual-lab`:

- draggable points;
- линия fit;
- отображение residual segments;
- переключатель MSE/MAE;
- добавление outlier;
- изменение polynomial degree;
- train и validation error.

## sklearn пример

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("model", Ridge(alpha=1.0)),
])
```

## Частые ошибки

- интерпретировать coefficient причинно;
- fit scaler на полном dataset;
- использовать MAPE при нулях;
- игнорировать нелинейный residual pattern;
- сравнивать raw coefficients признаков разных scales;
- считать высокий $R^2$ доказательством полезности;
- extrapolate далеко за train range.

## Обязательная визуальная демонстрация

Точки и линия/плоскость: изменение коэффициентов, residuals, MSE, влияние outlier и Ridge penalty.

## Практика

#### Задание 1. Ручной prediction

Для ŷ=10+2x1−0.5x2 посчитай prediction при x1=4, x2=6 и интерпретируй коэффициенты.

#### Задание 2. Residuals

Даны y=[3,5,10], ŷ=[4,5,8]. Посчитай residuals, MAE и RMSE.

#### Задание 3. Multicollinearity

В модели одновременно есть площадь квартиры в м² и почти точная площадь в ft². Что произойдёт с коэффициентами?

#### Задание 4. Python lab

Собери Pipeline: OHE категорий, StandardScaler чисел, Ridge; сравни MAE/RMSE на validation.

## Разбор практики

**1.** ŷ=10+8−3=15. При фиксированных остальных признаках +1 к x1 увеличивает prediction на 2, +1 к x2 уменьшает на 0.5.

**2.** Residuals=[−1,0,2]; MAE=1; RMSE=sqrt(5/3)≈1.291.

**3.** Предсказания могут быть стабильны, но individual coefficients становятся нестабильными; Ridge или удаление дубликата помогает.

**4.** Все preprocessing-шаги должны fit внутри Pipeline; сравнение проводится на одном split и одной метрике.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что минимизирует OLS?

- A. MAE
- B. Сумму квадратов residuals
- C. ROC-AUC
- D. Количество признаков

**Правильный ответ:** B

**Объяснение:** OLS оптимизирует squared error.

#### Checkpoint 2

**Вопрос:** Что делает Ridge?

- A. Зануляет все коэффициенты
- B. Штрафует большие коэффициенты L2-нормой
- C. Удаляет target
- D. Меняет regression на classification

**Правильный ответ:** B

**Объяснение:** L2 penalty уменьшает variance и стабилизирует коэффициенты.

#### Checkpoint 3

**Вопрос:** Нормальность residuals обязательна для prediction?

- A. Да всегда
- B. Нет; она важнее для классического inference
- C. Только для Ridge
- D. Только при OHE

**Правильный ответ:** B

**Объяснение:** Для predictive use нормальность не является обязательным условием полезности модели.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
