---
title: "Полный PyTorch workflow — Dataset, DataLoader, train, validation и inference"
id: concept.datapath-v2.073
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 73
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Полный цикл PyTorch: данные, обучение, проверка и сохранение

Работающая архитектура ещё не означает работающий эксперимент. Можно правильно написать слои и получить неверную оценку из-за утечки, режима dropout или ошибки усреднения. В этой главе соберём маленькую задачу целиком: от исходных объектов до повторного предсказания сохранённой моделью.

Все блоки Python выполняются последовательно в одном процессе. Данные синтетические, интернет и видеокарта не нужны. Это учебная проверка жизненного цикла, а не доказательство качества нейросетей на реальной задаче.

## Данные сначала разделяем, потом изучаем

Создадим объекты с двумя признаками. Класс зависит от суммы признаков с небольшим шумом. Случайное разбиение допустимо именно для этих независимо сгенерированных объектов. Для временных рядов или нескольких записей одного пользователя способ разбиения нужно менять.

```python
import copy
import torch
from torch import nn
from torch.utils.data import TensorDataset, DataLoader

torch.manual_seed(7)
X = torch.randn(240, 2)
y = (X[:, 0] + X[:, 1] + 0.15 * torch.randn(240) > 0).long()
order = torch.randperm(len(X))
train_ids, valid_ids, test_ids = order[:160], order[160:200], order[200:]
mean = X[train_ids].mean(0)
scale = X[train_ids].std(0).clamp_min(1e-6)

def dataset(indices):
    return TensorDataset((X[indices] - mean) / scale, y[indices])

train_loader = DataLoader(dataset(train_ids), batch_size=32, shuffle=True)
valid_loader = DataLoader(dataset(valid_ids), batch_size=32)
test_loader = DataLoader(dataset(test_ids), batch_size=32)
```

Среднее и масштаб вычислены только на обучающей части. Валидация и тест используют эти же числа. TensorDataset связывает признаки с меткой одного объекта; DataLoader собирает объекты в пакеты. Для файлов или сложных преобразований можно написать собственный Dataset с `__len__` и `__getitem__`, сохранив ту же роль.

Перемешивание train меняет состав и порядок пакетов, но не разрывает пары признаков и меток. Валидацию перемешивать обычно не требуется.

## Один обучающий шаг и его порядок

Возьмём MLP с двумя выходными логитами. CrossEntropyLoss сама выполняет нужное преобразование логитов; softmax перед ней не добавляем.

```python
model = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 2))
optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
loss_fn = nn.CrossEntropyLoss()

def train_epoch():
    model.train()
    total_loss, count = 0.0, 0
    for features, target in train_loader:
        optimizer.zero_grad(set_to_none=True)
        logits = model(features)
        loss = loss_fn(logits, target)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * len(target)
        count += len(target)
    return total_loss / count
```

Обнуление удаляет градиенты предыдущего шага. Forward строит прогноз, loss измеряет расхождение, backward вычисляет градиенты, а optimizer меняет параметры. Перестановка backward и step изменит смысл или сделает обучение неработающим.

Средняя ошибка пакета умножается на его размер перед суммированием. Иначе короткий последний пакет получит такой же вес, как полный, и итоговая средняя будет искажена.

## Валидация ничего не обучает

```python
def evaluate(loader):
    model.eval()
    total_loss, correct, count = 0.0, 0, 0
    with torch.no_grad():
        for features, target in loader:
            logits = model(features)
            total_loss += loss_fn(logits, target).item() * len(target)
            correct += (logits.argmax(1) == target).sum().item()
            count += len(target)
    return total_loss / count, correct / count

best_loss = float("inf")
best_state = None
for epoch in range(30):
    train_loss = train_epoch()
    valid_loss, valid_accuracy = evaluate(valid_loader)
    if valid_loss < best_loss:
        best_loss = valid_loss
        best_state = copy.deepcopy(model.state_dict())

model.load_state_dict(best_state)
test_loss, test_accuracy = evaluate(test_loader)
print(round(test_loss, 3), round(test_accuracy, 3))
```

Точная метрика зависит от вычислительной среды, но задача должна обучаться заметно лучше постоянного ответа. Главное здесь — тест используется после выбора состояния по валидации, а не для выбора каждой эпохи.

`eval()` переключает поведение dropout и BatchNorm. `no_grad()` отключает построение графа для градиентов. Это разные механизмы. Для ROC-AUC и некоторых других метрик недостаточно усреднить результаты отдельных пакетов: нужно собрать оценки и метки всей выборки.

## Сохраняем не только веса

`state_dict` содержит параметры и буферы, но не исходный код архитектуры и не договорённость о признаках. Чтобы воспроизвести прогноз, нужно сохранить масштабирование и порядок входов. Следующий пример пишет только во временный каталог, который затем очищается.

```python
from pathlib import Path
from tempfile import TemporaryDirectory

model.eval()
probe = torch.tensor([[0.5, 1.0]])
with torch.no_grad():
    before = model((probe - mean) / scale)

with TemporaryDirectory() as tmp:
    path = Path(tmp) / "model.pt"
    torch.save({"state": model.state_dict(), "mean": mean, "scale": scale}, path)
    saved = torch.load(path, weights_only=True)
    restored = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 2))
    restored.load_state_dict(saved["state"])
    restored.eval()
    with torch.no_grad():
        after = restored((probe - saved["mean"]) / saved["scale"])
    print(torch.allclose(before, after))  # True
```

Для продолжения обучения дополнительно нужны состояние optimizer, номер шага и, при использовании, scheduler и состояние случайных генераторов. Загружайте только доверенные артефакты; сериализация не превращает неизвестный файл в безопасный.

## Отладка до большого эксперимента

Сначала проверьте форму одного пакета и одного выхода. Затем попробуйте переобучить сеть на нескольких объектах: если даже маленький набор не запоминается, вероятны ошибка меток, loss, градиентов или режима обучения. Это диагностический тест, а не финальный способ оценивать качество.

Если loss становится NaN, проверьте входы, деления на ноль и величину шага. Если train улучшается, а validation ухудшается, посмотрите на переобучение и различие распределений. Не начинайте с увеличения модели.

Mixed precision и накопление градиентов полезны при ограничении ресурсов, но добавляют условия корректности. Сначала добейтесь воспроизводимого базового цикла; перенос на устройство должен перемещать и модель, и соответствующие тензоры.

## Самопроверка и практика

1. Почему mean и scale нельзя вычислять по всему X?
2. Зачем умножать среднюю loss пакета на его размер?
3. Почему best_state копируется, а не просто присваивается?
4. Что потеряется, если сохранить только веса?

Разбор: оценка получит информацию из отложенных данных; пакетам нужен вес по числу объектов; ссылки на изменяемые тензоры могут продолжить меняться при обучении; исчезнут преобразование входов, архитектура и условия использования.

**Практика.** Замените размер пакета на 17. Число объектов не изменилось, последний пакет станет короче. Проверьте, что оценка loss учитывает каждый объект один раз, а сохранение и загрузка по-прежнему дают `True`. Затем специально уберите масштабирование только при inference и объясните, почему тот же набор весов уже не означает тот же прогноз.

Следующая глава покажет, какие части этого цикла меняются, когда начинаем с готовых весов.

## Источники

[Dataset и DataLoader](https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html), [сохранение и загрузка](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html), [воспроизводимость](https://docs.pytorch.org/docs/stable/notes/randomness.html).
