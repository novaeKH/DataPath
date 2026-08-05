---
title: Principal Component Analysis
id: concept.ml.principal-component-analysis
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
- PCA
- Метод главных компонент
tags:
- ml/classical
- ml/dimensionality-reduction
math_depth: 2
---

# Principal Component Analysis

## Интуиция

Если points образуют вытянутое облако, можно повернуть координаты так, чтобы первая ось шла вдоль максимального разброса, вторая — вдоль следующего независимого направления. PCA строит такие orthogonal components и позволяет оставить первые $k$.

## Подготовка

Матрица $X\in\mathbb R^{n\times d}$ центрируется:

$$
X_c=X-\mathbf 1\bar x^\top.
$$

Если units отличаются и absolute variance не должна определять importance, сначала standardize features.

## Covariance view

$$
S=\frac{1}{n-1}X_c^\top X_c.
$$

Principal direction $v_j$ — eigenvector covariance matrix:

$$
Sv_j=\lambda_jv_j.
$$

$\lambda_j$ — variance проекции. Components сортируются по убыванию $\lambda$.

## SVD view

$$
X_c=U\Sigma V^\top.
$$

Columns $V$ — principal directions, а:

$$
\lambda_j=\frac{\sigma_j^2}{n-1}.
$$

SVD обычно используется для устойчивого вычисления.

## Projection

$$
Z=X_cV_k.
$$

$Z$ содержит coordinates objects в reduced space. Reconstruction:

$$
\widehat X=ZV_k^\top+\bar x.
$$

Первые $k$ components минимизируют squared reconstruction error среди linear rank-$k$ projections.

## Explained variance

$$
\operatorname{EVR}_j=\frac{\lambda_j}{\sum_l\lambda_l}.
$$

Выбор $k$ зависит от:

- downstream CV metric;
- reconstruction;
- memory/latency;
- visualization;
- stability;
- interpretability.

`95% variance` — heuristic, не универсальное правило.

## Пример

Два features: рост в сантиметрах и рост в дюймах. Они почти дублируют друг друга. Первая component сохраняет общий direction роста, вторая имеет очень малую variance и в основном описывает noise/несогласованность.

## Scaling меняет задачу

Без scaling feature с большой variance в физических units доминирует. После StandardScaler PCA работает с correlation-like structure. Оба варианта могут быть правильными — вопрос должен быть сформулирован заранее.

## Leakage

Scaler и PCA fit только на train fold. Даже без target covariance validation data содержит информацию о distribution.

## Интерпретация

Loadings показывают direction component, но:

- sign условен;
- при близких eigenvalues directions нестабильны;
- component не causal factor;
- high variance не означает predictive importance;
- low-variance feature может быть сильным для target.

## Sparse data

Centering sparse matrix делает её dense. `TruncatedSVD` не выполняет полное centering и решает близкую, но другую задачу. Для text это часто практичнее.

## Когда использовать

- снижение размерности для визуализации (2–3 компоненты);
- декорреляция признаков и борьба с multicollinearity;
- шумоподавление и сжатие (с сохранением explained variance);
- НЕ использовать как «чёрный ящик» без масштабирования; не полагаться на интерпретацию компонент как реальных признаков; PCA до split — leakage.

## Визуализация

Компонент `pca-projection-lab`:

- вращаемое 2D cloud;
- first/second component arrows;
- projection onto PC1;
- reconstruction error;
- scaling toggle;
- outlier toggle;
- explained variance bars.

## sklearn пример

```python
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

pipeline = Pipeline([
    ("scale", StandardScaler()),
    ("pca", PCA(n_components=0.95, random_state=42)),
    ("model", model),
])
```

## Ответ для собеседования

> PCA находит ортогональные направления максимальной дисперсии данных: собственные векторы ковариационной матрицы (или правые сингулярные векторы через SVD). Проекция $X W_k$ даёт новые признаки; число компонент выбирают по explained variance. Обязательно масштабирование признаков и fit только на train, иначе утечка информации.

## Частые ошибки

- fit PCA на полном dataset;
- считать 2D separation доказательством;
- применять без scaling по привычке;
- интерпретировать component как реальную скрытую сущность;
- удалять low-variance components без downstream validation;
- сравнивать loadings при нестабильных close eigenvalues.

## Сравнение с другими методами снижения размерности

| Метод | Линейность | Интерпретация | Когда |
|---|---|---|---|
| PCA | линейный | компоненты-направления | декорреляция, визуализация |
| t-SNE | нелинейный | расстояния в малой размерности | визуализация |
| UMAP | нелинейный | сохраняет локальную структуру | визуализация больших данных |
| Feature selection | — | сохраняет исходные признаки | интерпретируемость |

PCA — детерминированный и обратимый; t-SNE/UMAP — для картинок, не для фичей модели.

## Связи

- [[Eigenvalues Covariance Matrix and PCA Foundations]]
- [[Singular Value Decomposition]]
- [[K-Means]]
- [[K-Nearest Neighbors]]
