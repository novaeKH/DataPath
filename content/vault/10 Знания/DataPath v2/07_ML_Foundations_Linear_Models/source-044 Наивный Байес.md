---
title: "Наивный Байес"
id: concept.datapath-v2.044
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 44
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Наивный Байес: простая вероятностная модель, которая иногда удивительно сильна

Метод k ближайших соседей почти ничего не предполагал о распределении данных: хранил train objects и искал похожие.

Наивный Байес (Naive Bayes) делает почти противоположное: строит явную вероятностную модель классов и признаков.

В основе — формула Байеса:

\[
P(y|x)=\frac{P(x|y)P(y)}{P(x)}.
\]

Но главное слово в названии — **наивный**. Алгоритм предполагает, что признаки условно независимы друг от друга при известном классе.

В реальных данных это почти никогда не верно буквально. И всё же модель часто работает очень хорошо, особенно в задачах текста.

## 1. Начнём со spam filter

Нужно классифицировать письмо:

```text
spam / not spam
```

В письме встречаются слова:

```text
free
money
meeting
project
```

Интуиция:

```text
слово "free" чаще встречается в spam
слово "meeting" чаще встречается в normal mail
```

Мы хотим оценить:

\[
P(spam|words).
\]

То есть вероятность класса после того, как увидели признаки.

## 2. Формула Байеса

Для класса `y` и признаков `x`:

\[
P(y|x)=\frac{P(x|y)P(y)}{P(x)}.
\]

Компоненты:

### Prior

\[
P(y)
\]

наша базовая вероятность класса до признаков.

Если 20% писем — spam:

```text
P(spam)=0.2
```

### Likelihood

\[
P(x|y)
\]

насколько вероятны наблюдаемые признаки внутри класса.

### Posterior

\[
P(y|x)
\]

вероятность класса после наблюдения признаков.

## 3. Почему denominator можно не считать при выборе класса

Для одного конкретного объекта `x`:

\[
P(x)
\]

одинаково для всех candidate classes.

Поэтому для classification достаточно сравнить:

\[
P(y)P(x|y).
\]

И выбрать class с максимальным posterior score.

## 4. Наивное предположение независимости

Если features:

\[
x_1,x_2,\dots,x_d,
\]

полный likelihood:

\[
P(x_1,\dots,x_d|y)
\]

оценить сложно.

Naive Bayes предполагает условную независимость:

\[
P(x_1,\dots,x_d|y)
=\prod_jP(x_j|y).
\]

Тогда:

\[
P(y|x)\propto P(y)\prod_jP(x_j|y).
\]

Это резко упрощает обучение.

## 5. Что значит «условно независимы»

Не просто:

```text
features независимы
```

а:

> если класс уже известен, знание одного feature не меняет distribution другого.

Например в spam assumption говорит условно:

```text
если мы уже знаем, что письмо spam,
наличие "free" не должно сообщать дополнительную информацию
о вероятности слова "money"
```

Очевидно, слова связаны. Поэтому assumption «наивное».

## 6. Маленький пример руками

Пусть:

```text
P(spam)=0.4
P(normal)=0.6
```

Для слова `free`:

```text
P(free|spam)=0.8
P(free|normal)=0.1
```

Для `meeting`:

```text
P(meeting|spam)=0.1
P(meeting|normal)=0.6
```

Новое письмо содержит `free`, но не рассматриваем остальные признаки для простоты.

Spam score:

```text
0.4 × 0.8 = 0.32
```

Normal score:

```text
0.6 × 0.1 = 0.06
```

Spam выигрывает.

Если добавить много features, scores перемножаются.

## 7. Почему считаем log-probabilities

Произведение сотен маленьких вероятностей быстро становится числом, близким к нулю:

```text
0.001 × 0.02 × 0.004 × ...
```

Это численно неудобно.

Используем логарифм:

\[
\log\left(P(y)\prod_jP(x_j|y)\right)
=
\log P(y)+\sum_j\log P(x_j|y).
\]

Теперь вместо multiplication — сумма log-probabilities.

Поскольку logarithm монотонен, класс с максимальным score не меняется.

