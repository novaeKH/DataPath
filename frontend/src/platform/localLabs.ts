type LabParams = Record<string, string | number>

type Point = { x1: number; x2: number; y: number }
type TreeNode = {
  prediction: number
  feature?: 0 | 1
  threshold?: number
  left?: TreeNode
  right?: TreeNode
  depth: number
}

type RegressionNode = {
  value: number
  feature?: 0 | 1
  threshold?: number
  left?: RegressionNode
  right?: RegressionNode
}

const round = (value: number, digits = 6) => Number(value.toFixed(digits))
const featureValue = (point: Point, feature: 0 | 1) => (feature === 0 ? point.x1 : point.x2)

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function normal(random: () => number) {
  const u = Math.max(random(), Number.EPSILON)
  const v = random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function shuffle<T>(items: T[], random: () => number) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[items[index], items[other]] = [items[other], items[index]]
  }
  return items
}

function makeMoons(count: number, noise: number, seed: number) {
  const random = seededRandom(seed)
  const half = Math.floor(count / 2)
  const points: Point[] = []
  for (let index = 0; index < half; index += 1) {
    const angle = (Math.PI * index) / Math.max(half - 1, 1)
    points.push({
      x1: Math.cos(angle) + normal(random) * noise,
      x2: Math.sin(angle) + normal(random) * noise,
      y: 0,
    })
  }
  for (let index = 0; index < count - half; index += 1) {
    const angle = (Math.PI * index) / Math.max(count - half - 1, 1)
    points.push({
      x1: 1 - Math.cos(angle) + normal(random) * noise,
      x2: 0.5 - Math.sin(angle) + normal(random) * noise,
      y: 1,
    })
  }
  return shuffle(points, random)
}

function splitTrainValidation(points: Point[], seed: number) {
  const shuffled = shuffle([...points], seededRandom(seed))
  const trainCount = Math.round(shuffled.length * 0.7)
  return { train: shuffled.slice(0, trainCount), validation: shuffled.slice(trainCount) }
}

function giniFromCounts(positive: number, total: number) {
  if (!total) return 0
  const probability = positive / total
  return 1 - probability ** 2 - (1 - probability) ** 2
}

function entropyFromCounts(positive: number, total: number) {
  if (!total || positive === 0 || positive === total) return 0
  const probability = positive / total
  return -probability * Math.log2(probability) - (1 - probability) * Math.log2(1 - probability)
}

function bestClassificationSplit(points: Point[], minLeaf: number, random?: () => number) {
  const positive = points.reduce((sum, point) => sum + point.y, 0)
  const parent = giniFromCounts(positive, points.length)
  const features: (0 | 1)[] = random ? [random() < 0.5 ? 0 : 1] : [0, 1]
  let best: { feature: 0 | 1; threshold: number; gain: number } | null = null
  for (const feature of features) {
    const ordered = [...points].sort((a, b) => featureValue(a, feature) - featureValue(b, feature))
    let leftPositive = 0
    for (let index = 0; index < ordered.length - 1; index += 1) {
      leftPositive += ordered[index].y
      const leftCount = index + 1
      const rightCount = ordered.length - leftCount
      if (leftCount < minLeaf || rightCount < minLeaf) continue
      const current = featureValue(ordered[index], feature)
      const next = featureValue(ordered[index + 1], feature)
      if (current === next) continue
      const rightPositive = positive - leftPositive
      const weighted =
        (leftCount * giniFromCounts(leftPositive, leftCount) +
          rightCount * giniFromCounts(rightPositive, rightCount)) /
        ordered.length
      const gain = parent - weighted
      if (!best || gain > best.gain) {
        best = { feature, threshold: (current + next) / 2, gain }
      }
    }
  }
  return best
}

function trainClassificationTree(
  points: Point[],
  maxDepth: number,
  minLeaf: number,
  random?: () => number,
  depth = 1,
): TreeNode {
  const positive = points.reduce((sum, point) => sum + point.y, 0)
  const node: TreeNode = { prediction: positive >= points.length / 2 ? 1 : 0, depth }
  if (depth >= maxDepth || positive === 0 || positive === points.length) return node
  const split = bestClassificationSplit(points, minLeaf, random)
  if (!split || split.gain <= 1e-9) return node
  const left = points.filter((point) => featureValue(point, split.feature) <= split.threshold)
  const right = points.filter((point) => featureValue(point, split.feature) > split.threshold)
  node.feature = split.feature
  node.threshold = split.threshold
  node.left = trainClassificationTree(left, maxDepth, minLeaf, random, depth + 1)
  node.right = trainClassificationTree(right, maxDepth, minLeaf, random, depth + 1)
  return node
}

