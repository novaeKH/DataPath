---
title: "ООП и модель данных Python"
id: concept.datapath-v2.005
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 5
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# ООП и модель данных Python

Класс полезен не потому, что «всё должно быть объектом».

Он полезен, когда есть:
```text
состояние + поведение + инварианты
```

Пример:
```python
class Standardizer:
    def fit(self, values):
        self.mean_ = sum(values) / len(values)
        self.scale_ = (sum((x - self.mean_) ** 2 for x in values) / len(values)) ** 0.5
        return self

    def transform(self, values):
        return [(x - self.mean_) / self.scale_ for x in values]
```

после `fit` объект хранит mean/std и затем `transform` использует это состояние.

Это уже знакомая идея sklearn estimator.

## 1. Class и instance

```python
class User:
    pass

u = User()
```

`User` — class object.
`u` — instance.

## 2. `__init__`

```python
class User:
    def __init__(self, name):
        self.name = name
```

`self` — ссылка на instance, передаваемая автоматически при method call.

```python
u = User("Ilya")
u.name
```

## 3. Instance attributes vs class attributes

```python
class Model:
    framework = "sklearn"

    def __init__(self, name):
        self.name = name
```

`framework` живёт на class, `name` обычно на instance.

Неправильно:

```python
class Team:
    members = []
```

Все instances разделяют один mutable list.

Правильно:
```python
def __init__(self):
    self.members = []
```

## 4. Method call

```python
u.say()
```

conceptually связано с:
```python
User.say(u)
```

Это объясняет `self`.

## 5. Encapsulation Python-style

Python не делает жёсткую private-модель как некоторые языки.

Conventions:
```text
_name → internal use
__name → name mangling, not true security
```

API design важнее «спрятать всё».

## 6. Property

```python
class Account:
    def __init__(self, balance):
        self._balance = balance

    @property
    def balance(self):
        return self._balance
```

Позволяет оставить attribute-like API, но контролировать вычисление/validation.

Не превращайте каждый attribute в property без необходимости.

## 7. Inheritance

```python
class BaseModel:
    def predict(self, X):
        raise NotImplementedError

class CatModel(BaseModel):
    def predict(self, X):
        return ["cat" for _ in X]
```

Inheritance полезно для real "is-a" relation, но composition часто проще.

## 8. Composition

```python
class Service:
    def __init__(self, model, logger):
        self.model = model
        self.logger = logger
```

Service использует model/logger, но не обязан наследоваться от них.

Rule:
> prefer composition when relationship is "has-a".

## 9. `super()`

```python
class Child(Base):
    def __init__(self, x):
        super().__init__(x)
```

Работает с method resolution order (MRO), а не просто «вызови parent по имени».

## 10. Duck typing

Python часто спрашивает не:
> какого exact класса объект?

а:
> поддерживает ли он нужный protocol?

Например `len(x)` вызывает соответствующий protocol.

Если объект ведёт себя как file-like, многие функции могут использовать его без общего base class.

## 11. Special methods

```python
__len__
__iter__
__getitem__
__enter__
__exit__
__call__
__repr__
```

Это **модель данных Python**: встроенный синтаксис делегирует объекту.

Пример:

```python
class Batch:
    def __len__(self):
        return len(self.items)
```

Теперь:
```python
len(batch)
```

## 12. `__repr__`

Хороший debug representation:

```python
def __repr__(self):
    return f"Model(name={self.name!r})"
```

Очень полезно в notebook/logs.

## 13. `__call__`

```python
class Scaler:
    def __call__(self, x):
        return x * 2
```

Теперь instance можно вызвать:
```python
scaler(x)
```

PyTorch `nn.Module` использует callable-object pattern.

## 14. Dataclass

Для data container:

```python
from dataclasses import dataclass

@dataclass
class Config:
    lr: float
    epochs: int
```

Автоматически создаёт useful methods вроде `__init__`, `__repr__`, equality.

Отлично для configs/simple records.

## 15. Protocol thinking для ML

sklearn estimator concept:
```text
fit
predict
transform
```

DataLoader:
```text
iteration
```

context manager:
```text
__enter__ / __exit__
```

Понимая protocols, библиотеки выглядят намного менее магическими.

## Сквозной пример: эксперимент как набор ролей

В учебном ML-проекте `ExperimentConfig` может быть dataclass с параметрами, а `Trainer` — объектом, который получает модель и конфигурацию. Trainer не обязан наследоваться от модели: композиция точнее выражает отношение «использует», тогда как наследование означает «является разновидностью».

Метод получает экземпляр как `self`; вызов `trainer.fit(X, y)` концептуально превращается в `Trainer.fit(trainer, X, y)`. Атрибуты экземпляра принадлежат конкретному эксперименту, а изменяемый атрибут класса был бы общим для всех экземпляров и мог бы незаметно переносить состояние.

Python часто опирается на протоколы: если объект имеет подходящие методы, его можно использовать независимо от конкретного класса. Модель с `fit` и `predict` подходит Trainer, а объект с `__len__` участвует в `len`. Специальные методы соединяют пользовательский класс с синтаксисом языка.

Dataclass уменьшает шаблонный код для объектов-данных, но не делает объект неизменяемым автоматически. `__repr__` помогает отладке, property контролирует доступ к вычисляемому или проверяемому значению. Класс полезен, когда состояние и операции образуют устойчивое понятие; для простого преобразования обычная функция остаётся яснее.

## Визуализация DataPath

Object/class diagram и интерактивное сопоставление:
```text
len(x) → x.__len__()
for → __iter__()
with → __enter__/__exit__()
```

## Типичные ошибки

- mutable class attribute;
- inheritance ради code reuse без relation;
- путать `__name` с настоящей security;
- class, который является только набором unrelated static methods;
- overly deep inheritance.

## Проверка понимания

1. Class vs instance?
2. Что такое `self`?
3. Class attribute vs instance?
4. Composition vs inheritance?
5. Duck typing?
6. Что такое special method?
7. Для чего dataclass?

## Мини-практика

Создайте `ExperimentConfig` через dataclass:
- `lr`
- `batch_size`
- `epochs`
и class `Trainer`, который получает config и model через composition.

## Итог

Python OOP лучше понимать через:
```text
объекты + protocols + composition
```
а не только через четыре школьных принципа ООП.

## Куда дальше

Классы сами по себе не делают программу надёжной. Следующий урок — exceptions,
`with`, файлы, модули и окружения.
