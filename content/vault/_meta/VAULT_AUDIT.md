---
title: VAULT AUDIT
type: meta
area: vault
status: active
audit_date: 2026-07-28
rag: exclude
tags: [vault/meta]
id: meta.vault.vault-audit
schema_version: 2
language: ru
app: exclude
---
# VAULT AUDIT

> Этап 1: read-only аудит структуры и выборочный аудит содержания. Архитектурный контракт: [[VAULT_SPEC]]. Состояние работ: [[VAULT_REFACTOR_STATE]].

## 1. Scope и метод

Проведены:

- дешёвая инвентаризация дерева, Markdown, frontmatter, headings, размеров, имён, wikilinks и MOC;
- автоматическая проверка file-links, heading anchors и неоднозначных targets;
- targeted reads по Classical ML, Math/Probability/Statistics, DL/NLP, Python/pandas/SQL/sklearn/PyTorch и Interview;
- визуальная проверка математических блоков в Obsidian 1.12.7;
- сравнение пар Knowledge / Interview на размер и буквальное пересечение;
- read-only параллельные доменные аудиты; vault субагентами не изменялся.

Не выполнялись массовые чтение и переписывание, переносы, rename, удаление, нормализация YAML или правка ссылок.

## 2. Snapshot

| Метрика | Результат |
|---|---:|
| Активные Markdown notes без `.obsidian` и `.trash` | 116 |
| Объём Markdown | 725 689 байт |
| Каталоги с notes | 27 |
| Notes с frontmatter | 115 / 116 |
| Notes с `aliases` | 37 / 116 |
| Notes без `type` | 45 / 116 |
| Notes без `area` | 56 / 116 |
| Notes без `status` | 46 / 116 |
| Notes с `math_depth` | 0 / 116 |
| Wikilinks | 804 |
| Неразрешённые file-links | 0 |
| Неразрешённые heading anchors | 0 |
| Неоднозначные targets | 0 |
| Повторяющиеся basenames | 0 |
| Повторяющиеся H1 | 0 |
| Notes с code blocks | 49 |
| Code blocks | 439 |
| Явно помеченные языком code blocks | 438 / 439 |
| Сырые display-math blocks `\[`…`\]` | 93 в 13 notes |
| Корректные display delimiters `$$` | 0 |

Логическая классификация по текущим путям: `PRACTICE` — 35, `KNOWLEDGE` — 27, `INTERVIEW` — 25, прочее — 29. Это приблизительная классификация: физические пути и YAML сейчас не дают надёжного layer filter.

## 3. Что уже хорошо

### 3.1. Навигация и целостность

- Текущий граф синтаксически здоров: 804 wikilinks, ноль broken file-links, broken anchors и ambiguous targets.
- Повторяющихся имён файлов и H1 не найдено.
- Банк вопросов уже организован в работающий маршрут:
  `Question Bank → Interview Note → Theory Note`.
- Старые тематические файлы `01–10` превращены в компактные routers, а не в копии ответов.
- Есть MOC для Home, Knowledge, ML, DL, Sources, Projects, Career, Bank и Interview.

### 3.2. Сильные содержательные области

- Trees / Random Forest: split criteria, pruning, bootstrap, feature subsampling, OOB, correlated-tree variance и trade-offs.
- Gradient Boosting / XGBoost / LightGBM / CatBoost: loss, negative gradient, pseudo-residual, sequential correction, Taylor expansion, gradient/Hessian, leaf weight/gain и библиотечные различия.
- Validation, leakage, metrics и tabular pipelines покрыты практически и близко к реальным собеседованиям.
- DL содержит полную смысловую цепочку:
  `linear transformation → activation → loss → chain rule → backpropagation → optimizer`.
- Transformer раскрывает:
  `embedding → Q/K/V → scaling → mask → softmax → weighted sum → multi-head → residual → LayerNorm → FFN`.
- Language Modeling содержит shifted targets, cross-entropy, perplexity, autoregressive generation, KV-cache, pretraining/SFT, LoRA/QLoRA, AMP и accumulation.
- PyTorch-код в целом читаемый; Python code fences почти всегда размечены языком.
- pandas и end-to-end ML pipelines содержательно богаты.
- A/B checklist включает hypothesis, primary metric, guardrails, randomization unit, MDE, SRM, confidence interval и practical significance.

### 3.3. Дублирование

