import { VisualDemoFrame, type DemoState } from './VisualDemoHost'

const BLUE = '#3b82f6'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const GREEN = '#10b981'
const VIOLET = '#8b5cf6'

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="border-t px-4 py-3 text-sm leading-relaxed"
      style={{ borderColor: 'var(--dp-border-subtle)', color: 'var(--dp-text-secondary)' }}
    >
      {children}
    </p>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--dp-surface)' }}>
      <div
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--dp-text-muted)' }}
      >
        {label}
      </div>
      <div className="font-mono text-sm font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

const POINTS = [
  [0.6, 1.2],
  [1.3, 2.1],
  [2.1, 2.4],
  [2.8, 3.8],
  [3.7, 4.0],
  [4.3, 5.1],
  [5.2, 5.0],
  [6.0, 6.7],
  [6.8, 6.5],
  [7.6, 8.2],
] as const

export function LinearFitDemo() {
  return (
    <VisualDemoFrame
      goal="Подберите slope и intercept. Следите не только за линией, но и за residuals и MSE."
      controls={[
        { name: 'slope', label: 'Slope w', type: 'slider', min: -0.5, max: 1.8, step: 0.1 },
        { name: 'intercept', label: 'Intercept b', type: 'slider', min: -2, max: 4, step: 0.2 },
        { name: 'residuals', label: 'Residuals', type: 'toggle' },
      ]}
      defaults={{ slope: 0.5, intercept: 1, residuals: true }}
    >
      {(state) => <LinearFitChart state={state} />}
    </VisualDemoFrame>
  )
}

function LinearFitChart({ state }: { state: DemoState }) {
  const slope = Number(state.slope)
  const intercept = Number(state.intercept)
  const mse =
    POINTS.reduce((sum, [x, y]) => sum + (y - (slope * x + intercept)) ** 2, 0) / POINTS.length
  const sx = (x: number) => 42 + x * 57
  const sy = (y: number) => 270 - y * 27
  return (
    <div>
      <svg
        viewBox="0 0 540 300"
        className="w-full"
        role="img"
        aria-label="Линейная регрессия, остатки и MSE"
      >
        <line x1="42" y1="270" x2="515" y2="270" stroke="var(--dp-border-strong)" />
        <line x1="42" y1="20" x2="42" y2="270" stroke="var(--dp-border-strong)" />
        {POINTS.map(([x, y], index) => {
          const prediction = slope * x + intercept
          return (
            <g key={index}>
              {state.residuals && (
                <line
                  x1={sx(x)}
                  y1={sy(y)}
                  x2={sx(x)}
                  y2={sy(prediction)}
                  stroke={RED}
                  strokeWidth="1.5"
                  opacity="0.65"
                />
              )}
              <circle cx={sx(x)} cy={sy(y)} r="5" fill={BLUE} />
            </g>
          )
        })}
        <line
          x1={sx(0)}
          y1={sy(intercept)}
          x2={sx(8)}
          y2={sy(slope * 8 + intercept)}
          stroke={AMBER}
          strokeWidth="3"
        />
        <text x="58" y="42" fill="var(--dp-text-primary)" fontSize="13" fontWeight="600">
          ŷ = {slope.toFixed(1)}x {intercept >= 0 ? '+' : '−'} {Math.abs(intercept).toFixed(1)}
        </text>
        <text x="400" y="42" fill={mse < 0.5 ? GREEN : RED} fontSize="14" fontWeight="700">
          MSE {mse.toFixed(2)}
        </text>
      </svg>
      <Note>
        Красные отрезки — ошибки отдельных объектов. MSE усредняет их квадраты: большие промахи
        получают непропорционально большой вес.
      </Note>
    </div>
  )
}

export function GradientDescentDemo() {
  return (
    <VisualDemoFrame
      goal="Проследите путь по loss landscape. Сравните маленький, нормальный и слишком большой learning rate."
      controls={[
        { name: 'lr', label: 'Learning rate', type: 'slider', min: 0.02, max: 1.3, step: 0.02 },
        { name: 'steps', label: 'Шаг', type: 'slider', min: 0, max: 8, step: 1 },
      ]}
      defaults={{ lr: 0.2, steps: 2 }}
    >
      {(state) => <GradientChart state={state} />}
    </VisualDemoFrame>
  )
}

function GradientChart({ state }: { state: DemoState }) {
  const lr = Number(state.lr)
  const steps = Number(state.steps)
  const trajectory = [-1.6]
  for (let i = 0; i < 8; i += 1) trajectory.push(trajectory[i] - lr * 2 * (trajectory[i] - 2))
  const current = trajectory[steps]
  const loss = (w: number) => (w - 2) ** 2
  const sx = (w: number) => 45 + ((w + 2) / 8) * 460
  const sy = (v: number) => 255 - Math.min(v, 18) * 12
  const curve = Array.from({ length: 81 }, (_, i) => -2 + i * 0.1)
    .map((w) => `${sx(w)},${sy(loss(w))}`)
    .join(' ')
  const behavior =
    lr < 0.08
      ? 'Стабильно, но очень медленно'
      : lr <= 0.8
        ? 'Сходится к минимуму'
        : 'Перескакивает минимум и расходится'
  return (
    <div>
      <svg
        viewBox="0 0 540 285"
        className="w-full"
        role="img"
        aria-label="Градиентный спуск по функции потерь"
      >
        <line x1="45" y1="255" x2="505" y2="255" stroke="var(--dp-border-strong)" />
        <polyline points={curve} fill="none" stroke={VIOLET} strokeWidth="3" />
        {trajectory.slice(0, steps + 1).map((w, i) => (
          <circle
            key={i}
            cx={sx(w)}
            cy={sy(loss(w))}
            r={i === steps ? 7 : 3.5}
            fill={i === steps ? AMBER : BLUE}
            opacity={i === steps ? 1 : 0.55}
          />
        ))}
        <line
          x1={sx(current)}
          y1={sy(loss(current))}
          x2={sx(current - Math.max(-1.4, Math.min(1.4, 2 * (current - 2) * 0.18)))}
          y2={sy(loss(current))}
          stroke={RED}
          strokeWidth="3"
          markerEnd="url(#gradient-arrow)"
        />
        <defs>
          <marker
            id="gradient-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={RED} />
          </marker>
        </defs>
        <text x="56" y="32" fill="var(--dp-text-primary)" fontSize="13">
          w={current.toFixed(3)} · gradient={(2 * (current - 2)).toFixed(3)} · loss=
          {loss(current).toFixed(3)}
        </text>
      </svg>
      <Note>
        <strong>{behavior}.</strong> Обновление: w ← w − lr · gradient. При lr&gt;1 для этой функции
        амплитуда ошибки растёт на каждом шаге.
      </Note>
    </div>
  )
}

