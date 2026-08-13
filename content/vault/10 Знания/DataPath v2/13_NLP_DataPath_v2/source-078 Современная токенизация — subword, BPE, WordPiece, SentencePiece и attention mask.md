---
title: "Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask"
id: concept.datapath-v2.078
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 78
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Современная токенизация: как текст превращается в token IDs

Pretrained Transformer не принимает raw string напрямую.

Перед моделью стоит tokenizer:

```text
raw text
→ normalization / pre-tokenization
→ subword segmentation
→ token IDs
→ special tokens
→ padding/truncation
→ attention mask
```

Токенизация — не техническая мелочь.

Она определяет:

- vocabulary;
- длину sequence;
- какие слова делятся на pieces;
- какие IDs соответствуют model embeddings;
- сколько памяти нужно attention.

---

## 1. Почему word-level vocabulary неудобен

Если vocabulary хранит только целые слова, появляются проблемы.

### Огромный словарь

Русский язык:

```text
оплата
оплаты
оплате
оплатой
оплатами
...
```

### Unknown words

Новые names, typos, rare terms.

### Domain shift

```text
LLM
FinOps
chargeback
```

могли отсутствовать при training vocabulary.

---

## 2. Character-level другая крайность

Можно сделать каждый character token.

Плюсы:

- почти нет unknown;
- маленький vocabulary.

Минусы:

- sequences намного длиннее;
- semantic units разбиты слишком мелко;
- attention cost растёт.

Subword tokenization ищет компромисс между words и characters.

---

## 3. Subword idea

Frequent word:

```text
"привет"
```

может быть одним token.

Rare word:

```text
"предобученный"
```

разбивается:

```text
"пред"
"обуч"
"енный"
```

или другими pieces — зависит tokenizer.

Таким образом vocabulary ограничен, но rare words всё равно representable через parts.

---

## 4. BPE intuition

**Byte Pair Encoding (BPE)** исторически начинает с мелких symbols и многократно объединяет часто встречающиеся neighboring pairs.

Toy corpus:

```text
low
lower
newest
widest
```

Сначала symbols characters.

Если pair:

```text
l + o
```

часто встречается, создаётся новый symbol `lo`.

Затем могут объединиться:

```text
lo + w → low
```

Процесс повторяется до target vocabulary size / merge budget.

---

## 5. Что BPE реально обучает

Tokenizer training создаёт:

- initial symbols;
- merge rules;
- vocabulary.

Это **не neural network**.

После training segmentation deterministic по learned tokenizer rules.

---

## 6. WordPiece

WordPiece также строит subword vocabulary, но selection pieces conceptually основан не на exact same BPE frequency merge criterion.

BERT family historically использует WordPiece-like tokenization.

Важно не превращать comparison в false statement:

> BPE, WordPiece и SentencePiece — одно и то же.

У них схожая цель subword representation, но training/segmentation algorithms отличаются.

---

## 7. SentencePiece

SentencePiece работает непосредственно с raw text как sequence Unicode characters и не требует предварительной whitespace tokenization как обязательной external step.

Популярные algorithms:

- unigram language model;
- BPE.

Это toolkit/framework для subword tokenization, а не один единственный algorithm.

---

## 8. Byte-level tokenization

Некоторые GPT-like tokenizers используют byte-level foundation.

Плюс:

> любой UTF-8 text можно представить без traditional unknown character problem.

Но human-readable word может разбиваться на surprising tokens.

Нельзя судить tokenizer quality только по тому, «красиво ли» pieces выглядят человеку.

---

## 9. Vocabulary

Tokenizer имеет mapping:

```text
token string ↔ token ID
```

Например:

```text
"[CLS]" → 101
"банк"  → 4821
"##ами" → 7332
```

Exact IDs model-specific.

Embedding table pretrained model соответствует **этому mapping**.

Поэтому tokenizer нельзя менять независимо от checkpoint.