- Точных файлов-дубликатов и крупных буквально совпадающих разделов не найдено.
- Сравнение Knowledge / Interview пар показало почти нулевое буквальное совпадение длинных фрагментов.
- Проблема не copy-paste, а конкурирующие формулировки и инверсия полноты: отдельные Interview Notes содержат знания, которых нет в Knowledge.

## 4. Карта обязательных связей

| Цепочка | Состояние | Наблюдение |
|---|---|---|
| Linear Regression → Gaussian noise → likelihood → MLE → MSE/OLS | отсутствует | note сразу задаёт MSE |
| Linear Regression → Gauss–Markov | отсутствует | theorem не найден |
| Logistic Regression → Bernoulli → likelihood → MLE → log-likelihood → BCE | почти отсутствует | есть sigmoid/logit и одна фраза про MLE |
| L2 → Gaussian prior → MAP | отсутствует | есть только штраф и геометрия |
| L1 → Laplace prior → MAP | отсутствует | есть только sparsity |
| PCA → centering → covariance → eigen → projection → explained variance → SVD → scaling | критически неполна | есть `Av=λv` и короткая фраза про covariance |
| Naive Bayes → Bayes → conditional independence → classifier | отсутствует | canonical note и вопросы отсутствуют |
| KNN → distance → scaling → curse of dimensionality | отсутствует | есть только упоминание scaling и Item-KNN |
| Gradient Boosting → loss → gradient → pseudo-residual → sequential correction | сильная | одна из лучших цепочек vault |
| Neural Network → linear → activation → loss → chain rule → backprop → optimizer | содержательно сильная | заключена в крупном монолите, почти не выражена рёбрами графа |
| Transformer → embedding → Q/K/V → scaled dot-product → softmax → weighted sum → MHA → residual → normalization → FFN | содержательно сильная | заключена в монолите, почти не выражена canonical nodes |

## 5. Математика

Текущий practical math слой недостаточен для хорошего DS/ML interview:

- одна note смешивает 16 тем: линейную алгебру, calculus, probability, inference и A/B;
- нет random variables, PMF/PDF/CDF, joint/marginal, conditional independence, total probability;
- нет канонических Bernoulli, Binomial, Gaussian, Poisson, Exponential, LLN и CLT;
- нет canonical likelihood, log-likelihood, MLE и MAP;
- expectation/variance/covariance/correlation сведены к нескольким формулам без estimator/bias/total expectation/variance;
- hypothesis testing не раскрывает statistic, standard error, sampling distribution и выбор теста;
- нет canonical SVD, conditioning, convexity, Jacobian/Hessian и общего optimization bridge.

Положительно: p-value и confidence interval сформулированы корректно; отмечены Welch t-test, независимая единица bootstrap, временная структура, SRM и practical significance.

### 5.1. Проблема рендера формул

В 13 ключевых notes найдено 93 пары `\[`…`\]`. В текущем Obsidian Reading View они показываются как буквальные квадратные скобки и LaTeX-код. `$$` не используется ни разу.

Затронуты, в частности:

- `ML Basics and Linear Models.md`;
- `Probability Math and AB Testing.md`;
- `ML Metrics.md`;
- `Trees and Random Forest.md`;
- `Gradient Boosting — XGBoost, LightGBM, CatBoost.md`;
- `01 - Тензоры backprop loss optimizer.md`;
- `04 - Токенизация attention Transformer.md`;
- `05 - Обучение LLM.md`.

Даже корректное содержание сейчас визуально не читается как математика. Это не косметика: человек и будущий chunker получают сырой синтаксис.

## 6. Код и Practice

### 6.1. Сильные стороны

- 438 из 439 code blocks явно размечены языком.
- sklearn-примеры для Logistic Regression, Trees, Random Forest, Gradient Boosting и CatBoost читаемы.
- практические regression/classification pipelines содержат проверки leakage, baseline, split, metrics и diagnostics.
- базовая логика PyTorch `forward → loss → backward → step` присутствует.

### 6.2. Проблемы

- Четыре DL Theory Notes используют скрытое состояние предыдущих notes: imports, `SEED`, `device`, `copy`, `DataLoader`, `TensorDataset`, `plt` и `TinyDecoderBlock`. Изолированный retrieval возвращает неисполняемый пример.
- Главный PyTorch Practice-маршрут сначала показывает abstraction (`run_epoch`, callback, `nullcontext`), а простой training loop появляется позже.
- Нет учебных Practice examples для KNN, Naive Bayes, SVM, PCA, K-Means, XGBoost и LightGBM.
- SQL покрыт компактными примерами, но отдельного системного Practice-маршрута с задачами и проверяемыми результатами нет.
- pandas manual силён, но объединяет IO, audit, cleaning, feature engineering, groupby, merge, reshape, windows, EDA, QA, performance, SQL comparison и interview summary в одном файле.