const SCORED_POINTS = [
  { p: 0.08, y: 0 },
  { p: 0.18, y: 0 },
  { p: 0.31, y: 1 },
  { p: 0.43, y: 0 },
  { p: 0.55, y: 1 },
  { p: 0.62, y: 1 },
  { p: 0.72, y: 0 },
  { p: 0.81, y: 1 },
  { p: 0.9, y: 1 },
  { p: 0.96, y: 1 },
]

function classificationAt(threshold: number) {
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0
  for (const item of SCORED_POINTS) {
    const pred = item.p >= threshold ? 1 : 0
    if (item.y === 1 && pred === 1) tp += 1
    else if (item.y === 0 && pred === 1) fp += 1
    else if (item.y === 1) fn += 1
    else tn += 1
  }
  const precision = tp / Math.max(1, tp + fp)
  const recall = tp / Math.max(1, tp + fn)
  return {
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    f1: (2 * precision * recall) / Math.max(0.0001, precision + recall),
  }
}

export function LogisticThresholdDemo() {
  return (
    <VisualDemoFrame
      goal="Меняйте threshold: вероятности не меняются, но классы и стоимость ошибок меняются сразу."
      controls={[
        { name: 'threshold', label: 'Threshold', type: 'slider', min: 0.05, max: 0.95, step: 0.05 },
      ]}
      defaults={{ threshold: 0.5 }}
    >
      {(state) => <LogisticChart state={state} />}
    </VisualDemoFrame>
  )
}

function LogisticChart({ state }: { state: DemoState }) {
  const threshold = Number(state.threshold)
  const metrics = classificationAt(threshold)
  const sigmoid = Array.from({ length: 81 }, (_, i) => -6 + i * 0.15)
    .map((z) => {
      const p = 1 / (1 + Math.exp(-z))
      return `${45 + ((z + 6) / 12) * 460},${245 - p * 200}`
    })
    .join(' ')
  return (
    <div>
      <svg
        viewBox="0 0 540 275"
        className="w-full"
        role="img"
        aria-label="Sigmoid и threshold логистической регрессии"
      >
        <polyline points={sigmoid} fill="none" stroke={BLUE} strokeWidth="3" />
        <line
          x1="45"
          y1={245 - threshold * 200}
          x2="505"
          y2={245 - threshold * 200}
          stroke={AMBER}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <text x="54" y={238 - threshold * 200} fill={AMBER} fontSize="11">
          threshold {threshold.toFixed(2)}
        </text>
        {SCORED_POINTS.map((item, i) => (
          <circle
            key={i}
            cx={45 + item.p * 460}
            cy={260}
            r="6"
            fill={item.p >= threshold ? GREEN : 'var(--dp-text-muted)'}
            stroke={item.y ? BLUE : RED}
            strokeWidth="2"
          />
        ))}
        <text x="50" y="30" fill="var(--dp-text-secondary)" fontSize="12">
          Контур точки: истинный класс · заливка: predict(threshold)
        </text>
      </svg>
      <div className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-6">
        <Metric label="TP / FP" value={`${metrics.tp} / ${metrics.fp}`} />
        <Metric label="FN / TN" value={`${metrics.fn} / ${metrics.tn}`} />
        <Metric label="Precision" value={metrics.precision.toFixed(2)} />
        <Metric label="Recall" value={metrics.recall.toFixed(2)} />
        <Metric label="F1" value={metrics.f1.toFixed(2)} />
        <Metric label="Positive" value={metrics.tp + metrics.fp} />
      </div>
    </div>
  )
}

const TREE_POINTS = [
  { x: 0.9, y: 1 },
  { x: 1.4, y: 0 },
  { x: 2.1, y: 0 },
  { x: 2.8, y: 1 },
  { x: 3.3, y: 0 },
  { x: 4.2, y: 1 },
  { x: 4.8, y: 1 },
  { x: 5.4, y: 1 },
  { x: 6.1, y: 0 },
  { x: 6.8, y: 1 },
]

export function DecisionTreeDemo() {
  return (
    <VisualDemoFrame
      goal="Перебирайте candidate split. Лучший split сильнее уменьшает impurity дочерних узлов."
      controls={[
        { name: 'split', label: 'x ≤ threshold', type: 'slider', min: 1.1, max: 6.5, step: 0.3 },
      ]}
      defaults={{ split: 3.8 }}
    >
      {(state) => <TreeChart state={state} />}
    </VisualDemoFrame>
  )
}

function gini(items: typeof TREE_POINTS) {
  if (!items.length) return 0
  const p = items.filter((item) => item.y === 1).length / items.length
  return 1 - p ** 2 - (1 - p) ** 2
}

