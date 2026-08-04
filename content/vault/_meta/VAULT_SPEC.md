---
title: VAULT SPEC
type: meta
area: vault
status: active
version: 1.0
updated: 2026-07-28
rag: exclude
tags: [vault/meta]
id: meta.vault.vault-spec
schema_version: 2
language: ru
app: exclude
---
# VAULT SPEC

> Нормативный контракт для хранилища Data Science / Machine Learning.
> Решения аудита и очередь работ: [[VAULT_AUDIT]] и [[VAULT_REFACTOR_STATE]].

## 1. Назначение и приоритеты

Vault одновременно служит:

1. основной базой знаний по Data Science, ML, DL, математике, Python и SQL;
2. системой подготовки к собеседованиям;
3. read-only источником истины для локальной RAG;
4. базой знаний локального ML Tutor / Interviewer.

При конфликте требований действуют приоритеты:

1. корректность;
2. ясность для человека;
3. самодостаточность извлекаемого фрагмента;
4. отсутствие дублирования;
5. удобство навигации;
6. компактность.

RAG читает vault, но никогда его не изменяет. Новые знания добавляются и принимаются человеком через Obsidian.

## 2. Архитектурные принципы

- Одна концепция имеет одного канонического владельца.
- Knowledge объясняет; Practice учит делать; Interview проверяет и сжимает.
- Связи между понятиями важнее количества ссылок.
- Основная математика остаётся на практическом DS/ML-уровне.
- Код сначала показывает прямой и читаемый путь, затем абстракции и оптимизации.
- MOC строит маршрут, но не дублирует содержание.
- Не создавать ни монолиты из несвязанных тем, ни сотни notes на один абзац.
- Старые пути сохраняются router-note или aliases только там, где это действительно защищает существующие ссылки.

## 3. Целевая физическая архитектура

Текущие верхнеуровневые разделы сохраняются. На этапе 2 добавляется отдельный слой `15 Практика`; массовое перемещение выполняется только по утверждённому плану миграции.

```text
_meta/
  VAULT_SPEC.md
  VAULT_AUDIT.md
  VAULT_REFACTOR_STATE.md

00 Главная/
  Главная.md
  Начать здесь.md
  Как пользоваться этим хранилищем.md

10 Знания/
  Знания — карта.md
  ML/
    00 ML — карта.md
    01 Classical ML/
      00 Classical ML — карта.md
    02 Deep Learning/
      00 Deep Learning — карта.md
    03 NLP/
      00 NLP — карта.md
    04 Recommendation Systems/
      00 Recommendation Systems — карта.md
    05 Metrics and Validation/
  Математика/
    00 Математика — карта.md
    01 Вероятность/
    02 Статистика/
    03 Линейная алгебра/
    04 Оптимизация/
    09 Deep Dives/
  Data/
    00 Data — карта.md

15 Практика/
  00 Практика — карта.md
  Python/
  pandas/
  SQL/
  sklearn/
  PyTorch/
  ML pipelines/
  Задачи/

20 Источники/
30 Мысли/
40 Проекты/
50 Люди и идеи/

60 Карьера/
  00 Карьера — карта.md
  10 Банк вопросов/
    00 Банк вопросов — карта.md
    Вопросы к собеседованию.md
    20 Interview Notes/
      00 Interview Notes — карта.md

90 Шаблоны/
99 Вложения/
```

### 3.1. Границы разделов

| Раздел | Хранит | Не хранит |
|---|---|---|
| `10 Знания` | каноническую теорию, механизмы, формулы, предположения, сравнения | тренировочные листинги, банки вопросов, project diary |
| `15 Практика` | runnable examples, задачи, реализации, паттерны, пайплайны, диагностику | самостоятельные определения теории |
| `60 Карьера/.../Interview Notes` | вопросы, короткие ответы, follow-up, ловушки | полные выводы, длинные туториалы, второй источник истины |
| `40 Проекты` | решения и контекст конкретного проекта | каноническую общую теорию |
| `20 Источники` | библиографию, конспект источника, provenance | итоговую каноническую формулировку без ссылки в Knowledge |
| `_meta` | правила, аудит, состояние миграции | учебный материал |

## 4. Naming conventions

### 4.1. Имена файлов и H1

