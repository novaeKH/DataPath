---
title: "Retraining pipeline, champion/challenger и безопасное обновление модели"
id: concept.datapath-v2.099
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 99
canonical_course: "MLOps и ML Engineering"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Retraining pipeline: как обновлять модель без «перезаписал файл и надеюсь»

Production model eventually needs update.

Reasons:
- new labeled data;
- concept drift;
- better features;
- new algorithm;
- bugfix;
- changed business objective.

But retraining is risky.

New model can have:
```text
higher CV score
but
broken latency
bad calibration
schema mismatch
worse important segment
```

Therefore retraining is not:
```text
train → overwrite model.joblib
```

It is controlled promotion process.

---

## 1. Champion and challenger

**Champion**:
current approved production model.

**Challenger**:
new candidate.

Question:
> does challenger provide meaningful benefit without violating constraints?

Comparison uses same evaluation protocol.

---

## 2. Why "best experiment" isn't automatically challenger

A run may be exploratory:
- leaked feature;
- wrong split;
- huge latency;
- unstable.

Challenger should first pass training/validation quality gates.

---

## 3. Retraining pipeline stages

```text
new data available
→ validate data
→ build point-in-time features
→ train
→ offline evaluate
→ compare champion
→ register challenger
→ service compatibility tests
→ staged rollout
→ monitor
→ promote or rollback
```

Each stage should be observable and fail closed.

---

## 4. Data validation gate

Before training:
```text
schema
row count
target rate
missing
time coverage
duplicates
label maturity
```

If label pipeline broken:
```text
positive rate 5% → 0.01%
```
do not train/release automatically.

---

## 5. Point-in-time feature correctness

Retraining with newer data can accidentally change feature SQL and introduce future information.

Run leakage/data-contract checks every training iteration.

MLOps automation doesn't make bad methodology correct.

---

## 6. Champion evaluation must be rerun on current benchmark

Do not compare:
```text
challenger score on Aug data
vs
champion old June score
```

Evaluate both on same appropriate current holdout.

Otherwise environment difference contaminates comparison.

---

## 7. Paired predictions

Save:
```text
champion_pred
challenger_pred
y
```

Then compare:
- metrics;
- individual wins/losses;
- segments;
- calibration;
- business cost.

Paired evaluation more informative than separate headline numbers.

---

## 8. Quality gate

Example:
```text
challenger AP >= champion AP + 0.01
AND
recall_at_precision >= champion
AND
no critical segment drops > 0.03
```

Thresholds should reflect meaningful improvement, not arbitrary tiny leaderboard gain.

---

## 9. Engineering gate

Also:
```text
p95 latency <= 80 ms
memory <= budget
artifact loads
schema compatible
batch throughput
container golden test
```

A model that cannot meet serving SLA is not production winner.

---

## 10. Calibration gate

If service uses probability for:
- expected loss;
- pricing;
- threshold;

compare reliability/Brier/logloss.

Higher ROC-AUC but broken calibration may not be better.

---

## 11. Business simulation

If decision threshold creates review queue:
```text
capacity = 1000/day
```

simulate:
- number flagged;
- precision;
- recall;
- expected cost.

Offline model metric must translate to downstream process.

---

## 12. Register challenger

After offline gates:
```text
registry version = v19
tag validation_status=passed
alias candidate
```

This makes exact candidate traceable.

Do not deploy arbitrary local artifact.

---

## 13. Shadow mode

New model receives production inputs but its output does not affect user/business decision.

```text
request
├→ champion → action
└→ challenger → log only
```

Benefits:
- real latency;
- schema;
- score distribution;
- later label comparison.

No decision risk.

---

## 14. Shadow limitations

Since challenger doesn't affect decisions:
- cannot evaluate effects of its alternative actions;
- some feedback/counterfactual metrics remain unavailable.

Still very useful technical validation.

---

## 15. Canary rollout

Send small percentage traffic to challenger:
```text
5%
```

It now affects real decisions for subset.

Monitor:
- service health;
- prediction distributions;
- immediate business proxies.

Increase gradually if healthy.

Requires careful experiment/routing design.

---

## 16. A/B test

For models impacting user behavior, randomized A/B may evaluate business outcomes.

But:
- enough sample;
- ethical/risk constraints;
- treatment consistency;
- interference.

Not every credit/fraud/high-stakes model suitable simple A/B.

---

## 17. Blue/green mental model

Maintain:
```text
old environment
new environment
```

Switch traffic pointer.

If issue:
```text
switch back
```

Useful concept for fast rollback, even if you don't operate full cloud platform.

---

## 18. Rollback

