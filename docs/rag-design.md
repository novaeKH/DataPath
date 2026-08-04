# DataPath — локальный RAG

## Обзор pipeline

```
Markdown (.md из content/vault)
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. PARSING                               │
│    ├─ Извлечение frontmatter (YAML)      │
│    ├─ Парсинг Markdown в AST             │
│    └─ Сохранение метаданных              │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 2. CHUNKING                              │
│    ├─ Разбиение по H2/H3 заголовкам      │
│    ├─ Добавление контекста в metadata    │
│    ├─ Целевой размер: 180–700 слов       │
│    └─ Код/формулы рядом с объяснением    │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 3. EMBEDDING                             │
│    ├─ Модель: bge-m3 (1024d)             │
│    ├─ Batch-обработка (по 32 чанка)      │
│    └─ Сохранение в ChromaDB              │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 4. RETRIEVAL (при запросе)               │
│    ├─ Hybrid: lexical (FTS5) + semantic  │
│    ├─ Фильтрация по skill_ids, коллекции  │
│    ├─ Ограничение: ≤ 2 чанка от файла    │
│    └─ Приоритет: knowledge > deep-dive   │
│                    > practice             │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 5. RERANKING (не в MVP, этап 2+)         │
│    ├─ bge-reranker-v2-m3 через Ollama    │
│    └─ Будет добавлен после оценки качества │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 6. GENERATION                            │
│    ├─ Промпт: система + контекст + запрос│
│    ├─ LLM: qwen2.5:3b-instruct           │
│    ├─ Стриминг через SSE                 │
│    └─ Цитаты привязаны к source_path +   │
│       heading чанка                      │
└─────────────────────────────────────────┘
```

## Что индексируется

| Коллекция | `type` | `rag` | Источник |
|---|---|---|---|
| `knowledge` | `concept`, `deep-dive` | `include` | `10 Знания/`, `15 Практика/` |
| `practice` | `practice` | `include`, `rag_collection: practice` | `05 Курсы/.../Кейсы/`, `15 Практика/` |
| `interview` | `interview` | `include`, `rag_collection: interview` | `60 Карьера/.../Interview Notes/` |
| `projects` | `project` | `include` | `40 Проекты/` (опционально) |

## Что исключается из индекса

- `type: moc`, `router`, `template`, `meta`, `source` — навигационные и служебные
- `app: exclude` — всё, не предназначенное для приложения
- `rag: exclude` — явное исключение (lesson wrappers, MOC)
- `.obsidian/`, `_meta/`, `.git*`, вложения, Canvas-файлы
- Daily notes, inbox, личные мысли
- Question bank (вопросы без ответов — бесполезны для retrieval)
- `details` / answer-секции с `data-answer="true"` — не выдаются в режиме «не давай ответ»

## Стратегия чанкинга

### Базовые правила

1. **Граница чанка — H2 или H3.** Чанк = раздел заметки, а не произвольный кусок текста.
2. **Metadata каждого чанка:**
   ```json
   {
     "chunk_id": "concept.ml.decision-trees__split-gain",
     "doc_id": "concept.ml.decision-trees",
     "title": "Decision Trees",
     "heading": "Split gain",
     "breadcrumb": ["Decision Trees", "Split gain"],
     "area": "ml",
     "type": "concept",
     "math_depth": 2,
     "source_path": "10 Знания/ML/01 Classical ML/Decision Trees.md",
     "skill_ids": ["ml.tree_ensembles"],
     "is_answer": false
   }
   ```
3. **Целевой размер:** 180–700 слов. Для разделов с кодом/формулами — до 1000 слов.
4. **Код и формула остаются вместе со своим объяснением.** Не разделять `$$L = ...$$` и текст «это функция потерь».
5. **Заголовок должен быть семантичным:** «Почему attention делят на sqrt(d_k)», а не «13.1» или «Компоненты».
6. **Минимальная самодостаточность:** чанк должен быть понятен без чтения остальной заметки (заголовок + breadcrumb в metadata).

### Особые случаи

**Математика:**
- Формула + её объяснение + assumptions → один чанк.
- Если раздел содержит вывод (depth 3), он отделяется как deep-dive чанк.