---

## 10. Token IDs не имеют ordinal meaning

ID:

```text
100
```

не «ближе» к 101, чем к 500.

Это просто index embedding table.

Model получает semantics через:

```text
embedding[token_id]
```

---

## 11. Special tokens

Разные model families используют специальные tokens.

Примеры concepts:

```text
beginning/end
classification token
separator
padding
mask token
```

BERT-like model может использовать `[CLS]`, `[SEP]`, `[MASK]`.

GPT-like tokenizer использует другие tokens.

Нельзя переносить special-token scheme одной model в другую вручную.

---

## 12. Pair input

Задача:

```text
premise + hypothesis
question + context
```

Tokenizer может кодировать pair с separators и segment information, если architecture это поддерживает.

Например BERT historically использовал token type IDs для sentence A/B distinction.

Но не все Transformer models используют `token_type_ids`.

Нужно следовать tokenizer/model contract.

---

## 13. Padding

Batch sequences:

```text
len 5
len 8
len 3
```

Tensor должен быть rectangular.

Padding до common length:

```text
5 → 8
8 → 8
3 → 8
```

Padding token получает special ID.

Но model не должна воспринимать padding как real content.

---

## 14. Attention mask

Типичный `attention_mask`:

```text
1 → real token
0 → padding
```

Например:

```text
input_ids:
[101, 42, 91, 102, 0, 0]

attention_mask:
[1,   1,  1,   1, 0, 0]
```

Exact internal mask semantics can differ between low-level APIs, но Hugging Face tokenizer commonly returns 1 for tokens to attend and 0 for padding.

---

## 15. Padding strategy

Common choices:

### `padding=True` / longest

Pad до longest sequence текущего batch.

### `padding="max_length"`

Pad до configured max length.

Dynamic longest padding часто экономит compute, потому что batches разной длины не всегда pad до global maximum.

---

## 16. Truncation

Model имеет maximum supported/used sequence length.

Если document длиннее:

```text
truncate
```

Но это может удалить critical information.

Параметр:

```python
truncation=True
```

не решает semantic проблему выбора части document.

---

## 17. Где обрезать

В pair tasks strategies могут отличаться:

- longest-first;
- only-first;
- only-second.

Например question/context:

```text
question короткий
context длинный
```

часто логичнее обрезать context, а не question.

---

## 18. Long documents

Document 20 000 tokens, model max 512.

Варианты:

```text
first 512
last 512
head+tail
sliding windows
hierarchical model
long-context model
retrieval/chunk selection
```

Правильный approach зависит task.

Не надо silently truncate и считать задачу решённой.

---

## 19. Sequence length влияет на compute

Standard attention:

\[
O(L^2).
\]

Увеличить length:

```text
512 → 1024
```

attention score elements растут примерно в 4 раза.

Поэтому tokenizer statistics directly influence GPU memory/training speed.

---

## 20. Unknown token

Некоторые tokenizer families имеют `<unk>` / `[UNK]`.

Другие byte-level schemes способны represent arbitrary bytes без conventional unknown.

Нужно знать concrete tokenizer behavior.

---

## 21. Hugging Face AutoTokenizer

Typical:

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(
    model_name
)

batch = tokenizer(
    texts,
    padding=True,
    truncation=True,
    return_tensors="pt",
)
```

`batch` может содержать:

```text
input_ids
attention_mask
token_type_ids  # only if relevant
```

---

## 22. Посмотреть tokenization руками

Очень полезно:

```python
tokens = tokenizer.tokenize(
    "Предобученная модель работает"
)

