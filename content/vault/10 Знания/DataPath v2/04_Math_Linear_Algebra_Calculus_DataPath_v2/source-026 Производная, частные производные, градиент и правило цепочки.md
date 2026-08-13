---
title: "Производная, частные производные, градиент и правило цепочки"
id: concept.datapath-v2.026
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 26
canonical_course: "Математика для ML"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Производная, частные производные, градиент и правило цепочки

Обучение модели — это оптимизация. Чтобы уменьшить loss, нужно знать, как она изменится при маленьком изменении параметров. Производная даёт локальную скорость изменения, градиент собирает частные производные по всем параметрам.

## Производная

\(f'(x)\) — локальный slope. Если positive, при небольшом увеличении x функция растёт; negative — уменьшается. Это локальная информация, не описание всей функции.

## Частная производная

Для \(f(x,y)\) производная по x меняет x, фиксируя y. У модели с миллионами weights есть частная производная loss по каждому weight.

## Градиент

\(\nabla f=[\partial f/\partial x_1,\dots]\). Он указывает направление наиболее быстрого локального роста. Поэтому gradient descent движется против него.

## Gradient descent

\(\theta_{new}=\theta-\eta\nabla L(\theta)\). Learning rate \(\eta\) управляет step. Большой step может перескочить минимум, маленький — медленно обучаться.

## Правило цепочки

Если \(L\) зависит от w через промежуточные вычисления, \(\frac{dL}{dw}=\frac{dL}{dz}\frac{dz}{dw}\). Backpropagation — эффективное многократное применение chain rule по computational graph.

## Jacobian/Hessian intuition

Jacobian собирает derivatives vector-valued function; Hessian — second derivatives scalar function. Для foundation достаточно понимать: Hessian описывает curvature и объясняет, почему разные directions optimization могут иметь разную сложность.

## Практический код

```python
# Численная проверка производной
def f(x):
    return (x - 3) ** 2

x = 0.0
eps = 1e-5

numeric_grad = (f(x + eps) - f(x - eps)) / (2 * eps)
analytic_grad = 2 * (x - 3)

print(numeric_grad, analytic_grad)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- думать, что gradient указывает к минимуму
- путать производную с конечной разницей без предела
- считать chain rule отдельной нейросетевой магией
- забывать роль learning rate
- думать, что нулевой gradient всегда глобальный минимум

## Проверка понимания

1. Что показывает derivative?
2. Что такое partial derivative?
3. Куда указывает gradient?
4. Почему descent идёт со знаком minus?
5. Что делает chain rule?
6. Что описывает curvature?

## Мини-практика

Для \(L(w)=(2w-10)^2\) вычислите derivative руками при w=3 и один шаг gradient descent с lr=0.01. Затем сравните с numerical gradient.

## Что нужно унести

Derivative — локальная чувствительность, gradient — vector sensitivities, chain rule связывает сложную computation. Это математический фундамент backprop и оптимизации.

## Куда дальше

Следующий блок — probability/statistics: как описывать неопределённость данных, выборок и экспериментов.
