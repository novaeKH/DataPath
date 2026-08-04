---
title: ML — учебный маршрут
type: moc
area: ml
status: active
tags:
  - ml/navigation
  - learning/roadmap
rag: exclude
updated: 2026-08-02
id: moc.ml.ml-uchebnyi-marshrut
schema_version: 2
language: ru
app: exclude
---
# ML — учебный маршрут

[[ML — карта знаний|← Карта ML]] · [[Главная|На главную]]

> [!summary] Как пользоваться
> Это **не обязательный курс** и не рейтинг человека. Маршрут помогает выбрать
> следующий навык, а приложение адаптирует повторение по прозрачным попыткам.
> Можно открыть любую тему вне порядка и вернуться к prerequisites при пробеле.

## 1. Правильно поставить задачу

1. **Постановка ML-задачи** — [[ML Foundations#Постановка задачи|prediction contract]].
2. **Объект, target и момент прогноза** — [[01 - Паспорт задачи и честный split]].
3. **Baseline** — [[ML Foundations#Baseline|простая точка отсчёта]].

Результат этапа: вы можете до выбора модели объяснить, что предсказывается, когда,
по каким доступным данным и какое решение станет лучше.

## 2. Построить честную оценку

1. **Train / validation / test** — [[Validation Splits and Data Leakage]].
2. **Data leakage** — [[Validation Splits and Data Leakage#Leakage taxonomy|типы утечек]].
3. **Метрика и threshold** — [[ML Metrics and Threshold Selection]].

Результат этапа: offline-оценка имитирует production, а metric связана с ценой
ошибок и реальной пропускной способностью решения.

## 3. Понимать базовые модели

1. **Linear и Logistic Regression** — [[Linear Regression]] · [[Logistic Regression]].
2. **Bias, variance и regularization** — [[ML Foundations#Bias и variance]] · [[Regularization]].
3. **Tree ensembles** — [[Decision Trees]] · [[Bagging and Random Forest]] · [[Gradient Boosting]].

Результат этапа: вы не только называете алгоритм, но объясняете objective,
assumptions, поведение ошибок и причину выбора.

## 4. Диагностировать и улучшать

1. **Error analysis** — [[Regression_Error_Analysis|анализ OOF-ошибок]].
2. **Разрыв train/validation** — [[Диагностика — PR-AUC на train выше validation]].
3. **Один проверяемый эксперимент** — фиксируем baseline, split, metric и
   ожидаемый сигнал до запуска.

Результат этапа: следующее улучшение выбирается из наблюдаемой ошибки, а не из
случайного перебора моделей.

## Как приложение оценивает прогресс

Для каждого навыка отдельно показываются четыре грани:

- **Recall** — вспомнить определения;
- **Explain** — объяснить механизм и причинную связь;
- **Apply** — применить к новой постановке;
- **Diagnose** — найти неверное предположение или ошибку.

Одна ошибка не закрепляет «слабую сторону» навсегда. Каждая запись имеет источник,
уверенность и кнопку удаления. Обычный диалог с агентом не считается экзаменом.

## Происхождение маршрута

Структура — локальная карта, составленная по пересечению программ специалистов,
а не скопированная или выданная за единственно правильную. Проверено 2026-08-02:

- [Stanford CS229](https://cs229.stanford.edu/syllabus-new.html) — математические основы и классический ML;
- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) — прикладные основы, данные и generalization;
- [Machine Learning Specialization, DeepLearning.AI / Stanford Online](https://www.deeplearning.ai/specializations/machine-learning) — последовательный фундамент supervised ML;
- [fast.ai Practical Deep Learning](https://course.fast.ai/) — итеративная практика моделей;
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/course/2022/) — жизненный цикл ML-систем;
- [Made With ML](https://madewithml.com/courses/mlops/) — проектирование, тестирование и production ML.

> [!note] Граница версии 1
> Сейчас маршрут намеренно сфокусирован на core ML. SQL остаётся дополнительным
> разделом будущего обновления и не смешивается с оценкой ML-навыков.
