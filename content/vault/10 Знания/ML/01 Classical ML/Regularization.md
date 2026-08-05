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

# Regularization

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

## Визуализация

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

## Сравнение: L1 vs L2 vs Elastic Net

| | L2 / Ridge | L1 / Lasso | Elastic Net |
|---|---|---|---|
| Штраф | $\lambda\sum \beta_j^2$ | $\lambda\sum |\beta_j|$ | комбинация |
| Эффект | сжатие коэффициентов | зануление (отбор) | сжатие + отбор |
| Коррелированные признаки | делят вес | выбирает один | группы |
| Когда | много шумных, multicollinearity | отбор признаков | много коррелированных |

## Простой пример

Полином степени 15 на 20 точках: без регуляризации коэффициенты взрываются и модель осциллирует; с ростом $\lambda$ кривая сглаживается, train quality падает, validation растёт — классический bias-variance trade-off.

## Пример кода

```python
from sklearn.linear_model import Ridge, Lasso, ElasticNet
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

for model in [Ridge(alpha=1.0), Lasso(alpha=0.01), ElasticNet(alpha=0.01, l1_ratio=0.5)]:
    pipe = make_pipeline(StandardScaler(), model)
    pipe.fit(X_train, y_train)
    print(type(model).__name__, pipe.score(X_val, y_val))
```

## Связи

- [[Linear Regression]]
- [[Logistic Regression]]
- [[Optimization and Regularization in Deep Learning]]
- [[Model Selection and Hyperparameter Tuning]]
