---
title: "Шаблон — causal language model и StoryWeaver"
tags:
  - deep-learning
  - llm
  - causal-lm
  - storyweaver
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-causal-language-model-i-storyweaver
schema_version: 2
language: ru
app: source
---
# Шаблон — causal language model и StoryWeaver

Модель предсказывает следующий токен, видя только токены слева.

## Формы

```text
input_ids [B,T]
logits    [B,T,V]
targets   [B,T]
```

Соответствие:

```text
input position 0 → target token 1
input position 1 → target token 2
...
```

## Явный shift для собственной модели

```python
import torch.nn.functional as F


def causal_lm_step(model, batch, device):
    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)

    logits = model(
        input_ids=input_ids,
        attention_mask=attention_mask,
    )                                               # [B,T,V]

    shift_logits = logits[:, :-1, :].contiguous()
    shift_targets = input_ids[:, 1:].contiguous()
    shift_mask = attention_mask[:, 1:].bool()

    labels = shift_targets.masked_fill(~shift_mask, -100)

    loss = F.cross_entropy(
        shift_logits.view(-1, shift_logits.size(-1)),
        labels.view(-1),
        ignore_index=-100,
    )

    num_tokens = int((labels != -100).sum().item())
    return loss, num_tokens
```

Для `AutoModelForCausalLM` можно передавать `labels`; многие реализации выполняют shift внутри. Не делай второй shift поверх внутреннего.

## Dataset из непрерывного потока токенов

```python
class TokenBlockDataset(torch.utils.data.Dataset):
    def __init__(self, token_ids, context_length):
        self.token_ids = token_ids
        self.context_length = context_length

    def __len__(self):
        return (len(self.token_ids) - 1) // self.context_length

    def __getitem__(self, index):
        start = index * self.context_length
        stop = start + self.context_length

        input_ids = self.token_ids[start:stop]
        return {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "attention_mask": torch.ones(len(input_ids), dtype=torch.long),
        }
```

## Perplexity

```python
import math


perplexity = math.exp(valid_loss)
```

Сравнивать perplexity корректно только при сопоставимой токенизации и данных. Она не измеряет фактическую точность, полезность или безопасность текста.

## Генерация

```python
generated = model.generate(
    input_ids,
    max_new_tokens=120,
    do_sample=True,
    temperature=0.8,
    top_p=0.95,
    top_k=50,
)
```

```text
temperature ↑ → распределение менее острое
top-k       → оставить k лучших токенов
top-p       → оставить минимальный набор с суммой вероятностей p
```

## Что логировать

- train/valid loss;
- perplexity;
- learning rate;
- gradient norm;
- tokens/s;
- GPU memory;
- sample generation по фиксированным prompts;
- шаг и конфигурацию checkpoint.

## Sanity checks

1. Правильный ли shift?
2. Работает ли causal mask?
3. Игнорируется ли padding?
4. Может ли модель переобучить маленький набор?
5. Validation состоит из невиденных историй?
6. Не сравнивается ли perplexity разных tokenizer как одна величина?

## Карта StoryWeaver

```text
TinyStories-Instruct
→ tokenizer
→ blocks context=512
→ decoder-only Transformer
→ next-token cross-entropy
→ AdamW + scheduler
→ checkpoints
→ validation loss/perplexity
→ генерация по prompts
```

Для защиты:

- объясни, почему decoder-only;
- покажи `input → shifted target`;
- назови число слоёв, width, heads, KV heads, context;
- объясни effective batch в токенах;
- покажи train/valid curves и примеры по фиксированным prompts;
- честно отдели качество языка от фактической корректности.

Теория: [[10 Знания/ML/02 Deep Learning/04 Теория/05 - Обучение LLM]]. Практика: [[10 Знания/ML/02 Deep Learning/05 Тренажер/05 - Защита StoryWeaver]].

Официальный task recipe: [Hugging Face — Causal language modeling](https://huggingface.co/docs/transformers/tasks/language_modeling).