## 8. Разные Naive Bayes — разные likelihood assumptions

Все варианты используют Bayes + conditional independence, но по-разному моделируют:

\[
P(x_j|y).
\]

### GaussianNB

Для continuous features предполагает Gaussian distribution внутри каждого класса:

\[
P(x_j|y)=\mathcal N(\mu_{jy},\sigma^2_{jy}).
\]

Модель оценивает mean и variance каждого feature для каждого class.

Подходит для continuous numerical features, если Gaussian approximation разумна.

### MultinomialNB

Классический вариант для count-like non-negative features, особенно text word counts.

Для каждого класса оценивается относительная частота features/tokens.

Scikit-learn отмечает, что TF-IDF vectors также нередко работают хорошо на практике, хотя probabilistic derivation ближе к counts.

### BernoulliNB

Features — binary indicators:

```text
слово встретилось / нет
```

Учитывает presence/absence.

### CategoricalNB

Используется для дискретных categorical features, представленных корректными category codes по каждому feature.

## 9. Zero-frequency problem

Представим слово `crypto`, которое ни разу не встретилось в spam train sample.

Наивная оценка:

```text
P(crypto|spam)=0
```

Тогда всё произведение spam score становится нулём.

Один unseen feature полностью уничтожает класс.

Используют smoothing.

Для MultinomialNB:

\[
\hat\theta_{yi}
=
\frac{N_{yi}+\alpha}{N_y+\alpha n}.
\]

При `alpha=1` это Laplace smoothing.

Мы добавляем небольшую псевдочастоту и предотвращаем zero probability.

## 10. Что делает `fit()` у MultinomialNB

Концептуально:

```text
посчитать class frequencies
→ оценить P(class)
→ для каждого class посчитать feature counts
→ применить smoothing
→ получить log P(feature|class)
```

Это очень быстро по сравнению со многими iterative optimizers.

Нет gradient descent по миллионам steps.

## 11. Почему модель работает, если independence false

Для правильной классификации необязательно идеально восстановить joint probability distribution.

Нужно, чтобы итоговые class scores часто упорядочивались правильно.

Даже при нарушенных assumptions отдельные evidence terms способны дать хорошую boundary.

Особенно в high-dimensional sparse text features множество weak word signals хорошо суммируется.

Но нарушение independence имеет цену: probability estimates часто оказываются слишком уверенными и не должны автоматически трактоваться как идеально calibrated probabilities.

Scikit-learn прямо отмечает, что Naive Bayes может быть хорошим classifier, но плохим probability estimator.

## 12. Text classification

Pipeline:

```text
text
→ CountVectorizer / TF-IDF
→ MultinomialNB / ComplementNB
→ class
```

Например:

```python
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

model = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2)),
    MultinomialNB(alpha=1.0),
)

model.fit(text_train, y_train)
```

Preprocessing должен быть внутри Pipeline/CV, чтобы vocabulary/IDF не обучались на validation data.

## 13. ComplementNB

Для текстовой классификации, особенно при дисбалансе, существует `ComplementNB`.

Идея — оценивать weights, используя статистику complement классов, чтобы уменьшить некоторые проблемы MultinomialNB.

Не нужно считать его автоматически лучше. Это отдельный candidate, сравниваемый на той же CV.

## 14. Scaling

GaussianNB не требует StandardScaler по той же причине, что kNN: нет — это неправильная аналогия. Тут важно другое.

Gaussian likelihood отдельно оценивает mean/variance feature в class, поэтому линейный rescaling feature может быть учтён distribution parameters.

MultinomialNB, наоборот, требует non-negative feature representation, соответствующую его смыслу. После `StandardScaler` могут появиться negative values, и это уже несовместимо с MultinomialNB.

Следовательно, preprocessing определяется variant модели.

## 15. Priors

Если dataset сильно несбалансирован:

```text
P(class=1)=0.01
```

prior уже склоняет prediction к majority class.

Можно оценивать priors из data или задавать, если domain knowledge действительно требует другого prior.

Но artificially менять prior — не замена корректной metric и threshold analysis.

