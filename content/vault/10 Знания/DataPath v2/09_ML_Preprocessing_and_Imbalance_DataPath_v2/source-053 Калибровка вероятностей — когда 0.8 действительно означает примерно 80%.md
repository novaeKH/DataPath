---
title: "Калибровка вероятностей — когда 0.8 действительно означает примерно 80%"
id: concept.datapath-v2.053
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 53
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Калибровка вероятностей: когда 0.8 действительно означает примерно 80%

Классификатор часто возвращает:

```python
model.predict_proba(X)[:, 1]
```

И очень легко назвать эти числа «вероятностями».

Но есть два разных качества:

1. **ranking** — ставит ли model более рискованные объекты выше;
2. **calibration** — соответствует ли численное значение score реальной частоте события.

Модель может иметь отличную ROC-AUC и при этом выдавать плохо откалиброванные probabilities.

Например:

```text
объекты со score ≈ 0.8
реально positive только в 45% случаев
```

Ranking может быть хорошим, но число 0.8 нельзя интерпретировать буквально.

---

## 1. Что значит calibrated probability

Идеально calibrated model:

> среди объектов, которым model назначает probability около 0.7, событие происходит примерно в 70% случаев.

Это group-level interpretation, а не обещание судьбы отдельного объекта.

Для конкретного клиента:

```text
p=0.7
```

не означает «он уйдёт на 70%».

Это означает, что в хорошо откалиброванной population объектов с аналогичным predicted probability положительная частота должна быть около 70%.

---

## 2. Ranking и calibration могут расходиться

Model A:

```text
real risks: 0.05, 0.10, 0.40, 0.80
predicted:  0.20, 0.30, 0.70, 0.99
```

Ranking идеален: порядок объектов правильный.

Но probabilities систематически завышены.

ROC-AUC может быть высокой.

Calibration — плохая.

Если задача:

```text
выбрать top 1% risk
```

ranking может быть достаточен.

Если задача:

```text
expected loss = probability × amount
```

нужны meaningful probabilities.

---

## 3. Calibration curve / reliability diagram

Один из главных инструментов — calibration curve.

Predicted probabilities разбиваются на bins.

Например bin:

```text
0.7–0.8
```

Внутри него считаем:

- средний predicted probability;
- реальную долю positives.

Если:

```text
mean prediction = 0.75
fraction positive = 0.74
```

хорошо.

Если:

```text
mean prediction = 0.75
fraction positive = 0.30
```

model overconfident.

В scikit-learn `CalibrationDisplay`/`calibration_curve` реализуют такой reliability-diagram подход.

---

![Учебная иллюстрация: Калибровка вероятностей. Reliability diagram различает calibrated, overconfident и underconfident predictions.](content-assets/datapath-v2/figures/53_probability_calibration.png "Reliability diagram различает calibrated, overconfident и underconfident predictions.")

## 4. Почему binning само по себе шумное

Если в bin мало объектов, observed positive fraction нестабильна.

Особенно при rare-event tasks.

Поэтому calibration plot зависит от:

- числа bins;
- размера validation;
- binning strategy.

Не нужно воспринимать небольшие колебания curve как точное доказательство miscalibration.

---

## 5. Brier score

Для binary classification Brier score:

\[
BS=\frac1n\sum_i(p_i-y_i)^2.
\]

Это squared error между predicted probability и binary target.

Если:

```text
p=0.9, y=1
```

error маленькая.

Если:

```text
p=0.9, y=0
```

error большая.

Brier score отражает probability quality, но в нём смешиваются несколько аспектов, включая calibration и discrimination.

Поэтому его лучше рассматривать вместе с ranking metrics и calibration curve.

---

## 6. Log loss

Binary logloss:

\[
-\frac1n
\sum_i
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
\]

Она особенно сильно наказывает уверенную ошибку.

Например:

```text
y=1
p=0.0001
```

даёт большой loss.

Logloss тоже относится к proper probability-oriented metrics, но хорошая logloss не заменяет визуальную/предметную calibration analysis.

---

## 7. Почему некоторые models калиброваны лучше других

Разные algorithms строят scores разной природы.

Логистическая регрессия при хорошо заданной specification часто даёт довольно естественные probability estimates.

Decision tree probabilities могут быть нестабильны из-за маленьких leaves.

Random Forest averages leaf probabilities и часто меняет extreme confidence.

SVM `decision_function` изначально является margin score, а не probability.

Boosting может отлично rank, но probabilities зависят от loss, regularization, overfit и data distribution.

Нельзя считать `predict_proba` гарантией perfect calibration.

---

## 8. Причины плохой calibration

- model misspecification;
- overfitting;
- class weights;
- over/under sampling;
- changed class prevalence;
- train/production shift;
- too-small leaves;
- excessive confidence;
- dataset shift.

Особенно важно:

> изменение base rate события может ухудшить probability interpretation даже при сохранении ranking.

---

## 9. Calibration — отдельная model поверх score

