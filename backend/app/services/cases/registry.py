"""Registry кейсов (Фаза 4): мини-кейс и итоговый кейс модуля.

Исполняемая структура кейсов определена в Python-реестре; контент vault
(05 Курсы/Классический ML/Кейсы/...) остаётся каноническим описанием и
не изменяется. Каждый кейс ссылается на content ID заметки (`content_id`).

Поддерживаются только структурированные ответы:
- single   — один вариант из списка;
- multiple — несколько вариантов;
- numeric  — число (с допуском);
- select   — выбор параметра/модели из списка;
- order    — упорядочивание вариантов.

Режимы:
- guided     — подсказки по шагам + подробная обратная связь;
- standard   — без промежуточных подсказок;
- interview  — краткая формулировка вопросов, итоговый разбор.

Оценка детерминированная: по каждому вопросу считается score 0..1,
итоговый результат — взвешенное среднее. Evidence создаётся по нескольким
навыкам через KnowledgeModelService (вес mini-case 1.5, module-case 2.0).
"""

# Case prompt/explanation pairs stay adjacent so reviewers can validate the
# deterministic answer key without jumping between data files.
# ruff: noqa: E501

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class CaseQuestion:
    """Один вопрос кейса (структурированный)."""

    id: str
    type: str  # single | multiple | numeric | select | order
    prompt: str
    options: list[str] = field(default_factory=list)
    correct: Any = None  # индекс(ы), число или порядок
    numeric_tolerance: float = 0.01
    weight: float = 1.0
    hint: str | None = None
    explanation: str | None = None
    # Семантическая категория для разбора (не влияет на оценку).
    topic: str | None = None