- Имя файла и единственный H1 совпадают по смыслу.
- Канонические алгоритмы и устоявшиеся термины называются общепринятым английским именем: `Logistic Regression`, `Naive Bayes`, `Scaled Dot-Product Attention`.
- Русский используется для маршрутов, практических процессов и объяснительных названий: `Проверка гипотез`, `Подготовка табличных данных`.
- Суффикс через длинное тире обозначает роль, если без него возникнет коллизия:
  - `— Practice`;
  - `— Interview`;
  - `— Deep Dive`.
- Числовые префиксы разрешены для MOC, учебных маршрутов и временно сохраняемых совместимых router-notes. Для канонических concept notes они не нужны.
- Не использовать в имени `/`, `\`, `#`, `?`, двоеточие и декоративные emoji.
- Нормализация Unicode — NFC.

### 4.2. Aliases

Aliases покрывают:

- русский и английский варианты;
- общепринятые сокращения: `MLE`, `MAP`, `BCE`, `SVM`, `PCA`;
- варианты написания: `backprop`, `backpropagation`, `LayerNorm`;
- прежнее имя только после осознанного rename.

Alias помогает найти canonical note, но не создаёт вторую терминологию.

## 5. Canonical-note policy

### 5.1. Один владелец концепции

Для каждого понятия существует одна canonical Knowledge Note. Она:

- содержит нормативное объяснение;
- получает входящие ссылки из Practice, Interview, Projects и MOC;
- владеет определениями, обозначениями и основными формулами;
- перечисляет ближайшие смысловые связи.

Practice и Interview не переопределяют canonical concept. Они дают короткий контекст и ссылку на владельца.

### 5.2. Гранулярность

Создавать отдельную note, если тема имеет собственные:

- objective или формальную модель;
- предположения;
- ключевые параметры;
- failure modes;
- минимум две существенные связи с другими концепциями.

Оставлять разделом, если материал понятен только внутри родительской темы и не нужен как самостоятельная retrieval unit.

Ориентир, а не жёсткий лимит:

- canonical Knowledge Note: примерно 700–2500 слов;
- один основной concept и до 6–10 содержательных H2;
- если файл превышает 3000–3500 слов или 20 смысловых headings, проверить необходимость split;
- Question Bank, glossary и MOC могут быть крупнее, но исключаются из основной RAG-коллекции.

### 5.3. Синтезирующие заметки

Сравнения вроде `L1 vs L2`, `Random Forest vs Gradient Boosting` допустимы отдельно, если они не копируют определения. Они ссылаются на обе canonical notes и отвечают только за trade-offs.

### 5.4. Миграция и совместимость

- Сначала определить владельца и целевой путь.
- Перенести сильный материал, а не копировать его.
- Обновить входящие wikilinks.
- Старый файл оставить router-note только при наличии реальной совместимости.
- Router содержит одну фразу и ссылку на canonical target, имеет `type: router`, `status: deprecated`, `rag: exclude`.
- После проверки backlinks ненужный router удаляется отдельным, явно согласованным действием.

## 6. Форматы заметок

Шаблоны задают обязательные вопросы, а не требуют одинаковой длины каждого раздела.

### 6.1. Knowledge / concept

```markdown
# Concept

## Коротко
Что это и зачем нужно — 3–6 предложений.

## Интуиция
Мысленная модель и простой пример.

## Формальная постановка
Входы, выходы, objective; все обозначения определены.

## Как это работает
Механизм или алгоритм по шагам.

## Предположения
Когда вывод корректен и что меняется при нарушении условий.

## Параметры и trade-offs

## Числовой или минимальный пример

## Ошибки и failure modes

## Связи
- [[Prerequisite]] — почему нужен.
- [[Downstream concept]] — что следует дальше.
```

Необязательные разделы: `Вывод`, `Complexity`, `Сравнение`, `Implementation notes`, `Источники`.

### 6.2. Practice

```markdown
# Task — Practice

## Цель
## Вход и ожидаемый результат
## Прямая реализация
## Проверки и ожидаемые инварианты
## Типичные ошибки
## Улучшения и advanced-вариант
## Связанные знания
```

Practice обязана отвечать, что можно запустить, что должно получиться и как понять, что результат неверен.

