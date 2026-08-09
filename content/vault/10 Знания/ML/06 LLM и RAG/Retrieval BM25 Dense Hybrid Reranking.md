---
title: Retrieval — chunking, BM25, dense, hybrid and reranking
id: concept.rag.retrieval-hybrid-reranking
schema_version: 2
type: concept
area: llm-rag
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [rag/retrieval, rag/hybrid]
---

# Retrieval — chunking, BM25, dense, hybrid and reranking

## Зачем retrieval

Пользователь спрашивает: «Почему validation PR-AUC ниже train?». Нужны не все заметки и не ближайший по длине документ, а несколько фрагментов про split, leakage, overfitting и distribution shift. Retrieval превращает запрос в ранжированный список кандидатов; генератор получает только верхние chunks.

## Chunking

Chunk должен быть достаточно маленьким для точного поиска и достаточно большим для законченной мысли. Фиксированные 500 символов могут разорвать формулу и объяснение. Для учебного vault лучше semantic chunking по H2/H3, затем ограничение длины и небольшой overlap только там, где без него теряется контекст.

Каждый chunk хранит стабильный id, `source_id`, заголовок, breadcrumb и порядковый номер. Индекс должен обновлять изменённый chunk, а не дублировать старую версию. Metadata filters полезны для области, курса, языка и publish status.

## Sparse retrieval и BM25

BM25 сопоставляет термины запроса и документа, учитывает редкость слова и насыщение term frequency. Упрощённо score растёт, если редкий query term встречается в документе, но десятое повторение даёт меньший прирост, чем первое. Length normalization не позволяет длинным документам выигрывать только из-за количества слов.

BM25 силён для точных названий, кода, артикулов и терминов: `ColumnTransformer`, `PR-AUC`, `BM25`. Он хуже связывает перефразирование «утечка будущего» и «признаки из периода после cutoff», если общих слов мало.

## Dense retrieval

Embedding model отображает query и chunks в векторы. Для cosine similarity:

$$
\cos(q,d)=\frac{q^\top d}{\lVert q\rVert\lVert d\rVert}.
$$

Если vectors нормированы, cosine ranking эквивалентен dot product ranking. Dense retrieval ловит смысловые перефразирования, но может пропустить точный редкий token. Query и documents должны кодироваться совместимой моделью и, если модель требует, разными prefixes.

## Hybrid retrieval и RRF

Hybrid объединяет sparse и dense candidates. Простое сложение scores опасно: шкалы несопоставимы. Reciprocal Rank Fusion использует ranks:

$$
RRF(d)=\sum_r\frac{1}{k+rank_r(d)}.
$$

При `k=60` документ на местах 1 в BM25 и 3 в dense получит `1/61 + 1/63 ≈ 0.0323`. Документ только на месте 1 одного retriever — `0.0164`. Согласие двух сигналов повышает итоговый rank без калибровки raw scores.

## Reranking

Bi-encoder отдельно кодирует query и документы, поэтому быстро ищет тысячи candidates. Cross-encoder читает пару query–document вместе и точнее оценивает relevance, но дороже. Типичный pipeline: retrieve top 30–100, rerank, передать top 4–8 генератору.

Reranker не исправит отсутствие правильного chunk в candidate set. Поэтому сначала измеряют retrieval recall, затем качество reranking.

## Мини-пример

BM25 ranks: A, B, C. Dense ranks: C, A, D. При RRF A получает `1/61+1/62`, C — `1/63+1/61`, B — `1/62`, D — `1/63`. A и C выходят наверх, потому что присутствуют в обоих списках. После reranking C может стать первым, если он прямее отвечает на вопрос.

## Evaluation retrieval

Для набора `(query, relevant_chunk_ids)` считают Recall@k: доля запросов, где хотя бы один релевантный chunk попал в top k. MRR награждает ранний первый релевантный результат. nDCG учитывает несколько уровней relevance и позиции.

Обязательно анализировать zero-result, wrong-section, duplicate chunks, correct document/wrong passage и filter failures. Evaluation dataset должен содержать реальные формулировки, короткие запросы, термины и перефразирования.

## Типичные ошибки

- выбирать chunk size без evaluation;
- оценивать только финальный ответ и не знать, нашёлся ли source;
- смешивать cosine distance и similarity;
- складывать BM25 и dense raw scores;
- rerank всего индекса дорогой моделью;
- индексировать draft, deleted и duplicate content;
- использовать overlap, который создаёт пять почти одинаковых top chunks.

## Self-check и практика

1. Почему BM25 может обойти embeddings для запроса с точным API name?
2. Почему высокий top-1 precision не заменяет Recall@20 перед reranker?
3. Что изменится, если chunk объединяет три несвязанных H2?
4. Для пяти учебных вопросов вручную отметьте relevant headings, сравните sparse/dense ranks и вычислите RRF.

## Связи

До: tokenization, embeddings, cosine similarity, inverted index. После: context assembly, grounded generation, citations и RAG evaluation.

## Код: Reciprocal Rank Fusion

```python
def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking, start=1):
            score[doc_id] = score.get(doc_id, 0.0) + 1 / (k + rank)
    return sorted(score, key=score.get, reverse=True)

hybrid_ids = rrf([bm25_ids, dense_ids])
```

RRF не сравнивает несопоставимые raw scores BM25 и cosine similarity. Он
агрегирует positions, после чего top candidates можно передать reranker.
