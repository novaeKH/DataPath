#!/usr/bin/env python3
"""Isolated Python runner used by AlgoPath.

Input JSON (stdin):
{
  "code": "...",
  "function_name": "two_sum",
  "tests": [{"input_json": "...", "output_json": "..."}],
  "runner_config": {...},
  "compare_expected": true
}

The runner captures stdout/stderr, reports syntax/runtime errors as structured JSON,
and supports the data structures used in the practice notebook (linked lists,
binary trees, graph nodes and operation-based class exercises).
"""
from __future__ import annotations

import contextlib
import inspect
import io
import json
import math
import os
try:
    import resource
except ImportError:  # Windows does not provide the resource module.
    resource = None  # type: ignore[assignment]
import sys
import time
import traceback
from collections import deque
from typing import Any

MAX_INPUT = 2_000_000
MAX_OUTPUT = 16_000
MAX_EXEC_TIME = 10


PRELUDE = r'''
from __future__ import annotations
from typing import Any, Dict, List, Optional, Set, Tuple, Deque
from collections import Counter, defaultdict, deque
from functools import lru_cache
from itertools import combinations, permutations
import bisect
import heapq
import math

class ListNode:
    def __init__(self, val: int = 0, next: Optional['ListNode'] = None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val: int = 0, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

class GraphNode:
    def __init__(self, val: int = 0, neighbors: Optional[List['GraphNode']] = None):
        self.val = val
        self.neighbors = neighbors or []
'''


def _truncate(value: str, limit: int = MAX_OUTPUT) -> str:
    if len(value) <= limit:
        return value
    return value[:limit] + "\n… вывод обрезан …"


