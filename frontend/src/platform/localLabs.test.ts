import { describe, expect, it } from 'vitest'
import { runLocalLab } from './localLabs'

const splitInitial = {
  dataset: {
    points: [
      { x1: -2, x2: 1, y: 0 },
      { x1: -1, x2: -1, y: 0 },
      { x1: 1, x2: 1, y: 1 },
      { x1: 2, x2: -1, y: 1 },
    ],
    classes: [0, 1],
    x_range: [-3, 3],
    y_range: [-2, 2],
  },
}

describe('offline laboratory runtime', () => {
  it('recalculates a Gini split without an API', () => {
    const result = runLocalLab(
      'decision-tree-split-lab',
      { feature: 'x1', threshold: 0, criterion: 'gini' },
      splitInitial,
    )

    expect(result.runtime).toBe('local')
    expect(result.split).toMatchObject({ left_count: 2, right_count: 2 })
    expect(result.impurity).toMatchObject({ parent: 0.5, left: 0, right: 0, weighted: 0 })
    expect(result.gain).toBe(0.5)
  })

  it('recalculates entropy and validates the threshold', () => {
    const result = runLocalLab(
      'decision-tree-split-lab',
      { feature: 'x2', threshold: 0, criterion: 'entropy' },
      splitInitial,
    )
    expect(result.impurity).toMatchObject({ criterion: 'entropy', parent: 1, weighted: 1 })
    expect(() =>
      runLocalLab(
        'decision-tree-split-lab',
        { feature: 'x1', threshold: 4, criterion: 'gini' },
        splitInitial,
      ),
    ).toThrow(/диапазоне/)
  })

  it('runs the depth and ensemble labs entirely in the browser runtime', () => {
    const overfitting = runLocalLab(
      'tree-depth-overfitting-lab',
      { max_depth: 4, min_samples_leaf: 2 },
      {},
    ) as { runtime: string; boundary: { preds: number[] }; depth_curve: { depths: number[] } }
    expect(overfitting.runtime).toBe('local')
    expect(overfitting.boundary.preds).toHaveLength(36 * 36)
    expect(overfitting.depth_curve.depths).toHaveLength(12)

    const ensemble = runLocalLab(
      'ensemble-comparison-lab',
      { n_estimators: 100, max_depth: 10, learning_rate: 0.1 },
      {},
    ) as {
      runtime: string
      models: unknown[]
      boundary: { grids: Record<string, number[]> }
    }
    expect(ensemble.runtime).toBe('local')
    expect(ensemble.models).toHaveLength(3)
    expect(ensemble.boundary.grids.forest).toHaveLength(30 * 30)
  })
})