function TreeChart({ state }: { state: DemoState }) {
  const split = Number(state.split)
  const left = TREE_POINTS.filter((item) => item.x <= split)
  const right = TREE_POINTS.filter((item) => item.x > split)
  const weighted = (left.length * gini(left) + right.length * gini(right)) / TREE_POINTS.length
  return (
    <div>
      <svg
        viewBox="0 0 540 220"
        className="w-full"
        role="img"
        aria-label="Candidate split дерева решений"
      >
        <rect x="45" y="28" width={(split / 7.2) * 455} height="150" fill={BLUE} opacity="0.07" />
        <rect
          x={45 + (split / 7.2) * 455}
          y="28"
          width={455 - (split / 7.2) * 455}
          height="150"
          fill={AMBER}
          opacity="0.07"
        />
        {TREE_POINTS.map((item, i) => (
          <circle
            key={i}
            cx={45 + (item.x / 7.2) * 455}
            cy={item.y ? 78 : 142}
            r="7"
            fill={item.y ? BLUE : AMBER}
          />
        ))}
        <line
          x1={45 + (split / 7.2) * 455}
          y1="25"
          x2={45 + (split / 7.2) * 455}
          y2="182"
          stroke={RED}
          strokeWidth="3"
        />
        <text x="48" y="205" fill="var(--dp-text-secondary)" fontSize="12">
          left n={left.length}, Gini={gini(left).toFixed(2)}
        </text>
        <text x="350" y="205" fill="var(--dp-text-secondary)" fontSize="12">
          right n={right.length}, Gini={gini(right).toFixed(2)}
        </text>
      </svg>
      <Note>
        Weighted impurity = <strong>{weighted.toFixed(3)}</strong>; gain относительно parent Gini{' '}
        {gini(TREE_POINTS).toFixed(2)} равен{' '}
        <strong>{(gini(TREE_POINTS) - weighted).toFixed(3)}</strong>.
      </Note>
    </div>
  )
}

