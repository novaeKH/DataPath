import type { LabRunResult } from '../../lib/api'
import { ScatterPlot } from './charts'

type SplitResult = {
  dataset: {
    points: { x1: number; x2: number; y: number }[]
    classes: number[]
    x_range: [number, number]
    y_range: [number, number]
  }
  split: { feature: 'x1' | 'x2'; threshold: number; left_count: number; right_count: number }
  impurity: {
    criterion: string
    parent: number
    left: number
    right: number
    weighted: number
  }
  gain: number
  explanation: string
}

/** Лаборатория 1: разбиение Decision Tree. */
export function DecisionTreeSplitLab({ result }: { result: LabRunResult }) {
  const data = result as unknown as SplitResult

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <ScatterPlot
          points={data.dataset.points}
          xRange={data.dataset.x_range}
          yRange={data.dataset.y_range}
          splitFeature={data.split.feature}
          splitThreshold={data.split.threshold}
        />
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> класс 0
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> класс 1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-red-600" />{' '}
            линия разбиения
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Слева" value={`${data.split.left_count} объектов`} />
          <Metric label="Справа" value={`${data.split.right_count} объектов`} />
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">
            Impurity ({data.impurity.criterion})
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
            <dt className="text-slate-500">родитель</dt>
            <dd className="text-right font-mono text-slate-800 dark:text-slate-200">
              {data.impurity.parent.toFixed(4)}
            </dd>
            <dt className="text-slate-500">лево</dt>
            <dd className="text-right font-mono text-slate-800 dark:text-slate-200">
              {data.impurity.left.toFixed(4)}
            </dd>
            <dt className="text-slate-500">право</dt>
            <dd className="text-right font-mono text-slate-800 dark:text-slate-200">
              {data.impurity.right.toFixed(4)}
            </dd>
            <dt className="text-slate-500">взвешенная</dt>
            <dd className="text-right font-mono text-slate-800 dark:text-slate-200">
              {data.impurity.weighted.toFixed(4)}
            </dd>
          </dl>
        </div>
        <div
          className={`rounded-lg px-4 py-3 text-[13px] ${
            data.gain > 0.05
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
          }`}
        >
          <div className="font-semibold">
            Information gain: <span className="font-mono">{data.gain.toFixed(4)}</span>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {data.explanation}
        </p>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value}</div>
    </div>
  )
}
