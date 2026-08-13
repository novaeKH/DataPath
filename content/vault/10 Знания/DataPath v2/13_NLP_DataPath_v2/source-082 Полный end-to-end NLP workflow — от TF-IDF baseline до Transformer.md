---
title: "Полный end-to-end NLP workflow — от TF-IDF baseline до Transformer"
id: concept.datapath-v2.082
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 82
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Полный end-to-end NLP workflow

Представим задачу:

> автоматически классифицировать обращения клиентов банка по 30 темам.

Есть:
```text
150 000 сообщений
client_id
conversation_id
timestamp
text
target_intent
```

Нужно построить не просто model, а **NLP-систему**, которую можно честно оценить и потом использовать.

Этот урок объединяет весь блок в один workflow.

---

# Фаза 1. Постановка задачи

## 1. Что именно предсказываем

Нужно определить:
- один intent или несколько;
- момент prediction;
- whole conversation или one message;
- можно ли использовать previous messages;
- кто потребляет prediction;
- цена ошибки.

Например:

> После первого сообщения клиента определить один primary intent для маршрутизации обращения.

Теперь later operator replies использовать нельзя.

---

## 2. Unit of observation

Если target — conversation intent, dataset row message-level неудобна.

Варианты:
```text
first user message
all user messages before routing
conversation concatenation
```

Но split обязательно group by `conversation_id`/client where needed.

---

# Фаза 2. Audit

## 3. Прочитать реальные тексты

Не начинать с tokenizer.

Сначала:
```text
50 random messages
20 per rare class
20 longest
20 shortest
20 duplicates
```

Нужно понять language/domain.

---

## 4. Leakage

Искать:
- operator category tags;
- post-routing replies;
- labels inside text;
- system messages;
- templates;
- future conversation parts.

Text leakage часто сильнее structured leakage.

---

## 5. Duplicates

Exact/near duplicate templates:
```text
"Карта не работает, ошибка 105"
```
могут массово repeat.

Если random split, copies leak.

Group/template-aware split may be needed.

---

# Фаза 3. Split

## 6. Выбрать validation scheme

Если production future:
```text
train: Jan–Apr
validation: May
test: June
```

Если same clients repeat, possible group-time compromise.

Главный вопрос:
> какую generalization мы хотим измерить?

---

# Фаза 4. Baseline

## 7. Dummy baseline

Most frequent class.

Если largest class 25%:
```text
accuracy baseline=25%
```

Но для 30 imbalanced classes primary metric:
```text
macro F1
```
может быть more useful.

---

## 8. TF-IDF baseline

Начать:

```text
word 1–2 grams
→ Logistic Regression / LinearSVC
```

Затем:
```text
char 3–5 grams
```

Очень часто это даст surprisingly strong result.

---

## 9. Почему baseline обязателен

Если Transformer:
```text
macro F1 0.86
```
а TF-IDF:
```text
0.85
```
при latency 50x lower, production choice неочевиден.

Без baseline не знаем value deep model.

---

# Фаза 5. Baseline error analysis

## 10. Top coefficients

Проверить:
```text
most positive terms per class
```

Искать:
- reasonable language;
- leaked labels;
- templates;
- IDs.

---

## 11. Confusions

Если:
```text
fraud ↔ card_security
```
путаются постоянно, возможно taxonomy overlap.

Это может быть label problem, не model problem.

---

# Фаза 6. Transformer candidate

## 12. Выбрать checkpoint

Criteria:
- target language;
- domain;
- model size;
- license/use constraints;
- tokenizer efficiency;
- max sequence length;
- latency/memory.

Не выбирать model только по популярности.

---

## 13. Tokenization audit

Собрать:
```text
token length p50/p95/p99
fraction truncated
tokens per word
domain terms fragmentation
```

Это влияет на max_length и compute.

---

## 14. Training configuration

Пример:
```text
batch size
learning rate
weight decay
epochs
warmup
max_length
seed
```

Все fixed in config/log.

---

## 15. Fine-tuning

Pipeline:
```text
tokenizer
→ dynamic padding
→ pretrained encoder
→ classification head
→ CrossEntropyLoss
→ AdamW
```

Validation after epochs/steps.

Save best checkpoint.

---

# Фаза 7. Fair comparison

