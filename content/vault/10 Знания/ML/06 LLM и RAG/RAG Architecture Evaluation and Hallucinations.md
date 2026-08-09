---
title: RAG architecture, evaluation and hallucinations
id: concept.rag.architecture-evaluation
schema_version: 2
type: concept
area: llm-rag
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [rag/architecture, rag/evaluation]
---

# RAG architecture, evaluation and hallucinations

## End-to-end задача

Локальный помощник должен отвечать по учебному vault и показывать источники. Полезный RAG — не «embedding + prompt», а проверяемая цепочка: ingest → chunks → index → retrieve → rerank → assemble context → generate → validate → cite.

```text
question
  ↓
query normalization + filters
  ↓
sparse/dense retrieval
  ↓
fusion + reranking
  ↓
context with source ids
  ↓
grounded answer + citations
```

Каждый этап должен логировать безопасные диагностические данные: query id, retrieved chunk ids/scores, chosen context, latency и validation outcome. Это позволяет отличить retrieval failure от generation failure.

## Context assembly

Top chunks сортируют не только по score. Удаляют near-duplicates, ограничивают число фрагментов одного документа, сохраняют breadcrumbs и не разрывают связанный пример. Инструкции явно требуют использовать только context и признать отсутствие ответа.

```text
Ответь только по <sources>. Для каждого фактического утверждения укажи [S1].
Если источники не содержат ответа, скажи об этом.

<sources>
[S1] course/lesson/heading ...
[S2] ...
</sources>
```

Цитата должна ссылаться на реальный chunk, а интерфейс — уметь открыть исходный урок и heading. Нельзя генерировать id источника свободным текстом без проверки against allowed ids.

## Откуда берутся hallucinations

Hallucination — уверенное неподдержанное утверждение. Причины различаются:

- retrieval не нашёл правильный chunk;
- context содержит конфликтующие версии;
- chunk обрезал условие или отрицание;
- prompt допускает ответ из parametric memory;
- модель неверно связала evidence и conclusion;
- citation id существует, но не подтверждает предложение.

Поэтому «уменьшить temperature» недостаточно. Нужны abstention, source validation и раздельная диагностика.

## Evaluation по слоям

Retrieval: Recall@k, MRR, nDCG. Context: coverage, redundancy, contamination. Answer: correctness, completeness, groundedness, citation precision. System: latency, failure rate, context tokens.

Минимальный evaluation row содержит question, reference answer, relevant source ids, forbidden claims и тип вопроса. Для 50 хороших разнообразных rows можно получить больше пользы, чем от тысячи автоматически придуманных простых вопросов.

Faithfulness проверяет: следует ли каждое утверждение из context. Answer relevance проверяет: отвечает ли текст на вопрос. Эти качества независимы: можно честно пересказать нерелевантный chunk или дать полезный, но неподтверждённый ответ.

## Числовой пример

Есть 20 вопросов. Relevant chunk попал в top-5 для 16: Recall@5 = 0.80. Среди этих 16 генератор дал корректный grounded answer для 14: conditional answer success = 14/16 = 0.875. End-to-end success = 14/20 = 0.70. Улучшение prompt не может исправить четыре вопроса, где evidence не попал в context.

## Борьба с ошибками

1. Нет evidence → улучшить chunking/query/retrieval.
2. Evidence ниже top-k → fusion/reranker.
3. Evidence в context, ответ неверен → prompt/model/context ordering.
4. Citation не подтверждает claim → claim-level validation.
5. Источники конфликтуют → показать конфликт и версии, не выбирать молча.

Полезен deterministic fallback: показать найденные источники без сгенерированного вывода. Локальная система должна оставаться читаемой даже без модели.

## Типичные ошибки

- один aggregate score без error taxonomy;
- LLM-as-judge без calibration на ручной выборке;
- test questions из тех же chunks тем же генератором;
- отсутствие version ids у index и content;
- цитирование документа, а не поддерживающего passage;
- скрывать abstention как system failure;
- оценивать RAG только на вопросах, где точные слова есть в source.

## Собеседование и практика

**Как отличить retrieval и generation problem?** Проверить, присутствует ли sufficient evidence в переданном context до анализа ответа.

**Как уменьшить hallucinations?** Улучшить evidence coverage, ограничить ответ sources, разрешить abstention, валидировать citations и измерять faithfulness.

1. Почему citation precision может быть низкой при правильном ответе?
2. Что логировать для воспроизводимого evaluation?
3. Спроектируйте 12 evaluation questions для учебного vault: exact term, paraphrase, multi-hop, no-answer и conflicting source.

## Связи

До: retrieval, reranking, prompting. После: agents/tools, monitoring, feedback и controlled index updates.
