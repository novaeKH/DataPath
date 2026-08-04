---
title: VAULT REFACTOR STATE
type: meta
area: vault
status: active
updated: 2026-07-28
rag: exclude
tags: [vault/meta]
id: meta.vault.vault-refactor-state
schema_version: 2
language: ru
app: exclude
---
# VAULT REFACTOR STATE

> Операционное состояние переработки. Контракт: [[VAULT_SPEC]]. Baseline и issue register: [[VAULT_AUDIT]].

## Status

| Этап | Состояние | Дата |
|---|---|---|
| Audit | completed | 2026-07-28 |
| Architecture | completed | 2026-07-28 |
| Full refactor | completed with documented P1 debt | 2026-07-28 |
| Final QA | completed | 2026-07-28 |
| Current phase | Stage 3 complete — vault ready for use and read-only RAG | 2026-07-28 |

Этапы 1–3 завершены. Новую реорганизацию не начинать без отдельного запроса или нового подтверждённого дефекта.

## Frozen baseline

- 116 активных Markdown notes.
- 725 689 байт Markdown.
- 804 wikilinks.
- broken file-links: 0.
- broken heading anchors: 0.
- ambiguous targets: 0.
- duplicate basenames: 0.
- duplicate H1: 0.
- 93 неработающих display-math blocks в 13 notes.
- P0: 8.
- P1: 12.
- P2: 8.

Эти числа являются baseline этапа 1. После начала миграции новые измерения добавляются ниже отдельной датой, а baseline не переписывается.

## Current phase

**Текущая точка:** Final QA завершён. Все P0 закрыты; 10 из 12 P1 закрыты или больше не применимы. Два P1 оставлены намеренно и не блокируют использование/RAG: физически большие legacy manuals и пять thematic Interview Notes старого формата.

**Главный риск:** снова включить excluded legacy multi-topic notes в Knowledge corpus или массово переписать пять тематических Interview Notes без отдельной link migration.

## Completed in Stage 2

### Batch 1 — MathJax rendering

- Создан rollback snapshot вне vault: `work/stage2_baseline_2026-07-28.tgz`.
- 93 парных display delimiters в 13 notes заменены с `\[`…`\]` на `$$`.
- Содержимое LaTeX внутри формул не менялось.
- Несбалансированных пар и delimiter внутри code fences не обнаружено.

### Files changed in Batch 1

- `10 Знания/ML/01 Основы/Интервью/Categorical Features.md`
- `10 Знания/ML/01 Основы/Интервью/Gradient Boosting — XGBoost, LightGBM, CatBoost.md`
- `10 Знания/ML/01 Основы/Интервью/ML Basics and Linear Models.md`
- `10 Знания/ML/01 Основы/Интервью/ML Metrics.md`
- `10 Знания/ML/01 Основы/Интервью/Probability Math and AB Testing.md`
- `10 Знания/ML/01 Основы/Интервью/Recommendation Systems.md`
- `10 Знания/ML/01 Основы/Интервью/Trees and Random Forest.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/01 - Тензоры backprop loss optimizer.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/02 - Стабильное обучение PyTorch.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/03 - CNN RNN LSTM GRU.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/04 - Токенизация attention Transformer.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/05 - Обучение LLM.md`
- `10 Знания/ML/02 Deep Learning/05 Тренажер/02 - Формы и параметры.md`

### Batch 2 — Math foundation

- Создан `00 Математика — карта`.
- Созданы 11 canonical concept notes practical depth 2:
  - probability distributions, Bernoulli и Gaussian noise;
  - expectation, variance, covariance, correlation и covariance matrix;
  - conditional probability, Bayes и conditional independence;
  - likelihood, log-likelihood, MLE и MAP;
  - LLN, CLT и standard error;
  - hypothesis testing и confidence intervals;
  - Gauss–Markov;
  - vectors, matrices, rank и projections;
  - eigenvalues и PCA foundations;
  - SVD;
  - gradients, chain rule и optimization.
- `Знания — карта` связана с новым Math MOC и приведена к YAML contract.
- Проверено 122 display-math blocks: forbidden delimiters, unclosed blocks и odd inline delimiters не найдены.
- После deploy: broken links 0, broken anchors 0, ambiguous targets 0, duplicate basenames 0.

### Files changed in Batch 2

