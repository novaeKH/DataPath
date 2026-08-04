---
title: "Transformer и LLM — тренажёр"
tags:
  - deep-learning
  - practice
  - interview
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.transformer-i-llm-trenazhior
schema_version: 2
language: ru
app: source
---
# Transformer и LLM — тренажёр

## D. Transformer и LLM — 25 баллов

Отвечай коротко, но обязательно называй формы/маски, когда вопрос о механике.

#### D1. Как текст становится входом Transformer?


<details>
<summary><b>Ответ и критерии</b></summary>

Токенизатор разбивает текст на subword tokens и переводит их в IDs. `Embedding` отображает IDs `(B,T)` в векторы `(B,T,D)`. Добавляется позиционная информация и маски.

</details>

#### D2. Почему subword tokenization лучше словаря целых слов?


<details>
<summary><b>Ответ и критерии</b></summary>

Она покрывает редкие/новые слова составными частями, контролирует размер словаря и не превращает каждую форму слова в отдельный редкий ID. Компромисс — размер словаря против длины последовательности.

</details>

#### D3. Что такое Q, K, V?


<details>
<summary><b>Ответ и критерии</b></summary>

Обучаемые проекции hidden states. Q описывает запрос текущей позиции, K — признаки для сопоставления, V — передаваемую информацию. Scores получают как $QK^T/\sqrt{d_k}$, веса — softmax, контекст — weighted sum V.

</details>

#### D4. Зачем делить attention scores на sqrt(d_k)?


<details>
<summary><b>Ответ и критерии</b></summary>

Дисперсия скалярного произведения растёт с размерностью. Без scaling logits softmax становятся слишком крупными/насыщенными, и градиенты ухудшаются.

</details>

#### D5. Как точно работает causal mask?


<details>
<summary><b>Ответ и критерии</b></summary>

До softmax запрещённым future scores присваивают $-\infty$. После softmax их вес нулевой, а разрешённые веса нормированы. Токен t видит только позиции $\le t$.

</details>

#### D6. Зачем несколько attention heads?


<details>
<summary><b>Ответ и критерии</b></summary>

Они используют разные обучаемые проекции и могут моделировать разные типы взаимодействий. Их результаты конкатенируются и смешиваются выходной проекцией; это не голосование ансамбля.

</details>

#### D7. MHA, MQA и GQA?


<details>
<summary><b>Ответ и критерии</b></summary>

MHA имеет отдельные Q/K/V heads. MQA использует много Q-heads и одну K/V-head. GQA делит Q-heads на группы с общими K/V. MQA/GQA уменьшают KV-cache и ускоряют генерацию.

</details>

#### D8. Self-attention против cross-attention?


<details>
<summary><b>Ответ и критерии</b></summary>

В self-attention Q/K/V происходят из одной последовательности. В cross-attention queries decoder сопоставляются с keys/values encoder или внешней последовательности.

</details>

#### D9. Что делают attention, MLP, residual и LayerNorm внутри блока?


<details>
<summary><b>Ответ и критерии</b></summary>

Attention смешивает информацию между токенами. MLP преобразует признаки каждого токена. Residual сохраняет сигнал и путь градиента. LayerNorm стабилизирует представления; в современном decoder часто используется pre-norm.

</details>

#### D10. Зачем positional encoding/RoPE?


<details>
<summary><b>Ответ и критерии</b></summary>

Self-attention сам по себе не содержит порядка. Позиционный механизм добавляет информацию об абсолютном или относительном расположении токенов; RoPE кодирует относительные отношения через преобразование Q/K.

</details>

#### D11. BERT против GPT?


<details>
<summary><b>Ответ и критерии</b></summary>

BERT — encoder-only, обычно видит контекст с двух сторон и подходит для понимания/классификации/embeddings. GPT — decoder-only с causal mask, обучается next-token prediction и генерирует autoregressively.

</details>

#### D12. Почему обучение GPT параллельно по позициям, а генерация последовательна?


<details>
<summary><b>Ответ и критерии</b></summary>

При training весь правильный сдвинутый target известен, поэтому logits всех позиций считаются одновременно под causal mask. При inference следующий токен неизвестен до сэмплирования предыдущего.

</details>

