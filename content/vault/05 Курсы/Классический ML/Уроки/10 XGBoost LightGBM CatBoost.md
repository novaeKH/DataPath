---
title: XGBoost, LightGBM и CatBoost
id: lesson.classic-ml.trees.libraries
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.trees
module_order: 3
lesson_order: 4
content_path: 10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md
skill_ids:
- ml.tree_ensembles
estimated_minutes: 55
difficulty: core
interactive_component: categorical-encoding-lab
source_ids:
- xgboost-paper
- lightgbm-paper
- catboost-paper
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# XGBoost, LightGBM и CatBoost

## Результат урока

- понять общую основу gradient-boosted trees
- различать ключевые оптимизации XGBoost, LightGBM и CatBoost
- выбирать библиотеку по данным и ограничениям

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Идея за 30 секунд"
    },
    {
      "type": "content",
      "source_heading": "Общая основа"
    },
    {
      "type": "content",
      "source_heading": "XGBoost: second-order objective"
    },
    {
      "type": "interactive",
      "component": "categorical-encoding-lab"
    },
    {
      "type": "content",
      "source_heading": "LightGBM: histograms и leaf-wise growth"
    },
    {
      "type": "content",
      "source_heading": "CatBoost: ordered categories и ordered boosting"
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
    },
    {
      "type": "content",
      "source_heading": "Простой пример"
    },
    {
      "type": "content",
      "source_heading": "Пример"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Как ordered target statistics CatBoost снижают leakage и чем это отличается от ordered boosting?"
    },
    {
      "type": "content",
      "source_heading": "Сравнение"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Для таблицы с большим числом категорий и 500 тысяч строк выбери стартовую библиотеку и план честного сравнения."
    },
    {
      "type": "content",
      "source_heading": "Практический tuning order"
    },
    {
      "type": "content",
      "source_heading": "Ответ для собеседования"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Чем XGBoost, LightGBM и CatBoost отличаются под капотом и на практике?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Как ordered target statistics CatBoost снижают leakage и чем это отличается от ordered boosting?
2. Для таблицы с большим числом категорий и 500 тысяч строк выбери стартовую библиотеку и план честного сравнения.
3. Чем XGBoost, LightGBM и CatBoost отличаются под капотом и на практике?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