## 7. Knowledge / Practice / Interview

Разделение концептуально намечено, но не является надёжным контрактом:

- theory-файлы лежат в `10 Знания/ML/01 Основы/Интервью`, имеют `type: theory`, `area: ml/interview` и interview tags;
- Practice находится внутри `10 Знания/Инструменты`, `10 Знания/ML/03 Пайплайны ML` и DL tree;
- `ML — карта знаний` смешивает theory, pipelines и interview routes;
- Interview Notes иногда длиннее Knowledge:
  - ML Basics: отношение слов Interview/Knowledge ≈ 1.21;
  - Recommendation Systems ≈ 1.22;
  - SQL ≈ 1.54;
  - Probability/Math ≈ 1.12.
- A/A, instrumentation, MDE, SRM, sequential testing, multiple testing и CUPED присутствуют только или полнее в Interview, то есть источник истины инвертирован;
- Interview template предлагает заново объяснять механизм и код, что провоцирует второй theory layer.

## 8. RAG-readiness

### Готово

- ссылки технически разрешаются;
- headings и code fences в большинстве файлов доступны парсеру;
- точные дубликаты не создают шум;
- сильный материал уже существует и может быть перенесён, а не переписан с нуля.

### Не готово

- нет canonical-owner и retrieval-role контракта;
- YAML не позволяет стабильно отделить Knowledge от Interview и MOC;
- крупные multi-concept notes дают разнотематические chunks;
- часть headings вроде `Компоненты`, `Этапы`, `Проверь себя`, `13.1` теряет смысл вне страницы;
- DL code chunks зависят от скрытого notebook-state;
- raw display math не рендерится;
- сильные цепочки DL/Transformer находятся внутри документов, но не представлены nodes/edges;
- слабые цепочки Math/Classical ML не могут быть восстановлены retrieval без создания знания.

## 9. Oversized и смешанные notes

| Note | Размер | Headings | Основная проблема |
|---|---:|---:|---|
| `Universal_Pandas_Data_Work_Pipeline.md` | 54 015 B | 123 | manual + practice + interview в одном файле |
| `Вопросы к собеседованию.md` | 41 618 B | 23 | допустимый крупный банк, но исключить из Knowledge RAG |
| `Gradient Boosting — XGBoost, LightGBM, CatBoost.md` | 37 084 B | 63 | несколько algorithm families |
| `Gradient Boosting — Interview.md` | 22 846 B | 42 | слишком велик для quick review |
| `Universal Regression Pipeline.md` | 21 741 B | много | pipeline + объяснения + interview формулы |
| `01 - Тензоры backprop loss optimizer.md` | 19 363 B | много | tensors, layers, loss, backprop, optimizers |
| `Trees and Random Forest.md` | 18 467 B | много | Decision Tree + Bagging + Random Forest |
| `05 - Обучение LLM.md` | 18 256 B | много | LM, generation, fine-tuning, memory, diagnostics |
| `Универсальный пайплайн бинарной классификации.md` | 18 243 B | много | practice + theory + interview summary |
| `04 - Токенизация attention Transformer.md` | 14 155 B | много | tokenization, embeddings, attention, Transformer |

Размер сам по себе не дефект. Банк вопросов остаётся большим и RAG-excluded; concept notes делятся по semantic owner, а не механически по байтам.

## 10. P0 — критично

**Всего: 8.**

| ID | Проблема | Критерий закрытия |
|---|---|---|
| P0-01 | 93 display-math blocks в 13 core notes не рендерятся в Obsidian | все блоки используют проверенный `$$`; выборочный визуальный QA |
| P0-02 | Нет канонического фундамента probability/distributions/conditional independence/likelihood/MLE/MAP | создан согласованный math canon и MOC, глубина 1–2 |
| P0-03 | Нет LR/logistic/regularization origin chains и Gauss–Markov branch | все пять цепочек из раздела 4 объяснены и связаны |
| P0-04 | Нет canonical KNN, Naive Bayes, SVM, K-Means; PCA критически неполна | отдельные canonical notes, MOC, вопросы и связи |
| P0-05 | Knowledge / Practice / Interview физически и семантически смешаны; Interview местами владеет уникальным знанием | Knowledge становится источником истины; слои фильтруются путём и YAML |
| P0-06 | Нет canonical/RAG contract в метаданных: 45 notes без type, 56 без area, 46 без status, 0 с math_depth | мигрированные notes соответствуют YAML и retrieval policy из spec |
| P0-07 | Ключевые DL/NLP code sections зависят от предыдущих notes/notebook-state | каждый индексируемый example самодостаточен или вынесен в Practice |
| P0-08 | Math/Stats не имеет собственного MOC и concept architecture; 16 тем сжаты в одну короткую note | создан компактный набор canonical notes без micro-note explosion |

