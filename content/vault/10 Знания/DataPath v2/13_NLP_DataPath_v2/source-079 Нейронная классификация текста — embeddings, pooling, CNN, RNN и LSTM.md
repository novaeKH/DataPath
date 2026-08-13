---
title: "Нейронная классификация текста — embeddings, pooling, CNN, RNN и LSTM"
id: concept.datapath-v2.079
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 79
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Нейронная классификация текста: что было между TF-IDF и BERT

До Transformers существовало множество neural NLP architectures.

Они до сих пор полезны, потому что показывают фундаментальную задачу:

```text
sequence token embeddings
→ fixed-size document representation
→ classifier
```

Разные models отличаются тем, **как из sequence получить representation**.

---

## 1. Общий pipeline

```text
token IDs
→ nn.Embedding
→ contextual/aggregation layer
→ document vector
→ Linear head
→ logits
```

Вопрос:

> как объединить token vectors?

---

# Mean / Max Pooling

## 2. Самый простой neural baseline

Embeddings:

```text
[B,L,D]
```

Среднее по tokens:

```text
[B,D]
```

```python
doc = x.mean(dim=1)
```

Затем:

```text
Linear(D,C)
```

Это простой **mean pooling**.

---

## 3. Padding problem

Нельзя averaging включать padding.

Нужно masked mean:

\[
doc
=
\frac{
\sum_t mask_t x_t
}{
\sum_t mask_t
}.
\]

Иначе short documents с большим padding будут biased к padding embedding.

---

## 4. Max pooling

По каждой embedding dimension:

```text
взять max по sequence
```

Это может ловить strongest local feature response.

Но loses order и nuanced composition.

---

## 5. Mean pooling surprisingly strong

Если embeddings/contextual representations уже meaningful, average может быть хорошим baseline.

Это напоминает Bag of Words:

> global order largely discarded.

Но dense learned representation позволяет semantic sharing между tokens.

---

# Text CNN

## 6. Convolution по sequence

Text embeddings:

```text
[L,D]
```

1D convolution смотрит на local windows tokens.

Kernel width 3:

```text
token t-1
token t
token t+1
```

может learn phrase pattern.

Это neural analogue word n-grams.

---

## 7. Text CNN pipeline

```text
embeddings
→ Conv1d width 3/4/5
→ ReLU
→ global max pooling
→ concatenate
→ classifier
```

Разные kernel sizes capture local phrases разных lengths.

---

## 8. Почему Conv1d channels layout tricky

PyTorch `Conv1d` обычно ждёт:

```text
[N,C,L]
```

Но embedding output:

```text
[N,L,D]
```

Поэтому нужно transpose:

```python
x = x.transpose(1, 2)
```

чтобы embedding dimension стала channels.

---

## 9. Toy TextCNN

```python
class TextCNN(nn.Module):
    def __init__(self, vocab, emb_dim, channels, classes):
        super().__init__()
        self.emb = nn.Embedding(vocab, emb_dim, padding_idx=0)
        self.conv = nn.Conv1d(
            emb_dim,
            channels,
            kernel_size=3,
            padding=1,
        )
        self.head = nn.Linear(channels, classes)

    def forward(self, ids):
        x = self.emb(ids)        # [B,L,D]
        x = x.transpose(1, 2)    # [B,D,L]
        x = torch.relu(self.conv(x))
        x = x.max(dim=-1).values
        return self.head(x)
```

---

# RNN/LSTM classifier

## 10. Sequence order

RNN/LSTM читает token embeddings по порядку:

```text
embedding1
→ state1
embedding2
→ state2
...
```

Final state используется как document representation.

---

## 11. LSTM classifier

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab, emb, hidden, classes):
        super().__init__()
        self.embedding = nn.Embedding(
            vocab,
            emb,
            padding_idx=0,
        )
        self.lstm = nn.LSTM(
            emb,
            hidden,
            batch_first=True,
        )
        self.head = nn.Linear(hidden, classes)

    def forward(self, ids):
        x = self.embedding(ids)
        _, (h_n, _) = self.lstm(x)
        return self.head(h_n[-1])
