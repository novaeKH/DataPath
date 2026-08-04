---
title: Regularization
type: concept
area: ml
status: active
aliases:
  - Регуляризация
  - L1 L2 Elastic Net
  - Ridge Lasso
tags:
  - ml/classical
  - ml/generalization
math_depth: 2
id: concept.ml.regularization
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Regularization

## Идея за 30 секунд

Regularization ограничивает effective complexity модели, принимая небольшой training bias ради меньшей variance и более устойчивого поведения. Для probabilistic model L2 соответствует Gaussian prior и MAP, L1 — Laplace prior и MAP. Сила penalty зависит от feature scale, поэтому numeric features обычно масштабируют внутри pipeline.

## Penalized objective

$$
\widehat{\theta}
=\arg\min_\theta
\left[
\mathcal{L}_{\text{data}}(\theta)
+\lambda\Omega(\theta)
\right].
$$

$\mathcal{L}_{\text{data}}$ измеряет fit, $\Omega$ — complexity preference, $\lambda\ge0$ — trade-off.

При росте $\lambda$:

- coefficients сильнее shrink;
- bias обычно растёт;
- variance обычно уменьшается;
- optimization/conditioning может улучшиться;
- underfitting risk растёт.

## L2 / Ridge

$$
\Omega_2(\theta)=\sum_j\theta_j^2.
$$

L2 smooth и сильно штрафует крупные coefficients. При correlated features она часто распределяет вес между ними и стабилизирует solution.

### Gaussian prior → MAP

Если:

$$
\theta_j\overset{\text{ind}}{\sim}\mathcal{N}(0,\tau^2),
$$

то:

$$
-\log p(\theta)
=\frac{1}{2\tau^2}\sum_j\theta_j^2+\text{const}.
$$

MAP objective становится data NLL plus L2. Smaller prior variance $\tau^2$ означает stronger shrinkage.

## L1 / Lasso

$$
\Omega_1(\theta)=\sum_j|\theta_j|.
$$

L1 имеет kink в нуле, поэтому optimum часто содержит exact zero coefficients. Это даёт sparse model, но не гарантирует стабильный feature selection.

### Laplace prior → MAP

$$
p(\theta_j)
\propto
\exp\left(-\frac{|\theta_j|}{b}\right).
$$

Тогда:

$$
-\log p(\theta)
=\frac{1}{b}\sum_j|\theta_j|+\text{const},
$$

что даёт L1 penalty.

При группе correlated features L1 может выбрать один почти случайно и менять выбор между folds.

## Elastic Net

$$
\Omega(\theta)
=\alpha\sum_j|\theta_j|
+(1-\alpha)\sum_j\theta_j^2.
$$

Elastic Net сочетает sparsity L1 и stability L2. Полезна при многих correlated features, когда чистая L1 слишком нестабильна.

## Почему scaling обязателен

Penalty действует на coefficients, а coefficient magnitude зависит от units feature. Если один feature измерен в метрах, другой в миллиметрах, одинаковая predictive effect требует coefficients разного масштаба.

Правильный pipeline:

```text
train split
→ fit scaler на train
→ transform train/validation
→ fit regularized model
```

Fit scaler до split создаёт leakage.

## Что обычно не regularize

Intercept часто не штрафуют: он задаёт global baseline, а не sensitivity к feature. Конкретное поведение зависит от библиотеки и representation intercept.

## Другие формы regularization

- Early stopping ограничивает число boosting/gradient steps.
- Dropout добавляет stochastic perturbation activations.
- Data augmentation задаёт invariances через новые examples.
- Tree depth/min leaf ограничивают structural capacity.
- Weight decay в adaptive optimizer нужно отличать от добавления L2 к gradient; AdamW применяет decoupled weight decay.

## Что если regularization выбрана неверно

- Слишком слабая: unstable coefficients, большой train/validation gap.
- Слишком сильная: underfit и систематические residual patterns.
- Неверный split: best $\lambda$ оптимизирует leakage.
- Resampling/weights: effective loss scale меняется, поэтому численное значение $\lambda$ не переносится автоматически.
- Не все parameters нужно shrink одинаково: embeddings, bias и normalization parameters могут требовать отдельной политики.

## Связи

- [[Likelihood MLE and MAP]] — probabilistic вывод L1/L2.
- [[ML Foundations]] — bias–variance и overfitting.
- [[Linear Regression]] — Ridge/Lasso для continuous target.
- [[Logistic Regression]] — regularized probabilistic classifier.
- [[Gradients Chain Rule and Optimization]] — penalty меняет gradient и curvature.
- [[Validation Splits and Data Leakage]] — tuning regularization только внутри validation scheme.
