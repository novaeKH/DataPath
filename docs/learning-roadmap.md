# Learning Roadmap DataPath

Roadmap — центральный учебный маршрут. Он отвечает на вопрос «куда двигаться дальше». Atlas
отвечает на другой вопрос: «как темы связаны и где у меня пробелы».

## Три прохода

### Проход 1 — Ориентация и первый рабочий baseline

Цель: научиться читать и преобразовывать данные, честно поставить ML-задачу, собрать baseline и
объяснить его результат.

Основные модули: Python basics, NumPy/pandas foundations, SQL foundations, ML framing, linear
models и базовая вероятность. Завершение прохода — небольшой
end-to-end case с выбором target, split, preprocessing и metric.

### Проход 2 — Понимание механики

Цель: понимать, что происходит внутри модели и training loop, сравнивать методы и диагностировать
ошибки.

Основные модули: linear algebra/calculus/statistics, validation и tuning, trees/ensembles,
unsupervised learning, scikit-learn workflow, neural network foundations, CNN, sequence models,
attention и Transformer.

### Проход 3 — Применение и эксплуатация

Цель: собрать воспроизводимое end-to-end решение, выбрать компромиссы, оценить качество и
подготовить модель к локальному serving/monitoring.

Основные модули: advanced/production ML, NLP, LLM/RAG, training/debugging/fine-tuning, MLOps,
capstone mini-cases и полный lifecycle модели от данных до monitoring/retraining.

Алгоритмические задачи не входят в release Roadmap: их владелец — отдельный AlgoPath.

## Правила маршрута

- Один урок существует ровно в одном месте каталога; Roadmap хранит только его учебную роль.
- Порядок внутри модуля берётся из `module_order` и `lesson_order` существующего контента.
- Этап урока вычисляется серверным module registry. Это позволяет позже переносить классификацию
  в metadata без переписывания Today, Review или UI.
- Current step — первый незавершённый урок текущего прохода; начатый урок имеет приоритет.
- Уровень глубины показывается отдельно: `orientation`, `understanding`, `application`.
- Completion не равен mastery: Roadmap показывает завершение пути, а Atlas/mastery — качество
  усвоения и срок повторения.

## Критерий перехода

Переход не блокируется искусственным экзаменом. Следующий проход становится рекомендуемым, когда
пройдено не менее 70% предыдущего; пользователь всё равно может открыть любой доступный урок.
Review остаётся поперечным слоем и может возвращать темы из любого прохода.