## 16. Same split, same metric

TF-IDF и Transformer:
- same train;
- same validation;
- same label mapping;
- same primary metric.

Иначе comparison meaningless.

---

## 17. More than score

Compare:

| Model | Macro F1 | p95 latency | Size | Train time |
|---|---:|---:|---:|---:|
| TF-IDF + LinearSVC | .84 | 3 ms | 80 MB | 2 min |
| Transformer small | .87 | 18 ms | 250 MB | 40 min |
| Transformer large | .875 | 70 ms | 1.2 GB | 3 h |

Winner depends requirements.

---

# Фаза 8. Error analysis

## 18. Same error set

Create table:

```text
text
true
tfidf_pred
bert_pred
tfidf_score
bert_score
length
source
```

Then categories:
- lexical synonym;
- long context;
- typo;
- ambiguity;
- rare class;
- truncation.

---

## 19. Where Transformer adds value

Example:
```text
"Деньги ушли, но получатель говорит, что ничего нет"
```

TF-IDF may lack exact n-grams.

Transformer may connect contextual semantics.

But if all intents use fixed templates, TF-IDF may already saturate task.

---

# Фаза 9. Threshold / abstention

## 20. Human review

System can choose:
```text
high confidence → auto-route
low confidence → human
```

But confidence must be validated/calibrated.

Metric:
```text
coverage vs accuracy/F1
```

At 70% coverage maybe auto-route precision extremely high.

This can be more useful than forcing model answer every message.

---

## 21. Unknown intent

Production may contain messages outside 30 known classes.

Closed-set classifier still chooses one known class.

Need possible:
- confidence rejection;
- OOD detection;
- `other` class;
- human fallback.

Important system concern not captured by validation with only known intents.

---

# Фаза 10. Final test

## 22. Freeze model selection

Before test fix:
```text
model
checkpoint
tokenizer
max_length
label mapping
threshold
preprocessing
metric code
```

Then one final evaluation.

---

## 23. Test slices

Report:
- macro F1;
- per-class F1;
- confusion;
- length;
- time;
- source;
- latency.

A single headline score insufficient.

---

# Фаза 11. Artifact

## 24. TF-IDF artifact

Save:
```text
normalizer
vectorizer
classifier
label encoder
threshold
```

Ideally as Pipeline + metadata.

---

## 25. Transformer artifact

Need:
```text
model checkpoint
tokenizer files/version
label mapping
max length
preprocessing contract
config
threshold
```

Tokenizer is part of model artifact.

---

# Фаза 12. Inference

## 26. Input contract

```json
{
  "text": "Не могу оплатить картой"
}
```

Validation:
- not null;
- max raw size;
- encoding valid;
- language policy.

Output:
```json
{
  "intent": "card_payment_issue",
  "score": 0.91,
  "model_version": "..."
}
```

If score not calibrated probability, call it `score`, not `probability`.

---

## 27. Batch inference

For offline routing millions messages:
```text
batch tokenization
batch model inference
```
much more efficient than one request at a time.

For online:
latency/throughput trade-off.

---

# Фаза 13. Monitoring

## 28. Input drift

Monitor:
- text length;
- language share;
- token length;
- unknown/unusual tokenization;
- class prediction distribution;
- confidence distribution;
- source mix.

---

## 29. Label drift

New products create new intents.

Prediction distribution change could mean:
- real business change;
- model drift;
- upstream template change.

Need delayed ground truth where possible.

---

## 30. Error review loop

Periodically sample:
```text
high-confidence errors
low-confidence routed human
new phrases
new products
```

Update taxonomy/data before blindly retraining.

---

# Фаза 14. Re-training

## 31. Dataset versioning

Need record:
```text
data cutoff
label schema version
dedup rules
split dates
preprocessing version
```

Otherwise cannot explain why new model changed.

---

## 32. Challenger vs current

New model should compare on same test/recent evaluation:
```text
quality
latency
size
failure slices
```

Deploy only if improvement meaningful.

---

# Полный пример проекта

## 33. Banking intents

### Step 1
Read 100 messages manually.

### Step 2
Remove post-routing system replies.

### Step 3
Group/time split.

### Step 4
TF-IDF word+char + LinearSVC.

