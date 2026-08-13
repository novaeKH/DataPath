#!/usr/bin/env python3
"""One-time, deterministic DataPath v2 corpus integration.

The external migration directory is an input only. Runtime content is written to
the vault and public assets directories, so the application never depends on the
migration checkout.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
VAULT = REPO / "content" / "vault"
COURSES_ROOT = VAULT / "05 Курсы"
SOURCES_ROOT = VAULT / "10 Знания" / "DataPath v2"
LEGACY_ROOT = VAULT / "_meta" / "legacy-v1"
FIGURES_ROOT = REPO / "frontend" / "public" / "content-assets" / "datapath-v2" / "figures"


CANONICAL_IDS = {
    1: "lesson.python-ds.02",
    2: "lesson.python-ds.03",
    3: "lesson.python-ds.04",
    4: "lesson.python-ds.05",
    5: "lesson.python-ds.06",
    6: "lesson.python-ds.07",
    7: "lesson.python-ds.11",
    8: "lesson.python-ds.09",
    9: "lesson.data-analysis.01",
    10: "lesson.data-analysis.02",
    11: "lesson.data-analysis.03",
    12: "lesson.data-analysis.04",
    13: "lesson.data-analysis.05",
    14: "lesson.data-analysis.06",
    15: "lesson.data-analysis.09",
    16: "lesson.sql.select-where",
    17: "lesson.sql.group-by",
    18: "lesson.sql.joins",
    19: "lesson.sql.cte-subqueries",
    20: "lesson.sql.window-functions",
    21: "lesson.sql.null-case-dates",
    22: "lesson.sql.patterns",
    23: "lesson.math-ds.linear-algebra",
    24: "lesson.math.linear-transformations",
    25: "lesson.math-ds.eigen-pca",
    26: "lesson.math-ds.gradients",
    27: "lesson.math-ds.bayes",
    28: "lesson.math-ds.random-variables",
    29: "lesson.math-ds.expectation",
    30: "lesson.math-ds.lln-clt",
    31: "lesson.math.estimation-ci",
    32: "lesson.math-ds.hypothesis",
    33: "lesson.math-ds.likelihood",
    34: "lesson.data-tools.estimator-pipeline",
    35: "lesson.data-tools.preprocessing",
    36: "lesson.data-tools.cv-tuning",
    37: "lesson.classic-ml.framing.problem",
    38: "lesson.classic-ml.framing.validation",
    39: "lesson.classic-ml.framing.metrics",
    40: "lesson.classic-ml.linear.regression",
    41: "lesson.classic-ml.linear.regularization",
    42: "lesson.classic-ml.linear.logistic",
    43: "lesson.classic-ml.expansion.14",
    44: "lesson.classic-ml.expansion.15",
    45: "lesson.classic-ml.expansion.16",
    46: "lesson.classic-ml.trees.tree",
    47: "lesson.classic-ml.trees.forest",
    48: "lesson.classic-ml.trees.boosting",
    49: "lesson.classic-ml.trees.libraries",
    50: "lesson.classic-ml.expansion.17",
    51: "lesson.classic-ml.expansion.18",
    52: "lesson.classic-ml.expansion.19",
    53: "lesson.classic-ml.expansion.20",
    54: "lesson.classic-ml.unsupervised.kmeans",
    55: "lesson.classic-ml.expansion.23",
    56: "lesson.classic-ml.unsupervised.pca",
    57: "lesson.classic-ml.expansion.24",
    58: "lesson.classic-ml.expansion.22",
    59: "lesson.classic-ml.expansion.21",
    60: "lesson.classic-ml.end-to-end.pipeline",
    61: "lesson.deep-learning.01",
    62: "lesson.deep-learning.02",
    63: "lesson.deep-learning.03",
    64: "lesson.deep-learning.04",
    65: "lesson.deep-learning.regularization",
    66: "lesson.deep-learning.05",
    67: "lesson.deep-learning.pooling-receptive-field",
    68: "lesson.deep-learning.06",
    69: "lesson.deep-learning.lstm-gru",
    70: "lesson.deep-learning.07",
    71: "lesson.deep-learning.attention",
    72: "lesson.deep-learning.08",
    73: "lesson.deep-learning.09",
    74: "lesson.deep-learning.10",
    75: "lesson.nlp.preprocessing",
    76: "lesson.nlp.classical",
    77: "lesson.nlp.classical-models",
    78: "lesson.nlp.subword-tokenization",
    79: "lesson.nlp.rnn",
    80: "lesson.nlp.bert-evaluation",
    81: "lesson.nlp.evaluation",
    82: "lesson.nlp.end-to-end",
    83: "lesson.llm-rag.autoregressive",
    84: "lesson.llm-rag.decoding",
    85: "lesson.llm-rag.inference",
    86: "lesson.llm-rag.embeddings-search",
    87: "lesson.llm-rag.retrieval",
    88: "lesson.llm-rag.reranking",
    89: "lesson.llm-rag.rag",
    90: "lesson.llm-rag.evaluation",
    91: "lesson.llm-rag.agents",
    92: "lesson.mlops.artifacts",
    93: "lesson.mlops.serving",
    94: "lesson.mlops.docker",
    95: "lesson.mlops.monitoring",
    96: "lesson.mlops.data-drift",
    97: "lesson.mlops.concept-drift",
    98: "lesson.mlops.reproducibility",
    99: "lesson.mlops.retraining",
    100: "lesson.mlops.lifecycle",
}


LEGACY_TO_NUMBER = {
    "lesson.python-ds.01": 1,
    "lesson.python-ds.02": 1,
    "lesson.python-ds.03": 2,
    "lesson.python-ds.04": 3,
    "lesson.python-ds.08": 3,
    "lesson.python-ds.05": 4,
    "lesson.python-ds.06": 5,
    "lesson.python-ds.07": 6,
    "lesson.python-ds.10": 6,
    "lesson.python-ds.11": 7,
    "lesson.python-ds.12": 7,
    "lesson.python-ds.09": 8,
    "lesson.data-analysis.01": 9,
    "lesson.data-analysis.02": 10,
    "lesson.data-analysis.03": 11,
    "lesson.data-analysis.04": 12,
    "lesson.data-analysis.10": 12,
    "lesson.data-analysis.05": 13,
    "lesson.data-analysis.06": 14,
    "lesson.data-analysis.11": 14,
    "lesson.data-analysis.07": 15,
    "lesson.data-analysis.08": 15,
    "lesson.data-analysis.09": 15,
    "lesson.data-analysis.12": 15,
    "lesson.data-tools.sql-foundations": 16,
    "lesson.data-tools.sql-analytics": 22,
    "lesson.math-ds.linear-algebra": 23,
    "lesson.math-ds.svd": 24,
    "lesson.math-ds.eigen-pca": 25,
    "lesson.math-ds.gradients": 26,
    "lesson.math-ds.bayes": 27,
    "lesson.math-ds.random-variables": 28,
    "lesson.math-ds.expectation": 29,
    "lesson.math-ds.lln-clt": 30,
    "lesson.math-ds.hypothesis": 32,
    "lesson.math-ds.ab-testing": 32,
    "lesson.math-ds.likelihood": 33,
    "lesson.data-tools.estimator-pipeline": 34,
    "lesson.data-tools.preprocessing": 35,
    "lesson.data-tools.cv-tuning": 36,
    "lesson.classic-ml.framing.problem": 37,
    "lesson.classic-ml.framing.validation": 38,
    "lesson.classic-ml.framing.metrics": 39,
    "lesson.classic-ml.linear.regression": 40,
    "lesson.classic-ml.linear.regularization": 41,
    "lesson.classic-ml.linear.logistic": 42,
    "lesson.classic-ml.expansion.14": 43,
    "lesson.classic-ml.expansion.15": 44,
    "lesson.classic-ml.expansion.16": 45,
    "lesson.classic-ml.trees.tree": 46,
    "lesson.classic-ml.trees.forest": 47,
    "lesson.classic-ml.trees.boosting": 48,
    "lesson.classic-ml.trees.libraries": 49,
    "lesson.classic-ml.expansion.17": 50,
    "lesson.classic-ml.expansion.18": 51,
    "lesson.classic-ml.expansion.19": 52,
    "lesson.classic-ml.expansion.20": 53,
    "lesson.classic-ml.unsupervised.kmeans": 54,
    "lesson.classic-ml.expansion.23": 55,
    "lesson.classic-ml.unsupervised.pca": 56,
    "lesson.classic-ml.expansion.24": 57,
    "lesson.classic-ml.expansion.22": 58,
    "lesson.classic-ml.expansion.21": 59,
    "lesson.classic-ml.end-to-end.pipeline": 60,
    "lesson.deep-learning.01": 61,
    "lesson.deep-learning.02": 62,
    "lesson.deep-learning.03": 63,
    "lesson.deep-learning.04": 64,
    "lesson.deep-learning.05": 66,
    "lesson.deep-learning.06": 68,
    "lesson.deep-learning.07": 70,
    "lesson.deep-learning.08": 72,
    "lesson.deep-learning.09": 73,
    "lesson.deep-learning.10": 74,
    "lesson.deep-learning.11": 74,
    "lesson.nlp.classical": 76,
    "lesson.nlp.rnn": 79,
    "lesson.nlp.attention": 80,
    "lesson.nlp.bert-evaluation": 80,
    "lesson.llm-rag.inference": 85,
    "lesson.llm-rag.retrieval": 87,
    "lesson.llm-rag.rag": 89,
    "lesson.llm-rag.agents": 91,
    "lesson.mlops.serving": 93,
    "lesson.mlops.monitoring": 95,
    "lesson.mlops.reproducibility": 98,
}


@dataclass(frozen=True)
class Course:
    id: str
    title: str
    folder: str
    order: int
    accent: str
    icon: str


@dataclass(frozen=True)
class Module:
    id: str
    title: str
    course_id: str
    order: int
    start: int
    end: int


COURSES = [
    Course("course.python-ds", "Python Core для Data Science", "Python для Data Science", 1, "blue", "code"),
    Course("course.math-ds", "Математика и статистика для Data Science", "Математика для Data Science", 2, "violet", "function"),
    Course("course.data-analysis", "NumPy, pandas и EDA", "Анализ данных", 3, "cyan", "table"),
    Course("course.data-tools", "SQL и scikit-learn", "SQL и scikit-learn", 4, "amber", "database"),
    Course("course.classic-ml", "Классическое машинное обучение", "Классический ML", 5, "emerald", "route"),
    Course("course.deep-learning", "Deep Learning", "Deep Learning", 6, "rose", "network"),
    Course("course.nlp", "NLP", "NLP", 7, "sky", "text"),
    Course("course.llm-rag", "LLM и RAG", "LLM и RAG", 8, "indigo", "search"),
    Course("course.mlops", "MLOps и ML Engineering", "MLOps", 9, "orange", "settings"),
]

MODULES = [
    Module("module.python-ds.objects", "Объекты, коллекции и функции", "course.python-ds", 1, 1, 3),
    Module("module.python-ds.protocols", "Итерация и модель данных", "course.python-ds", 2, 4, 5),
    Module("module.python-ds.reliability", "Надёжный Python", "course.python-ds", 3, 6, 8),
    Module("module.data-analysis.numpy", "NumPy", "course.data-analysis", 1, 9, 10),
    Module("module.data-analysis.pandas", "pandas и временные данные", "course.data-analysis", 2, 11, 14),
    Module("module.data-analysis.eda", "EDA как процесс", "course.data-analysis", 3, 15, 15),
    Module("module.data-tools.sql-basics", "SQL: выборка, агрегации и JOIN", "course.data-tools", 1, 16, 18),
    Module("module.data-tools.sql-analytics", "SQL: аналитические конструкции", "course.data-tools", 2, 19, 22),
    Module("module.math-ds.linear-algebra", "Линейная алгебра", "course.math-ds", 1, 23, 25),
    Module("module.math-ds.calculus", "Производные и градиенты", "course.math-ds", 2, 26, 26),
    Module("module.math-ds.probability", "Вероятность", "course.math-ds", 3, 27, 30),
    Module("module.math-ds.statistics", "Статистика и оценивание", "course.math-ds", 4, 31, 33),
    Module("module.data-tools.sklearn-api", "scikit-learn API и Pipeline", "course.data-tools", 3, 34, 35),
    Module("module.data-tools.sklearn-validation", "Cross-validation и поиск", "course.data-tools", 4, 36, 36),
    Module("module.classic-ml.problem-evaluation", "ML Problem & Evaluation", "course.classic-ml", 1, 37, 39),
    Module("module.classic-ml.linear-models", "Linear Models", "course.classic-ml", 2, 40, 45),
    Module("module.classic-ml.trees-ensembles", "Trees & Ensembles", "course.classic-ml", 3, 46, 49),
    Module("module.classic-ml.preprocessing", "Data & Preprocessing", "course.classic-ml", 4, 50, 53),
    Module("module.classic-ml.unsupervised", "Unsupervised Learning", "course.classic-ml", 5, 54, 57),
    Module("module.classic-ml.interpretation", "Interpretation & End-to-End", "course.classic-ml", 6, 58, 60),
    Module("module.deep-learning.foundations", "Deep Learning Foundations", "course.deep-learning", 1, 61, 65),
    Module("module.deep-learning.architectures", "Neural Architectures", "course.deep-learning", 2, 66, 72),
    Module("module.deep-learning.workflow", "PyTorch Workflow & Fine-tuning", "course.deep-learning", 3, 73, 74),
    Module("module.nlp.foundations", "Text Representations", "course.nlp", 1, 75, 78),
    Module("module.nlp.neural", "Neural NLP", "course.nlp", 2, 79, 80),
    Module("module.nlp.workflow", "Evaluation & End-to-End", "course.nlp", 3, 81, 82),
    Module("module.llm-rag.mechanics", "Language Model Mechanics", "course.llm-rag", 1, 83, 85),
    Module("module.llm-rag.retrieval", "Retrieval", "course.llm-rag", 2, 86, 88),
    Module("module.llm-rag.systems", "RAG & Agents", "course.llm-rag", 3, 89, 91),
    Module("module.mlops.serving", "Artifacts & Serving", "course.mlops", 1, 92, 94),
    Module("module.mlops.observability", "Observability & Drift", "course.mlops", 2, 95, 97),
    Module("module.mlops.lifecycle", "Reproducibility & Lifecycle", "course.mlops", 3, 98, 100),
]


DEMO_BY_NUMBER = {
    9: "numpy-array-lab", 10: "numpy-broadcasting-lab", 11: "dataframe-selection-lab",
    12: "data-cleaning-lab", 13: "groupby-merge-lab", 14: "time-window-lab",
    15: "eda-workflow-board", 18: "sql-join-grain-lab", 23: "tensor-shape-tracer",
    25: "pca-projection-lab", 26: "gradient-descent-landscape", 27: "naive-bayes-evidence-lab",
    34: "pipeline-builder-lab", 35: "preprocessing-pipeline-builder", 36: "hyperparameter-search-landscape",
    37: "problem-framing-canvas", 38: "validation-split-lab", 39: "metrics-threshold-lab",
    40: "linear-fit-residual-lab", 41: "regularization-path-lab", 42: "logistic-boundary-threshold-lab",
    43: "knn-neighbourhood-lab", 44: "naive-bayes-evidence-lab", 45: "svm-margin-kernel-lab",
    46: "decision-tree-split-lab", 47: "bootstrap-forest-lab", 48: "boosting-residuals-lab",
    49: "categorical-encoding-lab", 50: "preprocessing-pipeline-builder", 51: "categorical-encoding-lab",
    52: "imbalance-threshold-lab", 53: "calibration-reliability-lab", 54: "kmeans-canvas",
    55: "density-hierarchy-clustering-lab", 56: "pca-projection-lab", 57: "anomaly-methods-lab",
    58: "interpretation-methods-lab", 59: "hyperparameter-search-landscape", 60: "pipeline-builder-lab",
    61: "neuron-computation-lab", 62: "mlp-neuron-lab", 63: "backprop-computation-graph",
    64: "optimizer-landscape-lab", 65: "dl-debugging-decision-tree", 66: "cnn-kernel-feature-map-lab",
    67: "pooling-window-lab", 68: "rnn-state-gates-lab", 69: "rnn-state-gates-lab",
    71: "attention-matrix-lab", 72: "transformer-block-lab", 73: "training-loop-timeline",
    74: "fine-tuning-parameter-budget", 76: "tfidf-weight-lab", 79: "rnn-state-gates-lab",
    80: "transformer-block-lab", 85: "transformer-block-lab", 87: "retrieval-ranking-lab",
    89: "rag-pipeline-evaluation-lab", 95: "monitoring-drift-quality-lab", 98: "experiment-reproducibility-lab",
}


FIGURES = {
    42: (3, "42_logistic_regression.png", "Логистическая регрессия", "Линейный score превращается sigmoid в вероятность, а порог задаёт класс и границу решения."),
    43: (5, "43_knn.png", "k ближайших соседей", "Query point, ранжированные соседи и изменение голосования при разных k."),
    45: (3, "45_svm.png", "SVM и максимальный зазор", "Margin-линии и support vectors показывают, какие точки определяют границу."),
    46: (3, "46_decision_tree.png", "Решающее дерево", "Axis-aligned splits в пространстве признаков соответствуют узлам и листьям дерева."),
    47: (8, "47_random_forest.png", "Random Forest", "Bootstrap-выборки, разные деревья и итоговое голосование леса."),
    48: (6, "48_gradient_boosting.png", "Градиентный бустинг", "Начальный прогноз, residuals и последовательные деревья-коррекции."),
    52: (5, "52_class_imbalance.png", "Дисбаланс классов", "Высокая доля правильных ответов может скрывать нулевую полноту редкого класса; порог меняет компромисс."),
    53: (3, "53_probability_calibration.png", "Калибровка вероятностей", "Reliability diagram различает calibrated, overconfident и underconfident predictions."),
    56: (7, "56_pca.png", "PCA", "Облако точек, PC1/PC2, ортогональная проекция и потерянная вариация."),
    61: (4, "61_neuron.png", "Один нейрон", "Входы, веса, bias, линейная сумма z и ReLU output на числовом примере."),
    62: (3, "62_mlp.png", "MLP и активации", "Путь 2→3→1 с hidden activations, logit и sigmoid probability."),
    63: (5, "63_backpropagation.png", "Backpropagation", "Прямые значения идут слева направо, градиенты по chain rule — справа налево."),
    64: (11, "64_optimizers.png", "SGD, Momentum и Adam", "Три optimizer trajectory на одном loss landscape."),
    65: (9, "65_dropout.png", "Dropout", "Train masks, inverted scaling и отличие inference mode."),
    66: (3, "66_cnn_convolution.png", "CNN convolution", "Image patch, kernel, точные dot products и соответствующая feature map."),
    67: (4, "67_max_pooling.png", "Max Pooling", "Окна 2×2 превращают матрицу 4×4 в pooled output без обучаемых весов."),
    68: (3, "68_rnn_unrolled.png", "RNN во времени", "Общие параметры, hidden state и длинный путь backpropagation through time."),
    69: (8, "69_lstm_gates.png", "LSTM gates", "Cell state и точный update через forget, input, candidate и output gates."),
    70: (6, "70_embeddings.png", "Embeddings", "Семантические кластеры и nearest neighbors по cosine similarity."),
    71: (7, "71_attention.png", "Attention", "Query token, attention links и heatmap одной строки весов, сумма которых равна единице."),
    72: (9, "72_transformer.png", "Transformer", "Q/K/V, scores, softmax, weighted Values, residuals и FFN в одном потоке."),
}


COURSE_BY_ID = {course.id: course for course in COURSES}


def quoted(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, re.DOTALL)
    if not match:
        raise ValueError("missing YAML frontmatter")
    metadata: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field = re.match(r"^([A-Za-z_][\w-]*):\s*(.*?)\s*$", line)
        if not field:
            continue
        key, raw = field.groups()
        if raw.startswith(('"', "'")):
            try:
                metadata[key] = json.loads(raw)
            except json.JSONDecodeError:
                metadata[key] = raw.strip("'\"")
        else:
            metadata[key] = raw
    return metadata, match.group(2).rstrip() + "\n"


def extract_skill_ids(text: str) -> list[str]:
    match = re.search(r"^skill_ids:\s*\n((?:\s*-\s*[^\n]+\n?)+)", text, re.MULTILINE)
    if not match:
        return []
    return [item.strip() for item in re.findall(r"^\s*-\s*(.+)$", match.group(1), re.MULTILINE)]


def safe_filename(value: str, limit: int = 92) -> str:
    normalized = unicodedata.normalize("NFC", value)
    normalized = re.sub(r"[\\/:*?\"<>|`]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip(" .")
    return normalized[:limit].rstrip()


def module_for(number: int) -> Module:
    return next(module for module in MODULES if module.start <= number <= module.end)


def previous_in_course(number: int) -> int | None:
    course_id = module_for(number).course_id
    previous = [n for n in range(1, number) if module_for(n).course_id == course_id]
    return previous[-1] if previous else None


def prerequisites_for(number: int) -> list[str]:
    previous = previous_in_course(number)
    if previous is not None:
        return [CANONICAL_IDS[previous]]
    cross_course = {
        9: [8], 16: [11], 34: [15], 37: [36], 61: [26, 40],
        75: [70], 83: [72, 78], 92: [60, 73],
    }
    return [CANONICAL_IDS[n] for n in cross_course.get(number, [])]


def insert_figure(body: str, number: int) -> str:
    if number not in FIGURES:
        return body
    section_number, filename, alt_topic, caption = FIGURES[number]
    heading = re.search(rf"^##\s+{section_number}\.(?:\s|$).*$", body, re.MULTILINE)
    if not heading:
        raise ValueError(f"lesson {number}: figure insertion heading {section_number} not found")
    next_heading = re.search(r"^##\s+", body[heading.end():], re.MULTILINE)
    insertion = heading.end() + (next_heading.start() if next_heading else len(body[heading.end():]))
    figure = (
        f"\n\n![Учебная иллюстрация: {alt_topic}. {caption}]"
        f"(content-assets/datapath-v2/figures/{filename} \"{caption}\")\n"
    )
    return body[:insertion].rstrip() + figure + "\n" + body[insertion:].lstrip("\n")


def technical_adaptations(body: str, number: int) -> str:
    """Minimal parser-facing fixes; canonical explanations otherwise stay untouched."""
    if number == 88:
        body = body.replace(
            "\nMeasure:\n\n### Retriever\n",
            "\nMeasure each stage separately: a high-quality generator cannot recover evidence "
            "lost before reranking.\n\n### Retriever\n",
            1,
        )
    return body


def discover(source: Path) -> dict[int, tuple[Path, dict[str, str], str]]:
    lessons: dict[int, tuple[Path, dict[str, str], str]] = {}
    titles: dict[str, int] = {}
    errors: list[str] = []
    for path in sorted((source / "lessons").glob("**/[0-9][0-9]_*.md")) + sorted(
        (source / "lessons").glob("**/100_*.md")
    ):
        if path.name.startswith("00_"):
            continue
        try:
            metadata, body = split_frontmatter(path.read_text(encoding="utf-8"))
            number = int(metadata["canonical_number"])
            title = metadata["title"]
        except (KeyError, ValueError) as exc:
            errors.append(f"{path}: {exc}")
            continue
        if number in lessons:
            errors.append(f"duplicate canonical_number {number}: {path} and {lessons[number][0]}")
        if title in titles:
            errors.append(f"duplicate title {title!r}: {number} and {titles[title]}")
        if len(re.findall(r"^```", body, re.MULTILINE)) % 2:
            errors.append(f"unbalanced code fence: {path}")
        lessons[number] = (path, metadata, body)
        titles[title] = number
    missing = sorted(set(range(1, 101)) - set(lessons))
    extra = sorted(set(lessons) - set(range(1, 101)))
    if missing:
        errors.append(f"missing canonical numbers: {missing}")
    if extra:
        errors.append(f"unexpected canonical numbers: {extra}")
    if errors:
        raise SystemExit("Corpus audit failed:\n- " + "\n- ".join(errors))
    return lessons


def old_lesson_inventory() -> dict[str, tuple[Path, list[str]]]:
    inventory: dict[str, tuple[Path, list[str]]] = {}
    paths = list((LEGACY_ROOT / "05 Курсы").glob("**/*.md"))
    paths.extend(COURSES_ROOT.glob("**/*.md"))
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        if not re.search(r"^type:\s*lesson\s*$", text, re.MULTILINE):
            continue
        lesson_id = re.search(r"^id:\s*(\S+)\s*$", text, re.MULTILINE)
        if lesson_id:
            inventory[lesson_id.group(1)] = (path, extract_skill_ids(text))
    return inventory


def archive_file(path: Path) -> None:
    relative = path.relative_to(VAULT)
    target = LEGACY_ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise SystemExit(f"Legacy archive target already exists: {target}")
    shutil.move(str(path), str(target))


def archive_active_content(inventory: dict[str, tuple[Path, list[str]]]) -> None:
    for path, _skills in inventory.values():
        if path.is_relative_to(COURSES_ROOT):
            archive_file(path)
    for course in COURSES:
        folder = COURSES_ROOT / course.folder
        for path in sorted(folder.glob("Модули/*.md")):
            archive_file(path)
        for path in sorted(folder.glob("00*.md")):
            archive_file(path)
    algorithms = COURSES_ROOT / "Python и алгоритмы"
    if algorithms.exists():
        target = LEGACY_ROOT / "05 Курсы" / algorithms.name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.mkdir(parents=True, exist_ok=True)
        for path in sorted(algorithms.glob("**/*.md")):
            relative = path.relative_to(algorithms)
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists():
                raise SystemExit(f"Legacy archive target already exists: {destination}")
            shutil.move(str(path), str(destination))
        for directory in sorted(
            (path for path in algorithms.glob("**/*") if path.is_dir()),
            key=lambda path: len(path.parts),
            reverse=True,
        ):
            directory.rmdir()
        algorithms.rmdir()
    catalog = COURSES_ROOT / "00 Каталог курсов.md"
    if catalog.exists():
        archive_file(catalog)


def write_course_files(lessons: dict[int, tuple[Path, dict[str, str], str]]) -> None:
    for course in COURSES:
        folder = COURSES_ROOT / course.folder
        folder.mkdir(parents=True, exist_ok=True)
        course_numbers = [n for n in lessons if module_for(n).course_id == course.id]
        total_minutes = sum(int(lessons[n][1].get("estimated_minutes") or 45) for n in course_numbers)
        modules = [module for module in MODULES if module.course_id == course.id]
        frontmatter = f"""---