**Код:**
- Код-блок + предшествующий и последующий текст → один чанк.
- Если код длинный (>30 строк), он усекается с пометкой `[код сокращён, см. source]`.

**Сравнения и trade-offs:**
- Допустимы более длинные чанки (до 1200 слов), если они содержат связное сравнение.
- Приоритет целостности сравнения над размером.

**Interview notes:**
- Один «вопрос + ответ + follow-up» → один чанк.
- Target: 200–500 слов.

## Инкрементальное обновление

```
При изменении файла в content/vault:
1. Вычислить content_hash
2. Сравнить с сохранённым в SQLite (content_catalog)
3. Если изменился:
   a. Найти старые чанки в ChromaDB (where doc_id = ...)
   b. Удалить их
   c. Переразбить файл заново
   d. Получить embeddings (batch)
   e. Сохранить новые чанки
   f. Обновить content_hash в SQLite
4. Если удалён:
   a. Удалить чанки из ChromaDB
   b. Пометить в SQLite как deleted
```

**Триггеры:**
- Автоматически при старте бэкенда (проверка всех файлов)
- POST `/api/content/reload` (ручной)
- `make reindex` (CLI)

## Retrieval (поиск)

### Hybrid retrieval

1. **Semantic (ChromaDB):**
   - Embedding запроса → косинусное сходство с чанками
   - Топ-20 результатов

2. **Lexical (SQLite FTS5):**
   - Полнотекстовый поиск по содержимому чанков
   - Топ-10 результатов

3. **Слияние:**
   - Reciprocal Rank Fusion (RRF) для объединения двух списков
   - Топ-15 после слияния

### Фильтрация

На этапе retrieval применяются фильтры:
- **По коллекции:** knowledge ИЛИ practice ИЛИ interview (в зависимости от режима наставника)
- **По skill_ids:** если запрос в контексте урока/кейса — только чанки с пересекающимися skill_ids
- **По area:** если запрос ML — приоритет ml-чанков, но математика не исключается
- **Исключение answer-чанков:** в режимах, где нельзя давать готовый ответ

### Ограничение чанков от одного файла

До reranking допускается **максимум 2 чанка от одного документа**. Это предотвращает доминирование одной длинной заметки в результатах.

### Приоритет коллекций

При конфликте (одинаковый retrieval score):
1. `knowledge` (canonical theory)
2. `deep-dive` (углублённый материал)
3. `practice` (примеры)
4. `interview` (короткие ответы)

## Reranking (опционально, этап 2)

После retrieval:
1. Топ-15 чанков → bge-reranker-v2-m3
2. Топ-5 после reranking попадают в контекст
3. Если reranker отключен — напрямую топ-7 в контекст

**Почему опционально:** добавляет ~1 ГБ RAM, ~1 с задержки. Для MVP можно использовать только retrieval.

## Prompt assembly

Сборка промпта для LLM:

```text
System:
Ты — AI-наставник DataPath. Твоя роль: помогать изучать Data Science на русском языке.
Объясняй понятно, опирайся на предоставленный контекст, цитируй источники.
{если режим = сократический: НЕ давай готовый ответ. Задавай наводящие вопросы.}
{если режим = интервью: Оценивай ответ, задавай follow-up.}

Контекст (знания пользователя):
- Уровень: {beginner/intermediate}
- Сильные темы: {перечисление}
- Слабые темы: {перечисление} — объясняй эти темы подробнее

Текущий материал:
- Курс: {название}
- Урок: {название}
- Навыки: {skill_ids}

Извлечённые материалы (vault):
[1] {source_path} > {heading}
{chunk_content}
[2] ...

Инструкция по ответу:
- Сначала ответь на русском, связно и полно.
- После ответа добавь раздел «📖 Источники» со ссылками на заметки.
- Используй формулы ($$...$$) и код (```python), если нужно.
- Если информации недостаточно, скажи об этом.

User:
{запрос пользователя}
```

## Генерация и стриминг

```python
async def generate_stream(prompt: str):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:3b",
                "prompt": prompt,
                "stream": True,
                "temperature": 0.4,
                "context": [],  # можно передавать предыдущий контекст
            },
            timeout=60.0,
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    data = json.loads(line)
                    yield data["response"]
                    if data.get("done"):
                        break