Rollback needs:
- previous image;
- previous model artifact;
- previous config/threshold;
- compatible schema.

If you overwrote files, rollback impossible.

This is why immutable versions matter.

---

## 19. Rollback trigger

Examples:
```text
5xx rate spike
p95 latency violation
prediction distribution impossible
business guardrail violation
```

True label quality may arrive late, so immediate rollback uses technical/proxy guardrails too.

---

## 20. Automatic vs manual promotion

For low-risk mature pipeline:
```text
automatic gates
```
possible.

For high-impact model:
```text
automatic evaluation
→ human approval
→ deploy
```

Automation should match risk.

---

## 21. Retrain schedule vs condition

### Schedule
```text
monthly
```

Simple, predictable.

### Condition
```text
quality degradation + enough labels
```

More adaptive.

Often hybrid:
```text
evaluate weekly
retrain if trigger
force review quarterly
```

---

## 22. Don't retrain too often

Frequent retraining can:
- chase noise;
- increase operational risk;
- create unstable behavior;
- consume compute.

Need enough new information.

---

## 23. Training-serving compatibility

Before promotion run:
```text
load challenger in exact serving container
→ schema tests
→ golden request
→ performance benchmark
```

Notebook success is insufficient.

---

## 24. Threshold version

Challenger can use different optimal threshold.

Deploy pair:
```text
model version + threshold version
```

Shadow compare both score and decision under intended threshold.

---

## 25. Feature backward compatibility

New model adds feature:
```text
merchant_reputation
```

If serving feature source unavailable:
deployment fails.

Feature availability/SLA part of candidate gate.

---

## 26. Training pipeline failure

If retraining fails:
```text
keep champion
```

Never:
```text
deploy partially trained artifact because schedule expects new version.
```

Current stable model is fallback.

---

## 27. Retraining reproducibility

Each scheduled run still logs:
```text
data cutoff
run ID
code commit
metrics
artifact
```

Automation doesn't remove lineage.

---

## 28. Post-deployment verification

Immediately after rollout:
```text
/ready
golden synthetic requests
error/latency metrics
prediction distribution
```

Then wait for delayed labels for true quality.

---

## 29. Challenger archive

If challenger rejected, keep metadata/reason:
```text
v18 rejected: p95 2.4x
```

Prevents repeating failed idea without context.

---

## 30. Интерактивная визуализация DataPath

### Promotion pipeline

Cards:
```text
data
train
offline gate
registry
shadow
canary
champion
```

Failure stops flow.

### Shadow

Same requests branch to two models.

### Rollback

Deploy v19, latency spike → pointer returns v17.

### Gate builder

Learner chooses:
- AP;
- latency;
- segment guardrail;
- calibration.

---

## 31. Типичные ошибки

**«Higher validation score = deploy».**\
No.

**«Compare challenger current score to champion old score».**\
Unfair.

**«Shadow mode fully measures business outcome».**\
No.

**«Rollback possible if we know old hyperparameters».**\
Need exact artifact/environment/config.

**«Retrain on every drift alert».**\
No.

**«Scheduled retraining should always produce a new deployed model».**\
No; candidate can be rejected.

---

## 32. Проверка понимания

1. Champion vs challenger?
2. Why same current benchmark?
3. Quality vs engineering gates?
4. What is shadow mode?
5. Canary?
6. Why rollback version everything?
7. Schedule vs conditional retraining?
8. Why threshold versioned?
9. What if retraining fails?
10. Why archive rejected challengers?

---

## 33. Мини-практика

Current:
```text
champion AP=.55
p95=20ms
```

Challenger:
```text
AP=.59
p95=85ms
SLA<50ms
```

Another:
```text
AP=.57
p95=25ms
rare segment recall -12%
```

Decide:
- promote/reject;
- what improve;
- what shadow test;
- what guardrail.

---

## Что нужно унести

1. Retraining is controlled promotion, not overwrite.
2. Champion/challenger must be compared on same data/protocol.
3. Quality, calibration, segments and serving constraints all matter.
4. Registry gives exact candidate identity.
5. Shadow validates safely on real inputs.
6. Canary/A-B introduce controlled real exposure.
7. Rollback requires immutable previous release components.
8. Retraining triggers need enough evidence/new labels.
9. Failed retraining leaves champion untouched.
10. Next: combine everything into full production lifecycle.

## Куда дальше

We now have every part individually.

Final lesson:
> from dataset and training all the way to service, monitoring, drift, registry, retraining and rollback.

## Источники
- ML model lifecycle / registry principles.
- Standard staged software deployment patterns applied to ML.
