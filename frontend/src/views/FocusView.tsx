import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  completeLesson,
  completeScene,
  fetchCourseDetail,
  fetchLesson,
  fetchLessonProgress,
  fetchReviewSummary,
  type CourseDetail,
  type LessonDetail,
  type LessonProgressDetail,
} from '../lib/api'
import { SceneView } from '../components/lesson/SceneView'
import { LessonOutline } from '../components/lesson/LessonOutline'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/PageState'
import { Button } from '../components/ui/Button'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { formatCount } from '../lib/format'

const DEFAULT_COURSE_ID = 'course.classic-ml'

type LessonLoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'not-found' }
  | { kind: 'ready'; lesson: LessonDetail }

/** /focus — выбор урока из курса. */
export function FocusView() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()

  if (lessonId) {
    return <LessonView key={lessonId} lessonId={lessonId} onNavigate={navigate} />
  }
  return <CoursePicker onNavigate={navigate} />
}

/* ================================================================
   CoursePicker: Polished learning route with vertical continuity.
   ================================================================ */

type LessonProgressMap = Record<string, { completed: boolean; current: boolean }>

function CoursePicker({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; course: CourseDetail; progress: LessonProgressMap }
  >({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const course = await fetchCourseDetail(DEFAULT_COURSE_ID, signal)
      // Build lightweight progress map (started/completed) for all lessons
      const progress: LessonProgressMap = {}
      const allLessons = course.modules.flatMap((m) => m.lessons)
      await Promise.all(
        allLessons.map(async (lesson) => {
          try {
            const p = await fetchLessonProgress(lesson.id, signal)
            progress[lesson.id] = {
              completed: !!p?.completed_at,
              current: !!p && !p.completed_at && (p.completed_scenes?.length ?? 0) > 0,
            }
          } catch {
            progress[lesson.id] = { completed: false, current: false }
          }
        }),
      )
      setState({ kind: 'ready', course, progress })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState({
        kind: 'error',
        message: 'Не удалось загрузить курс. Проверьте, что backend запущен и каталог синхронизирован.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') {
    return <LoadingBlock label="Загрузка курса…" rows={5} />
  }
  if (state.kind === 'error') {
    return <ErrorState title="Курс недоступен" message={state.message} onRetry={() => void load()} />
  }

  const { course, progress } = state
  const allLessons = course.modules.flatMap((m) => m.lessons)
  const completedCount = allLessons.filter((l) => progress[l.id]?.completed).length
  const currentLessonId = allLessons.find((l) => progress[l.id]?.current)?.id ?? null

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Course header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/atlas"
              className="text-sm hover:underline"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              ← Atlas
            </Link>
            <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>
              ·
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5"
              style={{
                background: 'var(--dp-accent-subtle)',
                color: 'var(--dp-accent)',
              }}
            >
              {course.difficulty ?? 'Средняя'}
            </span>
          </div>
          <h1 className="dp-page-title">{course.title}</h1>
          <p className="dp-page-subtitle mt-2">
            {formatCount(
              allLessons.length,
              'урок',
              'урока',
              'уроков',
            )}{' '}
            · {course.estimated_hours ?? '—'} часов · {completedCount} завершено
          </p>
        </header>

        {/* Learning route */}
        <div className="relative">
          {/* Vertical route line */}
          <div
            className="absolute left-[23px] top-3 bottom-3 w-px"
            style={{ background: 'var(--dp-border-subtle)' }}
          />

          <div className="flex flex-col gap-6">
            {course.modules.map((module) => (
              <ModuleSection
                key={module.id}
                module={module}
                progress={progress}
                currentLessonId={currentLessonId}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Cases section */}
        {course.cases.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--dp-border-subtle)' }}>
            <h2 className="dp-section-title mb-3">Кейсы курса</h2>
            <div className="flex flex-wrap gap-2">
              {course.cases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/studio?case=${encodeURIComponent(caseItem.id)}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors dp-hover-interactive"
                  style={{
                    background: 'var(--dp-surface-interactive)',
                    color: 'var(--dp-text-secondary)',
                    border: '1px solid var(--dp-border-subtle)',
                  }}
                >
                  {caseItem.title} · {caseItem.practice_kind} →
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
              Кейсы проходятся в Studio: ответы и разбор считает backend без AI.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ModuleSection({
  module,
  progress,
  currentLessonId,
  onNavigate,
}: {
  module: CourseDetail['modules'][number]
  progress: LessonProgressMap
  currentLessonId: string | null
  onNavigate: (path: string) => void
}) {
  const moduleCompleted = module.lessons.every((l) => progress[l.id]?.completed)
  const moduleActive = module.lessons.some(
    (l) => progress[l.id]?.current || l.id === currentLessonId,
  )

  return (
    <div>
      {/* Module header */}
      <div className="flex items-center gap-3 mb-2 pl-12">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
          {module.title}
        </h3>
        {moduleCompleted && (
          <span
            className="text-[10px] font-medium rounded-full px-1.5 py-0.5"
            style={{ background: 'var(--dp-success-subtle)', color: 'var(--dp-success)' }}
          >
            ✓
          </span>
        )}
        {moduleActive && !moduleCompleted && (
          <span
            className="text-[10px] font-medium rounded-full px-1.5 py-0.5"
            style={{ background: 'var(--dp-accent-subtle)', color: 'var(--dp-accent)' }}
          >
            в процессе
          </span>
        )}
        {module.estimated_minutes != null && (
          <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
            ~{module.estimated_minutes} мин
          </span>
        )}
      </div>

      {/* Lessons */}
      <div className="flex flex-col gap-1">
        {module.lessons.map((lesson) => {
          const lessonNum = lesson.lesson_order ?? 0
          const isCompleted = progress[lesson.id]?.completed
          const isCurrent = progress[lesson.id]?.current || lesson.id === currentLessonId

          return (
            <button
              key={lesson.id}
              onClick={() => onNavigate(`/focus/${lesson.id}`)}
              className="group relative flex items-start gap-3 pl-12 pr-3 py-2.5 rounded-lg text-left transition-colors duration-150 w-full"
              style={{
                background: isCurrent
                  ? 'var(--dp-accent-subtle)'
                  : isCompleted
                    ? 'transparent'
                    : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'var(--dp-surface-interactive)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* Progress marker on route line */}
              <div
                className="absolute left-[17px] top-[14px] z-10 flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150"
                style={{
                  background: isCompleted
                    ? 'var(--dp-success)'
                    : isCurrent
                      ? 'var(--dp-surface)'
                      : 'var(--dp-surface)',
                  borderColor: isCompleted
                    ? 'var(--dp-success)'
                    : isCurrent
                      ? 'var(--dp-accent)'
                      : 'var(--dp-border-strong)',
                }}
              >
                {isCompleted && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isCurrent && (
                  <div
                    className="h-[5px] w-[5px] rounded-full"
                    style={{ background: 'var(--dp-accent)' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-mono shrink-0"
                    style={{
                      color: isCurrent ? 'var(--dp-accent)' : 'var(--dp-text-muted)',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {String(lessonNum).padStart(2, '0')}
                  </span>
                  <div>
                    <div
                      className="text-sm font-medium transition-colors duration-150"
                      style={{
                        color: isCurrent
                          ? 'var(--dp-accent)'
                          : isCompleted
                            ? 'var(--dp-text-secondary)'
                            : 'var(--dp-text-primary)',
                      }}
                    >
                      {lesson.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {lesson.estimated_minutes != null && (
                        <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                          ~{lesson.estimated_minutes} мин
                        </span>
                      )}
                      {lesson.difficulty && (
                        <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                          · {lesson.difficulty}
                        </span>
                      )}
                      {lesson.laboratory_ids.length > 0 && (
                        <span className="text-[11px]" style={{ color: 'var(--dp-accent)' }}>
                          · ⚡ лаб.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <span
                className="shrink-0 text-sm transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: 'var(--dp-text-muted)' }}
                aria-hidden="true"
              >
                →
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   LessonView — Lesson V2 with outline rail, scenes, checkpoints.
   (Preserved from existing, enhanced below.)
   ================================================================ */

function LessonView({
  lessonId,
  onNavigate,
}: {
  lessonId: string
  onNavigate: (path: string) => void
}) {
  // ... existing lesson view implementation — stays intact, enhanced in Stage C
  return <ExistingLessonView lessonId={lessonId} onNavigate={onNavigate} />
}

/** Preserved existing lesson view (enhancements in Stage C). */
function ExistingLessonView({
  lessonId,
  onNavigate,
}: {
  lessonId: string
  onNavigate: (path: string) => void
}) {
  const [state, setState] = useState<LessonLoadState>({ kind: 'loading' })
  const [sceneIndex, setSceneIndex] = useState(0)
  const [progress, setProgress] = useState<LessonProgressDetail | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [completing, setCompleting] = useState(false)
  const [completedFlash, setCompletedFlash] = useState(false)
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState({ kind: 'loading' })
      try {
        const lesson = await fetchLesson(lessonId, signal)
        setState({ kind: 'ready', lesson })

        fetchReviewSummary(lessonId, signal)
          .then((summary) => setReviewCount(summary.active_items))
          .catch(() => setReviewCount(null))

        try {
          const saved = await fetchLessonProgress(lessonId, signal)
          setProgress(saved)
          if (saved && saved.current_scene_id && !saved.completed_at) {
            const idx = lesson.scenes.findIndex((scene) => scene.id === saved.current_scene_id)
            if (idx >= 0) setSceneIndex(idx)
            else setSceneIndex(0)
          } else {
            setSceneIndex(0)
          }
        } catch {
          setProgress(null)
          setSceneIndex(0)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : ''
        if (message.includes('404')) {
          setState({ kind: 'not-found' })
        } else {
          setState({
            kind: 'error',
            message: 'Не удалось загрузить урок. Проверьте, что backend запущен.',
          })
        }
      }
    },
    [lessonId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const saveScene = useCallback(
    async (index: number) => {
      if (state.kind !== 'ready') return
      const scene = state.lesson.scenes[index]
      if (!scene) return
      setSaveState('saving')
      try {
        const updated = await completeScene(lessonId, scene.id, {
          scene_type: scene.type,
          skill_id: state.lesson.skills[0] ?? undefined,
        })
        setProgress((prev) => ({
          lesson_id: updated.lesson_id,
          current_scene_id: updated.current_scene_id,
          completed_scenes: updated.completed_scenes,
          started_at: updated.started_at,
          completed_at: updated.completed_at,
          updated_at: prev?.updated_at ?? updated.started_at,
        }))
        setSaveState('saved')
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = window.setTimeout(() => setSaveState('idle'), 1800)
      } catch {
        setSaveState('error')
      }
    },
    [lessonId, state],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleSelectScene = (index: number) => {
    setSceneIndex(index)
    void saveScene(index)
  }

  const handleNext = () => {
    setSceneIndex((index) => {
      const next = Math.min(state.kind === 'ready' ? state.lesson.scenes.length - 1 : 0, index + 1)
      void saveScene(next)
      return next
    })
  }

  const handlePrev = () => {
    setSceneIndex((index) => {
      const next = Math.max(0, index - 1)
      void saveScene(next)
      return next
    })
  }

  const handleCompleteLesson = async () => {
    setCompleting(true)
    try {
      await completeLesson(lessonId)
      setCompletedFlash(true)
      fetchReviewSummary(lessonId)
        .then((summary) => setReviewCount(summary.active_items))
        .catch(() => setReviewCount(null))
      const completedAt = new Date().toISOString()
      setProgress((prev) => {
        if (prev) return { ...prev, completed_at: completedAt }
        return {
          lesson_id: lessonId,
          current_scene_id: null,
          completed_scenes: [],
          started_at: completedAt,
          completed_at: completedAt,
          updated_at: completedAt,
        }
      })
      window.setTimeout(() => setCompletedFlash(false), 2500)
    } catch {
      setSaveState('error')
    } finally {
      setCompleting(false)
    }
  }

  const scenes = useMemo(() => (state.kind === 'ready' ? state.lesson.scenes : []), [state])
  const currentScene = scenes[sceneIndex] ?? null

  if (state.kind === 'loading') {
    return <LoadingBlock label="Загрузка урока…" rows={4} />
  }
  if (state.kind === 'not-found') {
    return (
      <EmptyState
        title="Урок не найден"
        description={`Урок ${lessonId} не существует или не опубликован в каталоге.`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigate('/focus')}>К списку уроков</Button>
            <Button variant="outline" onClick={() => onNavigate('/atlas')}>
              В Atlas
            </Button>
          </div>
        }
      />
    )
  }
  if (state.kind === 'error') {
    return (
      <ErrorState title="Ошибка загрузки" message={state.message} onRetry={() => void load()} />
    )
  }

  const lesson = state.lesson
  const goToLesson = (id: string | null) => {
    if (id) onNavigate(`/focus/${id}`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Lesson header — separated: breadcrumbs, title, purpose, metadata */}
        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            <Link to="/atlas" className="hover:underline">
              Atlas
            </Link>
            <span>/</span>
            <Link to="/focus" className="hover:underline">
              {lesson.course?.title ?? 'Курс'}
            </Link>
            {lesson.module && (
              <>
                <span>/</span>
                <span>{lesson.module.title}</span>
              </>
            )}
          </div>

          <h1 className="dp-page-title mt-1.5">{lesson.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {lesson.estimated_minutes != null && (
              <span
                className="text-xs font-medium rounded-full px-2.5 py-0.5"
                style={{
                  background: 'var(--dp-surface-interactive)',
                  color: 'var(--dp-text-secondary)',
                }}
              >
                ~{lesson.estimated_minutes} мин
              </span>
            )}
            {lesson.difficulty && (
              <span
                className="text-xs font-medium rounded-full px-2.5 py-0.5"
                style={{
                  background: 'var(--dp-surface-interactive)',
                  color: 'var(--dp-text-secondary)',
                }}
              >
                {lesson.difficulty}
              </span>
            )}
            {/* Skills moved to quiet metadata row */}
            {lesson.skills.length > 0 && (
              <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                {lesson.skills.slice(0, 3).join(' · ')}
                {lesson.skills.length > 3 ? ' …' : ''}
              </span>
            )}
          </div>
        </header>

        {/* Content area: outline rail + scenes */}
        {scenes.length === 0 ? (
          <div
            className="mt-8 rounded-xl border border-dashed p-10 text-center text-sm"
            style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}
          >
            В уроке пока нет сцен.
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Outline rail — compact, on the side */}
            <aside className="lg:sticky lg:top-6 lg:w-56 lg:shrink-0">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--dp-surface)',
                  border: '1px solid var(--dp-border-subtle)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="dp-section-title">Содержание</span>
                  {progress && (
                    <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                      {progress.completed_scenes.length}/{scenes.length}
                    </span>
                  )}
                </div>
                <LessonOutline
                  scenes={scenes}
                  currentIndex={sceneIndex}
                  completedScenes={progress?.completed_scenes}
                  onSelect={handleSelectScene}
                />
              </div>
            </aside>

            {/* Main reading area */}
            <div className="min-w-0 flex-1 dp-reading">
              {/* Progress bar */}
              <div className="mb-6 flex items-center gap-3 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                <span>
                  Сцена {sceneIndex + 1} из {scenes.length}
                </span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--dp-border-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((sceneIndex + 1) / scenes.length) * 100}%`,
                      background: 'var(--dp-accent)',
                    }}
                  />
                </div>
              </div>

              {currentScene && <SceneView scene={currentScene} />}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={handlePrev}
                  disabled={sceneIndex === 0}
                  className={buttonClassNames('outline', 'md', 'disabled:opacity-30')}
                >
                  ← Назад
                </button>

                <div className="flex items-center gap-3">
                  <SaveIndicator saveState={saveState} />
                  {sceneIndex < scenes.length - 1 ? (
                    <button onClick={handleNext} className={buttonClassNames('primary', 'md')}>
                      Далее →
                    </button>
                  ) : (
                    <button
                      onClick={() => void handleCompleteLesson()}
                      disabled={completing || progress?.completed_at != null}
                      className={buttonClassNames('primary', 'md')}
                    >
                      {progress?.completed_at
                        ? '✓ Урок завершён'
                        : completing
                          ? 'Завершаем…'
                          : 'Завершить урок'}
                    </button>
                  )}
                </div>
              </div>

              {completedFlash && (
                <div
                  className="mt-4 rounded-lg px-3 py-2 text-center text-xs font-medium"
                  style={{
                    background: 'var(--dp-success-subtle)',
                    color: 'var(--dp-success)',
                  }}
                >
                  ✓ Урок завершён — навыки обновлены, материал добавлен в расписание повторений.
                </div>
              )}

              {/* Course navigation + Review link */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--dp-border-subtle)' }}>
                <button
                  onClick={() => goToLesson(lesson.previous_lesson_id)}
                  disabled={!lesson.previous_lesson_id}
                  className="text-xs font-medium disabled:opacity-30 dp-hover-interactive rounded-lg px-3 py-1.5"
                  style={{ color: 'var(--dp-text-secondary)' }}
                >
                  ← Предыдущий урок
                </button>
                <button
                  onClick={() => goToLesson(lesson.next_lesson_id)}
                  disabled={!lesson.next_lesson_id}
                  className="text-xs font-medium disabled:opacity-30 dp-hover-interactive rounded-lg px-3 py-1.5"
                  style={{ color: 'var(--dp-text-secondary)' }}
                >
                  Следующий урок →
                </button>
                <div className="flex-1" />
                {reviewCount != null && reviewCount > 0 && (
                  <Link
                    to="/review"
                    className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                    style={{
                      color: 'var(--dp-accent)',
                      background: 'var(--dp-accent-subtle)',
                    }}
                  >
                    Повторить тему ({reviewCount}) →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function SaveIndicator({ saveState }: { saveState: string }) {
  if (saveState === 'saving') {
    return <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>Сохранение…</span>
  }
  if (saveState === 'saved') {
    return <span className="text-xs" style={{ color: 'var(--dp-success)' }}>✓ Сохранено</span>
  }
  if (saveState === 'error') {
    return <span className="text-xs" style={{ color: 'var(--dp-error)' }}>Ошибка сохранения</span>
  }
  return null
}