title: {quoted(course.title)}
id: {course.id}
schema_version: 2
type: course
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_order: {course.order}
difficulty: foundation-advanced
estimated_hours: {round(total_minutes / 60, 1)}
accent: {course.accent}
icon: {course.icon}
tags:
- datapath/v2
- course/canonical
---

# {course.title}

Канонический маршрут DataPath v2: {len(course_numbers)} полноценных учебных глав.

## Модули

"""
        links = "\n".join(
            f"{index}. [[{module.order:02d} {safe_filename(module.title)}]] — уроки {module.start}–{module.end}."
            for index, module in enumerate(modules, start=1)
        )
        (folder / f"00 Курс — {safe_filename(course.title)}.md").write_text(
            frontmatter + links + "\n", encoding="utf-8"
        )

        modules_folder = folder / "Модули"
        lessons_folder = folder / "Уроки"
        modules_folder.mkdir(parents=True, exist_ok=True)
        lessons_folder.mkdir(parents=True, exist_ok=True)
        for module in modules:
            rows = []
            for number in range(module.start, module.end + 1):
                title = lessons[number][1]["title"]
                rows.append(f"{number - module.start + 1}. [[{number:03d} {safe_filename(title)}]]")
            minutes = sum(int(lessons[n][1].get("estimated_minutes") or 45) for n in range(module.start, module.end + 1))
            content = f"""---