### 6.3. Interview

```markdown
# Topic — Interview

> Источник: [[Canonical Knowledge Note]]

## Вопрос
### Ответ на 30–90 секунд
### Follow-up
### Ловушка
```

Правила:

- не повторять полный вывод и длинный код;
- для сложной формулы объяснить смысл одной основной строки и направить в Knowledge;
- один topic-файл обычно не превышает 1200–1500 слов;
- follow-up строится от определения к механизму, предположениям и trade-offs;
- вопросный банк хранит вопросы и уровни, а не ответы.

### 6.4. Deep Dive

Deep Dive — отдельная optional note, если доказательство, asymptotics, matrix calculus или numerical subtlety перегружают основной материал.

Она:

- имеет суффикс `— Deep Dive`;
- ссылается на canonical note и обратно;
- имеет `math_depth: 3`;
- не является обязательным prerequisite для базового маршрута;
- не дублирует depth-1 summary.

## 7. Математический контракт

### 7.1. Math depth

| Значение | Назначение | Требования |
|---|---|---|
| `math_depth: 1` | intuition | смысл, одна ключевая формула, определённые символы, простой пример, одна ловушка |
| `math_depth: 2` | practical DS/ML math | происхождение формулы, assumptions, estimator/algorithm, числовой пример, нарушения условий, ссылки на модели |
| `math_depth: 3` | optional Deep Dive | доказательства, asymptotics, matrix calculus, numerical stability |

Canonical math notes преимущественно имеют depth 2 и начинаются с depth-1 summary. Не создавать отдельную дублирующую note только ради depth 1.

### 7.2. Каждая формула

После формулы должны быть понятны:

1. что означает каждый символ;
2. почему формула возникает;
3. какие предположения используются;
4. как она связана с моделью или процедурой;
5. что изменится при других предположениях;
6. один короткий пример, если формула не очевидна.

### 7.3. Синтаксис Obsidian

- Inline math: `$...$`.
- Display math:

```markdown
$$
\mathcal{L}(\theta)=\prod_{i=1}^{n}p(y_i\mid x_i,\theta)
$$
```

- Не использовать `\[` и `\]`: в текущем Obsidian они отображаются как сырой текст.
- Блочная формула отделяется пустыми строками.
- Один блок — одна законченная мысль.

### 7.4. Обязательные model–math bridges

Canonical graph должен явно содержать:

- Linear Regression → Gaussian noise → likelihood → MLE → MSE / OLS;
- Linear Regression → Gauss–Markov theorem — отдельной веткой;
- Logistic Regression → Bernoulli → likelihood → MLE → log-likelihood → BCE / LogLoss;
- L2 → Gaussian prior → MAP;
- L1 → Laplace prior → MAP;
- PCA → centering → covariance → eigenvectors/eigenvalues → projection → explained variance → SVD → scaling;
- Naive Bayes → Bayes theorem → conditional independence → classifier;
- KNN → distance → scaling → curse of dimensionality;
- Gradient Boosting → loss → gradient → pseudo-residuals → sequential correction;
- Neural Network → linear transformation → activation → loss → chain rule → backpropagation → optimizer;
- Transformer → embedding → Q/K/V → scaled dot-product → softmax → weighted sum → multi-head attention → residuals → normalization → FFN.

Gauss–Markov не объясняет происхождение MSE и не должен подменять likelihood-вывод.

## 8. Кодовый контракт

Главное правило: `clarity > cleverness > compactness`.

### 8.1. Общие правила

- Каждый fence имеет язык: `python`, `sql`, `bash`, `text`.
- Retrieval-relevant пример самодостаточен: imports, входные данные и важные зависимости находятся в том же разделе либо явно названы.
- Минимальный пример показывает ожидаемый результат или инвариант.
- Имена отражают смысл предметной области.
- Сначала baseline, затем оптимизация или abstraction.
- Не полагаться на скрытое состояние предыдущей note или notebook cell.
- Production hardening отделяется от учебной реализации.

### 8.2. Python

- небольшие функции;
- минимальная вложенность;
- без ненужного ООП;
- без скрывающих смысл comprehension, lambda и длинных method chains;
- type hints только там, где они помогают чтению;
- random seed и формы данных указываются, когда важны.

