---
title: "Оценка NLP-моделей и error analysis"
id: concept.datapath-v2.081
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 81
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Оценка NLP-моделей и error analysis

В NLP aggregate metric особенно легко скрывает настоящие проблемы.

Модель может иметь:

```text
macro F1 = 0.84
```

и при этом:
- почти не находить редкий intent;
- ошибаться на длинных сообщениях;
- ломаться на опечатках;
- путать два очень близких класса;
- использовать leakage template;
- работать хорошо только на одном source.

Поэтому evaluation NLP — это не одна цифра.

Нужны:

```text
metric
→ per-class analysis
→ confusion matrix
→ confidence
→ slices
→ ручное чтение ошибок
→ hypothesis
→ новый experiment
```

---

## 1. Сначала определить тип задачи

### Binary classification

Один positive/negative label.

### Multiclass

Ровно один class из C.

### Multi-label

Несколько labels одновременно.

### Token classification

Label для tokens/subtokens.

### Generation

Output sequence.

Метрики принципиально отличаются.

---

## 2. Accuracy — доля правильных ответов

Важно использовать корректную терминологию:

> **accuracy = доля правильных ответов.**

Не «точность».

Точность — **precision**.

При balanced easy multiclass accuracy может быть informative.

При imbalance:
```text
90% class A
10% class B
```
always-A получает 90% accuracy.

Нужны per-class metrics.

---

## 3. Precision, recall, F1

Для class:

\[
precision=\frac{TP}{TP+FP}
\]

— среди predicted class сколько correct.

\[
recall=\frac{TP}{TP+FN}
\]

— сколько real objects class model нашла.

\[
F1=
2\frac{precision\cdot recall}
{precision+recall}.
\]

---

## 4. Macro F1

Считаем F1 каждого class и усредняем одинаково:

\[
MacroF1=
\frac1C\sum_cF1_c.
\]

Rare class весит столько же, сколько common class.

Поэтому macro F1 полезна для imbalanced intent classification.

---

## 5. Weighted F1

Weights class metric по support.

Large classes доминируют.

Это может отражать average object performance, но hidden failure rare classes.

Поэтому полезно смотреть:

```text
macro + weighted + per-class
```

в зависимости от business task.

---

## 6. Micro F1

Суммирует TP/FP/FN across classes до расчёта metric.

В single-label multiclass micro F1 тесно связана с accuracy.

Особенно полезна в multilabel/token scenarios, но interpretation должна быть ясной.

---

## 7. Confusion matrix

Для 20 intents confusion matrix показывает:

> какие classes model путает друг с другом.

Например:

```text
"card blocked"
↔
"card not working"
```

Это намного полезнее, чем просто знать F1=0.82.

Confusion pair часто указывает:
- labels overlap;
- annotation ambiguity;
- need more data;
- merge/split taxonomy.

---

## 8. Normalized confusion matrix

Raw counts dominated common classes.

Можно normalize по true class:

```text
row sums = 1
```

и увидеть, куда уходит каждый class.

Или по predicted class — в зависимости от вопроса.

Всегда подписывать normalization.

---

## 9. Classification report

`classification_report` scikit-learn даёт:
- precision;
- recall;
- F1;
- support.

Это good first table, но не заменяет manual error examples.

---

## 10. Confidence

Для probabilistic model можно анализировать:

```text
high-confidence correct
low-confidence correct
high-confidence error
low-confidence error
```

Самые важные:
> высокоуверенные ошибки.

Они могут показывать:
- leakage-like shortcuts;
- ambiguous labels;
- distribution shift;
- calibration problem.

---

## 11. Calibration

Transformer logits/probabilities тоже могут быть miscalibrated.

Если probability используется:
- routing;
- abstention;
- human review;
- risk estimate,

нужно проверить calibration.

High softmax confidence не означает автоматически true probability.

---

## 12. Threshold binary/multilabel

Binary:
```text
p >= 0.5
```
не всегда optimal.

Multilabel:
каждый label может иметь свой threshold.

Threshold selection должен происходить на validation/OOF, не test.

---

## 13. Error slices by length

NLP-specific slice:

```text
0–20 tokens
21–100
101–512
truncated
```

Long texts могут degrade:
- truncation;
- attention difficulty;
- mixed intents.

Short texts:
```text
"не работает"
```
могут быть inherently ambiguous.

---

## 14. Slice by language

Multilingual corpus:

```text
ru F1=0.90
en F1=0.86
uz F1=0.51
```

Global F1 может скрыть poor minority-language performance.

---

## 15. Slice by source

Messages:
- mobile;
- call transcription;
- email;
- chatbot.

Different noise/length/style.

Source-specific error analysis часто reveals domain shift.

---

## 16. Slice by time

Text language changes:
- new product names;
- policy updates;
- seasonal topics;
- new templates.

Measure metric by month/week.

Text drift может возникать быстро.

---

## 17. Slice by class support

Plot:
```text
number of train examples
vs
per-class F1
```

Если rare classes systematically bad, options:
- more labels;
- taxonomy changes;
- class weighting;
- few-shot/pretraining benefits.

---

## 18. Duplicate-aware evaluation

Near duplicates validation могут inflate score.

Проверять:
- exact hash duplicates;
- normalized duplicates;
- template duplicates.

Это особенно важно для support/chat logs.

---

## 19. Annotation quality

