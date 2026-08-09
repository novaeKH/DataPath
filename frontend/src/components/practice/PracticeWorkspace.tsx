import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  checkCodePractice,
  fetchPractice,
  runSqlPractice,
  type PracticeCatalog,
  type PracticeCheckResult,
} from '../../lib/api'
import { Button } from '../ui/Button'
import { EmptyState, ErrorState, LoadingBlock } from '../ui/PageState'
import { buttonClassNames } from '../ui/buttonStyles'

const TRACK_LABEL: Record<string, string> = {
  sql: 'SQL',
  pandas: 'pandas',
  numpy: 'NumPy',
  sklearn: 'scikit-learn',
  'deep-learning': 'Deep Learning',
}

type CatalogState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; catalog: PracticeCatalog }

function usePracticeCatalog() {
  const [state, setState] = useState<CatalogState>({ kind: 'loading' })
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setState({ kind: 'loading' })
      const catalog = await fetchPractice(signal)
      const exercises = catalog.exercises.filter((exercise) => exercise.track !== 'algorithms')
      setState({
        kind: 'ready',
        catalog: {
          ...catalog,
          exercises,
          total_count: exercises.length,
          completed_count: exercises.filter((exercise) => exercise.completed).length,
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({ kind: 'error', message: 'Не удалось загрузить практику.' })
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])
  return { state, load }
}

export function PracticeLibrary() {
  const { state, load } = usePracticeCatalog()
  const [query, setQuery] = useState('')
  const [track, setTrack] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')
  if (state.kind === 'loading') return <LoadingBlock label="Загрузка практики…" rows={3} />
  if (state.kind === 'error')
    return (
      <ErrorState title="Практика недоступна" message={state.message} onRetry={() => void load()} />
    )
  const filtered = state.catalog.exercises.filter((exercise) => {
    if (track !== 'all' && exercise.track !== track) return false
    if (difficulty !== 'all' && exercise.difficulty !== difficulty) return false
    if (status === 'completed' && !exercise.completed) return false
    if (status === 'open' && exercise.completed) return false
    return exercise.title.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))
  })
  const grouped = filtered.reduce<Record<string, PracticeCatalog['exercises']>>(
    (tracks, exercise) => {
      ;(tracks[exercise.track] ??= []).push(exercise)
      return tracks
    },
    {},
  )
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
            Практические тренажёры
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
            SQL выполняется в учебной SQLite. Остальные задачи проверяют обязательные шаги решения и
            сохраняют evidence.
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
          {state.catalog.completed_count}/{state.catalog.total_count} завершено
        </span>
      </div>
      <div
        className="mt-5 grid gap-2 rounded-xl p-3 sm:grid-cols-[minmax(180px,1fr)_repeat(3,auto)]"
        style={{ background: 'var(--dp-surface-interactive)' }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти упражнение…"
          aria-label="Поиск упражнений"
          className="min-w-0 rounded-lg border px-3 py-2 text-xs outline-none"
          style={{
            background: 'var(--dp-surface)',
            borderColor: 'var(--dp-border-subtle)',
            color: 'var(--dp-text-primary)',
          }}
        />
        <select
          value={track}
          onChange={(event) => setTrack(event.target.value)}
          aria-label="Направление практики"
          className="rounded-lg border px-3 py-2 text-xs"
          style={{ background: 'var(--dp-surface)', borderColor: 'var(--dp-border-subtle)' }}
        >
          <option value="all">Все направления</option>
          {Object.entries(TRACK_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          aria-label="Сложность"
          className="rounded-lg border px-3 py-2 text-xs"
          style={{ background: 'var(--dp-surface)', borderColor: 'var(--dp-border-subtle)' }}
        >
          <option value="all">Любая сложность</option>
          {[...new Set(state.catalog.exercises.map((item) => item.difficulty))].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Статус выполнения"
          className="rounded-lg border px-3 py-2 text-xs"
          style={{ background: 'var(--dp-surface)', borderColor: 'var(--dp-border-subtle)' }}
        >
          <option value="all">Любой статус</option>
          <option value="open">Не решено</option>
          <option value="completed">Завершено</option>
        </select>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {Object.entries(grouped).map(([track, exercises]) => (
          <div key={track} className="rounded-xl p-4 dp-surface">
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              {TRACK_LABEL[track] ?? track}
            </div>
            <div className="space-y-2">
              {(exercises ?? []).map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/studio?practice=${encodeURIComponent(exercise.id)}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition hover:-translate-y-px"
                  style={{
                    borderColor: 'var(--dp-border-subtle)',
                    background: 'var(--dp-surface-interactive)',
                  }}
                >
                  <span className="text-sm">
                    {exercise.completed ? '✓' : exercise.kind === 'sql' ? '▣' : '⌘'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-medium"
                      style={{ color: 'var(--dp-text-primary)' }}
                    >
                      {exercise.title}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                      {exercise.difficulty} · {exercise.estimated_minutes} мин
                    </span>
                  </span>
                  <span style={{ color: 'var(--dp-text-muted)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Ничего не найдено"
            description="Измените направление, сложность, статус или поисковый запрос."
          />
        </div>
      )}
    </section>
  )
}

export function PracticeWorkspace({
  exerciseId,
  onBack,
}: {
  exerciseId: string
  onBack: () => void
}) {
  const { state, load } = usePracticeCatalog()
  const [code, setCode] = useState('')
  const [result, setResult] = useState<PracticeCheckResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const exercise =
    state.kind === 'ready' ? state.catalog.exercises.find((item) => item.id === exerciseId) : null

  useEffect(() => {
    if (exercise) {
      setCode(exercise.starter_code)
      setResult(null)
      setError(null)
    }
  }, [exercise])

  const submit = async () => {
    if (!exercise || !code.trim()) return
    setRunning(true)
    setError(null)
    try {
      setResult(
        exercise.kind === 'sql'
          ? await runSqlPractice(exercise.id, code)
          : await checkCodePractice(exercise.id, code),
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось проверить решение.')
    } finally {
      setRunning(false)
    }
  }

  if (state.kind === 'loading') return <LoadingBlock label="Загрузка упражнения…" rows={5} />
  if (state.kind === 'error')
    return (
      <ErrorState title="Ошибка загрузки" message={state.message} onRetry={() => void load()} />
    )
  if (!exercise)
    return (
      <EmptyState
        title="Упражнение не найдено"
        description={exerciseId}
        action={<Button onClick={onBack}>К Studio</Button>}
      />
    )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="text-xs hover:underline"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            ← Studio
          </button>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: 'var(--dp-text-primary)' }}>
            {exercise.title}
          </h1>
          <div className="mt-1 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            {TRACK_LABEL[exercise.track]} · {exercise.difficulty} · ~{exercise.estimated_minutes}{' '}
            мин
          </div>
        </div>
        <Link to="/focus" className={buttonClassNames('outline', 'sm')}>
          Связанные уроки →
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="overflow-hidden rounded-xl dp-surface">
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--dp-border-subtle)' }}>
            <div
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              {exercise.kind === 'sql' ? 'SQLite editor' : 'Решение'}
            </div>
          </div>
          <textarea
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              setResult(null)
              setError(null)
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                void submit()
              }
            }}
            spellCheck={false}
            className="min-h-[360px] w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 outline-none"
            style={{ color: 'var(--dp-text-primary)' }}
            aria-label={exercise.kind === 'sql' ? 'SQL запрос' : 'Код решения'}
          />
          <div
            className="flex flex-wrap items-center gap-3 border-t px-4 py-3"
            style={{ borderColor: 'var(--dp-border-subtle)' }}
          >
            <Button onClick={() => void submit()} disabled={running || !code.trim()}>
              {running
                ? 'Проверяем…'
                : exercise.kind === 'sql'
                  ? 'Run и проверить'
                  : 'Проверить решение'}
            </Button>
            <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
              ⌘/Ctrl + Enter
            </span>
            <button
              onClick={() => setCode(exercise.starter_code)}
              className="ml-auto text-xs hover:underline"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              Сбросить
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl p-4 dp-surface">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
              Задача
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: 'var(--dp-text-secondary)' }}
            >
              {exercise.prompt}
            </p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium" style={{ color: 'var(--dp-accent)' }}>
                Подсказка
              </summary>
              <p className="mt-2" style={{ color: 'var(--dp-text-secondary)' }}>
                {exercise.hint}
              </p>
            </details>
          </section>
          {exercise.kind === 'sql' && exercise.schema && <SchemaCard schema={exercise.schema} />}
          {error && (
            <section className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
              {error}
            </section>
          )}
          {result && <ResultPanel result={result} />}
        </aside>
      </div>
      {result?.rows && result.columns && (
        <ResultTable columns={result.columns} rows={result.rows} />
      )}
    </div>
  )
}

