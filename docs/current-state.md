# DataPath — текущее состояние

> Обновлено 2026-08-20. Рабочая ветка `main`; release/tag не создаётся.

## Integrated Practice

- Раздел «Практика» полностью заменён двумя самостоятельными рабочими пространствами: SQL
  Praktikum и AlgoPath. Старые DataPath exercises/mini-cases больше не показываются в Practice,
  Today или Focus; исторические записи остаются в local state для безопасной миграции.
- SQL Praktikum содержит 76 исходных задач в 9 разделах. Запросы выполняются в Web Worker через
  SQLite WASM на компактной согласованной копии Olist (~27 MB); доступны схема, многоуровневая
  помощь, проверка полного результата, эталон и сохранение черновика/прогресса.
- AlgoPath содержит 71 исходную Python-задачу в 14 темах. Код исполняется локально в отдельном
  Pyodide Worker с public/hidden tests, адаптерами ListNode/TreeNode/GraphNode/class/in-place,
  таймаутом, диагностикой и восстановлением worker после остановки.
- Оба source-проекта остаются read-only. Версионируемые PWA assets собираются детерминированным
  `scripts/integrate_practice_projects.py`; ручной target — `make sync-practice-projects`.
- Progress schema v4 хранит статусы, попытки, черновики, использование подсказок, открытие решения
  и последний результат отдельно для SQL и Algorithms. Данные переживают refresh и offline запуск.
- Service worker `datapath-v21-practice-ux-editor` кэширует каталоги и runner вместе с
  shell, а крупные SQLite/Pyodide assets — отказоустойчиво и независимо от установки PWA.
- Desktop navigation уплотнена до 198 px, SQL/AlgoPath task catalogs — до 238/220 px; полезная
  ширина условия и редактора увеличена без изменения мобильной информационной архитектуры.
- SQL-кнопка «Схема базы» стала явным contextual action с иконкой, пояснением, текущими таблицами,
  `aria-expanded` и доступной связью с панелью полей/типов.
- Общий SQL/Python editor остаётся нативным `textarea`, но получил синхронный syntax layer, номера
  строк, Tab indentation и отдельные цвета для keywords, definitions, functions, methods, types,
  strings, numbers и comments. Ввод, выделение, hotkey и выполнение runner не изменены.

## Эталонный маршрут Linear Regression

- Маршрут собран в существующем content pipeline без изменения stable IDs:
  `случайные величины и нормальное распределение → ожидание/дисперсия → MLE/MAP/МНК →
линейная регрессия → практика → кейс спроса на велосипеды`.
- Урок Linear Regression перестроен от задачи и числового сравнения прямых к MSE, обучению
  `LinearRegression`, проверочной выборке, метрикам и анализу остатков. Матричная форма, проекция,
  MLE, Gauss–Markov и градиентный спуск сохранены как углубление, а не как входной барьер.
- Математические уроки 028, 029 и 033 теперь последовательно объясняют нормальный шум,
  математическое ожидание, дисперсию, правдоподобие и переход
  `Gaussian noise → MLE → least squares → MSE`. MLE и теорема Гаусса — Маркова разделены.
- Прежний case `case.ml.bike-demand-regression` и короткие встроенные упражнения выведены из
  пользовательского Practice; Review сохранил числовой, концептуальный и debugging-вопросы.
- Интерактивная прямая показывает остатки, MAE/MSE, оптимальную МНК-прямую и влияние выброса.
  Добавлена лаборатория нормального шума с управляемыми остатком и стандартным отклонением.
- Существующие related/prerequisite edges формируют 14 связей Linear Regression в Atlas. Старые
  progress, Today, Focus, Review и маршруты не мигрировались и не сбрасывались.
- Практический стандарт для следующих вертикальных маршрутов закреплён в
  `docs/content-style-guide.md`.

## Learning experience redesign

- Интерфейс переведён с утилитарной dashboard-композиции на спокойную образовательную систему с
  indigo/violet accent, отдельной светлой и тёмной палитрой, мягкими пространственными фонами и
  единой типографической иерархией.
- Навигация сокращена до пяти постоянных разделов: Главная, Учиться, Практика, Повторение и
  Прогресс. Focus открывается из учебного контекста, а Atlas оставлен вторичной картой знаний.
- Today стал Learning Home: крупный resume hero, реальный прогресс трёх проходов, вертикальный план
  дня и следующие уроки формируются из существующих Today/Roadmap данных.
- Learn использует визуальную библиотеку карточек. Для девяти курсов создана единая система
  переиспользуемых SVG-artworks с разными мотивами: код, функция, таблица, pipeline, дерево,
  нейросеть, токены, retrieval и MLOps flow.
