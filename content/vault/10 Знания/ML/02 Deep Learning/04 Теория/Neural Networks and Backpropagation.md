---
title: Neural Networks and Backpropagation
type: concept
area: dl
status: active
aliases:
  - Нейронные сети и backpropagation
  - Backprop
  - Backpropagation
tags:
  - dl/foundations
  - dl/optimization
math_depth: 2
id: concept.dl.neural-networks-and-backpropagation
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Neural Networks and Backpropagation

## Идея за 30 секунд

Neural network чередует affine transformations и nonlinear activations. Forward pass вычисляет prediction и loss. Computational graph хранит зависимости операций, а backpropagation применяет chain rule от loss к каждому parameter. Optimizer использует gradients для update; backprop сам параметры не меняет.

## Neuron и Linear layer

Один neuron:

$$
z=w^\top x+b,
\qquad
a=\phi(z).
$$

$w$ задаёт direction/sensitivity, $b$ — offset, $\phi$ — activation.

Для batch:

$$
Z=XW^\top+b,
$$

где $X\in\mathbb{R}^{B\times d_{\text{in}}}$, $W\in\mathbb{R}^{d_{\text{out}}\times d_{\text{in}}}$, $Z\in\mathbb{R}^{B\times d_{\text{out}}}$.

Linear layer в libraries фактически affine из-за bias.

## Зачем activation

Композиция только affine layers остаётся affine:

$$
W_2(W_1x+b_1)+b_2
=\widetilde{W}x+\widetilde{b}.
$$

Nonlinearity увеличивает expressive power.

### ReLU

$$
\operatorname{ReLU}(z)=\max(0,z).
$$

Дешёвая и помогает gradient flow для positive region. Negative region имеет zero derivative; neuron может «умереть», если постоянно остаётся там.

### Sigmoid

$$
\sigma(z)=\frac{1}{1+e^{-z}}.
$$

Подходит для binary probability output, но в hidden layers saturates и даёт малые gradients.

### Tanh

$$
\tanh(z)\in[-1,1].
$$

Zero-centered, но также saturates.

Activation выбирают по роли layer; output activation согласуется с loss.

## Forward pass

Для двух layers:

$$
h=\phi(W_1x+b_1),
$$

$$
z=W_2h+b_2,
$$

$$
\widehat{y}=g(z),
$$

$$
L=\ell(y,z).
$$

Stable implementations часто принимают logits $z$ и внутри объединяют activation с loss: `CrossEntropyLoss` не требует external softmax, `BCEWithLogitsLoss` — external sigmoid.

## Loss

Loss задаёт training signal и prediction semantics.

Regression MSE:

$$
L=\frac{1}{B}\sum_i(y_i-\widehat{y}_i)^2.
$$

Binary cross-entropy from logits соответствует Bernoulli NLL.

Multiclass cross-entropy:

$$
L_i
=-\log
\frac{\exp(z_{i,y_i})}
{\sum_{c=1}^{C}\exp(z_{i,c})}.
$$

Softmax values сравнимы внутри одного object; subtract max logit используется для numerical stability.

## Computational graph

Graph состоит из:

- tensors/values;
- operations;
- directed dependencies.

Autograd записывает operations над tensors с `requires_grad`, затем при `backward()` проходит graph в reverse topological order.

Intermediate values нужны для local derivatives, поэтому training хранит activations и потребляет больше memory, чем inference.

## Chain rule

Если:

$$
L=f(h),
\qquad
h=g(z),
\qquad
z=q(w),
$$

то:

$$
\frac{\partial L}{\partial w}
=\frac{\partial L}{\partial h}
\frac{\partial h}{\partial z}
\frac{\partial z}{\partial w}.
$$

При нескольких paths gradient contributions суммируются.

## Backpropagation по шагам

1. Forward: вычислить activations, logits и loss.
2. Инициализировать upstream gradient $\partial L/\partial L=1$.
3. Для каждой operation в reverse order:
   - взять incoming gradient;
   - умножить на local derivative/Jacobian;
   - накопить contributions к inputs/parameters.
4. Получить `.grad` для trainable parameters.
5. Optimizer выполняет update.
6. Очистить gradients перед следующим batch.

Backprop — efficient algorithm derivatives, а не optimizer.

## Gradient для Linear layer

Если:

$$
Z=XW^\top+b
$$

и известен $G=\partial L/\partial Z$, то:

$$
\frac{\partial L}{\partial W}=G^\top X,
$$

$$
\frac{\partial L}{\partial b}
=\sum_{\text{batch}}G,
$$

$$
\frac{\partial L}{\partial X}=GW.
$$

Shapes служат проверкой вывода.

## Vanishing и exploding gradients

Repeated Jacobian products могут:

- уменьшаться к нулю;
- расти до overflow;
- иметь разные scales по directions.

Помогают initialization, normalization, residual connections, подходящие activations, gradient clipping и architecture design. Clipping лечит symptom large gradients, но не заменяет поиск причины.

## Что если assumptions нарушены

- Output/loss mismatch даёт неверную semantics или unstable math.
- Hidden state, dtype и shape mismatch могут не падать сразу, но обучать не ту задачу.
- Gradient accumulation без деления loss меняет effective step.
- `model.eval()` меняет Dropout/BatchNorm behavior, но не отключает gradients; `no_grad()` отключает graph, но не переключает mode.

## Связи

- [[Gradients Chain Rule and Optimization]] — mathematical owner gradient, Jacobian и Hessian.
- [[Likelihood MLE and MAP]] — cross-entropy как negative log-likelihood.
- [[Optimization and Regularization in Deep Learning]] — update, initialization, normalization и dropout.
- [[Embeddings and Attention]] — Linear projections создают Q/K/V.
- [[Deep Learning — Interview]] — короткий формат.
