import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchCourses,
  fetchRoadmap,
  fetchToday,
  type CourseSummary,
  type RoadmapData,
  type TodayData,
} from '../lib/api'
import { ErrorState, LoadingBlock } from '../components/ui/PageState'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { ArrowRightIcon } from '../components/ui/icons'
import { CourseArtwork } from '../components/learning/CourseArtwork'
import { courseIdFromLessonId, getCourseVisual } from '../components/learning/courseVisuals'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: TodayData; roadmap: RoadmapData | null; courses: CourseSummary[] }

export function TodayView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const data = await fetchToday(signal)
      const [roadmap, courses] = await Promise.all([
        fetchRoadmap(signal).catch(() => null),
        fetchCourses(signal).catch(() => []),
      ])
      setState({ kind: 'ready', data, roadmap, courses })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
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

  if (state.kind === 'loading') return <LoadingBlock label="Загрузка «Сегодня»…" rows={4} />
  if (state.kind === 'error')
    return <ErrorState message={state.message} onRetry={() => void load()} />

  return <LearningHome data={state.data} roadmap={state.roadmap} courses={state.courses} />
}

function LearningHome({
  data,
  roadmap,
  courses,
}: {
  data: TodayData
  roadmap: RoadmapData | null
  courses: CourseSummary[]
}) {
  const lessonId = data.continue_lesson?.lesson_id ?? data.next_lesson?.id ?? null
  const courseId = data.continue_lesson
    ? courseIdFromLessonId(data.continue_lesson.lesson_id)
    : (data.next_lesson?.course_id ?? courseIdFromLessonId(lessonId))
  const course = courses.find((item) => item.id === courseId)
  const visual = getCourseVisual(courseId)
  const lesson = data.continue_lesson ?? data.next_lesson
  const context = data.roadmap_context
  const total = roadmap?.total_lessons ?? context?.total_lessons ?? 0
  const completed =
    roadmap?.completed_lessons ??
    context?.completed_lessons ??
    data.progress_summary.lessons_completed
  const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  const stage = roadmap?.current_stage ?? context?.current_stage ?? null
  const currentModule = useMemo(() => {
    if (!roadmap || !lessonId) return null
    return (
      roadmap.stages
        .flatMap((item) => item.modules)
        .find((module) => module.lessons.some((item) => item.id === lessonId)) ?? null
    )
  }, [lessonId, roadmap])
  const nextLessons = useMemo(() => {
    if (!roadmap) return []
    const all = roadmap.stages.flatMap((item) =>
      item.modules.flatMap((module) =>
        module.lessons.map((nextLesson) => ({
          ...nextLesson,
          module: module.title,
          courseId: module.course_id,
        })),
      ),
    )
    const currentIndex = all.findIndex((item) => item.id === lessonId)
    const start = currentIndex >= 0 ? currentIndex + 1 : 0
    return all.slice(start, start + 4)
  }, [lessonId, roadmap])

  const lessonMinutes =
    data.continue_lesson?.estimated_minutes ?? data.next_lesson?.estimated_minutes ?? 20
  const practiceMinutes = data.suggested_practice?.estimated_minutes ?? 10
  const reviewMinutes = data.due_reviews ? Math.min(data.due_reviews * 3, 18) : 5
  const reviewTitle =
    data.due_reviews > 0
      ? `${data.due_reviews} повторений на сегодня`
      : data.review_summary.active_items > 0
        ? 'На сегодня всё'
        : 'Закрепить изученное'
  const reviewMeta =
    data.overdue_reviews > 0
      ? `${data.overdue_reviews} просрочено · ${reviewMinutes} мин`
      : `Повторение · ${reviewMinutes} мин`

  return (
    <motion.div
      className="mx-auto max-w-[1180px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <header className="mb-7 flex items-end justify-between gap-5">
        <div>
          <p className="dp-eyebrow">{dayGreeting()}</p>
          <h1 className="dp-page-title mt-2">Сегодня</h1>
          <p className="dp-page-subtitle mt-1">
            Продолжите свой путь с того места, где остановились.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <strong className="block text-lg">{overallPercent}%</strong>
          <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            общий прогресс
          </span>
        </div>
      </header>

      <section
        className="dp-learning-hero"
        style={{ '--course-accent': visual.accent, '--course-tint': visual.tint } as CSSProperties}
      >
        <div className="relative z-10 max-w-[650px]">
          <p className="dp-eyebrow">
            {data.continue_lesson ? 'Продолжить обучение' : 'Следующий урок'}
          </p>
          <div
            className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium"
            style={{ color: 'var(--dp-text-secondary)' }}
          >
            <span>{course ? getCourseVisual(course.id).shortTitle : visual.shortTitle}</span>
            <span>·</span>
            <span>{currentModule?.title ?? stage?.title ?? 'Учебный маршрут'}</span>
          </div>
          <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.7rem)] font-bold leading-[1.08] tracking-[-0.035em]">
            {lesson?.title ?? 'Начните свой учебный путь'}
          </h2>
          <p
            className="mt-4 max-w-[560px] text-[15px] leading-relaxed"
            style={{ color: 'var(--dp-text-secondary)' }}
          >
            {data.continue_lesson
              ? 'Вернитесь к материалу без повторного поиска: позиция, ответы и прогресс уже сохранены.'
              : 'Один содержательный шаг сегодня — и большая карта знаний станет немного понятнее.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to={lessonId ? `/focus/${encodeURIComponent(lessonId)}` : '/learn'}
              className={buttonClassNames('primary', 'lg')}
            >
              {data.continue_lesson
                ? 'Продолжить урок'
                : lessonId
                  ? 'Начать урок'
                  : 'Выбрать направление'}{' '}
              <ArrowRightIcon width={18} height={18} />
            </Link>
            <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
              ≈ {lessonMinutes} минут
            </span>
          </div>
        </div>
        <CourseArtwork courseId={courseId} className="dp-learning-hero-art" />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="dp-eyebrow">Ваш путь</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Три уровня понимания</h2>
          </div>
          <Link
            to="/roadmap"
            className="text-sm font-semibold"
            style={{ color: 'var(--dp-accent)' }}
          >
            Весь маршрут →
          </Link>
        </div>
        <div className="dp-path-preview">
          {(roadmap?.stages.length ? roadmap.stages : fallbackStages(stage?.number ?? 1)).map(
            (item, index) => {
              const percent = 'progress_percent' in item ? item.progress_percent : item.percent
              const isCurrent = item.number === stage?.number || (!stage && index === 0)
              return (
                <div key={item.number} className={`dp-path-stage ${isCurrent ? 'is-current' : ''}`}>
                  <div className="dp-path-node">{percent >= 100 ? '✓' : item.number}</div>
                  <div className="min-w-0">
                    <strong>{'short_title' in item ? item.short_title : item.title}</strong>
                    <span>{percent}% завершено</span>
                  </div>
                  <div className="dp-path-progress">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            },
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="dp-eyebrow">План дня</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Около {lessonMinutes + practiceMinutes + reviewMinutes} минут
          </h2>
          <div className="dp-daily-timeline mt-6">
            <PlanItem
              index="01"
              title={lesson?.title ?? 'Выбрать урок'}
              meta={`Урок · ${lessonMinutes} мин`}
              to={lessonId ? `/focus/${encodeURIComponent(lessonId)}` : '/learn'}
              action={data.continue_lesson ? 'Продолжить' : 'Начать'}
            />
            <PlanItem
              index="02"
              title="SQL Praktikum или AlgoPath"
              meta={`Практика · ${practiceMinutes} мин`}
              to="/studio"
              action="Выбрать тренажёр"
            />
            <PlanItem
              index="03"
              title={reviewTitle}
              meta={reviewMeta}
              to="/review"
              action={
                data.review_action === 'review_session' ? 'Начать повторение' : 'К повторениям'
              }
              heading
            />
          </div>
        </div>
        <aside className="dp-today-note">
          <span aria-hidden="true">✦</span>
          <p className="dp-eyebrow">Ритм важнее спринта</p>
          <h2>Один завершённый урок лучше пяти открытых.</h2>
          <p>
            DataPath сохранит место, а Review вернёт тему тогда, когда её полезнее всего повторить.
          </p>
        </aside>
      </section>

      {(nextLessons.length > 0 || data.weak_skills.length > 0) && (
        <section className="mt-14 border-t pt-9" style={{ borderColor: 'var(--dp-border-subtle)' }}>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="dp-eyebrow">Дальше</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Следующие шаги</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {nextLessons.map((item, index) => (
              <Link
                key={item.id}
                to={`/focus/${encodeURIComponent(item.id)}`}
                className="dp-next-lesson"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
                <small>{item.module}</small>
              </Link>
            ))}
          </div>
          {data.weak_skills.length > 0 && (
            <div
              className="mt-6 flex flex-wrap items-center gap-2 text-xs"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              <strong style={{ color: 'var(--dp-text-secondary)' }}>Нужно усилить:</strong>
              {data.weak_skills.slice(0, 3).map((skill) => (
                <span key={skill.skill_id} className="dp-soft-chip">
                  <span className="sr-only">{skill.skill_id}</span>
                  {humanizeSkill(skill.skill_id)}
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </motion.div>
  )
}

function PlanItem({
  index,
  title,
  meta,
  to,
  action,
  heading = false,
}: {
  index: string
  title: string
  meta: string
  to: string
  action: string
  heading?: boolean
}) {
  return (
    <div className="dp-plan-item">
      <div className="dp-plan-index">{index}</div>
      <div className="min-w-0 flex-1">
        {heading ? <h3>{title}</h3> : <strong>{title}</strong>}
        <span>{meta}</span>
      </div>
      <Link to={to}>{action} →</Link>
    </div>
  )
}

function fallbackStages(current: number) {
  return [
    { number: 1, title: 'Ориентация', percent: current > 1 ? 100 : 20 },
    { number: 2, title: 'Понимание', percent: current > 2 ? 100 : current === 2 ? 20 : 0 },
    { number: 3, title: 'Применение', percent: current === 3 ? 20 : 0 },
  ]
}

function dayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function humanizeSkill(skillId: string) {
  const last = skillId.split('.').pop() ?? skillId
  return last.replaceAll('_', ' ').replace(/^./, (letter) => letter.toLocaleUpperCase('ru-RU'))
}