title: {quoted(module.title)}
id: {module.id}
schema_version: 2
type: module
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: {module.course_id}
module_order: {module.order}
estimated_minutes: {minutes}
tags:
- datapath/v2
- course/module
---

# {module.title}

## Уроки

{"\n".join(rows)}
"""
            (modules_folder / f"{module.order:02d} {safe_filename(module.title)}.md").write_text(content, encoding="utf-8")


def write_catalog() -> None:
    lines = [
        "---", "title: Каталог курсов DataPath v2", "id: moc.courses", "schema_version: 2",
        "type: moc", "area: datapath-v2", "status: active", "language: ru", "rag: exclude",
        "app: include", "---", "", "# Каталог курсов DataPath v2", "",
    ]
    for index, course in enumerate(COURSES, start=1):
        lines.append(f"{index}. [[00 Курс — {safe_filename(course.title)}|{course.title}]]")
    lines.extend(["", "> Algorithms намеренно остаётся в отдельном AlgoPath и не входит в DataPath v2.", ""])
    (COURSES_ROOT / "00 Каталог курсов.md").write_text("\n".join(lines), encoding="utf-8")


def write_lessons(
    source: Path,
    lessons: dict[int, tuple[Path, dict[str, str], str]],
    inventory: dict[str, tuple[Path, list[str]]],
) -> dict[int, str]:
    if SOURCES_ROOT.exists():
        raise SystemExit(f"Production source directory already exists: {SOURCES_ROOT}")
    if FIGURES_ROOT.exists():
        raise SystemExit(f"Production figures directory already exists: {FIGURES_ROOT}")
    FIGURES_ROOT.mkdir(parents=True)
    for visual in sorted((source / "visuals" / "png").glob("*.png")):
        shutil.copy2(visual, FIGURES_ROOT / visual.name)
    if len(list(FIGURES_ROOT.glob("*.png"))) != 21:
        raise SystemExit("Expected exactly 21 production figures")

    legacy_by_number: dict[int, list[str]] = defaultdict(list)
    for legacy_id, number in LEGACY_TO_NUMBER.items():
        legacy_by_number[number].append(legacy_id)
    production_paths: dict[int, str] = {}

    for number in range(1, 101):
        source_path, metadata, body = lessons[number]
        module = module_for(number)
        course = COURSE_BY_ID[module.course_id]
        title = metadata["title"]
        filename = f"{number:03d} {safe_filename(title)}.md"
        source_folder = SOURCES_ROOT / source_path.parent.name
        source_folder.mkdir(parents=True, exist_ok=True)
        # Source and lesson manifests need distinct slugs in the global catalog.
        production_source = source_folder / f"source-{filename}"
        source_relative = production_source.relative_to(VAULT).as_posix()
        production_paths[number] = source_relative

        source_frontmatter = f"""---
