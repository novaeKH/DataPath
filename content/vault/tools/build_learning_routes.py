"""Build deterministic source-backed DataPath course manifests.

The educational material stays canonical in ``10 Знания``. This script only
creates the compact application layer: course → module → lesson route.
"""

from __future__ import annotations

import json
from pathlib import Path

VAULT = Path(__file__).resolve().parents[1]
COURSES = VAULT / "05 Курсы"


def quoted(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def filename(value: str) -> str:
    return value.replace("/", "-").replace(":", " —")


COURSE_DEFINITIONS = [
    {
        "folder": "Математика для Data Science",
        "id": "course.math-ds",
        "title": "Математика для Data Science",
        "area": "math",
        "hours": 16,
        "accent": "cyan",
        "icon": "sigma",
        "modules": [
            ("linear-algebra", "Линейная алгебра", [
                ("linear-algebra", "Векторы, dot product и матрицы", "10 Знания/Математика/03 Линейная алгебра/Linear Algebra for ML.md", "tensor-shape-tracer"),
                ("eigen-pca", "Eigenvectors, covariance и связь с PCA", "10 Знания/Математика/03 Линейная алгебра/Eigenvalues Covariance Matrix and PCA Foundations.md", "pca-projection-lab"),
                ("svd", "SVD и low-rank представления", "10 Знания/Математика/03 Линейная алгебра/Singular Value Decomposition.md", None),
            ]),
            ("calculus", "Производные и оптимизация", [
                ("gradients", "Derivative, partial derivative, gradient и chain rule", "10 Знания/Математика/04 Оптимизация/Gradients Chain Rule and Optimization.md", "gradient-descent-landscape"),
            ]),
            ("probability", "Теория вероятностей", [
                ("random-variables", "Random variables и distributions", "10 Знания/Математика/01 Вероятность/Random Variables and Distributions.md", None),
                ("expectation", "Expectation, variance, covariance и correlation", "10 Знания/Математика/01 Вероятность/Expectation Variance Covariance and Correlation.md", None),
                ("bayes", "Conditional probability и Bayes theorem", "10 Знания/Математика/01 Вероятность/Conditional Probability and Bayes Theorem.md", "naive-bayes-evidence-lab"),
            ]),
            ("statistics", "Математическая статистика", [
                ("lln-clt", "LLN, CLT и standard error", "10 Знания/Математика/02 Статистика/LLN CLT and Standard Error.md", None),
                ("hypothesis", "Confidence intervals, hypothesis testing и p-value", "10 Знания/Математика/02 Статистика/Hypothesis Testing and Confidence Intervals.md", None),
                ("likelihood", "Likelihood, MLE и MAP", "10 Знания/Математика/02 Статистика/Likelihood MLE and MAP.md", None),
                ("ab-testing", "A/B testing basics", "10 Знания/ML/05 Metrics and Validation/A-B Testing.md", None),
            ]),
        ],
    },
    {
        "folder": "SQL и scikit-learn",
        "id": "course.data-tools",
        "title": "SQL и scikit-learn — практический инструментарий DS",
        "area": "data-tools",
        "hours": 12,
        "accent": "indigo",
        "icon": "database",
        "modules": [
            ("sql", "SQL от SELECT до window functions", [
                ("sql-foundations", "SQL: SELECT, WHERE, GROUP BY, JOIN и CTE", "10 Знания/Инструменты/SQL Основы.md", None),
                ("sql-analytics", "SQL: CASE, dates, ranking и interview patterns", "10 Знания/Инструменты/SQL Analytical Patterns and Interviews.md", None),
            ]),
            ("sklearn", "scikit-learn workflow", [
                ("estimator-pipeline", "Estimator API, ColumnTransformer и Pipeline", "10 Знания/ML/07 sklearn/sklearn Estimator Pipeline CV and Tuning.md", "pipeline-builder-lab"),
                ("preprocessing", "Preprocessing и feature engineering", "10 Знания/ML/01 Classical ML/Data Preprocessing and Feature Engineering.md", "preprocessing-pipeline-builder"),
                ("cv-tuning", "Cross-validation и hyperparameter tuning", "10 Знания/ML/01 Classical ML/Model Selection and Hyperparameter Tuning.md", "hyperparameter-search-landscape"),
            ]),
        ],
    },
    {
        "folder": "NLP",
        "id": "course.nlp",
        "title": "NLP — от TF-IDF до BERT",
        "area": "nlp",
        "hours": 10,
        "accent": "pink",
        "icon": "text",
        "modules": [
            ("foundations", "Классический NLP", [
                ("classical", "Tokenization, Bag of Words, TF-IDF и Word2Vec", "10 Знания/ML/04 NLP/Classical NLP Foundations.md", None),
            ]),
            ("sequences", "Sequence models и embeddings", [
                ("rnn", "RNN, LSTM и GRU для последовательностей", "10 Знания/ML/02 Deep Learning/04 Теория/Recurrent Networks LSTM and GRU.md", "rnn-state-gates-lab"),
                ("attention", "Embeddings и attention", "10 Знания/ML/02 Deep Learning/04 Теория/Embeddings and Attention.md", "attention-matrix-lab"),
            ]),
            ("transformers", "Transformer models", [
                ("bert-evaluation", "Transformers, BERT-style models и NLP evaluation", "10 Знания/ML/04 NLP/Transformers BERT and NLP Evaluation.md", "transformer-block-lab"),
            ]),
        ],
    },
    {
        "folder": "LLM и RAG",
        "id": "course.llm-rag",
        "title": "LLM и RAG — локальные retrieval-системы",
        "area": "llm-rag",
        "hours": 12,
        "accent": "amber",
        "icon": "sparkles",
        "modules": [
            ("llm", "LLM mechanics", [
                ("inference", "Inference, context window, prompting и structured output", "10 Знания/ML/06 LLM и RAG/LLM Inference Context and Prompting.md", "transformer-block-lab"),
            ]),
            ("retrieval", "Retrieval and RAG", [
                ("retrieval", "Chunking, BM25, dense, hybrid, RRF и reranking", "10 Знания/ML/06 LLM и RAG/Retrieval BM25 Dense Hybrid Reranking.md", None),
                ("rag", "RAG architecture, evaluation и hallucinations", "10 Знания/ML/06 LLM и RAG/RAG Architecture Evaluation and Hallucinations.md", None),
            ]),
            ("agents", "Agents and local models", [
                ("agents", "Agents, tool use, memory и local LLM", "10 Знания/ML/06 LLM и RAG/Agents Tools Memory and Local LLM.md", None),
            ]),
        ],
    },
    {
        "folder": "MLOps",
        "id": "course.mlops",
        "title": "MLOps — воспроизводимость, serving и monitoring",
        "area": "mlops",
        "hours": 9,
        "accent": "emerald",
        "icon": "activity",
        "modules": [
            ("experiments", "Experiments and artifacts", [
                ("reproducibility", "Experiment tracking, reproducibility и versioning", "10 Знания/MLOps/Experiments Reproducibility and Versioning.md", None),
            ]),
            ("serving", "Serving and deployment", [
                ("serving", "FastAPI, Docker и deployment lifecycle", "10 Знания/MLOps/FastAPI Docker and Deployment Lifecycle.md", None),
            ]),
            ("monitoring", "Monitoring and retraining", [
                ("monitoring", "Logging, drift, model quality и retraining", "10 Знания/MLOps/Monitoring Drift Logging and Retraining.md", None),
            ]),
        ],
    },
    {
        "folder": "Python и алгоритмы",
        "id": "course.algorithms",
        "title": "Python и алгоритмы для собеседований",
        "area": "algorithms",
        "hours": 24,
        "accent": "blue",
        "icon": "braces",
        "modules": [
            ("complexity", "Big O и базовые структуры", [
                ("big-o", "Big O, Theta и оценка сложности", "10 Знания/Алгоритмы/01_Big_O.md", None),
                ("arrays-strings", "Arrays, strings и sorting", "10 Знания/Алгоритмы/02_Array_String_Sorting.md", None),
                ("hash", "Dict, set и frequency map", "10 Знания/Алгоритмы/03_Hash_Map_и_Frequency_Map.md", None),
            ]),
            ("patterns", "Основные паттерны", [
                ("two-pointers", "Two pointers", "10 Знания/Алгоритмы/04_Two_Pointers.md", None),
                ("sliding-window", "Sliding window", "10 Знания/Алгоритмы/05_Sliding_Window.md", None),
                ("prefix-sum", "Prefix sum", "10 Знания/Алгоритмы/06_Prefix_Sum.md", None),
                ("binary-search", "Binary search", "10 Знания/Алгоритмы/07_Binary_Search.md", None),
                ("stack-queue", "Stack, queue и deque", "10 Знания/Алгоритмы/08_Stack_Queue_Deque.md", None),
                ("intervals", "Intervals", "10 Знания/Алгоритмы/10_Intervals.md", None),
            ]),
            ("structures", "Связные структуры", [
                ("heap", "Heap и Top K", "10 Знания/Алгоритмы/11_Heap_и_Top_K.md", None),
                ("linked-list", "Linked lists", "10 Знания/Алгоритмы/12_Linked_List.md", None),
                ("recursion", "Recursion и backtracking", "10 Знания/Алгоритмы/13_Recursion_Backtracking.md", None),
                ("trees", "Trees, BFS и DFS", "10 Знания/Алгоритмы/14_Trees_BFS_DFS.md", None),
            ]),
            ("graphs-dp", "Graphs, greedy и DP", [
                ("matrix", "Matrix и grid", "10 Знания/Алгоритмы/15_Matrix_и_Grid.md", None),
                ("graphs", "Graphs", "10 Знания/Алгоритмы/16_Graphs.md", None),
                ("greedy", "Greedy", "10 Знания/Алгоритмы/17_Greedy.md", None),
                ("dp", "Dynamic programming", "10 Знания/Алгоритмы/18_Dynamic_Programming_Basics.md", None),
            ]),
        ],
    },
]


def course_file(course: dict) -> str:
    return f"""---
title: {quoted(course['title'])}
id: {course['id']}
schema_version: 2
type: course
area: {course['area']}
status: active
language: ru
app: include
rag: exclude
difficulty: beginner-intermediate
estimated_hours: {course['hours']}
accent: {course['accent']}
icon: {course['icon']}
tags: [course/{course['area']}, datapath/course]
---

# {course['title']}

## Результат

Связанный учебный маршрут с теорией, кодом, self-check, практикой, интервью-вопросами и сохранением прогресса в DataPath.
"""


def module_file(course: dict, module_slug: str, title: str, order: int) -> str:
    return f"""---
title: {quoted(title)}
id: module.{course['id'].removeprefix('course.')}.{module_slug}
schema_version: 2
type: module
area: {course['area']}
status: active
language: ru
app: include
rag: exclude
course_id: {course['id']}
module_order: {order}
estimated_minutes: 180
---

# {title}

Последовательность source-backed уроков. Progress и prerequisites вычисляются приложением.
"""


def lesson_file(
    course: dict,
    module_slug: str,
    module_order: int,
    lesson_order: int,
    lesson: tuple[str, str, str, str | None],
    previous_id: str | None,
) -> str:
    slug, title, source, demo = lesson
    course_slug = course["id"].removeprefix("course.")
    lesson_id = f"lesson.{course_slug}.{slug}"
    prereq = f"prerequisites:\n- {previous_id}\n" if previous_id else ""
    demo_scene = f',\n    {{"type": "interactive", "component": {quoted(demo)}}}' if demo else ""
    return f"""---
title: {quoted(title)}
id: {lesson_id}
schema_version: 2
type: lesson
area: {course['area']}
status: active
language: ru
app: include
rag: exclude
course_id: {course['id']}
module_id: module.{course_slug}.{module_slug}
module_order: {module_order}
lesson_order: {lesson_order}
content_path: {source}
skill_ids:
- {course['area']}.{slug}
{prereq}estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/{course['area']}]
---

# {title}

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{{
  "schema_version": 2,
  "layout": "focus",
  "content_path": {quoted(source)},
  "scenes": [
    {{"type": "hook", "title": "Зачем это нужно и какой результат получим"}}{demo_scene},
    {{"type": "retrieval", "prompt": "Объясни ключевой механизм темы без неопределённых терминов."}},
    {{"type": "application", "prompt": "Реши небольшой практический пример и объясни каждый шаг."}},
    {{"type": "interview", "prompt": "Дай ответ для собеседования: идея, механизм, ограничения и применение."}}
  ]
}}
```

## Проверка понимания

1. Объясни ключевой механизм темы без неопределённых терминов.
2. Реши небольшой практический пример и объясни каждый шаг.
3. Дай ответ для собеседования: идея, механизм, ограничения и применение.

## Связи

- До: prerequisite указан во frontmatter.
- После: следующий урок маршрута и связанные узлы Atlas.
"""


def build() -> int:
    written = 0
    for course in COURSE_DEFINITIONS:
        root = COURSES / course["folder"]
        modules_dir = root / "Модули"
        lessons_dir = root / "Уроки"
        modules_dir.mkdir(parents=True, exist_ok=True)
        lessons_dir.mkdir(parents=True, exist_ok=True)
        (root / f"00 Курс — {course['title']}.md").write_text(course_file(course), encoding="utf-8")
        written += 1
        previous_id = None
        for module_order, (module_slug, module_title, lessons) in enumerate(course["modules"], 1):
            (modules_dir / f"{module_order:02d} {module_title}.md").write_text(
                module_file(course, module_slug, module_title, module_order), encoding="utf-8"
            )
            written += 1
            for lesson_order, lesson in enumerate(lessons, 1):
                lesson_id = f"lesson.{course['id'].removeprefix('course.')}.{lesson[0]}"
                (lessons_dir / f"{module_order:02d}-{lesson_order:02d} {filename(lesson[1])}.md").write_text(
                    lesson_file(
                        course,
                        module_slug,
                        module_order,
                        lesson_order,
                        lesson,
                        previous_id,
                    ),
                    encoding="utf-8",
                )
                previous_id = lesson_id
                written += 1
    return written


if __name__ == "__main__":
    print(f"Generated {build()} DataPath route manifests")