@dataclass
class Case:
    """Определение кейса."""

    id: str
    title: str
    content_id: str
    description: str
    practice_kind: str
    lesson_ids: list[str]
    skill_ids: list[str]
    estimated_minutes: int | None = None
    difficulty: str | None = None
    questions: list[CaseQuestion] = field(default_factory=list)
    intro: str = ""
    conclusion: str = ""

    def spec(self, mode: str = "standard") -> dict[str, Any]:
        """Спецификация для UI (без правильных ответов).

        В режиме guided добавляются подсказки; в interview — краткая
        формулировка вопросов (тот же prompt).
        """
        questions = []
        for q in self.questions:
            item: dict[str, Any] = {
                "id": q.id,
                "type": q.type,
                "prompt": q.prompt,
                "options": q.options,
                "weight": q.weight,
                "topic": q.topic,
            }
            if mode == "guided" and q.hint:
                item["hint"] = q.hint
            if mode == "interview":
                # Короткая формулировка: для interview не даём полный контекст-подсказку.
                item["interview_prompt"] = q.prompt
            questions.append(item)
        return {
            "id": self.id,
            "title": self.title,
            "content_id": self.content_id,
            "description": self.description,
            "practice_kind": self.practice_kind,
            "lesson_ids": list(self.lesson_ids),
            "skill_ids": list(self.skill_ids),
            "estimated_minutes": self.estimated_minutes,
            "difficulty": self.difficulty,
            "intro": self.intro,
            "conclusion": self.conclusion,
            "mode": mode,
            "questions": questions,
        }

    # --- Проверка ответов (детерминированная) ---

    def _score_answer(self, question: CaseQuestion, answer: Any) -> tuple[float, bool, str]:
        """Возвращает (score 0..1, полностью_верно, объяснение)."""
        if question.type == "single":
            return self._check_single(question, answer)
        if question.type == "multiple":
            return self._check_multiple(question, answer)
        if question.type == "numeric":
            return self._check_numeric(question, answer)
        if question.type == "select":
            return self._check_single(question, answer)
        if question.type == "order":
            return self._check_order(question, answer)
        return 0.0, False, f"Неизвестный тип вопроса {question.type}."

    def _check_single(self, question: CaseQuestion, answer: Any) -> tuple[float, bool, str]:
        correct = question.correct
        if answer == correct:
            return 1.0, True, question.explanation or "Верно."
        return (
            0.0,
            False,
            question.explanation
            or f"Неверно. Правильный ответ: {self._display_correct(question)}.",
        )

    def _check_multiple(self, question: CaseQuestion, answer: Any) -> tuple[float, bool, str]:
        correct: list = list(question.correct or [])
        if not isinstance(answer, list):
            answer = []
        answer_set = set(answer)
        correct_set = set(correct)
        if answer_set == correct_set:
            return 1.0, True, question.explanation or "Верно: выбраны все нужные варианты."
        if answer_set <= correct_set and answer_set:
            return (
                0.5,
                False,
                "Частично верно: выбраны правильные варианты, но не все.",
            )
        if answer_set and correct_set and answer_set.issubset(correct_set):
            return 0.5, False, "Частично верно."
        return (
            0.0,
            False,
            question.explanation
            or f"Неверно. Правильный набор: {self._display_correct(question)}.",
        )

    def _check_numeric(self, question: CaseQuestion, answer: Any) -> tuple[float, bool, str]:
        try:
            value = float(answer)
        except (TypeError, ValueError):
            return 0.0, False, "Нужно ввести число."
        correct = float(question.correct)
        if abs(value - correct) <= question.numeric_tolerance:
            return 1.0, True, question.explanation or "Верно."
        return (
            0.0,
            False,
            question.explanation or f"Неверно. Ожидалось ≈ {correct:.3g}, получено {value:.3g}.",
        )

    def _check_order(self, question: CaseQuestion, answer: Any) -> tuple[float, bool, str]:
        correct: list = list(question.correct or [])
        if not isinstance(answer, list):
            answer = []
        if answer == correct:
            return 1.0, True, question.explanation or "Порядок верный."
        if len(answer) == len(correct):
            matches = sum(1 for a, c in zip(answer, correct, strict=True) if a == c)
            if matches > 0:
                return (
                    round(matches / len(correct), 3),
                    False,
                    f"Частично: {matches} из {len(correct)} позиций на месте.",
                )
        return (
            0.0,
            False,
            question.explanation
            or f"Неверный порядок. Правильный: {self._display_correct(question)}.",
        )

    def _display_correct(self, question: CaseQuestion) -> str:
        if question.type in ("single", "select"):
            idx = question.correct
            if isinstance(idx, int) and 0 <= idx < len(question.options):
                return f"{idx + 1}. {question.options[idx]}"
            return str(idx)
        if question.type == "multiple":
            parts = []
            for idx in question.correct or []:
                if isinstance(idx, int) and 0 <= idx < len(question.options):
                    parts.append(f"{idx + 1}. {question.options[idx]}")
                else:
                    parts.append(str(idx))
            return "; ".join(parts) if parts else "—"
        if question.type == "order":
            parts = []
            for idx in question.correct or []:
                if isinstance(idx, int) and 0 <= idx < len(question.options):
                    parts.append(f"{idx + 1}. {question.options[idx]}")
                else:
                    parts.append(str(idx))
            return " → ".join(parts) if parts else "—"
        return str(question.correct)

    def evaluate(self, answers: dict[str, Any], mode: str = "standard") -> dict[str, Any]:
        """Проверяет ответы, считает результат и объяснение."""
        question_results = []
        total_weight = 0.0
        weighted = 0.0
        for question in self.questions:
            answer = answers.get(question.id)
            if answer is None:
                score, ok, explanation = 0.0, False, "Нет ответа."
            else:
                score, ok, explanation = self._score_answer(question, answer)
            total_weight += question.weight
            weighted += score * question.weight
            question_results.append(
                {
                    "question_id": question.id,
                    "topic": question.topic,
                    "type": question.type,
                    "score": score,
                    "correct": ok,
                    "explanation": explanation,
                    "your_answer": answer,
                }
            )
        total = round(weighted / total_weight, 3) if total_weight > 0 else 0.0
        passed = total >= 0.7

        # Ошибки для error_taxonomy по каждому неправильному вопросу.
        error_codes = []
        for question in self.questions:
            answer = answers.get(question.id)
            if answer is None:
                continue
            score, _, _ = self._score_answer(question, answer)
            if score < 0.5:
                code = self._error_code_for_question(question)
                if code:
                    error_codes.append(code)

        return {
            "case_id": self.id,
            "mode": mode,
            "total_score": total,
            "passed": passed,
            "question_results": question_results,
            "error_codes": error_codes,
            "summary": self._summary_text(total, passed),
            "conclusion": self.conclusion,
        }

    def _error_code_for_question(self, question: CaseQuestion) -> str | None:
        mapping = {
            "theory": "missing_definition",
            "apply": "wrong_assumption",
            "interpret": "wrong_validation",
            "overfitting": "wrong_validation",
            "metrics": "metric_mismatch",
            "data": "data_leakage",
        }
        return mapping.get(question.topic or "")

    def _summary_text(self, total: float, passed: bool) -> str:
        if passed:
            return f"Кейс выполнен: {total:.0%} правильных ответов. Уверенная работа с материалом."
        if total >= 0.4:
            return (
                f"Кейс выполнен частично ({total:.0%}). "
                "Разберите вопросы с объяснениями и повторите слабые темы."
            )
        return (
            f"Результат {total:.0%}. Рекомендуем перечитать теорию "
            "и вернуться к кейсу после практики."
        )


