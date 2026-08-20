import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchCase,
  fetchCases,
  fetchCaseAttempts,
  submitCase,
  type CaseQuestion,
  type CaseSpec,
  type CaseSubmitResult,
} from '../lib/api'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'
import { Button } from '../components/ui/Button'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { PracticeLibrary, PracticeWorkspace } from '../components/practice/PracticeWorkspace'

type Mode = 'guided' | 'standard' | 'interview'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; cases: CaseSpec[] }

type RunState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; spec: CaseSpec }

const MODE_LABEL: Record<Mode, string> = {
  guided: 'Guided — подсказки и подробная обратная связь',
  standard: 'Standard — без промежуточных подсказок',
  interview: 'Interview — краткая формулировка и итоговый разбор',
}

/** Значения difficulty, которые на самом деле являются режимом кейса. */
const MODE_LIKE_DIFFICULTY = new Set(['guided', 'standard', 'interview'])

/** /studio — список кейсов и прохождение. */
export function StudioView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCaseId = searchParams.get('case')
  const selectedPracticeId = searchParams.get('practice')

  if (selectedCaseId) {
    return (
      <CaseRunner key={selectedCaseId} caseId={selectedCaseId} onBack={() => setSearchParams({})} />
    )
  }
  if (selectedPracticeId) {
    return (
      <PracticeWorkspace
        key={selectedPracticeId}
        exerciseId={selectedPracticeId}
        onBack={() => setSearchParams({})}
      />
    )
  }
  return <CaseList />
}

