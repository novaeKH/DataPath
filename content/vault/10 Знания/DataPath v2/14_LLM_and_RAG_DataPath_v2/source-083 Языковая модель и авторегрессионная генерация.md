---
title: "Языковая модель и авторегрессионная генерация"
id: concept.datapath-v2.083
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 83
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Языковая модель и авторегрессионная генерация

Большая языковая модель (Large Language Model, LLM) не хранит готовый ответ на каждый возможный вопрос.

В базовом виде она решает гораздо более конкретную задачу:

> по уже известной последовательности токенов оценить распределение вероятностей следующего токена.

Если текст:

```text
"Машинное обучение — это"
```

модель строит scores для всего словаря:

```text
метод
область
набор
кот
...
```

После преобразования scores в вероятности выбирается следующий token. Затем он добавляется к context, и процесс повторяется.

Так возникает **авторегрессионная генерация (autoregressive generation)**.

---

## 1. Language modeling objective

Пусть token sequence:

\[
x_1,x_2,\dots,x_T.
\]

Авторегрессионная model factorizes probability sequence:

\[
P(x_1,\dots,x_T)
=
\prod_{t=1}^{T}
P(x_t|x_1,\dots,x_{t-1}).
\]

То есть joint probability длинного текста превращается в последовательность next-token predictions.

---

## 2. Training example из одной sequence

Sequence:

```text
Я люблю машинное обучение
```

Conceptually model получает пары:

```text
Я          → люблю
Я люблю    → машинное
Я люблю машинное → обучение
```

Но Transformer не обязан обрабатывать эти позиции по одной во время training.

С causal mask можно одновременно вычислить logits для всех positions.

---

## 3. Shifted targets

Input IDs:

```text
[BOS, Я, люблю, машинное]
```

Targets:

```text
[Я, люблю, машинное, обучение]
```

Model output:

```text
logits shape = [batch, seq_len, vocab_size]
```

Каждая position пытается предсказать следующий token.

---

## 4. Logits

Для vocabulary size:

```text
50 000
```

model выдаёт 50 000 чисел на каждую position.

Это **логиты (logits)** — ненормализованные scores.

Например:

```text
обучение   8.2
модель     6.1
банан     -1.5
```

Сами по себе они не probabilities.

---

## 5. Softmax

Вероятности:

\[
p_i
=
\frac{e^{z_i}}
{\sum_j e^{z_j}}.
\]

После `softmax`:

```text
p_i >= 0
sum p_i = 1
```

Token с большим logit получает большую probability.

---

## 6. Cross-entropy loss

Если correct next token index \(y\), loss:

\[
L=-\log p_y.
\]

Если correct token получает probability:

```text
0.9
```

loss small.

Если:

```text
0.001
```

loss large.

Training заставляет model увеличивать probability correct next tokens.

---

## 7. Почему это self-supervised learning

Human annotator не ставит labels вручную.

Сам текст создаёт target:

```text
prefix → следующий token
```

Поэтому next-token training — self-supervised objective.

Огромный web/text corpus автоматически даёт billions/trillions training examples.

---

## 8. Perplexity

Perplexity:

\[
PPL=e^{\text{cross-entropy}}
\]

в common token-level formulation.

Интуитивно lower perplexity означает, что model меньше «удивляется» correct tokens.

Но perplexity:
- tokenizer-dependent;
- не напрямую измеряет factuality;
- не измеряет usefulness assistant;
- плохо сравнима между radically different tokenizations.

---

## 9. Transformer decoder

GPT-like LLM обычно использует stack decoder blocks:

```text
token IDs
→ embeddings
→ positional information
→ causal Transformer blocks
→ final hidden states
→ vocabulary projection
→ logits
```

Causal mask не позволяет position видеть future answer.

---

## 10. Почему training parallel, а generation sequential

### Training

Вся known sequence доступна.

Causal mask предотвращает cheating, но logits всех positions можно считать parallel.

### Generation

Будущий token неизвестен.

Нужно:

```text
predict token 1
→ append
→ predict token 2
→ append
→ ...
```

Поэтому generation inherently sequential по output length.

---

## 11. KV cache

При generation каждый new token должен attend к past context.

Без cache пришлось бы снова вычислять Key/Value representations всех old tokens на каждом step.

KV cache хранит прошлые K/V внутри Transformer layers.

Это ускоряет decoding, но расходует memory, растущую с context length.

---

## 12. Почему context window ограничено

Input + generated tokens должны помещаться в допустимое context window model.

Если window:

```text
8k tokens
```

а prompt занимает 7.5k, остаётся мало места output.

Long context also increases attention/KV-memory cost.

Поэтому context — ограниченный computational resource.

---

