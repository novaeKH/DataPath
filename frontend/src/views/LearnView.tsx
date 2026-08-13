import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchAtlas, fetchCourses, type AtlasData, type CourseSummary } from '../lib/api'
import { ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; courses: CourseSummary[]; atlas: AtlasData }

const SHORT_TITLE: Record<string, string> = {
  'course.python-ds': 'Python',
  'course.math-ds': 'Математика',
  'course.data-analysis': 'NumPy & pandas',
  'course.data-tools': 'SQL & scikit-learn',
  'course.classic-ml': 'Classic ML',
  'course.deep-learning': 'Deep Learning',
  'course.nlp': 'NLP',
  'course.llm-rag': 'LLM / RAG',
  'course.mlops': 'MLOps',
}

const RELEASE_COURSE_IDS = new Set(Object.keys(SHORT_TITLE))

export function LearnView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const [courses, atlas] = await Promise.all([fetchCourses(signal), fetchAtlas(signal)])
      setState({ kind: 'ready', courses, atlas })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({ kind: 'error', message: 'Не удалось загрузить учебные направления.' })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') return <LoadingBlock label="Загрузка направлений…" rows={6} />
  if (state.kind === 'error')
    return (
      <ErrorState title="Курсы недоступны" message={state.message} onRetry={() => void load()} />
    )

  return <CourseLibrary courses={state.courses} atlas={state.atlas} />
}

function CourseLibrary({ courses, atlas }: { courses: CourseSummary[]; atlas: AtlasData }) {
  const lessonNodes = useMemo(() => atlas.nodes.filter((node) => node.type === 'lesson'), [atlas])
  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        eyebrow="Обучение"
        title="Выберите направление"
        subtitle="Все курсы в одном месте. Откройте маршрут, продолжите начатую тему или посмотрите прогресс."
      />

      <div className="mt-8 grid gap-x-10 gap-y-3 md:grid-cols-2">
        {courses
          .filter((course) => RELEASE_COURSE_IDS.has(course.id))
          .sort(
            (left, right) =>
              Object.keys(SHORT_TITLE).indexOf(left.id) -
              Object.keys(SHORT_TITLE).indexOf(right.id),
          )
          .map((course, index) => {
            const nodes = lessonNodes.filter((node) => node.course_id === course.id)
            const completed = nodes.filter((node) => node.status === 'strong').length
            const learning = nodes.filter((node) =>
              ['exploring', 'developing', 'needs_attention'].includes(node.status),
            ).length
            const average = nodes.length
              ? Math.round(
                  nodes.reduce((sum, node) => sum + (node.mastery_percent ?? 0), 0) / nodes.length,
                )
              : 0
            return (
              <Link
                key={course.id}
                to={`/focus?course=${encodeURIComponent(course.id)}`}
                className="group border-b py-5 transition-colors"
                style={{ borderColor: 'var(--dp-border-subtle)' }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs"
                    style={{
                      background: 'var(--dp-surface-interactive)',
                      color: 'var(--dp-text-muted)',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h2
                        className="text-base font-semibold tracking-tight"
                        style={{ color: 'var(--dp-text-primary)' }}
                      >
                        {SHORT_TITLE[course.id] ?? course.title}
                      </h2>
                      <span
                        className="transition-transform group-hover:translate-x-1"
                        style={{ color: 'var(--dp-text-muted)' }}
                      >
                        →
                      </span>
                    </div>
                    <p
                      className="mt-1 line-clamp-1 text-xs"
                      style={{ color: 'var(--dp-text-secondary)' }}
                    >
                      {course.title}
                    </p>
                    <div
                      className="mt-4 h-1 overflow-hidden rounded-full"
                      style={{ background: 'var(--dp-border-subtle)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${average}%`, background: 'var(--dp-accent)' }}
                      />
                    </div>
                    <div
                      className="mt-2 flex items-center justify-between text-[11px]"
                      style={{ color: 'var(--dp-text-muted)' }}
                    >
                      <span>
                        {course.lesson_count} уроков · {course.estimated_hours ?? '—'} ч
                      </span>
                      <span>
                        {completed} освоено · {learning} в работе · {average}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
      </div>
    </motion.div>
  )
}
