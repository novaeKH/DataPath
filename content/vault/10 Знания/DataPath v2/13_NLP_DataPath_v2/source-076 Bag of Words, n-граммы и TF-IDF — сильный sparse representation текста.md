---
title: "Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста"
id: concept.datapath-v2.076
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 76
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Bag of Words, n-граммы и TF-IDF

Пусть есть три документа:

```text
D1: "банк одобрил кредит"
D2: "банк отклонил кредит"
D3: "доставка заказа задержалась"
```

Как превратить их в matrix?

Один из самых сильных classical approaches:

```text
токены
→ vocabulary
→ counts / TF-IDF
→ sparse matrix
```

Несмотря на простоту, TF-IDF + linear model остаётся обязательным baseline для многих classification tasks.

---

## 1. Bag of Words

**Мешок слов (Bag of Words, BoW)** игнорирует глобальный порядок и хранит, какие vocabulary tokens встречаются в document.

Vocabulary:

```text
банк
одобрил
отклонил
кредит
доставка
заказа
задержалась
```

Document D1:

```text
[1,1,0,1,0,0,0]
```

D2:

```text
[1,0,1,1,0,0,0]
```

---

## 2. CountVectorizer

В scikit-learn:

```python
from sklearn.feature_extraction.text import CountVectorizer

vectorizer = CountVectorizer()

X = vectorizer.fit_transform(texts)
```

`fit()` строит vocabulary.

`transform()` создаёт document-term matrix.

---

## 3. Sparse matrix

Vocabulary может иметь:

```text
100 000 tokens
```

Document использует 50.

Dense vector хранит 99 950 zeros.

Sparse matrix хранит в основном non-zero values и indices.

Это ключ к efficiency classical NLP.

---

## 4. Count не всегда достаточно

Word:

```text
"банк"
```

может встречаться почти в каждом document банковского corpus.

Он мало помогает различать categories.

Word:

```text
"chargeback"
```

может встречаться редко, но быть очень discriminative.

TF-IDF уменьшает weight ubiquitous words и увеличивает relative weight terms, характерных для меньшего числа документов.

---

## 5. Term Frequency

Простейший TF:

\[
TF(t,d)=count(t,d).
\]

Есть и normalized/log variants.

Главная idea:

> term, часто встречающийся внутри document, получает больший local weight.

---

## 6. Document Frequency

\[
DF(t)
\]

— число документов, где встречается term.

Если word есть почти везде:

```text
DF high
```

оно хуже различает documents.

---

## 7. Inverse Document Frequency

Общая conceptual idea:

\[
IDF(t)
\approx
\log
\frac{N}{DF(t)}.
\]

Редкие across-corpus terms получают larger IDF.

В scikit-learn exact formula с default smoothing отличается:

\[
idf(t)=\log\frac{1+n}{1+df(t)}+1.
\]

Важно понимать principle и сверять exact implementation, когда formula matters.

---

## 8. TF-IDF

\[
TFIDF(t,d)
=
TF(t,d)\cdot IDF(t).
\]

Term важен, если:

```text
часто встречается в конкретном document
+
не встречается во всех documents
```

---

## 9. Небольшой пример руками

Documents:

```text
D1: cat cat dog
D2: dog car
D3: dog tree
```

`dog` встречается во всех 3 documents:

```text
DF=3
```

`cat` только в одном:

```text
DF=1
```

IDF `cat` выше.

Поэтому два `cat` в D1 получают сильный distinctive weight, а ubiquitous `dog` downweighted.

---

## 10. Нормализация vector

`TfidfVectorizer` по default часто применяет L2 normalization rows.

То есть каждый document vector масштабируется так, что norm≈1.

Это уменьшает прямое влияние document length и удобно linear/cosine geometry.

Exact behavior управляется `norm`.

---

## 11. Word n-grams

Unigram:

```text
"not", "good"
```

теряет relationship.

Bigram:

```text
"not good"
```

сохраняет local phrase.

`ngram_range=(1,2)` создаёт:

```text
unigrams + bigrams
```

Это часто очень сильно улучшает sentiment/intents.

---

## 12. Почему n-граммы взрывают vocabulary

Если unigrams:

```text
50k
```

possible bigrams могут быть hundreds thousands/millions.

Нужны controls:

```text
min_df
max_df
max_features
```

---

## 13. `min_df`

Удаляет terms, встречающиеся слишком редко.

Например:

```python
min_df=3
```

может убрать typos/unique noise.

Но rare token может быть critical fraud/domain signal.

Поэтому threshold validate.

---

## 14. `max_df`

Можно исключить terms, которые встречаются почти во всех documents.

Это corpus-specific alternative/дополнение stop-word lists.

Например:

```python
max_df=0.95
```

убирает term, присутствующий >95% docs.

---

## 15. Character n-grams

Вместо слов:

```text
"карта"
```

можно использовать character pieces:

```text
"кар"
"арт"
"рта"
```

Например:

```python
TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(3,5),
)
```

Character n-grams полезны для:

- опечаток;
- morphology;
- usernames;
- noisy text;
- language identification.

---

## 16. Почему char n-grams сильны для русского

Формы:

```text
оплатил
оплатила
оплатили
оплата
```

имеют общие character substrings.

Без полноценной lemmatization model может всё равно уловить common morphology.

---

## 17. Word + char features

Можно объединять:

```text
word TF-IDF
+
char TF-IDF
```

Это часто очень сильный sparse baseline.

В sklearn можно использовать `FeatureUnion` или вручную sparse `hstack`.

---

## 18. Binary counts

Иногда важно только:

```text
term присутствует?
```

а не count.

`CountVectorizer(binary=True)` или соответствующая representation может быть useful для коротких messages.

---

## 19. Sublinear TF

`TfidfVectorizer(sublinear_tf=True)` заменяет raw frequency примерно на:

\[
1+\log(tf).
\]

Это уменьшает difference между term count 10 и 100.

Полезно для длинных documents, где raw repetitions слишком доминируют.

---

## 20. Vocabulary fit только на train

Нельзя:

```text
fit TF-IDF на train+validation
→ потом CV/model
```

IDF и vocabulary уже использовали validation corpus statistics.

Правильно:

```text
Pipeline
→ vectorizer fit внутри train fold
→ classifier
```

---

## 21. Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=3,
    )),
    ("clf", LogisticRegression(
        max_iter=1000,
    )),
])
```

Теперь CV честно fit vocabulary/IDF inside folds.

---

## 22. Why Linear model works well on TF-IDF

TF-IDF matrix имеет:

```text
очень много dimensions
очень мало nonzeros per document
```

Text classes часто разделимы по комбинациям indicative n-grams.

Linear model:

\[
score=w^Tx+b
\]

может назначить positive/negative weights тысячам terms без дорогой nonlinear feature interaction.

---

## 23. Интерпретация coefficients

Для binary classifier можно посмотреть top positive/negative n-grams.

Например:

```text
positive:
"списали дважды"
"мошенничество"

negative:
"спасибо"
"всё работает"
```

Это полезно для debugging leakage и sanity check.

---

## 24. Limitation: order mostly local

Bag of Words не различает:

```text
dog bites man
man bites dog
```

по unigrams.

Bigrams partially restore local order, но long-distance syntax/context всё ещё плохо моделируются.

---

## 25. Limitation: semantic similarity

Terms:

```text
машина
автомобиль
```

разные dimensions.

Model не знает semantic similarity, пока training data не научит похожие weights independently.

Embeddings/Transformers решают это иначе.

---

## 26. Интерактивная визуализация

### Vocabulary builder

Три documents → vocabulary → count matrix.

### TF-IDF

Slider DF term показывает IDF decreasing.

### n-grams

Toggle:

```text
unigram
bigram
word+char
```

Показать features фразы `не работает`.

### Sparse matrix

Heatmap mostly zeros и comparison dense memory.

---

## 27. Типичные ошибки

**«TF-IDF понимает смысл слов».**\
Нет, это weighting lexical features.

**«TF-IDF dense».**\
Обычно sparse.

**«IDF высокий у frequent-in-all-documents term».**\
Наоборот.

**«Bigrams бесплатны».**\
Vocabulary резко растёт.

**«Vectorizer можно fit на всём corpus до CV».**\
Нет.

**«Char n-grams бесполезны, если есть слова».**\
Они могут быть очень сильны на noisy/morphological text.

---

## 28. Проверка понимания

1. Что хранит Bag of Words?
2. Что делает CountVectorizer?
3. Зачем sparse matrix?
4. TF vs DF?
5. Что делает IDF?
6. Зачем L2 normalize?
7. Unigram vs bigram?
8. Почему vocabulary растёт?
9. Чем char n-grams полезны?
10. Почему TF-IDF fit внутри CV?

---

## 29. Мини-практика

Dataset: 200k коротких support messages.

Предложите 3 baseline representations:

1. word unigram;
2. word 1–2 grams;
3. char 3–5 grams.

Для каждого:
- `min_df`;
- memory trade-off;
- какие errors ожидаете;
- с какой linear model сравнить.

---

## Что нужно унести

1. BoW превращает text в lexical feature vector.
2. Sparse matrices делают huge vocabulary practical.
3. TF-IDF downweights corpus-wide frequent terms.
4. Word n-grams возвращают local order.
5. Char n-grams устойчивы к morphology/noise.
6. `min_df/max_df` контролируют vocabulary.
7. Vectorizer — fitted transformer и должен жить внутри CV.
8. TF-IDF + linear model — обязательный strong NLP baseline.

## Куда дальше

Representation готов.

Следующий вопрос:

> какая модель лучше работает на huge sparse text matrix?

Разберём Logistic Regression, Linear SVM и Naive Bayes и построим сильный classical NLP baseline.

## Источники
- scikit-learn text feature extraction documentation.
- scikit-learn `TfidfVectorizer`, `CountVectorizer`.