### 8.3. SQL

- ключевые слова и отступы единообразны;
- одна логическая операция читается как один этап;
- CTE применяются, если разделяют смысл;
- grain, join key и поведение `NULL` проговариваются;
- запрос читается сверху вниз;
- для window functions явно указан partition/order.

### 8.4. PyTorch

Сначала отдельная базовая Practice Note с явным циклом:

```text
zero_grad
→ forward
→ loss
→ backward
→ optimizer.step
```

Затем — `train/eval`, validation, checkpointing, callbacks, AMP, accumulation, distributed и performance abstractions. Теоретическая note объясняет backprop и optimizers, но не владеет основным runnable trainer.

## 9. YAML conventions

Frontmatter нужен всем индексируемым и навигационным notes. Минимальный контракт:

```yaml
---
title: Logistic Regression
type: concept
area: ml
status: active
aliases:
  - Логистическая регрессия
tags:
  - ml/classical
math_depth: 2
---
```

### 9.1. Контролируемые значения

`type`:

- `concept`
- `practice`
- `interview`
- `deep-dive`
- `moc`
- `project`
- `source`
- `template`
- `router`
- `meta`

`area`:

- `ml`
- `math`
- `dl`
- `nlp`
- `recsys`
- `python`
- `pandas`
- `sql`
- `data`
- `systems`
- `career`
- `vault`

`status`:

- `seedling`
- `active`
- `stable`
- `deprecated`
- `planned`

### 9.2. Поля

| Поле | Правило |
|---|---|
| `title` | совпадает по смыслу с H1 |
| `type` | обязательно |
| `area` | обязательно |
| `status` | обязательно |
| `aliases` | добавлять осмысленные альтернативы; пустой список не нужен |
| `tags` | 1–4 иерархических тега; не заменяют `type` и `area` |
| `math_depth` | только для math-heavy concept/deep-dive |
| `rag` | только исключение или нестандартное включение: `include` / `exclude` |
| `source` | только когда provenance нужен для проверки |

Не добавлять обязательные `id`, `created`, `updated`, `canonical`, `prerequisites` во все notes без работающего потребителя. Каноничность определяется владельцем concept и картой; prerequisites задаются смысловыми wikilinks.

## 10. RAG conventions

### 10.1. Коллекции

Основная Knowledge-коллекция по умолчанию включает:

- `type: concept`;
- `type: deep-dive`;
- выбранные `type: practice`, если раздел самодостаточен.

Interview индексируется отдельной коллекцией для Tutor / Interviewer, но не конкурирует с Knowledge при фактическом ответе.

По умолчанию исключаются:

- `moc`;
- `router`;
- `template`;
- `meta`;
- Question Bank;
- daily notes;
- link-only pages;
- trackers;
- source notes без синтеза;
- всё с `rag: exclude`.

### 10.2. Semantic chunks

- Базовая единица — H2/H3-раздел, а не произвольные N символов.
- Chunk включает title note, breadcrumb headings и aliases.
- Целевой размер содержательного chunk: примерно 150–700 слов; допускаются отклонения для кода и формул.
- В chunk достаточно локального контекста: субъект, входы, обозначения, предположения.
- Заголовок описывает смысл: `Почему attention делят на sqrt(d_k)`, а не `13.1` или `Компоненты`.
- Ссылка не заменяет объяснение.
- Transclusion-only и фрагменты, зависящие от «предыдущей ячейки», не индексируются как готовое знание.
- Код и формула остаются рядом со своим объяснением.

### 10.3. Дедупликация и приоритет

При конфликте retrieval:

1. canonical Knowledge;
2. Deep Dive;
3. Practice;
4. Interview.

RAG не показывает пользователю путь к note как ответ. Он извлекает материал внутренне и формирует полноценный текст, формулы, Python, SQL, pseudocode и примеры.

## 11. Wikilinks и knowledge graph

