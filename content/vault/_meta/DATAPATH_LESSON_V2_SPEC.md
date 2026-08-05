---
title: DataPath Lesson V2 Spec
id: meta.learning-system.lesson-v2-spec
type: meta
area: learning-system
status: draft
schema_version: 2
language: ru
rag: exclude
app: exclude
updated: '2026-08-05'
---

# DataPath Lesson V2 Spec

## Цель

Lesson должен обучать, а не только показывать короткие fragments и три пустые проверки.

## Нормальная композиция

Для урока 30–55 минут ориентир:

- 5–9 содержательных theory scenes;
- 1 worked example;
- 1 visual demonstration для mechanism, если она полезна;
- 2–4 checkpoint, interleaved после связанной theory;
- 1 application micro-task;
- 1 short interview answer;
- summary в конце, не в начале.

## Checkpoint schema

```json
{
  "type": "checkpoint",
  "id": "checkpoint.ml.validation.group-split",
  "question": "Какой split нужен, если у пользователя несколько строк?",
  "answer_type": "single-choice",
  "options": [
    {"id": "a", "text": "RandomSplit"},
    {"id": "b", "text": "Group split по user_id"},
    {"id": "c", "text": "Fit scaler на всех данных"}
  ],
  "correct_option_ids": ["b"],
  "explanation": "Все строки одного пользователя должны находиться в одном fold.",
  "skill_ids": ["ml.validation_split"]
}
```

Backend хранит correct answer/evaluation, attempt и completion. Frontend только отображает interaction.

## Progress compatibility

Lesson ID стабилен. Scene/checkpoint IDs детерминированы по lesson ID и semantic role. При redesign нужна mapping legacy scene ID → current scene ID или сохранение completion на уровне semantic checkpoint/content section.

## Beginner theory rule

Первое упоминание термина содержит простое определение. Формула сопровождается:

1. словами;
2. определением всех symbols;
3. маленьким numerical example;
4. interpretation;
5. failure mode.
