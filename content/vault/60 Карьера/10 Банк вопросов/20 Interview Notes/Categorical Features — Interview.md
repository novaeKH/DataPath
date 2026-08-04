---
type: interview
area: career
status: active
tags: [interview, categorical-features, encoding]
title: "Categorical Features — Interview"
id: interview.career.categorical-features-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Categorical Features — Interview

Полная теория: [[Categorical Features]]  
Банк вопросов: [[Вопросы к собеседованию#08 Categorical Features]]

## Какие способы обработки категориальных признаков вы знаете?

OHE для низкой cardinality и линейных моделей; ordinal encoding при реальном порядке; frequency/count encoding без target; target encoding только fold-safe со smoothing; hashing при огромном или потоковом словаре; native handling CatBoost/LightGBM. Выбор зависит от model semantics, cardinality, unseen categories и риска leakage.

## Когда использовать One-Hot Encoding?

Когда cardinality умеренная, порядок категорий отсутствует и downstream model хорошо работает со sparse features — особенно linear/logistic regression. OHE интерпретируем и не навязывает расстояния. При high cardinality размерность, редкость коэффициентов и production mapping становятся проблемой.

## Какие проблемы возникают у OHE?

Число столбцов растёт, редкие категории плохо оцениваются, unseen values требуют fallback, а обычному дереву трудно одним split объединить полезную группу категорий. Для почти уникальных ID OHE способствует запоминанию. Можно объединять редкие значения, ставить `min_frequency` или выбирать native/high-cardinality encoding.

## Что делать с high-cardinality категориями?

Сначала проверить, не ID ли это и стабильна ли категория. Затем варианты: rare bucket/иерархия, frequency encoding, hashing, OOF target encoding со smoothing, CatBoost/LightGBM native handling или content embeddings. Решение проверяется на честной CV и по unseen rate/latency.

## Почему Label Encoding может быть опасен?

Он назначает nominal categories произвольные числа. Linear model увидит монотонный эффект, обычное дерево — splits `code <= threshold`, будто Moscow, Kazan и Omsk упорядочены. Integer code безопасен как identifier только если конкретная модель явно знает, что feature categorical.

## Когда Ordinal Encoding корректен?

Когда порядок существует в предметной области: `low < medium < high`, уровень образования или грейд. Но даже тогда расстояния между кодами не обязательно равны, что важно для линейной модели. Для города или бренда ordinal encoding создаёт выдуманную структуру.

## Что такое Frequency Encoding?

Категория заменяется count или долей её появления в train. Это один компактный числовой столбец, не использующий target, поэтому подходит высокой cardinality. Но категории одинаковой частоты становятся неразличимы, а частоты могут дрейфовать. Mapping строится только на train, unseen получает 0/prior.

## Что такое Target Encoding?

Категория заменяется статистикой target, например средним `E[y|category]`. Это сильный supervised signal, особенно для high cardinality, но наивный расчёт использует собственные labels и переобучается на редких категориях. Нужны OOF/time-aware computation, smoothing и корректный inference mapping.

## Почему Target Encoding приводит к leakage?

Feature строки частично рассчитывается из её собственного target. Для категории с одним объектом encoding равен label. Модель видит подсказку, которой не будет на inference. Smoothing уменьшает variance, но не устраняет факт использования своего target; нужна OOF/ordered схема.

## Как сделать Target Encoding без утечки?

Для каждой train-строки считать statistic по другим folds, а validation/test кодировать mapping, построенным только на доступном train. При временных данных folds должны идти по времени, при группах — не смешивать entity. Добавить prior/smoothing и fallback для unseen.

## Что такое out-of-fold Target Encoding?

Train делится на folds. Для holdout fold category means считаются по остальным folds и применяются к holdout; части собираются в OOF feature. После этого mapping для внешнего validation/test строится по всему train. Так строка не использует собственный target.

## Что делать с неизвестными категориями на test или inference?

Заранее определить `unknown` bucket или prior: all-zero OHE, global frequency/target prior, hashing bucket или native fallback. Сохранять один mapping с pipeline и мониторить unseen rate. Резкий рост новых категорий — возможный drift или ошибка нормализации.

## Нужно ли One-Hot Encoding для деревьев?

Не всегда. Обычному дереву без native categorical support нужен encoding; OHE безопасен относительно порядка, но неэффективен при высокой cardinality. CatBoost/LightGBM лучше получают исходные categories в специальном режиме. Integer encoding без этого режима создаёт произвольные threshold groups.

## Почему дерево с integer-encoded категориями может построить странный split?

Потому что оно считает коды числовыми и проверяет условие вроде `code <= 4.5`. Слева окажутся категории с номерами 0–4, хотя их объединение не имеет бизнес-смысла и изменится при другом mapping. Это искусственный порядок.

## Как CatBoost работает с категориями?

Он строит сглаженные target/count statistics, но ordered-способом: для объекта используются предыдущие строки permutation, без собственного target. Может строить combinations категорий. Поэтому обычно исходные categorical columns передают напрямую, а не делают внешний OHE/Target Encoding.

## Почему CatBoost не использует обычный Target Encoding?

Обычный mean target включает label самой строки и даёт leakage, особенно для редких categories. Ordered statistics имитируют online history: объект видит только прошлые наблюдения и prior. Это снижает optimistic train signal и prediction shift.

## Что такое ordered target statistics?

Для строки в случайной permutation statistic категории считается по предыдущим строкам той же category плюс prior. Первая встреча получает prior, последующие — постепенно обновлённую estimate. Собственный и будущие targets не участвуют, поэтому feature ближе к inference.

## Что такое CTR в CatBoost?

Это внутреннее название category target/count statistics, а не обязательно click-through rate. CTR feature может быть сглаженной долей target, count или statistic комбинации категорий. Он становится числовым входом для splits.

## Как LightGBM работает с categorical features?

При корректной categorical отметке LightGBM может искать оптимальные группы categories для split на основе gradient statistics, а не использовать код как непрерывную величину. Это компактнее OHE. В отличие от CatBoost, основной механизм не ordered target statistics/ordered boosting.

## Чем обработка категорий LightGBM отличается от CatBoost?

LightGBM оптимизирует categorical partitions непосредственно при split дерева и делает упор на histogram/leaf-wise training. CatBoost строит ordered statistics и отдельно борется с prediction shift через ordered boosting; обычно использует symmetric trees. Оба поддерживают categories, но алгоритмически это разные подходы.

## Что такое hashing?

Hashing отправляет category в один из фиксированного числа buckets. Словарь не растёт, unseen обрабатывается автоматически, поэтому метод полезен для streaming/high cardinality. Цена — collisions и слабая интерпретируемость; число buckets задаёт trade-off памяти и конфликтов.

## Follow-up цепочка по Target Encoding

1. Что такое Target Encoding?  
2. Где leakage?  
3. Почему smoothing недостаточно?  
4. Как работает OOF?  
5. Что меняется для time data?  
6. Как CatBoost решает похожую проблему?

См. также: [[Gradient Boosting — Interview]] · [[Validation and Metrics — Interview]]