function predictTree(node: TreeNode, point: Point): number {
  if (node.feature === undefined || node.threshold === undefined || !node.left || !node.right) {
    return node.prediction
  }
  return featureValue(point, node.feature) <= node.threshold
    ? predictTree(node.left, point)
    : predictTree(node.right, point)
}

function treeStats(node: TreeNode): { depth: number; leaves: number } {
  if (!node.left || !node.right) return { depth: node.depth, leaves: 1 }
  const left = treeStats(node.left)
  const right = treeStats(node.right)
  return { depth: Math.max(left.depth, right.depth), leaves: left.leaves + right.leaves }
}

function accuracy(points: Point[], predict: (point: Point) => number) {
  return points.filter((point) => predict(point) === point.y).length / points.length
}

function ranges(points: Point[]) {
  const xs = points.map((point) => point.x1)
  const ys = points.map((point) => point.x2)
  return {
    x: [round(Math.min(...xs) - 0.3, 2), round(Math.max(...xs) + 0.3, 2)] as [number, number],
    y: [round(Math.min(...ys) - 0.3, 2), round(Math.max(...ys) + 0.3, 2)] as [number, number],
  }
}

function axis(from: number, to: number, size: number) {
  return Array.from({ length: size }, (_, index) =>
    round(from + ((to - from) * index) / (size - 1), 4),
  )
}

function gridPredictions(x: number[], y: number[], predict: (point: Point) => number) {
  return y.flatMap((yValue) => x.map((xValue) => predict({ x1: xValue, x2: yValue, y: 0 })))
}

function interpretation(train: number, validation: number) {
  const gap = train - validation
  if (train < 0.82) {
    return {
      label: 'underfit',
      text: `Модель слишком простая: train ${train.toFixed(2)} / validation ${validation.toFixed(2)}. Увеличьте max_depth или уменьшите min_samples_leaf.`,
    }
  }
  if (gap > 0.14) {
    return {
      label: 'overfit',
      text: `Модель переобучается: train ${train.toFixed(2)}, validation ${validation.toFixed(2)} (разрыв ${gap.toFixed(2)}). Уменьшите max_depth или увеличьте min_samples_leaf.`,
    }
  }
  return {
    label: 'good',
    text: `Сложность подходящая: train ${train.toFixed(2)} / validation ${validation.toFixed(2)}, разрыв небольшой. Модель обобщает, а не запоминает выборку.`,
  }
}

function runTreeSplit(initial: Record<string, unknown>, params: LabParams) {
  const dataset = (initial.dataset ?? {}) as {
    points: Point[]
    classes: number[]
    x_range: [number, number]
    y_range: [number, number]
  }
  const feature = params.feature === 'x2' ? 'x2' : 'x1'
  const threshold = Number(params.threshold)
  const criterion = params.criterion === 'entropy' ? 'entropy' : 'gini'
  if (!Number.isFinite(threshold) || threshold < -3 || threshold > 3) {
    throw new Error('Порог должен быть в диапазоне от −3 до 3.')
  }
  const left = dataset.points.filter((point) => point[feature] <= threshold)
  const right = dataset.points.filter((point) => point[feature] > threshold)
  const impurity = criterion === 'gini' ? giniFromCounts : entropyFromCounts
  const calculate = (items: Point[]) =>
    impurity(
      items.reduce((sum, point) => sum + point.y, 0),
      items.length,
    )
  const parent = calculate(dataset.points)
  const leftValue = calculate(left)
  const rightValue = calculate(right)
  const weighted =
    (left.length * leftValue + right.length * rightValue) / Math.max(dataset.points.length, 1)
  const gain = parent - weighted
  const criterionLabel = criterion === 'gini' ? 'Gini' : 'Entropy'
  const quality =
    gain <= 0
      ? 'Разбиение не уменьшает impurity — дерево выберет другое условие.'
      : gain < 0.05
        ? 'Улучшение небольшое: смесь классов почти не изменилась.'
        : 'Разбиение заметно уменьшает impurity: одна из сторон стала чище по классам.'
  return {
    dataset,
    split: { feature, threshold, left_count: left.length, right_count: right.length },
    impurity: {
      criterion,
      parent: round(parent),
      left: round(leftValue),
      right: round(rightValue),
      weighted: round(weighted),
    },
    gain: round(gain),
    explanation: `Impurity родительского узла: ${parent.toFixed(3)} (${criterionLabel}). После разбиения: ${weighted.toFixed(3)} (лево ${leftValue.toFixed(3)} на ${left.length} объектах, право ${rightValue.toFixed(3)} на ${right.length} объектах). Information gain ${gain.toFixed(3)}. ${quality}`,
    runtime: 'local',
  }
}

