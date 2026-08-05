import { useCallback, useEffect, useState } from 'react'
import { fetchLabSpec, runLab, type LabRunResult, type LabSpec } from '../../lib/api'
import { LabFrame, type Params } from './LabFrame'
import { DecisionTreeSplitLab } from './DecisionTreeSplitLab'
import { TreeOverfittingLab } from './TreeOverfittingLab'
import { EnsembleComparisonLab } from './EnsembleComparisonLab'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; spec: LabSpec }

/** Хост лаборатории внутри сцены урока: загрузка spec + выполнение расчётов. */
export function LabHost({ labId, title }: { labId: string; title: string | null }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [result, setResult] = useState<LabRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState({ kind: 'loading' })
      try {
        const spec = await fetchLabSpec(labId, signal)
        setResult(spec.initial_result)
        setState({ kind: 'ready', spec })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({ kind: 'error', message: `Не удалось загрузить лабораторию ${labId}` })
      }
    },
    [labId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const handleRun = useCallback(
    async (params: Params) => {
      setBusy(true)
      setError(null)
      try {
        const next = await runLab(labId, params)
        setResult(next)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка расчёта лаборатории')
      } finally {
        setBusy(false)
      }
    },
    [labId],
  )

  if (state.kind === 'loading') {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-500 dark:border-slate-800">
        Загрузка лаборатории…
      </div>
    )
  }
  if (state.kind === 'error') {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200">
        {state.message}. Проверьте, что backend запущен.
      </div>
    )
  }

  const spec = state.spec
  return (
    <section className="datapath-scene" aria-label={title ?? spec.title}>
      <LabFrame
        spec={spec}
        result={result ?? spec.initial_result}
        onRun={(params) => void handleRun(params)}
        renderResult={(current) => <LabResult labId={spec.id} result={current} />}
        busy={busy}
        error={error}
      />
    </section>
  )
}

/** Рендер результата конкретной лаборатории. */
function LabResult({ labId, result }: { labId: string; result: LabRunResult }) {
  switch (labId) {
    case 'decision-tree-split-lab':
      return <DecisionTreeSplitLab result={result} />
    case 'tree-depth-overfitting-lab':
      return <TreeOverfittingLab result={result} />
    case 'ensemble-comparison-lab':
      return <EnsembleComparisonLab result={result} />
    default:
      return <pre className="text-xs text-slate-500">{JSON.stringify(result, null, 2)}</pre>
  }
}
