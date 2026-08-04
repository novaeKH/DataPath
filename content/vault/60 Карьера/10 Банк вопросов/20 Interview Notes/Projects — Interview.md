---
type: interview
area: career
status: active
tags: [interview, projects, storytelling]
title: "Projects — Interview"
id: interview.career.projects-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Projects — Interview

Проекты: [[RetailRec]], [[StoryWeaver]], [[Классификатор банковских обращений]]  
Банк вопросов: [[Вопросы к собеседованию#20 Projects]]

## Как рассказать о проекте за две минуты?

Контекст и decision → мой вклад → данные и честный split → baseline → модели и metric → численный результат → error analysis/ограничения → следующий эксперимент. Не перечислять технологии без причин.

## Как доказать личный вклад?

Разделить командный результат и собственные решения: «я сформулировал temporal protocol, реализовал baseline, сравнил модели, нашёл failure mode». Быть готовым открыть детали одного решения, альтернативы и trade-off.

## Почему именно такая метрика?

Связать её с use case и ошибками, назвать альтернативы и ограничения. Для multi-class intents — macro F1, чтобы редкие классы не исчезли; для top-K recommendations — NDCG/Recall/HitRate и coverage; для LM — loss/perplexity плюс human/downstream evaluation.

## Как объяснить выбор baseline?

Baseline должен быть дешёвым, воспроизводимым и сильным для modality. Popularity для recsys, TF-IDF+LogReg для text classification, simple n-gram/small model для LM. Он показывает добавочную стоимость сложной модели и ловит ошибки эксперимента.

## Как отвечать «что не получилось»?

Назвать конкретную гипотезу, результат, диагностику и изменение решения. Например, ALS/hybrid уступили Item-KNN при текущем temporal protocol; это не «плохая библиотека», а сигнал проверить sparsity, weighting, tuning и candidate construction.

## Как отвечать «что бы вы улучшили»?

Выбрать один high-impact следующий шаг, а не список модных методов. Для RetailRec — user/session segmentation и online test; для Banking77 — error clusters, hard negatives и domain adaptation; для StoryWeaver — завершить обучение, validation perplexity, generation rubric и safety.

## RetailRec — постановка и данные

Персональная top-10 рекомендация по 2,76 млн implicit events и каталогу 21 820 items. Split временной: последние 14 дней holdout; это защищает от использования будущих interactions.

## RetailRec — результат и вывод

Binary Item-KNN: `NDCG@10=0,0456`, `Recall@10=0,0736`, `HitRate@10=0,0969`, `Coverage@10=0,4506`; popularity `NDCG@10=0,0033`. Item-KNN лучший в данном offline protocol, но абсолютное качество и online impact ещё требуют проверки. Детали: [[RetailRec]].

## RetailRec — почему не случайный split?

Random split позволяет будущим interactions влиять на profiles/similarity и не повторяет production. Temporal cutoff проверяет рекомендацию будущего на истории до cutoff.

## StoryWeaver — архитектура

Decoder-only Transformer на 125,86 млн параметров: 18 blocks, 768 hidden, 12 Q/4 KV heads, FFN 2048, context 512, vocab 16 384. Grouped-query attention уменьшает KV-cache; causal objective предсказывает next token.

## StoryWeaver — обучение

Corpus 626 млн tokens; microbatch 1 и gradient accumulation 64, FP16, activation checkpointing, AdamW, warmup/cosine. Train loss 9,7157 → 3,0591 к step 310, но пройдено 1,62% epoch — это ранний сигнал, не финальная оценка. Детали: [[StoryWeaver]].

## StoryWeaver — production и ограничения

Inference через FastAPI и KV-cache. Основные ограничения: незавершённое обучение, context 512, нет достаточной human evaluation и safety/latency benchmark. На собеседовании их нужно назвать до обещаний качества.

## Banking77 — постановка и protocol

Мультиклассовая классификация 77 банковских intents: 7 997 train, 2 000 validation, 3 080 test; шесть exact overlaps удалены из train. Primary metric — macro F1 из-за различий по классам.

## Banking77 — сравнение моделей

TF-IDF+LogReg 0,8613 macro F1; scratch Transformer 0,8241; DistilBERT 0,8818. Сильный sparse baseline победил модель с нуля, а pretrained language representation дала лучший результат. Детали: [[Классификатор банковских обращений]].

## Banking77 — error analysis

Смотреть confusion pairs близких intents, поддержку классов, короткие/неоднозначные запросы и confidence/calibration. Следующий шаг — hard examples, domain data, threshold/reject option и monitoring drift по intents.

## Какие риски production вы назовёте?

Data/label drift, skew training-serving, latency/cost, отсутствие fallback, некалиброванные probabilities, деградация по сегментам, privacy и monitoring. Для каждого проекта связываю риск с измеримым guardrail и rollback.

## Follow-up цепочка защиты проекта

Почему эта задача → почему такой split → какой baseline → почему metric → какой личный вклад → главный численный результат → где модель ошибается → что не сработало → как serving устроен → какой следующий эксперимент и business test?

