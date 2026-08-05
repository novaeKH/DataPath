import type { LabRunResult } from '../../lib/api'
import { BoundaryPlot, MetricBars } from './charts'

type EnsembleResult = {
  dataset: { x_range: [number, number]; y_range: [number, number]; catboost_available: boolean }
  models: {
    key: string
    name: string
    train_accuracy: number
    val_accuracy: number
    time_ms: number
    params: string
  }[]
  boundary: { x: number[]; y: number[]; grids: Record<string, number[]> }
  explanation: string
}

/** Лаборатория 3: дерево, Random Forest и boosting. */
export function EnsembleComparisonLab({ result }: { result: LabRunResult }) {
  const data = result as unknown as EnsembleResult

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-3 py-2 font-semibold">Модель</th>
              <th className="px-3 py-2 font-semibold">Train</th>
              <th className="px-3 py-2 font-semibold">Validation</th>
              <th className="px-3 py-2 font-semibold">Время</th>
              <th className="px-3 py-2 font-semibold">Параметры</th>
            </tr>
          </thead>
          <tbody>
            {data.models.map((model) => (
              <tr
                key={model.key}
                className="border-b border-slate-100 text-slate-700 last:border-0 dark:border-slate-800/60 dark:text-slate-300"
              >
                <td className="px-3 py-2 font-medium">{model.name}</td>
                <td className="px-3 py-2 font-mono">{model.train_accuracy.toFixed(3)}</td>
                <td className="px-3 py-2 font-mono">{model.val_accuracy.toFixed(3)}</td>
                <td className="px-3 py-2 font-mono">{model.time_ms} мс</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{model.params}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Validation accuracy
        </div>
        <MetricBars
          items={data.models.map((model) => ({ name: model.name, value: model.val_accuracy }))}
        />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Границы решения
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.models.map((model) => (
            <div key={model.key} className="text-center">
              <BoundaryPlot
                x={data.boundary.x}
                y={data.boundary.y}
                preds={data.boundary.grids[model.key] ?? []}
              />
              <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                {model.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-lg bg-slate-100 px-4 py-3 text-[13px] leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {data.explanation}
      </p>
      {!data.dataset.catboost_available && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          CatBoost не установлен в этом окружении — в сравнении участвуют Decision Tree, Random
          Forest и Gradient Boosting.
        </p>
      )}
    </div>
  )
}
