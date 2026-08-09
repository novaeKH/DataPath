---
title: LLM inference, context window and prompting
id: concept.llm.inference-context-prompting
schema_version: 2
type: concept
area: llm-rag
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [llm/inference, llm/prompting]
---

# LLM inference, context window and prompting

## Практическая задача

Нужно локально превратить заметку о клиенте в JSON с полями `risk`, `reasons` и `next_action`. Модель не «ищет ответ в базе знаний»: на inference она много раз предсказывает следующий token, опираясь на prompt, уже сгенерированные tokens и параметры decoding. Надёжность начинается с ясного контракта, а не с магической формулировки.

## Tokenization и autoregressive inference

Текст разбивается на subword tokens. Один русский термин, число или фрагмент кода может занимать несколько tokens. После forward pass модель выдаёт logits для следующего token. Softmax превращает их в распределение, decoding выбирает token, добавляет его к контексту и повторяет цикл.

При greedy decoding выбирается максимум. Temperature делит logits перед softmax: малая температура делает распределение острее, большая — более случайным. `top_p` оставляет минимальный набор tokens с суммарной вероятностью не меньше p. Для извлечения фактов и JSON обычно нужна низкая вариативность; для brainstorming допустима большая.

## Context window

Context window включает system instructions, пользовательский запрос, историю, retrieved chunks и текущий output. Если лимит 8k tokens, нельзя положить 8k входа и ожидать 2k ответа без отдельного output budget. Длинный контекст не гарантирует использование каждой детали: важная информация может потеряться среди повторов и шума.

Полезная политика:

1. зарезервировать budget ответа;
2. оставить только релевантную историю;
3. убрать дублирующие chunks;
4. поставить инструкции и данные в явно разделённые блоки;
5. измерять token count до inference.

## Prompt как контракт

Хороший prompt определяет роль задачи, вход, ограничения, формат и критерий успеха. Он отделяет данные от инструкций и говорит, что делать при недостатке информации.

```text
Задача: классифицировать риск оттока по заметке.
Используй только факты из <note>.
Если фактов недостаточно, risk="unknown".

Верни JSON:
{"risk":"low|medium|high|unknown","reasons":[...],"next_action":"..."}

<note>
...
</note>
```

Few-shot examples полезны, когда правило трудно полностью описать. Но пример может случайно внести лишний pattern. Сначала нужен zero-shot contract и набор test cases, затем минимальное число показательных примеров.

## Structured output

Просьба «верни JSON» не гарантирует валидность. Надёжный pipeline валидирует результат схемой и ограниченно повторяет запрос с сообщением об ошибке. Нельзя молча заполнять отсутствующие обязательные поля.

```python
class ChurnAssessment(BaseModel):
    risk: Literal["low", "medium", "high", "unknown"]
    reasons: list[str]
    next_action: str

assessment = ChurnAssessment.model_validate_json(raw_output)
```

## Числовой пример decoding

Пусть logits трёх tokens равны `[2, 1, 0]`. При temperature 1 вероятности приблизительно `[0.665, 0.245, 0.09]`. При temperature 0.5 logits становятся `[4, 2, 0]`, а вероятности — примерно `[0.867, 0.117, 0.016]`. Самый вероятный token тот же, но случайное отклонение значительно менее вероятно.

## Типичные ошибки

- считать context window долговременной памятью;
- смешивать недоверенные данные и инструкции без delimiters;
- повышать temperature для factual extraction;
- не резервировать output tokens;
- парсить JSON регулярным выражением вместо schema validation;
- оценивать prompt на двух удобных примерах;
- ожидать, что модель знает свежие или локальные факты без retrieval.

## Собеседование и self-check

**Temperature меняет знания модели?** Нет, она меняет распределение выбора следующего token.

**Почему structured output всё равно надо валидировать?** Генерация вероятностная, и строка может нарушить синтаксис или бизнес-схему.

1. Что входит в context budget?
2. Чем greedy decoding отличается от sampling?
3. Как prompt injection попадает через retrieved document?
4. Напишите schema-first prompt для извлечения даты, суммы и валюты; определите поведение при пропущенной валюте.

## Связи

До: tokenization, Transformer, logits, softmax. После: chunking, retrieval, RAG evaluation, tools и memory.
