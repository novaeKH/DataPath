---
type: project
area: ml
status: active
tags: [project, transformer, llm, storyweaver, interview]
title: "StoryWeaver"
id: project.ml.storyweaver
schema_version: 2
language: ru
rag: include
rag_collection: projects
app: source
---
# StoryWeaver

> [!summary] За 30 секунд
> Decoder-only Transformer на 125 857 536 параметров для генерации коротких английских историй по инструкции. Реализован pipeline от собственного byte-level BPE и 626 млн train tokens до обучения на 8 GB GPU, KV-cache generation и FastAPI.

Интервью: [[Projects — Interview#StoryWeaver — архитектура]]

## Конфигурация

| Параметр | Значение |
|---|---:|
| Layers / d_model | 18 / 768 |
| Q / KV heads | 12 / 4 |
| d_ff | 2048 |
| Context | 512 |
| Vocabulary | 16 384 |
| Parameters | 125 857 536 |

Компоненты: GQA, RoPE, RMSNorm, pre-norm residual, SwiGLU, tied embeddings.

## Objective

Модель предсказывает следующий токен:

```text
input  [t0, t1, ..., t511]
target [t1, t2, ..., t512]
```

Causal mask не позволяет видеть future tokens. Loss — cross-entropy по logits `[B,T,V]`; perplexity = `exp(loss)` при одинаковых tokenizer/data.

## Данные

- TinyStoriesInstruct;
- 2 476 533 train documents, 626 124 552 tokens;
- 25 027 validation documents, 6 319 650 tokens;
- BPE обучен только на train;
- binary `uint16` + `memmap`.

## Обучение на 8 GB

- micro-batch 1;
- accumulation 64 → 32 768 tokens/optimizer step;
- FP16 autocast + GradScaler;
- activation checkpointing;
- AdamW;
- warmup 1 000 steps + cosine decay;
- gradient clipping after unscale;
- checkpoint/resume.

## Текущий честный статус

В эталонной защите полный run находился на step 310: train loss снизился с 9.7157 на step 10 до 3.0591. Это признак исправного обучения, но не финальное качество: обработано около 1.62% одного прохода, требуются validation и fixed generation evaluation.

## Инженерная граница

Веса обучаются с нуля; архитектурный pipeline реализован на PyTorch. Autograd, SDPA, tokenizer library и FastAPI — готовые инструменты. Это современная комбинация известных компонентов, не новый алгоритм Transformer.

## Связи

- [[Projects — Interview]]
- [[04 - Токенизация attention Transformer]]
- [[05 - Обучение LLM]]
- [[10 - Causal LM и StoryWeaver]]
- [[05 - Защита StoryWeaver]]