function CaseList() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const cases = await fetchCases('standard', signal)
      setState({ kind: 'ready', cases })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState({
        kind: 'error',
        message: 'Не удалось загрузить кейсы. Проверьте, что backend запущен.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') {
    return <LoadingBlock label="Загрузка кейсов…" rows={4} />
  }
  if (state.kind === 'error') {
    return (
      <ErrorState title="Ошибка загрузки" message={state.message} onRetry={() => void load()} />
    )
  }

  const { cases } = state
  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <section className="dp-studio-hero">
        <PageHeader
          eyebrow="Практика"
          title="Studio"
          subtitle="Безопасное место, где теория превращается в навык: запросы, код, эксперименты и небольшие рабочие кейсы."
        />
        <div className="dp-studio-glyph" aria-hidden="true">
          <span>SELECT</span>
          <span>fit(X, y)</span>
          <span>→ result</span>
        </div>
      </section>

      <PracticeLibrary />

      <div className="mt-12">
        <p className="dp-eyebrow">Применение</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Mini-cases</h2>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
          Разберите реалистичную ситуацию, примите решения и получите предметную обратную связь.
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Кейсы ещё не добавлены"
            description="Загляните позже или пройдите уроки курса — кейсы появятся в Studio."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {cases.map((caseSpec) => (
            <section key={caseSpec.id} className="dp-case-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        caseSpec.practice_kind === 'module-case'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                      }`}
                    >
                      {caseSpec.practice_kind === 'module-case' ? 'Итоговый кейс' : 'Мини-кейс'}
                    </span>
                    {caseSpec.estimated_minutes != null && (
                      <span>~{caseSpec.estimated_minutes} мин</span>
                    )}
                    {caseSpec.difficulty && !MODE_LIKE_DIFFICULTY.has(caseSpec.difficulty) && (
                      <span>· {caseSpec.difficulty}</span>
                    )}
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {caseSpec.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {caseSpec.description}
                  </p>
                  {caseSpec.skill_ids.length > 0 && (
                    <div className="mt-3 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                      {caseSpec.skill_ids.length}{' '}
                      {caseSpec.skill_ids.length === 1 ? 'навык' : 'навыка'} в фокусе
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    to={`/studio?case=${encodeURIComponent(caseSpec.id)}`}
                    className={buttonClassNames('secondary')}
                  >
                    Пройти кейс →
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function CaseRunner({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const [runState, setRunState] = useState<RunState>({ kind: 'loading' })
  const [mode, setMode] = useState<Mode>('guided')
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [result, setResult] = useState<CaseSubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [attempts, setAttempts] = useState<number | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setRunState({ kind: 'loading' })
      try {
        const spec = await fetchCase(caseId, mode, signal)
        setRunState({ kind: 'ready', spec })
        setAnswers({})
        setResult(null)
        setSubmitError(null)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : ''
        setRunState({
          kind: message.includes('404') ? 'error' : 'error',
          message: message.includes('404')
            ? 'Кейс не найден.'
            : 'Не удалось загрузить кейс. Проверьте, что backend запущен.',
        })
      }
    },
    [caseId, mode],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  useEffect(() => {
    if (caseId) {
      void fetchCaseAttempts(caseId)
        .then((rows) => setAttempts(rows.length))
        .catch(() => undefined)
    }
  }, [caseId, result])

  if (runState.kind === 'loading') {
    return <LoadingBlock label="Загрузка кейса…" rows={5} />
  }
  if (runState.kind === 'error' || runState.kind === 'idle') {
    return (
      <ErrorState
        title="Ошибка"
        message={runState.kind === 'error' ? runState.message : 'Кейс не выбран.'}
        onRetry={() => void load()}
        className="min-h-[280px]"
      />
    )
  }

  const spec = runState.spec

  const handleModeChange = (next: Mode) => {
    if (next === mode) return
    setMode(next)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    setSaved(false)
    try {
      const next = await submitCase(caseId, mode, answers)
      setResult(next)
      setSaved(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка отправки кейса')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = spec.questions.every((q: CaseQuestion) => answers[q.id] !== undefined)

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button onClick={onBack} className="hover:text-slate-700 dark:hover:text-slate-300">
                ← Кейсы
              </button>
              <span>/</span>
              <span>{spec.practice_kind === 'module-case' ? 'Итоговый кейс' : 'Мини-кейс'}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {spec.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {spec.questions.length} вопросов
              </span>
              {spec.estimated_minutes != null && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  ~{spec.estimated_minutes} мин
                </span>
              )}
              {attempts != null && attempts > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  · попыток: {attempts}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/atlas"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Atlas
          </Link>
        </div>

        {/* Выбор режима */}
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Режим</div>
          <ModeSelect value={mode} onChange={handleModeChange} />
        </div>

        {mode !== spec.mode && (
          <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
            Режим изменён — кейс будет загружен в выбранном режиме.
          </div>
        )}

        {/* Интро */}
        {spec.intro && (
          <div className="mt-5 rounded-xl p-5 dp-surface">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {spec.intro}
            </p>
          </div>
        )}

        {/* Вопросы */}
        <div className="mt-5 flex flex-col gap-4">
          {spec.questions.map((question: CaseQuestion, index: number) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              value={answers[question.id]}
              disabled={result !== null}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
            />
          ))}
        </div>

        {submitError && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200">
            {submitError}
          </div>
        )}

        {/* Результат */}
        {result && <ResultCard result={result} spec={spec} />}

        {!result && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <span className="mr-auto text-xs text-slate-400">
              {canSubmit ? '' : 'Ответьте на все вопросы, чтобы отправить.'}
            </span>
            <Button variant="outline" onClick={onBack}>
              Отмена
            </Button>
            <Button
              variant="primary"
              disabled={!canSubmit || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Проверяем…' : 'Отправить и проверить'}
            </Button>
          </div>
        )}

        {saved && result && (
          <div className="mt-3 text-right text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Попытка сохранена, evidence обновлён.
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ModeSelect({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(['guided', 'standard', 'interview'] as Mode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            value === mode
              ? 'border-emerald-400 bg-emerald-600 text-white'
              : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {MODE_LABEL[mode].split(' — ')[0]}
        </button>
      ))}
    </div>
  )
}

function QuestionCard({
  question,
  index,
  value,
  disabled,
  onChange,
}: {
  question: CaseQuestion
  index: number
  value: unknown
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  return (
    <section className="rounded-xl p-5 dp-surface">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
              {question.prompt}
            </h3>
            {question.topic && (
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                {question.topic}
              </span>
            )}
          </div>

          {question.hint && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                Подсказка
              </summary>
              <p className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                {question.hint}
              </p>
            </details>
          )}

          <div className="mt-3">
            <AnswerInput
              question={question}
              value={value}
              disabled={disabled}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function AnswerInput({
  question,
  value,
  disabled,
  onChange,
}: {
  question: CaseQuestion
  value: unknown
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  if (question.type === 'single' || question.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        {question.options.map((option, idx) => (
          <label
            key={idx}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              value === idx
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
            } ${disabled ? 'cursor-default opacity-80' : ''}`}
          >
            <input
              type="radio"
              name={question.id}
              disabled={disabled}
              checked={value === idx}
              onChange={() => onChange(idx)}
              className="mt-0.5 accent-emerald-600"
            />
            <span className="text-slate-700 dark:text-slate-200">
              {idx + 1}. {option}
            </span>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'multiple') {
    const current: number[] = Array.isArray(value) ? (value as number[]) : []
    const toggle = (idx: number) => {
      const next = current.includes(idx)
        ? current.filter((item) => item !== idx)
        : [...current, idx]
      onChange(next)
    }
    return (
      <div className="flex flex-col gap-1.5">
        {question.options.map((option, idx) => (
          <label
            key={idx}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              current.includes(idx)
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
            } ${disabled ? 'cursor-default opacity-80' : ''}`}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={current.includes(idx)}
              onChange={() => toggle(idx)}
              className="mt-0.5 accent-emerald-600"
            />
            <span className="text-slate-700 dark:text-slate-200">
              {idx + 1}. {option}
            </span>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'numeric') {
    return (
      <input
        type="number"
        disabled={disabled}
        value={(value as string) ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Введите число"
        className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />
    )
  }

  if (question.type === 'order') {
    const current: number[] = Array.isArray(value) ? (value as number[]) : []
    const move = (idx: number, dir: -1 | 1) => {
      const next = [...current]
      const from = next.indexOf(idx)
      if (from === -1) return
      const to = from + dir
      if (to < 0 || to >= next.length) return
      ;[next[from], next[to]] = [next[to], next[from]]
      onChange(next)
    }
    const ordered = current.length === question.options.length ? current : []
    return (
      <div>
        {ordered.length === question.options.length ? (
          <div className="flex flex-col gap-1">
            {ordered.map((optionIdx, position) => (
              <div
                key={optionIdx}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50"
              >
                <span className="w-5 text-center font-mono text-xs text-slate-400">
                  {position + 1}
                </span>
                <span className="flex-1 text-slate-700 dark:text-slate-200">
                  {question.options[optionIdx]}
                </span>
                <button
                  disabled={disabled || position === 0}
                  onClick={() => move(optionIdx, -1)}
                  className="rounded px-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                  aria-label="Вверх"
                >
                  ↑
                </button>
                <button
                  disabled={disabled || position === ordered.length - 1}
                  onClick={() => move(optionIdx, 1)}
                  className="rounded px-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                  aria-label="Вниз"
                >
                  ↓
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onChange([...current, idx])}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
              >
                + {option}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

function ResultCard({ result, spec }: { result: CaseSubmitResult; spec: CaseSpec }) {
  const percent = Math.round(result.total_score * 100)
  return (
    <section className="mt-6 rounded-xl p-5 dp-surface">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Результат
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {percent}%
            </span>
            {result.passed ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                Пройдено
              </span>
            ) : (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                Требует доработки
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.summary}</p>
        </div>
        <div className="text-right text-xs text-slate-400">попытка #{result.attempt_id}</div>
      </div>

      {result.evidence.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {result.evidence.map((entry) => (
            <span
              key={entry.skill_id}
              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
              title={entry.state_reason}
            >
              {entry.skill_id} · {entry.evidence_count} ev
            </span>
          ))}
        </div>
      )}

      {/* Разбор по вопросам */}
      <div className="mt-5 flex flex-col gap-3">
        {result.question_results.map((questionResult) => {
          const question = spec.questions.find((q) => q.id === questionResult.question_id)
          return (
            <div
              key={questionResult.question_id}
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                questionResult.correct
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {question?.prompt ?? questionResult.question_id}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    questionResult.correct
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                  }`}
                >
                  {questionResult.correct ? 'Верно' : 'Неверно'} ·{' '}
                  {Math.round(questionResult.score * 100)}%
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {questionResult.explanation}
              </p>
            </div>
          )
        })}
      </div>

      {spec.conclusion && (
        <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2.5 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          <span className="font-semibold">Разбор: </span>
          {result.conclusion || spec.conclusion}
        </div>
      )}

      {(result.expected_problems?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
            Эталонный аудит данных
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-indigo-800 dark:text-indigo-200">
            Сравните этот список со своими заметками. Он появляется только после попытки.
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {result.expected_problems?.map((problem) => (
              <li key={problem} className="flex gap-2">
                <span aria-hidden="true" className="text-indigo-500">
                  ✓
                </span>
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