class CaseRegistry:
    """Реестр кейсов: единая точка регистрации и оценки."""

    def __init__(self, cases: list[Case] | None = None) -> None:
        self._cases: dict[str, Case] = {}
        for case in cases or []:
            self.register(case)

    def register(self, case: Case) -> None:
        if not case.id:
            raise ValueError("Кейс должен иметь id")
        self._cases[case.id] = case

    def get(self, case_id: str) -> Case | None:
        return self._cases.get(case_id)

    def ids(self) -> list[str]:
        return sorted(self._cases)

    def list_specs(self, mode: str = "standard") -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for case_id in self.ids():
            spec = self.spec(case_id, mode)
            if spec is not None:
                result.append(spec)
        return result

    def spec(self, case_id: str, mode: str = "standard") -> dict[str, Any] | None:
        case = self.get(case_id)
        return case.spec(mode) if case is not None else None

    def evaluate(self, case_id: str, answers: dict[str, Any], mode: str) -> dict[str, Any] | None:
        case = self.get(case_id)
        if case is None:
            return None
        return case.evaluate(answers, mode)


# --- Мини-кейс: «Выбор ансамбля для оттока» (vault: 05 Курсы/.../Кейсы/03) ---


def _mini_case() -> Case:
    return Case(
        id="case.classic-ml.tree-ensemble-choice",
        title="Мини-кейс: выбор ансамбля для оттока",
        content_id="case.classic-ml.tree-ensemble-choice",
        description=(
            "Сравнить Decision Tree, Random Forest и CatBoost на одном split: "
            "диагностировать переобучение, выбрать модель с учётом качества, "
            "времени и объяснимости, предложить следующий эксперимент."
        ),
        practice_kind="mini-case",
        lesson_ids=[
            "lesson.classic-ml.trees.tree",
            "lesson.classic-ml.linear.regularization",
            "lesson.classic-ml.trees.forest",
            "lesson.classic-ml.boosting.gradient",
            "lesson.classic-ml.boosting.catboost",
        ],
        skill_ids=[
            "ml.tree_ensembles",
            "ml.bias_variance_regularization",
            "ml.error_analysis",
        ],
        estimated_minutes=60,
        difficulty="standard",
        intro=(
            "Задача: предсказать отток клиентов. Вы обучили Decision Tree, "
            "Random Forest и CatBoost на одном train/val split. Ниже — результаты."
        ),
        conclusion=(
            "Итог: RF — разумный дефолт для качества и устойчивости; CatBoost "
            "сильнее при категориальных признаках, но дороже; одно дерево — "
            "для интерпретируемости, если точность допустима."
        ),
        questions=[
            CaseQuestion(
                id="q1",
                type="single",
                topic="overfitting",
                prompt=(
                    "Decision Tree (глубина 25): train ROC-AUC 0.99, val ROC-AUC 0.78. "
                    "Что это скорее всего?"
                ),
                options=[
                    "Случайный шум в данных",
                    "Переобучение: дерево слишком глубокое",
                    "Недообучение из-за малой глубины",
                    "Проблема с метрикой, а не с моделью",
                ],
                correct=1,
                weight=1.0,
                hint=(
                    "Сравните train и val: большой разрыв при высокой train-точности "
                    "— классический признак overfit."
                ),
                explanation=(
                    "Глубокое дерево запоминает обучающую выборку (train 0.99) и "
                    "плохо обобщает (val 0.78) — это переобучение. Снизьте max_depth "
                    "или добавьте ограничения (min_samples_leaf)."
                ),
            ),
            CaseQuestion(
                id="q2",
                type="multiple",
                topic="apply",
                prompt="Какие приёмы напрямую снижают variance ансамбля деревьев?",
                options=[
                    "Больше деревьев в ансамбле (усреднение)",
                    "Уменьшение max_depth каждого дерева",
                    "Bootstrap-выборки (bagging)",
                    "Использование одного очень глубокого дерева",
                ],
                correct=[0, 1, 2],
                weight=1.0,
                hint=(
                    "Bagging и усреднение уменьшают variance; ограничение глубины "
                    "тоже снижает variance ценой bias."
                ),
                explanation=(
                    "Усреднение многих деревьев, bootstrap-выборки и ограничение "
                    "глубины снижают variance. Одно глубокое дерево — наоборот, "
                    "увеличивает variance."
                ),
            ),
            CaseQuestion(
                id="q3",
                type="numeric",
                topic="interpret",
                prompt=(
                    "Random Forest с 200 деревьями, val ROC-AUC 0.86; CatBoost — 0.87; "
                    "дерево — 0.78. На сколько процентных пунктов RF отстаёт от CatBoost?"
                ),
                correct=1.0,
                numeric_tolerance=0.11,
                weight=1.0,
                hint="Разница 0.87 − 0.86 = 0.01 → 1 п.п.",
                explanation="0.87 − 0.86 = 0.01, то есть 1 процентный пункт.",
            ),
            CaseQuestion(
                id="q4",
                type="select",
                topic="apply",
                prompt=(
                    "Бизнес требует интерпретируемости и готов жертвовать качеством. "
                    "Какую модель выбрать?"
                ),
                options=[
                    "Decision Tree глубиной 4",
                    "Random Forest из 200 деревьев",
                    "CatBoost с глубоким бустингом",
                    "Любой ансамбль — интерпретируемость не важна",
                ],
                correct=0,
                weight=1.0,
                hint="Одно неглубокое дерево легко объяснить; ансамбли — сложнее.",
                explanation=(
                    "Неглубокое дерево (глубина 3–5) — стандартный интерпретируемый "
                    "baseline: правила легко показать заказчику."
                ),
            ),
            CaseQuestion(
                id="q5",
                type="order",
                topic="apply",
                prompt="Упорядочьте шаги эксперимента (от первого к последнему):",
                options=[
                    "Зафиксировать train/val split и метрику",
                    "Обучить baseline (логистика или дерево)",
                    "Обучить RF и CatBoost на том же split",
                    "Сравнить метрики и выбрать модель",
                    "Диагностировать ошибки на val",
                ],
                correct=[0, 1, 2, 3, 4],
                weight=1.0,
                hint=(
                    "Сначала контракт (split, метрика), затем baseline, затем "
                    "кандидаты, сравнение и error analysis."
                ),
                explanation=(
                    "Корректный пайплайн: контракт → baseline → кандидаты → "
                    "сравнение → анализ ошибок."
                ),
            ),
        ],
    )


