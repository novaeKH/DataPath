---
title: "Логистическая регрессия"
id: concept.datapath-v2.042
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 42
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Логистическая регрессия: от линейного score к вероятности класса

Название «логистическая регрессия» сбивает новичков: модель используется прежде всего для классификации.

Её проще понять как продолжение линейной регрессии.

Линейная модель умеет считать score:

\[
z=w^Tx+b.
\]

Но этот score может быть любым числом:

```text
-12.7
0.8
34.2
```

Для бинарной классификации хочется получить число от 0 до 1, которое можно интерпретировать как оценку вероятности положительного класса.

Для этого используется сигмоида (sigmoid):

\[
\sigma(z)=\frac{1}{1+e^{-z}}.
\]

И логистическая регрессия строит:

\[
P(y=1|x)=\sigma(w^Tx+b).
\]

В одной формуле соединяются линейные модели, вероятность, logloss, регуляризация и threshold.

## 1. Почему нельзя просто использовать LinearRegression для класса 0/1

Можно обучить OLS на labels `0` и `1`, но возникает проблема: линейный prediction не ограничен диапазоном вероятности.

Модель способна предсказать:

```text
-0.4
1.7
```

как будто это probability.

Нужна функция, переводящая любой real score в `(0,1)`.

## 2. Сигмоида

\[
\sigma(z)=\frac{1}{1+e^{-z}}.
\]

Поведение:

```text
z → -∞  → probability → 0
z = 0   → probability = 0.5
z → +∞  → probability → 1
```

Примеры:

```text
z = -2 → p ≈ 0.119
z =  0 → p = 0.500
z =  2 → p ≈ 0.881
```

Модель сначала считает линейный score, затем sigmoid превращает его в probability estimate.

## 3. Один объект руками

Пусть модель кредитного дефолта:

\[
z=-3+0.8\cdot overdue + 0.02\cdot debt.
\]

Для условного клиента:

```text
overdue = 2
debt = 50
```

получаем:

\[
z=-3+0.8\cdot2+0.02\cdot50=-0.4.
\]

Теперь:

\[
p=\sigma(-0.4)\approx0.401.
\]

Модель оценивает вероятность positive class примерно в 40%.

Но класс ещё не определён. Для hard decision нужен threshold.

![Учебная иллюстрация: Логистическая регрессия. Линейный score превращается sigmoid в вероятность, а порог задаёт класс и границу решения.](content-assets/datapath-v2/figures/42_logistic_regression.png "Линейный score превращается sigmoid в вероятность, а порог задаёт класс и границу решения.")

## 4. Probability и threshold — разные этапы

При threshold `0.5`:

```text
p >= 0.5 → class 1
p < 0.5  → class 0
```

Но threshold можно менять.

Например fraud:

```text
threshold = 0.2
```

может быть разумен, если пропуск fraud намного дороже лишней проверки.

Поэтому:

```text
обучение probability model
≠
выбор operating threshold
```

Threshold выбирается по validation/OOF и бизнес-цене ошибок.

## 5. Почему модель называется regression

Логистическая регрессия моделирует непрерывный linear response/log-odds, а probability получается через link function.

Класс — это уже решение поверх probability.

Практически важно помнить:

```text
LogisticRegression.predict_proba
→ probabilities

LogisticRegression.predict
→ classes after internal decision rule
```

Для анализа ROC/PR и выбора threshold обычно нужны scores/probabilities, а не `predict()`.

## 6. Odds и log-odds

Если вероятность события:

\[
p=0.8,
\]

odds:

\[
\frac{p}{1-p}=\frac{0.8}{0.2}=4.
\]

То есть условно «4 к 1» в пользу события.

Логарифм odds:

\[
\log\frac{p}{1-p}.
\]

Для логистической регрессии:

\[
\log\frac{p}{1-p}=w^Tx+b.
\]

То есть **log-odds линейны по признакам**.

Отсюда удобная интерпретация coefficients: увеличение feature на 1 меняет log-odds на `w_j`, а odds умножаются на:

\[
e^{w_j}.
\]

Но это всё ещё ассоциация в модели, а не доказательство причинности.

## 7. Почему MSE здесь не основной выбор

Для binary target естественная вероятностная модель — Bernoulli distribution.

Если объект имеет label `y ∈ {0,1}` и model probability `p`, likelihood:

