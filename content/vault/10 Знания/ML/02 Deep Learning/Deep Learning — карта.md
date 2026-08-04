---
title: Deep Learning — карта
type: moc
area: dl
status: active
aliases:
  - Universal Deep Learning Pipeline
tags:
  - dl/navigation
  - pytorch
rag: exclude
id: moc.dl.deep-learning-karta
schema_version: 2
language: ru
app: exclude
---
# Deep Learning — карта

[[Главная|← На главную]] · [[ML — карта знаний|ML]] · [[Deep Learning — схема|Схема]]

## Knowledge

1. [[Neural Networks and Backpropagation]] — neuron, Linear layer, activations, forward, loss, computational graph, chain rule и backprop.
2. [[Optimization and Regularization in Deep Learning]] — SGD, Momentum, Adam/AdamW, initialization, normalization, dropout и training stability.
3. [[Embeddings and Attention]] — embeddings, Q/K/V, scaling, masks, softmax, weighted sum и multi-head.
4. [[Transformer and Language Modeling]] — positional information, residual/LayerNorm/FFN, causal LM, cross-entropy и generation.
5. [[03 - CNN RNN LSTM GRU]] — legacy compact architecture overview; canonical split отложен до отдельной необходимости.

## Practice — решить задачу

1. [[00 - Карта выбора шаблона|Выбрать шаблон]]
2. [[01 - Паспорт задачи и честный split|Заполнить паспорт]]
3. [[02 - Формы dtype logits loss|Проверить формы и loss]]
4. [[03 - Dataset и DataLoader]]
5. [[04 - Универсальный train-valid каркас]]
6. [[05 - Метрики checkpoint и final test]]

### Task templates

- [[01 - Бинарная классификация]]
- [[02 - Многоклассовая классификация]]
- [[03 - Multilabel классификация]]
- [[04 - Регрессия]]
- [[05 - Классификация изображений]]
- [[06 - Классификация текста Transformer]]
- [[07 - NER token classification]]
- [[08 - Embeddings и retrieval]]
- [[09 - Reranking]]
- [[10 - Causal LM и StoryWeaver]]
- [[11 - SFT LoRA QLoRA]]

## Practice — диагностика

- [[01 - Диагностика от симптома]]
- [[02 - AMP accumulation clipping]]
- [[03 - CUDA OOM и ускорение]]
- [[04 - Утечки и проверка данных]]
- [[01 - Карточка эксперимента]]
- [[02 - Чек-лист DL проекта]]
- [[03 - Сниппеты PyTorch]]

## Interview

- [[Deep Learning — Interview]]
- [[NLP and Transformers — Interview]]
- [[00 - Карта тренажера|DL-тренажёр]]
- [[06 - Финальное мини-собеседование]]

## Legacy course references

- [[00 - Карта теории]] — canonical route плюс сохранённые расширенные course notes.

> [!important] Evaluation contract
> `train` обучает параметры → `validation` принимает решения → `test` используется один раз после фиксации pipeline.
