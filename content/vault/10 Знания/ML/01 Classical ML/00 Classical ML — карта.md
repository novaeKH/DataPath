---
title: Classical ML — карта
type: moc
area: ml
status: active
tags:
  - ml/classical
  - ml/navigation
rag: exclude
id: moc.ml.classical-ml-karta
schema_version: 2
language: ru
app: exclude
---
# Classical ML — карта

[[ML — карта знаний|← ML]] · [[00 Математика — карта|Математика]]

## Learn — основы

1. [[ML Foundations]] — постановка задачи, baseline, bias/variance, overfitting и underfitting.
2. [[Linear Regression]] — Gaussian noise → likelihood → MLE → MSE/OLS; отдельная связь с Gauss–Markov.
3. [[Logistic Regression]] — Bernoulli → likelihood → MLE → LogLoss.
4. [[Regularization]] — L2/Gaussian prior/MAP и L1/Laplace prior/MAP.

## Learn — geometry и unsupervised

1. [[K-Nearest Neighbors]] — distance, scaling, выбор $k$ и curse of dimensionality.
2. [[Support Vector Machines]] — margin, hinge loss, $C$, kernels и calibration.
3. [[Principal Component Analysis]] — centering, covariance, eigenvectors, projection, explained variance, SVD и scaling.
4. [[K-Means]] — squared-distance objective, assignment/update, initialization и geometry clusters.

## Learn — probabilistic classifiers

- [[Naive Bayes]] — Bayes theorem, class priors, conditional independence и likelihood variants.

## Learn — trees и ensembles

1. [[Decision Trees]] — split gain, impurity, pruning и failure modes.
2. [[Bagging and Random Forest]] — bootstrap, decorrelation, averaging и OOB.
3. [[Gradient Boosting]] — loss, gradient, pseudo-residual и sequential correction.
4. [[XGBoost LightGBM and CatBoost]] — second-order objective, histograms, ordered categories и systems trade-offs.

## Validation и metrics

- [[Validation Splits and Data Leakage]] — split выбирается по data-generating process.
- [[ML Metrics and Threshold Selection]] — metric связывается с prediction semantics и business decision.
- [[Categorical Features]] — category representation и target leakage.

## Practice

- [[Универсальная схема бинарной классификации]] — end-to-end tabular workflow.
- [[Universal_Regression_Pipeline|Универсальный пайплайн регрессии]].
- [[Tabular_ML_Preprocessing|Подготовка tabular features]].

## Interview

- [[ML Basics and Linear Models — Interview]]
- [[Trees and Random Forest — Interview]]
- [[Gradient Boosting — Interview]]
- [[Validation and Metrics — Interview]]