```

Для padded data лучше использовать real lengths/packing или правильный pooling/masking, чтобы final state не correspond padding timestep.

---

## 12. Bidirectional LSTM

Для full-text classification whole sequence доступна.

Bidirectional LSTM читает:

```text
left→right
right→left
```

и concat representations.

Это помогает context обеих сторон.

Для causal generation/forecasting future direction нельзя.

---

## 13. Attention over LSTM outputs

До Transformer популярная architecture:

```text
BiLSTM
→ hidden states each token
→ attention pooling
→ weighted document vector
```

То есть attention возникла ещё до Transformer как способ не сжимать sequence только в final state.

---

## 14. Pretrained static embeddings

Можно initialize `nn.Embedding` pretrained Word2Vec/FastText vectors.

FastText особенно интересен morphology, потому что word representations используют character n-grams.

Потом:
- freeze embeddings;
- или fine-tune.

Но modern contextual Transformers обычно сильнее при достаточных resources.

---

## 15. OOV problem static word embeddings

Word-level embedding vocabulary:

```text
"переподключение" absent
```

может дать `<UNK>`.

Subword Transformer tokenizer лучше handles rare words.

FastText partially решает через character n-grams.

---

## 16. Padding/masks во всех architectures

Pooling:
- mask padding explicitly.

RNN:
- lengths/packing.

Transformer:
- attention mask.

Один technical padding token не должен влиять как real word.

---

## 17. Loss

Multiclass:

```python
nn.CrossEntropyLoss()
```

Input:

```text
[B,C] logits
```

Target:

```text
[B] class IDs
```

Binary:
- one logit;
- `BCEWithLogitsLoss`.

---

## 18. Class imbalance

Same principles Classic ML:

- macro F1;
- per-class recall;
- weights;
- threshold for binary/multilabel.

Deep model не отменяет metrics.

---

## 19. Multi-label text classification

Один document может иметь несколько tags:

```text
fraud
card
urgent
```

Это не multiclass.

Output:

```text
C independent logits
```

Loss:

```python
BCEWithLogitsLoss
```

Target:

```text
multi-hot [B,C]
```

Threshold can be per-label.

---

## 20. Why sparse baseline may still win

Small dataset:

```text
3k documents
```

TextCNN/LSTM training from scratch может learn poor embeddings.

TF-IDF уже directly exposes discriminative lexical features.

Поэтому fair comparison mandatory.

---

## 21. Why neural model can win

Advantages:

- shared dense representations;
- semantic similarity;
- sequence order;
- local composition;
- pretrained embeddings;
- end-to-end feature learning.

Но requires:
- more data;
- tuning;
- compute.

---

## 22. Error comparison

TF-IDF may fail:
```text
synonyms
long context
word order
```

LSTM may fail:
```text
very long docs
rare vocabulary
optimization
```

TextCNN may fail:
```text
long-range dependencies
```

Comparing errors tells which inductive bias needed.

---

## 23. Интерактивная визуализация

### Pooling

Token embeddings → mean/max document vector.

### Text CNN

Kernel window slides over token embeddings, activations spike at phrase.

### LSTM

Hidden state evolves word-by-word.

### Architecture comparison

Sentence with long negation dependency:
- mean pool;
- CNN width3;
- LSTM.

Show what context each naturally captures.

---

## 24. Типичные ошибки

**«Mean pooling понимает order».**\
Нет.

**«Text CNN то же самое, что image Conv2d».**\
Principle convolution same, geometry/shape different.

**«Final LSTM state всегда correct при padded sequence».**\
Нужно учитывать real lengths.

**«Multi-label = multiclass».**\
Нет.

**«Neural model обязательно лучше TF-IDF».**\
Нет.

**«Static embedding уже contextual».**\
Нет.

---

## 25. Проверка понимания

1. Как из `[B,L,D]` получить doc vector mean pooling?
2. Почему mask padding?
3. Что Text CNN capture?
4. Shape Conv1d?
5. Что LSTM добавляет?
6. Когда bidirectional допустим?
7. Multiclass vs multilabel loss?
8. Почему static embeddings limited?
9. Почему sparse baseline может выиграть?
10. Что attention pooling даёт поверх LSTM?

---

## 26. Мини-практика

Dataset:
```text
20k reviews
median 120 tokens
binary sentiment
```

Сравните:
1. TF-IDF + Logistic;
2. learned embedding + mean pooling;
3. TextCNN;
4. BiLSTM.

Для каждого:
- expected strengths;
- compute;
- preprocessing;
- likely failure mode.

---

## Что нужно унести

1. Neural text classifier = embeddings → sequence aggregation → head.
2. Mean/max pooling просты, но largely ignore order.
3. Text CNN captures local phrase patterns.
4. RNN/LSTM models sequence order.
5. Bidirectional models whole context when future available.
6. Padding handling architecture-specific.
7. Multi-label classification uses independent logits.
8. Classical sparse baseline remains mandatory.
9. BERT next combines contextual token representations with Transformer pretraining.

## Куда дальше

Следующий шаг:

> не обучать embeddings и sequence model с нуля, а взять Transformer, предварительно обученный на огромном text corpus.

Разберём BERT и encoder Transformers.

## Источники
- PyTorch `Embedding`, `Conv1d`, `LSTM`.
- Classical neural text classification architectures as conceptual references.
