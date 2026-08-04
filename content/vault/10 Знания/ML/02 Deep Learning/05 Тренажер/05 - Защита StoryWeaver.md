---
title: "Защита StoryWeaver"
tags:
  - deep-learning
  - practice
  - interview
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.zashchita-storyweaver
schema_version: 2
language: ru
app: source
---
# Защита StoryWeaver

## E. Защита StoryWeaver — 15 баллов

Отвечай как автор проекта: **задача → решение → проверка → ограничение**.

### E1. Ответ о проекте за 60 секунд

> StoryWeaver — учебная decoder-only языковая модель примерно на 126 млн параметров, которую я обучил с нуля на TinyStories-Instruct для генерации коротких историй. Архитектура содержит 18 Transformer-блоков, hidden size 768, 12 query-heads и 4 KV-heads, то есть использует grouped-query attention; context length — 512. Модель обучается предсказывать следующий токен через cross-entropy. Я настроил preprocessing, checkpoints, warmup и дальнейшее уменьшение learning rate, отслеживал train/validation loss, perplexity и качественные примеры генерации. К шагу около 6000 validation loss снизился до 1.156, perplexity — примерно до 3.18. Проект дал мне практическое понимание полного пути от токенов и causal attention до обучения и inference. Ограничение: perplexity не гарантирует качество историй, поэтому нужны отдельный набор промптов, проверка memorization и более системная оценка текста.

Не заучивай дословно. Ты должен уметь раскрыть каждую фразу.

### E2. Пятнадцать уточнений

    По 1 баллу за уверенный ответ.

    1. Почему decoder-only, а не BERT?
    2. Как из истории получаются input/target?
    3. Какова форма logits при `(B, 512)` и vocab size `V`?
    4. Почему нужен causal mask?
    5. Что означают 12 Q-heads и 4 KV-heads?
    6. Зачем context length 512 и каков компромисс?
    7. Откуда берутся примерно 126 млн параметров?
    8. Что измеряют cross-entropy и perplexity?
    9. Почему train loss может быть шумнее validation loss?
    10. Зачем warmup?
    11. Что обязательно лежит в checkpoint?
    12. Как продолжить обучение точно с нужного шага?
    13. Как temperature/top-k меняют истории?
    14. Как проверить memorization и качество?
    15. Что улучшать первым и почему?

<details>
<summary><b>Опорные ответы</b></summary>

1. Задача — autoregressive generation, поэтому causal decoder соответствует objective.
2. Targets — последовательность, сдвинутая на один токен вправо.
3. `(B, 512, V)` либо `(B, 511, V)` после явного сдвига исходного batch.
4. Иначе модель увидит правильный будущий токен и получит leakage.
5. GQA: 12 query heads делят 4 набора K/V, что уменьшает KV-cache.
6. Больше контекст — длиннее зависимости, но дороже attention/activation/cache.
7. Embeddings + 18 блоков (attention/MLP/norms) + head; показать приблизительный расчёт.
8. Средняя ошибка следующего токена; PPL = exp(loss), но не метрика «хорошей истории».
9. На train действуют mini-batch noise/Dropout и метрика измеряется в процессе обновлений; validation считается целиком в eval на фиксированных весах.
10. Стабилизировать первые шаги случайно инициализированного Transformer.
11. Model/optimizer/scheduler/scaler state, step, config, tokenizer/data version, RNG при строгом resume.
12. Восстановить все states и sampler/RNG, а не только веса.
13. Меньшая temperature/top-k — предсказуемее; большая/широкий набор — разнообразнее, но больше ошибок.
14. Сравнение с train-фрагментами, held-out prompts, разнообразие, coherence, ручная/автоматическая rubric.
15. Ответ должен исходить из ошибок: данные, objective/eval, sampling, architecture или compute — не случайная смена гиперпараметров.

</details>

### Итоговая оценка

| Результат | Интерпретация |
|---:|---|
| 90–100 | уверенный уровень DL-блока стажировки |
| 80–89 | готов, но повторить слабые подразделы |
| 65–79 | фундамент есть, уточнения будут опасны |
| <65 | вернуться к основному ноутбуку |

Дополнительное условие: в блоках **C** и **D** должно быть не менее 80%. Для LLM-позиции одних определений недостаточно — нужны формы тензоров и исправление кода.

Вернуться: [[10 Знания/ML/02 Deep Learning/05 Тренажер/00 - Карта тренажера]].