Result:
```text
macro F1 = 0.81
```

### Step 5
Error analysis:
```text
rare intents
semantic paraphrases
long mixed messages
```

### Step 6
Russian pretrained encoder fine-tune.

Result:
```text
macro F1 = 0.86
```

### Step 7
Latency:
```text
TF-IDF = 2 ms
Transformer = 22 ms
```

SLA:
```text
<30 ms
```

Transformer still feasible.

### Step 8
Confidence fallback:
```text
top score < threshold
→ human review
```

### Step 9
Final test + slice report.

That is complete NLP solution.

---

## 34. What interviewer wants to hear

Not:
> «Я использовал BERT.»

Better:

> «Сначала построил word/char TF-IDF + LinearSVC baseline на group-time split и получил macro F1 0.81. По error analysis увидел, что baseline плохо обрабатывает paraphrases и mixed-context messages. Fine-tuned Russian encoder on same split, получил 0.86, отдельно проверил rare classes, long texts and latency. Final model fit SLA, tokenizer/checkpoint and label mapping saved as artifact.»

Это показывает:
- methodology;
- baseline;
- validation;
- model understanding;
- error analysis;
- engineering awareness.

---

## 35. Интерактивная capstone-сцена DataPath

Пользователь получает corpus и должен:

```text
1. найти leakage
2. выбрать split
3. выбрать primary metric
4. собрать TF-IDF baseline
5. посмотреть confusions
6. решить, нужен ли Transformer
7. выбрать max_length
8. compare score/latency
9. set human fallback
10. freeze final test
```

Неверное действие показывает consequence, а не просто красный ответ.

Например:

```text
fit vectorizer on full corpus
→ validation vocabulary leaked
```

или:

```text
random split conversations
→ duplicates inflate score
```

---

## 36. Типичные ошибки

**«Начинать NLP надо с BERT».**\
Нет, сначала task/data/baseline.

**«TF-IDF baseline слишком простой, можно пропустить».**\
Нет.

**«Same accuracy достаточно fair comparison».**\
Need same split/metric and constraints.

**«Transformer score выше → production winner».**\
Latency/size may matter.

**«Tokenizer не нужно сохранять».**\
Нужно.

**«Confidence всегда probability».**\
Нет.

**«Closed-set classifier понимает unknown intents».**\
Нет.

**«Monitoring NLP = только server latency».**\
Нужно monitor data/prediction drift.

---

## 37. Проверка понимания

1. Почему first step не tokenizer?
2. Что даёт TF-IDF baseline?
3. Почему same split critical?
4. Что смотреть в tokenization audit?
5. Когда Transformer justified?
6. Зачем paired error analysis?
7. Что такое abstention?
8. Почему unknown intent problem separate?
9. Что входит Transformer artifact?
10. Какие NLP drift signals monitor?

---

## 38. Capstone-практика

Составьте проект для:

```text
500k support tickets
40 intents
Russian + English
p99 length=900 tokens
some clients have many tickets
monthly product changes
online SLA 25 ms
```

Нужно решить:
1. unit;
2. split;
3. baseline;
4. language strategy;
5. metrics;
6. tokenizer/max length;
7. candidate Transformer;
8. latency benchmark;
9. error slices;
10. fallback;
11. artifact;
12. monitoring/retraining.

---

## Итог блока NLP

Теперь полный путь:

```text
raw text
→ minimal justified preprocessing
→ TF-IDF
→ Logistic / LinearSVC / NB
→ strong sparse baseline
→ subword tokenizer
→ embeddings / neural models
→ BERT-like encoder
→ fine-tuning
→ metrics
→ error analysis
→ production-ready NLP workflow
```

Главный принцип:

> **Transformer — не замена хорошей постановке задачи, clean split, strong baseline и error analysis.**

## Куда дальше

Следующий крупный блок DataPath логично посвятить **LLM и RAG**:

- language modeling;
- autoregressive generation;
- decoding;
- prompt/context;
- embeddings and retrieval;
- chunking;
- vector search;
- reranking;
- RAG;
- evaluation;
- agents.

## Источники
- scikit-learn text extraction/classification/metrics.
- Hugging Face tokenization and sequence-classification documentation.
- Original BERT paper.
- Previous canonical DataPath lessons 75–81.
