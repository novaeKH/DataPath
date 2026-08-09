---
title: Feature Importance and Model Interpretation
id: concept.ml.feature-importance-interpretation
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
- Интерпретация моделей
- Feature importance
tags:
- ml/interpretability
math_depth: 1
---

# Feature Importance and Model Interpretation

## Какой вопрос задаём

«Важность» может означать:

- на что опирается model;
- что улучшает validation prediction;
- как изменится prediction при изменении feature;
- какой feature causal влияет на outcome;
- что важно бизнесу.

Это разные вопросы. Model interpretation не доказывает причинность.

## Coefficients

В linear model coefficient описывает conditional change score/prediction при фиксированных остальных features. Scale, transformations, collinearity и regularization меняют magnitude.

## Impurity importance

Tree importance суммирует decrease impurity. Смещена к continuous/high-cardinality features и делится между correlated features.

## Permutation importance

Перемешиваем feature на validation и измеряем падение metric. Это отвечает, насколько fitted model использует информацию feature в присутствии остальных.

При correlated features падение может быть малым, потому что информация дублируется.

## PDP и ICE

Partial dependence усредняет prediction при искусственном изменении feature. ICE показывает individual curves.

Проблема: создаются комбинации features, которых нет в данных. Correlation делает интерпретацию опасной.

## SHAP

SHAP распределяет разницу prediction относительно baseline между features согласно выбранной background distribution и assumptions. Это локальная decomposition model output, не causal attribution.

## Error analysis важнее красивой диаграммы

Проверяйте:

- сегменты ошибок;
- time stability;
- missing/unknown behavior;
- counterfactual sanity;
- sensitive/proxy features;
- leakage;
- consistency с domain knowledge.

## Числовой пример permutation importance

Пусть validation ROC-AUC модели равен 0.82. После случайного перемешивания `income` ROC-AUC падает до 0.74, а после перемешивания `age` — до 0.815.

В этом fitted model и на этой validation sample `income` содержит больше уникальной predictive information. Но вывод не означает, что доход причинно влияет на target. Если `income` сильно коррелирует с `occupation`, перемешивание одного признака может недооценить общую роль их группы.

## Локальная и глобальная интерпретация

Глобальный вопрос: какие patterns модель использует на dataset в среднем?

Локальный вопрос: какие inputs связаны с конкретным prediction?

Permutation importance и PDP чаще используются глобально. SHAP может давать local decomposition, а затем агрегироваться. Для единичного решения полезно показывать не только contributions, но и исходные values, baseline и ограничения метода.

## Практический порядок анализа

1. Проверить leakage и корректность validation.
2. Изучить ошибки и сегменты.
3. Сравнить минимум два interpretation methods.
4. Проверить correlated features группами.
5. Посмотреть stability между folds и временем.
6. Обсудить выводы с domain expert.
7. Для causal вопроса использовать отдельный causal design или experiment.

## Counterfactual sanity check

Измените один feature в допустимом диапазоне и посмотрите, ведёт ли себя prediction разумно. Например, если увеличение просрочки с 0 до 90 дней снижает predicted risk, это повод проверить encoding, interactions, leakage и support. Такой check не доказывает причинность, но помогает находить нелогичное поведение.

## Мини-проверка

Tree impurity importance ставит `customer_id` на первое место. Это не повод рассказывать бизнесу, что ID важен. Сначала проверьте high cardinality, leakage, случайность split и permutation importance на future validation.

## Визуализация

Компонент `interpretation-methods-lab`:

- correlated features;
- impurity vs permutation;
- PDP/ICE;
- local contribution;
- causal warning;
- model changes after removing feature.

## Частые ошибки

- importance = реальная важность;
- SHAP = причинность;
- permutation на train;
- сравнивать coefficients без scaling;
- игнорировать correlated features;
- строить PDP вне support;
- удалять feature только по одной importance method.

## Связи

- [[Decision Trees]]
- [[Linear Regression]]
- [[EDA Relationships Time and Groups]]

## Код: permutation importance на holdout

```python
from sklearn.inspection import permutation_importance

result = permutation_importance(
    model, X_valid, y_valid,
    scoring="average_precision",
    n_repeats=15,
    random_state=42,
)
importance = sorted(
    zip(X_valid.columns, result.importances_mean),
    key=lambda item: -item[1],
)
```

Перемешивание делается на validation: падение metric оценивает полезность для
generalization. Коррелированные features могут делить importance между собой.
