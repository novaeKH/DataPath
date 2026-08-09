---
title: Decision Tree без магии
id: lesson.classic-ml.trees.tree
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
lesson_order: 1
content_path: 10 Знания/ML/01 Classical ML/Decision Trees.md
skill_ids:
- ml.tree_ensembles
estimated_minutes: 45
difficulty: core
interactive_component: decision-tree-split-lab
source_ids:
- sklearn-user-guide
- islr
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Decision Tree без магии

## Результат урока

- понять рекурсивные splits и prediction в leaf
- посчитать impurity decrease
- объяснить overfit и ограничения дерева

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Decision Trees.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "interactive",
      "component": "decision-tree-split-lab"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему дерево выбирает split жадно и как считается weighted child impurity?"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Посчитай Gini и Gain для маленького candidate split и реши, полезен ли он."
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Как дерево выбирает split, почему переобучается и как его regularize?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему дерево выбирает split жадно и как считается weighted child impurity?
2. Посчитай Gini и Gain для маленького candidate split и реши, полезен ли он.
3. Как дерево выбирает split, почему переобучается и как его regularize?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
