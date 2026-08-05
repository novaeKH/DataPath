import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchToday, type TodayData, type SkillState } from '../lib/api'
import { ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { ArrowRightIcon } from '../components/ui/icons'
import { activityLabel, formatCount, formatDateTime, shortId } from '../lib/format'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: TodayData }

const STATE_META: Record<SkillState, { label: string; dot: string }> = {
  not_started: { label: 'Не начато', dot: 'var(--dp-text-muted)' },
  exploring: { label: 'Изучается', dot: 'var(--dp-warning)' },
  developing: { label: 'Развивается', dot: '#06b6d4' },
  strong: { label: 'Уверенно', dot: 'var(--dp-success)' },
  needs_attention: { label: 'Требует внимания', dot: 'var(--dp-error)' },
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
        message: 'Не удалось загрузить «Сегодня». Проверьте, что backend запущен и каталог синхронизирован.',
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

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <PageHeader
          title="Сегодня"
          subtitle={
            hasProgress
              ? `${formatCount(summary.lessons_completed, 'урок завершён', 'урока завершено', 'уроков завершено')} · ${formatCount(summary.lessons_started, 'урок в работе', 'урока в работе', 'уроков в работе')}`
              : 'Начните с первого урока — прогресс появится здесь.'
          }
        />

        <div className="mt-6 flex flex-col gap-5">
          {/* Primary recommendation — visually dominant */}
          <MainAction data={data} />

          {/* Review card — secondary */}
          <ReviewCard data={data} />

          {/* Summary grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Завершено"
              value={String(summary.lessons_completed)}
              subtitle="уроков"
            />
            <StatCard
              title="Лаборатории"
              value={String(summary.labs_completed)}
              subtitle="пройдено"
            />
            <StatCard
              title="Кейсы"
              value={String(summary.cases_completed)}
              subtitle="решено"
            />
          </div>

          {/* Weak skills */}
          {data.weak_skills.length > 0 && (
            <section className="rounded-xl p-5 dp-surface">
              <h2 className="dp-section-title mb-3">Нужно усилить</h2>
              <div className="flex flex-col gap-2">
                {data.weak_skills.map((skill) => (
                  <div
                    key={skill.skill_id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: 'var(--dp-error-subtle)' }}
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                        {skill.skill_id}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
                        {formatCount(skill.evidence_count, 'измерение', 'измерения', 'измерений')}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: 'color-mix(in srgb, var(--dp-error) 15%, transparent)',
                        color: 'var(--dp-error)',
                      }}
                    >
                      {STATE_META[skill.state]?.label ?? skill.state}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent activity */}
          {data.recent_activity.length > 0 && (
            <section className="rounded-xl p-5 dp-surface">
              <h2 className="dp-section-title mb-2">Недавняя активность</h2>
              <div className="flex flex-col gap-1">
                {data.recent_activity.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm"
                    style={{ color: 'var(--dp-text-secondary)' }}
                  >
                    <span className="truncate">
                      {activityLabel(event.event_type)}
                      <span className="ml-1 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                        {shortId(event.source_id)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Suggested case */}
          {data.suggested_case && (
            <section className="rounded-xl p-5 dp-surface">
              <h2 className="dp-section-title mb-2">Рекомендуемый кейс</h2>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--dp-text-primary)' }}>
                {data.suggested_case.title}
              </p>
              <Link
                to={`/studio?case=${encodeURIComponent(data.suggested_case.case_id)}`}
                className={buttonClassNames('primary', 'sm')}
              >
                Открыть в Studio
              </Link>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl p-4 dp-surface">
      <div className="dp-section-title">{title}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: 'var(--dp-text-primary)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
        {subtitle}
      </div>
    </div>
  )
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
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--dp-text-secondary)' }}>
          Вы остановились на сцене «{lesson.current_scene_id ?? 'первой'}». Продолжите, чтобы закрепить материал.
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
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--dp-text-secondary)' }}>
        Курс «Классический ML» ведёт от постановки задачи до ансамблей. Откройте Focus и выберите первый урок.
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
            {formatCount(summary.due_count, 'повторение на сегодня', 'повторения на сегодня', 'повторений на сегодня')}
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
            На сегодня всё{summary.next_due_at ? ` · следующее — ${formatShortDate(summary.next_due_at)}` : ''}.
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

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
