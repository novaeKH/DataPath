# DataPath — текущее состояние

> Обновлено 2026-08-14. Рабочая ветка `main`; release/tag не создаётся.

## Canonical curriculum v2

- Production curriculum содержит ровно 100 canonical lessons с номерами 1–100: Python Core,
  NumPy/pandas/EDA, SQL, Math/Statistics, scikit-learn, Classic ML, Deep Learning, NLP, LLM/RAG и
  MLOps/ML Engineering.
- Маршрут собран в 9 courses и 32 крупных тематических modules. Algorithms остаётся отдельным
  AlgoPath и исключён из каталога, Today, Roadmap, Review и Atlas.
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
- 57 существующих interactive visual demos и 3 backend ML labs сохранены. Дополнительно 38
  уроков получили topic-specific step-by-step visual flows с ручным переходом, autoplay, pause и
  reset. Теперь 98 из 100 lessons имеют interactive visual demo; оставшиеся 2 используют
  встроенные teaching figures, поэтому визуальное объяснение есть у всех 100 уроков.

## Figures and offline update

- 21 teaching PNG интегрирован в ML/DL главы по смыслу: Logistic Regression, kNN, SVM, Decision
  Tree, Random Forest, Boosting, imbalance, calibration, PCA, neuron, MLP, Backprop, optimizers,
  Dropout, CNN, pooling, RNN, LSTM, embeddings, Attention и Transformer.
- Assets лежат в `frontend/public/content-assets/datapath-v2/figures/`; Markdown renderer добавляет
  base-path-safe URL, lazy loading, alt и caption.
- Service worker cache поднят до `datapath-v14-complete-lesson-visuals` и pre-cache-ит все 21 figure вместе с
  release snapshot, не затрагивая localStorage.

## Local state migration

- Local store schema v3 принимает backup/state schema v1 и v2.
- Stable semantic lesson IDs сохранены; изменённые IDs переписываются явной таблицей.
- Для объединённых chapters completion переносится только при завершении всех сильных
  predecessors. Иначе сохраняются familiarity evidence/notes, но новый chapter остаётся начатым.
- Notes объединяются без потерь; Review/Today/roadmap references мигрируются; Algorithms items
  удаляются только из active Review queue, а history и backup data сохраняются.

## Current verification

- Corpus input audit: 100 lessons, 1–100 без gaps/duplicates, 15 README исключены, code fences
  сбалансированы. Отдельно проверяются source prose, semantic prerequisites и отсутствие
  служебной generic objective в готовом уроке.
- Content sync: 531 scanned, 0 errors, 0 warnings после slug separation source/manifest.
- Content validator: 0 errors, 0 warnings.
- Content quality: 100 lessons, 0 errors, 0 warnings, 0 suggestions.
- Полный backend suite проходит: 230 tests. Полный frontend suite проходит: 123 tests.
- Ruff, ESLint, TypeScript, Prettier, обычный production build и build с
  `VITE_BASE_PATH=/DataPath/` проходят.

## Нерешённые ограничения

- Non-SQL practice по-прежнему проверяет структуру, но не исполняет arbitrary Python.
- macOS bundle unsigned/not notarized; это не относится к content v2 migration.
- Локальный `/Applications/DataPath.app` обновлён той же unsigned-сборкой 1.0.0; после обновления
  запущенное приложение нужно закрыть и открыть снова.
- Focus bundle остаётся крупнейшим lazy chunk (~475 kB / ~141 kB gzip).
- В старших NLP/LLM/MLOps главах сохранены общепринятые англоязычные термины и названия API;
  они вводятся в контексте, но отдельная полная русификация терминологии не выполнялась.
- Release snapshot собран и проверен локально; внешний deployment status фиксируется в GitHub.