Если humans themselves disagree between:
```text
"payment issue"
"card issue"
```
model upper bound limited.

Useful:
- inspect disagreement;
- inter-annotator agreement where available;
- clarify labeling guide.

Нельзя бесконечно tuning model против inconsistent labels.

---

## 20. Error taxonomy

Создайте categories ошибок:

```text
A. negation
B. typo/noise
C. rare term
D. long context
E. mixed intent
F. ambiguous label
G. truncation
H. template leakage
I. language mismatch
```

Для 100–200 sampled errors вручную отметить reason.

Это превращает error analysis в measurable process.

---

## 21. Compare models on same errors

TF-IDF error:
```text
synonym issue
```

BERT correct.

BERT error:
```text
long text truncated
```

TF-IDF correct because sees whole sparse document.

Так видно, что Transformer не universally dominates every example.

---

## 22. Paired comparison

Если two models evaluated on same validation objects, compare:
- both correct;
- A only;
- B only;
- both wrong.

Это лучше, чем только:
```text
0.842 vs 0.848
```

Можно понять complementarity и significance.

---

## 23. Bootstrap confidence intervals

Для metric uncertainty можно bootstrap validation samples и estimate confidence interval.

Это особенно useful, если score difference tiny.

Но sampling scheme должна уважать groups:
- conversation;
- user;
- document cluster.

Не bootstrap individual messages, если они dependent.

---

## 24. Token classification metrics

NER:
- token-level accuracy misleading;
- entity-level precision/recall/F1 часто важнее.

Например entity считается correct только при correct span/type according to evaluation scheme.

Subword pieces не должны artificial inflate metric.

---

## 25. Sequence generation

Metrics depend task.

Examples:
- BLEU;
- ROUGE;
- exact match;
- chrF;
- BERTScore;
- task-specific validators.

Ни одна автоматическая metric не universally captures quality generation.

Need human/task evaluation.

---

## 26. Toxicity / safety evaluation

Для high-stakes generative/classification tasks slice analysis especially important:
- demographic groups;
- languages;
- adversarial phrasing;
- jailbreak-like patterns.

Average quality insufficient.

---

## 27. Error analysis loop

Правильный цикл:

```text
metric
→ sample errors
→ taxonomy
→ hypothesis
→ change ONE thing
→ same validation
→ compare
```

Не:
```text
увидел ошибки
→ поменял tokenizer, model, labels, split и metric одновременно
```

---

## 28. Example

Intent classifier:

```text
Macro F1 = 0.79
```

Per-class:
```text
balance inquiry = 0.95
cash withdrawal = 0.91
card security = 0.44
fraud = 0.62
```

Read 100 errors:
```text
40% card security ↔ fraud ambiguity
25% very short messages
20% post-label template leakage
15% other
```

Next priority:
1. fix leakage;
2. clarify label taxonomy;
3. then model improvements.

Not bigger Transformer first.

---

## 29. Интерактивная визуализация DataPath

### Metric explorer

Same predictions, switch:
```text
accuracy
macro F1
weighted F1
```
Rare-class failure becomes visible.

### Confusion explorer

Click cell → actual mistaken texts.

### Error slices

Filters:
```text
length
language
source
class
month
```

### Paired model comparison

Venn-like:
```text
A only correct
B only correct
both
neither
```

---

## 30. Типичные ошибки

**«Высокая accuracy означает все classes хороши».**\
Нет.

**«Macro F1 и weighted F1 одинаковы».**\
Нет.

**«Confusion matrix нужна только presentation».**\
Это core diagnostic.

**«Softmax 0.99 = 99% true chance».**\
Не обязательно.

**«Long text performance можно не смотреть».**\
Truncation may dominate.

**«Если model ошибается, labels всегда правильны».**\
Нет.

**«0.3 F1 gain statistically meaningful».**\
Depends scale/variance.

---

## 31. Проверка понимания

1. Accuracy vs precision?
2. Macro vs weighted F1?
3. Для чего confusion matrix?
4. Почему high-confidence errors важны?
5. Как truncation обнаружить через slices?
6. Зачем time slices?
7. Что такое error taxonomy?
8. Как compare two models pairwise?
9. Почему entity-level metric важна NER?
10. Почему generation needs task/human evaluation?

---

## 32. Мини-практика

Validation:

```text
20 classes
overall accuracy=92%
macro F1=61%
```

Что это может означать?

Составьте plan:
1. per-class support;
2. normalized confusion;
3. 100 manual errors;
4. length/source/time slices;
5. duplicate audit;
6. threshold/calibration if relevant.

---

## Что нужно унести

1. NLP evaluation — system of metrics + slices + manual errors.
2. Accuracy может скрыть rare-class failure.
3. Macro F1 treats classes equally.
4. Confusion matrix reveals taxonomy problems.
5. Confidence must be calibrated if used as probability.
6. Length/language/source/time slices are essential NLP diagnostics.
7. Label ambiguity can limit model more than architecture.
8. Error taxonomy converts anecdotal failures into actionable hypotheses.
9. Compare models on same examples.
10. Test remains untouched after model selection.

## Куда дальше

Последний урок блока соберёт всё:

```text
raw text
→ leakage audit
→ TF-IDF baseline
→ Transformer
→ fair comparison
→ error analysis
→ production artifact
```

## Источники
- scikit-learn classification metrics.
- Standard NLP evaluation practices by task.