- `10 Знания/Знания — карта.md`
- `10 Знания/Математика/00 Математика — карта.md`
- `10 Знания/Математика/01 Вероятность/Random Variables and Distributions.md`
- `10 Знания/Математика/01 Вероятность/Expectation Variance Covariance and Correlation.md`
- `10 Знания/Математика/01 Вероятность/Conditional Probability and Bayes Theorem.md`
- `10 Знания/Математика/02 Статистика/Likelihood MLE and MAP.md`
- `10 Знания/Математика/02 Статистика/LLN CLT and Standard Error.md`
- `10 Знания/Математика/02 Статистика/Hypothesis Testing and Confidence Intervals.md`
- `10 Знания/Математика/02 Статистика/Gauss-Markov Theorem.md`
- `10 Знания/Математика/03 Линейная алгебра/Linear Algebra for ML.md`
- `10 Знания/Математика/03 Линейная алгебра/Eigenvalues Covariance Matrix and PCA Foundations.md`
- `10 Знания/Математика/03 Линейная алгебра/Singular Value Decomposition.md`
- `10 Знания/Математика/04 Оптимизация/Gradients Chain Rule and Optimization.md`

### Batch 3 — Classical ML core

- Создан `00 Classical ML — карта` с отдельными Learn, Practice и Interview routes.
- Созданы 13 canonical concept notes: foundations, Linear/Logistic Regression, Regularization, KNN, Naive Bayes, SVM, PCA, K-Means, Decision Trees, Bagging/Random Forest, Gradient Boosting и comparison XGBoost/LightGBM/CatBoost.
- Восстановлены обязательные causal chains:
  - Linear Regression → Gaussian noise → likelihood → MLE → MSE/OLS;
  - Linear Regression → Gauss–Markov отдельной веткой;
  - Logistic Regression → Bernoulli → likelihood → MLE → log-likelihood → BCE;
  - L2 → Gaussian prior → MAP;
  - L1 → Laplace prior → MAP;
  - Naive Bayes → Bayes → conditional independence → classifier;
  - KNN → distance → scaling → curse of dimensionality;
  - PCA → centering → covariance → eigen/projection/EVR → SVD → scaling;
  - Gradient Boosting → loss → gradient → pseudo-residual → sequential correction.
- Три legacy-монолита заменены совместимыми `type: router`, `rag: exclude`; старые wikilinks сохранены.
- Две heading-ссылки CatBoost перенаправлены на новый canonical owner.
- После deploy: broken links 0, broken anchors 0, ambiguous targets 0, duplicate basenames/H1 0.

### Files changed in Batch 3

- `10 Знания/ML/00 Карта ML/ML — карта знаний.md`
- `10 Знания/ML/01 Classical ML/00 Classical ML — карта.md`
- `10 Знания/ML/01 Classical ML/ML Foundations.md`
- `10 Знания/ML/01 Classical ML/Linear Regression.md`
- `10 Знания/ML/01 Classical ML/Logistic Regression.md`
- `10 Знания/ML/01 Classical ML/Regularization.md`
- `10 Знания/ML/01 Classical ML/K-Nearest Neighbors.md`
- `10 Знания/ML/01 Classical ML/Naive Bayes.md`
- `10 Знания/ML/01 Classical ML/Support Vector Machines.md`
- `10 Знания/ML/01 Classical ML/Principal Component Analysis.md`
- `10 Знания/ML/01 Classical ML/K-Means.md`
- `10 Знания/ML/01 Classical ML/Decision Trees.md`
- `10 Знания/ML/01 Classical ML/Bagging and Random Forest.md`
- `10 Знания/ML/01 Classical ML/Gradient Boosting.md`
- `10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md`
- `10 Знания/ML/01 Основы/Интервью/ML Basics and Linear Models.md`
- `10 Знания/ML/01 Основы/Интервью/Trees and Random Forest.md`
- `10 Знания/ML/01 Основы/Интервью/Gradient Boosting — XGBoost, LightGBM, CatBoost.md`
- `10 Знания/ML/01 Основы/Интервью/Categorical Features.md`

### Batch 4 — Validation, Metrics, A/B and DL canon

