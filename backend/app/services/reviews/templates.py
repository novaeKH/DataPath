"""Review templates MVP-маршрута (Фаза 5).

Маршрут: Decision Tree → Bias/Variance → Random Forest → Gradient Boosting →
CatBoost → сравнение моделей. Все ID (skills, content, lessons, labs, cases)
существуют в vault/реестрах проекта. Вопросы короткие, explanation — с
разбором; крупные фрагменты уроков не копируются.

Активация (source_type/source_id):
- lesson: элемент появляется после завершения урока;
- lab:    после успешного сохранения лаборатории (score >= 0.6);
- case:   после прохождения кейса.
"""

from __future__ import annotations

from app.services.reviews.registry import ReviewTemplate, ReviewTemplateRegistry

# --- Decision Tree ---

_DT_SPLIT = ReviewTemplate(
    id="rev.dt.split-gain",
    title="Выбор лучшего разбиения",
    prompt=(
        "Узел содержит 100 объектов, impurity = 0.5. Разбиение A делит узел 50/50 "
        "и даёт среднюю impurity детей 0.2. Разбиение B делит 90/10 и даёт среднюю "
        "impurity детей 0.45. Какое разбиение даёт больший gain?"
    ),
    question_type="single_choice",
    options=[
        "Разбиение A: gain ≈ 0.30",
        "Разбиение B: gain ≈ 0.05",
        "Оба разбиения дают одинаковый gain",
        "Gain нельзя вычислить без метрики split (Gini/Entropy)",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "Gain = impurity(parent) − взвешенная impurity детей. A: 0.5 − (0.5·0.2 + 0.5·0.2) = 0.30. "
        "B: 0.5 − (0.9·0.45 + 0.1·0.45) = 0.05. Чистые и сбалансированные дети дают "
        "больший прирост информации."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.decision-trees",
    source_lesson_id="lesson.classic-ml.trees.tree",
    source_type="lab",
    source_id="decision-tree-split-lab",
    difficulty="standard",
    evidence_weight=1.0,
)

_DT_OVERFIT = ReviewTemplate(
    id="rev.dt.overfit-sign",
    title="Признак переобучения дерева",
    prompt=(
        "Decision Tree глубины 25: train ROC-AUC 0.99, val ROC-AUC 0.78. Какое объяснение ошибочно?"
    ),
    question_type="error_diagnosis",
    options=[
        "Дерево переобучилось: слишком глубокое, запомнило train",
        "Разрыв train/val 0.21 — признак высокой variance",
        "Нужно ограничить сложность (max_depth, min_samples_leaf)",
        "Это нормально: дерево глубины 25 всегда показывает такой разрыв, "
        "и модель готова к продакшену",
    ],
    answer_spec={"correct": 3},
    explanation=(
        "Глубокое дерево запоминает обучающую выборку (train 0.99) и плохо обобщает "
        "(val 0.78) — это переобучение (высокая variance). Разрыв train/val — "
        "классический признак. Утверждение «модель готова» ошибочно: нужно "
        "ограничить сложность и проверить на val."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.decision-trees",
    source_lesson_id="lesson.classic-ml.trees.tree",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.tree",
    difficulty="standard",
)

# --- Bias / Variance / Regularization ---

_BV_TRADEOFF = ReviewTemplate(
    id="rev.bv.bias-variance",
    title="Bias или variance?",
    prompt=(
        "Модель показывает train accuracy 0.60 и val accuracy 0.58 на задаче "
        "с несбалансированными классами. Что это скорее всего?"
    ),
    question_type="single_choice",
    options=[
        "Высокий bias (недообучение): модель слишком простая",
        "Высокая variance (переобучение): модель слишком сложная",
        "Data leakage в признаках",
        "Метрика выбрана неверно",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "Низкая ошибка на train и val одновременно при простой модели — "
        "высокий bias: модель не улавливает закономерность. Для переобучения "
        "характерен разрыв train/val, а здесь оба значения низкие."
    ),
    primary_skill="ml.bias_variance_regularization",
    source_content_id="concept.ml.regularization",
    source_lesson_id="lesson.classic-ml.linear.regularization",
    source_type="lesson",
    source_id="lesson.classic-ml.linear.regularization",
    difficulty="standard",
)

_BV_REGULARIZATION = ReviewTemplate(
    id="rev.bv.regularization-effect",
    title="Что снизит variance дерева?",
    prompt=(
        "Decision Tree переобучается. Какое изменение гиперпараметров напрямую снизит variance?"
    ),
    question_type="parameter_selection",
    options=[
        "Увеличить max_depth",
        "Уменьшить min_samples_leaf",
        "Увеличить min_samples_leaf (или ограничить max_depth)",
        "Убрать валидационную выборку",
    ],
    answer_spec={"correct": 2},
    explanation=(
        "Ограничение сложности (больше min_samples_leaf, меньше max_depth) "
        "снижает variance ценой небольшого роста bias. Увеличение max_depth "
        "и удаление валидации, наоборот, усугубляют переобучение."
    ),
    primary_skill="ml.bias_variance_regularization",
    source_content_id="concept.ml.regularization",
    source_lesson_id="lesson.classic-ml.linear.regularization",
    source_type="lesson",
    source_id="lesson.classic-ml.linear.regularization",
    difficulty="standard",
)

_BV_DEPTH_CURVE = ReviewTemplate(
    id="rev.bv.depth-curve",
    title="Кривая train/val по глубине",
    prompt=(
        "На кривой «ошибка vs max_depth» val-ошибка растёт после глубины 8, "
        "а train-ошибка продолжает падать. Что выбрать?"
    ),
    question_type="single_choice",
    options=[
        "max_depth = 8 (минимум val-ошибки)",
        "max_depth = 20 (лучший train-результат)",
        "Любую глубину — val-кривая не важна",
        "Увеличить число деревьев вместо ограничения глубины",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "Точка минимума ошибки на валидации — стандартный выбор: дальше "
        "модель снижает train-ошибку за счёт запоминания, а обобщение "
        "ухудшается (variance растёт)."
    ),
    primary_skill="ml.bias_variance_regularization",
    source_content_id="concept.ml.regularization",
    source_lesson_id="lesson.classic-ml.linear.regularization",
    source_type="lesson",
    source_id="lesson.classic-ml.linear.regularization",
    difficulty="standard",
)

# --- Random Forest ---

_RF_STEPS = ReviewTemplate(
    id="rev.rf.steps",
    title="Шаги построения Random Forest",
    prompt=(
        "Упорядочьте шаги построения Random Forest для одного дерева (от первого к последнему):"
    ),
    question_type="ordering",
    options=[
        "Взять bootstrap-выборку из обучающих данных",
        "Обучить дерево на выборке, выбирая случайное подмножество признаков на каждом узле",
        "Повторить для N деревьев",
        "Усреднить предсказания всех деревьев (для классификации — голосование)",
    ],
    answer_spec={"correct": [0, 1, 2, 3]},
    explanation=(
        "Каждое дерево обучается на своей bootstrap-выборке со случайным "
        "подмножеством признаков (декорреляция деревьев), затем предсказания "
        "усредняются — это снижает variance по сравнению с одним деревом."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.bagging-and-random-forest",
    source_lesson_id="lesson.classic-ml.trees.forest",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.forest",
    difficulty="standard",
)

_RF_BAGGING_BOOSTING = ReviewTemplate(
    id="rev.rf.bagging-vs-boosting",
    title="Bagging vs boosting",
    prompt=("Главное различие bagging (Random Forest) и boosting (Gradient Boosting):"),
    question_type="single_choice",
    options=[
        "Bagging обучает деревья независимо и усредняет; boosting обучает "
        "последовательно, исправляя ошибки предыдущих моделей",
        "Bagging всегда использует все признаки; boosting — всегда одно дерево",
        "Boosting не чувствителен к learning rate, а bagging чувствителен",
        "Различия нет: это два названия одного метода",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "Bagging снижает variance за счёт усреднения независимых моделей; "
        "boosting последовательно уменьшает bias, подгоняя новые деревья "
        "под остатки (ошибки) ансамбля. Отсюда разные свойства: RF устойчив "
        "и параллелизуем, GB точнее на «чистых» данных, но чувствителен "
        "к learning rate и переобучению при большом числе итераций."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.bagging-and-random-forest",
    source_lesson_id="lesson.classic-ml.trees.forest",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.forest",
    difficulty="standard",
)

_RF_EXPLAIN = ReviewTemplate(
    id="rev.rf.explain-bagging",
    title="Почему усреднение снижает variance",
    prompt=(
        "Объясните своими словами, почему усреднение предсказаний многих "
        "деревьев снижает variance (в отличие от одного глубокого дерева). "
        "Затем оцените себя."
    ),
    question_type="reveal_and_rate",
    explanation=(
        "Ключевая идея: независимые ошибки деревьев частично компенсируют "
        "друг друга при усреднении (variance среднего падает с числом "
        "слагаемых). Bootstrap-выборки и случайные подмножества признаков "
        "уменьшают корреляцию ошибок деревьев, поэтому усреднение работает "
        "сильнее, чем у сильно коррелированных моделей."
    ),
    primary_skill="ml.bias_variance_regularization",
    source_content_id="concept.ml.bagging-and-random-forest",
    source_lesson_id="lesson.classic-ml.trees.forest",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.forest",
    difficulty="standard",
    evidence_weight=0.6,
)

# --- Gradient Boosting ---

_GB_LEARNING_RATE = ReviewTemplate(
    id="rev.gb.learning-rate",
    title="Влияние learning rate",
    prompt=(
        "В Gradient Boosting вы уменьшили learning rate с 0.3 до 0.03, "
        "оставив число итераций прежним. Что произойдёт?"
    ),
    question_type="parameter_selection",
    options=[
        "Каждое дерево вносит меньший вклад; модель, скорее всего, "
        "станет недообученной и потребует больше итераций",
        "Модель станет переобученной из-за меньшего шага",
        "Ничего не изменится: learning rate не влияет на GB",
        "Уменьшится время обучения",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "Меньший learning rate ослабляет вклад каждого дерева: ансамбль "
        "обучается медленнее и для той же точности обычно нужны дополнительные "
        "итерации (либо early stopping по валидации). Это снижает риск "
        "переобучения, но требует большего числа шагов."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.gradient-boosting",
    source_lesson_id="lesson.classic-ml.trees.boosting",
    source_type="lab",
    source_id="ensemble-comparison-lab",
    difficulty="standard",
)

_GB_RESIDUALS = ReviewTemplate(
    id="rev.gb.residuals",
    title="Что обучает следующее дерево",
    prompt="На каждой итерации Gradient Boosting новое дерево обучается на:",
    question_type="single_choice",
    options=[
        "Остатках (отрицательном градиенте) текущего ансамбля",
        "Bootstrap-выборке исходных данных без изменений",
        "Случайных признаках без связи с ошибками",
        "Оценках важности признаков",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "GB минимизирует функцию потерь по шагам: каждое следующее дерево "
        "аппроксимирует отрицательный градиент (для MSE — остатки) текущего "
        "ансамбля. Так ансамбль последовательно исправляет свои ошибки."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.gradient-boosting",
    source_lesson_id="lesson.classic-ml.trees.boosting",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.boosting",
    difficulty="standard",
)

_GB_TOO_MANY_ITERS = ReviewTemplate(
    id="rev.gb.too-many-iters",
    title="Диагностика переобучения GB",
    prompt=(
        "Gradient Boosting с 5000 итераций: train accuracy 0.995, "
        "val accuracy 0.82. Какое объяснение ошибочно?"
    ),
    question_type="error_diagnosis",
    options=[
        "Ансамбль переобучился — нужен early stopping или меньше итераций",
        "Слишком много итераций при фиксированном learning rate",
        "Ансамбли деревьев не переобучаются — val-ошибку можно игнорировать",
        "Стоит уменьшить learning rate и добавить регуляризацию",
    ],
    answer_spec={"correct": 2},
    explanation=(
        "Gradient Boosting переобучается при большом числе итераций: "
        "ансамбль начинает подгоняться под train. Утверждение «ансамбли "
        "не переобучаются» ошибочно — контроль по валидации обязателен."
    ),
    primary_skill="ml.error_analysis",
    source_content_id="concept.ml.gradient-boosting",
    source_lesson_id="lesson.classic-ml.trees.boosting",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.boosting",
    difficulty="standard",
)

# --- CatBoost ---

_CB_CATEGORICAL = ReviewTemplate(
    id="rev.cb.categorical-native",
    title="Категориальные признаки в CatBoost",
    prompt=(
        "Чем CatBoost обрабатывает категориальные признаки по умолчанию, "
        "в отличие от обычного one-hot?"
    ),
    question_type="single_choice",
    options=[
        "Ordered target statistics: кодирует категории с защитой от "
        "target leakage и порядком по времени",
        "Всегда удаляет категориальные признаки",
        "Использует только label encoding без контроля переобучения",
        "Требует ручного one-hot до обучения",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "CatBoost строит ordered target statistics на подвыборках (permutation), "
        "что снижает target leakage при кодировании категорий. Поэтому он "
        "хорошо работает с категориальными признаками «из коробки», включая "
        "высококардинальные."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.xgboost-lightgbm-and-catboost",
    source_lesson_id="lesson.classic-ml.trees.libraries",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.libraries",
    difficulty="standard",
)

_CB_ERROR = ReviewTemplate(
    id="rev.cb.error-diagnosis",
    title="Ошибочное утверждение о CatBoost",
    prompt="Какое утверждение о CatBoost ошибочно?",
    question_type="error_diagnosis",
    options=[
        "CatBoost хорошо работает с категориальными признаками из коробки",
        "CatBoost использует ordered boosting для борьбы с target leakage",
        "CatBoost всегда медленнее XGBoost на GPU при любых данных",
        "CatBoost устойчив к переобучению при малом learning rate",
    ],
    answer_spec={"correct": 2},
    explanation=(
        "CatBoost умеет эффективно использовать GPU и часто обгоняет XGBoost "
        "по скорости на больших данных; «всегда медленнее» — ошибочное "
        "утверждение. Остальные пункты верны."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.xgboost-lightgbm-and-catboost",
    source_lesson_id="lesson.classic-ml.trees.libraries",
    source_type="lesson",
    source_id="lesson.classic-ml.trees.libraries",
    difficulty="standard",
)

# --- Сравнение моделей ---

_CMP_MODEL_CHOICE = ReviewTemplate(
    id="rev.cmp.model-choice-biz",
    title="Выбор модели под ограничения",
    prompt=(
        "Качество Random Forest и CatBoost почти одинаково (val ROC-AUC "
        "0.86 vs 0.87), у команды нет GPU и нужно объяснять решения бизнесу. "
        "Что выбрать?"
    ),
    question_type="single_choice",
    options=[
        "Random Forest: быстро обучается на CPU, устойчив, есть feature importance",
        "CatBoost любой ценой — он лучший по ROC-AUC",
        "Одно дерево глубины 1 — только оно интерпретируемо",
        "Все три модели в продакшене параллельно без выбора",
    ],
    answer_spec={"correct": 0},
    explanation=(
        "При близком качестве (разница 0.01 в ROC-AUC может быть незначимой) "
        "и ограничениях на вычисления/объяснимость RF — разумный дефолт: "
        "быстрый на CPU, устойчивый, с готовой feature importance."
    ),
    primary_skill="ml.tree_ensembles",
    source_content_id="concept.ml.bagging-and-random-forest",
    source_lesson_id="lesson.classic-ml.trees.forest",
    source_type="case",
    source_id="case.classic-ml.tree-ensemble-choice",
    difficulty="standard",
)

_CMP_ROC_DIFF = ReviewTemplate(
    id="rev.cmp.roc-diff",
    title="Разница ROC-AUC",
    prompt=(
        "Random Forest показал val ROC-AUC 0.86, CatBoost — 0.87. "
        "На сколько процентных пунктов CatBoost лучше RF?"
    ),
    question_type="numeric",
    answer_spec={"correct": 1.0, "tolerance": 0.11},
    explanation="0.87 − 0.86 = 0.01, то есть 1 процентный пункт (п.п.).",
    primary_skill="ml.error_analysis",
    source_content_id="concept.ml.xgboost-lightgbm-and-catboost",
    source_lesson_id="lesson.classic-ml.trees.libraries",
    source_type="lab",
    source_id="ensemble-comparison-lab",
    difficulty="easy",
    numeric_tolerance=0.11,
)


def get_default_registry() -> ReviewTemplateRegistry:
    """Registry по умолчанию: 15 шаблонов MVP-маршрута."""
    return ReviewTemplateRegistry(
        [
            _DT_SPLIT,
            _DT_OVERFIT,
            _BV_TRADEOFF,
            _BV_REGULARIZATION,
            _BV_DEPTH_CURVE,
            _RF_STEPS,
            _RF_BAGGING_BOOSTING,
            _RF_EXPLAIN,
            _GB_LEARNING_RATE,
            _GB_RESIDUALS,
            _GB_TOO_MANY_ITERS,
            _CB_CATEGORICAL,
            _CB_ERROR,
            _CMP_MODEL_CHOICE,
            _CMP_ROC_DIFF,
        ]
    )


DEFAULT_REVIEW_REGISTRY = get_default_registry()
