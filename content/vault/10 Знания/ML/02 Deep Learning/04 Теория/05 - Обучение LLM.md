---
title: "Обучение и диагностика LLM"
type: source
area: dl
status: deprecated
tags:
  - deep-learning
  - theory
  - interview
rag: exclude
id: source.dl.obuchenie-i-diagnostika-llm
schema_version: 2
language: ru
app: exclude
---
# Обучение и диагностика LLM

> [!info] Legacy course note
> Canonical theory: [[Transformer and Language Modeling]] и [[Optimization and Regularization in Deep Learning]]. Файл сохранён как расширенный reference и исключён из RAG из-за multi-topic и cross-note code dependencies.

> [!tip] Закрепление
> После этой заметки: [[10 Знания/ML/02 Deep Learning/05 Тренажер/04 - Transformer и LLM]] · [[10 Знания/ML/02 Deep Learning/05 Тренажер/05 - Защита StoryWeaver]].

## 13. Decoder-only LLM: обучение и генерация

### 13.1. Causal language modeling

Из последовательности токенов:

```text
[BOS, жил, был, кот, EOS]
```

строим:

```text
input:  [BOS, жил, был, кот]
target: [жил, был, кот, EOS]
```

Если input `(B, T)`, модель выдаёт logits `(B, T, V)`, где $V$ — vocabulary size. Для cross-entropy:

```python
loss = F.cross_entropy(
    logits.reshape(-1, V),
    targets.reshape(-1)
)
```

Targets — индексы класса типа `long`, не one-hot.

```python
class TinyCausalLM(nn.Module):
    def __init__(
        self,
        vocabulary_size: int,
        context_length: int,
        model_dimension: int = 64,
        number_of_heads: int = 4,
        number_of_layers: int = 2,
    ) -> None:
        super().__init__()
        self.context_length = context_length
        self.token_embedding = nn.Embedding(
            vocabulary_size,
            model_dimension,
        )
        self.position_embedding = nn.Embedding(
            context_length,
            model_dimension,
        )
        self.blocks = nn.ModuleList([
            TinyDecoderBlock(
                model_dimension=model_dimension,
                number_of_heads=number_of_heads,
                feed_forward_dimension=4 * model_dimension,
            )
            for _ in range(number_of_layers)
        ])
        self.final_norm = nn.LayerNorm(model_dimension)
        self.lm_head = nn.Linear(
            model_dimension,
            vocabulary_size,
            bias=False,
        )

        # Weight tying: одна матрица для входных embeddings и lm_head.
        self.lm_head.weight = self.token_embedding.weight

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        batch_size, sequence_length = input_ids.shape
        if sequence_length > self.context_length:
            raise ValueError("Последовательность длиннее context_length.")

        positions = torch.arange(
            sequence_length,
            device=input_ids.device,
        )
        hidden_states = (
            self.token_embedding(input_ids)
            + self.position_embedding(positions)[None, :, :]
        )

        for block in self.blocks:
            hidden_states = block(hidden_states)

        hidden_states = self.final_norm(hidden_states)
        return self.lm_head(hidden_states)


tiny_lm = TinyCausalLM(
    vocabulary_size=100,
    context_length=32,
)

token_batch = torch.randint(0, 100, (4, 17))
inputs = token_batch[:, :-1]
targets = token_batch[:, 1:]
logits = tiny_lm(inputs)

language_model_loss = nn.functional.cross_entropy(
    logits.reshape(-1, logits.size(-1)),
    targets.reshape(-1),
)

print("Inputs:", inputs.shape)
print("Targets:", targets.shape)
print("Logits:", logits.shape)
print("Loss:", round(language_model_loss.item(), 4))
```

### 13.2. Perplexity

Для средней token-level cross-entropy $L$:

$$
PPL=e^L.
$$

Меньше — модель в среднем увереннее в правильном следующем токене. Например:

$$
e^{1.1561}\approx3.18.
$$

