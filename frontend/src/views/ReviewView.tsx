import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchReviewItem,
  fetchReviewQueue,
  fetchReviewSummary,
  skipReview,
  submitReview,
  type ReviewQueueItem,
  type ReviewRating,
  type ReviewSubmitResult,
  type ReviewSummary,
} from '../lib/api'
import { ErrorState, LoadingBlock } from '../components/ui/PageState'
import { Button } from '../components/ui/Button'
import { formatCount } from '../lib/format'

const DEFAULT_LIMIT = 10
const RATINGS: { value: ReviewRating; label: string; hint: string }[] = [
  { value: 'Again', label: 'Again', hint: 'забыл' },
  { value: 'Hard', label: 'Hard', hint: 'с трудом' },
  { value: 'Good', label: 'Good', hint: 'нормально' },
  { value: 'Easy', label: 'Easy', hint: 'легко' },
]

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'summary'; summary: ReviewSummary; items: ReviewQueueItem[] }
  | { kind: 'session'; items: ReviewQueueItem[] }
  | { kind: 'done'; stats: SessionStats; nextReviewAt: string | null }

interface SessionStats {
  total: number
  correct: number
  needsAttention: number
  completed: number
}

type AnswerInput =
  | { kind: 'single'; value: number | null }
  | { kind: 'multiple'; values: number[] }
  | { kind: 'ordering'; values: number[] }
  | { kind: 'numeric'; value: string }
  | { kind: 'reveal'; value: string }

