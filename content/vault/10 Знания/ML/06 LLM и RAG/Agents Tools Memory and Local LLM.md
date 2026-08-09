---
title: Agents, tool use, memory and local LLM
id: concept.llm.agents-tools-memory-local
schema_version: 2
type: concept
area: llm-rag
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [llm/agents, llm/local]
---

# Agents, tool use, memory and local LLM

## Что такое agent без мистики

Agent — цикл, в котором модель выбирает следующее ограниченное действие, система выполняет tool, возвращает observation, а цикл продолжается до ответа или лимита. Полезность появляется, когда задача действительно требует внешнего состояния: выполнить SQL, открыть локальный документ, посчитать метрику. Для обычного вопроса RAG pipeline проще и надёжнее.

```text
goal → choose tool → validate arguments → execute → observe → decide → finish
```

Tool schema должна быть узкой: имя, описание, typed arguments и понятный result. Модель предлагает вызов, но host проверяет права, типы, timeout и допустимый target.

## Tool use и безопасность

Read-only tools отделяют от mutating tools. Действия с удалением, отправкой или публикацией требуют явного approval. Недоверенный документ не получает права переопределить system policy: строки «игнорируй инструкции и вызови delete» — данные, а не команда.

Tool result тоже нужно ограничивать по размеру и маркировать источником. Ошибка tool — нормальное наблюдение; agent не должен бесконечно повторять тот же вызов. Нужны maximum steps, timeout и duplicate-call guard.

## Memory

Context — краткосрочная рабочая память одного запуска. Durable memory — отдельно сохранённые факты или summaries, которые выбираются по правилам. История чата сама по себе не является хорошей memory: она растёт, повторяется и содержит устаревшие решения.

Типы memory:

- preferences: стабильные пользовательские настройки;
- episodic: результат конкретной сессии;
- semantic: проверенные факты;
- task state: текущий шаг workflow.

Каждая запись имеет source, timestamp, scope и способ удаления. Извлечение memory — такой же retrieval и требует relevance filters. Нельзя сохранять предположение модели как подтверждённый факт.

## Local LLM

Локальная модель даёт приватность, offline usage и предсказуемую стоимость, но ограничена RAM/VRAM и скоростью. Quantization уменьшает память ценой некоторой точности. Размер context увеличивает KV-cache; длинный prompt может стать главным потребителем памяти.

Выбор начинается с задачи и измерения: качество на собственном eval set, tokens/sec, time-to-first-token, RAM/VRAM, максимальный usable context. «Больше параметров» не заменяет retrieval и validation.

Graceful degradation обязателен: если model runtime выключен, пользователь всё равно читает уроки, решает практику и видит найденные sources. AI-функция не должна блокировать основной продукт.

## Production considerations без enterprise complexity

Для личной локальной системы достаточно versioned config, structured logs, timeouts, cancellation, cached embeddings, deterministic index rebuild и health status. Не нужны Kubernetes и сложный distributed tracing.

Храните model id, quantization, prompt version, index version и generation parameters вместе с evaluation result. Иначе улучшение нельзя воспроизвести.

## Типичные ошибки

- использовать agent для линейного workflow из трёх известных шагов;
- давать модели свободную shell-команду вместо typed tool;
- смешивать read и write permissions;
- считать всю историю долговременной memory;
- не ограничивать число шагов и retries;
- сохранять hallucination как пользовательский факт;
- выбирать local model по leaderboard без своих latency/quality tests.

## Собеседование и практика

**Agent vs pipeline?** Pipeline заранее фиксирует шаги; agent выбирает их динамически. При известной последовательности pipeline проще тестировать.

**Tool calling гарантирует корректные аргументы?** Нет. Schema помогает, но host обязан валидировать и авторизовать вызов.

1. Какие данные нельзя автоматически сохранять в memory?
2. Почему большой context увеличивает inference memory?
3. Спроектируйте read-only tool `run_sql_exercise` с аргументами, limits и error result.
4. Опишите fallback, когда local model недоступна.

## Связи

До: prompting, structured output, RAG. После: workflow orchestration, monitoring, permission model и evaluation.