Это соответствует validation loss StoryWeaver около шага 6000. Perplexity не измеряет напрямую фактическую точность, полезность или качество истории и зависит от данных/токенизатора.

```python
validation_loss = 1.1561
perplexity = math.exp(validation_loss)
print("Perplexity:", round(perplexity, 2))
```

### 13.3. Autoregressive generation

Обучение вычисляет logits всех позиций параллельно, потому что targets известны. Генерация последовательна:

```text
контекст → следующий токен → добавить → снова forward
```

Способы выбрать токен:

- greedy: `argmax`, детерминированно, может быть однообразно;
- temperature $T$: logits делят на $T$; $T<1$ делает распределение острее;
- top-k: оставляет k наиболее вероятных;
- top-p: оставляет минимальный набор с суммарной вероятностью не меньше p.

KV-cache сохраняет keys/values прошлых токенов и не пересчитывает их на каждом шаге. Квантизация уменьшает память/иногда ускоряет inference.

```python
def sample_next_token(
    next_token_logits: torch.Tensor,
    temperature: float = 1.0,
    top_k: int | None = None,
) -> torch.Tensor:
    if temperature <= 0:
        raise ValueError("temperature должна быть положительной.")

    scaled_logits = next_token_logits / temperature

    if top_k is not None:
        top_k = min(top_k, scaled_logits.size(-1))
        threshold = torch.topk(
            scaled_logits,
            top_k,
            dim=-1,
        ).values[..., -1, None]
        scaled_logits = scaled_logits.masked_fill(
            scaled_logits < threshold,
            float("-inf"),
        )

    probabilities = torch.softmax(scaled_logits, dim=-1)
    return torch.multinomial(probabilities, num_samples=1)


example_logits = torch.tensor([[2.0, 1.0, 0.0, -1.0]])
torch.manual_seed(SEED)
print(sample_next_token(example_logits, temperature=0.8, top_k=3))
```

#### Проверь себя

1. Почему targets сдвинуты на один токен?
2. Что означает perplexity 3.18?
3. Почему фраза «Transformer всегда параллелен» неточна?

<details>
<summary><b>Ответ</b></summary>

Модель на каждой позиции учится предсказывать следующий токен. Perplexity 3.18 — экспонента средней token-level NLL; грубо модель имеет неопределённость уровня нескольких вариантов, но это не буквальное число кандидатов и не оценка качества текста. При обучении позиции можно считать параллельно, но autoregressive inference генерирует токены последовательно.

</details>

## 14. Обучение и fine-tuning LLM

### 14.1. Этапы

- **Pre-training:** next-token prediction на большом корпусе.
- **SFT:** обучение на парах instruction → desired response.
- **Preference alignment:** учёт предпочтений/награды.
  - RLHF обычно включает reward model и RL;
  - DPO напрямую оптимизирует предпочтение chosen над rejected относительно reference model;
  - GRPO — RL-метод, оценивающий ответы относительно группы сэмплов без отдельного value model.

Для стажёрского собеседования важно понимать цель и входные данные каждого этапа, а не выводить все формулы RL.

### 14.2. Gradient accumulation

Если один micro-batch не помещается в GPU, накапливаем градиенты:

```python
optimizer.zero_grad()
for micro_step in range(accumulation_steps):
    with autocast:
        loss = model_loss(...) / accumulation_steps
    loss.backward()
clip_grad_norm_(...)
optimizer.step()
```

Деление loss сохраняет средний масштаб градиента. Эффективный batch:

$$
B_{effective}
=
B_{micro}\times N_{accum}\times N_{devices}.
$$

Обновление optimizer/scheduler обычно происходит после accumulation, а не после каждого micro-batch.

### 14.3. Mixed precision

FP16/BF16 уменьшают память и ускоряют матричные операции. Чувствительные операции/состояния часто остаются FP32.

