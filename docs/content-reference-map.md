# Карта опорных источников DataPath

Дата редакционного прохода: 2026-08-09.

Этот документ фиксирует не тексты для копирования, а проверенные ориентиры: порядок тем,
ожидаемую глубину и практические паттерны. Уроки DataPath остаются оригинальными и русскоязычными.

## Classic ML и scikit-learn

- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
  задаёт полезную дугу: постановка задачи → линейные и логистические модели → данные и
  обобщение → нейросети → production ML. Для DataPath важны короткие интерактивные проверки
  сразу после объяснения и явная связь loss, gradient descent и настройки модели.
- [Stanford CS229 — материалы курса](https://cs229.stanford.edu/materials.html-full) разделяет
  необходимые математические предпосылки, supervised learning, learning theory и unsupervised
  learning. Это ориентир для мостов между Math, Classic ML и PCA, а не требование повторять
  академический курс целиком.
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html) — источник истины для
  estimator API, preprocessing, Pipeline, model selection, metrics, inspection, persistence и
  common pitfalls. В практических уроках DataPath библиотечный workflow должен совпадать с этим API.

Редакционные пробелы: supporting-уроки по дополнительным моделям должны чаще заканчиваться
решением «когда выбирать модель», а не только описанием механизма; production-модуль Classic ML
нужно читать после базового end-to-end pipeline.

## Deep Learning

- [Dive into Deep Learning](https://arxiv.org/abs/2106.11342) — ориентир для связки контекст →
  математика → исполняемый код → эксперимент. DataPath использует эту связку, но сохраняет
  меньший объём доказательств и более явную подготовку к собеседованиям.
- [PyTorch: Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)
  подтверждает практический порядок tensors → Dataset/DataLoader → model → autograd →
  optimization loop → save/load.
- [PyTorch Tutorials](https://docs.pytorch.org/tutorials/) — опорный каталог для актуальных
  training, transfer learning и NLP-паттернов.

Редакционные пробелы: обучение сети должно быть одной непрерывной историей от forward pass до
диагностики; CNN и attention нельзя преподавать как изолированные схемы без формы тензоров.

## NLP, Transformers и LLM/RAG

- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/en/chapter2/1) показывает
  полезный переход от tokenizer и tensors к модели, post-processing и полноценному pipeline.
  DataPath использует этот порядок для мостов NLP → Transformer → inference/RAG.

Редакционные пробелы: в RAG необходимо различать retrieval quality и answer quality; BM25,
dense retrieval, hybrid retrieval, reranking и генерация должны оставаться отдельными стадиями,
которые можно измерять независимо.

## Python, NumPy и pandas

- [Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) —
  источник истины для исключений и их семантики.
- [NumPy User Guide](https://numpy.org/doc/stable/user/) — опора для ndarray, indexing,
  broadcasting, dtype, axis и vectorization.
- [pandas User Guide](https://pandas.pydata.org/docs/user_guide/) — опора для selection,
  missing data, merge, reshape, time series и performance.
- [pandas GroupBy guide](https://pandas.pydata.org/pandas-docs/stable/user_guide/groupby.html)
  закрепляет модель split–apply–combine, которая используется в уроке и практике DataPath.

Редакционные пробелы: уроки инструментов должны чаще показывать форму данных до и после операции,
а также типичную ошибку индекса/axis/dtype на том же наборе данных.

## SQL

Для SQL опорой служит поведение встроенного SQLite и проверяемые запросы DataPath. Обучающий
порядок: SELECT/WHERE → aggregation/GROUP BY → JOIN → subquery/CTE → CASE/dates → window
functions → интервью-задачи. В каждом следующем блоке повторно используется один небольшой
реалистичный dataset, чтобы внимание оставалось на логике запроса.

## Математика и статистика

Математическая последовательность согласована с prerequisites CS229: vectors/dot product →
matrices → derivative/partial derivative/gradient → probability/expectation/variance →
sampling/uncertainty/testing. Каждая тема заканчивается ML-связью: optimization, PCA,
likelihood, regularization или experiment evaluation.

## MLOps и эксплуатация

- [MLflow Tracking](https://mlflow.org/docs/latest/ml/tracking/) — ориентир для параметров,
  метрик, артефактов и воспроизводимых запусков.
- [FastAPI deployment concepts](https://fastapi.tiangolo.com/deployment/concepts/) и
  [FastAPI in containers](https://fastapi.tiangolo.com/deployment/docker/) — ориентиры для
  процесса serving, рестартов, репликации и контейнерного запуска без лишней enterprise-обвязки.

Редакционные пробелы: MLOps должен начинаться с воспроизводимого локального эксперимента, а не с
инфраструктуры; monitoring связывается с конкретным решением о диагностике или retraining.

## PWA и desktop shell

- [web.dev: Service workers](https://web.dev/learn/pwa/service-workers) — жизненный цикл и роль
  service worker как контролируемого proxy/cache-слоя.
- [web.dev: Offline data](https://web.dev/learn/pwa/assets-and-data) — разделение app shell,
  статических ресурсов и runtime data.
- [web.dev: Installation](https://web.dev/learn/pwa/installation) — manifest, standalone-режим и
  проверяемое install experience.
- [Tauri with Vite](https://v2.tauri.app/start/frontend/vite/) и
  [Tauri frontend configuration](https://v2.tauri.app/start/frontend/) — опора для тонкой
  desktop-обёртки существующего Vite frontend без параллельного UI.
- [Capacitor documentation](https://capacitorjs.com/docs) — опора для native iOS-обёртки общей
  frontend codebase.
