---
title: "Текстовые данные и корректная предобработка"
id: concept.datapath-v2.075
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 75
canonical_course: "NLP"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Текстовые данные и корректная предобработка

Текст кажется простым:

```text
"Карта не работает, деньги списались дважды"
```

Но для модели это не готовый feature vector.

Сначала нужно решить:

- что считать отдельным документом;
- что является полезной информацией;
- что можно нормализовать;
- что нельзя удалять;
- как избежать leakage;
- как одинаково обрабатывать train и production.

Главная ошибка новичка:

> **чем сильнее очистить текст, тем лучше.**

В современном NLP это часто неверно.

Пунктуация, регистр, числа, эмодзи, повторения, специальные символы и даже опечатки могут нести signal.

---

## 1. Что является объектом

Перед любой обработкой нужно определить единицу наблюдения.

Это может быть:

```text
одно сообщение
весь диалог
один отзыв
заголовок + описание
один документ
последние N сообщений клиента
```

Если target относится ко всему диалогу, а строки dataset — отдельные messages, обычный random split по messages может отправить части одного диалога и в train, и в validation.

Это leakage.

---

## 2. Текст почти всегда содержит структуру

Пример:

```text
"НЕ РАБОТАЕТ!!!"
```

Если сделать:

```text
lowercase
remove punctuation
```

получим:

```text
"не работает"
```

Смысл сохранился частично, но intensity исчезла.

В sentiment/support classification это может быть predictive.

Поэтому preprocessing должен соответствовать model family и задаче.

---

## 3. Что обычно проверять до очистки

Для корпуса:

```text
число документов
длина текста
доля пустых строк
duplicates
язык
encoding
HTML/markup
URLs
email/phone
эмодзи
частые шаблоны
target distribution
```

Также полезно посмотреть реальные examples:

```python
df.sample(20)[["text", "target"]]
```

Ручное чтение часто обнаруживает проблему быстрее статистики.

---

## 4. Пустые и почти пустые тексты

Примеры:

```text
""
" "
"."
"ok"
```

Пустой текст может означать:

- data error;
- реально пустое сообщение;
- вложение без caption;
- пропущенный текст.

Не надо автоматически удалять такие строки до понимания semantics.

Иногда сам факт отсутствия текста связан с target.

---

## 5. Дубликаты

Если одинаковый review встречается много раз и copies попадают в разные splits, validation становится слишком лёгкой.

Особенно опасны near-duplicates:

```text
"Спасибо! Всё отлично"
"Спасибо, всё отлично!"
```

или templates с изменённым ID.

Поэтому для NLP split audit должен включать duplication patterns.

---

## 6. Lowercasing

Преобразование:

```text
"Bank" → "bank"
```

уменьшает vocabulary.

Это полезно для classical sparse models.

Но иногда case важен:

```text
US
us
```

или:

```text
"НЕ РАБОТАЕТ"
```

Modern pretrained tokenizer/model может быть:

```text
cased
uncased
```

и preprocessing должен соответствовать конкретному checkpoint.

Нельзя lowercase text перед cased model просто по привычке.

---

## 7. Пунктуация

Удаление punctuation иногда помогает simple Bag of Words, но может удалить signal:

```text
!!!
???
:)
:(
```

Для transformer tokenizer пунктуация обычно является частью normal tokenization pipeline.

Поэтому rule:

> не чистить то, что model уже умеет обрабатывать, без evidence, что очистка полезна.

---

## 8. Числа

Текст:

```text
"списали 50 рублей"
"списали 500000 рублей"
```

Числовая magnitude может быть критична.

Замена всех numbers на `<NUM>` уменьшает vocabulary, но теряет exact amount.

Варианты:

- оставить;
- нормализовать формат;
- выделить отдельный numeric feature;
- одновременно сохранить token и structured number.

---

## 9. URLs, email, phone

Иногда exact URL не важен, а наличие ссылки важно.

Можно заменить:

```text
https://example.com/x
→ <URL>
```

Так мы сохраняем type information и уменьшаем vocabulary explosion.