## 13. Pretraining и assistant behavior — разные этапы

Base language model обучена продолжать текст.

Но полезный assistant должен:
- следовать instructions;
- различать system/user roles;
- отказываться где нужно;
- давать удобный format.

Для этого применяются post-training approaches:
- supervised instruction tuning;
- preference optimization;
- reinforcement-learning-like methods.

Точные recipes различаются между model families.

---

## 14. Почему next-token prediction может породить сложное поведение

Чтобы хорошо предсказывать текст, model выгодно изучить:
- syntax;
- semantic associations;
- style;
- factual patterns;
- code structure;
- reasoning-like patterns.

Но training objective остаётся next-token prediction.

Сложные capabilities возникают как результат learned representations and scale, а не потому, что loss explicitly says «понимай мир».

---

## 15. Model weights не база данных

Weights кодируют distributed statistical structure.

Из этого следуют ограничения:
- факт может быть approximate;
- model может смешать похожие facts;
- knowledge has cutoff/training distribution;
- невозможно надёжно обновить один факт простой записью строки в weights.

Для current/private knowledge нужен retrieval/tool access.

Это главный мост к RAG.

---

## 16. Hallucination

Language model оптимизирует plausible continuation, а не database truth constraint.

Если context недостаточен, model всё равно способна продолжить sequence уверенно.

Поэтому **галлюцинация (hallucination)** — не просто «случайный баг UI».

Это failure mode generative model, когда fluent output не соответствует фактам или источникам.

---

## 17. Why confidence from token probability is not factual confidence

Высокая next-token probability означает:

> среди возможных continuations этот token очень вероятен по model distribution.

Это не то же самое:

> утверждение объективно истинно с вероятностью 95%.

Token probabilities не являются calibrated truth probabilities statement-level claims.

---

## 18. Generation stop

Model может закончить output:
- специальным end-of-sequence token;
- stop sequence;
- max token limit;
- external controller rule.

Generation loop therefore belongs partly to model and partly to runtime.

---

## 19. Simple pseudo-code

```python
tokens = tokenize(prompt)

for _ in range(max_new_tokens):
    logits = model(tokens)
    next_logits = logits[:, -1, :]

    next_token = choose(next_logits)

    tokens = append(tokens, next_token)

    if next_token == EOS:
        break
```

`choose()` — целая отдельная тема следующего урока.

---

## 20. Интерактивная визуализация DataPath

### Next-token distribution

Prompt:
```text
"Москва — столица"
```

Показать top token probabilities.

### Autoregressive loop

Каждый selected token добавляется назад в context.

### Training vs generation

Слева:
```text
whole known sequence + causal mask
```

Справа:
```text
one new token at a time
```

### Context budget

Полоса:
```text
system
user
retrieved docs
history
generated tokens
```

Показывать overflow.

---

## 21. Типичные ошибки

**«LLM ищет готовый ответ внутри weights».**\
Нет.

**«Softmax probability = вероятность истинности факта».**\
Нет.

**«Generation during training обязательно token-by-token».**\
Causal Transformer training positions parallelizable.

**«KV cache хранит весь текст как строки».**\
Он хранит internal K/V tensors past tokens.

**«Большой context бесплатен».**\
Нет.

**«Hallucination полностью исчезает у более большой model».**\
Нет.

---

## 22. Проверка понимания

1. Что предсказывает autoregressive LM?
2. Как factorize sequence probability?
3. Что такое logits?
4. Зачем softmax?
5. Cross-entropy next-token?
6. Почему training self-supervised?
7. Что показывает perplexity?
8. Почему generation sequential?
9. Что хранит KV cache?
10. Почему weights не database?

---

## 23. Мини-практика

Vocabulary:

```text
A, B, C
```

Logits:

```text
A = 2
B = 1
C = 0
```

1. Какая вероятность largest after softmax?
2. Что изменится при temperature?
3. Почему greedy token может отличаться от sampled?
4. Если model выбрала B, как меняется следующий input?

---

## Что нужно унести

1. LLM в основе предсказывает next-token distribution.
2. Sequence probability factorizes autoregressively.
3. Logits превращаются softmax в distribution.
4. Cross-entropy обучает correct next token.
5. Training может быть parallel по positions благодаря causal mask.
6. Generation sequential по output.
7. KV cache ускоряет generation.
8. Context window — ограниченный resource.
9. Token probability не truth probability.
10. Weights не заменяют актуальную/private knowledge base.

## Куда дальше

Если model имеет distribution next token, остаётся вопрос:

> **как из distribution выбрать token?**

Greedy, beam search, temperature, top-k и top-p дают разное поведение генерации.

## Источники
- Autoregressive language-modeling literature.
- Transformer decoder architecture references.