## 11. P1 — важно

**Всего: 12.**

| ID | Проблема | Критерий закрытия |
|---|---|---|
| P1-01 | Oversized multi-concept notes дают широкие retrieval units | выполнен semantic split Pandas, Boosting, Trees, DL/Transformer/LLM и pipelines |
| P1-02 | Classical ML и DL concepts сгруппированы по курсу, а не по canonical owner | выделены concept notes; сильный материал перенесён без копии |
| P1-03 | Practice coverage асимметричен; простой PyTorch loop не является первым маршрутом | базовые examples и проверки есть для ключевых algorithms; loop-first route |
| P1-04 | Нет canonical Knowledge по classical NLP: BoW, n-grams, TF-IDF; Word2Vec слишком краток | создан NLP foundation и точные links из Interview |
| P1-05 | Stats/inference/calculus/optimization раскрыты поверхностно | practical depth-2 notes покрывают SE, test statistic, CLT, power, gradients, Hessian, conditioning |
| P1-06 | Синтаксически здоровый граф пропускает semantic edges между math и models | bridge links добавлены в обе стороны с объяснением отношения |
| P1-07 | Interview Notes не всегда являются 30–90-second summaries; ссылки в основном note-level | сокращены summaries, добавлены exact source sections, follow-up и traps |
| P1-08 | MOC смешивают слои; нет Math и Classical ML MOC; Tools MOC не индексирует главный pandas manual | MOC соответствуют policy и показывают Learn/Practice/Interview routes |
| P1-09 | Формулы часто не определяют символы, assumptions и последствия нарушения | math checklist выполнен во всех math-heavy canonical notes |
| P1-10 | Question Bank не проверяет MLE/MAP, Gauss–Markov, distributions, CLT, SVD, KNN/NB/SVM/K-Means | добавлены вопросы уровней A–D после появления canonical Knowledge |
| P1-11 | DL/NLP graph скрыт внутри монолитов; headings местами course-generic | semantic headings и canonical nodes сохраняют NN/Transformer chains |
| P1-12 | DL Trainer требует отсутствующий `DL_Interview_Course_Sber_RU.ipynb` | dependency добавлена как управляемый source либо маршрут переписан без неё |

## 12. P2 — улучшение

**Всего: 8.**

| ID | Проблема | Критерий закрытия |
|---|---|---|
| P2-01 | Aliases есть только у 37/116 notes; в DL — у 1/39 | добавлены только полезные русские/английские и acronym aliases |
| P2-02 | Четыре DL filename используют decomposed Unicode/NFD | безопасный NFC rename с проверкой links |
| P2-03 | Generic/course headings теряют контекст при retrieval | headings автономно называют предмет и вопрос |
| P2-04 | Язык и стиль названий не всегда последовательны | применены naming conventions без декоративного массового rename |
| P2-05 | Есть пустая orphan note во `01 Входящие` и старые routers без входящих links | triage: заполнить, архивировать или удалить отдельным согласованным действием |
| P2-06 | `Deep Learning — карта` не ведёт напрямую к Career Interview Notes | добавлен отдельный Interview route |
| P2-07 | Есть локальные терминологические неточности: LR coefficient как «локальный», Hessian как «уверенность» | формулировки уточнены при миграции соответствующих notes |
| P2-08 | Нет optional Deep Dive слоя | depth-3 notes создаются только для реально полезных proofs/numerics |

## 13. Сводный диагноз

Самые слабые области:

1. Probability / Statistics / Linear Algebra как канонический слой.
2. Базовый Classical ML вне Trees и Boosting.
3. Архитектурное разделение Knowledge / Practice / Interview и metadata для RAG.
4. Рендер display math.

Самые сильные области:

1. Trees, Random Forest и Gradient Boosting stack.
2. DL/Transformer/LLM содержание.
3. Validation, leakage, metrics и tabular workflow.
4. Interview navigation и техническая целостность wikilinks.

Vault готов к началу этапа 2 по контракту [[VAULT_SPEC]], но ещё не готов быть надёжным production source для RAG до закрытия P0.
