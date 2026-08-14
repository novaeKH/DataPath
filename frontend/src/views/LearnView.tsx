import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchAtlas, fetchCourses, type AtlasData, type CourseSummary } from '../lib/api'
import { ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'
import { CourseArtwork } from '../components/learning/CourseArtwork'
import { getCourseVisual } from '../components/learning/courseVisuals'

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
      <div className="dp-library-intro">
        <PageHeader
          eyebrow="Библиотека знаний"
          title="Выберите направление"
          subtitle="Девять связанных маршрутов — от основ Python до надёжных ML-систем. Каждый курс хранит вашу позицию и прогресс."
        />
        <div className="dp-library-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {courses
          .filter((course) => RELEASE_COURSE_IDS.has(course.id))
          .sort(
            (left, right) =>
              Object.keys(SHORT_TITLE).indexOf(left.id) -
              Object.keys(SHORT_TITLE).indexOf(right.id),
          )
          .map((course) => {
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
            const visual = getCourseVisual(course.id)
            return (
              <Link
                key={course.id}
                to={`/focus?course=${encodeURIComponent(course.id)}`}
                className="dp-course-card group"
                style={
                  {
                    '--course-accent': visual.accent,
                    '--course-tint': visual.tint,
                  } as CSSProperties
                }
              >
                <div className="dp-course-card-visual">
                  <CourseArtwork courseId={course.id} compact />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold tracking-[-0.02em]">
                        {SHORT_TITLE[course.id] ?? course.title}
                      </h2>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: 'var(--dp-text-secondary)' }}
                      >
                        {visual.description}
                      </p>
                    </div>
                    <span className="dp-course-arrow">→</span>
                  </div>
                  <div
                    className="mt-5 h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--dp-border-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${average}%`, background: visual.accent }}
                    />
                  </div>
                  <div
                    className="mt-3 flex items-center justify-between text-[11px]"
                    style={{ color: 'var(--dp-text-muted)' }}
                  >
                    <span>
                      {course.lesson_count} уроков · {course.estimated_hours ?? '—'} ч
                    </span>
                    <span>
                      {average > 0 ? `${average}% · ${completed} освоено` : 'Начать курс'}
                    </span>
                  </div>
                  {learning > 0 && (
                    <div
                      className="mt-3 text-[11px] font-semibold"
                      style={{ color: visual.accent }}
                    >
                      {learning} {learning === 1 ? 'тема в работе' : 'темы в работе'}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
      </div>
    </motion.div>
  )
}
