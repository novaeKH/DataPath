import { useState } from 'react'
import type { LabParameter, LabRunResult, LabSpec } from '../../lib/api'

export type Params = Record<string, string | number>

/**
 * Общий каркас лаборатории: заголовок, инструкция, параметры, результат.
 *
 * Animation stability rules:
 * - Component root stays mounted during parameter changes.
 * - Keys are stable (based on param names, not values).
 * - No `transition: all` — specific properties only.
 * - No entrance animation on parameter updates — only on initial mount.
 * - Result renderer receives current result directly, no delayed derived state.
 */
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
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--dp-surface)',
        border: '1px solid var(--dp-border-subtle)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: 'var(--dp-accent)' }}
          >
            Интерактивная лаборатория
          </div>
          <h4 className="mt-1 text-lg font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
            {spec.title}
          </h4>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors dp-hover-interactive"
          style={{
            borderColor: 'var(--dp-border-subtle)',
            color: 'var(--dp-text-secondary)',
          }}
        >
          ↺ Сбросить параметры
        </button>
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
        {spec.description}
      </p>

      {/* Parameter controls — stable keys based on param names */}
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
        <div
          className="mt-4 rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: 'var(--dp-error-subtle)',
            border: '1px solid var(--dp-error)',
            borderColor: 'color-mix(in srgb, var(--dp-error) 30%, transparent)',
            color: 'var(--dp-error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Result area — always mounted, content updates via React reconciliation */}
      <div className="mt-5" style={{ minHeight: '120px' }}>
        {busy ? (
          <div
            className="flex h-32 items-center justify-center text-sm"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            Выполняем расчёт…
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
      <label
        className="flex flex-col gap-1 text-xs font-medium"
        style={{ color: 'var(--dp-text-secondary)' }}
      >
        {param.label}
        <select
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-colors"
          style={{
            background: 'var(--dp-surface)',
            borderColor: 'var(--dp-border-subtle)',
            color: 'var(--dp-text-primary)',
          }}
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
    <label
      className="flex flex-col gap-1 text-xs font-medium"
      style={{ color: 'var(--dp-text-secondary)' }}
    >
      {param.label}
      <input
        type="number"
        value={Number(value)}
        min={param.min}
        max={param.max}
        step={param.step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-36 rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-colors"
        style={{
          background: 'var(--dp-surface)',
          borderColor: 'var(--dp-border-subtle)',
          color: 'var(--dp-text-primary)',
        }}
      />
      {param.unit && (
        <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
          {param.unit}
        </span>
      )}
    </label>
  )
}
