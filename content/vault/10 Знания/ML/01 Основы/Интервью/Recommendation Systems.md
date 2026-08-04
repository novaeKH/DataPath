---
type: concept
area: recsys
status: active
tags: [ml, recommender-systems, ranking, retailrec, interview]
aliases:
  - Рекомендательные системы
title: "Recommendation Systems"
id: concept.recsys.recommendation-systems
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Recommendation Systems

Быстрое повторение: [[Recommendation Systems — Interview]]

## 1. Постановка

Рекомендательная система формирует упорядоченный список кандидатов для пользователя. В production обычно есть стадии:

```text
candidate generation
→ scoring/ranking
→ business rules
→ final Top-K
```

## 2. Collaborative vs content-based

- Collaborative использует взаимодействия user–item и находит похожих пользователей/товары или latent factors.
- Content-based использует признаки товара/пользователя: текст, категорию, бренд, цену, embeddings.

Collaborative хорошо ловит коллективное поведение, но страдает от cold start. Content-based работает для нового товара с описанием, но может сужать выдачу к уже известным интересам.

Hybrid объединяет источники, но не обязан быть лучше сильнейшего компонента.

## 3. User-based vs Item-based KNN

User-KNN ищет похожих пользователей. Item-KNN — похожие товары по аудитории.

Item-based часто устойчивее в e-commerce:

- пользователей больше и их вкусы меняются;
- item-item neighbours можно пересчитывать batch;
- объяснение «похож на просмотренный товар» понятно;
- короткая история пользователя всё же даёт item seeds.

## 4. Implicit feedback

View/cart/purchase — положительные сигналы разной силы, но отсутствие события не означает dislike: товар могли не показать.

Нельзя автоматически ставить веса `1/3/5` и считать их правильными. В RetailRec бинарная схема оказалась лучше weighted, потому что weights были эвристикой, а evaluation target — бинарным.

## 5. Popularity baseline

Рекомендует популярные unseen items. Это сильная дешёвая точка отсчёта и fallback для пользователя без истории.

Варианты:

- events count;
- unique users;
- time-decayed popularity;
- category/segment popularity.

## 6. Item-KNN

Товар — вектор пользователей. Cosine:

$$
\operatorname{sim}(i,j)
=\frac{x_i\cdot x_j}{\|x_i\|\|x_j\|}
$$

Для пользователя candidates получают сумму similarities от товаров его истории. Уже виденные items исключаются, затем выбирается Top-K.

Scaling не нужен: это sparse implicit matrix, а cosine нормирует длины.

## 7. Matrix factorization / ALS

$$
\hat r_{ui}=p_u^Tq_i
$$

ALS поочерёдно оптимизирует user и item factors, фиксируя другую сторону. Для implicit feedback наблюдения трактуются как preference с confidence.

Факторизация ловит глобальную низкоранговую структуру, но может проигрывать локальным co-occurrence при экстремальной sparsity и коротких историях.

## 8. Cold start

- Новый пользователь: popularity/context/onboarding.
- Короткая история: item-based/content.
- Новый товар: content features, exploration, правила.

Нельзя называть пользователя с 1–2 событиями true cold start; это short-history.

## 9. Temporal validation

Random split событий создаёт leakage. Train должен быть раньше validation. Ground truth — будущие interactions после cutoff.

Нужно решить:

- повторные или только новые товары;
- горизонт;
- каталог кандидатов;
- пользователи, пригодные для оценки;
- rolling windows.

## 10. Метрики

- `Precision@K`: доля попаданий в показанном списке.
- `Recall@K`: доля релевантных items, найденных в Top-K.
- `HitRate@K`: есть ли хотя бы одно попадание.
- `NDCG@K`: учитывает позиции.
- `Coverage@K`: доля каталога в выдачах.
- Diversity/novelty: разнообразие и неочевидность.

Метрика должна соответствовать интерфейсу. NDCG полезна, когда верх списка важнее.

## 11. Offline vs online

Offline NDCG не доказывает рост выручки. Online:

- CTR;
- add-to-cart;
- conversion;
- revenue/margin per user;
- guardrails: bounce, latency, cancellations, diversity.

## 12. RetailRec как пример

- 2.76 млн событий RetailRocket;
- temporal holdout 14 дней;
- model catalog 21 820 items с минимум 20 users в train;
- сравнение Popularity, binary/weighted Item-KNN, ALS, hybrid;
- binary Item-KNN: NDCG@10 0.0456, Recall@10 0.0736, HitRate@10 0.0969, Coverage@10 0.4506;
- Popularity NDCG@10 0.0033;
- вывод: improvement относится к offline NDCG выбранного holdout, не к продажам.

## Связи

- [[Recommendation Systems — Interview|Быстрое повторение]]
- [[RetailRec]]
- [[ML Metrics and Threshold Selection]]
- [[Validation Splits and Data Leakage]]