def _safe_json(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        if math.isnan(value):
            return "NaN"
        if math.isinf(value):
            return "Infinity" if value > 0 else "-Infinity"
        return value
    if isinstance(value, tuple):
        return [_safe_json(v) for v in value]
    if isinstance(value, list):
        return [_safe_json(v) for v in value]
    if isinstance(value, set):
        return sorted((_safe_json(v) for v in value), key=lambda x: json.dumps(x, ensure_ascii=False, sort_keys=True))
    if isinstance(value, dict):
        return {str(k): _safe_json(v) for k, v in value.items()}
    return repr(value)


def _build_linked_list(values: list[Any] | None, cls: type) -> Any:
    if not values:
        return None
    dummy = cls(0)
    tail = dummy
    for value in values:
        tail.next = cls(value)
        tail = tail.next
    return dummy.next


def _linked_list_to_list(head: Any, max_nodes: int = 10_000) -> list[Any]:
    result: list[Any] = []
    seen: set[int] = set()
    while head is not None and len(result) < max_nodes:
        identity = id(head)
        if identity in seen:
            result.append("<cycle>")
            break
        seen.add(identity)
        result.append(_safe_json(getattr(head, "val", None)))
        head = getattr(head, "next", None)
    return result


def _build_cycle_list(payload: dict[str, Any], cls: type) -> Any:
    values = payload.get("values", [])
    pos = int(payload.get("pos", -1))
    if not values:
        return None
    nodes = [cls(value) for value in values]
    for i in range(len(nodes) - 1):
        nodes[i].next = nodes[i + 1]
    if 0 <= pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return nodes[0]


def _build_tree(values: list[Any] | None, cls: type) -> Any:
    if not values or values[0] is None:
        return None
    root = cls(values[0])
    queue = deque([root])
    index = 1
    while queue and index < len(values):
        node = queue.popleft()
        if index < len(values) and values[index] is not None:
            node.left = cls(values[index])
            queue.append(node.left)
        index += 1
        if index < len(values) and values[index] is not None:
            node.right = cls(values[index])
            queue.append(node.right)
        index += 1
    return root


def _tree_to_list(root: Any) -> list[Any]:
    if root is None:
        return []
    output: list[Any] = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            output.append(None)
            continue
        output.append(_safe_json(getattr(node, "val", None)))
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while output and output[-1] is None:
        output.pop()
    return output


def _find_tree_node(root: Any, value: Any) -> Any:
    if root is None:
        return None
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if getattr(node, "val", None) == value:
            return node
        if getattr(node, "left", None) is not None:
            queue.append(node.left)
        if getattr(node, "right", None) is not None:
            queue.append(node.right)
    return None


def _build_graph(adjacency: list[list[int]] | None, cls: type) -> Any:
    if not adjacency:
        return None
    nodes = {i + 1: cls(i + 1) for i in range(len(adjacency))}
    for i, neighbors in enumerate(adjacency, start=1):
        nodes[i].neighbors = [nodes[value] for value in neighbors]
    return nodes[1]


def _graph_to_adjacency(node: Any) -> list[list[int]]:
    if node is None:
        return []
    by_value: dict[int, Any] = {}
    queue = deque([node])
    while queue:
        current = queue.popleft()
        value = int(getattr(current, "val"))
        if value in by_value:
            continue
        by_value[value] = current
        queue.extend(getattr(current, "neighbors", []))
    if not by_value:
        return []
    size = max(by_value)
    output: list[list[int]] = [[] for _ in range(size)]
    for value, current in by_value.items():
        output[value - 1] = sorted(int(getattr(n, "val")) for n in getattr(current, "neighbors", []))
    return output


def _adapt_value(value: Any, adapter: str | None, namespace: dict[str, Any]) -> Any:
    if not adapter or adapter == "raw":
        return value
    if adapter == "linked_list":
        return _build_linked_list(value, namespace["ListNode"])
    if adapter == "linked_list_cycle":
        return _build_cycle_list(value, namespace["ListNode"])
    if adapter == "list_of_linked_lists":
        return [_build_linked_list(item, namespace["ListNode"]) for item in value]
    if adapter == "tree":
        return _build_tree(value, namespace["TreeNode"])
    if adapter == "graph":
        return _build_graph(value, namespace["GraphNode"])
    if adapter == "int_key_dict":
        return {int(k): v for k, v in value.items()}
    raise ValueError(f"Unknown input adapter: {adapter}")


def _prepare_function_call(
    raw_input: Any,
    function: Any,
    config: dict[str, Any],
    namespace: dict[str, Any],
) -> tuple[list[Any], dict[str, Any], dict[str, Any]]:
    special = config.get("special_input")
    context: dict[str, Any] = {}

    if special == "tree_lca":
        root = _build_tree(raw_input.get("root", []), namespace["TreeNode"])
        p = _find_tree_node(root, raw_input.get("p"))
        q = _find_tree_node(root, raw_input.get("q"))
        context.update({"root": root, "p": p, "q": q})
        return [root, p, q], {}, context

    signature = inspect.signature(function)
    params = list(signature.parameters.values())
    adapters = config.get("arg_adapters", {})

    if isinstance(raw_input, dict):
        kwargs: dict[str, Any] = {}
        for param in params:
            if param.name not in raw_input:
                if param.default is not inspect.Parameter.empty:
                    continue
                raise ValueError(f"Во входе отсутствует параметр '{param.name}'")
            kwargs[param.name] = _adapt_value(raw_input[param.name], adapters.get(param.name), namespace)
        context.update(kwargs)
        return [], kwargs, context

    if len(params) == 1:
        value = _adapt_value(raw_input, adapters.get(params[0].name), namespace)
        context[params[0].name] = value
        return [value], {}, context

    if not isinstance(raw_input, list):
        raise ValueError("Для функции с несколькими параметрами передай JSON-объект или массив аргументов")
    if len(raw_input) != len(params):
        raise ValueError(f"Ожидалось аргументов: {len(params)}, получено: {len(raw_input)}")
    args = []
    for param, value in zip(params, raw_input):
        adapted = _adapt_value(value, adapters.get(param.name), namespace)
        args.append(adapted)
        context[param.name] = adapted
    return args, {}, context


def _adapt_result(result: Any, config: dict[str, Any], context: dict[str, Any]) -> Any:
    adapter = config.get("result_adapter", "raw")
    if adapter == "raw":
        return _safe_json(result)
    if adapter == "linked_list":
        return _linked_list_to_list(result)
    if adapter == "tree":
        return _tree_to_list(result)
    if adapter == "graph":
        return _graph_to_adjacency(result)
    if adapter == "node_value":
        return None if result is None else _safe_json(getattr(result, "val", None))
    if adapter.startswith("arg:"):
        name = adapter.split(":", 1)[1]
        return _safe_json(context[name])
    if adapter.startswith("linked_list_arg:"):
        name = adapter.split(":", 1)[1]
        return _linked_list_to_list(context[name])
    raise ValueError(f"Unknown result adapter: {adapter}")


def _validate_side_effect(
    result: Any,
    context: dict[str, Any],
    config: dict[str, Any],
    original_input: Any,
) -> tuple[bool, str | None]:
    """Validate in-place contracts without changing the value shown as function output."""
    check = config.get("side_effect_check")
    if not check:
        return True, None

    if check.startswith("unique_prefix:"):
        name = check.split(":", 1)[1]
        mutated = context.get(name)
        if isinstance(original_input, dict):
            original = original_input.get(name)
        else:
            original = original_input
        if not isinstance(mutated, list) or not isinstance(original, list):
            return False, f"Не удалось проверить in-place аргумент '{name}'."
        if not isinstance(result, int) or isinstance(result, bool):
            return False, "Функция должна вернуть целое k и изменить массив на месте."

        expected_prefix: list[Any] = []
        for value in original:
            if not expected_prefix or value != expected_prefix[-1]:
                expected_prefix.append(value)
        if result < 0 or result > len(mutated):
            return False, "Возвращённое k выходит за границы изменённого массива."
        if mutated[:result] != expected_prefix[:result]:
            return False, (
                f"k={result} возвращено, но первые k элементов аргумента '{name}' неверны: "
                f"получено {_safe_json(mutated[:result])}, ожидалось {_safe_json(expected_prefix[:result])}."
            )
        return True, None

    raise ValueError(f"Unknown side effect check: {check}")


def _run_class_case(raw_input: Any, class_name: str, namespace: dict[str, Any]) -> list[Any]:
    if not isinstance(raw_input, dict):
        raise ValueError("Для задачи на класс нужен объект с полями operations и arguments")
    operations = raw_input.get("operations")
    arguments = raw_input.get("arguments")
    if not isinstance(operations, list) or not isinstance(arguments, list) or len(operations) != len(arguments):
        raise ValueError("operations и arguments должны быть массивами одинаковой длины")
    if not operations:
        return []

    cls = namespace[class_name]
    first_args = arguments[0] or []
    if not isinstance(first_args, list):
        first_args = [first_args]
    instance = cls(*first_args)
    output: list[Any] = [None]

    for operation, args in zip(operations[1:], arguments[1:]):
        if not isinstance(args, list):
            args = [args]
        value = getattr(instance, operation)(*args)
        output.append(_safe_json(value))
    return output


def _sort_key(value: Any) -> str:
    return json.dumps(_safe_json(value), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _normalize_nested(value: Any) -> Any:
    if not isinstance(value, list):
        return value
    normalized = []
    for item in value:
        if isinstance(item, list):
            normalized.append(sorted((_safe_json(v) for v in item), key=_sort_key))
        else:
            normalized.append(_safe_json(item))
    return sorted(normalized, key=_sort_key)


def _ordered_equal(actual: Any, expected: Any) -> bool:
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return math.isclose(float(actual), float(expected), rel_tol=1e-7, abs_tol=1e-6)
    if type(actual) is not type(expected):
        # JSON treats tuples as arrays and bool is an int subclass, so compare carefully.
        if isinstance(actual, tuple):
            actual = list(actual)
        if isinstance(expected, tuple):
            expected = list(expected)
    if isinstance(actual, list) and isinstance(expected, list):
        return len(actual) == len(expected) and all(_ordered_equal(a, b) for a, b in zip(actual, expected))
    if isinstance(actual, dict) and isinstance(expected, dict):
        return actual.keys() == expected.keys() and all(_ordered_equal(actual[k], expected[k]) for k in actual)
    return actual == expected


def _valid_course_order(actual: Any, raw_input: Any, expected: Any) -> bool:
    if not isinstance(raw_input, dict):
        return False
    n = raw_input.get("num_courses")
    prerequisites = raw_input.get("prerequisites", [])
    possible = bool(expected)
    if not possible:
        return actual == []
    if not isinstance(actual, list) or len(actual) != n or set(actual) != set(range(n)):
        return False
    position = {course: i for i, course in enumerate(actual)}
    return all(position[before] < position[course] for course, before in prerequisites)


def _values_equal(actual: Any, expected: Any, comparison: str, raw_input: Any) -> bool:
    actual = _safe_json(actual)
    expected = _safe_json(expected)
    if comparison == "unordered":
        return isinstance(actual, list) and isinstance(expected, list) and sorted(actual, key=_sort_key) == sorted(expected, key=_sort_key)
    if comparison == "unordered_nested":
        return _normalize_nested(actual) == _normalize_nested(expected)
    if comparison == "course_order":
        return _valid_course_order(actual, raw_input, expected)
    return _ordered_equal(actual, expected)


def execute_payload(payload: dict[str, Any]) -> dict[str, Any]:
    code = payload.get("code", "")
    function_name = payload.get("function_name", "")
    tests = payload.get("tests", [])
    config = payload.get("runner_config") or {}
    compare_expected = bool(payload.get("compare_expected", True))
    output_buffer = io.StringIO()
    namespace: dict[str, Any] = {"__name__": "__algopath_submission__"}
    started = time.perf_counter()

    try:
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(output_buffer):
            exec(compile(PRELUDE, "<algopath-prelude>", "exec"), namespace)
            exec(compile(code, "<solution>", "exec"), namespace)
    except Exception:
        return {
            "verdict": "Compilation Error",
            "passed": 0,
            "total": len(tests),
            "total_time_ms": (time.perf_counter() - started) * 1000,
            "error": _truncate(traceback.format_exc()),
            "details": [],
            "stdout": _truncate(output_buffer.getvalue()),
        }

    mode = config.get("mode", "function")
    if function_name not in namespace:
        label = "Класс" if mode == "class" else "Функция"
        return {
            "verdict": "Invalid Function Signature",
            "passed": 0,
            "total": len(tests),
            "total_time_ms": (time.perf_counter() - started) * 1000,
            "error": f"{label} '{function_name}' не найден. Не изменяй имя из стартового шаблона.",
            "details": [],
            "stdout": _truncate(output_buffer.getvalue()),
        }

    callable_target = namespace[function_name]
    passed = 0
    details: list[dict[str, Any]] = []
    comparison = config.get("comparison", "ordered")

    for index, test in enumerate(tests):
        case_started = time.perf_counter()
        raw_input = None
        try:
            original_input = json.loads(test.get("input_json", "null"))
            raw_input = json.loads(test.get("input_json", "null"))
            expected = json.loads(test.get("output_json", "null")) if compare_expected else None
            side_effect_ok = True
            side_effect_diagnostic = None

            with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(output_buffer):
                if mode == "class":
                    actual = _run_class_case(raw_input, function_name, namespace)
                else:
                    args, kwargs, context = _prepare_function_call(raw_input, callable_target, config, namespace)
                    raw_result = callable_target(*args, **kwargs)
                    actual = _adapt_result(raw_result, config, context)
                    side_effect_ok, side_effect_diagnostic = _validate_side_effect(
                        raw_result, context, config, original_input
                    )

            value_ok = True if not compare_expected else _values_equal(actual, expected, comparison, original_input)
            is_passed = value_ok and (side_effect_ok if compare_expected else True)
            if is_passed:
                passed += 1
            detail = {
                "test_index": index,
                "passed": is_passed,
                "input": _safe_json(raw_input),
                "actual": _safe_json(actual),
                "elapsed_ms": (time.perf_counter() - case_started) * 1000,
            }
            if compare_expected:
                detail["expected"] = _safe_json(expected)
            if side_effect_diagnostic and not side_effect_ok:
                detail["diagnostic"] = side_effect_diagnostic
            details.append(detail)
        except Exception:
            details.append({
                "test_index": index,
                "passed": False,
                "input": _safe_json(raw_input),
                "error": _truncate(traceback.format_exc(), 4_000),
                "elapsed_ms": (time.perf_counter() - case_started) * 1000,
            })

    total_time = (time.perf_counter() - started) * 1000
    runtime_errors = [detail for detail in details if detail.get("error")]
    if compare_expected:
        if runtime_errors:
            verdict = "Runtime Error"
        else:
            verdict = "Accepted" if passed == len(tests) else "Wrong Answer"
    else:
        verdict = "Completed" if details and not runtime_errors else "Runtime Error"
        if verdict == "Runtime Error":
            passed = 0

    return {
        "verdict": verdict,
        "passed": passed,
        "total": len(tests),
        "total_time_ms": total_time,
        "error": runtime_errors[0]["error"] if runtime_errors else None,
        "details": details,
        "stdout": _truncate(output_buffer.getvalue()),
    }


def _limit_resources(memory_mb: int = 256) -> None:
    if resource is None:
        return
    if memory_mb > 0:
        try:
            mem_bytes = memory_mb * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
        except (ValueError, resource.error, AttributeError):
            pass
    try:
        resource.setrlimit(resource.RLIMIT_CPU, (MAX_EXEC_TIME, MAX_EXEC_TIME))
    except (ValueError, resource.error, AttributeError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))
    except (ValueError, resource.error, AttributeError):
        pass


def main() -> None:
    _limit_resources(int(os.environ.get("ALGOPATH_RUNNER_MEMORY_MB", "256")))
    try:
        raw = sys.stdin.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise ValueError("Runner input is too large")
        payload = json.loads(raw)
        print(json.dumps(execute_payload(payload), ensure_ascii=False))
    except Exception:
        print(json.dumps({
            "verdict": "Internal Runner Error",
            "passed": 0,
            "total": 0,
            "error": _truncate(traceback.format_exc()),
            "details": [],
            "stdout": "",
        }, ensure_ascii=False))


if __name__ == "__main__":
    main()
