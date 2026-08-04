---
title: DataPath — проверенные источники
id: source.vault.datapath-verified-sources
schema_version: 2
type: source
area: vault
status: active
language: ru
rag: exclude
app: exclude
tags:
  - sources/datapath
updated: 2026-08-05
---

# DataPath — проверенные источники

> [!important] Правило использования
> Каноническая заметка остаётся источником истины внутри vault. Внешний материал нужен для проверки и обновления. Для нового технического утверждения сначала используется официальная документация или первичная статья; учебные курсы помогают выстроить порядок, но не заменяют проверку.

## Источники первого уровня

- [Python Tutorial](https://docs.python.org/3/tutorial/) — язык и стандартные механизмы Python.
- [pandas User Guide](https://pandas.pydata.org/docs/user_guide/) — операции с таблицами, merge, missing data и time series.
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html) — базовый SQL и модель выполнения запросов.
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html) — модели, preprocessing, model selection, metrics и common pitfalls.
- [PyTorch Tutorials](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) — тензоры, DataLoader, autograd и training loop.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/en/chapter1/1) — Transformers, tokenizers, datasets и LLM workflow.

## Курсы и учебники для структуры

- [Stanford CS229](https://cs229.stanford.edu/) — математическая и алгоритмическая база ML.
- [An Introduction to Statistical Learning](https://www.statlearning.com/) — понятное прикладное изложение классического ML.
- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) — framing, generalization, data и метрики.
- [Practical Deep Learning for Coders](https://course.fast.ai/) — практическая траектория DL.
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/course/) — жизненный цикл AI-продукта.
- [Made With ML](https://madewithml.com/courses/mlops/) — production ML, тестирование и воспроизводимость.

## Первичные статьи

- [XGBoost](https://arxiv.org/abs/1603.02754)
- [LightGBM](https://papers.nips.cc/paper/6907-lightgbm-a-highly-efficient-gradient-boosting-decision-tree)
- [CatBoost](https://papers.neurips.cc/paper/7898-catboost-unbiased-boosting-with-categorical-features)
- [Retrieval-Augmented Generation](https://papers.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html)

## Почему в курсах есть извлечение из памяти и интервальное повторение

Дизайн повторения опирается на исследования retrieval practice и distributed practice. Приложение должно просить пользователя воспроизводить и применять знание, а не только перечитывать его, и возвращать слабые навыки через интервалы. Полный реестр с DOI и назначением находится в `_meta/SOURCE_REGISTRY.yml`.
