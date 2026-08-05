---
title: Naive Bayes
id: concept.ml.naive-bayes
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Наивный Байес
tags:
- ml/classical
- ml/probabilistic
math_depth: 2
---

# Naive Bayes

## Идея

Naive Bayes сравнивает вероятности классов после наблюдения признаков:

$$
P(C_k\mid x)
\propto
P(C_k)P(x\mid C_k).
$$

«Naive» assumption: признаки условно независимы при известном классе:

$$
P(x\mid C_k)=\prod_jP(x_j\mid C_k).
$$

Это редко буквально верно, но сильно упрощает оценку и часто хорошо работает на sparse text.

## Пошаговый пример

Пусть нужно определить spam. Prior:

$$
P(spam)=0.2,\quad P(not)=0.8.
$$

Слова `free` и `meeting` имеют разные conditional probabilities. Для письма модель складывает log-probabilities каждого слова с log prior и выбирает больший score.

Вычисления ведут в log-space:

$$
\log P(C_k\mid x)=const+\log P(C_k)+\sum_j\log P(x_j\mid C_k).
$$

Это предотвращает underflow произведения множества малых чисел.

## Варианты

### Gaussian NB

Для continuous feature:

$$
x_j\mid C_k\sim\mathcal N(\mu_{kj},\sigma_{kj}^2).
$$

Оцениваются mean/variance каждого feature внутри класса.

### Multinomial NB

Для non-negative counts: token counts, частоты событий. Feature value влияет как число повторений.

### Bernoulli NB

Для binary presence/absence. Отсутствие feature тоже входит в likelihood.

Выбор варианта зависит от representation.

## Smoothing

Невстречавшийся token без smoothing даёт zero likelihood. Additive smoothing:

$$
\widehat P(w_j\mid C_k)=\frac{N_{kj}+\alpha}{N_k+\alpha V}.
$$

$\alpha$ выбирается по validation. Большое значение сглаживает distributions сильнее.

## Почему работает

Для classification не обязательно точно оценить joint probability: достаточно правильного ordering class scores. Сильное assumption даёт high bias, но low variance и хорошую sample efficiency.

Проблема correlated features: одна и та же информация учитывается несколько раз, posterior становится overconfident.

## Priors и imbalance

Prior должен отражать ожидаемую prevalence. Если train искусственно сбалансирован, empirical prior не соответствует production. При prior shift score можно корректировать, но при изменении $p(x\mid y)$ простой correction не спасёт.

## Text pipeline

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ("vectorizer", TfidfVectorizer(ngram_range=(1, 2), min_df=2)),
    ("model", MultinomialNB(alpha=1.0)),
])
```

Vocabulary fit только на train fold. Multinomial NB требует non-negative features.

## Calibration

Naive Bayes probabilities часто overconfident из-за independence assumption. Используйте ranking/decision metrics и отдельно проверяйте calibration.

## Когда использовать

- текстовые задачи (spam detection, sentiment) с bag-of-words/TF-IDF;
- маленькие датасеты и высокоразмерные разреженные признаки;
- быстрый обучение/инференс и простота;
- НЕ использовать, когда признаки сильно зависимы и эта зависимость важна для решения, или когда нужны хорошо откалиброванные вероятности (обычно требуется calibration).

## Визуализация

Компонент `naive-bayes-evidence-lab`:

- prior slider;
- включение признаков;
- likelihood каждого класса;
- log-score decomposition;
- correlated duplicate feature toggle;
- posterior before/after evidence.

## Частые ошибки

- Multinomial NB после StandardScaler с negative values;
- vocabulary на полном dataset;
- считать posterior calibrated;
- дублировать correlated features;
- забыть prior после resampling;
- путать conditional independence с обычной independence;
- сравнивать probabilities разных variants без calibration.

## Связи

- [[Conditional Probability and Bayes Theorem]]
- [[Likelihood MLE and MAP]]
- [[Classical NLP Foundations]]
- [[Probability Calibration]]
