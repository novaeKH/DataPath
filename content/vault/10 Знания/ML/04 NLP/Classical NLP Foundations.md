---
title: Classical NLP Foundations
type: concept
area: nlp
status: active
aliases:
  - Классический NLP
  - Bag of Words and TF-IDF
  - Word2Vec foundations
tags:
  - nlp/classical
  - ml/text
math_depth: 2
id: concept.nlp.classical-nlp-foundations
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Classical NLP Foundations

## Идея за 30 секунд

Классический NLP превращает текст в фиксированный vector, после чего применяет обычный ML algorithm. Bag of Words считает tokens, n-grams частично сохраняют local order, TF-IDF уменьшает вес ubiquitous words, а Word2Vec учит dense vectors по соседним contexts. Эти representations проще Transformer и часто остаются сильным, быстрым и интерпретируемым baseline.

## Зачем нужно

Classical text pipeline полезен, когда:

- dataset мал или средний;
- важны скорость, CPU inference и explainability;
- vocabulary относительно стабилен;
- нужен честный baseline до fine-tuning Transformer;
- задача близка к keyword/topic discrimination.

Типичный pipeline:

$$
\text{text}
\rightarrow
\text{tokens}
\rightarrow
\text{vocabulary}
\rightarrow
\text{document vector}
\rightarrow
\text{classifier}.
$$

Vocabulary, IDF и classifier fit только на train. Иначе возникает [[Validation Splits and Data Leakage|preprocessing leakage]].

## Tokenization и n-grams

Tokenization определяет atomic units: words, subwords или characters. До выбора tokenizer нужно решить, что считать signal:

- lowercase может объединить `Python` и `python`, но потерять entity signal;
- punctuation может быть noise или sentiment feature;
- aggressive stemming уменьшает vocabulary, но смешивает разные meanings;
- word tokenizer плохо переносит typos и unseen words;
- character n-grams устойчивее к morphology и опечаткам.

Word unigram хранит отдельные tokens. Bigram хранит пары соседних tokens, trigram — тройки. N-grams добавляют local order: `not good` отличается от отдельных `not` и `good`, но vocabulary и sparsity быстро растут.

## Bag of Words

Пусть vocabulary содержит $V$ tokens. Document $d$ представляется sparse vector $x\in\mathbb{R}^V$:

$$
x_j
=
\operatorname{count}(t_j,d).
$$

Binary variant хранит только presence:

$$
x_j
=
\mathbb{1}[t_j\in d].
$$

Representation теряет global word order и semantic similarity: разные coordinates для `car` и `automobile` не знают, что meanings близки. Зато vector прозрачен, а sparse linear models хорошо масштабируются.

### Почему linear model может работать

В high-dimensional sparse space каждый informative token или n-gram получает coefficient. Для binary classification:

$$
P(y=1\mid x)
=
\sigma(w^\top x+b).
$$

[[Logistic Regression]] складывает evidence отдельных features; [[Regularization|L1/L2 regularization]] ограничивает нестабильные coefficients. [[Naive Bayes]] даёт другой strong baseline, особенно на count-like features и небольших datasets.

## TF-IDF

Raw count делает длинные documents и ubiquitous words слишком influential. TF-IDF сочетает importance token внутри document и rarity token в corpus.

Один практический smoothed variant:

$$
\operatorname{idf}(t)
=
\log
\left(
\frac{1+N}{1+\operatorname{df}(t)}
\right)
+1,
$$

где $N$ — число train documents, а $\operatorname{df}(t)$ — число train documents, содержащих token.

Тогда:

$$
\operatorname{tfidf}(t,d)
=
\operatorname{tf}(t,d)
\cdot
\operatorname{idf}(t).
$$

Почему именно так:

- TF растёт, когда token важен внутри document;
- IDF снижает вес token, встречающегося почти везде;
- logarithm сжимает extreme ratios;
- smoothing даёт finite value для редких train tokens.

Часто document vector L2-normalize:

$$
\hat{x}
=
\frac{x}{\lVert x\rVert_2},
$$

чтобы сравнение меньше зависело от document length. Cosine similarity нормированных vectors равна dot product.

## Word2Vec

Word2Vec учит dense vector token по distributional hypothesis: слова, встречающиеся в похожих contexts, должны иметь похожие representations.

- CBOW предсказывает center word по surrounding context.
- Skip-gram предсказывает surrounding words по center word.

Для Skip-gram базовая цель:

$$
\max_\theta
\sum_{(w,c)}
\log P_\theta(c\mid w).
$$

Полный softmax по большому vocabulary дорог. Negative sampling превращает задачу в различение observed word-context pairs и sampled negative pairs.

После обучения:

- близость vectors отражает patterns training corpus;
- arithmetic analogies иногда возникают, но не являются contract;
- один token имеет один static vector независимо от sentence;
- rare и unseen words остаются проблемой.

В отличие от [[Embeddings and Attention|contextual embeddings]], Word2Vec не различает meanings polysemous word по контексту.

## Предположения

Classical sparse representation особенно уместна, если:

- label связан с lexical/local patterns;
- train vocabulary покрывает production;
- длинные dependencies не критичны;
- bag/n-gram statistics достаточно стабильны;
- preprocessing одинаков в train и inference.

## Что если предположения нарушены

| Нарушение | Симптом | Что проверить |
|---|---|---|
| много typos/morphology | высокий OOV, unstable word features | character n-grams, normalization |
| важен длинный context | одинаковые tokens, разный meaning | contextual model / Transformer |
| vocabulary drift | quality падает по времени | time split, OOV rate, retraining |
| редкий positive class | accuracy вводит в заблуждение | PR-AUC, recall/precision at threshold |
| IDF fit на всех данных | offline quality завышено | fit vectorizer внутри fold |
| очень много n-grams | memory/variance растут | `min_df`, `max_features`, regularization |

## Практика

Читаемый baseline:

1. зафиксировать prediction unit и split;
2. fit tokenizer/vectorizer только на train;
3. начать с word unigrams/bigrams и TF-IDF;
4. обучить regularized linear model;
5. сравнить с character n-grams;
6. измерить error slices, OOV и stability по времени;
7. только затем сравнивать с dense/contextual model.

Для sklearn vectorizer и classifier должны находиться в одном `Pipeline`, чтобы каждый CV fold строил vocabulary и IDF только по своей train-part.

## Собеседование

Короткая causal chain:

> BoW — sparse counts без global order → n-grams возвращают local order ценой dimension → TF-IDF downweights ubiquitous tokens → regularized linear model даёт strong baseline → Word2Vec учит static dense vectors из contexts → Transformer строит contextual representations.

Follow-up:

- Почему TF-IDF нельзя fit до split?
- Когда character n-grams лучше word n-grams?
- Почему Word2Vec не решает polysemy?
- Когда linear TF-IDF baseline предпочтительнее Transformer?

## Связи

- [[Logistic Regression]] — linear classifier поверх sparse representation.
- [[Naive Bayes]] — probabilistic text baseline.
- [[Regularization]] — контроль high-dimensional coefficients.
- [[Validation Splits and Data Leakage]] — fold-local vocabulary и IDF.
- [[ML Metrics and Threshold Selection]] — выбор metric и operating threshold.
- [[Embeddings and Attention]] — contextual dense representations.
- [[Transformer and Language Modeling]] — long-context sequence model.

