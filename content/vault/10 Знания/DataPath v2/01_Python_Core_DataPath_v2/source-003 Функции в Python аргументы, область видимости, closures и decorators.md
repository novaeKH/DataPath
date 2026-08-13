---
title: "Функции в Python: аргументы, область видимости, closures и decorators"
id: concept.datapath-v2.003
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 3
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Функции: не просто `def`

Функция — отдельный объект Python.

```python
def square(x):
    return x * x
```

Имя `square` ссылается на function object, который можно:
- передавать;
- возвращать;
- хранить в dict;
- оборачивать decorator.

## 1. Аргументы

```python
def train(model, X, y, epochs=10):
    for _ in range(epochs):
        model.update(X, y)
    return model
```

Вызовы:
```python
train(model, X, y)
train(model, X, y, epochs=30)
train(model=model, X=X, y=y)
```

Keyword arguments делают вызов понятнее, особенно для нескольких boolean/numeric настроек.

## 2. Positional-only и keyword-only

```python
def f(a, /, b, *, c):
    return a + b * c
```

- `a` — positional-only;
- `b` — можно так и так;
- `c` — keyword-only.

Полезно для API design.

## 3. `*args`

```python
def total(*values):
    return sum(values)
```

`values` — tuple.

```python
total(1, 2, 3)
```

## 4. `**kwargs`

```python
def build(**params):
    print(params)
```

`params` — dict.

Useful for wrappers/configuration, но чрезмерный `**kwargs` скрывает контракт функции.

## 5. Распаковка при вызове

```python
values = [1, 2, 3]
total(*values)
```

```python
params = {"epochs": 20}
train(model, X, y, **params)
```

## 6. Scope: LEGB

Python ищет имя примерно в порядке:
```text
Local
Enclosing
Global
Builtins
```

Пример:

```python
x = 10

def f():
    x = 20
    print(x)
```

Внутренний `x` — local.

## 7. `global`

```python
count = 0

def inc():
    global count
    count += 1
```

Работает, но global mutable state усложняет тестирование.

Чаще лучше:
- return new value;
- class/object state;
- explicit dependency.

## 8. `nonlocal`

Для enclosing scope:

```python
def make_counter():
    count = 0

    def inc():
        nonlocal count
        count += 1
        return count

    return inc
```

`inc` — closure.

## 9. Closure

Closure — функция, которая сохраняет доступ к variables enclosing scope после завершения внешней функции.

```python
counter = make_counter()
counter()  # 1
counter()  # 2
```

Это не «копия значения навсегда» во всех случаях, а сохранённая связь с enclosing cells.

## 10. Late binding trap

```python
funcs = []

for i in range(3):
    funcs.append(lambda: i)

print([f() for f in funcs])
```

Получим:
```text
[2, 2, 2]
```

Lambda смотрит на `i` при вызове, а loop уже закончился.

Один fix:

```python
funcs.append(lambda i=i: i)
```

Default argument фиксирует текущее значение.

## 11. Функции первого класса

```python
def apply(func, x):
    return func(x)

apply(abs, -10)
```

Именно поэтому:
- callbacks;
- `key=` в `sorted`;
- decorators;
- higher-order functions
естественны в Python.

## 12. Decorator

Decorator принимает функцию и возвращает новую функцию.

```python
def log_call(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper
```

```python
@log_call
def predict(x):
    return x * 2
```

эквивалентно:

```python
predict = log_call(predict)
```

## 13. `functools.wraps`

Wrapper скрывает metadata original function.

Неправильно:

```python
def log_call(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

Правильно:

```python
from functools import wraps

def log_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Вызов {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

## 14. Decorator with parameters

```python
def repeat(n):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(n):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator
```

Несколько уровней — consequence того, что function objects можно возвращать.

## 15. Pure functions

Функция удобнее для DS pipeline, если:
- output зависит от explicit input;
- нет hidden global mutation;
- behavior predictable.

Например:

```python
def add_ratio(df):
    out = df.copy()
    out["ratio"] = out["a"] / out["b"]
    return out
```

проще тестировать, чем мутирующий глобальный DataFrame.

## Визуализация DataPath

LEGB search path и closure cell, плюс разбор `@decorator` как обычного присваивания.

## Типичные ошибки

- mutable default arguments;
- чрезмерный `global`;
- late binding lambdas;
- потеря metadata без `wraps`;
- `**kwargs` вместо ясного API.

## Проверка понимания

1. Что делает `*args`?
2. Что делает `**kwargs`?
3. LEGB?
4. `global` vs `nonlocal`?
5. Что такое closure?
6. Почему lambdas в loop видят последнее `i`?
7. Что реально делает `@decorator`?

## Мини-практика

Напишите decorator `timer`, который:
- принимает функцию;
- измеряет runtime;
- возвращает original result;
- сохраняет `__name__`.

## Итог

Функции — объекты. Scope и closures объясняют callbacks/decorators без магии.

## Куда дальше

Следующий шаг — понять протокол итерации и почему generator позволяет обрабатывать
миллионы строк без построения огромных промежуточных списков.