- FP16 имеет узкий диапазон и часто использует gradient scaling;
- BF16 имеет диапазон, близкий к FP32, и обычно стабильнее на поддерживаемом железе.

При AMP сначала делают `unscale_`, затем gradient clipping.

### 14.4. LoRA и QLoRA

Замораживаем исходную матрицу $W\in\mathbb{R}^{d_{out}\times d_{in}}$ и обучаем низкоранговую поправку:

$$
W' = W + \frac{\alpha}{r}BA,
\quad
A\in\mathbb{R}^{r\times d_{in}},
\quad
B\in\mathbb{R}^{d_{out}\times r}.
$$

Вместо $d_{out}d_{in}$ обучаем $r(d_{in}+d_{out})$ параметров. Обычно $B$ инициализируют нулями, чтобы в начале $\Delta W=0$.

LoRA уменьшает число **обучаемых** параметров и optimizer states, но базовая модель всё равно занимает память. QLoRA хранит замороженную базу в низкой битности и обучает LoRA-адаптеры, что дополнительно уменьшает память.

```python
class LoRALinear(nn.Module):
    def __init__(
        self,
        base_layer: nn.Linear,
        rank: int,
        alpha: float,
    ) -> None:
        super().__init__()
        self.base_layer = base_layer
        self.rank = rank
        self.scale = alpha / rank

        for parameter in self.base_layer.parameters():
            parameter.requires_grad = False

        self.lora_a = nn.Parameter(
            torch.empty(rank, base_layer.in_features)
        )
        self.lora_b = nn.Parameter(
            torch.zeros(base_layer.out_features, rank)
        )
        nn.init.kaiming_uniform_(self.lora_a, a=math.sqrt(5))

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        base_output = self.base_layer(inputs)
        adapter_output = (inputs @ self.lora_a.T) @ self.lora_b.T
        return base_output + self.scale * adapter_output


base = nn.Linear(768, 768, bias=False)
lora_layer = LoRALinear(base, rank=8, alpha=16)

trainable = sum(
    p.numel() for p in lora_layer.parameters()
    if p.requires_grad
)
total = sum(p.numel() for p in lora_layer.parameters())

print("Total parameters:", total)
print("Trainable parameters:", trainable)
print("Trainable share:", f"{100 * trainable / total:.2f}%")
```

### 14.5. Что логировать и как оценивать

Минимум:

- train/validation loss и perplexity;
- learning rate и gradient norm;
- tokens/sec, память, время;
- task-specific метрики и качественные примеры;
- конфигурацию, seed и версию данных;
- checkpoints.

Loss не заменяет evaluation:

- для классификатора нужны F1/PR-AUC и анализ классов;
- для генерации — отдельный eval-набор, автоматические проверки и человеческая оценка;
- нельзя подбирать решения по test;
- необходимо проверять дубликаты и пересечения train/validation.

### 14.6. Checkpointing и память

- gradient checkpointing экономит память активаций, пересчитывая часть forward во время backward;
- optimizer states Adam часто занимают больше памяти, чем кажется по числу весов;
- activation memory растёт с batch, sequence length и числом слоёв;
- attention scores растут квадратично по sequence length.

#### Проверь себя

1. Чем LoRA отличается от QLoRA?
2. Зачем делить loss при gradient accumulation?
3. Что экономит gradient checkpointing и какой ценой?

<details>
<summary><b>Ответ</b></summary>

LoRA обучает низкоранговые адаптеры при замороженной базе; QLoRA дополнительно хранит базу в квантизованном виде. Деление loss сохраняет масштаб среднего градиента, сопоставимый с большим batch. Checkpointing уменьшает память на активации, но увеличивает вычисления из-за повторного forward.

</details>

## 15. Диагностика обучения