То же:

```text
email → <EMAIL>
phone → <PHONE>
```

Но если domain сам predictive, полное удаление может повредить.

---

## 10. Stop words

Stop words:

```text
и
в
на
the
of
```

часто удаляли в classic NLP, чтобы уменьшить vocabulary.

Но это не универсально.

Для sentiment:

```text
"не понравилось"
```

слово `не` критично.

Для Transformer stop-word removal почти всегда разрушает естественную input sequence, на которой model была pretrained.

Поэтому stop words — experiment для sparse baseline, а не обязательная очистка.

---

## 11. Lemmatization

Лемматизация:

```text
кошки
кошку
кошками
→ кошка
```

может уменьшить sparsity для morphologically rich languages.

Но цена:

- ошибки analyzer;
- потеря grammatical information;
- дополнительный compute;
- preprocessing dependency.

Для TF-IDF на русском lemmatization иногда полезна, но n-граммы/char features могут дать сильный baseline и без неё.

Для pretrained Transformer обычно лучше raw-ish text в ожидаемом tokenizer format.

---

## 12. Stemming

Stemming грубо обрезает формы слова.

Например English:

```text
studies
studying
studied
→ studi
```

Он быстрее lemmatization, но создаёт неестественные stems.

Для русского языка stemming тоже возможен, но не нужно считать его обязательным современным preprocessing.

---

## 13. Опечатки

Текст поддержки:

```text
"карта незаблокировалась"
```

Опечатка может создать unseen word для word-level vocabulary.

Char n-grams и subword tokenizers устойчивее:

```text
кар
арта
заб
...
```

или разбивают word на subword pieces.

Поэтому spell correction не всегда нужна.

Иногда correction даже удаляет domain-specific terms.

---

## 14. Emoji

```text
❤️
😡
😂
```

могут быть очень сильными sentiment signals.

Удалить emoji = выбросить информацию.

Transformer tokenizer может поддерживать их полностью или разбивать на bytes/subwords — зависит от tokenizer.

---

## 15. HTML и markup

Reviews могут содержать:

```html
<br>
<b>great</b>
```

Если markup технический и не несёт semantics, его можно удалить.

Но:

```text
<code>
```

в developer forum может быть важным structural signal.

Принцип тот же:

> preprocessing зависит от domain.

---

## 16. Unicode normalization

Внешне похожие symbols могут иметь разные Unicode representations.

Например composed/decomposed characters.

Normalization типа NFC/NFKC иногда полезна, но NFKC может менять некоторые compatibility characters.

Для большинства pipelines важно хотя бы понимать, что «одинаково выглядящий текст» не всегда одинаков byte-to-byte.

---

## 17. Language detection

Если corpus multilingual:

```text
ru
en
de
...
```

варианты:

- одна multilingual model;
- разные models по language;
- language как feature;
- filtering.

Нельзя случайно обучить Russian-specific tokenizer на mixture и ожидать одинаковое качество.

---

## 18. Текстовые поля нельзя всегда просто склеить

Есть:

```text
title
description
category_name
```

Можно:

```text
title + " " + description
```

Но field identity теряется.

Для classical model можно:

- отдельный vectorizer;
- потом concatenate sparse matrices.

Для Transformer можно использовать separators/special structure согласно model/task design.

---

## 19. Leakage через текст

Очень опасные patterns:

```text
"кредит одобрен"
```

в задаче prediction approval **до** решения.

Или:

```text
"после подтверждённого дефолта..."
```

при prediction future default.

Text может содержать post-event information, даже если column name выглядит безобидно.

Leakage audit NLP требует читать examples.

---

## 20. Leakage через template

Support tickets после обработки operator могут содержать automatic response:

```text
"Категория обращения: мошенничество"
```

Если target — category ticket, model почти напрямую читает label.

Это типичная shortcut.

---

## 21. Train/validation split

Если data independent:

```text
Stratified split
```

может быть достаточен.

Но часто есть:

- user_id;
- conversation_id;
- time;
- source.

Тогда group/time split важнее обычной random stratification.