## 16. Naive Bayes vs Logistic Regression

Обе модели часто сильны на text, но различаются философией.

### Logistic Regression

Дискриминативно моделирует boundary / conditional probability через linear score.

### Naive Bayes

Моделирует class prior и feature likelihoods, затем применяет Bayes rule.

Упрощённо:

```text
Logistic: P(y|x) напрямую
Naive Bayes: P(x|y) и P(y) → P(y|x)
```

На маленьких sparse datasets NB иногда удивительно силён. На больших данных regularized Logistic Regression часто превосходит его, особенно когда independence assumption слишком грубое.

## 17. Сложность и скорость

Naive Bayes очень быстрый:

- обучение сводится к count/statistics estimation;
- prediction — сумма log-likelihood contributions;
- хорошо работает с high-dimensional sparse matrices.

Это делает его прекрасным baseline для document classification.

Некоторые sklearn Naive Bayes estimators поддерживают `partial_fit`, что позволяет incremental/out-of-core learning.

## 18. Типичные ошибки

**«Naive Bayes предполагает, что признаки вообще независимы».**\
Точнее: conditionally independent given class.

**«Вероятности из predict_proba всегда calibrated».**\
Нет, NB часто overly confident.

**«MultinomialNB подходит к любым числовым features».**\
Нет, он рассчитан на non-negative count-like representation.

**«Если feature никогда не встретился, класс навсегда impossible».**\
Smoothing решает zero-frequency problem.

**«TF-IDF теоретически идентичен word counts».**\
Нет, но с MultinomialNB часто работает практически.

**«Нарушение independence делает NB всегда бесполезным».**\
Нет, classification может оставаться сильной.

## 19. Интерактивная визуализация

### Режим 1: Bayes update

Показывать prior spam/normal и likelihood слова `free`.

Пользователь меняет значения и видит posterior.

### Режим 2: несколько words

Добавлять tokens по одному:

```text
free
meeting
money
```

показывать, как складываются log-probabilities каждого класса.

### Режим 3: smoothing

Token unseen in one class.

При `alpha=0` score class рушится к zero probability; при `alpha>0` остаётся finite.

## 20. Проверка понимания

1. Что означает prior?
2. Что означает likelihood?
3. Чем posterior отличается от них?
4. В чём именно «наивное» assumption?
5. Почему denominator можно не учитывать при argmax class?
6. Зачем log-probabilities?
7. Что решает Laplace smoothing?
8. Чем GaussianNB отличается от MultinomialNB?
9. Почему probabilities NB могут быть плохо calibrated?
10. Почему NB особенно удобен для sparse text?
11. Чем NB философски отличается от Logistic Regression?

## 21. Мини-практика

Дано:

```text
P(spam)=0.3
P(normal)=0.7

P(free|spam)=0.8
P(free|normal)=0.05

P(meeting|spam)=0.1
P(meeting|normal)=0.6
```

Письмо содержит `free` и `meeting`.

При naive independence:

1. посчитайте unnormalized spam score;
2. normal score;
3. какой class победит;
4. почему сама величина score ещё не нормализованная posterior probability;
5. что произойдёт, если `P(meeting|spam)=0` без smoothing?

## Что нужно унести

1. Naive Bayes строится на Bayes theorem.
2. Ключевое assumption — conditional independence features given class.
3. Prediction сравнивает prior × feature likelihoods.
4. На практике используются log-probabilities.
5. Smoothing предотвращает zero-frequency collapse.
6. Gaussian/Multinomial/Bernoulli NB отличаются feature likelihood models.
7. NB очень быстрый и силён как sparse-text baseline.
8. Хорошая classification не означает хорошие calibrated probabilities.

## Куда дальше

Мы увидели linear probabilistic model и simple generative model.

Следующая идея совсем иная:

> **Искать не просто разделяющую гиперплоскость, а такую, которая проходит с максимально широким зазором между классами.**

Так возникает метод опорных векторов (Support Vector Machine, SVM).

### Источники

- scikit-learn User Guide — Naive Bayes.
- Stanford CS229 — generative learning algorithms и Bayes rule.