- Созданы canonical `Validation Splits and Data Leakage`, `ML Metrics and Threshold Selection` и `A-B Testing`.
- Покрыты random/stratified/group/time splits, GroupKFold, fold-local preprocessing, leakage, classification/regression/ranking metrics, calibration, threshold, MDE, SRM, A/A, multiple/sequential testing и CUPED.
- Созданы четыре DL owners:
  - `Neural Networks and Backpropagation`;
  - `Optimization and Regularization in Deep Learning`;
  - `Embeddings and Attention`;
  - `Transformer and Language Modeling`.
- Neural-network и Transformer causal chains теперь существуют как canonical nodes, а не только headings legacy-монолитов.
- Три старых Validation/Metrics/Probability theory-файла стали routers.
- Четыре DL course notes сохранены как `type: source`, `status: deprecated`, `rag: exclude`; hidden notebook-state больше не попадает в Knowledge retrieval.
- 27 wikilinks в 19 files перенаправлены со старых Validation/Metrics routes прямо на canonical owners.
- Проверено 103 MathJax blocks.
- После deploy и migration: broken links/anchors 0, ambiguous targets 0, duplicate basenames/H1 0.

### Files changed in Batch 4

Canonical и navigation:

- `10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md`
- `10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md`
- `10 Знания/ML/05 Metrics and Validation/A-B Testing.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/Neural Networks and Backpropagation.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/Optimization and Regularization in Deep Learning.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/Embeddings and Attention.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/Transformer and Language Modeling.md`
- `10 Знания/ML/02 Deep Learning/Deep Learning — карта.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории.md`
- `10 Знания/ML/00 Карта ML/ML — карта знаний.md`

Legacy role updates:

- `10 Знания/ML/01 Основы/Интервью/Validation and Data Leakage.md`
- `10 Знания/ML/01 Основы/Интервью/ML Metrics.md`
- `10 Знания/ML/01 Основы/Интервью/Probability Math and AB Testing.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/01 - Тензоры backprop loss optimizer.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/02 - Стабильное обучение PyTorch.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/04 - Токенизация attention Transformer.md`
- `10 Знания/ML/02 Deep Learning/04 Теория/05 - Обучение LLM.md`

Canonical link migration также изменила 19 источников, перечисленных в log текущей сессии; содержательно в них менялись только exact wikilink targets.

### Batch 5 — Practice layer and core Interview

- Создан отдельный верхнеуровневый `15 Практика` с MOC и пятью читаемыми standalone examples: Python, pandas, SQL, sklearn и PyTorch.
- Новый PyTorch example содержит imports, synthetic data, model, явные train/validation loops, `train()`/`eval()`, `no_grad()` и проверяемые invariants; он больше не зависит от состояния соседних notes.
- Новый sklearn example использует split, fold-safe preprocessing в `Pipeline`, probabilities, validation threshold и invariants.
- Python, pandas и SQL examples выполнены на test data; sklearn/PyTorch code blocks скомпилированы и проверены по обязательной структуре. Runtime packages sklearn/torch в доступном QA environment отсутствовали, поэтому численные результаты для них не заявлялись.
- Семь central Interview Notes переведены в компактный формат: `Вопрос` → `Ответ 20–30 секунд` → `Если попросят глубже` → `Follow-up` → `Связанные знания`.
- `00 Interview Notes — карта` отделяет устную тренировку от Knowledge.
- 191 brittle heading links на переписанные Interview Notes заменены стабильными тематическими routes в двух source files; display labels и список вопросов сохранены.
- Legacy pandas manual и advanced PyTorch scaffold сохранены, но помечены как вторичные маршруты и исключены из canonical RAG.
- Формулы и layout новых Transformer и PyTorch notes визуально проверены в Obsidian.
- После deploy и anchor migration: 158 Markdown notes, 1 078 wikilinks, broken links 0, broken anchors 0, ambiguous targets 0, duplicate basenames/H1 0.

### Files changed in Batch 5

Practice and navigation:

- `00 Главная/Главная.md`
- `10 Знания/Знания — карта.md`
- `10 Знания/ML/00 Карта ML/ML — карта знаний.md`
- `15 Практика/00 Практика — карта.md`
- `15 Практика/Python/Readable Python for Data Work — Practice.md`
- `15 Практика/pandas/pandas Data Cleaning and Joins — Practice.md`
- `15 Практика/SQL/SQL Aggregations and Windows — Practice.md`
- `15 Практика/sklearn/sklearn End-to-End Classification — Practice.md`
- `15 Практика/PyTorch/PyTorch Training Loop — Practice.md`
- `10 Знания/Инструменты/Universal_Pandas_Data_Work_Pipeline.md`
- `10 Знания/ML/02 Deep Learning/01 База/04 - Универсальный train-valid каркас.md`

