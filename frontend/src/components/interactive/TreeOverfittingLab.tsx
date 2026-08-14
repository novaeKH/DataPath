import type { LabRunResult } from '../../lib/api'
import { BoundaryPlot, LineChart, MetricBars } from './charts'

type OverfitResult = {
  dataset: {
    x_range: [number, number]
    y_range: [number, number]
    train_size: number
    val_size: number
  }
  metrics: {
    train_accuracy: number
    val_accuracy: number
    depth: number
    leaves: number
    time_ms: number
  }
  boundary: { x: number[]; y: number[]; preds: number[] }
  depth_curve: { depths: number[]; train: number[]; val: number[] }
  interpretation: { label: 'underfit' | 'good' | 'overfit'; text: string }
  runtime?: 'local'
}

const INTERPRETATION_STYLE: Record<string, string> = {
  underfit:
    'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100',
  good: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
  overfit:
    'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100',
}

const INTERPRETATION_LABEL: Record<string, string> = {
  underfit: 'Недообучение',
  good: 'Подходящая сложность',
  overfit: 'Переобучение',
}

/** Лаборатория 2: глубина дерева и переобучение. */
export function TreeOverfittingLab({ result }: { result: LabRunResult }) {
  const data = result as unknown as OverfitResult
  const style = INTERPRETATION_STYLE[data.interpretation.label] ?? INTERPRETATION_STYLE.good

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Train accuracy" value={data.metrics.train_accuracy.toFixed(3)} />
        <Metric label="Validation accuracy" value={data.metrics.val_accuracy.toFixed(3)} />
        <Metric label="Глубина дерева" value={`${data.metrics.depth} уровней`} />
        <Metric label="Листьев" value={`${data.metrics.leaves}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Граница решения
          </div>
          <BoundaryPlot x={data.boundary.x} y={data.boundary.y} preds={data.boundary.preds} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Качество по глубине (текущий min_samples_leaf)
          </div>
          <LineChart
            xLabels={data.depth_curve.depths}
            series={[
              { name: 'train', color: '#3b82f6', values: data.depth_curve.train },
              { name: 'validation', color: '#f59e0b', values: data.depth_curve.val },
            ]}
            xLabel="глубина"
            yLabel="accuracy"
          />
        </div>
      </div>

      <div className={`rounded-lg border-l-4 px-4 py-3 text-sm ${style}`}>
        <div className="font-semibold">{INTERPRETATION_LABEL[data.interpretation.label]}</div>
        <p className="mt-1 leading-relaxed">{data.interpretation.text}</p>
      </div>

      <div className="text-xs text-slate-500">
        Датасет: {data.dataset.train_size} train / {data.dataset.val_size} validation · расчёт{' '}
        {data.runtime === 'local' ? 'локально в PWA' : 'на backend'} ({data.metrics.time_ms} мс)
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </div>
    </div>
  )
}

export { MetricBars }
