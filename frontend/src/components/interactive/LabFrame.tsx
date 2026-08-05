import { useState } from 'react'
import type { LabParameter, LabRunResult, LabSpec } from '../../lib/api'

export type Params = Record<string, string | number>

/** Общий каркас лаборатории: заголовок, инструкция, параметры, результат. */
export function LabFrame({
  spec,
  result,
  onRun,
  renderResult,
  busy,
  error,
}: {
  spec: LabSpec
  result: LabRunResult
  onRun: (params: Params) => void
  renderResult: (result: LabRunResult) => React.ReactNode
  busy: boolean
  error: string | null
}) {
  const [params, setParams] = useState<Params>({ ...spec.defaults })

  const setParam = (name: string, value: string | number) => {
    const next = { ...params, [name]: value }
    setParams(next)
    onRun(next)
  }

  const reset = () => {
    const defaults = { ...spec.defaults }
    setParams(defaults)
    onRun(defaults)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Интерактивная лаборатория
          </div>
          <h4 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {spec.title}
          </h4>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ↺ Сбросить параметры
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{spec.description}</p>

      <div className="mt-4 flex flex-wrap gap-4">
        {spec.parameters.map((param) => (
          <ParameterControl
            key={param.name}
            param={param}
            value={params[param.name] ?? param.default}
            onChange={(value) => setParam(param.name, value)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-5">
        {busy ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            Вычисление на backend…
          </div>
        ) : (
          renderResult(result)
        )}
      </div>
    </div>
  )
}

function ParameterControl({
  param,
  value,
  onChange,
}: {
  param: LabParameter
  value: string | number
  onChange: (value: string | number) => void
}) {
  if (param.type === 'enum') {
    return (
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        {param.label}
        <select
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {param.values?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      {param.label}
      <input
        type="number"
        value={Number(value)}
        min={param.min}
        max={param.max}
        step={param.step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-36 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />
      {param.unit && <span className="text-[11px] text-slate-400">{param.unit}</span>}
    </label>
  )
}