Interview:

- `60 Карьера/10 Банк вопросов/20 Interview Notes/00 Interview Notes — карта.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/ML Basics and Linear Models — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Validation and Metrics — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Trees and Random Forest — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Gradient Boosting — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Probability Math and AB Testing — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Deep Learning — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/NLP and Transformers — Interview.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Categorical Features — Interview.md`
- `60 Карьера/10 Банк вопросов/Вопросы к собеседованию.md`

### Batch 6 — Metadata and RAG acceptance

- Frontmatter-only normalization применена к 107 notes; body, formulas, code и wikilinks не менялись.
- Все 157 непустых active Markdown files имеют `title`, controlled `type`, controlled `area`, controlled `status` и `tags`.
- MOC/router/template/meta/source и stateful legacy notes явно имеют `rag: exclude`.
- Пять standalone notes в `15 Практика` явно имеют `rag: include`.
- 12 `type: interview` доступны отдельной Interview collection и не конкурируют с основной Knowledge collection.
- Read-only dry-run manifest: 51 indexed notes, 539 semantic chunks:
  - Knowledge: 39 notes / 395 chunks;
  - Interview: 12 notes / 144 chunks.
- Каждый chunk содержит title и breadcrumb context.
- Chunk QA: duplicate IDs 0, exact duplicate content 0, heading collisions 0, oversized chunks 0, empty chunks 0.
- Rollback archive metadata-блока: `work/stage2_wave6_metadata_before.tgz`, SHA-256 `bc24681c7372069475663b15144a4619376fd71744811469db2f22a130eb2ef1`.
- Final QA после deploy: 158 active Markdown notes, 1 077 wikilinks, broken links/anchors 0, ambiguous targets 0, duplicate basenames/H1 0; 330 display-math blocks, delimiter problems 0.

### Files changed in Batch 6

Изменён только frontmatter следующих групп:

- 31 legacy DL Practice/trainer/template notes — controlled role + `rag: exclude`;
- 5 legacy ML pipeline notes — `type: practice`, `area: ml`, `rag: exclude`;
- 12 Interview Notes — единый `type: interview`, `area: career`, отдельная collection;
- 10 interview routers и Question Bank/MOC — controlled router/MOC role + exclude;
- 5 standalone Practice notes — explicit `rag: include`;
- основные MOC, guides, templates, project/career support files и 3 `_meta` notes — controlled values;
- `Categorical Features` и `Recommendation Systems` — controlled canonical concept roles;
- `Python for Interviews`, `SQL for Interviews` и legacy CNN/RNN note — source/exclude до отдельной P1-переработки.

### Batch 7 — P1 Classical NLP

- Создан один canonical owner `Classical NLP Foundations` вместо четырёх micro-notes.
- Покрыты tokenization, word/character n-grams, Bag of Words, TF-IDF, cosine normalization, CBOW, Skip-gram и negative sampling.
- Причинные связи восстановлены: sparse text representation → regularized linear model / Naive Bayes; vocabulary/IDF → fold-local fit → leakage; Word2Vec static embeddings → contextual embeddings → Transformer.
- Добавлены assumptions, failure modes, baseline workflow и interview follow-ups.
- Обновлены ML MOC и knowledge route в `NLP and Transformers — Interview`.
- Формулы и layout новой note визуально проверены в Obsidian.
- QA после deploy: 159 active Markdown notes, 1 091 wikilinks, broken links/anchors 0, ambiguous targets 0, duplicate basenames/H1 0; 338 display-math blocks, delimiter problems 0.
- RAG dry run после Batch 7: 52 notes / 550 chunks; duplicate IDs/content, heading collisions, oversized и empty chunks — 0.

### Files changed in Batch 7

- `10 Знания/ML/04 NLP/Classical NLP Foundations.md`
- `10 Знания/ML/00 Карта ML/ML — карта знаний.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/NLP and Transformers — Interview.md`

## Decisions

