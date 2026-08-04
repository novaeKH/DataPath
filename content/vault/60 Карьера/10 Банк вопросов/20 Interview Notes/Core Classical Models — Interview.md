---
title: Core Classical Models — Interview
type: interview
area: career
status: active
aliases:
  - KNN Naive Bayes SVM PCA K-Means — Interview
tags:
  - interview/ml
  - ml/classical
id: interview.career.core-classical-models-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Core Classical Models — Interview

Короткие ответы по classical models, которые не должны превращаться во второй учебник.

## Вопрос 1 — Почему KNN требует scaling и страдает в высокой размерности?

### Ответ 20–30 секунд

KNN находит ближайшие train objects по выбранной distance и агрегирует их labels. Признак с крупными единицами доминирует distance, поэтому scaler fit выполняют внутри train folds. В высокой размерности distances становятся менее различимыми, а локальная плотность данных падает — это curse of dimensionality.

### Если попросят глубже

Малый $k$ даёт low bias и high variance, большой $k$ сильнее сглаживает. Scaling не спасает от irrelevant dimensions; metric, feature selection и $k$ выбирают по честной CV.

### Follow-up

- Когда cosine distance разумнее Euclidean?
- Почему scaler нельзя fit до split?

### Связанные знания

- [[K-Nearest Neighbors]]
- [[Validation Splits and Data Leakage]]

## Вопрос 2 — Как работает Naive Bayes и в чём его naive assumption?

### Ответ 20–30 секунд

Naive Bayes сравнивает для каждого класса class prior, умноженный на class-conditional likelihood признаков. Bayes theorem переводит этот score в posterior, а naive assumption раскладывает joint likelihood в произведение, считая признаки условно независимыми при фиксированном классе.

### Если попросят глубже

На практике scores считают в log-space. Gaussian, Multinomial и Bernoulli variants задают разные feature likelihoods; smoothing защищает от zero probability. Correlated features могут учитываться несколько раз и делать probabilities переуверенными.

### Follow-up

- Чем conditional independence отличается от обычной independence?
- Зачем Multinomial Naive Bayes additive smoothing?

### Связанные знания

- [[Naive Bayes]]
- [[Conditional Probability and Bayes Theorem]]
- [[Likelihood MLE and MAP]]

## Вопрос 3 — Что оптимизирует SVM?

### Ответ 20–30 секунд

Linear SVM ищет hyperplane с большим geometric margin. Soft-margin objective сочетает L2-норму weights и hinge loss; parameter $C$ задаёт цену margin violations. Kernel заменяет dot product и позволяет получить нелинейную boundary в implicit feature space.

### Если попросят глубже

Support vectors имеют active constraints и определяют boundary. Scaling важен и для margin, и для RBF distance; $C$ и $\gamma$ настраивают вместе. Decision score не является probability — calibration выполняют отдельно на held-out или out-of-fold predictions.

### Follow-up

- Что меняется при увеличении $C$?
- Почему kernel SVM плохо масштабируется по числу объектов?

### Связанные знания

- [[Support Vector Machines]]
- [[Regularization]]
- [[ML Metrics and Threshold Selection]]

## Вопрос 4 — Как PCA получает principal components?

### Ответ 20–30 секунд

PCA сначала центрирует данные, строит covariance matrix и берёт eigenvectors с крупнейшими eigenvalues. Затем объекты проецируются на первые directions; eigenvalues задают explained variance. Практически directions устойчивее находят через SVD centered matrix.

### Если попросят глубже

Для $X_c=U\Sigma V^\top$ columns $V$ — principal directions, а $\lambda_j=\sigma_j^2/(n-1)$. Scaling меняет objective: без него PCA сохраняет absolute variance, после standardization работает с correlation structure. Все preprocessing parameters fit только на train fold.

### Follow-up

- Почему centering обязателен?
- Когда scaling перед PCA вреден?
- Чем TruncatedSVD на sparse data отличается от PCA?

### Связанные знания

- [[Principal Component Analysis]]
- [[Eigenvalues Covariance Matrix and PCA Foundations]]
- [[Singular Value Decomposition]]

## Вопрос 5 — Почему K-Means чередует assignment и пересчёт mean?

### Ответ 20–30 секунд

K-Means минимизирует сумму squared Euclidean distances до centroids. При фиксированных centroids лучший assignment — ближайший centroid; при фиксированном cluster лучший centroid — mean его points. Поэтому Lloyd algorithm чередует два шага и не увеличивает objective.

### Если попросят глубже

Алгоритм сходится только к local optimum, поэтому используют несколько initializations и k-means++. Scaling определяет geometry, а elongated, non-convex clusters и outliers нарушают implicit assumptions.

### Follow-up

- Как выбирать $K$?
- Почему median не является update для squared Euclidean objective?

### Связанные знания

- [[K-Means]]
- [[Expectation Variance Covariance and Correlation]]
- [[Validation Splits and Data Leakage]]
