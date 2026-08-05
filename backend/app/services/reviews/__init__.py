"""Пакет интервального повторения (Фаза 5).

- registry.py   — ReviewTemplate + ReviewTemplateRegistry (детерминированная оценка);
- templates.py  — 15 review templates MVP-маршрута;
- clock.py      — детерминированное время и timezone-границы;
- scheduler.py  — SM-2-like расписание (Again/Hard/Good/Easy);
- queue.py      — bootstrap очереди, приоритет, summary;
- answer.py     — submit/skip, dedup, evidence в KnowledgeModelService.
"""