Идея post-hoc calibration:

```text
base model
→ raw score/probability
→ calibrator
→ calibrated probability
```

Калибратор учится отображению:

\[
f(x)\rightarrow P(y=1|f(x)).
\]

То есть он не обязан заново изучать original features — он корректирует relationship между score и observed event frequency.

---

## 10. Почему calibrator нельзя обучать на тех же predictions, где base model fit

Если base model получила predictions на собственном train, они обычно слишком оптимистичны.

Если calibrator обучится на этих же scores, он увидит нереалистично сильную base model.

Поэтому calibration требует predictions на данных, которые base estimator не использовал для обучения.

В scikit-learn `CalibratedClassifierCV` использует cross-validation, чтобы получать подходящие predictions для calibration.

---

## 11. Sigmoid / Platt scaling

Один подход — обучить sigmoid mapping raw score → probability.

Концептуально:

\[
p=\sigma(af+b).
\]

Это параметрический, относительно гладкий correction.

Плюсы:

- мало parameters;
- стабильнее на умеренном объёме calibration data.

Минус:

- может быть слишком жёстким, если miscalibration имеет сложную форму.

---

## 12. Isotonic calibration

Isotonic regression строит монотонное, более гибкое отображение.

Идея:

```text
если score A > score B
то calibrated probability A не должна быть меньше B
```

Но shape mapping не обязана быть sigmoid.

Плюс: гибкость.

Минус: нужно больше calibration data, иначе можно overfit calibrator.

scikit-learn прямо предупреждает, что isotonic не стоит использовать при слишком малом calibration sample.

---

## 13. Temperature scaling

В современных multiclass settings часто используется temperature scaling.

Для logits:

\[
softmax(z/T).
\]

Если \(T>1\), probabilities становятся мягче.

Если \(T<1\), более уверенными.

В актуальной scikit-learn calibration API temperature scaling поддерживается как отдельный method для calibration, особенно естественный для multiclass logits.

Важно: конкретная доступность зависит от installed scikit-learn version.

---

## 14. Что делает `CalibratedClassifierCV`

Концептуально при cross-validation:

```text
fold 1:
fit base model на train
predict held-out fold
fit calibrator on held-out scores

fold 2:
...
```

В ensemble mode создаются пары:

```text
classifier + calibrator
```

а final probabilities агрегируются.

Главная идея — calibrator всегда учится на scores от model, которая не fit-илась на этих же samples.

---

## 15. Пример кода

```python
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC

base = LinearSVC()

model = CalibratedClassifierCV(
    estimator=base,
    method="sigmoid",
    cv=5,
)

model.fit(X_train, y_train)

proba = model.predict_proba(X_valid)[:, 1]
```

Теперь estimator, который исходно даёт decision scores, может выдавать calibrated probabilities.

---

## 16. Calibration curve

```python
from sklearn.calibration import CalibrationDisplay

CalibrationDisplay.from_estimator(
    model,
    X_valid,
    y_valid,
    n_bins=10,
)
```

График сравнивает:

```text
mean predicted probability
vs
fraction of positives
```

Идеальная линия примерно:

\[
y=x.
\]

---

## 17. Почему calibration не обязана улучшать ROC-AUC

Если calibration mapping монотонный, ranking объектов почти не меняется.

ROC-AUC зависит прежде всего от ordering.

Поэтому после calibration может быть:

```text
ROC-AUC почти та же
Brier/logloss лучше
probabilities интерпретируемее
```

Это нормальный результат.

Цель calibration не обязательно повысить ranking.

---

## 18. Threshold после calibration

Если threshold был выбран как:

```text
p >= 0.5
```

и probabilities изменились после calibration, operational behavior может измениться.

Поэтому threshold надо выбирать **после** final probability transformation, на validation/OOF data.

Если threshold основан на top-k ranking, monotonic calibration может почти не менять ordering. Если он основан на конкретном probability value, влияние сильнее.

---

## 19. Calibration и class weights

Weighted classifier может изменить probability scale, потому что training objective теперь отражает искусственные costs/class priors.

Это не значит, что weighting плохой.

Но если probability имеет бизнес-смысл, после weighting нужно проверить calibration на real validation distribution.

---

## 20. Calibration и oversampling

Training distribution:

```text
после SMOTE:
50% positives
```

Production:

```text
1% positives
```

Даже если ranking хороший, raw probability interpretation может быть смещена.

Поэтому:

```text
resampling
→ fit model
→ evaluate on real-distribution validation
→ calibrate if needed
```

Calibration set itself не надо искусственно балансировать, если цель — probability in real deployment population.

---

## 21. Prevalence shift

Пусть model была calibrated при:

```text
default rate = 10%
```

Через год:

```text
default rate = 3%
```

Даже при похожем ranking old probability mapping может перестать соответствовать реальности.

Поэтому production monitoring должен следить не только за ROC-AUC/PR-AUC, но и за calibration / base rate.

---