| ID | Решение |
|---|---|
| D-01 | `10 Знания` становится единственным владельцем канонической теории. |
| D-02 | Для Practice на этапе 2 планируется отдельный верхнеуровневый раздел `15 Практика`. |
| D-03 | Interview остаётся в `60 Карьера/10 Банк вопросов`; ответы сжимают Knowledge, но не заменяют её. |
| D-04 | Одна concept — одна canonical note; сравнения и routers не становятся вторым владельцем. |
| D-05 | Основная математика — depth 1–2; depth 3 живёт только в optional `— Deep Dive`. |
| D-06 | Display math в Obsidian использует `$$`; `\[`…`\]` запрещены. |
| D-07 | Gauss–Markov хранится отдельной веткой от likelihood → MLE → MSE/OLS. |
| D-08 | Canonical notes делятся по semantic owner, а не механически по размеру. |
| D-09 | MOC и Question Bank исключаются из основной Knowledge RAG; Interview индексируется отдельно. |
| D-10 | RAG chunks строятся по semantic H2/H3 и получают title/breadcrumb context. |
| D-11 | Retrieval-relevant код не зависит от состояния предыдущей note или notebook cell. |
| D-12 | Сильный существующий материал переносится; copy-paste дубликаты не создаются. |
| D-13 | Совместимые старые пути сохраняются router-note только при наличии реальных backlinks. |
| D-14 | Массовые удаления, destructive rename и архивирование требуют отдельной проверки и согласования. |
| D-15 | Механическая конверсия MathJax выполняется отдельно от смысловой переработки, чтобы упростить rollback и QA. |
| D-16 | Foundation concepts группируются в 11 самостоятельных retrieval owners; Bernoulli/Gaussian остаются разделами distribution note, а не микрозаметками. |
| D-17 | Gauss–Markov имеет собственного canonical owner и не используется как объяснение squared loss. |
| D-18 | Legacy theory monolith сохраняет basename как router; каноническое содержание живёт только в новых concept notes. |
| D-19 | XGBoost, LightGBM и CatBoost остаются одной comparative implementation note; общий algorithmic mechanism принадлежит отдельной `Gradient Boosting`. |
| D-20 | Legacy DL course notes не удаляются: они доступны человеку как source, но исключены из RAG из-за multi-topic и cross-note state. |
| D-21 | Internal links мигрируются прямо на canonical owner; router остаётся только для внешней/исторической совместимости. |
| D-22 | `15 Практика` — основной маршрут для standalone runnable examples; большие legacy manuals не переносятся массово и не становятся вторым canonical owner. |
| D-23 | Core Interview Notes содержат ограниченный набор качественных ответов и links в Knowledge; расширенный Question Bank остаётся программой follow-up и использует стабильные note-level routes вместо хрупких anchors. |
| D-24 | Runtime QA сообщает реальную глубину проверки: execution для доступных dependencies, compile/structure checks для отсутствующих, без вымышленных outputs. |
| D-25 | Metadata normalization меняет только frontmatter; legacy material получает controlled role и exclusion вместо массового переноса или удаления. |
| D-26 | Knowledge RAG включает concept/deep-dive и только explicit standalone Practice; Interview формируется отдельной collection; maps/routers/sources/meta исключены. |
| D-27 | Chunking выполняется по semantic H2 и при необходимости H3, с обязательным title/breadcrumb context; manifest остаётся read-only. |
| D-28 | N-grams, BoW, TF-IDF и Word2Vec образуют один coherent classical NLP owner; отдельные micro-notes появятся только при реальном depth/retrieval use case. |
| D-29 | Knowledge chunks короче target объединяются только внутри одной note; Interview сохраняет question-level chunks. Каждый chunk получает title, breadcrumb и aliases. |
| D-30 | Пустой `01 Входящие/Вопросы — Python и pandas.md` перемещён в `.trash/Final QA`, потому что его basename конфликтовал с alias действующего interview-router. Перемещение обратимо. |
| D-31 | Пять thematic Interview Notes старого формата сохраняются как P1 debt: они полезны человеку и семантически извлекаемы, но не считаются нормализованными по новому шаблону. |

## P0 progress

| P0 | Состояние |
|---|---|
| P0-01 MathJax rendering | completed |
| P0-02 Probability/Likelihood foundation | completed |
| P0-03 LR/Logistic/Regularization/Gauss–Markov chains | completed |
| P0-04 KNN/NB/SVM/K-Means/PCA | completed |
| P0-05 Knowledge/Practice/Interview separation | completed — distinct MOC/routes and core notes |
| P0-06 YAML/RAG roles | completed — controlled metadata and dry-run acceptance |
| P0-07 DL code hidden state | completed — standalone PyTorch Practice; legacy stateful notes excluded |
| P0-08 Math concept architecture | completed |

