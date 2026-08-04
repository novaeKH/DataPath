---
type: project
area: ml
status: active
tags: [project, recommender-systems, retailrec, interview]
title: "RetailRec"
id: project.ml.retailrec
schema_version: 2
language: ru
rag: include
rag_collection: projects
app: source
---
# RetailRec

> [!summary] За 30 секунд
> Персональная Top-10 рекомендательная система на 2.76 млн событиях RetailRocket. Сравнены Popularity, Item-KNN, ALS и hybrid на 14-дневном temporal holdout. Лучший binary Item-KNN получил NDCG@10 0.0456 против 0.0033 у Popularity. Это улучшение offline ranking, а не доказанный рост продаж.

Интервью: [[Projects — Interview#RetailRec — постановка и данные]]

## Постановка

По прошлым `view/addtocart/transaction` сформировать десять новых для пользователя товаров. Отсутствие события — unknown, а не dislike.

## Валидация

- cutoff: 2015-09-04;
- train — прошлое, validation — следующие 14 дней;
- model catalog: 21 820 товаров с минимум 20 пользователями в train;
- ground truth: новые для пользователя товары validation внутри каталога;
- фиксированная выборка 2 600 пользователей по short-history сегментам.

## Модели

- Popularity fallback.
- Binary и weighted Item-Item KNN по cosine.
- Implicit ALS, 32 factors.
- Reciprocal-rank hybrid.

Binary KNN оказался лучше weighted: эвристические веса `1/3/5` усиливали шум, а evaluation target был бинарным.

## Результаты

| Модель/метрика | Значение |
|---|---:|
| Item-KNN NDCG@10 | 0.0456 |
| Popularity NDCG@10 | 0.0033 |
| Recall@10 | 0.0736 |
| HitRate@10 | 0.0969 |
| Coverage@10 | 0.4506 |

Хотя бы одно попадание было у 252 из 2 600 пользователей. Во всех списках встретилось 9 832 из 21 820 товаров.

## Почему KNN мог победить ALS

- экстремальная sparsity;
- короткие истории;
- локальные co-occurrence сильнее глобальных factors;
- фильтрация редких товаров стабилизировала neighbours;
- tuning ALS был ограничен.

Вывод относится к этому holdout и конфигурациям, а не ко всем recommender systems.

## Ограничения

- один temporal window;
- evaluation на отфильтрованном каталоге;
- любое будущее событие одинаково relevant;
- нет item cold-start;
- нет online A/B-test.

## Связи

- [[Recommendation Systems]]
- [[Recommendation Systems — Interview]]
- [[ML Metrics and Threshold Selection]]
- [[Validation Splits and Data Leakage]]
