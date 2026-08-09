import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchToday, type TodayData } from '../lib/api'
import { ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { ArrowRightIcon } from '../components/ui/icons'
import { formatCount } from '../lib/format'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: TodayData }

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
    return <LoadingBlock label="Загрузка «Сегодня»…" rows={4} />
  }
  if (state.kind === 'error') {
    return <ErrorState message={state.message} onRetry={() => void load()} />
  }

  const { data } = state
  const summary = data.progress_summary
  const hasProgress = summary.lessons_completed > 0 || summary.lessons_started > 0
  const lessonMinutes =
    data.continue_lesson?.estimated_minutes ?? data.next_lesson?.estimated_minutes ?? 20
  const reviewMinutes = Math.min(data.due_reviews * 3, 18)
  const practiceMinutes = data.suggested_practice?.estimated_minutes ?? 0
  const planMinutes = lessonMinutes + reviewMinutes + practiceMinutes

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <PageHeader
          eyebrow={dayGreeting()}
          title="Сегодня"
          subtitle={
            hasProgress
              ? `${formatCount(summary.lessons_completed, 'урок завершён', 'урока завершено', 'уроков завершено')} · ${formatCount(summary.lessons_started, 'урок в работе', 'урока в работе', 'уроков в работе')}`
              : `План на сегодня — около ${planMinutes} минут.`
          }
        />

        {data.roadmap_context?.current_stage && (
          <Link
            to="/roadmap"
            className="mt-4 flex min-h-11 items-center justify-between gap-4 rounded-xl px-4 py-2 text-sm dp-surface dp-hover-interactive"
          >
            <span>
              <strong>Проход {data.roadmap_context.current_stage.number}</strong>
              <span className="ml-2" style={{ color: 'var(--dp-text-secondary)' }}>
                {data.roadmap_context.current_stage.title}
              </span>
            </span>
            <span style={{ color: 'var(--dp-accent)' }}>
              {data.roadmap_context.current_stage.progress_percent}% →
            </span>
          </Link>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {/* Primary recommendation — visually dominant */}
          <MainAction data={data} />

          <div className="grid gap-4 lg:grid-cols-2">
            {data.suggested_practice ? (
              <PracticeCard practice={data.suggested_practice} />
            ) : (
              <Link to="/studio" className="rounded-xl p-5 dp-surface dp-hover-interactive">
                <div className="dp-section-title">Практика</div>
                <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                  Выбрать упражнение в Studio →
                </p>
              </Link>
            )}
            <ReviewCard data={data} />
          </div>

          {(data.suggested_case || data.weak_skills.length > 0) && (
            <details className="rounded-xl dp-surface">
              <summary
                className="cursor-pointer px-5 py-4 text-sm font-medium"
                style={{ color: 'var(--dp-text-secondary)' }}
              >
                Ещё на сегодня
              </summary>
              <div
                className="grid gap-4 border-t p-5 sm:grid-cols-2"
                style={{ borderColor: 'var(--dp-border-subtle)' }}
              >
                {data.suggested_case && (
                  <div>
                    <div className="dp-section-title">Mini-case</div>
                    <p className="mt-1 text-sm font-medium">{data.suggested_case.title}</p>
                    <Link
                      to={`/studio?case=${encodeURIComponent(data.suggested_case.case_id)}`}
                      className="mt-2 inline-block text-xs font-medium"
                      style={{ color: 'var(--dp-accent)' }}
                    >
                      Открыть в Studio →
                    </Link>
                  </div>
                )}
                {data.weak_skills.length > 0 && (
                  <div>
                    <div className="dp-section-title">Нужно усилить</div>
                    <div className="mt-2 space-y-1">
                      {data.weak_skills.slice(0, 3).map((skill) => (
                        <p
                          key={skill.skill_id}
                          className="font-mono text-xs"
                          style={{ color: 'var(--dp-text-secondary)' }}
                        >
                          {skill.skill_id}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function dayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function MainAction({ data }: { data: TodayData }) {
  if (data.continue_lesson) {
    const lesson = data.continue_lesson
    return (
      <section
        className="rounded-xl p-6"
        style={{
          background: 'var(--dp-accent-subtle)',
          border: '1px solid var(--dp-accent-border)',
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: 'var(--dp-accent)' }}
        >
          Продолжить
        </div>
        <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--dp-text-primary)' }}>
          {lesson.title}
        </h2>
        <p
          className="mt-1.5 max-w-xl text-sm leading-relaxed"
          style={{ color: 'var(--dp-text-secondary)' }}
        >
          Вы остановились на разделе {lesson.current_scene_id?.match(/\d+/)?.[0] ?? '1'}.
          Продолжите, чтобы закрепить материал.
        </p>
        <Link
          to={`/focus/${encodeURIComponent(lesson.lesson_id)}`}
          className={`${buttonClassNames('primary', 'lg')} mt-4 inline-block`}
        >
          Продолжить урок <ArrowRightIcon width={18} height={18} />
        </Link>
      </section>
    )
  }

  if (data.next_lesson) {
    return (
      <section
        className="rounded-xl p-6"
        style={{
          background: 'var(--dp-accent-subtle)',
          border: '1px solid var(--dp-accent-border)',
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: 'var(--dp-accent)' }}
        >
          Следующий урок
        </div>
        <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--dp-text-primary)' }}>
          {data.next_lesson.title}
        </h2>
        {data.next_lesson.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.next_lesson.skills.map((skill) => (
              <span
                key={skill}
                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{
                  background: 'var(--dp-surface)',
                  color: 'var(--dp-text-muted)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        <Link
          to={`/focus/${encodeURIComponent(data.next_lesson.id)}`}
          className={`${buttonClassNames('primary', 'lg')} mt-4 inline-block`}
        >
          Начать урок <ArrowRightIcon width={18} height={18} />
        </Link>
      </section>
    )
  }

  return (
    <section
      className="rounded-xl p-6"
      style={{
        background: 'var(--dp-accent-subtle)',
        border: '1px solid var(--dp-accent-border)',
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--dp-accent)' }}
      >
        Добро пожаловать
      </div>
      <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--dp-text-primary)' }}>
        Начните с первого урока
      </h2>
      <p
        className="mt-1.5 max-w-xl text-sm leading-relaxed"
        style={{ color: 'var(--dp-text-secondary)' }}
      >
        Курс «Классический ML» ведёт от постановки задачи до ансамблей. Откройте Focus и выберите
        первый урок.
      </p>
      <Link to="/focus" className={`${buttonClassNames('primary', 'lg')} mt-4 inline-block`}>
        К урокам <ArrowRightIcon width={18} height={18} />
      </Link>
    </section>
  )
}

function ReviewCard({ data }: { data: TodayData }) {
  const summary = data.review_summary
  if (data.review_action === 'review_session') {
    return (
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
        style={{
          background: 'var(--dp-surface)',
          border: '1px solid var(--dp-border-subtle)',
        }}
      >
        <div className="min-w-0">
          <div className="dp-section-title">Повторение</div>
          <h2 className="mt-1 text-lg font-bold" style={{ color: 'var(--dp-text-primary)' }}>
            {formatCount(
              summary.due_count,
              'повторение на сегодня',
              'повторения на сегодня',
              'повторений на сегодня',
            )}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
            {summary.overdue_count > 0
              ? `${formatCount(summary.overdue_count, 'просрочено', 'просрочено', 'просрочено')} · короткая сессия вернёт материал.`
              : 'Короткая сессия закрепит материал в памяти.'}
          </p>
        </div>
        <Link to="/review" className={buttonClassNames('primary')}>
          Начать повторение <ArrowRightIcon width={16} height={16} />
        </Link>
      </section>
    )
  }
  if (summary.active_items > 0) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5 dp-surface">
        <div className="min-w-0">
          <div className="dp-section-title">Повторение</div>
          <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
            На сегодня всё
            {summary.next_due_at ? ` · следующее — ${formatShortDate(summary.next_due_at)}` : ''}.
          </p>
        </div>
        <Link to="/review" className={buttonClassNames('outline', 'sm')}>
          К повторениям
        </Link>
      </section>
    )
  }
  return (
    <section className="rounded-xl p-5 dp-surface">
      <div className="dp-section-title">Повторение</div>
      <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-muted)' }}>
        Пройдите урок — материал появится в расписании повторений.
      </p>
    </section>
  )
}

function PracticeCard({ practice }: { practice: NonNullable<TodayData['suggested_practice']> }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5 dp-surface">
      <div className="min-w-0">
        <div className="dp-section-title">Практика · {practice.track}</div>
        <h2 className="mt-1 text-base font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
          {practice.title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
          ~{practice.estimated_minutes} минут · результат сохранится в progress
        </p>
      </div>
      <Link
        to={`/studio?practice=${encodeURIComponent(practice.exercise_id)}`}
        className={buttonClassNames('outline', 'sm')}
      >
        Решить в Studio <ArrowRightIcon width={15} height={15} />
      </Link>
    </section>
  )
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