\[
P(y|x)=p^y(1-p)^{1-y}.
\]

Максимизация likelihood приводит к минимизации logloss:

\[
L=-\left[y\log p+(1-y)\log(1-p)\right].
\]

Это **логарифмическая функция потерь (log loss)**, также связанная с binary cross-entropy.

## 8. Как logloss наказывает уверенную ошибку

Если реальный label `y=1`:

```text
p = 0.9 → loss маленькая
p = 0.6 → больше
p = 0.1 → очень большая
```

Модель особенно сильно штрафуется за уверенную неправильную probability.

Это важно: logloss оценивает не только правильный ranking, но и качество probability assignment относительно labels.

## 9. Что происходит после `fit()` концептуально

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)
```

В отличие от обычного OLS здесь нет простой closed-form формулы coefficients.

Концептуально solver:

```text
берёт текущие weights
→ считает linear scores
→ sigmoid / class probabilities
→ penalized log-loss
→ вычисляет направление изменения weights
→ обновляет parameters
→ повторяет до convergence
```

Конкретный numerical algorithm зависит от `solver`.

## 10. Scikit-learn LogisticRegression регуляризована по умолчанию

Это важная implementation detail.

`sklearn.linear_model.LogisticRegression` использует regularization по умолчанию. В актуальном API default penalty связан с L2 regularization, а доступность L1/L2/Elastic Net зависит от solver.

Поэтому sklearn `LogisticRegression` — не просто «чистая textbook logistic regression без penalty».

## 11. Параметр `C`

В sklearn:

```text
C большое  → regularization слабее
C маленькое → regularization сильнее
```

Это противоположно интуиции `alpha` Ridge:

```text
alpha большое → penalty сильнее
```

Например:

```python
LogisticRegression(C=0.1)
```

обычно сильнее регуляризована, чем:

```python
LogisticRegression(C=10)
```

## 12. Scaling

Логистическая регрессия часто оптимизируется итеративным solver и использует coefficient regularization.

Поэтому признаки сильно разных масштабов лучше стандартизировать.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(C=1.0, max_iter=1000),
)
```

`StandardScaler` должен быть внутри Pipeline, чтобы не обучаться на validation fold.

## 13. Коэффициенты

Положительный coefficient:

```text
feature ↑ → linear score ↑ → p(y=1) обычно ↑
```

Отрицательный — наоборот.

Но сравнивать абсолютные coefficients напрямую можно только с учётом scale и correlation.

Если два features сильно коррелированы, отдельные weights могут быть нестабильными.

## 14. Decision boundary остаётся линейной

При threshold `0.5` boundary находится там, где:

\[
p=0.5.
\]

Для sigmoid это соответствует:

\[
z=0.
\]

То есть:

\[
w^Tx+b=0.
\]

Это гиперплоскость.

Sigmoid нелинейна, но decision boundary по исходным числовым признакам без nonlinear feature transformations остаётся линейной.

## 15. Нелинейные признаки

Как и в Linear Regression, можно добавить:

```text
x²
x1*x2
log(x)
```

Тогда boundary в исходном пространстве может стать nonlinear, хотя модель остаётся линейной по coefficients.

## 16. Дисбаланс классов

Пусть positive class 1%.

Логистическая регрессия не становится бесполезной автоматически, но:

- accuracy почти ничего не говорит;
- нужен stratified/group/time split по задаче;
- полезны AP/PR metrics;
- threshold часто не 0.5;
- иногда используют `class_weight`.

Важно различать:

**class_weight** меняет objective обучения.

**threshold** меняет decision rule после обучения.

Это разные рычаги.

## 17. `predict`, `predict_proba`, `decision_function`

```python
model.predict(X)
```

даёт class labels.

```python
model.predict_proba(X)
```

даёт probabilities по классам.

```python
model.decision_function(X)
```

для поддерживающего estimator даёт raw decision score до thresholding.

Для ROC-AUC можно использовать probability или подходящий continuous decision score.

## 18. Многоклассовая классификация

Для `K > 2` классов используется обобщение через multinomial/softmax formulation или decomposition approaches в зависимости от estimator/solver.

Softmax:

\[
P(y=k|x)=\frac{e^{z_k}}{\sum_j e^{z_j}}.
\]

На первом проходе важнее понять binary case. Softmax затем появится снова в нейросетях и Transformer.

## 19. Реальный pipeline

