"""Фиксированные синтетические датасеты для лабораторий.

Все датасеты детерминированы: фиксированный seed, без глобального RNG.
"""

from __future__ import annotations

import numpy as np

SEED = 42


def split_dataset() -> dict:
    """Двумерный датасет для лаборатории разбиений (2 класса, 120 точек)."""
    rng = np.random.default_rng(SEED)
    n = 60
    x1 = np.concatenate([rng.normal(-0.75, 0.85, n), rng.normal(0.9, 0.85, n)])
    x2 = np.concatenate([rng.normal(0.15, 1.1, n), rng.normal(-0.25, 1.1, n)])
    y = np.concatenate([np.zeros(n, dtype=int), np.ones(n, dtype=int)])
    return {
        "points": [
            {"x1": round(float(a), 4), "x2": round(float(b), 4), "y": int(c)}
            for a, b, c in zip(x1, x2, y, strict=True)
        ],
        "classes": [0, 1],
        "x_range": [round(float(x1.min()) - 0.5, 2), round(float(x1.max()) + 0.5, 2)],
        "y_range": [round(float(x2.min()) - 0.5, 2), round(float(x2.max()) + 0.5, 2)],
    }


def make_moons(n_samples: int = 220, noise: float = 0.32):
    """Луны sklearn с фиксированным seed (замена, чтобы не тянуть extra imports)."""
    from sklearn.datasets import make_moons as _make_moons

    return _make_moons(n_samples=n_samples, noise=noise, random_state=SEED)


def train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.3):
    """Детерминированное разбиение train/test."""
    from sklearn.model_selection import train_test_split as _split

    return _split(X, y, test_size=test_size, random_state=SEED)


def grid_2d(x_range: list[float], y_range: list[float], size: int = 36):
    """Координатная сетка для decision boundary (size x size)."""
    xs = np.linspace(x_range[0], x_range[1], size)
    ys = np.linspace(y_range[0], y_range[1], size)
    xx, yy = np.meshgrid(xs, ys)
    return xx, yy
