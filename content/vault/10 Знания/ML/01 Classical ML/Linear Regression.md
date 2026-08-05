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

# Linear Regression

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

## Полиномиальная регрессия

Когда зависимость нелинейная, линейная модель по исходным признакам недообучается. Polynomial Regression добавляет степени исходных признаков и остаётся **линейной по параметрам**:

$$
\widehat{y}=\beta_0+\beta_1x+\beta_2x^2+\dots+\beta_dx^d.
$$

- **Почему работает**: базисное расширение (basis expansion) переводит нелинейность в новое пространство признаков, где модель снова линейная.
- **Как обучается**: те же least squares / gradient descent, что и у Linear Regression; добавляется только шаг генерации признаков `PolynomialFeatures`.
- **Важные параметры**: степень `degree` (главный — контролирует гибкость) и `include_bias`.
- **Преимущества**: простота, интерпретируемость (коэффициенты), работает как baseline для криволинейных зависимостей.
- **Ограничения**: при больших `degree` — сильный overfit, раздувание признаков (interactions), опасная экстраполяция за пределы train range; чувствителен к масштабу.
- **Когда использовать**: заметный криволинейный тренд, небольшое число признаков, нужна простая объяснимая модель; если данных много и форма сложная — лучше деревья/boosting.

```python
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures

model = make_pipeline(
    PolynomialFeatures(degree=3, include_bias=False),
    LinearRegression(),
)
model.fit(X_train, y_train)
```

Интервью-ответ: «Полиномиальная регрессия — это линейная модель после добавления степеней признаков; она линейна по параметрам, поэтому обучается теми же методами, а гибкость задаётся degree и контролируется валидацией».

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

## Функции потерь для регрессии

- **MSE** $\frac{1}{n}\sum_i(y_i-\widehat{y}_i)^2$ — квадратичный штраф: сильно наказывает крупные ошибки, даёт гладкий градиент; стандарт для обучения.
- **MAE** $\frac{1}{n}\sum_i|y_i-\widehat{y}_i|$ — линейный штраф: устойчивее к outliers, но негладкая в нуле.
- **Huber** — гибрид: квадратичная вблизи нуля и линейная за порогом $\delta$; сочетает устойчивость MAE и гладкость MSE.

Выбор loss = выбор того, какие ошибки считать дорогими. Если outliers — шум данных, а не сигнал, MSE заставит модель «тянуться» к ним; MAE/Huber этого избегают.

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

## Когда использовать

- маленький/средний датасет с линейной или умеренно нелинейной зависимостью;
- нужна интерпретируемость коэффициентов и baseline для сравнения;
- важно быстрое обучение и предсказуемое поведение;
- НЕ использовать, если признаки слабо связаны с target, много категорий с высокой cardinality, сильные interactions — сначала попробовать деревья/ансамбли.

## Визуализация

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

## Ответ для собеседования

> Линейная регрессия ищет коэффициенты $\beta$, минимизирующие MSE (обычно closed-form или градиентным спуском). Это линейная модель по параметрам, поэтому polynomial features остаются «линейной регрессией». Главные риски — outliers, multicollinearity, отсутствие scaling и причинная интерпретация коэффициентов без дополнительных предположений.

## Частые ошибки

- интерпретировать coefficient причинно;
- fit scaler на полном dataset;
- использовать MAPE при нулях;
- игнорировать нелинейный residual pattern;
- сравнивать raw coefficients признаков разных scales;
- считать высокий $R^2$ доказательством полезности;
- extrapolate далеко за train range.

## Сравнение с другими моделями

- **Linear vs Logistic**: первая для непрерывного target (MSE), вторая — для вероятности класса (LogLoss);
- **Linear vs деревья/ансамбли**: линейная — интерпретируемая и стабильная, но не ловит сложные interactions; ансамбли — выше качество на нелинейных данных ценой интерпретируемости;
- **Ridge/Lasso vs plain Linear**: регуляризация нужна при multicollinearity, многих признаках и переобучении.

## Связи

- [[Regularization]]
- [[Gauss-Markov Theorem]]
- [[Likelihood MLE and MAP]]
- [[Data Preprocessing and Feature Engineering]]