```

**Frontend** получает токены через SSE:
```typescript
const eventSource = new EventSource('/api/ai/ask/stream?query=...');
eventSource.onmessage = (event) => {
  setAnswer(prev => prev + event.data);
};
```

## Цитирование источников

После генерации ответа извлекаются цитаты:
- LLM инструктирован использовать формат `[N]` после утверждений, основанных на контексте
- Парсер на бэкенде извлекает `[N]` и сопоставляет с чанками
- Ответ возвращается с полем `citations`:
  ```json
  {
    "citations": [
      {
        "ref": 1,
        "source_path": "10 Знания/ML/01 Classical ML/Decision Trees.md",
        "heading": "Split gain",
        "quote": "Tree criterion — surrogate..."
      }
    ]
  }
  ```
- Frontend рендерит цитаты как кликабельные ссылки → открывают source-заметку

## Подключение Ollama

Конфигурация в `backend/src/config.py`:
```python
class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "qwen2.5:3b-instruct"
    embedding_model: str = "bge-m3"
    reranker_model: str | None = None      # этап 2+: "bge-reranker-v2-m3"
    embedding_dim: int = 1024             # bge-m3
    chunk_target_words: int = 450
    max_chunks_per_doc: int = 2
    top_k_retrieval: int = 15
    top_k_after_rerank: int = 5
```

**Используемые в MVP модели:**

| Роль | Модель | Размер (q4) | RAM ~ | Размерность |
|---|---|---|---|---|
| LLM | `qwen2.5:3b-instruct` | ~2.0 ГБ | ~2.5 ГБ | — |
| Embedding | `bge-m3` | ~1.2 ГБ | ~1.5 ГБ | 1024 |
| Reranker | пропущен в MVP | — | — | — |

**Итого RAM на модели:** ~4.0 ГБ (помещается в 16 ГБ вместе с ОС + приложением).

### Команды для установки

```bash
# Установка Ollama
brew install ollama

# Загрузка моделей
ollama pull qwen2.5:3b-instruct
ollama pull bge-m3

# Проверка
ollama list
```

## RAG + контекст урока

При запросе внутри урока AI-наставник получает дополнительный контекст:

```python
context = {
    "lesson_id": "lesson.classic-ml.trees.tree",
    "current_heading": "Split gain",      # что пользователь сейчас изучает
    "skill_ids": ["ml.tree_ensembles"],
    "selected_text": "Gini impurity...",  # если пользователь выделил текст
    "mode": "explain",                    # explain | socratic | debug | interview
}
```

Это влияет на retrieval:
- **Фильтр по skill_ids:** чанки без `ml.tree_ensembles` получают penalty
- **Приоритет current_heading:** чанки из того же раздела получают boost
- **selected_text:** добавляется в запрос к retrieval для контекстного поиска

## Хранение embeddings

ChromaDB хранит данные в `backend/data/chroma/`. Каждая коллекция — отдельная директория.

```
backend/data/
├── chroma/
│   ├── knowledge/            # Основная коллекция теории
│   │   ├── chroma.sqlite3
│   │   └── ... (векторы)
│   ├── practice/             # Практика и кейсы
│   └── interview/            # Интервью-ответы
└── datapath.sqlite3          # Основная БД приложения
```

## Оценка качества RAG (не MVP, фаза тестирования)

Для проверки качества retrieval (после реализации):
1. Подготовить 20 тестовых вопросов по material в vault
2. Проверить, что канонический ответ попадает в топ-5
3. Измерить recall@5
4. Проверить, что цитаты ведут на правильные разделы

## Ограничения MVP

- **Одна embedding-модель** (не гибрид multilingual + local)
- **Нет streaming chunk retrieval** (сначала retrieval, потом генерация)
- **Нет multi-turn retrieval** (каждый запрос независим, история не влияет на retrieval)
- **Нет query rewriting** (запрос пользователя идёт напрямую)
- **Reranker опционален** (этап 2)
