---
title: Bagging и Random Forest
id: lesson.classic-ml.trees.forest
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
lesson_order: 2
content_path: 10 Знания/ML/01 Classical ML/Bagging and Random Forest.md
skill_ids:
- ml.tree_ensembles
- ml.bias_variance_regularization
estimated_minutes: 45
difficulty: core
interactive_component: bootstrap-forest-lab
source_ids:
- sklearn-user-guide
- islr
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Bagging и Random Forest

## Результат урока

- понять bootstrap, bagging и feature subsampling
- объяснить снижение variance
- использовать OOB и ограничения importance

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Bagging and Random Forest.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "interactive",
      "component": "bootstrap-forest-lab"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему усреднение одинаково коррелированных trees почти не снижает variance?"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Выбери max_features, depth и число trees для noisy tabular baseline и объясни порядок tuning."
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Чем Random Forest отличается от одного дерева и boosting?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему усреднение одинаково коррелированных trees почти не снижает variance?
2. Выбери max_features, depth и число trees для noisy tabular baseline и объясни порядок tuning.
3. Чем Random Forest отличается от одного дерева и boosting?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