```python
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, average_precision_score

X_train, X_valid, y_train, y_valid = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42,
)

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(C=1.0, max_iter=1000),
)

model.fit(X_train, y_train)
proba = model.predict_proba(X_valid)[:, 1]

print("ROC-AUC:", roc_auc_score(y_valid, proba))
print("AP:", average_precision_score(y_valid, proba))
```

После этого threshold выбирается отдельно по validation objective.

## 20. Failure modes

### Нелинейная boundary

Модель underfit, если feature representation не отражает нужные взаимодействия.

### Multicollinearity

Weights нестабильны.

### Scale

Optimization и penalty работают хуже без разумного scaling.

### Complete/quasi separation

Если классы почти идеально разделяются, unregularized coefficients могут стремиться к большим значениям. Regularization стабилизирует задачу.

### Leakage

Модель с удовольствием использует future information — простота алгоритма не защищает от methodological errors.

## 21. Логистическая регрессия как baseline

Она особенно сильна как baseline, когда:

- нужны probabilities;
- признаки уже информативны и примерно линейно разделимы;
- важна скорость;
- нужна интерпретация;
- данные sparse/high-dimensional, например TF-IDF.

Во многих текстовых задачах простая linear classifier — обязательный кандидат перед сложной нейросетью.

## 22. Интерактивная визуализация

### Сцена 1

Ползунок `z` и sigmoid curve. Показывать связь `score → probability`.

### Сцена 2

2D points и linear decision boundary. Изменение coefficients двигает/вращает boundary.

### Сцена 3

Ползунок threshold:

```text
0.1 ←→ 0.9
```

Подсвечивать TP/FP/FN/TN и пересчитывать precision/recall.

### Сцена 4

Показать logloss для confident correct и confident wrong prediction.

## 23. Типичные ошибки

**«Logistic Regression — регрессия для числового target».**\
Обычно используется как classifier.

**«Sigmoid делает boundary нелинейной».**\
Без nonlinear feature engineering boundary остаётся линейной.

**«Threshold всегда 0.5».**\
Он зависит от задачи.

**«class_weight и threshold — одно и то же».**\
Нет: первый влияет на fit, второй на decision.

**«C больше → regularization сильнее».**\
В sklearn обычно наоборот.

**«predict_proba = predict».**\
Нет.

**«Высокая ROC-AUC означает хорошие probabilities».**\
Ranking и calibration различаются.

## 24. Проверка понимания

1. Зачем sigmoid?
2. Что такое linear score `z`?
3. Почему threshold отделён от обучения?
4. Что такое odds и log-odds?
5. Откуда появляется logloss?
6. Почему confident wrong prediction дорого стоит по logloss?
7. Что делает `C`?
8. Почему scaling важен?
9. Чем `predict_proba` отличается от `predict`?
10. Почему sigmoid не делает decision boundary нелинейной?
11. Чем class_weight отличается от threshold?

## 25. Мини-практика

Модель выдаёт probabilities:

```text
y: 1 0 1 0 1 0
p: .9 .8 .7 .6 .4 .1
```

Для thresholds `0.5` и `0.75`:

1. получите predictions;
2. посчитайте TP/FP/FN/TN;
3. precision;
4. recall;
5. объясните, какой threshold лучше при дорогом FN;
6. почему нельзя выбрать threshold по final test.

## Что нужно унести

1. Logistic Regression строит linear score и переводит его в probability через sigmoid.
2. Log-odds линейны по features.
3. Logloss естественно возникает из Bernoulli likelihood.
4. Probability model и threshold — разные этапы.
5. sklearn LogisticRegression regularized by default.
6. `C` меньше — penalty обычно сильнее.
7. Scaling важен для optimization/regularization.
8. `predict_proba` нужен для probability/ranking analysis.
9. Class weighting и thresholding решают разные задачи.
10. Logistic Regression — сильный и прозрачный baseline.

## Куда дальше

До сих пор модели строили **глобальную формулу** для всего пространства.

Следующий алгоритм мыслит иначе:

> «Чтобы предсказать новый объект, посмотрим на похожие объекты рядом».

Так появляется метод k ближайших соседей (k-Nearest Neighbors, kNN).

### Источники

- scikit-learn User Guide — Logistic regression.
- Yandex ML Handbook — Линейные модели.
- Stanford CS229 — Logistic Regression.
