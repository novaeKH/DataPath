import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchRoadmap,
  type RoadmapData,
  type RoadmapLesson,
  type RoadmapModule,
  type RoadmapStage,
} from '../lib/api'
import { ErrorState, LoadingBlock } from '../components/ui/PageState'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { ArrowRightIcon } from '../components/ui/icons'
import { ProgressRing } from '../components/learning/CourseArtwork'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: RoadmapData }

export function RoadmapView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'ready', data: await fetchRoadmap(signal) })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({ kind: 'error', message: 'Не удалось загрузить учебный маршрут.' })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') return <LoadingBlock label="Загрузка маршрута…" rows={5} />
  if (state.kind === 'error')
    return (
      <ErrorState title="Маршрут недоступен" message={state.message} onRetry={() => void load()} />
    )

  return <Roadmap data={state.data} />
}

function Roadmap({ data }: { data: RoadmapData }) {
  const current = data.current_lesson
  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <section className="dp-progress-hero">
        <div>
          <p className="dp-eyebrow">Ваш прогресс</p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4vw,3.35rem)] font-bold leading-[1.07] tracking-[-0.04em]">
            Три прохода — от базы до уверенного применения
          </h1>
          <p
            className="mt-4 max-w-2xl text-sm leading-relaxed"
            style={{ color: 'var(--dp-text-secondary)' }}
          >
            Сначала соберите карту области, затем разберите механику и закрепите знания практикой.
            Это не гонка: маршрут всегда сохраняет текущее место.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/learn" className={buttonClassNames('primary')}>
              Продолжить путь
            </Link>
            <Link to="/atlas" className={buttonClassNames('outline')}>
              Карта знаний
            </Link>
          </div>
        </div>
        <ProgressRing
          value={
            data.total_lessons ? Math.round((data.completed_lessons / data.total_lessons) * 100) : 0
          }
          label="маршрута"
        />
      </section>

      {current && data.current_stage && (
        <section
          className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5 sm:p-6"
          style={{
            background: 'var(--dp-accent-subtle)',
            border: '1px solid var(--dp-accent-border)',
          }}
        >
          <div className="min-w-0">
            <p className="dp-section-title">
              Проход {data.current_stage.number} · {depthLabel(data.current_stage.depth)}
            </p>
            <h2 className="mt-1 text-lg font-bold">{current.title}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
              Текущий шаг · {current.estimated_minutes ?? 20} минут
            </p>
          </div>
          <Link
            to={`/focus/${encodeURIComponent(current.id)}`}
            className={buttonClassNames('primary')}
          >
            {current.status === 'learning' ? 'Продолжить' : 'Начать'}{' '}
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </section>
      )}

      <div className="dp-roadmap-story mt-12 space-y-8">
        {data.stages.map((stage) => (
          <StageBlock key={stage.id} stage={stage} currentLessonId={current?.id ?? null} />
        ))}
      </div>
    </motion.div>
  )
}

function StageBlock({
  stage,
  currentLessonId,
}: {
  stage: RoadmapStage
  currentLessonId: string | null
}) {
  return (
    <section className={`dp-roadmap-stage ${stage.status === 'learning' ? 'is-current' : ''}`}>
      <div
        className="grid gap-4 border-b p-5 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:p-6"
        style={{ borderColor: 'var(--dp-border-subtle)' }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl font-mono text-sm font-bold"
          style={{ background: 'var(--dp-surface-interactive)', color: 'var(--dp-accent)' }}
        >
          {String(stage.number).padStart(2, '0')}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{stage.title}</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: 'var(--dp-surface-interactive)', color: 'var(--dp-text-muted)' }}
            >
              {depthLabel(stage.depth)}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
            {stage.description}
          </p>
        </div>
        <div className="min-w-28 text-left sm:text-right">
          <strong className="text-sm">{stage.progress_percent}%</strong>
          <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            {stage.completed_lessons}/{stage.lesson_count} уроков
          </p>
        </div>
      </div>
      <div className="grid gap-px bg-[var(--dp-border-subtle)] lg:grid-cols-2">
        {stage.modules.map((module) => (
          <ModuleBlock key={module.id} module={module} currentLessonId={currentLessonId} />
        ))}
      </div>
    </section>
  )
}

function ModuleBlock({
  module,
  currentLessonId,
}: {
  module: RoadmapModule
  currentLessonId: string | null
}) {
  return (
    <details
      className="group bg-[var(--dp-surface)]"
      open={module.lessons.some((lesson) => lesson.id === currentLessonId)}
    >
      <summary className="min-h-16 cursor-pointer list-none px-5 py-4 dp-hover-interactive">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              {module.course_title}
            </p>
            <h3 className="mt-1 text-sm font-semibold">{module.title}</h3>
          </div>
          <span
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            ›
          </span>
        </div>
      </summary>
      <ol className="border-t px-3 py-2" style={{ borderColor: 'var(--dp-border-subtle)' }}>
        {module.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} current={lesson.id === currentLessonId} />
        ))}
      </ol>
    </details>
  )
}

function LessonRow({ lesson, current }: { lesson: RoadmapLesson; current: boolean }) {
  return (
    <li>
      <Link
        to={`/focus/${encodeURIComponent(lesson.id)}`}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm dp-hover-interactive"
        aria-current={current ? 'step' : undefined}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            background:
              lesson.status === 'completed' ? 'var(--dp-accent)' : 'var(--dp-surface-interactive)',
            color: lesson.status === 'completed' ? 'var(--dp-surface)' : 'var(--dp-text-muted)',
          }}
        >
          {lesson.status === 'completed' ? '✓' : current ? '→' : '·'}
        </span>
        <span className="min-w-0 flex-1">{lesson.title}</span>
        {lesson.mastery_percent > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--dp-text-muted)' }}>
            {lesson.mastery_percent}%
          </span>
        )}
      </Link>
    </li>
  )
}

function depthLabel(depth: RoadmapStage['depth']): string {
  return { orientation: 'ориентация', understanding: 'понимание', application: 'применение' }[depth]
}