## Known problems

- Пять thematic Interview Notes — `Categorical Features`, `Recommendation Systems`, `Python and pandas`, `SQL`, `Projects` — сохраняют старый compact format без четырёх обязательных H3 на каждый вопрос. Это P1-07; новый `Core Classical Models — Interview` уже нормализован.
- Большие legacy pandas и ML pipeline manuals остаются физически под `10 Знания`, но имеют controlled legacy role и исключены из Knowledge RAG. Это P1-01.
- `DL_Interview_Course_Sber_RU.ipynb` отсутствует, но активные маршруты от него больше не зависят; P1-12 больше не применим.
- sklearn и PyTorch examples не выполнены end-to-end из-за отсутствия этих packages в доступном QA runtime; syntax и pipeline/training-loop structure проверены.

## Next actions

### После Final QA — только по отдельной необходимости

1. Нормализовать пять remaining thematic Interview Notes только атомарно, сохраняя anchors или выполняя отдельную link migration.
2. Делить oversized pandas/pipeline manuals только по подтверждённым retrieval failures.
3. Выполнить sklearn/PyTorch examples end-to-end, когда packages появятся в QA runtime.
4. Не добавлять автоматическую запись RAG-результатов в vault: Obsidian остаётся source of truth.

## Do not redo

Следующие работы уже выполнены на этапе 1 и не должны повторяться с нуля:

- инвентаризация всех активных Markdown paths и размеров;
- подсчёт frontmatter/YAML coverage;
- проверка duplicate basenames и H1;
- полная проверка file wikilinks, heading anchors и ambiguous targets;
- перечень MOC;
- ранжирование oversized notes;
- targeted audit Classical ML;
- targeted audit Math / Probability / Statistics;
- targeted audit DL / NLP;
- targeted audit Practice / Interview;
- проверка обязательных knowledge chains;
- визуальная проверка display math в Obsidian;
- формирование P0/P1/P2 register;
- определение Knowledge / Practice / Interview и RAG contracts.

На этапе 2 следует только обновлять baseline после каждого batch и ссылаться на выводы [[VAULT_AUDIT]], а не повторять полный Stage 1 audit.

## Change log

| Дата | Событие | Изменения в учебных notes |
|---|---|---|
| 2026-07-28 | Stage 1 audit completed | нет |
| 2026-07-28 | Architecture contract completed | нет |
| 2026-07-28 | Stage 2 Batch 1: MathJax delimiters | 13 notes, 93 blocks |
| 2026-07-28 | Stage 2 Batch 2: Math foundation | 12 new notes, 1 MOC update |
| 2026-07-28 | Stage 2 Batch 3: Classical ML core | 14 new notes, 5 compatibility/navigation updates |
| 2026-07-28 | Stage 2 Batch 4: Validation/Metrics/DL canon | 7 new notes, 10 role/navigation updates, 27 links migrated |
| 2026-07-28 | Stage 2 Batch 5: Practice and core Interview | 6 new Practice notes, 1 Practice MOC, 7 core Interview rewrites, 191 anchors migrated |
| 2026-07-28 | Stage 2 Batch 6: Metadata and RAG acceptance | 107 frontmatter-only updates, 539-chunk dry run |
| 2026-07-28 | Stage 2 Batch 7: Classical NLP P1 | 1 new canonical note, 2 navigation updates |
| 2026-07-28 | Stage 3 Final QA | 68 defects fixed; 1 new Interview Note; 0 broken/ambiguous links; final read-only RAG manifest |

## Final QA

- broken links: `0` file links, `0` heading anchors, `0` ambiguous targets.
- duplicate concepts: `0` duplicate canonical H1/basenames, `0` alias collisions, `0` concept orphans, `0` self-links.
- unresolved P0: `0`.
- unresolved P1: `2` — P1-01 and P1-07, both intentionally unresolved and non-blocking.
- formulas checked: `338` display blocks and `801` math expressions; `0` delimiter/brace/fraction/subscript/LaTeX-mode problems; A/B sample-size formula and inline MathJax visually checked in Obsidian Reading View.
- RAG readiness: ready for read-only indexing; `53` notes → `245` chunks (`105` Knowledge, `140` Interview), with title/breadcrumb/aliases and `0` duplicate IDs/content, heading collisions, empty, oversized or undersized QA findings.
- final status: ready for daily use and future read-only RAG; Obsidian remains source of truth.