function runTreeOverfitting(params: LabParams) {
  const maxDepth = Math.max(1, Math.min(12, Math.round(Number(params.max_depth))))
  const minLeaf = Math.max(1, Math.min(20, Math.round(Number(params.min_samples_leaf))))
  const points = makeMoons(220, 0.32, 42)
  const { train, validation } = splitTrainValidation(points, 4242)
  const started = performance.now()
  const tree = trainClassificationTree(train, maxDepth, minLeaf)
  const trainAccuracy = accuracy(train, (point) => predictTree(tree, point))
  const validationAccuracy = accuracy(validation, (point) => predictTree(tree, point))
  const stats = treeStats(tree)
  const depthCurve = Array.from({ length: 12 }, (_, index) => index + 1)
  const curve = depthCurve.map((depth) => trainClassificationTree(train, depth, minLeaf))
  const limits = ranges(points)
  const x = axis(limits.x[0], limits.x[1], 36)
  const y = axis(limits.y[0], limits.y[1], 36)
  return {
    dataset: {
      x_range: limits.x,
      y_range: limits.y,
      train_size: train.length,
      val_size: validation.length,
    },
    metrics: {
      train_accuracy: round(trainAccuracy),
      val_accuracy: round(validationAccuracy),
      depth: stats.depth,
      leaves: stats.leaves,
      time_ms: round(performance.now() - started, 1),
    },
    boundary: { x, y, preds: gridPredictions(x, y, (point) => predictTree(tree, point)) },
    depth_curve: {
      depths: depthCurve,
      train: curve.map((candidate) =>
        round(accuracy(train, (point) => predictTree(candidate, point))),
      ),
      val: curve.map((candidate) =>
        round(accuracy(validation, (point) => predictTree(candidate, point))),
      ),
    },
    interpretation: interpretation(trainAccuracy, validationAccuracy),
    runtime: 'local',
  }
}

function bestRegressionSplit(points: Point[], targets: number[], maxFeaturesRandom?: () => number) {
  const features: (0 | 1)[] = maxFeaturesRandom ? [maxFeaturesRandom() < 0.5 ? 0 : 1] : [0, 1]
  let best: { feature: 0 | 1; threshold: number; loss: number } | null = null
  for (const feature of features) {
    const ordered = points
      .map((point, index) => ({ point, target: targets[index] }))
      .sort((a, b) => featureValue(a.point, feature) - featureValue(b.point, feature))
    const totalSum = ordered.reduce((sum, item) => sum + item.target, 0)
    const totalSquares = ordered.reduce((sum, item) => sum + item.target ** 2, 0)
    let leftSum = 0
    let leftSquares = 0
    for (let index = 0; index < ordered.length - 1; index += 1) {
      leftSum += ordered[index].target
      leftSquares += ordered[index].target ** 2
      const leftCount = index + 1
      const rightCount = ordered.length - leftCount
      if (leftCount < 3 || rightCount < 3) continue
      const current = featureValue(ordered[index].point, feature)
      const next = featureValue(ordered[index + 1].point, feature)
      if (current === next) continue
      const rightSum = totalSum - leftSum
      const rightSquares = totalSquares - leftSquares
      const loss =
        leftSquares - leftSum ** 2 / leftCount + rightSquares - rightSum ** 2 / rightCount
      if (!best || loss < best.loss) best = { feature, threshold: (current + next) / 2, loss }
    }
  }
  return best
}

function trainRegressionTree(
  points: Point[],
  targets: number[],
  maxDepth: number,
  depth = 1,
): RegressionNode {
  const value = targets.reduce((sum, target) => sum + target, 0) / targets.length
  const node: RegressionNode = { value }
  if (depth >= maxDepth || points.length < 6) return node
  const split = bestRegressionSplit(points, targets)
  if (!split) return node
  const leftPoints: Point[] = []
  const rightPoints: Point[] = []
  const leftTargets: number[] = []
  const rightTargets: number[] = []
  points.forEach((point, index) => {
    if (featureValue(point, split.feature) <= split.threshold) {
      leftPoints.push(point)
      leftTargets.push(targets[index])
    } else {
      rightPoints.push(point)
      rightTargets.push(targets[index])
    }
  })
  node.feature = split.feature
  node.threshold = split.threshold
  node.left = trainRegressionTree(leftPoints, leftTargets, maxDepth, depth + 1)
  node.right = trainRegressionTree(rightPoints, rightTargets, maxDepth, depth + 1)
  return node
}

