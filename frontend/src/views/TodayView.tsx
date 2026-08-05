import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchToday, type TodayData, type SkillState } from '../lib/api'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: TodayData }

const STATE_META: Record<SkillState, { label: string; dot: string; text: string }> = {
  not_started: { label: 'Не начато', dot: 'bg-slate-400', text: 'text-slate-500' },
  exploring: { label: 'Изучается', dot: 'bg-amber-400', text: 'text-amber-600' },
  developing: { label: 'Развивается', dot: 'bg-cyan-500', text: 'text-cyan-600' },
  strong: { label: 'Уверенно', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  needs_attention: { label: 'Требует внимания', dot: 'bg-rose-500', text: 'text-rose-600' },
}

function skillLabel(state: SkillState): string {
  return STATE_META[state]?.label ?? state
}

function formatEvent(event: { event_type: string; source_id: string }): string {
  const map: Record<string, string> = {
    scene_complete: 'Сцена урока',
    lesson_complete: 'Урок завершён',
    lab_recorded: 'Лаборатория',
    case_submitted: 'Кейс',
    checkpoint: 'Проверка',
  }
  const label = map[event.event_type] ?? event.event_type
  const short = event.source_id.length > 38 ? `${event.source_id.slice(0, 37)}…` : event.source_id
  return `${label}: ${short}`
}

export function TodayView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const data = await fetchToday(signal)
      setState({ kind: 'ready', data })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState({
        kind: 'error',
        message:
          'Не удалось загрузить «Сегодня». Проверьте, что backend запущен и каталог синхронизирован.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') {
    return <Centered>Загрузка «Сегодня»…</Centered>
  }
  if (state.kind === 'error') {
    return (
      <Centered>
        <div className="font-semibold text-rose-600 dark:text-rose-300">Не удалось загрузить</div>
        <p className="mt-2 max-w-md text-sm text-rose-500">{state.message}</p>
        <button
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-500/25 dark:text-rose-200"
        >
          Попробовать снова
        </button>
      </Centered>
    )
  }

  const { data } = state
  const summary = data.progress_summary

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Сегодня</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {summary.lessons_completed > 0 || summary.lessons_started > 0 ? (
                <>
                  {summary.lessons_completed} уроков завершено · {summary.lessons_started} в работе
                  · {summary.labs_completed} лабораторий · {summary.cases_completed} кейсов
                </>
              ) : (
                'Начните с первого урока маршрута — прогресс появится здесь.'
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/focus"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Уроки
            </Link>
            <Link
              to="/atlas"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Atlas
            </Link>
            <Link
              to="/studio"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Studio
            </Link>
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            {/* Повторение (Фаза 5) */}
            <ReviewCard data={data} />

            {/* Главная карточка действия */}
            <MainAction data={data} />

            {/* Слабые темы */}
            <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Нужно усилить
              </h2>
              {data.weak_skills.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Пока недостаточно данных, чтобы выделить слабые темы. Пройдите пару уроков и
                  лабораторий — рекомендации появятся.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {data.weak_skills.map((skill) => (
                    <li
                      key={skill.skill_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-rose-200/70 bg-rose-50/60 px-3 py-2.5 text-sm dark:border-rose-900/50 dark:bg-rose-950/20"
                    >
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {skill.skill_id}
                        </div>
                        <div className="text-xs text-slate-500">
                          {skill.evidence_count} измерений · средняя оценка ниже 0.6
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                        {skillLabel(skill.state)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Недавняя активность */}
            <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Недавняя активность
              </h2>
              {data.recent_activity.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Здесь появятся события: пройденные сцены, лаборатории и кейсы.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {data.recent_activity.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="truncate">{formatEvent(event)}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(event.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-5">
            {/* Прогресс маршрута */}
            <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Прогресс маршрута
              </h2>
              <div className="mt-3 flex items-end justify-between">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {summary.lessons_completed}
                  <span className="text-base font-medium text-slate-400">
                    /{Math.max(summary.lessons_completed, summary.lessons_started, 5)} уроков
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <ProgressRow label="Уроки начаты" value={summary.lessons_started} />
                <ProgressRow label="Лаборатории" value={summary.labs_completed} />
                <ProgressRow label="Кейсы" value={summary.cases_completed} />
              </div>
            </section>

            {/* Рекомендуемый кейс */}
            {data.suggested_case && (
              <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Рекомендуемый кейс
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {data.suggested_case.title}
                </p>
                <Link
                  to={`/studio?case=${encodeURIComponent(data.suggested_case.case_id)}`}
                  className="mt-3 inline-block rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
                >
                  Открыть в Studio
                </Link>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ReviewCard({ data }: { data: TodayData }) {
  const summary = data.review_summary
  if (data.review_action === 'review_session') {
    return (
      <section className="rounded-xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-cyan-950/20">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Повторение
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {summary.due_count} повторений на сегодня
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {summary.overdue_count > 0
            ? `${summary.overdue_count} просрочено · короткая сессия вернёт материал.`
            : 'Короткая сессия закрепит материал в памяти.'}
        </p>
        <Link
          to="/review"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Начать повторение →
        </Link>
      </section>
    )
  }
  if (summary.active_items > 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Повторение
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          На сегодня всё
          {summary.next_due_at ? ` · следующее — ${formatShortDate(summary.next_due_at)}` : ''}.
        </p>
        <Link
          to="/review"
          className="mt-3 inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          К повторениям
        </Link>
      </section>
    )
  }
  return (
    <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Повторение</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Пройдите урок — материал появится в расписании повторений.
      </p>
    </section>
  )
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function MainAction({ data }: { data: TodayData }) {
  if (data.continue_lesson) {
    const lesson = data.continue_lesson
    const scene = lesson.current_scene_id ?? 'первую сцену'
    return (
      <section className="rounded-xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-cyan-950/20">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Продолжить
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {lesson.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Вы остановились на сцене «{scene}». Продолжите урок, чтобы закрепить материал.
        </p>
        <Link
          to={`/focus/${encodeURIComponent(lesson.lesson_id)}`}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Продолжить урок →
        </Link>
      </section>
    )
  }

  if (data.next_lesson) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Следующий урок маршрута
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {data.next_lesson.title}
        </h2>
        {data.next_lesson.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.next_lesson.skills.map((skill) => (
              <span
                key={skill}
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        <Link
          to={`/focus/${encodeURIComponent(data.next_lesson.id)}`}
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Начать урок →
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Добро пожаловать
      </div>
      <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
        Начните с первого урока
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Курс «Классический ML» ведёт от постановки задачи до ансамблей. Откройте Focus и выберите
        первый урок маршрута.
      </p>
      <Link
        to="/focus"
        className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
      >
        К урокам →
      </Link>
    </section>
  )
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">{children}</div>
  )
}
