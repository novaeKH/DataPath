---
title: "Классические модели для текста — Logistic Regression, Linear SVM и Naive Bayes"
id: concept.datapath-v2.077
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 77
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Классические модели для текста: как получить сильный baseline без Transformer

После TF-IDF документ может иметь:

```text
100 000 features
```

но только десятки/сотни non-zero.

В такой geometry классические linear models работают удивительно хорошо.

Главные candidates:

- Logistic Regression;
- Linear SVM;
- Multinomial Naive Bayes.

Задача урока — понять, почему sparse high-dimensional text не обязательно требует deep model.

---

## 1. Logistic Regression на TF-IDF

Score:

\[
z=w^Tx+b.
\]

Каждый token/n-gram имеет coefficient.

Для binary classification:

\[
P(y=1|x)=\sigma(z).
\]

Если feature:

```text
"списали дважды"
```

имеет large positive coefficient, его presence повышает log-odds class 1.

---

## 2. Почему linear boundary может быть достаточно

Text representation уже high-dimensional.

Каждая n-gram — отдельная axis.

Nonlinearity partially encoded самой feature engineering:

```text
word
bigram
char n-gram
```

Поэтому classifier не обязан быть nonlinear, чтобы учитывать phrase patterns.

---

## 3. Regularization особенно важна

Features:

```text
50k–1m
```

многие rare.

Без regularization coefficients могут подстроиться под noise.

Logistic Regression обычно использует L2 penalty как strong default.

Parameter `C` в sklearn inverse regularization strength:

```text
C small → stronger regularization
C large → weaker
```

---

## 4. Linear SVM

SVM строит separating hyperplane с margin.

Для huge sparse text используют linear implementation, например:

```python
from sklearn.svm import LinearSVC
```

Не kernel RBF на 200k × 100k sparse matrix как первый choice.

---

## 5. Margin intuition

SVM хочет не просто classify training examples, но расположить boundary с хорошим margin.

Points near boundary особенно влияют на solution.

Для text classification LinearSVC часто является одним из сильнейших classical baselines.

---

## 6. `LinearSVC` не даёт probability напрямую

Он выдаёт:

```python
decision_function
```

— margin-like score.

Если нужны calibrated probabilities, можно использовать calibration отдельно.

Нельзя воспринимать SVM score 2.3 как 230% или probability.

---

## 7. Logistic vs LinearSVC

### Logistic

- probability-like output;
- logloss training;
- удобно threshold/calibration;
- coefficients interpretable.

### LinearSVC

- margin objective;
- часто очень strong classification boundary;
- no native probability;
- calibration отдельным этапом.

Нельзя утверждать заранее winner.

---

## 8. Naive Bayes intuition

Naive Bayes использует Bayes rule:

\[
P(y|x)
\propto
P(y)P(x|y).
\]

**Наивное** assumption:

> features conditionally independent given class.

Для words это явно не строго верно.

Но model всё равно часто работает удивительно хорошо на text counts.

---

## 9. Multinomial Naive Bayes

Подходит для count-like nonnegative features.

Он оценивает class-specific term probabilities.

Если word сильно чаще встречается в spam, его presence повышает spam posterior.

`MultinomialNB` historically natural for counts/TF-IDF-like nonnegative text features.

---

## 10. Почему NB работает, хотя independence неверна

Для classification не обязательно идеально моделировать true joint distribution.

Даже грубые class-specific lexical statistics могут дать правильное ranking/decision.

Кроме того, high-dimensional sparse words действительно содержат сильные independent-ish evidences.

---

## 11. Smoothing

Если word никогда не встречался в class:

```text
P(word|class)=0
```

наивное multiplication обнулит whole likelihood.

Используют additive/Laplace smoothing.

В `MultinomialNB` parameter:

```text
alpha
```

контролирует smoothing.

---

## 12. NB и long documents

Multiplication многих tiny probabilities numerically unstable.

На практике calculations выполняются в log-space:

\[
\log P(y|x)
=
\log P(y)
+
\sum_j x_j\log P(feature_j|y)
+\text{const}.
\]

Это превращает product в sum.

---

## 13. Complement Naive Bayes

Для imbalanced text classification `ComplementNB` был разработан как variant, использующий statistics complement classes и иногда работает лучше MultinomialNB.

Это useful candidate, но не нужно считать обязательным.

---

## 14. Class imbalance

Text dataset:

```text
95% normal
5% complaint
```

Нужны:

- appropriate metrics;
- stratified/group split;
- class weights where supported;
- threshold selection if probabilities/scores used.

Accuracy — доля правильных ответов — может быть misleading.

---

