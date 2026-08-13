---
title: "BERT и encoder Transformers — как работает контекстное представление текста"
id: concept.datapath-v2.080
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 80
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# BERT и encoder Transformers: как pretrained encoder превращает текст в контекстные признаки

TF-IDF знает:

```text
какие n-граммы встречаются
```

LSTM учит sequence representation.

BERT сделал следующий важный шаг:

> **сначала обучить глубокий bidirectional Transformer encoder на огромном неразмеченном corpus, а затем дообучать его для конкретных NLP-задач.**

BERT — не «нейросеть, которая понимает текст» в мистическом смысле.

Это stack Transformer encoder blocks, обученный через self-supervised objectives.

---

## 1. Encoder representation

Input:

```text
token IDs
attention mask
```

После embeddings:

```text
[B,L,d_model]
```

После каждого Transformer block representation каждого token становится contextual:

```text
token "bank"
```

может иметь разные hidden states в:

```text
river bank
bank account
```

потому что self-attention mixes surrounding context.

---

## 2. Bidirectional attention

BERT encoder token может смотреть:

```text
left context
+
right context
```

Это отлично для:
- classification;
- NER;
- extractive QA.

Но architecture не является causal generator по default, потому что token sees future context.

---

## 3. Почему нельзя просто train next-token bidirectionally

Если token видит future token, next-token prediction becomes trivial leakage.

Поэтому original BERT использовал **Masked Language Modeling (MLM)**.

Некоторые input tokens скрываются/заменяются, и model predicts original token using both left/right context.

---

## 4. MLM intuition

Original:

```text
Париж — столица Франции
```

Masked:

```text
Париж — [MASK] Франции
```

Model должна predict:

```text
столица
```

Так encoder учится contextual representations без human labels.

---

## 5. Original BERT masking nuance

В original BERT paper selected positions составляли 15% tokens, а дальше использовалась смесь:
- `[MASK]`;
- random token;
- unchanged token.

Цель — уменьшить discrepancy, потому что `[MASK]` не появляется в downstream text.

Для practical fine-tuning не обязательно воспроизводить MLM procedure, если берём готовый checkpoint.

---

## 6. Next Sentence Prediction

Original BERT также использовал Next Sentence Prediction (NSP).

Но later encoder architectures часто изменяли/убирали этот objective.

Поэтому:

> NSP — часть original BERT recipe, не обязательное свойство любого encoder Transformer.

---

## 7. `[CLS]` representation

Original BERT вставляет special `[CLS]` token в начало.

Final hidden state `[CLS]` часто используется как aggregate representation для classification head.

```text
[CLS] text [SEP]
↓
BERT
↓
h_CLS
↓
Linear
↓
class logits
```

Но alternatives:
- mean pooling hidden states;
- task-specific pooling.

---

## 8. Sequence classification head

Hugging Face class:

```python
AutoModelForSequenceClassification
```

обычно добавляет task-specific classification head поверх pretrained backbone.

Пример:

```python
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
)

tokenizer = AutoTokenizer.from_pretrained(model_name)

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=5,
)
```

---

## 9. Forward batch

```python
batch = tokenizer(
    texts,
    padding=True,
    truncation=True,
    return_tensors="pt",
)

outputs = model(
    **batch,
    labels=labels,
)
```

Обычно outputs содержат:
- `loss`, если labels переданы;
- `logits`.

Exact structure зависит model class.

---

## 10. Fine-tuning

Все pretrained weights можно update маленьким learning rate.

Typical orders magnitude often much smaller than randomly initialized MLP head, например:

```text
1e-5 ... 5e-5
```

для BERT-like fine-tuning historically common, но это не universal law.

Validation decides.

---

## 11. Why low learning rate

Pretrained network already has useful representations.

Huge update:

```text
может быстро разрушить pretrained solution
```

Fine-tuning asks:
> slightly adapt large pretrained function to downstream objective.

---

## 12. AdamW

Transformer fine-tuning commonly uses AdamW.

Need:
- weight decay;
- LR schedule;
- sometimes warmup.

Но не нужно blindly copy:
```text
lr=2e-5
warmup=10%
epochs=3
```
как immutable formula.

Dataset/model size differ.

---

## 13. Max length

BERT-like models often have configured maximum positions, historically 512 for original BERT.

Но modern checkpoints vary.

Always check tokenizer/model config.

Long docs require:
- truncation strategy;
- chunking;
- hierarchical aggregation;
- long-context encoder.

---

## 14. Token classification

NER:

```text
token hidden state
→ Linear to entity labels
```

Output:

```text
[B,L,C]
```

Loss counted on labelled real subtokens, ignoring padding/special subtokens.

Subword alignment becomes critical.

---

## 15. Extractive question answering

Model predicts:
- start position;
- end position

inside context tokens.

Tokenizer offset mapping is needed to convert predicted token spans back to original text.

---

## 16. Sentence embeddings

Raw BERT `[CLS]` hidden state is not automatically optimal sentence embedding for semantic similarity.

Special models like Sentence-BERT are trained with objectives better suited for sentence-level embedding similarity/retrieval.

Important distinction:

> contextual encoder output can be pooled, but good retrieval embedding needs appropriate training objective.

---

## 17. BERT vs GPT

### BERT-like

```text
encoder
bidirectional
MLM-style pretraining
understanding/representation tasks
```

### GPT-like

```text
decoder-only
causal attention
next-token prediction
generation
```

