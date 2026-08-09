---
title: Monitoring, data drift, concept drift and retraining
id: concept.mlops.monitoring-drift-retraining
schema_version: 2
type: concept
area: mlops
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [mlops/monitoring, mlops/drift]
---

# Monitoring, data drift, concept drift and retraining

## Что мониторить

Сервис может отвечать HTTP 200 и одновременно выдавать бесполезные predictions. Нужны четыре слоя: system health, data quality, prediction behavior и delayed model quality.

- system: latency, errors, throughput;
- data: missing rate, ranges, categories, schema failures;
- predictions: score distribution, decision rate, confidence;
- quality: precision/recall/calibration после появления labels.

Каждая metric привязана к model version, time window и segment. Aggregate без segment может скрыть деградацию нового региона.

## Data drift и concept drift

Data drift: изменилось `P(X)` — например, средний spend вырос. Concept drift: изменилось `P(y|X)` — тот же pattern поведения больше не означает churn. Data drift можно увидеть без labels; concept drift надёжно требует outcomes.

Population Stability Index для bins:

$$
PSI=\sum_i (p_i-q_i)\ln\frac{p_i}{q_i}.
$$

Если reference `[0.5, 0.5]`, current `[0.7, 0.3]`, PSI примерно `0.2·ln(1.4) + (-0.2)·ln(0.6) ≈ 0.169`. Threshold PSI — только сигнал расследования, не автоматический приговор модели.

Категориальные unseen values, missing spikes и schema mismatch часто важнее сложного statistical test. На больших sample даже маленькое несущественное отличие даст малый p-value, поэтому смотрят effect size и business impact.

## Logging

Prediction log содержит timestamp, request id, model version, schema version, score, decision и безопасные derived diagnostics. Позже label join связывает outcome по entity id с корректным observation window. Нельзя использовать outcome, который ещё не был доступен в момент решения.

Данные должны позволять воспроизвести aggregate metric, но не обязаны хранить raw PII. Для личного проекта SQLite/Parquet достаточно.

## Model quality monitoring

Labels приходят с задержкой. Для churn качество за август может стать известно только в сентябре. Поэтому dashboard показывает зрелость cohort и не сравнивает incomplete labels с complete reference.

Следите за PR-AUC/ROC-AUC, threshold metrics, calibration, segment performance и business outcome. Если decision rate изменился, разложите причину: входные данные, score distribution, threshold config или traffic mix.

## Retraining

Retraining запускается не по любому drift alert. Сначала диагностируют источник, проверяют data pipeline и оценивают expected gain на fresh validation. Новый candidate проходит тот же protocol и сравнение с champion.

```text
signal → investigate → curate data → train candidate → offline gate
      → shadow/smoke → activate → monitor → rollback if needed
```

Schedule-based retraining прост, но может переобучать без пользы. Trigger-based экономит ресурсы, но требует надёжных labels и thresholds. Для локального проекта разумна ручная команда после alert и отчёта.

## Типичные ошибки и self-check

- путать drift с падением качества;
- алертить по одному p-value;
- считать metric на незрелых labels;
- не versionировать threshold;
- retrain на corrupted pipeline;
- оценивать candidate на том же периоде, который использован для tuning;
- не иметь rollback artifact.

1. Может ли quality упасть без заметного data drift?
2. Почему prediction rate — полезный, но недостаточный сигнал?
3. Что такое label maturity?
4. Для credit scoring спроектируйте семь monitoring metrics, два сегмента и retraining gate.

## Связи

До: experiment tracking и serving. После: incident response, champion/challenger и controlled lifecycle.