title: {quoted(title)}
id: concept.datapath-v2.{number:03d}
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: {number}
canonical_course: {quoted(metadata.get("course", course.title))}
source_provenance: {quoted("DataPath v2 canonical corpus")}
tags:
- datapath/v2
- canonical/source
---

"""
        adapted_body = technical_adaptations(body, number)
        source_text = source_frontmatter + insert_figure(adapted_body, number)
        # Preserve intentional Markdown hard breaks without trailing whitespace.
        source_text = re.sub(r"[ \t]{2,}(?=\n)", r"\\", source_text)
        source_text = re.sub(r"[ \t]+(?=\n)", "", source_text)
        production_source.write_text(source_text, encoding="utf-8")

        legacy_ids = sorted(legacy_by_number.get(number, []))
        skill_ids: list[str] = []
        for legacy_id in legacy_ids:
            if legacy_id in inventory:
                skill_ids.extend(inventory[legacy_id][1])
        skill_ids = list(dict.fromkeys(skill_ids)) or [f"datapath.v2.{number:03d}"]
        prereqs = prerequisites_for(number)
        estimated = int(metadata.get("estimated_minutes") or 45)
        difficulty = metadata.get("difficulty") or "core"
        scenario = [{"type": "hook", "title": "Цель главы"}]
        if number in DEMO_BY_NUMBER:
            scenario.append({"type": "visual_demo", "component": DEMO_BY_NUMBER[number]})
        scenario.append(
            {
                "type": "retrieval",
                "assessment_type": "self_assessment",
                "prompt": f"Насколько уверенно вы можете объяснить ключевой механизм главы «{title}» без подсказки?",
            }
        )
        lesson_frontmatter = [
            "---", f"title: {quoted(title)}", f"id: {CANONICAL_IDS[number]}", "schema_version: 2",
            "type: lesson", "area: datapath-v2", "status: active", "language: ru", "rag: exclude",
            "app: include", f"course_id: {module.course_id}", f"module_id: {module.id}",
            f"module_order: {module.order}", f"lesson_order: {number - module.start + 1}",
            f"canonical_number: {number}", f"content_path: {source_relative}", f"estimated_minutes: {estimated}",
            f"difficulty: {difficulty}", "skill_ids:", *[f"- {skill_id}" for skill_id in skill_ids],
            "prerequisites:", *[f"- {item}" for item in prereqs],
            f"previous: {CANONICAL_IDS[number - 1] if number > 1 else 'null'}",
            f"next: {CANONICAL_IDS[number + 1] if number < 100 else 'null'}",
            "tags:", "- datapath/v2", "- canonical/lesson", "---", "",
        ]
        lesson_body = (
            f"# {title}\n\n## Результат урока\n\n"
            f"Разобрать каноническую главу №{number}, воспроизвести её ключевой механизм и оценить готовность объяснить тему.\n\n"
            "## Сценарий урока\n\n```datapath\n"
            + json.dumps({"schema_version": 2, "layout": "focus", "scenes": scenario}, ensure_ascii=False, indent=2)
            + "\n```\n"
        )
        lesson_path = COURSES_ROOT / course.folder / "Уроки" / filename
        lesson_path.write_text("\n".join(lesson_frontmatter) + lesson_body, encoding="utf-8")
    return production_paths


def write_migration_doc(
    lessons: dict[int, tuple[Path, dict[str, str], str]], production_paths: dict[int, str]
) -> None:
    legacy_by_number: dict[int, list[str]] = defaultdict(list)
    for legacy_id, number in LEGACY_TO_NUMBER.items():
        legacy_by_number[number].append(legacy_id)
    rows = []
    for number in range(1, 101):
        metadata = lessons[number][1]
        module = module_for(number)
        legacy = "<br>".join(f"`{item}`" for item in sorted(legacy_by_number.get(number, []))) or "—"
        rows.append(
            f"| {number} | {legacy} | `{CANONICAL_IDS[number]}` | {metadata['title'].replace('|', ' / ')} "
            f"| {COURSE_BY_ID[module.course_id].title} | `{production_paths[number]}` |"
        )
    excluded = "\n".join(f"- `{lesson_id}`" for lesson_id in sorted(
        item for item in old_algorithm_ids()
    ))
    text = f"""# DataPath v2 content migration