| Симптом | Сначала проверить | Возможные решения |
|---|---|---|
| Loss не снижается | targets, shapes, LR, `.grad`, данные | исправить pipeline, LR, capacity |
| Loss = NaN/inf | NaN во входе, LR, norm градиента | очистка данных, меньший LR, clipping |
| Train хорошо, valid плохо | split, leakage, переобучение | данные, regularization, early stop |
| Train и valid плохи | слабая модель, признаки, LR | capacity, оптимизация, постановка |
| Valid меняется при повторе | `eval()`, seed, shuffle | режимы, детерминизм |
| GPU OOM | batch, sequence, activations | micro-batch, accumulation, AMP, checkpointing |
| Генерация повторяется | sampling, данные, collapse | temperature/top-p, training/eval |
| Очень медленный inference | KV-cache, batch, precision | cache, batching, quantization |

Диагностический порядок:

1. Переобучить один маленький batch почти до нулевого loss.
2. Проверить формы/dtypes/device и несколько `(input, target)`.
3. Посмотреть градиенты и learning rate.
4. Только затем менять архитектуру.

### 15.1. Ответы, которые нужно уметь дать за 30–60 секунд

- Что делает backpropagation?
- Почему `BCEWithLogitsLoss` лучше sigmoid + BCE вручную?
- Adam против AdamW.
- Dropout/BatchNorm/LayerNorm и train/eval.
- Vanishing/exploding gradients и способы борьбы.
- Как меняется форма после Linear/Conv/attention.
- RNN против LSTM/GRU.
- Q/K/V и causal mask.
- Encoder BERT против decoder GPT.
- Как из текста получается LM loss.
- Perplexity и её ограничения.
- Gradient accumulation, mixed precision, clipping.
- LoRA против QLoRA.

### 15.2. Граница DL, RAG и AI Agents

После этого курса:

- **RAG** добавляет indexing, embeddings, retrieval, reranking и grounded generation;
- **AI agent** добавляет состояние, tools, правила переходов, memory, retries, permissions и human-in-the-loop;
- безопасность добавляет prompt-injection defense, разграничение доступа, sandboxing, audit и evals.

Это следующие отдельные блоки. Их нельзя заменить знанием Transformer, но теперь у тебя есть фундамент для понимания модели внутри системы.

### Финальный чек-лист

Тема закрыта на уровень стажировки, если ты без конспекта:

- [ ] объясняешь forward/backward и вручную считаешь простой градиент;
- [ ] считаешь параметры Linear/Conv/Embedding;
- [ ] определяешь формы тензоров в MLP, CNN, RNN и attention;
- [ ] выбираешь output/loss/target для трёх видов классификации;
- [ ] пишешь цикл PyTorch и не допускаешь leakage;
- [ ] объясняешь regularization и режимы train/eval;
- [ ] объясняешь CNN/RNN на концептуальном уровне;
- [ ] рисуешь decoder block и проход Q/K/V;
- [ ] объясняешь shifted targets, perplexity и sampling;
- [ ] объясняешь warmup, accumulation, AMP, clipping, LoRA/QLoRA;
- [ ] связываешь всё это с конфигурацией и логами StoryWeaver.

Затем пройди второй ноутбук. Если набираешь меньше 80%, вернись только к отмеченным модулям.

### Короткие видео для закрепления

Видео — дополнение, а не замена задачам.

- [Backpropagation intuitively — 3Blue1Brown](https://www.youtube.com/watch?v=Ilg3gGewQ5U)
- [Backpropagation calculus — 3Blue1Brown](https://www.youtube.com/watch?v=tIeHLnjs5U8)
- [Transformers — 3Blue1Brown](https://www.youtube.com/watch?v=wjZofJX0v4M)
- [Attention step by step — 3Blue1Brown](https://www.youtube.com/watch?v=eMlx5fFNoYc)
- [Let’s build GPT from scratch — Andrej Karpathy](https://www.youtube.com/watch?v=kCc8FmEb1nY)
- [Tokenizers overview — Hugging Face](https://www.youtube.com/watch?v=VFp38yj8h3A)

Полезная документация:

- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/)

Вернуться: [[10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории]].