# --- Итоговый кейс: «Churn end-to-end» (vault: 05 Курсы/.../Кейсы/05) ---


def _module_case() -> Case:
    return Case(
        id="case.classic-ml.churn-end-to-end",
        title="Итоговый кейс: Churn end-to-end",
        content_id="case.classic-ml.churn-end-to-end",
        description=(
            "От постановки задачи до защиты решения: prediction contract, "
            "reproducible pipeline, сравнение моделей, threshold policy, "
            "error analysis, model card."
        ),
        practice_kind="module-case",
        lesson_ids=[
            "lesson.classic-ml.trees.tree",
            "lesson.classic-ml.linear.regularization",
            "lesson.classic-ml.trees.forest",
            "lesson.classic-ml.boosting.gradient",
            "lesson.classic-ml.boosting.catboost",
        ],
        skill_ids=[
            "ml.problem_framing",
            "ml.validation_split",
            "ml.data_leakage",
            "ml.metrics_threshold",
            "ml.linear_logistic_models",
            "ml.tree_ensembles",
            "ml.error_analysis",
        ],
        estimated_minutes=150,
        difficulty="standard",
        intro=(
            "Полный цикл: определить метрику и контракт, собрать пайплайн, "
            "сравнить модели (LR, DT, RF, CatBoost), выбрать порог, "
            "проанализировать ошибки и подготовить model card."
        ),
        conclusion=(
            "Решение: RF или CatBoost в зависимости от бюджета; threshold по "
            "стоимости ошибок; ошибки анализируются по сегментам; "
            "model card фиксирует ограничения и допущения."
        ),
        questions=[
            CaseQuestion(
                id="q1",
                type="single",
                topic="data",
                prompt=(
                    "Вы собрали признаки из истории клиента за прошлый месяц, "
                    "включая «статус оттока» из той же записи. Что нарушено?"
                ),
                options=[
                    "Ничего: признаки и таргет из одной таблицы — нормально",
                    "Data leakage: таргет используется при построении признаков",
                    "Метрика выбрана неверно",
                    "Не хватает признаков",
                ],
                correct=1,
                weight=1.0,
                hint="Может ли признак «содержать ответ» до момента прогноза?",
                explanation=(
                    "Если признак строится с использованием будущего/таргета — "
                    "это data leakage: модель «подсматривает» ответ."
                ),
            ),
            CaseQuestion(
                id="q2",
                type="single",
                topic="metrics",
                prompt=(
                    "Отток редкий: 8% клиентов. Какая метрика обманывает "
                    "при naive-модели «все не уходят»?"
                ),
                options=[
                    "Accuracy",
                    "ROC-AUC",
                    "Log-loss",
                    "Precision@k",
                ],
                correct=0,
                weight=1.0,
                hint="Accuracy = 92% у модели, которая вообще никого не предсказывает.",
                explanation=(
                    "При дисбалансе accuracy завышена: naive-модель получает 92%. "
                    "Используйте ROC-AUC, precision/recall или log-loss."
                ),
            ),
            CaseQuestion(
                id="q3",
                type="multiple",
                topic="metrics",
                prompt="Какие элементы нужны в prediction contract?",
                options=[
                    "Определение таргета и горизонта прогноза",
                    "Метрика и порог принятия решения",
                    "Допущения о распределении данных",
                    "Только имя модели",
                ],
                correct=[0, 1, 2],
                weight=1.0,
                hint=(
                    "Контракт фиксирует, ЧТО предсказываем, КАК оцениваем и при каких допущениях."
                ),
                explanation=(
                    "Prediction contract: таргет/горизонт, метрика+порог, "
                    "допущения. Имя модели — не контракт."
                ),
            ),
            CaseQuestion(
                id="q4",
                type="numeric",
                topic="metrics",
                prompt=(
                    "Стоимость пропущенного оттока = 100 у.е., ложной тревоги = 10 у.е. "
                    "При recall 0.7 и precision 0.5 на 1000 реальных уходящих клиентов "
                    "модель корректно находит 700. Сколько у.е. составляет стоимость "
                    "пропущенных оттоков?"
                ),
                correct=30000.0,
                numeric_tolerance=1.0,
                weight=1.0,
                hint="Пропущено 1000 − 700 = 300 клиентов; каждый стоит 100 у.е.",
                explanation=(
                    "300 пропущенных × 100 = 30 000 у.е. — стоимость пропущенных оттоков."
                ),
            ),
            CaseQuestion(
                id="q5",
                type="select",
                topic="apply",
                prompt=(
                    "Качество RF и CatBoost близко (0.86 vs 0.87), но у команды "
                    "нет GPU и нужно объяснять решения. Что выбрать?"
                ),
                options=[
                    "Random Forest (быстро, устойчиво, feature importance)",
                    "CatBoost любой ценой (он лучший по ROC-AUC)",
                    "Одно дерево глубины 1",
                    "Все три модели в продакшене параллельно",
                ],
                correct=0,
                weight=1.0,
                hint=(
                    "Учтите бюджет вычислений и объяснимость; разница 0.01 "
                    "в ROC-AUC может быть незначимой."
                ),
                explanation=(
                    "При близком качестве и ограничении вычислительных ресурсов "
                    "RF — разумный выбор: быстрый, устойчивый, с feature importance."
                ),
            ),
            CaseQuestion(
                id="q6",
                type="order",
                topic="apply",
                prompt="Упорядочьте этапы end-to-end пайплайна:",
                options=[
                    "Собрать prediction contract и метрику",
                    "Построить baseline (LR или дерево)",
                    "Проверить отсутствие leakage в split",
                    "Сравнить модели на одном split",
                    "Выбрать threshold по стоимости ошибок",
                    "Проанализировать ошибки и написать model card",
                ],
                correct=[0, 1, 2, 3, 4, 5],
                weight=1.0,
                hint=(
                    "Сначала контракт и baseline, затем валидация split, сравнение, порог и анализ."
                ),
                explanation=(
                    "Полный цикл: контракт → baseline → контроль leakage → "
                    "сравнение → threshold policy → error analysis + model card."
                ),
            ),
        ],
    )