function SchemaCard({ schema }: { schema: Record<string, string[]> }) {
  return (
    <section className="rounded-xl p-4 dp-surface">
      <h2 className="text-sm font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
        Учебная схема
      </h2>
      <div className="mt-3 space-y-3">
        {Object.entries(schema).map(([table, columns]) => (
          <div key={table}>
            <div className="font-mono text-xs font-semibold" style={{ color: 'var(--dp-accent)' }}>
              {table}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {columns.map((column) => (
                <span
                  key={column}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    background: 'var(--dp-surface-interactive)',
                    color: 'var(--dp-text-secondary)',
                  }}
                >
                  {column}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResultPanel({ result }: { result: PracticeCheckResult }) {
  return (
    <section
      className="rounded-xl border p-4"
      style={{
        borderColor: result.passed ? 'var(--dp-success)' : 'var(--dp-warning)',
        background: result.passed ? 'var(--dp-success-subtle)' : 'var(--dp-warning-subtle)',
      }}
    >
      <div
        className="text-sm font-semibold"
        style={{ color: result.passed ? 'var(--dp-success)' : 'var(--dp-warning)' }}
      >
        {result.passed ? '✓ Решение принято' : 'Нужна доработка'}
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
        {result.feedback}
      </p>
      {result.solution && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium">
            Показать эталонный разбор
          </summary>
          <pre
            className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg p-3 text-[11px]"
            style={{ background: 'var(--dp-surface)', color: 'var(--dp-text-primary)' }}
          >
            {result.solution}
          </pre>
        </details>
      )}
    </section>
  )
}

function ResultTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  const signature = useMemo(() => `${columns.join('|')}:${rows.length}`, [columns, rows.length])
  return (
    <section key={signature} className="mt-5 overflow-hidden rounded-xl dp-surface">
      <div
        className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide"
        style={{ borderColor: 'var(--dp-border-subtle)', color: 'var(--dp-text-muted)' }}
      >
        Результат · {rows.length} строк
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b px-4 py-2 font-mono text-xs"
                  style={{
                    borderColor: 'var(--dp-border-subtle)',
                    color: 'var(--dp-text-secondary)',
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border-b px-4 py-2 font-mono text-xs"
                    style={{
                      borderColor: 'var(--dp-border-subtle)',
                      color: 'var(--dp-text-primary)',
                    }}
                  >
                    {value == null ? (
                      <span style={{ color: 'var(--dp-text-muted)' }}>NULL</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