export function ReviewView() {
  const [screen, setScreen] = useState<ScreenState>({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setScreen({ kind: 'loading' })
    try {
      const summary = await fetchReviewSummary(undefined, signal)
      const queue = await fetchReviewQueue({ limit: DEFAULT_LIMIT }, signal)
      setScreen({ kind: 'summary', summary, items: queue.items })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setScreen({
        kind: 'error',
        message:
          'Не удалось загрузить повторения. Проверьте, что backend запущен и каталог синхронизирован.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (screen.kind === 'loading') {
    return <LoadingBlock label="Загрузка повторений…" rows={4} />
  }
  if (screen.kind === 'error') {
    return <ErrorState message={screen.message} onRetry={() => void load()} />
  }
  if (screen.kind === 'summary') {
    return (
      <SummaryScreen
        screen={screen}
        onStart={() => setScreen({ kind: 'session', items: screen.items })}
        onReload={() => void load()}
      />
    )
  }
  if (screen.kind === 'session') {
    return (
      <SessionScreen
        items={screen.items}
        onFinish={(stats, nextReviewAt) => setScreen({ kind: 'done', stats, nextReviewAt })}
      />
    )
  }
  return (
    <DoneScreen
      stats={screen.stats}
      nextReviewAt={screen.nextReviewAt}
      onReload={() => void load()}
    />
  )
}

// --- До начала ---

function SummaryScreen({
  screen,
  onStart,
  onReload,
}: {
  screen: Extract<ScreenState, { kind: 'summary' }>
  onStart: () => void
  onReload: () => void
}) {
  const { summary, items } = screen
  const empty = summary.active_items === 0
  return (
    <div className="mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <section className="dp-review-hero">
          <div>
            <p className="dp-eyebrow">Интервальное повторение</p>
            <h1 className="sr-only">Повторение</h1>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.04em]">
              Возвращайте знания
              <br />в нужный момент
            </h2>
            <p
              className="mt-4 max-w-xl text-sm leading-relaxed"
              style={{ color: 'var(--dp-text-secondary)' }}
            >
              Короткие сессии смешивают концепции, формулы, ошибки в коде и мини-кейсы — так
              материал остаётся рабочим, а не просто знакомым.
            </p>
          </div>
          <div
            className="dp-review-orbit"
            aria-label={`${summary.due_count} повторений на сегодня`}
          >
            <i />
            <i />
            <div>
              <strong data-value={summary.due_count} aria-hidden="true" />
              <span>на сегодня</span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[24px] p-5 dp-surface">
          {empty ? (
            <EmptyState summary={summary} onReload={onReload} />
          ) : (
            <>
              <div className="grid gap-px overflow-hidden rounded-2xl bg-[var(--dp-border-subtle)] sm:grid-cols-3">
                <Count
                  label="На сегодня"
                  value={summary.due_count}
                  color="var(--dp-text-primary)"
                />
                <Count label="Просрочено" value={summary.overdue_count} color="var(--dp-error)" />
                <Count
                  label="Выполнено сегодня"
                  value={summary.completed_today}
                  color="var(--dp-success)"
                />
              </div>
              {items.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  В очереди нет элементов для этой сессии. Повторите позже или перезагрузите.
                </p>
              ) : (
                <>
                  <p className="mt-6 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                    {summary.recommendation} В этой сессии:{' '}
                    {formatCount(items.length, 'элемент', 'элемента', 'элементов')}.
                  </p>
                  <Button variant="primary" className="mt-4" onClick={onStart}>
                    Начать повторение →
                  </Button>
                </>
              )}
            </>
          )}
        </section>
      </motion.div>
    </div>
  )
}

function EmptyState({ summary, onReload }: { summary: ReviewSummary; onReload: () => void }) {
  if (summary.next_due_at) {
    return (
      <>
        <div className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          На сегодня всё
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Следующее повторение: {formatDate(summary.next_due_at)}.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            to="/today"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Сегодня
          </Link>
          <button
            onClick={onReload}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Обновить
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Пока пусто</div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Пройдите уроки, лаборатории и кейсы — материал появится в расписании повторений.
      </p>
      <Link
        to="/focus"
        className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
      >
        К урокам →
      </Link>
    </>
  )
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 text-center" style={{ background: 'var(--dp-surface)' }}>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
        {label}
      </div>
    </div>
  )
}

// --- Сессия ---

function SessionScreen({
  items,
  onFinish,
}: {
  items: ReviewQueueItem[]
  onFinish: (stats: SessionStats, nextReviewAt: string | null) => void
}) {
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState<SessionStats>({
    total: items.length,
    correct: 0,
    needsAttention: 0,
    completed: 0,
  })

  const finish = useCallback(
    (finalStats: SessionStats) => {
      void fetchReviewSummary().then((summary) => onFinish(finalStats, summary.next_due_at))
    },
    [onFinish],
  )

  const handleNext = useCallback(() => {
    if (index + 1 >= items.length) {
      finish(stats)
    } else {
      setIndex((i) => i + 1)
    }
  }, [index, items.length, stats, finish])

  const item = items[index]
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Элемент {index + 1} из {items.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 mx-4">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(stats.completed / Math.max(1, items.length)) * 100}%` }}
          />
        </div>
        <button
          onClick={() => void skipReview(item.id).then(() => handleNext())}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Пропустить
        </button>
      </div>
      <QuestionCard
        key={item.id}
        item={item}
        onResult={(result) => {
          setStats((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            correct: prev.correct + (result.is_correct === true ? 1 : 0),
            needsAttention: prev.needsAttention + (result.effective_rating === 'Again' ? 1 : 0),
          }))
        }}
        onNext={handleNext}
      />
      <p className="mt-2 text-right text-[11px] text-slate-400">
        Клавиши: 1–4 — оценка · Enter — далее
      </p>
    </div>
  )
}

function QuestionCard({
  item,
  onResult,
  onNext,
}: {
  item: ReviewQueueItem
  onResult: (result: ReviewSubmitResult) => void
  onNext: () => void
}) {
  const [answer, setAnswer] = useState<AnswerInput>(() => initialAnswer(item))
  const [result, setResult] = useState<ReviewSubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const dedupRef = useRef<string | null>(null)

  const dedupKey = useMemo(() => {
    if (dedupRef.current === null) {
      dedupRef.current = `fe-${crypto.randomUUID()}`
    }
    return dedupRef.current
  }, [])

  const submit = useCallback(
    async (rating: ReviewRating, checkAnswer: boolean) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      setError(null)
      try {
        const payload = buildPayload(answer, rating, dedupKey)
        if (checkAnswer && payload.answer === null) {
          setError('Сначала выберите ответ.')
          submittingRef.current = false
          setSubmitting(false)
          return
        }
        const res = await submitReview(item.id, payload)
        setResult(res)
        // Статистика сессии обновляется только первичной отправкой
        // (проверка ответа / показ разбора), повторная оценка не дублирует.
        if (checkAnswer) onResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить ответ.')
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [item, answer, dedupKey, onResult],
  )

  const refreshItem = useCallback(async () => {
    // Повторная попытка после ошибки: новый ответ → новый dedup-ключ.
    dedupRef.current = null
    submittingRef.current = false
    setResult(null)
    setError(null)
    try {
      const fresh = await fetchReviewItem(item.id)
      setAnswer(initialAnswer(fresh))
    } catch {
      // оставляем текущий ответ
    }
  }, [item.id])

  const handleCheck = useCallback(() => {
    if (result) return
    void submit('Good', true)
  }, [result, submit])

  const handleRating = useCallback(
    (rating: ReviewRating) => {
      if (!result) return
      if (result.is_correct !== true && result.is_correct !== null) return
      void submit(rating, false)
    },
    [result, submit],
  )

  const allowedRatings = useMemo(() => allowedRatingSet(result), [result])
  const reveal = item.question_type === 'reveal_and_rate'
  const canRate = allowedRatings.length > 0

  // Клавиатура: Enter — проверить/далее, 1–4 — оценка. Не перехватываем ввод текста.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isTextEntry =
        tag === 'TEXTAREA' ||
        (tag === 'INPUT' &&
          ['text', 'number', 'search', 'email', 'password', 'tel', 'url'].includes(
            (target as HTMLInputElement).type,
          ))
      if (isTextEntry) return
      if (event.key === 'Enter') {
        event.preventDefault()
        if (result) onNext()
        else if (!reveal) handleCheck()
        return
      }
      const keyIndex = ['1', '2', '3', '4'].indexOf(event.key)
      if (keyIndex >= 0 && canRate) {
        const rating = allowedRatings[keyIndex]
        if (rating) handleRating(rating)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [result, canRate, allowedRatings, reveal, handleCheck, handleRating, onNext])

  return (
    <div className="rounded-xl p-6 dp-surface-elevated">
      <div className="flex items-center justify-between gap-2">
        <div className="dp-section-title">{item.title}</div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {item.primary_skill_id}
        </span>
      </div>
      <p className="mt-3 text-lg font-medium text-slate-900 dark:text-slate-100">{item.prompt}</p>

      <div className="mt-5">
        <AnswerInputView
          item={item}
          answer={answer}
          setAnswer={setAnswer}
          disabled={result !== null}
        />
      </div>

      {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}

      {!result && !reveal && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Объективная проверка без LLM</span>
          <Button variant="secondary" disabled={submitting} onClick={handleCheck}>
            {submitting ? 'Проверяем…' : 'Проверить'}
          </Button>
        </div>
      )}

      {!result && reveal && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Самооценка — слабый сигнал</span>
          <Button variant="secondary" disabled={submitting} onClick={handleCheck}>
            {submitting ? 'Сохраняем…' : 'Показать разбор'}
          </Button>
        </div>
      )}

      {result && (
        <Feedback
          result={result}
          allowedRatings={allowedRatings}
          onRating={handleRating}
          onNext={onNext}
          onRetry={refreshItem}
        />
      )}
    </div>
  )
}

