# DataPath — анализ расширения образовательной базы знаний

> Дата: 2026-08-05. Область: только `content/vault` (канонический контент).
> Источник слияния: загруженный `vault 2` (388 файлов, 387 machine-readable ID).
> Код/БД/frontend не изменяются. Коммит не создаётся.

## 1. Текущее состояние content/vault

- 290 Markdown-файлов, 289 контентных ID, `scanned: 264, created: 189` при sync.
- Активный курс: `course.classic-ml` (5 модулей, 13 уроков, 5 кейсов) + 2 смешанных кейса.
- Каноническая теория (`app: source`): 67 concept, 18 interview, 7 project, практика.
- Структура Knowledge: `10 Знания/ML/01 Classical ML`, `02 Deep Learning` (шаблоны PyTorch),
  `03 Пайплайны ML`, `04 NLP`, `05 Metrics and Validation`, `Python`, `Алгоритмы`,
  `Инструменты`, `Математика`.
- Валидация (baseline): 0 errors, 0 warnings.

## 2. Что содержит загруженный vault 2

`vault 2` — супермножество `content/vault`: **все 289 ID сохранены**, добавлены 98 новых ID.

| Группа | Файлов | Что это |
|---|---|---|
| Идентичные файлы | 251 | Полные копии (путь+ID+контент совпадают) |
| Улучшенные файлы | 38 | Тот же путь и ID, контент переработан/расширен |
| Новые файлы | 98 | Новые концепты, курсы-черновики, практика, спеки |

### 2.1 Улучшенные файлы (38) — кандидаты на замену в content/vault

- **13 активных уроков Classic ML** (01–13): расширены с 2 коротких секций до 5–9
  содержательных theory scenes + interleaved retrieval/application/checkpoint.
- **10 концептов ML**: ML Foundations, Linear/Logistic Regression, Regularization, KNN,
  Naive Bayes, SVM, K-Means, PCA, Categorical Features — beginner-объяснения, числовые
  примеры, «Визуальная демонстрация», «Частые ошибки».
- **4 концепта DL**: Neural Networks and Backpropagation, Optimization and Regularization,
  Embeddings and Attention, Transformer and Language Modeling.
- **5 концептов Python**: исключения/context managers, декораторы, память/GC/GIL,
  Python для DS, typing/testing.
- **6 MOC/meta**: Знания — карта, Python — карта, Classical ML — карта, Deep Learning —
  карта, Каталог курсов, README.

### 2.2 Новые файлы (98) — кандидаты на добавление

- **Classical ML (9 концептов)**: Anomaly Detection, Class Imbalance and Resampling,
  DBSCAN and Hierarchical Clustering, Data Preprocessing and Feature Engineering,
  Feature Importance and Model Interpretation, Model Selection and Hyperparameter Tuning,
  Probability Calibration (+3 в списке выше уже существовали).
- **Deep Learning (7 концептов)**: Tensors Shapes and Linear Layers, Activation Functions
  and Losses, Convolutional Neural Networks, Recurrent Networks LSTM and GRU,
  Training Evaluation and Inference in PyTorch, Fine-Tuning Transfer Learning and PEFT,
  DL Debugging and Experiment Design.
- **Data Analysis (12 концептов)**: NumPy (2), pandas (4), Matplotlib (1), Seaborn (1),
  EDA (4: Workflow, Data Quality/Missing/Outliers, Relationships/Time/Groups, EDA→ML).
- **Python (2 концепта)**: 00 Основы синтаксиса и управление потоком, 12 Модули/файлы/
  pathlib/окружения.
- **Практика (3)**: NumPy Vectorization, pandas EDA Feature Table, Matplotlib/Seaborn EDA.
- **Курсы-черновики (3 курса, 10 модулей, 35 уроков, все `app: exclude`)**:
  Python для Data Science (12 уроков), Анализ данных (12 уроков), Deep Learning
  (11 уроков), плюс 11 draft-уроков расширения Classic ML (14–24).
- **Спеки**: `_meta/DATAPATH_LESSON_V2_SPEC.md`, `_meta/DATAPATH_VISUAL_DEMOS.md`.

## 3. Стратегия: replace / merge / keep

| Решение | Объект | Обоснование |
|---|---|---|
| **Replace (38)** | Улучшенные файлы из vault 2 → те же пути в content/vault | Тот же стабильный ID; контент строго лучше (начало с нуля, числовые примеры, ошибки, интервью-ответы); уроки ссылаются на новые секции канонических заметок — заменяем пару «урок+источник» согласованно |
| **Add (95)** | Новые концепты/практика/спеки | Новые темы, отсутствующие в каноне |
| **Add drafts (46)** | 3 курса-черновика + 11 уроков расширения Classic ML, `app: exclude` | Полноценная структура будущих треков без изменения активного каталога приложения (publish = `app == include`) |
| **Keep** | Остальные 251 файл | Идентичны, ничего не трогаем |
| **Патчи** | Точечные правки после слияния | См. §5 |

