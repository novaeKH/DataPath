---
title: "Метрики машинного обучения и выбор порога"
id: concept.datapath-v2.039
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 39
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Метрики машинного обучения и выбор порога

Модель может выдавать впечатляющее число и при этом быть бесполезной, если мы измеряем не то качество.

Метрика — формализованный ответ на вопрос:

> **Что именно мы считаем хорошим прогнозом?**

Нужно связывать:

```text
цена бизнес-ошибки
→ тип prediction
→ metric
→ threshold
→ действие
```

Сразу фиксируем терминологию DataPath:

> **accuracy — доля правильных ответов.**

Не называем accuracy «точностью», потому что **точность (precision)** — отдельная метрика.

## 1. Metric и loss — не одно и то же

Модель может:

```text
обучаться по logloss
```

но сравниваться:

```text
по Average Precision
```

а рабочий threshold выбираться:

```text
по стоимости FP/FN
```

Loss нужна алгоритму оптимизации. Metric нужна для оценки решения.

# Регрессия

## 2. MAE



\[
MAE=\frac1n\sum_i|y_i-\hat y_i|.
\]

Если `MAE = 5.2 минуты`, интерпретация проста: абсолютная ошибка в среднем около 5.2 минуты.

MAE меньше акцентирует единичные гигантские промахи, чем squared-error metrics.

## 3. MSE и RMSE

\[
MSE=\frac1n\sum_i(y_i-\hat y_i)^2.
\]

Крупные ошибки получают повышенный вес.

\[
RMSE=\sqrt{MSE}.
\]

RMSE возвращает результат в исходные единицы target.

Сравнение MAE/RMSE — это не конкурс «какая metric лучше». Нужно решить, насколько бизнесу важны большие промахи.

## 4. R²

\[
R^2=1-
\frac{\sum_i(y_i-\hat y_i)^2}
{\sum_i(y_i-\bar y)^2}.
\]

Интуитивно сравнивает squared error модели с baseline, который предсказывает среднее.

На test `R² < 0` возможен: модель оказалась хуже mean baseline. Это не ошибка API.

# Классификация

## 5. Confusion matrix

Для binary classification:

| Реальность | Prediction | Событие |
|---|---|---|
| 1 | 1 | TP |
| 0 | 1 | FP |
| 1 | 0 | FN |
| 0 | 0 | TN |

Антифрод:

- TP — fraud найден;
- FP — обычную транзакцию заблокировали;
- FN — fraud пропустили;
- TN — обычную транзакцию пропустили правильно.

Теперь metric можно связывать с реальными ошибками.

## 6. Доля правильных ответов (accuracy)

\[
accuracy=\frac{TP+TN}{TP+TN+FP+FN}.
\]

Она отвечает: какую долю объектов классифицировали верно?

Проблема дисбаланса:

```text
99 000 normal
1 000 fraud
```

Модель всегда говорит `normal`:

```text
accuracy = 99%
fraud recall = 0%
```

Поэтому 99% здесь почти ничего не доказывает.

## 7. Точность (precision)

\[
precision=\frac{TP}{TP+FP}.
\]

Вопрос:

> среди объектов, которые модель назвала positive, какая доля действительно positive?

Если на ручную проверку отправили 100 транзакций, из них 70 fraud:

```text
precision = 0.70
```

## 8. Полнота (recall)

\[
recall=\frac{TP}{TP+FN}.
\]

Вопрос:

> какую долю всех реальных positives мы нашли?

Из 100 fraud модель нашла 80:

```text
recall = 0.80
```

## 9. Threshold связывает precision и recall

Модель выдаёт scores/probabilities:

```text
0.91
0.74
0.63
0.52
0.31
0.12
```

При высоком threshold positives мало: обычно precision растёт, recall падает.

При низком threshold positives больше: recall растёт, precision может падать.

Это не дефект модели, а operating trade-off.

## 10. F1-мера

\[
F1=2\frac{precision\cdot recall}{precision+recall}.
\]

F1 агрегирует precision и recall гармоническим средним.

Она полезна, когда хочется балансировать их, но не обязана соответствовать бизнес-стоимости. Если FN в 20 раз дороже FP, максимальный F1 может быть не тем operating point.

## 11. Specificity

\[
specificity=\frac{TN}{TN+FP}.
\]

Показывает долю correctly rejected negatives. В диагностике часто обсуждается вместе с recall/sensitivity.

# Метрики без одного фиксированного threshold

## 12. ROC-AUC

ROC-кривая строится по разным thresholds:

```text
TPR = Recall
FPR = FP / (FP + TN)
```

ROC-AUC характеризует ranking ability: насколько positive objects обычно получают score выше negatives.

Это **не выбор рабочего threshold**.

## 13. Почему ROC-AUC бывает оптимистичной при сильном дисбалансе

Если negatives очень много, небольшой FPR может соответствовать тысячам FP.

```text
990 000 negatives
FPR = 1%
→ 9 900 FP
```

Поэтому при редком positive class полезно смотреть precision–recall representation.

## 14. Precision–Recall и Average Precision

PR-кривая показывает precision против recall при изменении threshold.

В scikit-learn часто используют:

```python
average_precision_score
```

Average Precision (AP) суммирует precision по приращениям recall.

