---
title: Gradients Chain Rule and Optimization
type: concept
area: math
status: active
aliases:
  - Градиенты chain rule и оптимизация
  - Gradient descent
  - Backpropagation mathematics
tags:
  - math/optimization
  - ml/foundations
math_depth: 2
id: concept.math.gradients-chain-rule-and-optimization
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Gradients Chain Rule and Optimization

## Идея за 30 секунд

Derivative показывает локальную чувствительность scalar output к изменению input. Gradient собирает derivatives по параметрам и указывает направление самого быстрого роста при Euclidean geometry. Chain rule передаёт sensitivity через композицию функций; backpropagation эффективно применяет его к computational graph. Optimizer использует gradient, но его поведение зависит от learning rate, curvature, noise и conditioning.

## Производная и локальная аппроксимация

Для scalar function $f:\mathbb{R}\to\mathbb{R}$:

$$
f'(x)
=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}.
$$

Локально:

$$
f(x+\Delta x)
\approx
f(x)+f'(x)\Delta x.
$$

Derivative — коэффициент первой-order approximation, а не просто «наклон картинки».

## Gradient

Для $f:\mathbb{R}^d\to\mathbb{R}$:

$$
\nabla f(x)
=
\begin{bmatrix}
\frac{\partial f}{\partial x_1}\\
\vdots\\
\frac{\partial f}{\partial x_d}
\end{bmatrix}.
$$

Directional derivative в unit direction $v$:

$$
D_vf(x)=\nabla f(x)^\top v.
$$

По Cauchy–Schwarz maximum достигается при $v$ параллельном $\nabla f$. Поэтому negative gradient — направление steepest local decrease в Euclidean norm. При другой geometry понятие «самого быстрого» меняется.

## Jacobian

Для vector-valued $g:\mathbb{R}^d\to\mathbb{R}^m$ Jacobian:

$$
J_g(x)_{ij}
=\frac{\partial g_i}{\partial x_j}.
$$

Он описывает, как небольшое изменение input меняет все components output:

$$
g(x+\Delta x)\approx g(x)+J_g(x)\Delta x.
$$

## Chain rule

Если $z=g(x)$ и $L=f(z)$, то:

$$
\frac{dL}{dx}
=\frac{dL}{dz}\frac{dz}{dx}.
$$

В vector form orientation зависит от convention, но смысл один: upstream sensitivity умножается на local derivative.

Для computational graph с множеством paths contributions суммируются. Backpropagation идёт от scalar loss назад, переиспользуя уже вычисленные intermediate gradients; поэтому он значительно эффективнее отдельного differentiating по каждому parameter.

## Hessian и curvature

Для scalar $f$ Hessian:

$$
H_f(x)_{ij}
=\frac{\partial^2 f}
{\partial x_i\partial x_j}.
$$

Second-order approximation:

$$
f(x+\Delta)
\approx
f(x)+\nabla f(x)^\top\Delta
+\frac{1}{2}\Delta^\top H_f(x)\Delta.
$$

Eigenvalues Hessian описывают curvature:

- все положительные — local convex bowl;
- есть отрицательные — saddle или non-convex direction;
- большой spread eigenvalues — ill-conditioning.

Hessian — curvature/effective weight, а не универсальная «мера уверенности».

## Gradient descent

$$
\theta_{t+1}
=\theta_t-\eta\nabla_\theta L(\theta_t),
$$

где $\eta$ — learning rate.

Слишком большой $\eta$ даёт oscillation или divergence; слишком маленький — медленный progress. Для quadratic objective stable step связан с largest eigenvalue Hessian.

Feature scaling улучшает conditioning: optimizer не вынужден одновременно двигаться по очень крутым и очень плоским directions.

## Convexity

Для convex $f$:

$$
f(tx+(1-t)y)
\le
tf(x)+(1-t)f(y),
\qquad t\in[0,1].
$$

У convex differentiable objective любой local minimum является global. Strong convexity добавляет curvature lower bound и даёт более сильные convergence guarantees.

Neural networks non-convex; отсутствие convexity не означает, что gradient methods бесполезны, но убирает простую гарантию global optimum.

## Stochastic gradient

Mini-batch gradient:

$$
g_t
=\frac{1}{|B_t|}
\sum_{i\in B_t}
\nabla_\theta \ell_i(\theta_t)
$$

приближает full gradient. Noise ускоряет дешёвые updates и иногда помогает exploration, но увеличивает variance trajectory. Batch size, learning rate schedule и optimizer нельзя интерпретировать независимо.

## Что если предположения нарушены

- Nondifferentiable points требуют subgradient или smooth approximation.
- Vanishing/exploding gradients возникают из repeated Jacobian products.
- Poor conditioning замедляет first-order methods.
- Gradient zero может означать minimum, maximum, saddle или flat region.
- Numerical overflow/underflow требует stable forms: log-sum-exp, fused cross-entropy, gradient clipping как аварийная мера.

## Связи

- [[Linear Algebra for ML]] — dot products, Jacobians и Hessian eigenvalues.
- [[Likelihood MLE and MAP]] — loss часто является negative log-likelihood plus prior penalty.
- [[Eigenvalues Covariance Matrix and PCA Foundations]] — constrained variance maximization приводит к eigenvectors.
- [[Singular Value Decomposition]] — conditioning объясняет устойчивость least squares и optimization.