### 3.1 Перемещение новых путей (согласно заданию)

| Источник (vault 2) | Целевой путь (content/vault) |
|---|---|
| `10 Знания/Data/NumPy/*` | `10 Знания/Python Libraries/NumPy/*` |
| `10 Знания/Data/pandas/*` | `10 Знания/Python Libraries/Pandas/*` |
| `10 Знания/Data/Visualization/Matplotlib ...` | `10 Знания/Python Libraries/Matplotlib/...` |
| `10 Знания/Data/Visualization/Seaborn ...` | `10 Знания/Python Libraries/Seaborn/...` |
| `10 Знания/Data/EDA/*` | `10 Знания/Data Analysis/EDA/*` |
| `10 Знания/Data/00 Data Analysis — карта.md` | `10 Знания/Data Analysis/00 Data Analysis — карта.md` |

Синхронно обновляются `content_path` и `datapath.content_path` во всех draft-уроках
курсов «Анализ данных» и «Python для Data Science». Wiki-ссылки используют
filename-резолв, перемещение путей их не ломает (проверено: path-style ссылок нет).

Примечание по заданию «10 Знания/Algorithms/»: в каноне уже существует
`10 Знания/Алгоритмы/` (19 заметок, полная структура паттернов). Переименование
каталога ломает существующие ссылки и противоречит правилу «never rename unless
required», поэтому каноническим местом остаётся `10 Знания/Алгоритмы/` — это и есть
требуемый блок Algorithms, в русском нейминге vault.

## 4. Покрытие требований задания (аудит заголовков vault 2)

### Part 1 — Classical ML (10 Знания/ML/01 Classical ML)
- Регрессия: Linear ✓, Regularization (Ridge/Lasso/ElasticNet) ✓, loss (MSE/LogLoss) ✓.
  **Gap:** Polynomial Regression и явный список регрессионных loss (MSE/MAE/Huber) —
  добавить секции в Linear Regression.md.
- Классификация: Logistic ✓, Decision Trees ✓, Random Forest (Bagging) ✓,
  Gradient Boosting ✓, XGBoost/LightGBM/CatBoost ✓.
- Алгоритмы: KNN ✓, Naive Bayes ✓, SVM ✓.
- Unsupervised: PCA ✓, K-Means ✓, DBSCAN/Hierarchical ✓, Anomaly Detection ✓,
  distance metrics (в KNN/K-Means/DBSCAN) ✓.
- Структура «10 пунктов на алгоритм»: у большинства заметок секции покрывают
  why/intuition/math/training/params/advantages/limitations/when/interview/python/ошибки.
  **Gaps:** часть заметок не имеет явных секций «Когда использовать»/«Ответ для
  собеседования» → добавить компактно.

### Part 2 — Data Analysis (10 Знания/Data Analysis/)
Все 10 тем EDA покрыты: dataset understanding (Workflow шаги 1–2), target analysis
(шаг 3), distributions (шаг 5), missing/outliers (Data Quality), duplicates
(«Дубликаты и согласованность»), relationships/correlation (Relationships),
leakage (Workflow шаг 7, From EDA to ML), checklist (Мини-чеклист). Требуемые элементы
(от нуля, примеры, Python-workflow, ошибки) присутствуют.

### Part 3 — Python (10 Знания/Python/)
Basics (00: переменные/типы/условия/циклы/функции/comprehensions) ✓, collections
(02/03) ✓, iterators/generators (05) ✓, decorators (08) ✓, context managers (07) ✓,
exceptions (07) ✓, typing (11) ✓, OOP (06) ✓, memory model (09) ✓, mutable/immutable
(01) ✓, profiling (09 «Профилирование») ✓, clean code (10/11) ✓, complexity (02/03) ✓.
Gaps не выявлено.

### Part 4 — Big O и алгоритмы (10 Знания/Алгоритмы/)
Data structures: arrays (02), linked lists (12), stacks/queues (08), hash tables (03),
trees (14), heaps (11), graphs (16) ✓. Patterns: two pointers (04), sliding window (05),
binary search (07), BFS/DFS (14/16), recursion (13), DP (18), greedy (17) ✓.
Каждый паттерн: intuition («Главная идея»), visual («Трассировка»), template
(«Универсальный шаблон»), when («Как распознать»/«Когда не подходит»), traps
(«Типичные ошибки»), practice («Практика») ✓.
**Gap:** Big Theta/Big Omega отсутствуют в 01_Big_O.md → добавить секцию.