Modern boundaries broader, but architectural distinction remains useful.

---

## 18. RoBERTa-like improvements

RoBERTa showed that training recipe matters:
- more data;
- longer training;
- dynamic masking;
- removed NSP;
- larger batches, etc.

Lesson:

> architecture alone does not explain pretrained model quality.

Data/objective/training recipe matter enormously.

---

## 19. Multilingual BERT

Multilingual model shares vocabulary/parameters across languages.

Pros:
- one checkpoint;
- cross-lingual transfer.

Cons:
- finite capacity/vocabulary shared;
- language-specific model may tokenize language more efficiently.

For Russian tasks compare multilingual and Russian-specific checkpoints if resources permit.

---

## 20. Domain-specific pretraining

Financial/medical/legal text differs from general web/books.

A domain-adapted encoder can improve:
- terminology;
- style;
- rare concepts.

But benchmark claims require fair same split and baseline.

---

## 21. Freezing encoder

For small dataset:
```text
freeze BERT
→ train head
```

может be stable/cheap.

Then:
```text
unfreeze upper layers
```

or full fine-tune.

Often full fine-tuning gives better quality if data/resources enough.

---

## 22. PEFT

Large encoder/LLM can use adapters/LoRA-like methods.

For BERT-sized models full fine-tuning may still be affordable, but PEFT useful:
- many tasks;
- limited memory;
- storing small task adapters.

---

## 23. Imbalanced labels

Pretrained Transformer does not solve class imbalance.

Need:
- macro F1;
- per-class recall;
- weighted loss if justified;
- sampling/threshold where appropriate.

---

## 24. Overfitting small text dataset

Transformer has millions parameters.

Symptoms:
```text
train loss ↓ fast
validation metric peaks then drops
```

Use:
- early stopping;
- lower lr;
- weight decay;
- freeze layers;
- data augmentation carefully;
- better labels.

---

## 25. Data augmentation text tricky

Image flip often preserves label.

Text transform:
- synonym replacement;
- translation;
- deletion

may alter semantics.

LLM-generated augmentation can introduce label artifacts.

Use only with validation and source tracking.

---

## 26. Gradient accumulation / mixed precision

Transformer memory can limit batch size.

Use:
```text
gradient accumulation
mixed precision
```

to fit model.

But effective batch size changes optimizer behavior.

---

## 27. Evaluation latency

TF-IDF + LinearSVC:
```text
very fast
```

BERT:
```text
tokenization + dozens layers
```

If production SLA strict, 1–2 F1 points may not justify latency.

Model selection includes engineering.

---

## 28. Error analysis by length

Transformer truncation means quality can degrade specifically on long documents.

Always segment:
```text
short
medium
long/truncated
```

Also:
- language;
- class;
- source;
- rare labels.

---

## 29. Attention as interpretation caveat

Можно visualize BERT attention maps, но:
> attention weight не автоматически faithful explanation prediction.

Use model interpretation carefully and compare token attribution methods if needed.

---

## 30. Интерактивная визуализация DataPath

### Contextual word

Two sentences with `bank`.
Show same initial token embedding conceptually, different final contextual states.

### MLM

Mask token and show candidate probabilities.

### Fine-tuning

Pretrained encoder layers + new classifier head; freeze/unfreeze controls.

### Truncation

Long text, selected target phrase after position 512 gets dropped → model cannot use it.

---

## 31. Типичные ошибки

**«BERT — decoder language model».**\
Original BERT is Transformer encoder.

**«BERT uses causal mask».**\
Not standard bidirectional encoder self-attention.

**«NSP обязателен всем BERT-like models».**\
Нет.

**«`[CLS]` всегда лучший sentence embedding».**\
Нет.

**«Transformer автоматически решает long documents».**\
Нет.

**«Pretrained model отменяет baseline».**\
Нет.

**«Fine-tuning lr можно брать один универсальный».**\
Нет.

---

## 32. Проверка понимания

1. Почему BERT contextual?
2. Зачем MLM?
3. Bidirectional vs causal?
4. Что делает `[CLS]`?
5. Sequence vs token classification?
6. Почему sentence retrieval требует suitable objective?
7. BERT vs GPT architecture?
8. Почему tokenizer/max length important?
9. Почему small lr common fine-tuning?
10. Почему Transformer может overfit small dataset?

---

## 33. Мини-практика

Dataset:
```text
12k Russian support tickets
30 intents
median=60 tokens
p99=700
```

План:
1. choose checkpoint;
2. inspect tokenization Russian/domain;
3. max length strategy;
4. frozen vs fine-tune;
5. macro F1;
6. long-text error segment;
7. compare TF-IDF baseline;
8. latency benchmark.

---

## Что нужно унести

1. BERT — pretrained bidirectional Transformer encoder.
2. Contextual hidden states depend on surrounding tokens.
3. MLM enabled bidirectional self-supervised pretraining.
4. NSP was original recipe, not universal.
5. `[CLS]` often used classification representation.
6. Fine-tuning updates pretrained weights for downstream task.
7. Tokenizer/max length are part of model contract.
8. BERT-like encoder differs from causal GPT-like decoder.
9. Pretrained quality depends on data/objective/training recipe.
10. Strong TF-IDF baseline remains necessary.

## Куда дальше

Теперь у нас есть models.

Следующий вопрос важнее leaderboard:

> **как честно оценить NLP system и понять, где именно она ошибается?**

## Источники
- Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding".
- Hugging Face sequence classification/token classification documentation.