### Исправления Final QA

- Исправлена malformed fraction в A/B sample-size formula.
- `60` пар inline delimiters `\(...\)` в `10` legacy DL/Interview notes приведены к `$...$`.
- Исправлена точная интерпретация отрицательного $R^2$.
- Устранены `2` alias collisions; пустой conflicting placeholder перемещён в восстанавливаемую `.trash/Final QA`.
- sklearn threshold example теперь явно обрабатывает отсутствие feasible threshold.
- RAG dry-run добавляет aliases и объединяет короткие Knowledge sections до semantic target без смешения notes.
- P1-10 закрыт: добавлен `Core Classical Models — Interview`, а Question Bank получил маршруты по KNN, Naive Bayes, SVM, PCA, K-Means, MLE/MAP и Gauss–Markov.

### P0 reconciliation

| Issue | Final status |
|---|---|
| P0-01 MathJax rendering | fixed |
| P0-02 Probability/Likelihood foundation | fixed |
| P0-03 LR/Logistic/Regularization/Gauss–Markov chains | fixed |
| P0-04 KNN/NB/SVM/K-Means/PCA | fixed |
| P0-05 Knowledge/Practice/Interview separation | fixed |
| P0-06 YAML/RAG contract | fixed |
| P0-07 DL hidden notebook state | fixed |
| P0-08 Math MOC/concept architecture | fixed |

### P1 reconciliation

| Issue | Final status |
|---|---|
| P1-01 Oversized multi-concept notes | intentionally unresolved — legacy manuals preserved and excluded from Knowledge RAG |
| P1-02 Canonical owners | fixed |
| P1-03 Practice coverage / loop-first | fixed at key-route scope |
| P1-04 Classical NLP | fixed |
| P1-05 Stats/calculus/optimization depth | fixed |
| P1-06 Semantic math-model edges | fixed |
| P1-07 Interview summaries/anchors | intentionally unresolved — five thematic notes remain legacy compact format |
| P1-08 MOC routes | fixed |
| P1-09 Formula symbols/assumptions | fixed in canonical math-heavy notes |
| P1-10 Question Bank coverage | fixed |
| P1-11 DL/NLP graph/headings | fixed |
| P1-12 Missing DL notebook dependency | no longer applicable — active route is standalone |

### Files changed in Final QA

- `10 Знания/ML/05 Metrics and Validation/A-B Testing.md`
- `10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md`
- `10 Знания/ML/01 Основы/Интервью/Validation and Data Leakage.md`
- `10` legacy DL/Interview notes with inline MathJax delimiters.
- `15 Практика/sklearn/sklearn End-to-End Classification — Practice.md`
- `60 Карьера/10 Банк вопросов/Вопросы к собеседованию.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/00 Interview Notes — карта.md`
- `60 Карьера/10 Банк вопросов/20 Interview Notes/Core Classical Models — Interview.md`
- `01 Входящие/Вопросы — Python и pandas.md` → `.trash/Final QA/Вопросы — Python и pandas.md` (empty, recoverable).
- `_meta/VAULT_REFACTOR_STATE.md`

## Stop conditions

Остановить batch и обновить этот файл, если:

- обнаружены два возможных canonical owners;
- rename создаёт ambiguous links;
- формула после преобразования меняет смысл;
- код требует внешнего dataset/notebook, которого нет;
- Interview содержит уникальное знание без понятного Knowledge target;
- требуется удаление или необратимая операция;
- новый scope выходит за решения Stage 1.

<!-- integration:python-algorithms:start -->
## Extension 2026-07-31 — Python и алгоритмы

- По явному запросу владельца добавлено 81 исходных заметок курса.
- Созданы карты Python, алгоритмов, практикума и интервью.
- Исходные имена файлов сохранены, чтобы не ломать 386 внутренних wikilinks.
- Материал разделён на `concept`, `practice`, `solution`, `interview`, `moc` и `source`.
- Vault остаётся read-only источником для агента; индекс и настройки хранятся вне vault.
<!-- integration:python-algorithms:end -->
