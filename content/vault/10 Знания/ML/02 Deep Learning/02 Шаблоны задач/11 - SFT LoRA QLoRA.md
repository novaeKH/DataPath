---
title: "Шаблон — SFT, LoRA и QLoRA"
tags:
  - deep-learning
  - llm
  - sft
  - lora
  - qlora
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-sft-lora-i-qlora
schema_version: 2
language: ru
app: source
---
# Шаблон — SFT, LoRA и QLoRA

SFT обучает causal LM продолжать инструкцию желаемым ответом.

## 1. Формат примера

```text
<instruction>
...
<response>
...
```

Для loss обычно учитывают токены ответа, а prompt и padding помечают `-100`.

```python
labels = input_ids.clone()
labels[attention_mask == 0] = -100
labels[:, :response_start_index] = -100
```

Если ответ начинается в разных местах, `response_start_index` нужно вычислять для каждого примера.

## 2. LoRA

```python
from peft import LoraConfig, TaskType, get_peft_model


lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules="all-linear",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
```

`target_modules` зависит от архитектуры. Вариант `"all-linear"` удобен для QLoRA-подобного охвата, но имена модулей и поддержку нужно проверить на выбранной модели.

## 3. QLoRA

Основная модель загружается в 4-bit, а LoRA-параметры обучаются в более высокой точности.

```python
import torch
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import prepare_model_for_kbit_training


compute_dtype = (
    torch.bfloat16
    if torch.cuda.is_bf16_supported()
    else torch.float16
)

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=compute_dtype,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=quantization_config,
    device_map="auto",
)

model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)
```

## 4. Один шаг

```python
outputs = model(
    input_ids=batch["input_ids"],
    attention_mask=batch["attention_mask"],
    labels=batch["labels"],
)

loss = outputs.loss
loss.backward()
optimizer.step()
optimizer.zero_grad(set_to_none=True)
```

Для accumulation/AMP: [[10 Знания/ML/02 Deep Learning/03 Диагностика и ускорение/02 - AMP accumulation clipping]].

## 5. Что сохранять

```python
model.save_pretrained("adapter")
tokenizer.save_pretrained("adapter")
```

Сохраняется adapter, а для загрузки также нужен совместимый base model.

## 6. Оценка

Validation loss недостаточно. Нужны:

- фиксированный набор prompts;
- task-specific метрики;
- проверка формата ответа;
- hallucination/factuality eval;
- safety и prompt-injection eval;
- сравнение base vs SFT/adapter;
- human review по заранее заданной рубрике.

## 7. Когда выбирать

| Подход | Когда |
|---|---|
| Full fine-tuning | модель небольшая, ресурсов достаточно |
| LoRA | base model помещается, нужно экономить память параметров/optimizer |
| QLoRA | base model не помещается в обычной точности, есть поддерживаемая GPU-среда |

## Типовые ошибки

- loss считается по padding;
- prompt тоже обучается как желаемый ответ без осознанного решения;
- неправильные `target_modules`;
- adapter сохранён без tokenizer/config;
- сравнение только по двум красивым примерам;
- train и valid содержат перефразировки одних инструкций;
- квантизация воспринимается как обучение всех 4-bit весов.

Официальные ссылки: [PEFT](https://huggingface.co/docs/peft/en/index), [PEFT Quantization](https://huggingface.co/docs/peft/developer_guides/quantization).