Важно: AP и трапецеидальная площадь под PR points — не полностью одно и то же вычисление. Поэтому в проекте нужно фиксировать конкретную реализацию metric.

## 15. Базовый уровень AP

Для случайного ranking baseline AP связан с prevalence positive class.

Если positives около 2%, AP около 0.02 — естественный случайный ориентир.

Поэтому `AP = 0.20` может быть очень сильным результатом, хотя «20%» визуально кажется небольшим.

## 16. Ranking и calibration — разные свойства

Модель может правильно ранжировать:

```text
A > B > C
```

но выдавать слишком уверенные probability estimates:

```text
0.99, 0.98, 0.97
```

вместо условно реалистичных:

```text
0.30, 0.10, 0.03
```

ROC-AUC может оставаться высокой, а probability calibration — плохой. Позже это будет отдельный урок.

## 17. Threshold выбирается не на test

Правильная схема:

```text
train
→ fit

validation / OOF
→ threshold

test
→ финальная оценка
```

Перебирать thresholds по test — использовать test для model selection.

## 18. Threshold должен отражать действие

Churn model выдаёт risk score. Компания может обработать только 5% клиентов.

Вопрос:

> какой threshold выделяет top-5% и сколько churners там найдено?

Другой бизнес задаёт:

```text
Precision >= 70%
```

и максимизирует Recall при ограничении.

`0.5` не имеет сакрального смысла.

## 19. Macro, micro, weighted

В multiclass classification metric нужно агрегировать.

**Macro** — равный вес каждому классу.

**Weighted** — вес по размеру класса.

**Micro** — сначала глобально суммируются события, затем считается metric.

Выбор `average=` — часть определения задачи.

## 20. Код

```python
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)

proba = model.predict_proba(X_valid)[:, 1]
threshold = 0.30
pred = (proba >= threshold).astype(int)

print("accuracy:", accuracy_score(y_valid, pred))
print("precision:", precision_score(y_valid, pred))
print("recall:", recall_score(y_valid, pred))
print("f1:", f1_score(y_valid, pred))
print("ROC-AUC:", roc_auc_score(y_valid, proba))
print("AP:", average_precision_score(y_valid, proba))
```

Почему `[:, 1]`? `predict_proba` возвращает probability estimate для каждого класса. Для классов `[0,1]` второй столбец относится к `1`. Надёжно проверить:

```python
model.classes_
```

## 21. Как выбирать metric

Для регрессии спросить:

- важны ли крупные ошибки сильнее;
- нужны ли исходные единицы;
- есть ли heavy tails;
- одинакова ли цена ошибки по диапазону target.

Для классификации:

- какой class positive;
- насколько он редок;
- цена FP;
- цена FN;
- нужен ranking или hard decision;
- важна ли probability;
- есть ли capacity constraint.

## 22. Типичные ошибки

**Accuracy называют точностью.**\
В DataPath accuracy — доля правильных ответов, precision — точность.

**Смотреть только accuracy при 1% positives.**\
Можно ничего не находить и получить 99%.

**Выбирать threshold по test.**\
Test превращается в validation.

**ROC-AUC считать рабочей operating metric.**\
Она не даёт готовый threshold.

**Говорить PR-AUC без определения.**\
AP и trapezoidal AUC различаются.

**Судить о calibration по ROC-AUC.**\
Ranking и probability quality различны.

## 23. Проверка понимания

1. Почему accuracy может быть 99% у бесполезной fraud model?
2. Чем precision отличается от recall?
3. Что происходит при снижении threshold?
4. Когда F1 не соответствует бизнес-цели?
5. Что измеряет ROC-AUC на уровне ranking?
6. Почему PR representation полезна при редком positive class?
7. Чем AP отличается от простого трапецеидального AUC?
8. Почему threshold не выбирают на test?
9. Когда нужен macro F1?
10. Может ли ROC-AUC быть высокой при плохой calibration?

## 24. Мини-практика

Антифрод:

```text
100 000 транзакций
1 000 fraud
```

Threshold A:

```text
TP = 800
FP = 3 200
FN = 200
TN = 95 800
```

Threshold B:

```text
TP = 500
FP = 500
FN = 500
TN = 98 500
```

Посчитайте:

1. accuracy;
2. precision;
3. recall;
4. что лучше при лимите ручных проверок;
5. что лучше, если пропустить fraud очень дорого;
6. какой бизнес-параметр нужен для финального решения.

## Что нужно унести

1. Metric формализует смысл «хорошего прогноза».
2. Accuracy — доля правильных ответов, precision — точность.
3. Precision измеряет чистоту positive predictions.
4. Recall — найденную долю positives.
5. Threshold управляет precision/recall trade-off.
6. ROC-AUC и AP оценивают ranking без одного threshold.
7. При imbalance accuracy часто недостаточна.
8. Ranking и calibration различаются.
9. Threshold выбирают на validation/OOF.
10. Metric должна соответствовать downstream decision.

## Куда дальше

Теперь у нас есть:

```text
задача
→ честный split
→ metric
```

Можно перейти к первой полностью прозрачной модели — линейной регрессии.

### Источники

- scikit-learn User Guide — Metrics and scoring.
- Yandex ML Handbook — Метрики классификации и регрессии.