- Страница курса показывает hero, круговой progress и модули как вертикальное путешествие; статусы
  и текущий урок по-прежнему берутся из сохранённого progress.
- Focus получил reading width 720 px, размер текста 17 px / line-height 1.78, крупный заголовок,
  непрерывный prose, премиальные code/formula/demo surfaces и спокойный outline без raw skill IDs.
- Review, Practice и Roadmap получили самостоятельные visual heroes и более ясные композиции;
  Atlas уже использует блочную карту направлений вместо большого графа.
- Mobile navigation соответствует desktop-информационной архитектуре. Проверены размеры 390×844,
  safe areas, светлая и тёмная темы; интерактивный Gini threshold повторно проверен в браузере.

## Canonical curriculum v2

- Production curriculum содержит ровно 100 canonical lessons с номерами 1–100: Python Core,
  NumPy/pandas/EDA, SQL, Math/Statistics, scikit-learn, Classic ML, Deep Learning, NLP, LLM/RAG и
  MLOps/ML Engineering.
- Маршрут собран в 9 courses и 32 крупных тематических modules. Algorithms остаётся отдельным
  AlgoPath-тренажёром и не маскируется под уроки каталога, Today, Roadmap, Review или Atlas.
- Полные canonical Markdown chapters находятся в `content/vault/10 Знания/DataPath v2/`;
  production lesson manifests — в существующем `content/vault/05 Курсы/`.
- Legacy course/module/lesson manifests архивированы в parser-excluded
  `content/vault/_meta/legacy-v1/`. Старые notes в `10 Знания` остаются source-only материалами.
- Полная identity/progress карта: `docs/content-v2-migration.md`.

## Lesson experience

- Все 100 canonical lessons повторно проверены как единый учебный маршрут. Уроки 1–36, которые
  были заметно короче остального корпуса, дополнены связными разобранными примерами без удаления
  исходного материала. Минимальный объём объясняющего prose в основном корпусе теперь превышает
  400 слов без учёта code/formula/frontmatter.
- Формальная цепочка «предыдущий номер» заменена semantic prerequisites: каждый урок опирается
  только на реально нужные понятия. Cross-domain переходы (Math → ML → DL → NLP → RAG → MLOps)
  проверены отдельно; зависимостей на текущий или будущий урок нет.
- В Focus перед новым материалом показывается компактный блок «Перед началом» со ссылками на
  prerequisite-уроки. Поэтому ученик может закрыть пробел до чтения, а не обнаружить его внутри
  формулы или практики.
- Одинаковая служебная цель из migration manifests больше не попадает в интерфейс. Для каждого
  урока renderer формирует конкретный результат обучения из его смысловых разделов, а вручную
  написанные learning objectives сохраняет без изменений.
- Focus показывает prose-like scenes (Markdown, formula, code, table, inline figure) единым
  непрерывным документом. Checkpoint, self-assessment, interactive lab и visual demo остаются
  отдельными учебными surfaces.
- Внутри документа показывается один source-backed H2 на смысловой раздел; автоматически
  сгенерированные scene titles не дублируют первую строку или вложенный H3. Outline строится по
  разделам, ограничен 12 пунктами и компактно отображает длинные названия.
- Canonical LaTeX delimiters `\[…\]` и `\(...\)` нормализуются parser-ом и отображаются через
  KaTeX, включая формулы и математические заголовки.
- Parser сохраняет исходный учебный порядок `вводная → code/formula → объяснение`: метки
  «Неправильно» и «Правильно» больше не оказываются после чужого примера. Контрастные примеры
  оформлены отдельными спокойными error/success-карточками.
- Технические source-разделы с описанием будущей визуализации скрыты из урока; вместо текстового
  mock/spec ученик сразу видит подключённый интерактивный visual demo.
- 421 fenced Python-пример синтаксически валиден; исполняемые пропуски `...` устранены. Все
  сравнительные разделы содержат полную пару «неправильно → правильно».
- Outline выводит не больше 12 смысловых точек вместо десятков технических scenes; desktop rail и
  mobile details используют одинаковую навигацию.
- Resume position, scene progress, lesson completion, notes, previous/next lesson и Review scheduling
  сохранены. Canonical chapters заканчиваются неоцениваемой трёхуровневой self-assessment.
- 57 существующих interactive visual demos и 3 ML labs сохранены. В release/PWA все три
  лаборатории рассчитываются локально: Gini/Entropy split, глубина дерева и сравнение
  Decision Tree/Random Forest/Gradient Boosting больше не требуют API. Дополнительно 38
  уроков получили topic-specific step-by-step visual flows с ручным переходом, autoplay, pause и
  reset. Теперь 98 из 100 lessons имеют interactive visual demo; оставшиеся 2 используют
  встроенные teaching figures, поэтому визуальное объяснение есть у всех 100 уроков.

