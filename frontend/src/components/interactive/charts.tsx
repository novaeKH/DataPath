/**
 * Лёгкие SVG-визуализации для лабораторий (без тяжёлых графических библиотек).
 * Цвета подобраны так, чтобы работать в обеих темах.
 */

const CLS_COLORS = ['#3b82f6', '#f59e0b'] // класс 0 / класс 1

function niceTicks(min: number, max: number, count = 5): number[] {
  const step = (max - min) / count
  return Array.from({ length: count + 1 }, (_, i) => min + step * i)
}

/** Scatter plot с линией разбиения (вертикальной или горизонтальной). */
export function ScatterPlot({
  points,
  xRange,
  yRange,
  splitFeature,
  splitThreshold,
  width = 520,
  height = 380,
}: {
  points: { x1: number; x2: number; y: number }[]
  xRange: [number, number]
  yRange: [number, number]
  splitFeature: 'x1' | 'x2'
  splitThreshold: number
  width?: number
  height?: number
}) {
  const pad = { l: 44, r: 16, t: 16, b: 36 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const sx = (v: number) => pad.l + ((v - xRange[0]) / (xRange[1] - xRange[0])) * innerW
  const sy = (v: number) => pad.t + innerH - ((v - yRange[0]) / (yRange[1] - yRange[0])) * innerH
  const ticksX = niceTicks(xRange[0], xRange[1])
  const ticksY = niceTicks(yRange[0], yRange[1])

  const lineX = splitFeature === 'x1' ? sx(splitThreshold) : null
  const lineY = splitFeature === 'x2' ? sy(splitThreshold) : null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Точки датасета и линия разбиения"
    >
      {ticksX.map((tick) => (
        <g key={`x${tick}`}>
          <line
            x1={sx(tick)}
            y1={pad.t}
            x2={sx(tick)}
            y2={pad.t + innerH}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <text
            x={sx(tick)}
            y={height - 14}
            textAnchor="middle"
            fontSize={11}
            className="fill-slate-500"
          >
            {tick.toFixed(1)}
          </text>
        </g>
      ))}
      {ticksY.map((tick) => (
        <g key={`y${tick}`}>
          <line
            x1={pad.l}
            y1={sy(tick)}
            x2={pad.l + innerW}
            y2={sy(tick)}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <text
            x={pad.l - 8}
            y={sy(tick) + 4}
            textAnchor="end"
            fontSize={11}
            className="fill-slate-500"
          >
            {tick.toFixed(1)}
          </text>
        </g>
      ))}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={sx(point.x1)}
          cy={sy(point.x2)}
          r={5}
          fill={CLS_COLORS[point.y] ?? '#94a3b8'}
          fillOpacity={0.85}
          stroke="white"
          strokeWidth={1}
        />
      ))}
      {lineX !== null && (
        <line
          x1={lineX}
          y1={pad.t}
          x2={lineX}
          y2={pad.t + innerH}
          stroke="#dc2626"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
      )}
      {lineY !== null && (
        <line
          x1={pad.l}
          y1={lineY}
          x2={pad.l + innerW}
          y2={lineY}
          stroke="#dc2626"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
      )}
      <text x={pad.l} y={14} fontSize={12} className="fill-slate-500">
        признак x1
      </text>
      <text
        x={width - pad.r}
        y={pad.t + innerH + 18}
        textAnchor="end"
        fontSize={12}
        className="fill-slate-500"
      >
        признак x2
      </text>
    </svg>
  )
}

/** Heatmap decision boundary: сетка предсказаний модели. */
export function BoundaryPlot({
  x,
  y,
  preds,
  width = 380,
  height = 380,
}: {
  x: number[]
  y: number[]
  preds: number[]
  width?: number
  height?: number
}) {
  const size = Math.round(Math.sqrt(preds.length))
  const pad = 10
  const cellW = (width - pad * 2) / size
  const cellH = (height - pad * 2) / size
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
      role="img"
      aria-label="Граница решения модели"
    >
      {Array.from({ length: size * size }, (_, i) => {
        const col = i % size
        const row = Math.floor(i / size)
        const value = preds[i] ?? 0
        return (
          <rect
            key={i}
            x={pad + col * cellW}
            y={pad + row * cellH}
            width={cellW + 0.5}
            height={cellH + 0.5}
            fill={value === 0 ? 'rgba(59,130,246,0.25)' : 'rgba(245,158,11,0.25)'}
          />
        )
      })}
      <text x={pad} y={12} fontSize={10} className="fill-slate-400">
        {x.length}×{y.length} сетка предсказаний
      </text>
    </svg>
  )
}

/** Линейный график (например, кривая качества train/val по глубине). */
export function LineChart({
  series,
  xLabels,
  xLabel,
  yLabel,
  width = 520,
  height = 260,
}: {
  series: { name: string; color: string; values: number[] }[]
  xLabels: number[]
  xLabel: string
  yLabel: string
  width?: number
  height?: number
}) {
  const pad = { l: 40, r: 12, t: 12, b: 28 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const allValues = series.flatMap((s) => s.values)
  const yMin = Math.min(0, ...allValues) - 0.05
  const yMax = Math.min(1.05, Math.max(...allValues) + 0.05)
  const xMin = Math.min(...xLabels)
  const xMax = Math.max(...xLabels)
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin || 1)) * innerW
  const sy = (v: number) => pad.t + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`${yLabel} по ${xLabel}`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line
            x1={pad.l}
            y1={sy(tick)}
            x2={pad.l + innerW}
            y2={sy(tick)}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <text
            x={pad.l - 6}
            y={sy(tick) + 3}
            textAnchor="end"
            fontSize={10}
            className="fill-slate-500"
          >
            {tick.toFixed(2)}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <polyline
          key={s.name}
          points={s.values.map((v, i) => `${sx(xLabels[i])},${sy(v)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
        />
      ))}
      {xLabels.map((label) => (
        <text
          key={label}
          x={sx(label)}
          y={height - 10}
          textAnchor="middle"
          fontSize={10}
          className="fill-slate-500"
        >
          {label}
        </text>
      ))}
      <text x={pad.l} y={10} fontSize={11} className="fill-slate-500">
        {yLabel}
      </text>
      {series.map((s) => (
        <g key={`legend-${s.name}`}>
          <line
            x1={pad.l}
            y1={pad.t - 10 + series.indexOf(s) * 14}
            x2={pad.l + 14}
            y2={pad.t - 10 + series.indexOf(s) * 14}
            stroke={s.color}
            strokeWidth={2}
          />
          <text
            x={pad.l + 18}
            y={pad.t - 6 + series.indexOf(s) * 14}
            fontSize={10}
            className="fill-slate-600 dark:fill-slate-300"
          >
            {s.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** Горизонтальные бары сравнения метрик моделей. */
export function MetricBars({ items }: { items: { name: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 0.01)
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3 text-sm">
          <div className="w-32 shrink-0 truncate text-right text-slate-600 dark:text-slate-300">
            {item.name}
          </div>
          <div className="h-5 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
            <div
              className="flex h-full items-center rounded bg-sky-500 px-2 text-[11px] font-medium text-white transition-all duration-300"
              style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }}
            >
              {item.value.toFixed(3)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { CLS_COLORS }