function predictRegressionTree(node: RegressionNode, point: Point): number {
  if (node.feature === undefined || node.threshold === undefined || !node.left || !node.right) {
    return node.value
  }
  return featureValue(point, node.feature) <= node.threshold
    ? predictRegressionTree(node.left, point)
    : predictRegressionTree(node.right, point)
}

function runEnsemble(params: LabParams) {
  const estimators = Math.max(5, Math.min(100, Math.round(Number(params.n_estimators))))
  const maxDepth = Math.max(1, Math.min(10, Math.round(Number(params.max_depth))))
  const learningRate = Math.max(0.01, Math.min(1, Number(params.learning_rate)))
  const points = makeMoons(300, 0.28, 42)
  const { train, validation } = splitTrainValidation(points, 4242)
  const limits = ranges(points)
  const x = axis(limits.x[0], limits.x[1], 30)
  const y = axis(limits.y[0], limits.y[1], 30)
  const startedTree = performance.now()
  const tree = trainClassificationTree(train, maxDepth, 1)
  const treeTime = performance.now() - startedTree

  const startedForest = performance.now()
  const random = seededRandom(1401)
  const forest = Array.from({ length: estimators }, () => {
    const sample = Array.from(
      { length: train.length },
      () => train[Math.floor(random() * train.length)],
    )
    return trainClassificationTree(sample, maxDepth, 1, random)
  })
  const forestPredict = (point: Point) =>
    forest.reduce((sum, candidate) => sum + predictTree(candidate, point), 0) >= forest.length / 2
      ? 1
      : 0
  const forestTime = performance.now() - startedForest

  const startedBoosting = performance.now()
  const positive = train.reduce((sum, point) => sum + point.y, 0)
  const base = Math.log((positive + 0.5) / (train.length - positive + 0.5))
  const trainScores = Array(train.length).fill(base) as number[]
  const boosting: RegressionNode[] = []
  for (let index = 0; index < estimators; index += 1) {
    const residuals = train.map((point, row) => point.y - 1 / (1 + Math.exp(-trainScores[row])))
    const candidate = trainRegressionTree(train, residuals, maxDepth)
    boosting.push(candidate)
    train.forEach((point, row) => {
      trainScores[row] += learningRate * predictRegressionTree(candidate, point)
    })
  }
  const boostingPredict = (point: Point) => {
    const score = boosting.reduce(
      (current, candidate) => current + learningRate * predictRegressionTree(candidate, point),
      base,
    )
    return score >= 0 ? 1 : 0
  }
  const boostingTime = performance.now() - startedBoosting
  const candidates = [
    {
      key: 'tree',
      name: 'Decision Tree',
      predict: (point: Point) => predictTree(tree, point),
      time: treeTime,
      params: `max_depth=${maxDepth}`,
    },
    {
      key: 'forest',
      name: 'Random Forest',
      predict: forestPredict,
      time: forestTime,
      params: `n_estimators=${estimators}, max_depth=${maxDepth}`,
    },
    {
      key: 'boosting',
      name: 'Gradient Boosting',
      predict: boostingPredict,
      time: boostingTime,
      params: `n_estimators=${estimators}, max_depth=${maxDepth}, lr=${learningRate}`,
    },
  ]
  const models = candidates.map((candidate) => ({
    key: candidate.key,
    name: candidate.name,
    train_accuracy: round(accuracy(train, candidate.predict)),
    val_accuracy: round(accuracy(validation, candidate.predict)),
    time_ms: round(candidate.time, 1),
    params: candidate.params,
  }))
  const best = models.reduce((left, right) =>
    right.val_accuracy > left.val_accuracy ? right : left,
  )
  return {
    dataset: {
      x_range: limits.x,
      y_range: limits.y,
      train_size: train.length,
      val_size: validation.length,
      catboost_available: false,
    },
    models,
    boundary: {
      x,
      y,
      grids: Object.fromEntries(
        candidates.map((candidate) => [candidate.key, gridPredictions(x, y, candidate.predict)]),
      ),
    },
    explanation: `Random Forest усредняет независимые деревья и снижает variance. Gradient Boosting последовательно исправляет residuals предыдущих деревьев. На этом фиксированном split лучшая validation accuracy у ${best.name} (${best.val_accuracy.toFixed(3)}).`,
    runtime: 'local',
  }
}

export function runLocalLab(
  labId: string,
  params: LabParams,
  initialResult: Record<string, unknown>,
): Record<string, unknown> {
  if (labId === 'decision-tree-split-lab') return runTreeSplit(initialResult, params)
  if (labId === 'tree-depth-overfitting-lab') return runTreeOverfitting(params)
  if (labId === 'ensemble-comparison-lab') return runEnsemble(params)
  throw new Error(`Локальный расчёт лаборатории ${labId} не поддерживается.`)
}
