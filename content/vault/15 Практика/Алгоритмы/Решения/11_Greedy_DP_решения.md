---
title: "Greedy и DP — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.greedy-i-dp-resheniia
schema_version: 2
language: ru
app: exclude
---
# Greedy и DP — решения

[[11_Greedy_DP_подсказки|← Подсказки]] · [[00_Каталог_решений|Каталог]]

## LC 121 — Best Time to Buy and Sell Stock

```python
def max_profit(prices: list[int]) -> int:
    min_price = float("inf")
    best = 0
    for price in prices:
        min_price = min(min_price, price)
        best = max(best, price - min_price)
    return best
```

Brute all buy/sell pairs O(n²). Оптимально O(n), O(1). Инвариант: min_price — минимум префикса, best — лучшая сделка префикса.

## LC 53 — Maximum Subarray

```python
def max_subarray(nums: list[int]) -> int:
    if not nums:
        raise ValueError("nums must not be empty")
    current = best = nums[0]
    for value in nums[1:]:
        current = max(value, current + value)
        best = max(best, current)
    return best
```

O(n), O(1). Инициализация первым элементом важна для полностью отрицательного массива. `current` — лучший непустой подмассив, заканчивающийся здесь.

## LC 70 — Climbing Stairs

```python
def climb_stairs(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1
    previous, current = 1, 1
    for _ in range(2, n + 1):
        previous, current = current, previous + current
    return current
```

Наивная рекурсия O(2ⁿ). DP O(n), O(1). `dp[i]=dp[i-1]+dp[i-2]`.

## LC 198 — House Robber

```python
def rob(nums: list[int]) -> int:
    two_back = 0
    one_back = 0
    for value in nums:
        current = max(one_back, two_back + value)
        two_back, one_back = one_back, current
    return one_back
```

O(n), O(1). Переход сравнивает «пропустить текущий» и «взять + лучший до соседа».

## LC 322 — Coin Change

```python
def coin_change(coins: list[int], amount: int) -> int:
    if amount < 0:
        raise ValueError("amount must be non-negative")
    unreachable = amount + 1
    dp = [0] + [unreachable] * amount
    for current in range(1, amount + 1):
        for coin in coins:
            if coin <= current:
                dp[current] = min(dp[current], dp[current - coin] + 1)
    return -1 if dp[amount] == unreachable else dp[amount]
```

O(amount·len(coins)) времени, O(amount) памяти. Greedy не универсален: для coins `[1,3,4]`, amount 6 greedy даёт 4+1+1 (3 монеты), оптимум 3+3 (2).