function Feedback({
  result,
  allowedRatings,
  onRating,
  onNext,
  onRetry,
}: {
  result: ReviewSubmitResult
  allowedRatings: ReviewRating[]
  onRating: (rating: ReviewRating) => void
  onNext: () => void
  onRetry: () => void
}) {
  const correct = result.is_correct === true
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex items-center justify-between">
        <div
          className={`text-sm font-semibold ${
            correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
          }`}
        >
          {result.effective_rating === 'Again'
            ? 'Требует повторения'
            : correct
              ? 'Верно'
              : result.objective_score != null && result.objective_score > 0
                ? 'Частично верно'
                : 'Неверно'}
        </div>
        <span className="text-xs text-slate-400">
          {formatInterval(result.interval_days)} · следующий раз {formatDate(result.next_due_at)}
        </span>
      </div>
      {result.correct_answer && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-slate-100">Правильный ответ: </span>
          {result.correct_answer}
        </div>
      )}
      <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {result.explanation}
      </div>

      {allowedRatings.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Как оцените?
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {RATINGS.filter((r) => allowedRatings.includes(r.value)).map((rating) => (
              <button
                key={rating.value}
                onClick={() => onRating(rating.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {rating.label} <span className="text-[10px] text-slate-400">· {rating.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={onNext}>
          Далее →
        </Button>
        {result.is_correct === false && (
          <Button variant="outline" onClick={onRetry}>
            Ответить ещё раз
          </Button>
        )}
      </div>
    </div>
  )
}

// --- Ответы по типам вопросов ---

function AnswerInputView({
  item,
  answer,
  setAnswer,
  disabled,
}: {
  item: ReviewQueueItem
  answer: AnswerInput
  setAnswer: (a: AnswerInput) => void
  disabled: boolean
}) {
  switch (item.question_type) {
    case 'single_choice':
    case 'parameter_selection':
    case 'error_diagnosis':
      return (
        <ul className="flex flex-col gap-2">
          {item.options.map((option, idx) => (
            <li key={idx}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                  answer.kind === 'single' && answer.value === idx
                    ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="radio"
                  name={`review-${item.id}`}
                  checked={answer.kind === 'single' && answer.value === idx}
                  disabled={disabled}
                  onChange={() => setAnswer({ kind: 'single', value: idx })}
                  className="mt-0.5"
                />
                <span className="text-slate-700 dark:text-slate-200">
                  <span className="mr-1 font-medium text-slate-400">{idx + 1}.</span>
                  {option}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )
    case 'multiple_choice':
      return (
        <ul className="flex flex-col gap-2">
          {item.options.map((option, idx) => {
            const checked = answer.kind === 'multiple' && answer.values.includes(idx)
            return (
              <li key={idx}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    checked
                      ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      const values = answer.kind === 'multiple' ? [...answer.values] : []
                      const next = checked ? values.filter((v) => v !== idx) : [...values, idx]
                      setAnswer({ kind: 'multiple', values: next })
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-slate-700 dark:text-slate-200">
                    <span className="mr-1 font-medium text-slate-400">{idx + 1}.</span>
                    {option}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )
    case 'ordering': {
      const values = answer.kind === 'ordering' ? answer.values : []
      const remaining = item.options.map((_, idx) => idx).filter((idx) => !values.includes(idx))
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            {values.length === 0 && (
              <p className="text-sm text-slate-400">Нажимайте варианты в нужном порядке.</p>
            )}
            {values.map((idx, pos) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950/20"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  <span className="mr-1 font-medium text-emerald-600 dark:text-emerald-300">
                    {pos + 1}.
                  </span>
                  {item.options[idx]}
                </span>
                {!disabled && (
                  <button
                    onClick={() =>
                      setAnswer({ kind: 'ordering', values: values.filter((v) => v !== idx) })
                    }
                    className="text-xs text-slate-400 hover:text-rose-500"
                  >
                    убрать
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {remaining.map((idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => setAnswer({ kind: 'ordering', values: [...values, idx] })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                {idx + 1}. {item.options[idx]}
              </button>
            ))}
          </div>
        </div>
      )
    }
    case 'numeric':
      return (
        <input
          type="number"
          step="any"
          value={answer.kind === 'numeric' ? answer.value : ''}
          disabled={disabled}
          onChange={(e) => setAnswer({ kind: 'numeric', value: e.target.value })}
          placeholder="Введите число"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      )
    case 'reveal_and_rate':
      return (
        <textarea
          value={answer.kind === 'reveal' ? answer.value : ''}
          disabled={disabled}
          onChange={(e) => setAnswer({ kind: 'reveal', value: e.target.value })}
          rows={4}
          placeholder="Объясните своими словами…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      )
    default:
      return null
  }
}

// --- Итог сессии ---

function DoneScreen({
  stats,
  nextReviewAt,
  onReload,
}: {
  stats: SessionStats
  nextReviewAt: string | null
  onReload: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Сессия завершена
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Вы прошли {stats.completed} из {stats.total} элементов.
          </p>
        </header>
        <section className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="grid gap-4 sm:grid-cols-3">
            <Count label="Выполнено" value={stats.completed} color="var(--dp-text-primary)" />
            <Count label="Верно" value={stats.correct} color="var(--dp-success)" />
            <Count
              label="Требуют внимания"
              value={stats.needsAttention}
              color="var(--dp-warning)"
            />
          </div>
          {nextReviewAt && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Ближайшее следующее повторение: {formatDate(nextReviewAt)}.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/today"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Сегодня →
            </Link>
            <Link
              to="/atlas"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Atlas
            </Link>
            <Link
              to="/focus"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Focus
            </Link>
            <button
              onClick={onReload}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Ещё повторение
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  )
}

// --- Хелперы ---

function initialAnswer(item: ReviewQueueItem): AnswerInput {
  if (item.question_type === 'multiple_choice') return { kind: 'multiple', values: [] }
  if (item.question_type === 'ordering') return { kind: 'ordering', values: [] }
  if (item.question_type === 'numeric') return { kind: 'numeric', value: '' }
  if (item.question_type === 'reveal_and_rate') return { kind: 'reveal', value: '' }
  return { kind: 'single', value: null }
}

function buildPayload(
  answer: AnswerInput,
  rating: ReviewRating,
  dedupKey: string,
): { answer: unknown; user_rating: ReviewRating; dedup_key: string } {
  let value: unknown = null
  if (answer.kind === 'single') value = answer.value
  else if (answer.kind === 'multiple') value = answer.values
  else if (answer.kind === 'ordering') value = answer.values
  else if (answer.kind === 'numeric') value = answer.value === '' ? null : Number(answer.value)
  else if (answer.kind === 'reveal') value = answer.value
  return { answer: value, user_rating: rating, dedup_key: `${dedupKey}:${rating}` }
}

function allowedRatingSet(result: ReviewSubmitResult | null): ReviewRating[] {
  if (!result) return []
  // reveal_and_rate: объективной проверки нет — доступна любая самооценка.
  if (result.is_correct === null) return ['Again', 'Hard', 'Good', 'Easy']
  if (result.is_correct === true) return ['Again', 'Hard', 'Good', 'Easy']
  if (result.objective_score != null && result.objective_score > 0 && result.objective_score < 1) {
    return ['Again', 'Hard']
  }
  return []
}

function formatInterval(days: number): string {
  if (days < 1 / 24) return 'через минуты'
  if (days < 1) return `через ${Math.max(1, Math.round(days * 24))} ч`
  if (days < 30) return `через ${Math.round(days)} дн`
  return `через ${Math.round(days / 30)} мес`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