Canonical corpus audit: **100 lessons**, canonical numbers **1–100**, no gaps, duplicate numbers,
duplicate titles or unbalanced fenced-code blocks. The 15 block README files are documentation,
not lessons. Runtime content is fully copied into the vault; there are no `_migration` runtime paths.

## Identity map

| № | Legacy lesson ID(s) | Canonical v2 ID | Title | Course | Production source |
|---:|---|---|---|---|---|
{"\n".join(rows)}

## State migration rules

- Stable semantic IDs are retained for direct replacements. Changed IDs use the table above.
- A completed direct predecessor remains completed. For merged chapters, completion is retained only
  when every strongly corresponding predecessor was completed; otherwise the chapter is migrated as
  started and its former evidence remains available.
- Broad legacy SQL and visualization chapters map to one primary canonical destination. Their mastery
  evidence and history remain, but progress is not duplicated into several fully completed chapters.
- Scene resume IDs are retained when possible; an invalid anchor falls back to the beginning without
  deleting lesson-level progress.
- Notes are moved to the mapped canonical lesson. Colliding notes are concatenated with their legacy ID.
- Review items have lesson/source/template references rewritten. Items belonging only to Algorithms are
  removed from the active queue (history and notes stay in backup state), preventing dead lesson links.
- Backup schema v1/v2 is accepted by schema v3 and runs through the same deterministic migration.

