---
title: "MLE, MAP и оптимизация: мост от вероятности к обучению модели"
id: lesson.math-ds.likelihood
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.math-ds
module_id: module.math-ds.statistics
module_order: 4
lesson_order: 3
canonical_number: 33
content_path: 10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-033 MLE, MAP и оптимизация мост от вероятности к обучению модели.md
estimated_minutes: 50
difficulty: core
skill_ids:
- math.likelihood
prerequisites:
- lesson.math-ds.random-variables
- lesson.math-ds.expectation
previous: lesson.math-ds.hypothesis
next: lesson.data-tools.estimator-pipeline
tags:
- datapath/v2
- canonical/lesson
---
# MLE, MAP и оптимизация: мост от вероятности к обучению модели

## Результат урока

Разобрать каноническую главу №33, воспроизвести её ключевой механизм и оценить готовность объяснить тему.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "scenes": [
    {
      "type": "hook",
      "title": "Цель главы"
    },
    {
      "type": "visual_demo",
      "component": "likelihood-map-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «MLE, MAP и оптимизация: мост от вероятности к обучению модели» без подсказки?"
    }
  ]
}
```

## Применение в модели

Главный прикладной переход этого урока ведёт к [[040 Линейная регрессия — от прямой на графике до метода наименьших квадратов|линейной регрессии]]: Gaussian noise → MLE → least squares → MSE. Матричная часть опирается на [[023 Векторы и матрицы язык данных и моделей|векторы и матрицы]], а оптимизационная — на [[026 Производная, частные производные, градиент и правило цепочки|градиент]].