ids = tokenizer.convert_tokens_to_ids(tokens)
```

Так можно увидеть:

- fragmentation Russian words;
- domain terms;
- typos;
- numbers.

---

## 23. Tokenizer fertility

Можно измерить:

```text
tokens per word
```

Если language/domain сильно fragmented, sequence становится длиннее и representation может быть менее efficient.

Multilingual tokenizer распределяет fixed vocabulary между множеством languages, поэтому отдельный language может tokenized менее compact, чем specialized tokenizer.

---

## 24. Не обучать новый tokenizer без причины

Если model pretrained с old vocabulary, новый tokenizer ломает mapping embedding rows.

Чтобы реально заменить tokenizer, нужно:

- новая/изменённая embedding matrix;
- значительное retraining/adaptation.

Для ordinary fine-tuning используем tokenizer checkpoint.

---

## 25. Tokenization leakage?

Tokenizer vocabulary/merges, обученные на full private dataset including validation, технически используют unlabeled validation distribution.

Если tokenizer training является частью experiment с нуля, его следует fit внутри allowed training data.

Для pretrained tokenizer это external frozen artifact.

---

## 26. Offset mapping

Fast tokenizers могут возвращать mapping token pieces к character spans original text.

Это критично для:

- NER;
- question answering;
- highlighting predictions.

```text
token index
↔ original character positions
```

---

## 27. Word labels → subword labels

NER data может иметь label per word.

Word:

```text
"Washington"
```

разбился на 3 subwords.

Нужно решить, как transfer label:

- first subtoken only;
- all subtokens;
- special ignore index для others.

Это task-specific preprocessing.

---

## 28. Интерактивная визуализация DataPath

### Subword laboratory

Пользователь вводит:
- normal word;
- typo;
- domain term;
- Russian morphology.

Показывать segmentation BPE/WordPiece-like schemes conceptually.

### Padding

Три sequences разной длины → padded batch + mask.

### Truncation

Long document и красная зона discarded tokens.

### Compute

Slider `max_length` показывает quadratic attention matrix growth.

---

## 29. Типичные ошибки

**«Tokenizer просто split по пробелам».**\
Современный Transformer tokenizer обычно гораздо сложнее.

**«BPE = WordPiece = SentencePiece».**\
Нет.

**«Token ID — числовой feature».**\
Это index.

**«Padding token можно оставить без mask».**\
Зависит architecture, но обычно mask нужен.

**«truncation=True решает long document».**\
Технически предотвращает overflow, но может удалить signal.

**«Любой tokenizer подходит любому BERT checkpoint».**\
Нет.

**«Все models используют token_type_ids».**\
Нет.

---

## 30. Проверка понимания

1. Зачем subword tokenization?
2. Word-level vs char-level trade-off?
3. BPE intuition?
4. Чем SentencePiece отличается conceptually?
5. Что такое special token?
6. Зачем attention mask?
7. Dynamic vs max-length padding?
8. Почему truncation dangerous?
9. Почему tokenizer связан с embedding table?
10. Как sequence length влияет attention cost?

---

## 31. Мини-практика

Есть reviews:

```text
median length = 80 tokens
p95 = 340
p99 = 1200
```

Model max length 512.

Предложите:
1. batching strategy;
2. max length;
3. что делать с 1200-token documents;
4. какие statistics собрать;
5. как проверить, где обычно находится target signal.

---

## Что нужно унести

1. Modern NLP обычно использует subword tokenization.
2. Tokenizer и pretrained checkpoint — единый contract.
3. IDs индексируют embedding table.
4. Special tokens model-specific.
5. Padding делает rectangular batch.
6. Attention mask скрывает technical padding.
7. Truncation может удалять полезный content.
8. Long document требует отдельной strategy.
9. Sequence length напрямую влияет Transformer compute.
10. Tokenization quality нужно анализировать на target language/domain.

## Куда дальше

Теперь tokens можно превратить в embeddings.

До BERT полезно увидеть промежуточный этап:

> как строится neural text classifier из embeddings, pooling, CNN, RNN или LSTM.

## Источники
- Hugging Face tokenizers documentation.
- Hugging Face padding/truncation documentation.
- Original BERT tokenizer/model conventions as architecture reference.