---

## 22. Text length как отдельный feature

Число:

```text
characters
words
sentences
```

может быть useful.

Например spam messages длиннее/короче.

Для sparse baseline можно добавить length features отдельно.

Но длина может быть shortcut, который drift-ит.

---

## 23. Classical vs Transformer preprocessing

### TF-IDF baseline

Можно экспериментировать с:

- lowercase;
- word/char n-grams;
- lemmatization;
- URL replacement.

### Transformer

Обычно:

```text
minimal normalization expected by tokenizer
→ tokenizer
→ model
```

Не надо сначала превращать natural text в набор lemmas, если model pretrained на обычном тексте.

---

## 24. Pipeline philosophy

Правильно:

```text
raw text
→ deterministic normalizer
→ vectorizer/tokenizer
→ model
```

Неправильно:

```text
ручная серия notebook replaces
→ забыли часть при inference
```

Preprocessing должен быть воспроизводимым.

---

## 25. Практический normalizer

```python
import re

URL_RE = re.compile(r"https?://\S+")

def normalize_text(text: str) -> str:
    text = text.strip()
    text = URL_RE.sub("<URL>", text)
    return text
```

Это intentionally minimal.

Каждое новое transformation добавляется только после hypothesis/validation.

---

## 26. Интерактивная визуализация DataPath

### Cleaning laboratory

Original:

```text
"НЕ РАБОТАЕТ!!! 😡 https://..."
```

Toggle:

```text
lowercase
remove punctuation
remove emoji
replace URL
lemmatize
```

Показывать, какая information исчезла.

### Leakage challenge

5 текстов, пользователь отмечает snippets, которых не могло быть в prediction moment.

### Split duplicates

Показать identical/near-identical texts в train/validation и artificial metric inflation.

---

## 27. Типичные ошибки

**«Надо удалить всю пунктуацию».**\
Нет.

**«Stop words всегда noise».**\
Нет.

**«Lemmatization всегда улучшает NLP».**\
Нет.

**«Transformer требует такую же очистку, как TF-IDF».**\
Нет.

**«Text column не может содержать leakage».**\
Может, и часто содержит.

**«Duplicates безобидны».**\
Нет, они могут течь между splits.

---

## 28. Проверка понимания

1. Почему preprocessing model-dependent?
2. Когда lowercasing может вредить?
3. Почему `не` нельзя считать обычным stop word?
4. Почему char/subword methods устойчивы к опечаткам?
5. Что делать с URLs?
6. Почему emoji могут быть signal?
7. В чём leakage через post-event text?
8. Почему group split нужен conversations?
9. TF-IDF vs Transformer preprocessing?
10. Что означает reproducible text pipeline?

---

## 29. Мини-практика

Задача: классифицировать банковские обращения.

Примеры:

```text
"Не могу войти в приложение"
"Списали 9000 дважды!!!"
"Спасибо ❤️ всё решили"
"Ваше обращение классифицировано как Fraud"
```

Ответьте:

1. какие transformations попробовать для TF-IDF;
2. какие не делать для pretrained Transformer;
3. какой example подозрителен на leakage;
4. как split по client/conversation;
5. какие structured features добавить.

---

## Что нужно унести

1. NLP preprocessing начинается с semantics задачи.
2. Более сильная очистка не означает более хорошую model.
3. Case, punctuation, numbers и emoji могут быть signal.
4. Stop-word removal/lemmatization — experiments для classical NLP, не обязательные правила.
5. Transformer должен получать text в формате, близком к его pretraining assumptions.
6. Duplicates и templates создают leakage.
7. Prediction moment applies к text так же, как к tabular features.
8. Text pipeline должен быть reproducible.

## Куда дальше

Теперь text можно превратить в numerical representation.

Самый сильный классический baseline начинается с простой идеи:

> считать, какие слова и фразы встречаются в документе.

Следующий урок — Bag of Words, n-граммы и TF-IDF.

## Источники
- scikit-learn text feature extraction documentation.
- Hugging Face tokenizer documentation.