- Ссылаться на canonical filename; display text использовать только для грамматики.
- Предпочитать inline semantic link вида «BCE возникает из likelihood канонической note о Bernoulli»; реальный wikilink добавлять только после создания target.
- Heading-link использовать только к устойчивому содержательному заголовку.
- Не ссылаться на номера разделов.
- Каждая canonical concept note имеет 2–6 осмысленных связей; сложный hub может иметь больше.
- Раздел `Связи` содержит 3–8 ближайших рёбер с кратким объяснением типа связи.
- Не создавать ссылку ради плотности графа.
- Перед merge миграции проверять:
  - unresolved file links;
  - unresolved heading anchors;
  - ambiguous targets;
  - self-links;
  - новые orphan notes.

## 12. MOC policy

MOC:

- имеет `type: moc`, `status: active`, `rag: exclude`;
- отвечает за одну область или один учебный маршрут;
- группирует concepts по prerequisite/learning path, а не только по папкам;
- добавляет к ссылке одну строку: что даёт note и когда её читать;
- не содержит определений, формул и ответов на интервью;
- показывает отдельные маршруты `Learn`, `Practice`, `Interview`, если они есть;
- не дублирует глобальную Home-карту.

Минимально необходимы:

- `ML — карта`;
- `Classical ML — карта`;
- `Математика — карта`;
- `Deep Learning — карта`;
- `NLP — карта`;
- `Практика — карта`;
- `Interview Notes — карта`.

## 13. Definition of Done

Note считается принятой, если:

- [ ] установлен canonical owner и нет параллельного определения;
- [ ] путь и `type` соответствуют Knowledge / Practice / Interview;
- [ ] `title`, `area`, `status` и aliases проверены;
- [ ] один основной concept или одна чёткая практическая задача;
- [ ] первые абзацы дают самостоятельный контекст;
- [ ] headings семантичны вне страницы;
- [ ] все формулы отображаются в Obsidian;
- [ ] у каждой существенной формулы определены символы, происхождение и assumptions;
- [ ] код помечен языком, читаем и не зависит от скрытого состояния;
- [ ] присутствуют ожидаемый результат или проверки, если это Practice;
- [ ] есть 2–6 осмысленных wikilinks и нет broken/ambiguous links;
- [ ] Interview ссылается на Knowledge и не копирует её;
- [ ] chunk остаётся понятным после retrieval;
- [ ] note добавлена в соответствующий MOC;
- [ ] пройдена проверка имен, Unicode NFC и обратных ссылок;
- [ ] старый материал перенесён, а не продублирован.

## 14. Definition of Done для этапа миграции

Этап 2 нельзя считать завершённым только по созданию новых файлов. Нужны:

- ноль неразрешённых file/heading links;
- ноль неоднозначных canonical targets;
- все P0 из [[VAULT_AUDIT]] закрыты или явно приняты как исключения;
- проверка рендера математики в Obsidian;
- выборочный запуск Python, SQL и PyTorch examples;
- отчёт об изменённых/перенесённых/router notes;
- обновлённый [[VAULT_REFACTOR_STATE]];
- отсутствие массовых удалений без отдельного согласования.

<!-- integration:python-algorithms:start -->
## Extension — Python Core и алгоритмы

Расширение добавляет каноническую теорию в `10 Знания/Python` и
`10 Знания/Алгоритмы`, практические задания в `15 Практика/Алгоритмы` и
интервью-материал в `60 Карьера/10 Банк вопросов/20 Interview Notes/Python и алгоритмы`.

Practice notes с `rag: include` входят в отдельную коллекцию `practice`.
Эталонные решения имеют `type: solution` и используются Code Tutor, но не
показываются режимом Practice до явного разбора пользователя.
<!-- integration:python-algorithms:end -->

## 15. DataPath course layer — extension v2

С 2026-08-05 у vault есть работающий потребитель стабильных content IDs, поэтому для всех notes используются поля `id`, `schema_version`, `language`, `rag` и `app`.

Дополнительные `type`: `course`, `module`, `lesson`. Для практики формат уточняется через `practice_kind`: `exercise`, `mini-case`, `module-case`, `mixed-case`, `project`, `retrieval-card`.

Значения `app`:

- `include` — самостоятельный объект навигации приложения;
- `source` — canonical content, который загружается lesson/case;
- `exclude` — служебный или навигационный материал.

Раздел `05 Курсы` является orchestration layer и не дублирует `10 Знания`. Полный контракт: [[DATAPATH_CONTENT_SPEC]]. Политика retrieval: [[DATAPATH_RAG_POLICY]].

