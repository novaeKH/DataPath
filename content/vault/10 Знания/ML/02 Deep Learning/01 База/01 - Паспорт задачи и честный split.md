---
title: "Паспорт DL-задачи и честный split"
tags:
  - deep-learning
  - validation
  - data-leakage
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.pasport-dl-zadachi-i-chestnyi-split
schema_version: 2
language: ru
app: source
---
# Паспорт DL-задачи и честный split

Заполни этот блок **до модели**. Если поле не заполнено, код писать рано.

## 1. Паспорт задачи

```text
Объект:
Вход X:
Target y:
Момент прогноза:
Что доступно в этот момент:
Что нельзя использовать:
Главная метрика:
Дополнительные метрики:
Какая ошибка дороже — FP или FN:
Baseline:
Схема split:
Единица группировки:
Definition of done:
```

### Пример: банковские обращения

```text
Объект: одно обращение клиента
Вход X: текст обращения
Target y: одна из C тематик
Момент прогноза: сразу после получения сообщения
Нельзя использовать: ответ оператора и поля, появившиеся после маршрутизации
Главная метрика: macro F1
Baseline: TF-IDF + Logistic Regression
Split: по диалогам, со стратификацией по классу
```

## 2. Выбрать split

| Данные | Split |
|---|---|
| Независимые объекты | random train/valid/test |
| Дисбаланс классов | stratified split |
| Несколько строк одного клиента | group split по клиенту |
| Временная зависимость | прошлое → train, будущее → valid/test |
| Фрагменты одного документа | весь документ только в одной части |
| Тексты одного диалога/автора | group split по диалогу/автору |
| Изображения одного объекта/серии | group split по объекту/серии |

> [!danger] Самая частая утечка
> Связанные объекты попадают в разные части. Модель запоминает клиента, документ, автора или почти одинаковое изображение, а метрика выглядит лучше реальности.

## 3. Сначала отделить final test

```python
from sklearn.model_selection import train_test_split


X_dev, X_test, y_dev, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,  # убрать для регрессии
)

X_train, X_valid, y_train, y_valid = train_test_split(
    X_dev,
    y_dev,
    test_size=0.20,
    random_state=42,
    stratify=y_dev,
)
```

Для групп или времени используй соответствующий splitter. Не заменяй group/time split обычной стратификацией.

## 4. Зафиксировать роли частей

```text
train → обучаем веса и fit preprocessing
valid → выбираем архитектуру, lr, epoch, threshold
test  → один раз оцениваем уже зафиксированное решение
```

## 5. Baseline до DL

| Задача | Минимальный baseline |
|---|---|
| Табличная классификация | Dummy + Logistic Regression/CatBoost |
| Табличная регрессия | среднее/медиана + linear/CatBoost |
| Классификация текста | частый класс + TF-IDF Logistic Regression |
| Изображения | pretrained backbone с замороженным encoder |
| Retrieval | BM25 или embedding-модель без fine-tuning |
| Causal LM | предыдущий checkpoint или существенно меньшая модель |

> [!important]
> Нейросеть должна дать пользу относительно baseline, а не просто обучиться.

## 6. Проверка перед кодом

- [ ] Объект и target однозначны.
- [ ] Известен момент прогноза.
- [ ] Выбрана одна главная метрика.
- [ ] Final test отделён до экспериментов.
- [ ] Связанные объекты не пересекаются.
- [ ] Preprocessing обучается только на train.
- [ ] Есть простой baseline.

Следующий шаг: [[10 Знания/ML/02 Deep Learning/01 База/02 - Формы dtype logits loss]].
