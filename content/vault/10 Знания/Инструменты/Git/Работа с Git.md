---
type: practice
area: ml
status: seedling
created: 2026-07-06
updated: 2026-07-06
tags:
  - project
  - projects
  - ml
source:
title: "Git"
id: practice.ml.git
schema_version: 2
language: ru
rag: include
rag_collection: practice
app: source
---
# Git
## **1. Первоначальная настройка Git**

Выполняется один раз на компьютере:
```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your-email@example.com"
# Проверить настройки
git config --global --list
```

## **2. Создание нового проекта**

```bash
# Создать папку проекта
mkdir my-project
cd my-project

# Инициализировать Git
git init

# Использовать main как главную ветку
git branch -M main

# Создать README
echo "# My Project" > README.md

# Создать .gitignore
touch .gitignore

# Посмотреть состояние репозитория
git status

# Добавить файлы в будущий коммит
git add .

# Создать первый коммит
git commit -m "Initial commit"
```
## **3. Создание рабочей ветки**

Обычно новую функциональность разрабатывают не в `main`, а в отдельной ветке:
```bash
# Создать ветку и сразу перейти в неё
git switch -c feature/project-setup
# Альтернативная старая команда
git checkout -b feature/project-setup
```
Посмотреть ветки:
```bash
git branch
```
## **4. Обычный цикл работы**

После изменения файлов:
```bash
# Посмотреть изменённые файлы
git status

# Посмотреть конкретные изменения
git diff

# Добавить все изменения
git add .

# Создать коммит
git commit -m "Add project configuration"
```
Можно добавлять конкретный файл:
```bash
git add src/main.py
git commit -m "Add application entry point"
```
Просмотр истории:
```bash
git log --oneline --graph --decorate --all
```
## **5. Подключение GitHub**

Сначала создай пустой репозиторий на GitHub. Не добавляй через интерфейс GitHub `README`, `.gitignore` и лицензию, если они уже есть локально.

После создания репозитория GitHub покажет адрес. Для SSH:
```bash
git remote add origin git@github.com:USERNAME/REPOSITORY.git
```
Отправить главную ветку:
```bash
git push -u origin main
```
Отправить рабочую ветку:
```bash
git push -u origin feature/project-setup
```
После первого `push -u` для этой ветки достаточно:
```bash
git push
```
## **6. Объединение рабочей ветки с main**

Когда работа в ветке завершена:
```bash
# Перейти в main
git switch main

# Получить актуальную версию с GitHub
git pull origin main

# Объединить рабочую ветку с main
git merge feature/project-setup

# Отправить обновлённый main на GitHub
git push origin main
```
Удалить завершённую локальную ветку:
```bash
git branch -d feature/project-setup
```
Удалить ветку на GitHub:
```bash
git push origin --delete feature/project-setup
```
## **7. Готовый блок для нового проекта**

Замени `my-project`, `USERNAME` и `REPOSITORY`:
```bash
mkdir my-project
cd my-project

git init
git branch -M main

echo "# My Project" > README.md
touch .gitignore

git add .
git commit -m "Initial commit"

git remote add origin git@github.com:USERNAME/REPOSITORY.git
git push -u origin main

git switch -c develop
git push -u origin develop
```
## **8. Ежедневная работа**
```bash
# Перейти в рабочую ветку
git switch develop

# Получить свежие изменения
git pull

# Создать ветку под новую задачу
git switch -c feature/new-feature

# После работы
git status
git diff
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```
После объединения ветки через Pull Request на GitHub:
```bash
git switch develop
git pull
git branch -d feature/new-feature
```
Хороший формат названий веток:
```bash
feature/user-auth
feature/payment-page
fix/login-error
refactor/database-layer
docs/update-readme
```
Хороший формат коммитов:
```bash
Initial commit
Add user authentication
Fix login validation error
Update installation instructions
Refactor database connection
Remove unused configuration
```

## Связи

- [[Инструменты — карта]]
- [[Главная]]