## 22. Decision making через expected value

Здесь calibrated probabilities становятся особенно полезны.

Допустим:

```text
loss при default = 100 000
стоимость проверки = 1 000
```

Если probability meaningful, можно считать expected cost.

Упрощённо:

\[
ExpectedLoss=p(default)\cdot100000.
\]

При:

```text
p=0.20
```

expected loss ≈ 20 000.

Тогда decision можно принимать через economics, а не arbitrary threshold 0.5.

---

## 23. Ranking use case vs probability use case

### Ranking

```text
выбрать top 100 клиентов
```

Главное ordering.

### Probability

```text
посчитать expected loss
прайсинг
резервы
risk limits
```

Нужна calibration.

Поэтому перед calibration спросите:

> нам действительно нужна probability или достаточно score/rank?

---

## 24. Интерактивная визуализация DataPath

### Экран 1. Ranking vs calibration

Четыре objects с правильным ranking, но завышенными probabilities.

Показать:

```text
ROC-AUC высокая
calibration плохая
```

### Экран 2. Reliability diagram

10 bins. Пользователь меняет model confidence.

Показывать ideal diagonal.

### Экран 3. Sigmoid vs isotonic

Raw score → calibrated probability.

Показать smooth sigmoid и более гибкую monotonic isotonic mapping.

### Экран 4. Prevalence shift

Slider:

```text
positive rate 10% → 1%
```

Показать, как precision/calibration interpretation меняется при сохранении ranking.

---

## 25. Типичные ошибки

**«Если есть `predict_proba`, probabilities calibrated».**\
Нет.

**«Высокая ROC-AUC означает правильные probabilities».**\
Нет.

**«Calibration должна повысить ROC-AUC».**\
Не обязательно.

**«Calibrator можно fit на train predictions base model».**\
Это biased.

**«Isotonic всегда лучше sigmoid, потому что гибче».**\
Нет, он легче overfit на небольших данных.

**«После SMOTE probabilities остаются автоматически честными».**\
Не гарантируется.

**«Probability calibration один раз и навсегда».**\
Distribution shift может её разрушить.

---

## 26. Проверка понимания

1. Чем ranking отличается от calibration?
2. Что значит probability 0.7 для calibrated model?
3. Как строится reliability diagram?
4. Что измеряет Brier score?
5. Почему calibrator нужен independent/out-of-fold score?
6. Sigmoid vs isotonic?
7. Почему ROC-AUC может не измениться после calibration?
8. Почему class weights влияют на probability interpretation?
9. Что делает prevalence shift?
10. Когда calibration особенно важна для бизнеса?

---

## 27. Мини-практика

Model A:

```text
ROC-AUC = 0.91
Brier = 0.18
objects with p≈0.8 have actual positive rate 0.45
```

После calibration:

```text
ROC-AUC = 0.91
Brier = 0.11
objects with p≈0.8 have actual positive rate 0.78
```

Ответьте:

1. улучшился ли ranking;
2. улучшилась ли calibration;
3. почему ROC-AUC не изменилась;
4. где новая model полезнее — top-k ranking или expected loss;
5. надо ли заново выбрать probability threshold.

---

## 28. Как объяснить на собеседовании

### Что такое calibration?

**Коротко.**\
Это соответствие predicted probability реальной частоте события. Если model хорошо calibrated, среди объектов с probability около 0.7 positive встречается примерно в 70% случаев.

### Может ли model иметь высокий ROC-AUC и плохую calibration?

Да. ROC-AUC оценивает ranking, а не абсолютный scale probabilities.

### Как калибровать?

Использовать held-out или out-of-fold scores base classifier и обучить calibrator, например sigmoid или isotonic mapping. Нельзя fit calibrator на optimistic train predictions той же model.

---

## 29. Что нужно унести

1. Ranking и calibration — разные свойства.
2. `predict_proba` не гарантирует calibrated probability.
3. Calibration curve сравнивает predicted probability и observed event rate.
4. Brier/logloss помогают оценивать probability quality.
5. Calibrator обучается на independent/OOF predictions.
6. Sigmoid — более жёсткий parametric mapping.
7. Isotonic — более гибкий monotonic mapping.
8. Calibration не обязана улучшать ROC-AUC.
9. Threshold выбирают после final probability transformation.
10. Weights/resampling могут изменить probability scale.
11. Prevalence shift способен разрушить calibration.
12. Calibrated probabilities особенно важны для expected-value decisions.

---

## Куда дальше

Теперь мы завершили supervised-preprocessing линию:

```text
raw data
→ features
→ categories
→ imbalance
→ calibrated probabilities
```

Следующий блок переходит к обучению без учителя и представлению данных:

- K-Means;
- DBSCAN;
- PCA;
- anomaly detection;
- model interpretation;
- финальный end-to-end model selection workflow.

## Источники
- scikit-learn User Guide — Probability calibration.
- scikit-learn — CalibratedClassifierCV and CalibrationDisplay.
