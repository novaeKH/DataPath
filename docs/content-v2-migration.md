# DataPath v2 content migration

Canonical corpus audit: **100 lessons**, canonical numbers **1–100**, no gaps, duplicate numbers,
duplicate titles or unbalanced fenced-code blocks. The 15 block README files are documentation,
not lessons. Runtime content is fully copied into the vault; there are no `_migration` runtime paths.

## Identity map

| № | Legacy lesson ID(s) | Canonical v2 ID | Title | Course | Production source |
|---:|---|---|---|---|---|
| 1 | `lesson.python-ds.01`<br>`lesson.python-ds.02` | `lesson.python-ds.02` | Как Python хранит данные: объекты, переменные, ссылки и изменяемость | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-001 Как Python хранит данные объекты, переменные, ссылки и изменяемость.md` |
| 2 | `lesson.python-ds.03` | `lesson.python-ds.03` | Коллекции Python: list, tuple, dict, set и comprehensions | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-002 Коллекции Python list, tuple, dict, set и comprehensions.md` |
| 3 | `lesson.python-ds.04`<br>`lesson.python-ds.08` | `lesson.python-ds.04` | Функции в Python: аргументы, область видимости, closures и decorators | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-003 Функции в Python аргументы, область видимости, closures и decorators.md` |
| 4 | `lesson.python-ds.05` | `lesson.python-ds.05` | Итераторы и генераторы: как Python обрабатывает данные лениво | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-004 Итераторы и генераторы как Python обрабатывает данные лениво.md` |
| 5 | `lesson.python-ds.06` | `lesson.python-ds.06` | ООП и модель данных Python | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-005 ООП и модель данных Python.md` |
| 6 | `lesson.python-ds.07`<br>`lesson.python-ds.10` | `lesson.python-ds.07` | Надёжный Python: exceptions, context managers, файлы, модули и окружения | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-006 Надёжный Python exceptions, context managers, файлы, модули и окружения.md` |
| 7 | `lesson.python-ds.11`<br>`lesson.python-ds.12` | `lesson.python-ds.11` | Типизация, тестирование и качество Python-кода | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-007 Типизация, тестирование и качество Python-кода.md` |
| 8 | `lesson.python-ds.09` | `lesson.python-ds.09` | Память, garbage collection и GIL — что нужно Data Scientist | Python Core для Data Science | `10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-008 Память, garbage collection и GIL — что нужно Data Scientist.md` |
| 9 | `lesson.data-analysis.01` | `lesson.data-analysis.01` | NumPy изнутри: ndarray, shape, dtype, strides и векторизация | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-009 NumPy изнутри ndarray, shape, dtype, strides и векторизация.md` |
| 10 | `lesson.data-analysis.02` | `lesson.data-analysis.02` | Broadcasting и векторные вычисления в NumPy | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-010 Broadcasting и векторные вычисления в NumPy.md` |
| 11 | `lesson.data-analysis.03` | `lesson.data-analysis.03` | pandas: Series, DataFrame, индексы, выбор данных и типы | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-011 pandas Series, DataFrame, индексы, выбор данных и типы.md` |
| 12 | `lesson.data-analysis.04`<br>`lesson.data-analysis.10` | `lesson.data-analysis.04` | Очистка данных: пропуски, типы, дубликаты и выбросы | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-012 Очистка данных пропуски, типы, дубликаты и выбросы.md` |
| 13 | `lesson.data-analysis.05` | `lesson.data-analysis.05` | GroupBy, merge, join, pivot и reshape | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-013 GroupBy, merge, join, pivot и reshape.md` |
| 14 | `lesson.data-analysis.06`<br>`lesson.data-analysis.11` | `lesson.data-analysis.06` | Временные данные, rolling и оконные вычисления | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-014 Временные данные, rolling и оконные вычисления.md` |
| 15 | `lesson.data-analysis.07`<br>`lesson.data-analysis.08`<br>`lesson.data-analysis.09`<br>`lesson.data-analysis.12` | `lesson.data-analysis.09` | EDA как процесс исследования данных | NumPy, pandas и EDA | `10 Знания/DataPath v2/02_NumPy_pandas_EDA_DataPath_v2/source-015 EDA как процесс исследования данных.md` |
| 16 | `lesson.data-tools.sql-foundations` | `lesson.sql.select-where` | Реляционная модель и основа SQL: SELECT, WHERE, ORDER BY | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-016 Реляционная модель и основа SQL SELECT, WHERE, ORDER BY.md` |
| 17 | — | `lesson.sql.group-by` | Агрегации: GROUP BY, HAVING и логика вычисления запроса | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-017 Агрегации GROUP BY, HAVING и логика вычисления запроса.md` |
| 18 | — | `lesson.sql.joins` | JOIN от интуиции до ошибок с дубликатами и NULL | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-018 JOIN от интуиции до ошибок с дубликатами и NULL.md` |
| 19 | — | `lesson.sql.cte-subqueries` | Подзапросы и CTE: как строить сложный запрос по частям | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-019 Подзапросы и CTE как строить сложный запрос по частям.md` |
| 20 | — | `lesson.sql.window-functions` | Оконные функции: OVER, PARTITION BY, ORDER BY, ROW_NUMBER, LAG и running aggregates | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-020 Оконные функции OVER, PARTITION BY, ORDER BY, ROW_NUMBER, LAG и running aggregates.md` |
| 21 | — | `lesson.sql.null-case-dates` | NULL, CASE, даты и строки в аналитическом SQL | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-021 NULL, CASE, даты и строки в аналитическом SQL.md` |
| 22 | `lesson.data-tools.sql-analytics` | `lesson.sql.patterns` | Практические SQL-паттерны Data Scientist | SQL и scikit-learn | `10 Знания/DataPath v2/03_SQL_DataPath_v2/source-022 Практические SQL-паттерны Data Scientist.md` |
| 23 | `lesson.math-ds.linear-algebra` | `lesson.math-ds.linear-algebra` | Векторы и матрицы: язык данных и моделей | Математика и статистика для Data Science | `10 Знания/DataPath v2/04_Math_Linear_Algebra_Calculus_DataPath_v2/source-023 Векторы и матрицы язык данных и моделей.md` |
| 24 | `lesson.math-ds.svd` | `lesson.math.linear-transformations` | Матричные операции, линейные преобразования, ранг и системы уравнений | Математика и статистика для Data Science | `10 Знания/DataPath v2/04_Math_Linear_Algebra_Calculus_DataPath_v2/source-024 Матричные операции, линейные преобразования, ранг и системы уравнений.md` |
| 25 | `lesson.math-ds.eigen-pca` | `lesson.math-ds.eigen-pca` | Собственные значения и собственные векторы: зачем они в ML | Математика и статистика для Data Science | `10 Знания/DataPath v2/04_Math_Linear_Algebra_Calculus_DataPath_v2/source-025 Собственные значения и собственные векторы зачем они в ML.md` |
| 26 | `lesson.math-ds.gradients` | `lesson.math-ds.gradients` | Производная, частные производные, градиент и правило цепочки | Математика и статистика для Data Science | `10 Знания/DataPath v2/04_Math_Linear_Algebra_Calculus_DataPath_v2/source-026 Производная, частные производные, градиент и правило цепочки.md` |
| 27 | `lesson.math-ds.bayes` | `lesson.math-ds.bayes` | Вероятность: события, условная вероятность и Байес | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-027 Вероятность события, условная вероятность и Байес.md` |
| 28 | `lesson.math-ds.random-variables` | `lesson.math-ds.random-variables` | Случайные величины и основные распределения | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-028 Случайные величины и основные распределения.md` |
| 29 | `lesson.math-ds.expectation` | `lesson.math-ds.expectation` | Матожидание, дисперсия, ковариация и корреляция | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-029 Матожидание, дисперсия, ковариация и корреляция.md` |
| 30 | `lesson.math-ds.lln-clt` | `lesson.math-ds.lln-clt` | Выборка, закон больших чисел и центральная предельная теорема | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-030 Выборка, закон больших чисел и центральная предельная теорема.md` |
| 31 | — | `lesson.math.estimation-ci` | Оценивание параметров, доверительные интервалы и неопределённость | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-031 Оценивание параметров, доверительные интервалы и неопределённость.md` |
| 32 | `lesson.math-ds.ab-testing`<br>`lesson.math-ds.hypothesis` | `lesson.math-ds.hypothesis` | Проверка гипотез и A/B: p-value, ошибки I/II рода, power и multiple testing | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-032 Проверка гипотез и A B p-value, ошибки I II рода, power и multiple testing.md` |
| 33 | `lesson.math-ds.likelihood` | `lesson.math-ds.likelihood` | MLE, MAP и оптимизация: мост от вероятности к обучению модели | Математика и статистика для Data Science | `10 Знания/DataPath v2/05_Probability_Statistics_DataPath_v2/source-033 MLE, MAP и оптимизация мост от вероятности к обучению модели.md` |
| 34 | `lesson.data-tools.estimator-pipeline` | `lesson.data-tools.estimator-pipeline` | Архитектура scikit-learn: estimator, fit, predict и transform | SQL и scikit-learn | `10 Знания/DataPath v2/06_scikit_learn_DataPath_v2/source-034 Архитектура scikit-learn estimator, fit, predict и transform.md` |
| 35 | `lesson.data-tools.preprocessing` | `lesson.data-tools.preprocessing` | Pipeline и ColumnTransformer: preprocessing без leakage | SQL и scikit-learn | `10 Знания/DataPath v2/06_scikit_learn_DataPath_v2/source-035 Pipeline и ColumnTransformer preprocessing без leakage.md` |
| 36 | `lesson.data-tools.cv-tuning` | `lesson.data-tools.cv-tuning` | Cross-validation, подбор гиперпараметров и сохранение Pipeline | SQL и scikit-learn | `10 Знания/DataPath v2/06_scikit_learn_DataPath_v2/source-036 Cross-validation, подбор гиперпараметров и сохранение Pipeline.md` |
| 37 | `lesson.classic-ml.framing.problem` | `lesson.classic-ml.framing.problem` | Как правильно поставить ML-задачу | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-037 Как правильно поставить ML-задачу.md` |
| 38 | `lesson.classic-ml.framing.validation` | `lesson.classic-ml.framing.validation` | Разбиение данных и кросс-валидация | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-038 Разбиение данных и кросс-валидация.md` |
| 39 | `lesson.classic-ml.framing.metrics` | `lesson.classic-ml.framing.metrics` | Метрики машинного обучения и выбор порога | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-039 Метрики машинного обучения и выбор порога.md` |
| 40 | `lesson.classic-ml.linear.regression` | `lesson.classic-ml.linear.regression` | Линейная регрессия — от прямой на графике до метода наименьших квадратов | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-040 Линейная регрессия — от прямой на графике до метода наименьших квадратов.md` |
| 41 | `lesson.classic-ml.linear.regularization` | `lesson.classic-ml.linear.regularization` | Смещение, разброс и регуляризация | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-041 Смещение, разброс и регуляризация.md` |
| 42 | `lesson.classic-ml.linear.logistic` | `lesson.classic-ml.linear.logistic` | Логистическая регрессия | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-042 Логистическая регрессия.md` |
| 43 | `lesson.classic-ml.expansion.14` | `lesson.classic-ml.expansion.14` | Метод k ближайших соседей | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-043 Метод k ближайших соседей.md` |
| 44 | `lesson.classic-ml.expansion.15` | `lesson.classic-ml.expansion.15` | Наивный Байес | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-044 Наивный Байес.md` |
| 45 | `lesson.classic-ml.expansion.16` | `lesson.classic-ml.expansion.16` | Метод опорных векторов (SVM) | Классическое машинное обучение | `10 Знания/DataPath v2/07_ML_Foundations_Linear_Models/source-045 Метод опорных векторов (SVM).md` |
| 46 | `lesson.classic-ml.trees.tree` | `lesson.classic-ml.trees.tree` | Решающее дерево — как модель превращает данные в систему правил | Классическое машинное обучение | `10 Знания/DataPath v2/08_Trees_and_Boosting_DataPath_v2/source-046 Решающее дерево — как модель превращает данные в систему правил.md` |
| 47 | `lesson.classic-ml.trees.forest` | `lesson.classic-ml.trees.forest` | Бэггинг, случайный лес и Extra Trees — как усреднение стабилизирует деревья | Классическое машинное обучение | `10 Знания/DataPath v2/08_Trees_and_Boosting_DataPath_v2/source-047 Бэггинг, случайный лес и Extra Trees — как усреднение стабилизирует деревья.md` |
| 48 | `lesson.classic-ml.trees.boosting` | `lesson.classic-ml.trees.boosting` | Градиентный бустинг — как ансамбль последовательно исправляет собственный прогноз | Классическое машинное обучение | `10 Знания/DataPath v2/08_Trees_and_Boosting_DataPath_v2/source-048 Градиентный бустинг — как ансамбль последовательно исправляет собственный прогноз.md` |
| 49 | `lesson.classic-ml.trees.libraries` | `lesson.classic-ml.trees.libraries` | XGBoost, LightGBM и CatBoost — что действительно различается под капотом | Классическое машинное обучение | `10 Знания/DataPath v2/08_Trees_and_Boosting_DataPath_v2/source-049 XGBoost, LightGBM и CatBoost — что действительно различается под капотом.md` |
| 50 | `lesson.classic-ml.expansion.17` | `lesson.classic-ml.expansion.17` | Предобработка и конструирование признаков — как превратить сырые данные в корректный вход модели | Классическое машинное обучение | `10 Знания/DataPath v2/09_ML_Preprocessing_and_Imbalance_DataPath_v2/source-050 Предобработка и конструирование признаков — как превратить сырые данные в корректный вход мо.md` |
| 51 | `lesson.classic-ml.expansion.18` | `lesson.classic-ml.expansion.18` | Категориальные признаки и One-hot encoding | Классическое машинное обучение | `10 Знания/DataPath v2/09_ML_Preprocessing_and_Imbalance_DataPath_v2/source-051 Категориальные признаки и One-hot encoding.md` |
| 52 | `lesson.classic-ml.expansion.19` | `lesson.classic-ml.expansion.19` | Дисбаланс классов — как обучать и оценивать модель, когда положительный класс редкий | Классическое машинное обучение | `10 Знания/DataPath v2/09_ML_Preprocessing_and_Imbalance_DataPath_v2/source-052 Дисбаланс классов — как обучать и оценивать модель, когда положительный класс редкий.md` |
| 53 | `lesson.classic-ml.expansion.20` | `lesson.classic-ml.expansion.20` | Калибровка вероятностей — когда 0.8 действительно означает примерно 80% | Классическое машинное обучение | `10 Знания/DataPath v2/09_ML_Preprocessing_and_Imbalance_DataPath_v2/source-053 Калибровка вероятностей — когда 0.8 действительно означает примерно 80%.md` |
| 54 | `lesson.classic-ml.unsupervised.kmeans` | `lesson.classic-ml.unsupervised.kmeans` | K-Means — как алгоритм превращает облако точек в кластеры | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-054 K-Means — как алгоритм превращает облако точек в кластеры.md` |
| 55 | `lesson.classic-ml.expansion.23` | `lesson.classic-ml.expansion.23` | DBSCAN и иерархическая кластеризация — плотность, шум и дерево объединений | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-055 DBSCAN и иерархическая кластеризация — плотность, шум и дерево объединений.md` |
| 56 | `lesson.classic-ml.unsupervised.pca` | `lesson.classic-ml.unsupervised.pca` | PCA — от геометрии и дисперсии к главным компонентам | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-056 PCA — от геометрии и дисперсии к главным компонентам.md` |
| 57 | `lesson.classic-ml.expansion.24` | `lesson.classic-ml.expansion.24` | Поиск аномалий — Isolation Forest, Local Outlier Factor и novelty detection | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-057 Поиск аномалий — Isolation Forest, Local Outlier Factor и novelty detection.md` |
| 58 | `lesson.classic-ml.expansion.22` | `lesson.classic-ml.expansion.22` | Интерпретация модели и важность признаков — как понять, на что опирается prediction | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-058 Интерпретация модели и важность признаков — как понять, на что опирается prediction.md` |
| 59 | `lesson.classic-ml.expansion.21` | `lesson.classic-ml.expansion.21` | Выбор модели и настройка гиперпараметров — как искать улучшения без переобучения на validation | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-059 Выбор модели и настройка гиперпараметров — как искать улучшения без переобучения на validati.md` |
| 60 | `lesson.classic-ml.end-to-end.pipeline` | `lesson.classic-ml.end-to-end.pipeline` | Полный end-to-end ML pipeline — от неизвестного датасета до финальной модели | Классическое машинное обучение | `10 Знания/DataPath v2/10_Unsupervised_Interpretation_EndToEnd_DataPath_v2/source-060 Полный end-to-end ML pipeline — от неизвестного датасета до финальной модели.md` |
| 61 | `lesson.deep-learning.01` | `lesson.deep-learning.01` | От линейной модели к нейрону — тензоры, формы и Linear layer | Deep Learning | `10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-061 От линейной модели к нейрону — тензоры, формы и Linear layer.md` |
| 62 | `lesson.deep-learning.02` | `lesson.deep-learning.02` | MLP, функции активации и функции потерь | Deep Learning | `10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-062 MLP, функции активации и функции потерь.md` |
| 63 | `lesson.deep-learning.03` | `lesson.deep-learning.03` | Обратное распространение ошибки — как сеть вычисляет градиенты | Deep Learning | `10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-063 Обратное распространение ошибки — как сеть вычисляет градиенты.md` |
| 64 | `lesson.deep-learning.04` | `lesson.deep-learning.04` | SGD, Momentum, Adam и AdamW — как optimizer превращает градиенты в обучение | Deep Learning | `10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-064 SGD, Momentum, Adam и AdamW — как optimizer превращает градиенты в обучение.md` |
| 65 | — | `lesson.deep-learning.regularization` | Регуляризация и стабилизация нейросетей — как заставить сеть обучаться и не запоминать train | Deep Learning | `10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-065 Регуляризация и стабилизация нейросетей — как заставить сеть обучаться и не запоминать train.md` |
| 66 | `lesson.deep-learning.05` | `lesson.deep-learning.05` | Свёрточные нейронные сети — локальные фильтры и карты признаков | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-066 Свёрточные нейронные сети — локальные фильтры и карты признаков.md` |
| 67 | — | `lesson.deep-learning.pooling-receptive-field` | Pooling, receptive field и устройство современных CNN | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-067 Pooling, receptive field и устройство современных CNN.md` |
| 68 | `lesson.deep-learning.06` | `lesson.deep-learning.06` | Рекуррентные нейронные сети — как моделировать последовательности | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-068 Рекуррентные нейронные сети — как моделировать последовательности.md` |
| 69 | — | `lesson.deep-learning.lstm-gru` | LSTM и GRU — как сеть учится сохранять и забывать информацию | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-069 LSTM и GRU — как сеть учится сохранять и забывать информацию.md` |
| 70 | `lesson.deep-learning.07` | `lesson.deep-learning.07` | Embeddings — как токены и категории превращаются в обучаемые векторы | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-070 Embeddings — как токены и категории превращаются в обучаемые векторы.md` |
| 71 | — | `lesson.deep-learning.attention` | Attention — как модель учится выбирать важные элементы контекста | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-071 Attention — как модель учится выбирать важные элементы контекста.md` |
| 72 | `lesson.deep-learning.08` | `lesson.deep-learning.08` | Transformer — от self-attention до полного блока | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-072 Transformer — от self-attention до полного блока.md` |
| 73 | `lesson.deep-learning.09` | `lesson.deep-learning.09` | Полный PyTorch workflow — Dataset, DataLoader, train, validation и inference | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-073 Полный PyTorch workflow — Dataset, DataLoader, train, validation и inference.md` |
| 74 | `lesson.deep-learning.10`<br>`lesson.deep-learning.11` | `lesson.deep-learning.10` | Transfer learning и fine-tuning — как дообучать готовые модели и отлаживать эксперименты | Deep Learning | `10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-074 Transfer learning и fine-tuning — как дообучать готовые модели и отлаживать эксперименты.md` |
| 75 | — | `lesson.nlp.preprocessing` | Текстовые данные и корректная предобработка | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-075 Текстовые данные и корректная предобработка.md` |
| 76 | `lesson.nlp.classical` | `lesson.nlp.classical` | Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-076 Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста.md` |
| 77 | — | `lesson.nlp.classical-models` | Классические модели для текста — Logistic Regression, Linear SVM и Naive Bayes | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-077 Классические модели для текста — Logistic Regression, Linear SVM и Naive Bayes.md` |
| 78 | — | `lesson.nlp.subword-tokenization` | Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-078 Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask.md` |
| 79 | `lesson.nlp.rnn` | `lesson.nlp.rnn` | Нейронная классификация текста — embeddings, pooling, CNN, RNN и LSTM | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-079 Нейронная классификация текста — embeddings, pooling, CNN, RNN и LSTM.md` |
| 80 | `lesson.nlp.attention`<br>`lesson.nlp.bert-evaluation` | `lesson.nlp.bert-evaluation` | BERT и encoder Transformers — как работает контекстное представление текста | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-080 BERT и encoder Transformers — как работает контекстное представление текста.md` |
| 81 | — | `lesson.nlp.evaluation` | Оценка NLP-моделей и error analysis | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-081 Оценка NLP-моделей и error analysis.md` |
| 82 | — | `lesson.nlp.end-to-end` | Полный end-to-end NLP workflow — от TF-IDF baseline до Transformer | NLP | `10 Знания/DataPath v2/13_NLP_DataPath_v2/source-082 Полный end-to-end NLP workflow — от TF-IDF baseline до Transformer.md` |
| 83 | — | `lesson.llm-rag.autoregressive` | Языковая модель и авторегрессионная генерация | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-083 Языковая модель и авторегрессионная генерация.md` |
| 84 | — | `lesson.llm-rag.decoding` | Декодирование — greedy, beam search, temperature, top-k и top-p | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-084 Декодирование — greedy, beam search, temperature, top-k и top-p.md` |
| 85 | `lesson.llm-rag.inference` | `lesson.llm-rag.inference` | Контекст и промпт — как управлять LLM без изменения весов | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-085 Контекст и промпт — как управлять LLM без изменения весов.md` |
| 86 | — | `lesson.llm-rag.embeddings-search` | Векторные представления текста и семантический поиск | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-086 Векторные представления текста и семантический поиск.md` |
| 87 | `lesson.llm-rag.retrieval` | `lesson.llm-rag.retrieval` | Chunking, BM25, dense retrieval и гибридный поиск | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-087 Chunking, BM25, dense retrieval и гибридный поиск.md` |
| 88 | — | `lesson.llm-rag.reranking` | Reranking и многоступенчатый retrieval pipeline | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-088 Reranking и многоступенчатый retrieval pipeline.md` |
| 89 | `lesson.llm-rag.rag` | `lesson.llm-rag.rag` | RAG — как соединить LLM с внешними знаниями | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-089 RAG — как соединить LLM с внешними знаниями.md` |
| 90 | — | `lesson.llm-rag.evaluation` | Оценка и отладка RAG-систем | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-090 Оценка и отладка RAG-систем.md` |
| 91 | `lesson.llm-rag.agents` | `lesson.llm-rag.agents` | AI-агенты — инструменты, память, планирование и контроль | LLM и RAG | `10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-091 AI-агенты — инструменты, память, планирование и контроль.md` |
| 92 | — | `lesson.mlops.artifacts` | Model artifact, сериализация и контракт инференса | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-092 Model artifact, сериализация и контракт инференса.md` |
| 93 | `lesson.mlops.serving` | `lesson.mlops.serving` | FastAPI для ML inference — от Pydantic-схемы до predict endpoint | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-093 FastAPI для ML inference — от Pydantic-схемы до predict endpoint.md` |
| 94 | — | `lesson.mlops.docker` | Docker для ML-сервиса — воспроизводимая среда запуска | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-094 Docker для ML-сервиса — воспроизводимая среда запуска.md` |
| 95 | `lesson.mlops.monitoring` | `lesson.mlops.monitoring` | Логирование, метрики сервиса и observability | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-095 Логирование, метрики сервиса и observability.md` |
| 96 | — | `lesson.mlops.data-drift` | Мониторинг данных и predictions — data drift | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-096 Мониторинг данных и predictions — data drift.md` |
| 97 | — | `lesson.mlops.concept-drift` | Concept drift, задержка меток и мониторинг качества | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-097 Concept drift, задержка меток и мониторинг качества.md` |
| 98 | `lesson.mlops.reproducibility` | `lesson.mlops.reproducibility` | Versioning, experiment tracking, model registry и reproducibility | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-098 Versioning, experiment tracking, model registry и reproducibility.md` |
| 99 | — | `lesson.mlops.retraining` | Retraining pipeline, champion/challenger и безопасное обновление модели | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-099 Retraining pipeline, champion challenger и безопасное обновление модели.md` |
| 100 | — | `lesson.mlops.lifecycle` | Полный production ML lifecycle — от данных до retraining и rollback | MLOps и ML Engineering | `10 Знания/DataPath v2/15_MLOps_and_ML_Engineering_DataPath_v2/source-100 Полный production ML lifecycle — от данных до retraining и rollback.md` |

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

- `lesson.algorithms.arrays-strings`
- `lesson.algorithms.big-o`
- `lesson.algorithms.binary-search`
- `lesson.algorithms.dp`
- `lesson.algorithms.graphs`
- `lesson.algorithms.greedy`
- `lesson.algorithms.hash`
- `lesson.algorithms.heap`
- `lesson.algorithms.intervals`
- `lesson.algorithms.linked-list`
- `lesson.algorithms.matrix`
- `lesson.algorithms.prefix-sum`
- `lesson.algorithms.recursion`
- `lesson.algorithms.sliding-window`
- `lesson.algorithms.stack-queue`
- `lesson.algorithms.trees`
- `lesson.algorithms.two-pointers`

## Figures

All **21** teaching figures are copied to
`frontend/public/content-assets/datapath-v2/figures/` and embedded at the mechanism-specific point in
their canonical ML/DL chapters. URLs are relative and resolved through the frontend base-path helper.