## Legacy content status

The previous course/module/lesson manifests are archived under
`content/vault/_meta/legacy-v1/` and are excluded by the catalog parser. Old source notes under
`10 Знания` remain source-only references, not active lessons. The previous Algorithms course is also
archived and remains outside Roadmap, Today, Review and Atlas.

Excluded Algorithms lesson IDs:

{excluded}

## Figures

All **21** teaching figures are copied to
`frontend/public/content-assets/datapath-v2/figures/` and embedded at the mechanism-specific point in
their canonical ML/DL chapters. URLs are relative and resolved through the frontend base-path helper.
"""
    (REPO / "docs" / "content-v2-migration.md").write_text(text, encoding="utf-8")


def old_algorithm_ids() -> list[str]:
    archive = LEGACY_ROOT / "05 Курсы" / "Python и алгоритмы"
    ids: list[str] = []
    if not archive.exists():
        return ids
    for path in archive.glob("**/*.md"):
        match = re.search(r"^id:\s*(lesson\.algorithms\.\S+)\s*$", path.read_text(encoding="utf-8"), re.MULTILINE)
        if match:
            ids.append(match.group(1))
    return ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=REPO.parent / "_migration" / "datapath-v2")
    args = parser.parse_args()
    source = args.source.resolve()
    if not (source / "lessons").is_dir() or not (source / "visuals" / "png").is_dir():
        raise SystemExit(f"Invalid DataPath v2 source: {source}")
    lessons = discover(source)
    inventory = old_lesson_inventory()
    non_algorithm = {item for item in inventory if not item.startswith("lesson.algorithms.")}
    unmapped = sorted(non_algorithm - set(LEGACY_TO_NUMBER))
    if unmapped:
        raise SystemExit("Unmapped legacy lesson IDs:\n- " + "\n- ".join(unmapped))
    archive_active_content(inventory)
    write_course_files(lessons)
    write_catalog()
    production_paths = write_lessons(source, lessons, inventory)
    write_migration_doc(lessons, production_paths)
    print(
        json.dumps(
            {
                "canonical_lessons": len(lessons),
                "courses": len(COURSES),
                "modules": len(MODULES),
                "figures": len(list(FIGURES_ROOT.glob('*.png'))),
                "legacy_lessons": len(inventory),
                "mapped_non_algorithm_lessons": len(non_algorithm),
                "excluded_algorithm_lessons": len(old_algorithm_ids()),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