def _domain_cases() -> list[Case]:
    """Короткие decision cases по основным специализациям DataPath."""
    return [
        Case(
            id="case.ml.credit-scoring",
            title="Credit scoring: решение под стоимость ошибок",
            content_id="case.ml.credit-scoring",
            description="Выбрать split, metric, threshold и объяснение решения для кредитного риска.",
            practice_kind="mini-case",
            lesson_ids=["lesson.classic-ml.linear.logistic", "lesson.classic-ml.framing.metrics"],
            skill_ids=["ml.metrics_threshold", "ml.linear_logistic_models", "ml.data_leakage"],
            estimated_minutes=18,
            difficulty="standard",
            intro="Дефолт редкий, цена пропущенного риска выше цены ручной проверки.",
            conclusion="Temporal split, PR/recall под constraint, calibrated probability и понятная reason code.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="data",
                    prompt="Application date предшествует outcome на 90 дней. Какой split честнее?",
                    options=[
                        "Random по строкам",
                        "Temporal: train прошлое, validation будущее",
                        "По target",
                        "Один train",
                    ],
                    correct=1,
                    hint="Модель будет применяться к будущим заявкам.",
                    explanation="Temporal split воспроизводит реальный порядок и обнаруживает drift.",
                ),
                CaseQuestion(
                    id="q2",
                    type="multiple",
                    topic="metrics",
                    prompt="Что нужно проверить до выбора threshold?",
                    options=[
                        "Стоимость FP/FN",
                        "Calibration probabilities",
                        "Capacity manual review",
                        "Только accuracy",
                    ],
                    correct=[0, 1, 2],
                    explanation="Порог — бизнес-решение с cost/capacity; accuracy сама его не определяет.",
                ),
                CaseQuestion(
                    id="q3",
                    type="single",
                    topic="interpret",
                    prompt="Коэффициент Logistic Regression равен 0.7. Корректная интерпретация?",
                    options=[
                        "Probability выросла на 70%",
                        "Odds умножаются на exp(0.7) при +1, прочее фиксировано",
                        "Класс всегда 1",
                        "Это threshold",
                    ],
                    correct=1,
                    explanation="Линейный коэффициент действует на log-odds, не напрямую на probability.",
                ),
            ],
        ),
        Case(
            id="case.ml.house-prices",
            title="House prices: честная оценка регрессии",
            content_id="case.ml.house-prices",
            description="Обработать skew, leakage и неодинаковую стоимость ошибки в прогнозе цены.",
            practice_kind="mini-case",
            lesson_ids=[
                "lesson.classic-ml.linear.regression",
                "lesson.data-tools.sklearn-pipeline",
            ],
            skill_ids=["ml.linear_regression", "ml.validation_split", "sklearn.pipeline"],
            estimated_minutes=16,
            difficulty="foundation-core",
            intro="Есть площадь, район, год, состояние и финальная цена сделки.",
            conclusion="Pipeline внутри CV, MAE как понятный baseline, log-target при сильном skew и анализ residuals.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="data",
                    prompt="Какой признак является leakage для оценки до сделки?",
                    options=[
                        "Площадь",
                        "Район",
                        "Итоговая комиссия агента как процент цены сделки",
                        "Год постройки",
                    ],
                    correct=2,
                    explanation="Комиссия рассчитана из будущей final price и недоступна в момент прогноза.",
                ),
                CaseQuestion(
                    id="q2",
                    type="single",
                    topic="metrics",
                    prompt="Нужна ошибка в рублях, устойчивее к дорогим выбросам. Базовая metric?",
                    options=["Accuracy", "MAE", "ROC-AUC", "Log-loss"],
                    correct=1,
                    explanation="MAE измеряется в единицах target и слабее MSE реагирует на extreme prices.",
                ),
                CaseQuestion(
                    id="q3",
                    type="order",
                    topic="apply",
                    prompt="Упорядочьте workflow:",
                    options=[
                        "Split",
                        "Fit preprocessing только на train",
                        "CV моделей",
                        "Residual analysis",
                    ],
                    correct=[0, 1, 2, 3],
                    explanation="Split предшествует fit preprocessing; residuals анализируют после честной оценки.",
                ),
            ],
        ),
        Case(
            id="case.ml.fraud-detection",
            title="Fraud detection: дисбаланс и delayed labels",
            content_id="case.ml.fraud-detection",
            description="Выбрать метрику и threshold при 0.3% fraud и ограничении команды проверки.",
            practice_kind="mini-case",
            lesson_ids=["lesson.classic-ml.expansion.19", "lesson.classic-ml.framing.metrics"],
            skill_ids=["ml.imbalance", "ml.metrics_threshold", "ml.validation_split"],
            estimated_minutes=20,
            difficulty="interview",
            intro="Можно проверить вручную только 500 из 100 000 операций в день.",
            conclusion="Temporal validation, Precision@500/Recall, threshold по capacity и мониторинг label delay.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="metrics",
                    prompt="Какая operating metric прямо учитывает capacity 500?",
                    options=["Accuracy", "Precision@500 вместе с Recall", "R²", "Train loss"],
                    correct=1,
                    explanation="Top-k metric измеряет качество именно на доступном бюджете проверок.",
                ),
                CaseQuestion(
                    id="q2",
                    type="single",
                    topic="data",
                    prompt="Chargeback приходит через 30 дней. Что нельзя делать?",
                    options=[
                        "Temporal cutoff",
                        "Считать последние 30 дней полностью размеченными negative",
                        "Хранить mature validation",
                        "Мониторить label delay",
                    ],
                    correct=1,
                    explanation="Незрелые labels создают ложные negatives и смещают оценку.",
                ),
                CaseQuestion(
                    id="q3",
                    type="multiple",
                    topic="apply",
                    prompt="Какие проверки нужны по сегментам?",
                    options=[
                        "Country/device",
                        "New vs returning user",
                        "Amount bands",
                        "Только global accuracy",
                    ],
                    correct=[0, 1, 2],
                    explanation="Global metric скрывает провал отдельных fraud patterns.",
                ),
            ],
        ),
        Case(
            id="case.ml.customer-segmentation",
            title="Customer segmentation: K-Means с бизнес-смыслом",
            content_id="case.classic-ml.customer-segmentation",
            description="Подготовить RFM-признаки, выбрать scaling/k и проверить полезность сегментов.",
            practice_kind="mini-case",
            lesson_ids=[
                "lesson.classic-ml.unsupervised.kmeans",
                "lesson.classic-ml.unsupervised.pca",
            ],
            skill_ids=["ml.clustering", "ml.preprocessing", "ml.interpretability"],
            estimated_minutes=16,
            difficulty="standard",
            intro="Маркетинг хочет 4–6 понятных customer groups, target отсутствует.",
            conclusion="Scale RFM, сравните stability/silhouette, профилируйте clusters и проверяйте actionability.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="apply",
                    prompt="Monetary в тысячах, frequency 1–20. Что сделать до K-Means?",
                    options=[
                        "Ничего",
                        "Scale features и проверить skew/outliers",
                        "Добавить target",
                        "Удалить frequency",
                    ],
                    correct=1,
                    explanation="Euclidean distance иначе почти полностью определяется Monetary.",
                ),
                CaseQuestion(
                    id="q2",
                    type="multiple",
                    topic="interpret",
                    prompt="Как проверить, что clusters полезны?",
                    options=[
                        "Stability по seeds/samples",
                        "Профили признаков",
                        "Actionable differences",
                        "Только красивый PCA plot",
                    ],
                    correct=[0, 1, 2],
                    explanation="2D plot помогает объяснять, но не доказывает stability или business value.",
                ),
                CaseQuestion(
                    id="q3",
                    type="single",
                    topic="metrics",
                    prompt="Silhouette выше при k=2, но бизнесу нужны 4 устойчивые стратегии. Что выбрать?",
                    options=[
                        "Всегда k=2",
                        "Сравнить k=4 по stability и actionability; metric не единственный критерий",
                        "k=20",
                        "Random",
                    ],
                    correct=1,
                    explanation="Unsupervised selection сочетает geometric metric, устойчивость и цель использования.",
                ),
            ],
        ),
        Case(
            id="case.nlp.text-classification",
            title="Text classification: TF-IDF или Transformer",
            content_id="case.nlp.text-classification",
            description="Построить baseline, избежать duplicate leakage и выбрать разумную сложность NLP-модели.",
            practice_kind="mini-case",
            lesson_ids=["lesson.nlp.classical", "lesson.nlp.transformers"],
            skill_ids=["nlp.tfidf", "nlp.text_classification", "nlp.evaluation"],
            estimated_minutes=18,
            difficulty="standard",
            intro="Нужно классифицировать обращения поддержки по 12 темам, данных 15 тысяч.",
            conclusion="Начните с word/char TF-IDF + linear model; group duplicate threads; Transformer только после error analysis.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="apply",
                    prompt="Какой первый baseline наиболее информативен?",
                    options=[
                        "Сразу fine-tune large Transformer",
                        "TF-IDF + Logistic Regression",
                        "Random labels",
                        "K-Means",
                    ],
                    correct=1,
                    explanation="Линейный TF-IDF baseline быстр, силён и показывает, нужна ли контекстная модель.",
                ),
                CaseQuestion(
                    id="q2",
                    type="single",
                    topic="data",
                    prompt="Одна переписка разбита на несколько сообщений. Как снизить leakage?",
                    options=[
                        "Random split сообщений",
                        "Group split по thread_id",
                        "Удалить punctuation",
                        "Увеличить batch",
                    ],
                    correct=1,
                    explanation="Сообщения одного thread должны целиком попадать в один split.",
                ),
                CaseQuestion(
                    id="q3",
                    type="multiple",
                    topic="interpret",
                    prompt="Что смотреть кроме macro-F1?",
                    options=[
                        "Confusion по классам",
                        "Редкие классы",
                        "Latency",
                        "Только train accuracy",
                    ],
                    correct=[0, 1, 2],
                    explanation="Качество класса и operating constraints важнее одной aggregate metric.",
                ),
            ],
        ),
        Case(
            id="case.dl.image-classification",
            title="Image classification: transfer learning без leakage",
            content_id="case.dl.image-classification",
            description="Настроить split по объектам, augmentation и fine-tuning небольшого image dataset.",
            practice_kind="mini-case",
            lesson_ids=["lesson.deep-learning.05", "lesson.deep-learning.10"],
            skill_ids=["dl.cnn", "dl.transfer-learning", "ml.data_leakage"],
            estimated_minutes=18,
            difficulty="standard",
            intro="Есть 8 тысяч фотографий, но по 3–5 ракурсов одного объекта.",
            conclusion="Group split by object, pretrained backbone, label-preserving augmentation и staged unfreezing.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="data",
                    prompt="Как делить ракурсы одного объекта?",
                    options=[
                        "Случайно по фото",
                        "Все ракурсы объекта в одном split",
                        "По разрешению",
                        "Не нужен validation",
                    ],
                    correct=1,
                    explanation="Иначе модель видит почти тот же объект в train и validation.",
                ),
                CaseQuestion(
                    id="q2",
                    type="multiple",
                    topic="apply",
                    prompt="Что разумно на первом этапе transfer learning?",
                    options=[
                        "Заменить head",
                        "Freeze backbone",
                        "Малый lr при unfreeze",
                        "Случайная normalization",
                    ],
                    correct=[0, 1, 2],
                    explanation="Pretrained normalization нужно сохранить; head и staged fine-tuning уменьшают риск overfit.",
                ),
                CaseQuestion(
                    id="q3",
                    type="single",
                    topic="interpret",
                    prompt="Train accuracy растёт, validation падает. Первый диагноз?",
                    options=[
                        "Overfitting",
                        "Underfitting",
                        "Идеальная модель",
                        "Нужно убрать validation",
                    ],
                    correct=0,
                    explanation="Расходящиеся curves — классический сигнал overfitting.",
                ),
            ],
        ),
        Case(
            id="case.ml.recommendation-basics",
            title="Recommendation basics: offline metric и cold start",
            content_id="case.ml.recommendation-basics",
            description="Сформулировать implicit-feedback задачу и честно оценить top-k рекомендации.",
            practice_kind="mini-case",
            lesson_ids=["lesson.classic-ml.framing.validation"],
            skill_ids=["ml.problem_framing", "ml.validation_split", "ml.metrics_threshold"],
            estimated_minutes=17,
            difficulty="interview",
            intro="История содержит views, carts и purchases; нужно выдать top-10 товаров.",
            conclusion="Time split, negative sampling без future leakage, Recall/NDCG@10 и отдельная cold-start policy.",
            questions=[
                CaseQuestion(
                    id="q1",
                    type="single",
                    topic="data",
                    prompt="Какой offline split ближе к production?",
                    options=[
                        "Random interactions",
                        "Последние interactions как test",
                        "По item id",
                        "Один train",
                    ],
                    correct=1,
                    explanation="Рекомендация предсказывает будущее пользователя из прошлого.",
                ),
                CaseQuestion(
                    id="q2",
                    type="multiple",
                    topic="metrics",
                    prompt="Что полезно для top-10 evaluation?",
                    options=["Recall@10", "NDCG@10", "Coverage", "R²"],
                    correct=[0, 1, 2],
                    explanation="Нужны relevance/ranking и охват каталога; R² здесь не соответствует задаче.",
                ),
                CaseQuestion(
                    id="q3",
                    type="single",
                    topic="apply",
                    prompt="Что делать с новым пользователем без истории?",
                    options=[
                        "Ошибка сервера",
                        "Popularity/context/onboarding fallback",
                        "Случайно удалить",
                        "Использовать future purchases",
                    ],
                    correct=1,
                    explanation="Cold-start требует отдельного fallback до накопления персональных signals.",
                ),
            ],
        ),
    ]


def get_default_registry() -> CaseRegistry:
    """Registry по умолчанию: end-to-end и короткие domain cases."""
    return CaseRegistry([_mini_case(), _module_case(), *_domain_cases()])


DEFAULT_CASE_REGISTRY = get_default_registry()
