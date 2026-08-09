---
title: Transformers, BERT-style models and NLP evaluation
id: concept.nlp.transformers-bert-evaluation
schema_version: 2
type: concept
area: nlp
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [nlp/transformers, nlp/evaluation]
---

# Transformers, BERT-style models and NLP evaluation

## Задача и интуиция

Пусть нужно определить тональность отзыва «доставка долгая, но сам товар отличный». Bag of Words видит слова, но почти не моделирует контекст: «отличный» повышает позитивность независимо от того, к чему относится. Transformer строит для каждого токена контекстное представление: слово может собрать информацию с других позиций через attention. Поэтому представление «товар» учитывает «отличный», а «доставка» — «долгая».

Encoder-модели BERT-типа читают контекст слева и справа и особенно удобны для классификации, NER, поиска похожих текстов и извлечения признаков. Decoder-модели предсказывают следующий токен и подходят для генерации. Это разные учебные задачи, даже если внутри обеих архитектур есть attention.

## Tokenization и вход модели

Tokenizer превращает строку в subword tokens, затем в целочисленные `input_ids`. Редкое слово может распасться на несколько частей. К ids добавляются special tokens, attention mask и position information. В batch короткие последовательности дополняются padding, но padding не должен участвовать в attention и loss.

```python
batch = tokenizer(
    texts,
    padding=True,
    truncation=True,
    max_length=256,
    return_tensors="pt",
)
logits = model(**batch).logits
probability = logits.softmax(dim=-1)
```

`logits` — не вероятности. Для mutually exclusive классов применяют softmax, для независимых multilabel targets — sigmoid по каждому выходу. `max_length` задаёт не «качество», а политику потери длинного контекста и потребление памяти.

## BERT-style fine-tuning

Pretrained encoder уже знает статистику языка. Для classification поверх representation специального `[CLS]` token или pooled output добавляют linear head. На fine-tuning обновляют head и обычно encoder с меньшим learning rate.

```python
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
for batch in train_loader:
    optimizer.zero_grad()
    output = model(**batch)
    output.loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    optimizer.step()
```

При маленьком датасете полезно начать с замороженного encoder и linear baseline, затем разморозить верхние слои. Сравнение должно использовать один и тот же split. Если тексты одного пользователя попали и в train, и в validation, модель может запоминать стиль автора — это leakage.

## Числовой пример classification

Для трёх классов модель вернула logits `[1.2, -0.3, 0.7]`. После стабилизации вычтем максимум: `[0, -1.5, -0.5]`. Экспоненты примерно `[1, 0.223, 0.607]`; сумма `1.83`. Вероятности: `[0.546, 0.122, 0.332]`. Предсказан первый класс, но confidence 0.546 невысок. Если бизнес-действие дорогое, одного `argmax` недостаточно: нужна калибровка и policy для low-confidence объектов.

## Evaluation без самообмана

Для balanced single-label classification смотрят macro-F1 и confusion matrix. Micro-F1 близок к accuracy и сильнее отражает частые классы. Для imbalanced классов macro-F1 не позволяет редкому классу исчезнуть в среднем.

В NER метрика считается по сущностям, а не только по токенам: границы `B-PER/I-PER` должны совпасть. В retrieval оценивают Recall@k, MRR или nDCG. Для generation одной автоматической метрики обычно мало: нужны task-specific checks и ручной error analysis.

Разбейте ошибки минимум на группы: negation, long context, rare vocabulary, ambiguous labels, truncation, domain shift. Затем исправляйте самый крупный и управляемый класс ошибок, а не просто меняйте модель.

## Типичные ошибки

- сравнивать Transformer с baseline на другом split;
- усреднять F1 без указания `macro`, `micro` или `weighted`;
- делать padding, но забывать `attention_mask`;
- применять softmax в multilabel задаче;
- читать `argmax(logits)` как надёжную вероятность;
- подбирать threshold на test;
- не проверять тексты, обрезанные truncation;
- считать, что большая pretrained model автоматически лучше простого TF-IDF baseline.

## Собеседование

**Почему BERT bidirectional?** Masked-language pretraining позволяет токену использовать левый и правый контекст. Это удобно для понимания текста, но не является обычной autoregressive генерацией.

**Зачем attention mask?** Она запрещает использовать padding или недоступные позиции при вычислении attention weights.

**Когда TF-IDF лучше?** При малом датасете, жёсткой latency, понятной лексике и необходимости интерпретации linear baseline часто дешевле и не хуже.

## Self-check и практика

1. Почему softmax не подходит для тегов, которые могут быть истинны одновременно?
2. Что именно сломается, если один документ нарезать на chunks до split?
3. Почему macro-F1 может падать при неизменной accuracy?
4. Возьмите 12 коротких текстов, придумайте group-aware split и перечислите три категории ошибок, которые будете считать отдельно.

## Связи

До: tokenization, TF-IDF, embeddings, sequence models, attention. После: fine-tuning, dense retrieval, reranking, LLM inference и RAG.