#### D13. Как строятся input и target для causal LM?


<details>
<summary><b>Ответ и критерии</b></summary>

Из одной последовательности: input — все токены кроме последнего, target — все кроме первого. Logits `(B,T,V)` сравнивают с индексами targets `(B,T)` через cross-entropy.

</details>

#### D14. Что такое perplexity и чего она не показывает?


<details>
<summary><b>Ответ и критерии</b></summary>

$PPL=e^{mean\ token\ NLL}$. Она измеряет уверенность в правильном следующем токене, но не гарантирует полезность, правдивость или качество текста и плохо сопоставима между разными токенизаторами/корпусами.

</details>

#### D15. Temperature, top-k и top-p?


<details>
<summary><b>Ответ и критерии</b></summary>

Temperature масштабирует logits: ниже 1 — распределение острее, выше — разнообразнее. Top-k оставляет k лучших токенов. Top-p оставляет минимальный набор с суммарной вероятностью p. После фильтрации вероятности перенормируются.

</details>

#### D16. Что такое KV-cache?


<details>
<summary><b>Ответ и критерии</b></summary>

При autoregressive generation сохраняются K/V прошлых позиций каждого слоя. Для нового токена не нужно пересчитывать их заново; растёт cache memory, но существенно снижаются вычисления.

</details>

#### D17. Зачем warmup + cosine decay?


<details>
<summary><b>Ответ и критерии</b></summary>

Warmup постепенно выводит случайно инициализированную модель на рабочий LR и стабилизирует первые обновления. Cosine decay затем плавно уменьшает шаг для точной настройки к концу.

</details>

#### D18. Gradient accumulation: что меняется?


<details>
<summary><b>Ответ и критерии</b></summary>

Несколько micro-batches создают один optimizer step. Loss обычно делят на число accumulation steps. Это имитирует больший batch по градиенту, но не полностью воспроизводит всё поведение большого batch и медленнее по времени.

</details>

#### D19. Mixed precision: выгода и риск?


<details>
<summary><b>Ответ и критерии</b></summary>

Меньше activation/weight memory и быстрее tensor-core операции. FP16 рискует under/overflow, поэтому нужен scaling; BF16 имеет более широкий диапазон. Часть операций/states сохраняется FP32.

</details>

#### D20. Gradient clipping: где поставить при AMP?


<details>
<summary><b>Ответ и критерии</b></summary>

После backward нужно сначала unscale gradients, затем clip, затем optimizer step. Иначе сравниваем/обрезаем искусственно масштабированные градиенты.

</details>

#### D21. LoRA: что заморожено и что обучается?


<details>
<summary><b>Ответ и критерии</b></summary>

Исходный W заморожен; обучаются A и B низкого ранга в $\Delta W=(\alpha/r)BA$. Это уменьшает trainable parameters и optimizer memory, но не обязательно полностью устраняет память базы.

</details>

#### D22. QLoRA против обычной LoRA?


<details>
<summary><b>Ответ и критерии</b></summary>

В QLoRA замороженная база хранится/вычисляется в квантизованном представлении, а адаптеры обучаются с более высокой точностью. Это сильнее снижает memory footprint.

</details>

#### D23. SFT, DPO и RLHF — разные цели?


<details>
<summary><b>Ответ и критерии</b></summary>

SFT имитирует эталонные ответы. DPO учится предпочитать chosen rejected-парам относительно reference model. RLHF использует reward signal/model и RL для оптимизации поведения. Они не заменяют pre-training.

</details>

#### D24. Почему context length дорого увеличивать?


<details>
<summary><b>Ответ и критерии</b></summary>

Обычная score matrix attention имеет $T\times T$, поэтому память/вычисления attention растут квадратично. Кроме того, растут activation и KV-cache memory.

</details>

#### D25. Как оценивать генеративную LLM кроме validation loss?


<details>
<summary><b>Ответ и критерии</b></summary>

Нужен отдельный eval-набор, task-specific автоматические проверки, оценка качества/правдивости/безопасности, анализ ошибок и человеческая оценка. Проверяют утечки и memorization; latency/cost важны для продукта.

</details>

Вернуться: [[10 Знания/ML/02 Deep Learning/05 Тренажер/00 - Карта тренажера]].
