---
type: interview
area: career
status: active
tags: [interview, recommender-systems]
title: "Recommendation Systems — Interview"
id: interview.career.recommendation-systems-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Recommendation Systems — Interview

Полная теория: [[Recommendation Systems]]  
Банк вопросов: [[Вопросы к собеседованию#11 Recommendation Systems]]

## Что такое рекомендательная система?

Это система ранжирования доступных items для конкретного user/context. Обычно есть candidate generation, scoring/ranking и post-processing с ограничениями разнообразия, свежести и бизнеса. Нужно определить событие успеха и момент рекомендации.

## Collaborative vs content-based

Collaborative использует паттерны взаимодействий user–item и может находить скрытую схожесть без метаданных, но страдает от cold start. Content-based сопоставляет признаки пользователя и товара, легче объясняется и работает с новыми items, но ограничен качеством контента. Практически их часто гибридизируют.

## User-based vs Item-based KNN

User-KNN ищет похожих пользователей и агрегирует их items; при большом динамичном user space он менее стабилен. Item-KNN рекомендует items, похожие на уже потреблённые, обычно проще кэшируется и устойчивее. Similarity считают по binary/weighted interactions, контролируя popularity.

## Что такое implicit feedback?

События просмотра, клика, корзины или покупки показывают положительный сигнал разной силы, но отсутствие события не равно dislike. Нужны weights/confidence, negative sampling или pairwise objectives; экспозиционная предвзятость означает, что видим реакцию только на показанное.

## Почему view, cart и purchase нельзя считать одинаковыми?

У них разная сила intent и частота; одинаковый вес делает многочисленные views доминирующими и теряет purchase signal. Используют event weights, confidence, sequence/time decay и проверяют их в temporal validation. Вес — гиперпараметр, а не универсальная истина.

## Зачем popularity baseline?

Он дешёвый, сильный для новых пользователей и проверяет, что персонализация действительно добавляет ценность. Его считают past-only, возможно по сегменту/времени. Без него сложная модель может лишь воспроизводить популярность.

## Как работает Item-KNN?

Строится item–user interaction matrix, вычисляется similarity между items, а score кандидата — взвешенная сумма сходств с историей пользователя. Нужно ограничить соседей, убрать просмотренные items, нормировать popularity и не строить similarity на будущем.

## Что такое matrix factorization и ALS?

Interaction matrix приближается произведением низкоразмерных user/item embeddings. ALS попеременно фиксирует одну матрицу и решает least-squares для другой; implicit ALS использует confidence для наблюдаемых и ненаблюдаемых пар. Модель компактна, но cold-start entities не имеют обученных factors.

## Как решать cold start?

Для нового user — popularity, onboarding, contextual/session features. Для нового item — content embeddings, metadata и exploration. В гибриде collaborative score смешивают с content/popularity, а качество отдельно измеряют на cold/warm сегментах.

## Как валидировать рекомендации?

Temporal leave-last-k или cutoff: train содержит только прошлое, validation/test — будущие взаимодействия. Random split течёт через будущую историю. Candidate set и правило исключения seen items должны повторять serving.

## Recall@K, HitRate@K и NDCG@K

Recall@K — доля релевантных items, попавших в top K. HitRate@K — был ли хотя бы один hit. NDCG@K учитывает позицию и несколько релевантных items через discount, поэтому лучше различает порядок. Все зависят от candidate protocol.

## Что такое Precision@K?

Доля top-K recommendations, оказавшихся релевантными. В implicit offline data он занижен, потому что ненаблюдаемый item мог понравиться, но не был показан. При одном held-out item maximum Precision@K равен `1/K`, поэтому его нужно интерпретировать вместе с protocol.

## Что такое coverage и diversity?

Coverage показывает, какую долю каталога или пользователей система реально обслуживает. Diversity измеряет различие items внутри выдачи; novelty — насколько рекомендации непопулярны/неочевидны. Эти guardrails защищают от списка одних хитов.

## Offline vs online evaluation

Offline быстро сравнивает модели на фиксированном протоколе, но наследует exposure bias и не измеряет причинный эффект. Online A/B оценивает CTR, conversion, revenue/retention и guardrails. Хорошая offline metric не гарантирует продуктовый выигрыш.

## Как защищать RetailRec?

На 2,76 млн событий использован temporal holdout 14 дней и каталог 21 820 items. Binary Item-KNN дал лучший `NDCG@10=0,0456`, `Recall@10=0,0736`, `HitRate@10=0,0969`, `Coverage@10=0,4506`; popularity имел `NDCG@10=0,0033`. Вывод: простой neighborhood signal оказался сильнее ALS/hybrid при данном protocol, но перед production нужны сегменты, latency и online test. См. [[RetailRec]].

## Как сделать temporal holdout в RecSys?

Выбрать global cutoff или leave-last-k per user, обучить profiles/similarity только на событиях до cutoff, а будущие события оставить как relevance. Исключение seen items и candidate set фиксируются заранее; пользователи без достаточной истории обрабатываются отдельным cold-start protocol.

## Follow-up цепочка по RecSys

Что рекомендуем → какое событие считаем релевантным → как формируем negatives/candidates → как делим время → какие baseline → почему эта метрика@K → что делаем с seen items/cold start → какие latency и business constraints → как проверим online?