export function RandomForestDemo() {
  const votes = [0.31, 0.76, 0.61, 0.82, 0.47]
  return (
    <VisualDemoFrame
      goal="Пройдите путь dataset → bootstrap → разные деревья → усреднение. Ошибки деревьев должны быть не полностью коррелированы."
      controls={[
        { name: 'trees', label: 'Построено деревьев', type: 'slider', min: 1, max: 5, step: 1 },
      ]}
      defaults={{ trees: 3 }}
    >
      {(state) => {
        const n = Number(state.trees)
        const avg = votes.slice(0, n).reduce((a, b) => a + b, 0) / n
        return (
          <div>
            <div className="flex min-h-56 flex-col items-center justify-center gap-5 p-5">
              <div
                className="rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--dp-border-strong)' }}
              >
                Dataset: 1000 строк
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
                {votes.map((vote, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 text-center text-xs"
                    style={{
                      borderColor: i < n ? GREEN : 'var(--dp-border-subtle)',
                      opacity: i < n ? 1 : 0.35,
                    }}
                  >
                    <div>bootstrap {i + 1}</div>
                    <div className="my-2 text-xl">🌳</div>
                    <div>p={vote.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div
                className="rounded-lg px-4 py-2 font-mono font-semibold"
                style={{ background: 'var(--dp-accent-subtle)', color: 'var(--dp-accent)' }}
              >
                average = {avg.toFixed(3)} → class {avg >= 0.5 ? 1 : 0}
              </div>
            </div>
            <Note>
              Bootstrap меняет строки, random feature subsets меняют доступные splits. Усреднение
              снижает variance; одинаковые деревья такого эффекта почти не дают.
            </Note>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function BoostingDemo() {
  const targets = [3, 5, 4, 8]
  const learners = [
    [-1, 0, -1, 2],
    [0, 1, -1, 1],
    [-0.5, 0.5, 0, 0.5],
  ]
  return (
    <VisualDemoFrame
      goal="Добавляйте weak learners: каждый следующий видит residuals текущего ансамбля."
      controls={[
        { name: 'step', label: 'Boosting step', type: 'slider', min: 0, max: 3, step: 1 },
        { name: 'lr', label: 'Learning rate', type: 'slider', min: 0.1, max: 1, step: 0.1 },
      ]}
      defaults={{ step: 2, lr: 0.5 }}
    >
      {(state) => <BoostingChart state={state} targets={targets} learners={learners} />}
    </VisualDemoFrame>
  )
}

function BoostingChart({
  state,
  targets,
  learners,
}: {
  state: DemoState
  targets: number[]
  learners: number[][]
}) {
  const step = Number(state.step)
  const lr = Number(state.lr)
  const prediction = targets.map(() => 5)
  for (let s = 0; s < step; s += 1)
    for (let i = 0; i < prediction.length; i += 1) prediction[i] += lr * learners[s][i]
  const residuals = targets.map((y, i) => y - prediction[i])
  const mse = residuals.reduce((sum, value) => sum + value ** 2, 0) / residuals.length
  return (
    <div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[460px] text-center text-sm">
          <thead>
            <tr style={{ color: 'var(--dp-text-muted)' }}>
              <th>x</th>
              {targets.map((_, i) => (
                <th key={i}>x{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left font-medium">target</td>
              {targets.map((v, i) => (
                <td key={i}>{v.toFixed(1)}</td>
              ))}
            </tr>
            <tr>
              <td className="text-left font-medium">prediction F{step}</td>
              {prediction.map((v, i) => (
                <td key={i} style={{ color: BLUE }}>
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-left font-medium">residual y−F</td>
              {residuals.map((v, i) => (
                <td key={i} style={{ color: v > 0 ? GREEN : RED }}>
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Current MSE" value={mse.toFixed(3)} />
          <Metric label="Next tree target" value={step < 3 ? 'current residuals' : '—'} />
        </div>
      </div>
      <Note>
        F₀=mean(y)=5. На каждом шаге Fₘ(x)=Fₘ₋₁(x)+η·treeₘ(x). Learning rate уменьшает вклад дерева
        и обычно требует больше итераций.
      </Note>
    </div>
  )
}

const KNN_POINTS = [
  { x: 1, y: 1, c: 0 },
  { x: 1.6, y: 2.2, c: 0 },
  { x: 2.3, y: 1.4, c: 0 },
  { x: 3, y: 2.6, c: 0 },
  { x: 4.4, y: 4.2, c: 1 },
  { x: 5.2, y: 3.5, c: 1 },
  { x: 5.8, y: 4.8, c: 1 },
  { x: 6.5, y: 3.8, c: 1 },
]

export function KnnDemo() {
  return (
    <VisualDemoFrame
      goal="Меняйте k и положение query point: решение определяется локальным голосованием и масштабом признаков."
      controls={[
        { name: 'k', label: 'k neighbours', type: 'slider', min: 1, max: 7, step: 2 },
        { name: 'qx', label: 'Query x', type: 'slider', min: 1, max: 6.5, step: 0.1 },
      ]}
      defaults={{ k: 3, qx: 3.8 }}
    >
      {(state) => <KnnChart state={state} />}
    </VisualDemoFrame>
  )
}

function KnnChart({ state }: { state: DemoState }) {
  const q = { x: Number(state.qx), y: 3 }
  const k = Number(state.k)
  const ranked = KNN_POINTS.map((p, i) => ({ ...p, i, d: Math.hypot(p.x - q.x, p.y - q.y) })).sort(
    (a, b) => a.d - b.d,
  )
  const near = new Set(ranked.slice(0, k).map((p) => p.i))
  const votes = ranked.slice(0, k).filter((p) => p.c === 1).length
  const pred = votes > k / 2 ? 1 : 0
  const sx = (x: number) => 45 + x * 65
  const sy = (y: number) => 245 - y * 42
  return (
    <div>
      <svg viewBox="0 0 540 275" className="w-full" role="img" aria-label="k ближайших соседей">
        {KNN_POINTS.map((p, i) => (
          <g key={i}>
            <circle
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={near.has(i) ? 11 : 6}
              fill={p.c ? AMBER : BLUE}
              opacity={near.has(i) ? 1 : 0.45}
            />
            <text x={sx(p.x)} y={sy(p.y) + 4} textAnchor="middle" fill="white" fontSize="9">
              {near.has(i) ? '✓' : ''}
            </text>
          </g>
        ))}
        <circle
          cx={sx(q.x)}
          cy={sy(q.y)}
          r="9"
          fill={pred ? AMBER : BLUE}
          stroke="white"
          strokeWidth="3"
        />
        <text x="48" y="30" fill="var(--dp-text-primary)" fontSize="13">
          Голосование: class 1 = {votes}, class 0 = {k - votes} → prediction {pred}
        </text>
      </svg>
      <Note>
        Маленькое k даёт низкий bias и высокую variance; большое k сглаживает границу и может
        игнорировать локальную структуру.
      </Note>
    </div>
  )
}

const CLUSTER_POINTS = [
  [1, 1],
  [1.4, 1.8],
  [2, 1.2],
  [4.8, 4.3],
  [5.3, 3.7],
  [5.9, 4.8],
  [3.2, 1.1],
  [4, 3.4],
] as const

export function KMeansDemo() {
  return (
    <VisualDemoFrame
      goal="Переключайте шаги assignment/update. K-Means минимизирует сумму квадратов расстояний до центроидов."
      controls={[
        { name: 'iteration', label: 'Iteration', type: 'slider', min: 0, max: 4, step: 1 },
      ]}
      defaults={{ iteration: 2 }}
    >
      {(state) => <KMeansChart iteration={Number(state.iteration)} />}
    </VisualDemoFrame>
  )
}

function KMeansChart({ iteration }: { iteration: number }) {
  let centers: [number, number][] = [
    [1.2, 4.5],
    [5.8, 1],
  ]
  let assignments: number[] = []
  for (let step = 0; step <= iteration; step += 1) {
    assignments = CLUSTER_POINTS.map(([x, y]) =>
      Math.hypot(x - centers[0][0], y - centers[0][1]) <=
      Math.hypot(x - centers[1][0], y - centers[1][1])
        ? 0
        : 1,
    )
    if (step < iteration)
      centers = [0, 1].map((cluster) => {
        const pts = CLUSTER_POINTS.filter((_, i) => assignments[i] === cluster)
        return [
          pts.reduce((s, p) => s + p[0], 0) / pts.length,
          pts.reduce((s, p) => s + p[1], 0) / pts.length,
        ] as [number, number]
      })
  }
  const sx = (x: number) => 48 + x * 70
  const sy = (y: number) => 260 - y * 43
  return (
    <div>
      <svg viewBox="0 0 540 290" className="w-full" role="img" aria-label="Итерации K-Means">
        {CLUSTER_POINTS.map(([x, y], i) => (
          <g key={i}>
            <line
              x1={sx(x)}
              y1={sy(y)}
              x2={sx(centers[assignments[i]][0])}
              y2={sy(centers[assignments[i]][1])}
              stroke={assignments[i] ? AMBER : BLUE}
              opacity="0.22"
            />
            <circle cx={sx(x)} cy={sy(y)} r="7" fill={assignments[i] ? AMBER : BLUE} />
          </g>
        ))}
        {centers.map(([x, y], i) => (
          <text
            key={i}
            x={sx(x)}
            y={sy(y) + 8}
            textAnchor="middle"
            fontSize="24"
            fontWeight="800"
            fill={i ? AMBER : BLUE}
          >
            ×
          </text>
        ))}
        <text x="48" y="30" fill="var(--dp-text-primary)" fontSize="13">
          Iteration {iteration}: assign → recompute mean → repeat
        </text>
      </svg>
      <Note>
        Алгоритм сошёлся, когда assignments и центроиды больше не меняются. Результат зависит от
        initialization и выбранного k.
      </Note>
    </div>
  )
}

const PCA_POINTS = [
  [-2.4, -1.4],
  [-1.8, -1.2],
  [-1.1, -0.4],
  [-0.3, -0.5],
  [0.4, 0.4],
  [1.1, 0.5],
  [1.8, 1.4],
  [2.5, 1.5],
] as const

export function PcaDemo() {
  return (
    <VisualDemoFrame
      goal="Поворачивайте ось проекции. PC1 — направление максимальной variance проекций."
      controls={[
        {
          name: 'angle',
          label: 'Axis angle',
          type: 'slider',
          min: 0,
          max: 180,
          step: 2,
          unit: '°',
        },
        { name: 'projection', label: 'Show projections', type: 'toggle' },
      ]}
      defaults={{ angle: 32, projection: true }}
    >
      {(state) => <PcaChart state={state} />}
    </VisualDemoFrame>
  )
}

function PcaChart({ state }: { state: DemoState }) {
  const angle = (Number(state.angle) * Math.PI) / 180
  const u = [Math.cos(angle), Math.sin(angle)]
  const projections = PCA_POINTS.map(([x, y]) => x * u[0] + y * u[1])
  const mean = projections.reduce((a, b) => a + b, 0) / projections.length
  const variance = projections.reduce((s, p) => s + (p - mean) ** 2, 0) / projections.length
  const sx = (x: number) => 270 + x * 75
  const sy = (y: number) => 145 - y * 65
  return (
    <div>
      <svg viewBox="0 0 540 290" className="w-full" role="img" aria-label="PCA проекция и variance">
        <line
          x1={sx(-4 * u[0])}
          y1={sy(-4 * u[1])}
          x2={sx(4 * u[0])}
          y2={sy(4 * u[1])}
          stroke={VIOLET}
          strokeWidth="3"
        />
        {PCA_POINTS.map(([x, y], i) => {
          const t = projections[i]
          const px = t * u[0]
          const py = t * u[1]
          return (
            <g key={i}>
              {state.projection && (
                <line
                  x1={sx(x)}
                  y1={sy(y)}
                  x2={sx(px)}
                  y2={sy(py)}
                  stroke={AMBER}
                  strokeDasharray="3 2"
                />
              )}
              <circle cx={sx(x)} cy={sy(y)} r="6" fill={BLUE} />
              {state.projection && <circle cx={sx(px)} cy={sy(py)} r="4" fill={AMBER} />}
            </g>
          )
        })}
        <text x="40" y="28" fill="var(--dp-text-primary)" fontSize="13">
          Variance on axis = {variance.toFixed(2)}
        </text>
      </svg>
      <Note>
        PCA сначала центрирует данные. Проекция сохраняет координату вдоль оси и отбрасывает
        перпендикулярную компоненту; максимум variance даёт PC1.
      </Note>
    </div>
  )
}

export function MetricsDemo() {
  return (
    <VisualDemoFrame
      goal="Свяжите threshold, confusion matrix и Precision/Recall. ROC и PR — траектории по всем thresholds, а не одна точка."
      controls={[
        { name: 'threshold', label: 'Threshold', type: 'slider', min: 0.05, max: 0.95, step: 0.05 },
      ]}
      defaults={{ threshold: 0.5 }}
    >
      {(state) => <MetricsChart threshold={Number(state.threshold)} />}
    </VisualDemoFrame>
  )
}

function MetricsChart({ threshold }: { threshold: number }) {
  const m = classificationAt(threshold)
  const positives = SCORED_POINTS.filter((p) => p.y).length
  const negatives = SCORED_POINTS.length - positives
  const tpr = m.tp / positives
  const fpr = m.fp / negatives
  return (
    <div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <div
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            Confusion matrix
          </div>
          <div className="grid grid-cols-2 gap-1 text-center font-mono text-lg">
            <div className="rounded-lg bg-emerald-500/15 p-5">TP {m.tp}</div>
            <div className="rounded-lg bg-rose-500/15 p-5">FP {m.fp}</div>
            <div className="rounded-lg bg-rose-500/15 p-5">FN {m.fn}</div>
            <div className="rounded-lg bg-emerald-500/15 p-5">TN {m.tn}</div>
          </div>
        </div>
        <svg viewBox="0 0 260 210" className="w-full" role="img" aria-label="Точка на ROC и PR">
          <line x1="35" y1="175" x2="230" y2="175" stroke="var(--dp-border-strong)" />
          <line x1="35" y1="175" x2="35" y2="20" stroke="var(--dp-border-strong)" />
          <line
            x1="35"
            y1="175"
            x2="230"
            y2="20"
            stroke="var(--dp-border-subtle)"
            strokeDasharray="4 3"
          />
          <circle cx={35 + fpr * 195} cy={175 - tpr * 155} r="8" fill={BLUE} />
          <text x="42" y="34" fill="var(--dp-text-primary)" fontSize="11">
            ROC: TPR={tpr.toFixed(2)}, FPR={fpr.toFixed(2)}
          </text>
          <text x="42" y="198" fill="var(--dp-text-muted)" fontSize="10">
            FPR →
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <Metric label="Precision" value={m.precision.toFixed(2)} />
        <Metric label="Recall" value={m.recall.toFixed(2)} />
        <Metric label="F1" value={m.f1.toFixed(2)} />
      </div>
      <Note>
        При сильном дисбалансе PR-кривая обычно информативнее ROC: она показывает качество
        положительных предсказаний без большого числа TN.
      </Note>
    </div>
  )
}

export function NeuronDemo() {
  return (
    <VisualDemoFrame
      goal="Измените inputs, weights и bias. Сначала вычисляется z, затем activation превращает его в output."
      controls={[
        { name: 'x1', label: 'x₁', type: 'slider', min: -2, max: 2, step: 0.1 },
        { name: 'x2', label: 'x₂', type: 'slider', min: -2, max: 2, step: 0.1 },
        { name: 'w1', label: 'w₁', type: 'slider', min: -2, max: 2, step: 0.1 },
        { name: 'w2', label: 'w₂', type: 'slider', min: -2, max: 2, step: 0.1 },
        { name: 'bias', label: 'bias', type: 'slider', min: -2, max: 2, step: 0.1 },
        {
          name: 'activation',
          label: 'Activation',
          type: 'select',
          options: [
            { value: 'relu', label: 'ReLU' },
            { value: 'sigmoid', label: 'sigmoid' },
            { value: 'tanh', label: 'tanh' },
          ],
        },
      ]}
      defaults={{ x1: 1, x2: 0.5, w1: 0.8, w2: -0.4, bias: 0.1, activation: 'relu' }}
    >
      {(state) => <NeuronChart state={state} />}
    </VisualDemoFrame>
  )
}

function activate(z: number, name: string) {
  if (name === 'sigmoid') return 1 / (1 + Math.exp(-z))
  if (name === 'tanh') return Math.tanh(z)
  return Math.max(0, z)
}

function NeuronChart({ state }: { state: DemoState }) {
  const z =
    Number(state.w1) * Number(state.x1) + Number(state.w2) * Number(state.x2) + Number(state.bias)
  const output = activate(z, String(state.activation))
  return (
    <div>
      <div className="flex min-h-56 flex-wrap items-center justify-center gap-4 p-5">
        <div className="space-y-2 font-mono text-sm">
          <div>
            x₁={Number(state.x1).toFixed(1)} × w₁={Number(state.w1).toFixed(1)}
          </div>
          <div>
            x₂={Number(state.x2).toFixed(1)} × w₂={Number(state.w2).toFixed(1)}
          </div>
          <div>bias={Number(state.bias).toFixed(1)}</div>
        </div>
        <div className="text-3xl" style={{ color: 'var(--dp-text-muted)' }}>
          →
        </div>
        <div className="rounded-full border-2 p-6 text-center" style={{ borderColor: VIOLET }}>
          <div className="text-xs">weighted sum</div>
          <strong className="font-mono">z={z.toFixed(3)}</strong>
        </div>
        <div className="text-3xl">→</div>
        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{ background: 'var(--dp-accent-subtle)' }}
        >
          <div className="text-xs">{String(state.activation)}(z)</div>
          <strong className="font-mono text-xl">{output.toFixed(3)}</strong>
        </div>
      </div>
      <Note>
        Вес задаёт чувствительность к признаку, bias сдвигает границу, activation добавляет
        нелинейность. Без нелинейности несколько linear layers схлопнутся в одну.
      </Note>
    </div>
  )
}

export function MlpDemo() {
  return (
    <VisualDemoFrame
      goal="Выберите hidden neuron и увидьте его локальное вычисление внутри MLP."
      controls={[
        { name: 'neuron', label: 'Hidden neuron', type: 'slider', min: 1, max: 4, step: 1 },
        { name: 'input', label: 'Input scale', type: 'slider', min: -1, max: 2, step: 0.1 },
      ]}
      defaults={{ neuron: 2, input: 1 }}
    >
      {(state) => <MlpChart state={state} />}
    </VisualDemoFrame>
  )
}

function MlpChart({ state }: { state: DemoState }) {
  const selected = Number(state.neuron) - 1
  const input = Number(state.input)
  const weights = [0.4, -0.7, 1.1, 0.2]
  const z = input * weights[selected] + 0.1
  const a = Math.max(0, z)
  const cols: Array<{ x: number; ys: number[] }> = [
    { x: 90, ys: [85, 145, 205] },
    { x: 270, ys: [58, 112, 166, 220] },
    { x: 455, ys: [115, 175] },
  ]
  return (
    <div>
      <svg viewBox="0 0 540 280" className="w-full" role="img" aria-label="Многослойный перцептрон">
        {cols[0].ys.flatMap((y, i) =>
          cols[1].ys.map((hy, j) => (
            <line
              key={`a${i}${j}`}
              x1={cols[0].x}
              y1={y}
              x2={cols[1].x}
              y2={hy}
              stroke={j === selected ? VIOLET : 'var(--dp-border-subtle)'}
              strokeWidth={j === selected ? 2 : 1}
            />
          )),
        )}
        {cols[1].ys.flatMap((y, i) =>
          cols[2].ys.map((oy, j) => (
            <line
              key={`b${i}${j}`}
              x1={cols[1].x}
              y1={y}
              x2={cols[2].x}
              y2={oy}
              stroke={i === selected ? VIOLET : 'var(--dp-border-subtle)'}
            />
          )),
        )}
        {cols.flatMap(({ x, ys }, c) =>
          ys.map((y, i) => (
            <circle
              key={`${c}-${i}`}
              cx={x}
              cy={y}
              r={c === 1 && i === selected ? 16 : 11}
              fill={c === 1 && i === selected ? VIOLET : c === 0 ? BLUE : AMBER}
            />
          )),
        )}
        <text x="55" y="260" fill="var(--dp-text-muted)" fontSize="11">
          input
        </text>
        <text x="240" y="260" fill="var(--dp-text-muted)" fontSize="11">
          hidden + ReLU
        </text>
        <text x="435" y="260" fill="var(--dp-text-muted)" fontSize="11">
          output
        </text>
        <text x="185" y="28" fill="var(--dp-text-primary)" fontSize="12">
          neuron {selected + 1}: z={input.toFixed(1)}·{weights[selected]}+0.1={z.toFixed(2)} → a=
          {a.toFixed(2)}
        </text>
      </svg>
      <Note>
        Каждый hidden neuron учит собственную комбинацию входов. Следующий слой комбинирует уже
        нелинейные признаки.
      </Note>
    </div>
  )
}

export function ActivationDemo() {
  return (
    <VisualDemoFrame
      goal="Сравните output и локальную производную ReLU, sigmoid и tanh — именно она масштабирует backward signal."
      controls={[
        {
          name: 'fn',
          label: 'Function',
          type: 'select',
          options: [
            { value: 'relu', label: 'ReLU' },
            { value: 'sigmoid', label: 'sigmoid' },
            { value: 'tanh', label: 'tanh' },
          ],
        },
        { name: 'x', label: 'x', type: 'slider', min: -5, max: 5, step: 0.1 },
      ]}
      defaults={{ fn: 'relu', x: -1 }}
    >
      {(state) => <ActivationChart state={state} />}
    </VisualDemoFrame>
  )
}

function ActivationChart({ state }: { state: DemoState }) {
  const fn = String(state.fn)
  const x = Number(state.x)
  const y = activate(x, fn)
  const derivative = fn === 'relu' ? (x > 0 ? 1 : 0) : fn === 'sigmoid' ? y * (1 - y) : 1 - y ** 2
  const values = Array.from({ length: 101 }, (_, i) => -5 + i * 0.1)
  const sy = (v: number) => 140 - v * 70
  const points = values.map((v) => `${40 + (v + 5) * 46},${sy(activate(v, fn))}`).join(' ')
  return (
    <div>
      <svg
        viewBox="0 0 540 280"
        className="w-full"
        role="img"
        aria-label="Activation function и derivative"
      >
        <line x1="40" y1="140" x2="500" y2="140" stroke="var(--dp-border-strong)" />
        <line x1="270" y1="25" x2="270" y2="245" stroke="var(--dp-border-strong)" />
        <polyline points={points} fill="none" stroke={VIOLET} strokeWidth="3" />
        <circle cx={40 + (x + 5) * 46} cy={sy(y)} r="7" fill={AMBER} />
        <text x="50" y="28" fill="var(--dp-text-primary)" fontSize="13">
          {fn}({x.toFixed(1)})={y.toFixed(3)} · derivative={derivative.toFixed(3)}
        </text>
      </svg>
      <Note>
        {fn === 'relu'
          ? 'ReLU не насыщается справа, но даёт нулевой gradient слева — возможны dead neurons.'
          : 'На больших |x| функция насыщается: derivative стремится к нулю, и gradient плохо проходит назад.'}
      </Note>
    </div>
  )
}

export function BackpropDemo() {
  return (
    <VisualDemoFrame
      goal="Пройдите один training step: forward → loss → chain rule → gradients → update."
      controls={[
        { name: 'step', label: 'Step', type: 'slider', min: 0, max: 4, step: 1 },
        { name: 'lr', label: 'Learning rate', type: 'slider', min: 0.05, max: 0.5, step: 0.05 },
      ]}
      defaults={{ step: 2, lr: 0.1 }}
    >
      {(state) => <BackpropChart state={state} />}
    </VisualDemoFrame>
  )
}

function BackpropChart({ state }: { state: DemoState }) {
  const step = Number(state.step)
  const lr = Number(state.lr)
  const x = 2
  const y = 5
  const w = 1
  const b = 0
  const pred = w * x + b
  const loss = (pred - y) ** 2
  const dPred = 2 * (pred - y)
  const dw = dPred * x
  const db = dPred
  const nextW = w - lr * dw
  const stages = [
    { title: 'Forward', detail: `ŷ = ${w}·${x}+${b} = ${pred}` },
    { title: 'Loss', detail: `(${pred}−${y})² = ${loss}` },
    { title: 'Backward', detail: `dL/dŷ=${dPred}; dL/dw=${dw}` },
    { title: 'Gradients', detail: `dw=${dw}, db=${db}` },
    { title: 'Update', detail: `w ← ${w}−${lr}·(${dw}) = ${nextW.toFixed(2)}` },
  ]
  return (
    <div>
      <div className="flex min-h-56 flex-wrap items-center justify-center gap-2 p-5">
        {stages.map((stage, i) => (
          <div key={stage.title} className="flex items-center gap-2">
            <div
              className="rounded-lg border px-3 py-3 text-center"
              style={{
                borderColor: i === step ? VIOLET : 'var(--dp-border-subtle)',
                opacity: i <= step ? 1 : 0.35,
              }}
            >
              <div className="text-xs font-semibold">{stage.title}</div>
              <div className="mt-1 font-mono text-[11px]">{stage.detail}</div>
            </div>
            {i < stages.length - 1 && <span style={{ color: 'var(--dp-text-muted)' }}>→</span>}
          </div>
        ))}
      </div>
      <Note>
        Backprop не «обучает» сеть сам: он эффективно вычисляет gradients через chain rule.
        Optimizer использует их для обновления параметров.
      </Note>
    </div>
  )
}

const IMAGE = [
  [1, 1, 0, 0],
  [1, 1, 0, 1],
  [0, 0, 1, 1],
  [0, 1, 1, 1],
]
const KERNEL = [
  [1, -1],
  [1, -1],
]

function matrixOutput(pool = false) {
  const out: number[][] = []
  const size = pool ? 2 : 3
  for (let r = 0; r < size; r += 1) {
    out[r] = []
    for (let c = 0; c < size; c += 1)
      out[r][c] = pool
        ? Math.max(
            IMAGE[r * 2][c * 2],
            IMAGE[r * 2][c * 2 + 1],
            IMAGE[r * 2 + 1][c * 2],
            IMAGE[r * 2 + 1][c * 2 + 1],
          )
        : IMAGE[r][c] * KERNEL[0][0] +
          IMAGE[r][c + 1] * KERNEL[0][1] +
          IMAGE[r + 1][c] * KERNEL[1][0] +
          IMAGE[r + 1][c + 1] * KERNEL[1][1]
  }
  return out
}

function Matrix({
  values,
  active,
  color = BLUE,
}: {
  values: number[][]
  active?: number
  color?: string
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(30px, 42px))` }}
    >
      {values.flatMap((row, r) =>
        row.map((value, c) => {
          const index = r * row.length + c
          return (
            <div
              key={`${r}-${c}`}
              className="flex aspect-square items-center justify-center rounded border font-mono text-sm"
              style={{
                borderColor: index === active ? color : 'var(--dp-border-subtle)',
                background: index === active ? `${color}22` : 'var(--dp-surface)',
              }}
            >
              {value}
            </div>
          )
        }),
      )}
    </div>
  )
}

export function CnnDemo() {
  return (
    <VisualDemoFrame
      goal="Передвигайте kernel: каждый output cell — сумма поэлементных произведений локального окна."
      controls={[
        { name: 'position', label: 'Kernel position', type: 'slider', min: 0, max: 8, step: 1 },
      ]}
      defaults={{ position: 0 }}
    >
      {(state) => <ConvolutionChart position={Number(state.position)} />}
    </VisualDemoFrame>
  )
}

function ConvolutionChart({ position }: { position: number }) {
  const r = Math.floor(position / 3)
  const c = position % 3
  const patch = [
    [IMAGE[r][c], IMAGE[r][c + 1]],
    [IMAGE[r + 1][c], IMAGE[r + 1][c + 1]],
  ]
  const products = patch.map((row, i) => row.map((v, j) => v * KERNEL[i][j]))
  const sum = products.flat().reduce((a, b) => a + b, 0)
  const output = matrixOutput()
  return (
    <div>
      <div className="flex min-h-64 flex-wrap items-center justify-center gap-4 p-5">
        <div>
          <div className="mb-2 text-xs">image patch</div>
          <Matrix values={patch} />
        </div>
        <span>×</span>
        <div>
          <div className="mb-2 text-xs">kernel</div>
          <Matrix values={KERNEL} />
        </div>
        <span>→</span>
        <div>
          <div className="mb-2 text-xs">products</div>
          <Matrix values={products} />
        </div>
        <span>
          = <strong>{sum}</strong>
        </span>
        <div>
          <div className="mb-2 text-xs">feature map</div>
          <Matrix values={output} active={position} color={AMBER} />
        </div>
      </div>
      <Note>
        Один и тот же kernel используется во всех позициях — parameter sharing. Он реагирует на
        локальный pattern независимо от его координаты.
      </Note>
    </div>
  )
}

export function PoolingDemo() {
  const output = matrixOutput(true)
  return (
    <VisualDemoFrame
      goal="Перемещайте MaxPool 2×2. Pooling уменьшает spatial resolution и оставляет сильнейший response."
      controls={[{ name: 'position', label: 'Window', type: 'slider', min: 0, max: 3, step: 1 }]}
      defaults={{ position: 0 }}
    >
      {(state) => {
        const pos = Number(state.position)
        const r = Math.floor(pos / 2) * 2
        const c = (pos % 2) * 2
        const patch = [
          [IMAGE[r][c], IMAGE[r][c + 1]],
          [IMAGE[r + 1][c], IMAGE[r + 1][c + 1]],
        ]
        return (
          <div>
            <div className="flex min-h-56 flex-wrap items-center justify-center gap-5 p-5">
              <Matrix values={patch} />
              <span>
                max = <strong>{Math.max(...patch.flat())}</strong>
              </span>
              <span>→</span>
              <Matrix values={output} active={pos} color={AMBER} />
            </div>
            <Note>
              MaxPool не имеет обучаемых параметров. Он даёт небольшую устойчивость к сдвигу, но
              теряет точную spatial information.
            </Note>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

const TOKENS = ['модель', 'видит', 'важный', 'контекст']
const ATTENTION = [
  [0.42, 0.18, 0.14, 0.26],
  [0.12, 0.34, 0.18, 0.36],
  [0.16, 0.12, 0.48, 0.24],
  [0.28, 0.16, 0.22, 0.34],
]

export function AttentionDemo() {
  return (
    <VisualDemoFrame
      goal="Выберите query token и этап вычисления QKᵀ → scale → softmax → weighted V."
      controls={[
        {
          name: 'query',
          label: 'Query token',
          type: 'select',
          options: TOKENS.map((token, i) => ({ value: String(i), label: token })),
        },
        { name: 'step', label: 'Computation step', type: 'slider', min: 0, max: 4, step: 1 },
      ]}
      defaults={{ query: '0', step: 3 }}
    >
      {(state) => <AttentionChart query={Number(state.query)} step={Number(state.step)} />}
    </VisualDemoFrame>
  )
}

function AttentionChart({ query, step }: { query: number; step: number }) {
  const labels = ['Q, K, V projections', 'QKᵀ scores', '÷√dₖ', 'softmax weights', 'Σ weight·V']
  const weights = ATTENTION[query]
  return (
    <div>
      <div className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          {labels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  borderColor: i === step ? VIOLET : 'var(--dp-border-subtle)',
                  opacity: i <= step ? 1 : 0.3,
                }}
              >
                {label}
              </div>
              {i < labels.length - 1 && <span>→</span>}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {TOKENS.map((token, i) => (
            <div key={token} className="grid grid-cols-[90px_1fr_50px] items-center gap-2 text-sm">
              <span style={{ color: i === query ? VIOLET : 'var(--dp-text-secondary)' }}>
                {token}
              </span>
              <div
                className="h-6 overflow-hidden rounded"
                style={{ background: 'var(--dp-border-subtle)' }}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${weights[i] * 100}%`,
                    background: i === query ? VIOLET : BLUE,
                    opacity: 0.75,
                  }}
                />
              </div>
              <span className="font-mono text-xs">{weights[i].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      <Note>
        Строка softmax суммируется в 1: это веса смешивания value-векторов для выбранного query. Q
        отвечает «что ищу», K — «что предлагаю», V — «какую информацию передаю».
      </Note>
    </div>
  )
}

export function TransformerDemo() {
  const stages = [
    'tokens',
    'embeddings + position',
    'multi-head attention',
    'residual + norm',
    'FFN',
    'residual + norm',
    'logits',
  ]
  return (
    <VisualDemoFrame
      goal="Пройдите high-level flow Transformer block. Следите, где смешиваются tokens, а где преобразуется каждый token отдельно."
      controls={[
        { name: 'stage', label: 'Stage', type: 'slider', min: 0, max: 6, step: 1 },
        { name: 'layers', label: 'Blocks', type: 'slider', min: 1, max: 6, step: 1 },
      ]}
      defaults={{ stage: 2, layers: 2 }}
    >
      {(state) => {
        const stage = Number(state.stage)
        return (
          <div>
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-5">
              {stages.map((label, i) => (
                <div
                  key={label}
                  className="w-full max-w-md rounded-lg border px-4 py-2 text-center text-sm"
                  style={{
                    borderColor: i === stage ? VIOLET : 'var(--dp-border-subtle)',
                    background: i === stage ? `${VIOLET}18` : undefined,
                    opacity: i <= stage ? 1 : 0.32,
                  }}
                >
                  {label}
                  {label === 'multi-head attention' && ` · ${Number(state.layers)} block(s)`}
                </div>
              ))}
            </div>
            <Note>
              Attention смешивает информацию между positions; FFN применяется независимо к каждому
              token. Residual paths помогают gradient flow, LayerNorm стабилизирует масштабы.
            </Note>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}
