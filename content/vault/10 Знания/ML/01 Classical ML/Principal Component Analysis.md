---
title: Principal Component Analysis
id: concept.ml.principal-component-analysis
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
- PCA
- Метод главных компонент
tags:
- ml/classical
- ml/dimensionality-reduction
math_depth: 2
---


**Рекомендуемое время:** 50–65 минут.

## Результаты обучения
- применять Bayes theorem к классификации
- понимать conditional independence assumption
- различать Gaussian, Multinomial и Bernoulli NB
- объяснять smoothing и работу в log-space

## Вход в тему

Naive Bayes задаёт простой генеративный вопрос: насколько вероятны наблюдаемые признаки для каждого класса? Предположение о независимости часто неверно буквально, но алгоритм всё равно может хорошо ранжировать документы и служить сильным baseline.

## Полная теория

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

#### Gaussian NB

Для continuous feature:

$$
x_j\mid C_k\sim\mathcal N(\mu_{kj},\sigma_{kj}^2).
$$

Оцениваются mean/variance каждого feature внутри класса.

#### Multinomial NB

Для non-negative counts: token counts, частоты событий. Feature value влияет как число повторений.

#### Bernoulli NB

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

## Визуальная демонстрация

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

## Обязательная визуальная демонстрация

Документ с токенами → prior + likelihood каждого слова → log-score классов; slider smoothing.

## Практика

#### Задание 1. Bayes

Дано P(spam)=0.2, P(word|spam)=0.5, P(word|not spam)=0.1. Сравни posterior scores.

#### Задание 2. Smoothing

Почему unseen word без Laplace smoothing обнуляет likelihood?

#### Задание 3. Variant

Какой NB выбрать для word counts, binary indicators и continuous features?

#### Задание 4. Python lab

Сравни TF-IDF Logistic Regression и CountVectorizer+MultinomialNB.

## Разбор практики

**1.** Ненормированные scores: spam=0.1, not spam=0.08; posterior spam≈0.556.

**2.** Произведение содержит множитель 0; smoothing добавляет pseudo-count.

**3.** Multinomial, Bernoulli, Gaussian соответственно.

**4.** Оценивать на stratified split; NB может быть очень быстрым baseline, LR часто лучше при достаточных данных.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Что означает naive assumption?

- A. Features независимы вообще
- B. Features условно независимы при фиксированном классе
- C. Classes равновероятны
- D. Target отсутствует

**Правильный ответ:** B

**Объяснение:** Предположение делается conditional on class.

#### Checkpoint 2

**Вопрос:** Зачем log-space?

- A. Для визуального стиля
- B. Чтобы избежать underflow и заменить произведение суммой
- C. Для OHE
- D. Для scaling

**Правильный ответ:** B

**Объяснение:** Произведение малых вероятностей численно нестабильно.

#### Checkpoint 3

**Вопрос:** Laplace smoothing...

- A. убирает train
- B. даёт ненулевую вероятность unseen events
- C. выбирает threshold
- D. создаёт PCA

**Правильный ответ:** B

**Объяснение:** Pseudo-count предотвращает нулевой likelihood.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