## 15. Strong baseline pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=3,
        sublinear_tf=True,
    )),
    ("clf", LogisticRegression(
        C=2.0,
        max_iter=1000,
        class_weight="balanced",
    )),
])
```

Но `class_weight="balanced"` используем только если validation показывает benefit для task metric.

---

## 16. LinearSVC pipeline

```python
from sklearn.svm import LinearSVC

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=3,
    )),
    ("clf", LinearSVC(
        C=1.0,
    )),
])
```

Очень быстрый и сильный baseline для many text tasks.

---

## 17. Naive Bayes pipeline

```python
from sklearn.naive_bayes import MultinomialNB

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
    )),
    ("clf", MultinomialNB(
        alpha=1.0,
    )),
])
```

---

## 18. Word + char union

Сильный approach:

```text
word TF-IDF
+
char TF-IDF
→ concatenate
→ Linear model
```

Char captures:
- typos;
- suffixes;
- morphology.

Word captures:
- semantic lexical units;
- phrases.

---

## 19. Почему trees обычно не первый choice на raw TF-IDF

Random Forest на 200k sparse high-dimensional features:

- many split candidates;
- sparse geometry;
- expensive;
- often weaker than linear models.

Boosting тоже обычно естественнее на dense tabular features.

Text TF-IDF — domain, где linear inductive bias очень силён.

---

## 20. Coefficients как debugging

Logistic/LinearSVC позволяет вывести top n-grams.

Если top feature:

```text
"target_category_3"
```

или system template after label creation, вы нашли leakage.

Это огромный плюс transparent baseline.

---

## 21. Error analysis

Не ограничиваться score.

Посмотреть:

```text
false positives
false negatives
short texts
long texts
rare language
typos
negation
mixed intents
```

Ошибки часто подсказывают, стоит ли:

- char n-grams;
- bigger n-grams;
- better labels;
- Transformer.

---

## 22. Cross-validation cost

Vectorizer должен fit inside fold.

Но text matrix может быть large, поэтому full CV expensive.

Practical options:

- fixed validation for iteration;
- final CV for promising configs;
- cache transformations carefully without leakage.

Не надо 1000 random trials classical NLP.

---

## 23. Threshold

Logistic Regression:

```text
predict_proba
```

 позволяет threshold tune.

LinearSVC:

```text
decision_function
```

 тоже можно threshold tune на score.

Threshold выбирается по validation/OOF, не test.

---

## 24. Calibration LinearSVC

Если нужны probabilities:

```python
from sklearn.calibration import CalibratedClassifierCV
```

можно calibrate SVM scores с independent/OOF logic.

Это отдельная model-selection step.

---

## 25. Multiclass

Logistic Regression/LinearSVC naturally support multiclass strategies.

Metrics:

- macro F1;
- weighted F1;
- per-class precision/recall;
- confusion matrix.

При imbalanced intents macro F1 особенно полезна, потому что rare classes не исчезают за large common class.

---

## 26. Интерактивная визуализация

### Linear coefficients

Document sparse vector + weight per n-gram → sum score.

### SVM margin

2D toy sparse projection → margin.

### Naive Bayes

Term likelihood tables per class → log-score.

### Baseline race

На одном toy corpus compare:
- NB;
- Logistic;
- LinearSVC.

Показывать quality, train time, probability availability.

---

## 27. Типичные ошибки

**«Transformer всегда сильнее TF-IDF».**\
Не гарантировано, особенно на small/domain-specific data.

**«Linear model слишком простая для text».**\
High-dimensional representation уже очень expressive.

**«LinearSVC score = probability».**\
Нет.

**«Naive Bayes independence assumption реалистична».**\
Нет, но model может хорошо classify.

**«Random Forest — универсальный baseline для любого dataset».**\
Не для raw sparse text.

**«Top coefficient = causal word».**\
Нет.

---

## 28. Проверка понимания

1. Почему linear model сильна на TF-IDF?
2. Что делает C?
3. Logistic vs LinearSVC?
4. Почему SVC score не probability?
5. Что предполагает Naive Bayes?
6. Зачем smoothing?
7. Почему calculations в log-space?
8. Чем char features дополняют word?
9. Почему trees не natural first baseline?
10. Что смотреть в error analysis?

---

## 29. Мини-практика

Intent classification:

```text
100k messages
25 classes
largest class=30%
smallest=0.2%
```

Постройте experiment plan:

1. word TF-IDF + Logistic;
2. word+char + LinearSVC;
3. MultinomialNB/ComplementNB;
4. metrics;
5. split;
6. top-feature inspection;
7. criterion перехода к Transformer.

---

## Что нужно унести

1. TF-IDF + Logistic/LinearSVC — strong sparse baseline.
2. LinearSVC оптимизирует margin и не даёт probability native.
3. Logistic удобна для probabilities/threshold.
4. Naive Bayes использует class-specific term statistics.
5. Smoothing предотвращает zero probabilities.
6. Word+char TF-IDF часто очень competitive.
7. Transparent coefficients помогают leakage/debugging.
8. Deep NLP надо сравнивать с strong classical baseline.

## Куда дальше

Classical representation использует vocabulary features.

Modern NLP решает unknown words и vocabulary size иначе:

> текст разбивается на **subword tokens**.

Следующий урок подробно разберёт BPE, WordPiece, SentencePiece, special tokens, padding, truncation и attention masks.

## Источники
- scikit-learn Logistic Regression, LinearSVC and Naive Bayes documentation.
- scikit-learn text classification examples.