### Part 5 — Python Libraries (10 Знания/Python Libraries/)
NumPy: ndarray/shape/dtype/indexing/vectorization/broadcasting/матричные операции/
linear algebra ✓. Pandas: Series/DataFrame/load/filter/groupby/merge/pivot/agg/
time series ✓ (4 заметки). Matplotlib: figure/axes/subplots/кастомизация ✓.
Seaborn: distributions/categorical/correlation/statistical ✓.
Элементы «explain/code/DS usage/mistakes» присутствуют.

### Part 6 — Deep Learning (10 Знания/ML/02 Deep Learning/)
Basics: tensors/shapes/linear layers, activations, forward pass, loss, backpropagation ✓
(neuron/perceptron — «Нейронная сеть с нуля»). Training: GD/SGD/Momentum/Adam/AdamW ✓,
learning-rate schedules ✓, overfitting/regularization ✓. Architectures: CNN ✓, RNN/LSTM/GRU ✓,
Attention ✓, Transformers ✓, LLM basics («Обучение LLM») ✓.

### Part 7 — visual metadata
Каталог `DATAPATH_VISUAL_DEMOS` (уже в vault 2) задаёт id визуальных демонстраций.
Добавить `visual: true` в frontmatter концептов, у которых есть демо (ML/DL/Data +
алгоритмические BFS/DFS, sorting, recursion, DP). Frontend НЕ реализуется.

### Part 8 — качество уроков
Улучшенные 13 активных уроков соответствуют Lesson V2: 5–9 content-сцен, worked example,
визуальная демонстрация, 2–4 checkpoint, application micro-task, interview answer.
Чекпоинты — будущие интерактивные упражнения (backend checkpoint engine не реализован,
см. DATAPATH_LESSON_V2_SPEC). Фейковых проверок не создаём.

### Part 9 — язык
Весь learner-facing контент — русский; код/формулы/термины — английские. Сохранено.

## 5. Точечные патчи после слияния

1. `Linear Regression.md` — секции «Полиномиальная регрессия» и «Функции потерь для
   регрессии» (MSE/MAE/Huber) + «Ответ для собеседования», «Когда использовать».
2. `Logistic Regression.md` — «Когда использовать» (при необходимости).
3. `Support Vector Machines.md` — «Ответ для собеседования».
4. `K-Means.md` — «Когда использовать» + «Ответ для собеседования».
5. `Principal Component Analysis.md` — «Когда использовать» + «Ответ для собеседования».
6. `DBSCAN and Hierarchical Clustering.md`, `Anomaly Detection.md` — «Ответ для
   собеседования».
7. `01_Big_O.md` — «Big Theta и Big Omega».
8. `_meta/LEARNING_CATALOG.md` — добавить skill-группы новых треков
   (python.*, dl.*, data.analysis, numpy/pandas/matplotlib/seaborn, algorithms.*).
9. MOC-карты: починить `[[Data Analysis — карта]]` → `[[00 Data Analysis — карта|...]]`.

## 6. Lessons vs Knowledge vs Practice

| Роль | Куда | Что |
|---|---|---|
| Knowledge (`app: source`, concept) | `10 Знания/...` | Каноническая теория: ML, DL, Python, Алгоритмы, Python Libraries, Data Analysis |
| Lessons (уроки) | `05 Курсы/.../Уроки/` | 13 активных (Classic ML) + 46 draft (будущие треки), все ссылаются на концепты через `content_path` |
| Practice (`app: source`) | `15 Практика/` | NumPy, pandas EDA, Visualization + существующие |
| Cases (`app: include`) | `05 Курсы/.../Кейсы/` | Мини-кейсы и итоговый кейс (не меняются) |

## 7. Валидация (Part 10)

- frontmatter-валидность всех новых/изменённых файлов;
- дубликаты ID (0);
- broken wikilinks (по резолверу, filename/alias/path);
- `PYTHONPATH= uv run python -m app.cli.content validate` — без изменения БД;
- sync на временной БД (`DATAPATH_DATABASE_URL=sqlite:///./data/curriculum_expansion_tmp.db`),
  повторный sync — идемпотентность;
- quality-аудит (`app.cli.content quality`);
- проверка существования `content_path` у всех уроков (включая draft, вручную —
  backend их не валидирует из-за `app: exclude`);
- регенерация `_meta/generated/*` через `tools/build_catalog.py` (по возможности).

## 8. НЕ делаем

- НЕ меняем код backend/frontend, модели БД, схемы; RAG не запускаем.
- НЕ меняем ID существующих заметок.
- НЕ активируем draft-курсы в каталоге приложения (publish = `app == include` остаётся
  только у Classic ML).
- НЕ создаём коммит; ждём ручную ревизию.
