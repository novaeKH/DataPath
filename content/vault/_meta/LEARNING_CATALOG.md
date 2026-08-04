---
title: Learning Catalog v1
type: meta
area: learning-system
status: active
rag: exclude
updated: 2026-08-02
id: meta.learning-system.learning-catalog-v1
schema_version: 2
language: ru
app: exclude
---
# Learning Catalog v1

Машиночитаемый контракт учебного режима. Приложение читает только JSON-блок
`learning-catalog`, проверяет ссылки на заметки и не изменяет этот файл.

```learning-catalog
{
  "schema_version": 1,
  "catalog_id": "core-ml-v1",
  "title": "Core ML: фундамент и мышление",
  "language": "ru",
  "reviewed_at": "2026-08-02",
  "roadmap": {
    "optional": true,
    "description": "Ориентир, а не обязательная линейная программа. Порядок собран из пересечения открытых программ специалистов и адаптирован к текущему vault.",
    "sources": [
      {
        "id": "stanford-cs229",
        "title": "CS229: Machine Learning",
        "organization": "Stanford University",
        "url": "https://cs229.stanford.edu/syllabus-new.html",
        "audience": "математические основы и классический ML",
        "reviewed_at": "2026-08-02"
      },
      {
        "id": "google-mlcc",
        "title": "Machine Learning Crash Course",
        "organization": "Google for Developers",
        "url": "https://developers.google.com/machine-learning/crash-course",
        "audience": "прикладные основы, данные, метрики и generalization",
        "reviewed_at": "2026-08-02"
      },
      {
        "id": "deeplearning-ai-mls",
        "title": "Machine Learning Specialization",
        "organization": "DeepLearning.AI / Stanford Online",
        "url": "https://www.deeplearning.ai/specializations/machine-learning",
        "audience": "последовательное введение в supervised и unsupervised ML",
        "reviewed_at": "2026-08-02"
      },
      {
        "id": "fastai-practical-dl",
        "title": "Practical Deep Learning for Coders",
        "organization": "fast.ai",
        "url": "https://course.fast.ai/",
        "audience": "практическое обучение моделей и итеративная работа",
        "reviewed_at": "2026-08-02"
      },
      {
        "id": "full-stack-deep-learning",
        "title": "Full Stack Deep Learning Course",
        "organization": "Full Stack Deep Learning",
        "url": "https://fullstackdeeplearning.com/course/2022/",
        "audience": "полный жизненный цикл ML-систем",
        "reviewed_at": "2026-08-02"
      },
      {
        "id": "made-with-ml",
        "title": "MLOps Course",
        "organization": "Made With ML",
        "url": "https://madewithml.com/courses/mlops/",
        "audience": "проектирование, тестирование и production ML",
        "reviewed_at": "2026-08-02"
      }
    ],
    "stages": [
      {
        "id": "framing",
        "title": "1. Правильно поставить задачу",
        "description": "Сначала определить prediction contract и простую точку отсчёта.",
        "skill_ids": [
          "ml.problem_framing",
          "ml.object_target",
          "ml.baseline"
        ],
        "source_ids": [
          "google-mlcc",
          "deeplearning-ai-mls",
          "made-with-ml"
        ]
      },
      {
        "id": "evaluation",
        "title": "2. Построить честную оценку",
        "description": "Спроектировать split, исключить leakage и связать метрику с решением.",
        "skill_ids": [
          "ml.validation_split",
          "ml.data_leakage",
          "ml.metrics_threshold"
        ],
        "source_ids": [
          "stanford-cs229",
          "google-mlcc",
          "full-stack-deep-learning"
        ]
      },
      {
        "id": "models",
        "title": "3. Понимать базовые модели",
        "description": "Изучать модели через objective, assumptions и поведение ошибок.",
        "skill_ids": [
          "ml.linear_logistic_models",
          "ml.bias_variance_regularization",
          "ml.tree_ensembles"
        ],
        "source_ids": [
          "stanford-cs229",
          "deeplearning-ai-mls",
          "fastai-practical-dl"
        ]
      },
      {
        "id": "diagnostics",
        "title": "4. Диагностировать и улучшать",
        "description": "Искать причины ошибок по честным predictions и сегментам, а не угадывать hyperparameters.",
        "skill_ids": [
          "ml.error_analysis"
        ],
        "source_ids": [
          "google-mlcc",
          "full-stack-deep-learning",
          "made-with-ml"
        ]
      }
    ]
  },
  "error_taxonomy": [
    "missing_definition",
    "confuses_concepts",
    "wrong_assumption",
    "data_leakage",
    "wrong_validation",
    "metric_mismatch",
    "cannot_explain",
    "needs_hint",
    "careless_error"
  ],
  "skills": [
    {
      "id": "ml.problem_framing",
      "stage_id": "framing",
      "title": "Постановка ML-задачи",
      "description": "Перевести цель продукта или исследования в проверяемый prediction contract.",
      "priority": "core",
      "prerequisites": [],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/ML Foundations.md",
        "10 Знания/ML/02 Deep Learning/01 База/01 - Паспорт задачи и честный split.md"
      ],
      "outcomes": [
        "определить момент прогноза и решение после него",
        "назвать unit наблюдения, horizon и доступные признаки",
        "отделить полезную ML-задачу от неверно поставленной"
      ],
      "diagnostics": [
        {
          "id": "diag.problem-framing.1",
          "axis": "apply",
          "prompt": "Сервис доставки хочет предсказывать отмену заказа. Сформулируйте prediction contract: что является объектом, что target, в какой момент делается прогноз, какие данные допустимы и какое решение примет система.",
          "rubric": [
            {"id": "unit_target", "description": "Названы один заказ как unit и наблюдаемый факт отмены как target.", "weight": 0.25},
            {"id": "prediction_time", "description": "Зафиксирован конкретный момент прогноза до наступления outcome.", "weight": 0.25},
            {"id": "available_features", "description": "Признаки ограничены данными, реально доступными к моменту прогноза.", "weight": 0.25},
            {"id": "decision", "description": "Названо действие, которое меняется после прогноза, и цена ошибок.", "weight": 0.25}
          ],
          "error_codes": ["missing_definition", "data_leakage", "metric_mismatch"]
        }
      ]
    },
    {
      "id": "ml.object_target",
      "stage_id": "framing",
      "title": "Объект, target и доступные признаки",
      "description": "Различать единицу наблюдения, label, horizon и признаки без знания будущего.",
      "priority": "core",
      "prerequisites": ["ml.problem_framing"],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/ML Foundations.md",
        "10 Знания/ML/02 Deep Learning/01 База/01 - Паспорт задачи и честный split.md"
      ],
      "outcomes": [
        "увидеть несоответствие строки данных реальному объекту",
        "выбрать target, доступный для обучения и связанный с решением",
        "проверить feature availability на inference"
      ],
      "diagnostics": [
        {
          "id": "diag.object-target.1",
          "axis": "diagnose",
          "prompt": "В датасете одна строка — платёж. Target `fraud_confirmed` появляется через 30 дней. Модель должна блокировать платёж за секунду до авторизации. Почему признак `chargeback_created_at` нельзя использовать и какие даты нужно зафиксировать в паспорте задачи?",
          "rubric": [
            {"id": "future_feature", "description": "Объяснено, что chargeback появляется после prediction time и недоступен на inference.", "weight": 0.4},
            {"id": "times", "description": "Различены event time, prediction/cutoff time и момент созревания label.", "weight": 0.35},
            {"id": "consequence", "description": "Связано offline-завышение с невозможностью production-использования.", "weight": 0.25}
          ],
          "error_codes": ["data_leakage", "confuses_concepts", "cannot_explain"]
        }
      ]
    },
    {
      "id": "ml.baseline",
      "stage_id": "framing",
      "title": "Baseline и критерий ценности",
      "description": "Проверять данные, метрику и ценность сложности простой точкой отсчёта.",
      "priority": "core",
      "prerequisites": ["ml.problem_framing"],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/ML Foundations.md",
        "10 Знания/ML/03 Пайплайны ML/Универсальная схема бинарной классификации.md"
      ],
      "outcomes": [
        "выбрать наивный и простой model baseline",
        "сравнить модели на одном split и metric",
        "объяснить, какую гипотезу проверяет baseline"
      ],
      "diagnostics": [
        {
          "id": "diag.baseline.1",
          "axis": "apply",
          "prompt": "Положительный класс встречается в 2% случаев. Команда сразу обучила CatBoost и получила accuracy 97%. Какие два baseline вы построите и какой вывод сможете сделать после сравнения?",
          "rubric": [
            {"id": "constant", "description": "Предложен constant/frequent-class или prevalence baseline и замечено, что accuracy вводит в заблуждение.", "weight": 0.35},
            {"id": "simple_model", "description": "Предложен простой обучаемый baseline, например logistic regression.", "weight": 0.3},
            {"id": "fair_comparison", "description": "Сравнение проводится на одинаковом честном split с подходящей метрикой.", "weight": 0.35}
          ],
          "error_codes": ["metric_mismatch", "wrong_validation", "missing_definition"]
        }
      ]
    },
    {
      "id": "ml.validation_split",
      "stage_id": "evaluation",
      "title": "Train, validation, test и схема split",
      "description": "Строить оценку, которая имитирует новый объект, группу или будущее время.",
      "priority": "core",
      "prerequisites": ["ml.object_target"],
      "note_paths": [
        "10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md"
      ],
      "outcomes": [
        "разделить роли train, validation и final test",
        "выбрать random, group или time split по deployment",
        "понять, когда test превратился в validation"
      ],
      "diagnostics": [
        {
          "id": "diag.validation-split.1",
          "axis": "apply",
          "prompt": "Есть события пользователей за 12 месяцев, у каждого пользователя много строк. В production нужно предсказывать события тех же пользователей в следующем месяце. Как разделить train, validation и test и почему обычный random row split неверен?",
          "rubric": [
            {"id": "time_order", "description": "Сохранён временной порядок: прошлое обучает, более поздние периоды валидируют, последний период остаётся test.", "weight": 0.4},
            {"id": "deployment_match", "description": "Объяснено соответствие тому, что в production новые события, а не обязательно новые пользователи.", "weight": 0.35},
            {"id": "random_risk", "description": "Назван риск знания будущего или почти дублирующих user patterns при random row split.", "weight": 0.25}
          ],
          "error_codes": ["wrong_validation", "data_leakage", "wrong_assumption"]
        }
      ]
    },
    {
      "id": "ml.data_leakage",
      "stage_id": "evaluation",
      "title": "Data leakage",
      "description": "Находить target, temporal, group и preprocessing leakage до доверия метрике.",
      "priority": "core",
      "prerequisites": ["ml.validation_split"],
      "note_paths": [
        "10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md",
        "10 Знания/ML/02 Deep Learning/03 Диагностика и ускорение/04 - Утечки и проверка данных.md"
      ],
      "outcomes": [
        "найти признак, созданный после cutoff",
        "помещать preprocessing fit внутрь fold",
        "увидеть зависимые entities между folds"
      ],
      "diagnostics": [
        {
          "id": "diag.leakage.1",
          "axis": "diagnose",
          "prompt": "Перед cross-validation аналитик заполнил пропуски средним и сделал target encoding на всём датасете, затем запустил KFold. Какие утечки возникли и как перестроить pipeline?",
          "rubric": [
            {"id": "preprocess_leak", "description": "Замечено, что статистики imputation увидели validation folds.", "weight": 0.3},
            {"id": "target_leak", "description": "Замечено, что target encoding использовал labels validation folds.", "weight": 0.35},
            {"id": "pipeline_fix", "description": "Fit всех преобразований выполняется только на train части каждого fold, target encoding — out-of-fold/leakage-safe.", "weight": 0.35}
          ],
          "error_codes": ["data_leakage", "wrong_validation", "cannot_explain"]
        }
      ]
    },
    {
      "id": "ml.metrics_threshold",
      "stage_id": "evaluation",
      "title": "Метрика, probability и threshold",
      "description": "Связывать score, probability, решение, цену ошибок и рабочий threshold.",
      "priority": "core",
      "prerequisites": ["ml.validation_split"],
      "note_paths": [
        "10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md"
      ],
      "outcomes": [
        "различать ranking, probability и decision metrics",
        "выбирать метрику по costs, prevalence и capacity",
        "выбирать threshold только на validation predictions"
      ],
      "diagnostics": [
        {
          "id": "diag.metrics.1",
          "axis": "apply",
          "prompt": "Антифрод-модель ранжирует 100 000 платежей в день, вручную можно проверить только 500. Почему ROC-AUC недостаточно и как выбрать offline-метрику и operating threshold?",
          "rubric": [
            {"id": "capacity", "description": "Учтено ограничение top-500 или соответствующая доля потока.", "weight": 0.3},
            {"id": "working_region", "description": "Предложена metric в рабочей области: precision/recall at K, PR curve или expected cost.", "weight": 0.35},
            {"id": "threshold_validation", "description": "Threshold выбирается по validation/OOF predictions с costs и затем один раз проверяется на test.", "weight": 0.35}
          ],
          "error_codes": ["metric_mismatch", "wrong_validation", "wrong_assumption"]
        }
      ]
    },
    {
      "id": "ml.linear_logistic_models",
      "stage_id": "models",
      "title": "Linear и Logistic Regression",
      "description": "Понимать линейный score, likelihood, loss, coefficients и границу решений.",
      "priority": "core",
      "prerequisites": ["ml.metrics_threshold"],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/Linear Regression.md",
        "10 Знания/ML/01 Classical ML/Logistic Regression.md"
      ],
      "outcomes": [
        "связать noise model или Bernoulli likelihood с loss",
        "объяснить коэффициенты без ложной causal-интерпретации",
        "разделить score, probability и threshold"
      ],
      "diagnostics": [
        {
          "id": "diag.linear-logistic.1",
          "axis": "explain",
          "prompt": "Объясните, почему Logistic Regression обучают с LogLoss, что означает линейность этой модели и почему threshold 0.5 не является обязательным.",
          "rubric": [
            {"id": "likelihood", "description": "Bernoulli likelihood и negative log-likelihood связаны с LogLoss.", "weight": 0.4},
            {"id": "linearity", "description": "Линейным является logit/log-odds по признакам и decision boundary в исходном space.", "weight": 0.3},
            {"id": "threshold", "description": "Threshold выбирается отдельно по costs/metric на validation data.", "weight": 0.3}
          ],
          "error_codes": ["confuses_concepts", "missing_definition", "cannot_explain"]
        }
      ]
    },
    {
      "id": "ml.bias_variance_regularization",
      "stage_id": "models",
      "title": "Bias, variance и regularization",
      "description": "Диагностировать generalization gap и понимать trade-off ограничения сложности.",
      "priority": "core",
      "prerequisites": ["ml.linear_logistic_models"],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/ML Foundations.md",
        "10 Знания/ML/01 Classical ML/Regularization.md"
      ],
      "outcomes": [
        "различать underfitting и generalization gap",
        "объяснить, как regularization меняет bias и variance",
        "не путать overfitting с leakage или distribution shift"
      ],
      "diagnostics": [
        {
          "id": "diag.bias-variance.1",
          "axis": "diagnose",
          "prompt": "Train loss низкий, validation loss высокий. Коллега предлагает сразу усилить L2. Какие причины вы проверите до изменения regularization и как L2 может повлиять на результат?",
          "rubric": [
            {"id": "sanity_checks", "description": "До capacity проверяются split, leakage, metric/implementation и distribution mismatch.", "weight": 0.4},
            {"id": "variance", "description": "Разрыв распознан как возможный high variance, но не как доказательство единственной причины.", "weight": 0.25},
            {"id": "regularization_effect", "description": "L2 добавляет bias, обычно снижает variance и при чрезмерной силе даёт underfitting.", "weight": 0.35}
          ],
          "error_codes": ["wrong_assumption", "data_leakage", "confuses_concepts"]
        }
      ]
    },
    {
      "id": "ml.tree_ensembles",
      "stage_id": "models",
      "title": "Деревья, Random Forest и Gradient Boosting",
      "description": "Различать greedy tree, независимое усреднение и последовательное исправление gradient signal.",
      "priority": "core",
      "prerequisites": ["ml.bias_variance_regularization"],
      "note_paths": [
        "10 Знания/ML/01 Classical ML/Decision Trees.md",
        "10 Знания/ML/01 Classical ML/Bagging and Random Forest.md",
        "10 Знания/ML/01 Classical ML/Gradient Boosting.md"
      ],
      "outcomes": [
        "объяснить split gain и высокий variance дерева",
        "объяснить снижение variance через averaging и decorrelation",
        "связать boosting с negative gradients выбранного loss"
      ],
      "diagnostics": [
        {
          "id": "diag.tree-ensembles.1",
          "axis": "explain",
          "prompt": "Сравните одно глубокое дерево, Random Forest и Gradient Boosting: как они строятся, какую проблему обычно исправляют и почему фраза «boosting учится на ошибках» неполна?",
          "rubric": [
            {"id": "tree", "description": "Одно дерево описано как greedy piecewise-constant model с высоким variance при большой глубине.", "weight": 0.25},
            {"id": "forest", "description": "Random Forest обучает деревья независимо, decorrelates их и усредняет для снижения variance.", "weight": 0.35},
            {"id": "boosting", "description": "Boosting строит additive model последовательно по negative gradients loss; residual — частный случай squared loss.", "weight": 0.4}
          ],
          "error_codes": ["confuses_concepts", "missing_definition", "cannot_explain"]
        }
      ]
    },
    {
      "id": "ml.error_analysis",
      "stage_id": "diagnostics",
      "title": "Error analysis и следующий эксперимент",
      "description": "Превращать честные OOF/validation predictions в проверяемые гипотезы улучшения.",
      "priority": "core",
      "prerequisites": ["ml.metrics_threshold", "ml.tree_ensembles"],
      "note_paths": [
        "10 Знания/ML/03 Пайплайны ML/Regression_Error_Analysis.md",
        "10 Знания/ML/05 Валидация и оценка/Диагностика — PR-AUC на train выше validation.md"
      ],
      "outcomes": [
        "анализировать OOF/validation, не final test predictions",
        "сравнивать ошибки по сегментам, времени и направлению",
        "формулировать один эксперимент с ожидаемым сигналом"
      ],
      "diagnostics": [
        {
          "id": "diag.error-analysis.1",
          "axis": "diagnose",
          "prompt": "У регрессионной модели приемлемый средний MAE, но пользователи жалуются на дорогие объекты. Как провести error analysis и выбрать следующий эксперимент, не подглядывая в final test?",
          "rubric": [
            {"id": "honest_predictions", "description": "Используются OOF или held-out validation predictions, final test остаётся нетронутым.", "weight": 0.3},
            {"id": "segments", "description": "Проверяются absolute/relative residuals, target ranges, бизнес-сегменты и устойчивость во времени.", "weight": 0.35},
            {"id": "experiment", "description": "Сформулирован один falsifiable experiment с baseline, неизменным split и ожидаемым segment-level сигналом.", "weight": 0.35}
          ],
          "error_codes": ["wrong_validation", "metric_mismatch", "wrong_assumption"]
        }
      ]
    }
  ]
}
```

## Правило изменения каталога

Новый навык добавляется только вместе с существующей заметкой, наблюдаемым
результатом обучения и диагностикой с рубрикой. После изменения нужно запустить
валидатор приложения, указанный в `_meta/LEARNING_SYSTEM_STATE.md`.
