---
title: 12. Модули, файлы, pathlib и окружения
id: concept.python.12-modules-files-pathlib-environments
type: concept
area: python
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
aliases:
- Python modules and environments
tags:
- python/core
- python/tooling
---

# 12. Модули, файлы, pathlib и окружения

## Модуль и пакет

Любой `.py` файл является модулем. Папка с модулями образует пакет; в современном Python `__init__.py` часто используется для явной структуры и публичного API.

```text
project/
  pyproject.toml
  src/my_project/
    __init__.py
    data.py
    train.py
```

Импорт:

```python
from my_project.data import load_dataset
```

Код на верхнем уровне модуля выполняется при первом импорте. Поэтому загрузку гигантского датасета или запуск обучения нельзя помещать прямо в импортируемый файл.

## `if __name__ == "__main__"`

```python
def main() -> None:
    print("Запуск pipeline")

if __name__ == "__main__":
    main()
```

При прямом запуске `__name__` равно `"__main__"`, а при импорте — имени модуля. Это отделяет библиотечную логику от CLI-входа.

## Абсолютные и относительные импорты

Внутри проекта предпочитайте ясные абсолютные импорты:

```python
from my_project.features import build_features
```

Относительные (`from .features import ...`) допустимы внутри пакета, но чрезмерная вложенность усложняет понимание.

Не добавляйте пути через `sys.path.append` как постоянное решение: это обычно признак неправильного запуска или структуры.

## `pathlib`

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
path = DATA / "train.parquet"
```

Полезные операции:

```python
path.exists()
path.parent.mkdir(parents=True, exist_ok=True)
text = path.read_text(encoding="utf-8")
path.write_text("result", encoding="utf-8")
files = list(DATA.glob("*.csv"))
```

Не склеивайте пути через `"/"` в строках. `Path` корректно работает на macOS, Linux и Windows.

## Текстовые и бинарные файлы

```python
with path.open("r", encoding="utf-8") as stream:
    text = stream.read()
```

Для текста всегда указывайте encoding. Для бинарных данных используют режимы `rb` и `wb`.

Большой файл лучше читать потоково:

```python
with path.open(encoding="utf-8") as stream:
    for line in stream:
        process(line)
```

## JSON и YAML

```python
import json

config = json.loads(path.read_text(encoding="utf-8"))
path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
```

Конфигурация из файла всё равно является внешними данными и требует проверки типов и обязательных полей.

## Виртуальное окружение

Окружение изолирует зависимости проекта. Типичный путь:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
```

На Windows активация отличается, но запуск через менеджер проекта может скрыть детали.

Современный `pyproject.toml` хранит metadata, зависимости и настройки инструментов. Lock-файл фиксирует конкретные версии для повторяемой установки.

## Версии и воспроизводимость

Фраза «у меня работает» недостаточна. Сохраняйте:

- версию Python;
- прямые и транзитивные зависимости;
- seed;
- конфигурацию;
- commit кода;
- идентификатор данных;
- путь к артефакту модели.

Не копируйте случайный `pip freeze` из глобального окружения с десятками лишних пакетов.

## Переменные окружения

Секреты и machine-specific пути не должны попадать в Git.

```python
import os

api_url = os.environ.get("API_URL", "http://localhost:8000")
```

Для обязательного секрета лучше падать с понятной ошибкой, чем молча подставлять небезопасный default.

## Частые ошибки

- запускать файл из случайной рабочей директории и зависеть от неё;
- использовать абсолютные пути пользователя;
- коммитить `.venv`, данные и секреты;
- выполнять тяжёлую работу при импорте;
- циклические импорты из-за смешения ответственности;
- не фиксировать версии;
- читать текст без encoding;
- скрывать неверный путь, возвращая пустые данные.

## Связи

- [[07_Исключения_и_Context_Manager]] — безопасная работа с ресурсами.
- [[10_Python_для_Data_Science]] — структура DS-проекта.
- [[11_Typing_Testing_Code_Quality]] — инструменты качества.