### Focus section progress — Definition of Done

- [x] Все реально просмотренные главы становятся изученными; короткие сцены не теряются при
      обычной прокрутке, PageDown и быстром непрерывном скролле.
- [x] Активная глава и сохранённые посещения — разные состояния: уход с главы не снимает зелёный
      статус, а checkpoint без ответа не считается выполненным.
- [x] Переход по оглавлению сохраняет исходную и целевую главы, но не помечает автоматически все
      промежуточные разделы.
- [x] Последняя доступная для чтения сцена засчитывается у конца документа даже тогда, когда её
      невозможно выровнять по центру viewport.
- [x] Посещения записываются последовательной очередью и объединяются монотонно: запоздавший
      ответ API не может удалить более новый progress.
- [x] Состояние восстанавливается после refresh/повторного открытия, а процент и счётчик содержания
      используют один и тот же набор сохранённых scene IDs.
- [x] Достижение последней главы само по себе не завершает урок: итоговый completion остаётся
      отдельным явным действием.

## Figures and offline update

- 21 teaching PNG интегрирован в ML/DL главы по смыслу: Logistic Regression, kNN, SVM, Decision
  Tree, Random Forest, Boosting, imbalance, calibration, PCA, neuron, MLP, Backprop, optimizers,
  Dropout, CNN, pooling, RNN, LSTM, embeddings, Attention и Transformer.
- Assets лежат в `frontend/public/content-assets/datapath-v2/figures/`; Markdown renderer добавляет
  base-path-safe URL, lazy loading, alt и caption.
- Service worker pre-cache-ит все 21 figure вместе с release snapshot, не затрагивая localStorage;
  текущая версия cache также поддерживает offline assets интегрированной практики.

## Local state migration

- Local store schema v4 принимает предыдущие backup/state schema и добавляет независимый progress
  двух интегрированных тренажёров.
- Stable semantic lesson IDs сохранены; изменённые IDs переписываются явной таблицей.
- Для объединённых chapters completion переносится только при завершении всех сильных
  predecessors. Иначе сохраняются familiarity evidence/notes, но новый chapter остаётся начатым.
- Notes объединяются без потерь; Review/Today/roadmap references мигрируются; Algorithms items
  удаляются только из active Review queue, а history и backup data сохраняются.

## Current verification

- Corpus input audit: 100 lessons, 1–100 без gaps/duplicates, 15 README исключены, code fences
  сбалансированы. Отдельно проверяются source prose, semantic prerequisites и отсутствие
  служебной generic objective в готовом уроке.
- Content sync: 532 scanned, 0 errors, 0 warnings после slug separation source/manifest.
- Content validator: 0 errors, 0 warnings.
- Content quality: 100 lessons, 0 errors, 0 warnings, 0 suggestions.
- Полный backend suite проходит: 230 tests. Полный frontend suite проходит: 141 tests, включая
  offline regression для Gini/Entropy, максимальные параметры ensemble-лаборатории и Focus
  progress при медленной/быстрой прокрутке, TOC jump, конце документа и повторном открытии.
- Ruff, ESLint, TypeScript, Prettier, обычный production build и build с
  `VITE_BASE_PATH=/DataPath/` проходят.
- Все 76 reference SQL-запросов выполняются на встроенной Olist DB; все 71 canonical AlgoPath
  solutions проходят полный набор public/hidden tests тем же Python runner.
- Release snapshot содержит новый кейс, Math-визуализацию и 14 Atlas-связей Linear Regression;
  локальная production-сборка и offline endpoints прошли HTTP smoke-test.

## Нерешённые ограничения

- Первый запуск AlgoPath загружает локальный Pyodide runtime и поэтому заметно тяжелее следующих;
  SQLite dataset практикума добавляет около 27 MB к offline assets.
- macOS bundle unsigned/not notarized; это не относится к content v2 migration.
- Локальный `/Applications/DataPath.app` обновлён той же unsigned-сборкой 1.0.0; после обновления
  запущенное приложение нужно закрыть и открыть снова.
- Focus bundle остаётся крупнейшим lazy chunk (~479 kB / ~143 kB gzip).
- В старших NLP/LLM/MLOps главах сохранены общепринятые англоязычные термины и названия API;
  они вводятся в контексте, но отдельная полная русификация терминологии не выполнялась.
- Release snapshot собран и проверен локально; внешний deployment status фиксируется в GitHub.
