---
title: DataPath Visual Demonstrations
id: meta.learning-system.visual-demos
type: meta
area: learning-system
status: active
schema_version: 2
language: ru
rag: exclude
app: exclude
updated: '2026-08-05'
---

# DataPath Visual Demonstrations

## Назначение

Визуализация включается только там, где изменение параметра помогает понять механизм. Она не заменяет theory, worked example и checkpoint.

## Обязательный контракт компонента

Каждый visual component должен иметь:

- один учебный вопрос;
- 1–4 понятных controls;
- подписи переменных и units;
- начальное состояние, которое уже объясняет идею;
- текстовый вывод после взаимодействия;
- keyboard controls;
- reduced-motion mode;
- stable container size;
- отсутствие remount/flash при изменении parameter;
- один state snapshot для geometry и labels;
- без `transition: all` и повторной entrance animation.

## Python и Data

| ID | Тема | Что изменяет пользователь | Что должен увидеть |
|---|---|---|---|
| `tensor-shape-tracer` | shapes | axes/reshape | изменение формы без изменения числа элементов |
| `numpy-array-lab` | ndarray | shape/dtype/axis | memory, aggregation result |
| `numpy-broadcasting-lab` | broadcasting | shapes | compatible expansion или понятная ошибка |
| `dataframe-selection-lab` | pandas selection | rows/columns/mask | loc/iloc result и shape |
| `data-cleaning-lab` | missing/dtypes | imputation/rule | до/после и потеря данных |
| `groupby-merge-lab` | groupby/join | key/how | grain, row count и many-to-many explosion |
| `time-window-lab` | rolling | window/cutoff | historical feature без future leakage |
| `plot-design-lab` | Matplotlib | chart/question/scale | подходящая visual encoding |
| `seaborn-plot-selector` | Seaborn | variable types | distribution/relationship plot |
| `eda-workflow-board` | EDA | stage/data issue | следующий осмысленный шаг |
| `missing-outlier-lab` | quality | mechanism/action | почему одинаковый NaN требует разных решений |
| `relationship-plot-lab` | EDA relations | grouping/time | Simpson's paradox и support |

## Classical ML

| ID | Тема | Controls | Результат |
|---|---|---|---|
| `bias-variance-playground` | capacity | complexity/noise/n | train/validation curves |
| `linear-fit-residual-lab` | Linear Regression | slope/outlier/loss | residuals и MSE/MAE |
| `logistic-boundary-threshold-lab` | Logistic | boundary/threshold | probability и confusion matrix |
| `regularization-path-lab` | L1/L2 | lambda/correlation | coefficient paths |
| `knn-neighbourhood-lab` | KNN | K/metric/scaling | neighbors и boundary |
| `naive-bayes-evidence-lab` | NB | prior/evidence | log-score decomposition |
| `svm-margin-kernel-lab` | SVM | C/gamma/kernel | margin/support vectors |
| `decision-tree-split-lab` | Tree | threshold/criterion | weighted impurity and gain |
| `bootstrap-forest-lab` | RF | samples/features/trees | decorrelation and variance |
| `boosting-residuals-lab` | Boosting | eta/step/depth | sequential correction |
| `categorical-encoding-lab` | Categories | encoding/order | leakage-safe statistics |
| `kmeans-canvas` | K-Means | K/seed/scale | assignment/update/inertia |
| `pca-projection-lab` | PCA | direction/k/scale | projection and reconstruction |
| `density-hierarchy-clustering-lab` | DBSCAN/hierarchy | eps/linkage | density/noise/dendrogram |
| `imbalance-threshold-lab` | Imbalance | prevalence/threshold | PR, precision, recall, counts |
| `calibration-reliability-lab` | Calibration | distortion/method | reliability and score |
| `hyperparameter-search-landscape` | Tuning | strategy/noise | selection bias |
| `interpretation-methods-lab` | Interpretation | correlation/method | differing importance meanings |
| `anomaly-methods-lab` | Anomalies | context/threshold | unusual ≠ fraud |

## Deep Learning

| ID | Тема | Controls | Результат |
|---|---|---|---|
| `activation-loss-explorer` | activations/loss | logit/target/function | output and gradient intuition |
| `backprop-computation-graph` | backprop | values/lr | local derivatives and update |
| `optimizer-landscape-lab` | optimizers | optimizer/lr/momentum | trajectory on same loss |
| `cnn-kernel-feature-map-lab` | CNN | kernel/stride/padding | feature map and receptive field |
| `rnn-state-gates-lab` | RNN/LSTM | sequence/gates | hidden memory and gradient |
| `attention-matrix-lab` | attention | Q/K/mask | scores, softmax and weighted sum |
| `transformer-block-lab` | Transformer | mask/block/generation | residual path and shifted targets |
| `training-loop-timeline` | PyTorch | mode/accumulation | train, validation and inference |
| `fine-tuning-parameter-budget` | PEFT | strategy/rank | trainable parameters and memory |
| `dl-debugging-decision-tree` | debugging | symptom | ordered diagnostic process |

## Animation stability

- Keep component root mounted.
- Stable keys are based on entity identity, not current value.
- Derived geometry is computed from the same state render.
- No intermediate zero/undefined dimensions.
- SVG `viewBox` remains stable.
- Recharts entrance animation runs only on first mount or is disabled.
- Framer Motion uses transform/opacity, not width/height layout for fast parameter updates.
- Rapid slider input may be throttled only when computation is genuinely expensive; labels and geometry must remain synchronized.
