import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import type { AssessmentAttempt } from '../components/lesson/CheckpointScene'
import { LessonNotes } from '../components/lesson/LessonNotes'
import { LessonOutline } from '../components/lesson/LessonOutline'
import { InlineMarkdownContent } from '../components/lesson/MarkdownContent'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/PageState'
import { Button } from '../components/ui/Button'
import { buttonClassNames } from '../components/ui/buttonStyles'
import { formatCount } from '../lib/format'
import {
  canCompleteSceneByVisit,
  collectVisitedSceneIndices,
  completedSceneCount,
  findActiveSceneIndex,
  mergeCompletedSceneIds,
} from '../lib/lessonSceneProgress'
import { CourseArtwork, ProgressRing } from '../components/learning/CourseArtwork'
import { getCourseVisual } from '../components/learning/courseVisuals'

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
  const [searchParams] = useSearchParams()

  if (lessonId) {
    return <LessonView key={lessonId} lessonId={lessonId} onNavigate={navigate} />
  }
  return (
    <CoursePicker
      courseId={searchParams.get('course') ?? DEFAULT_COURSE_ID}
      onNavigate={navigate}
    />
  )
}

/* ================================================================
   CoursePicker: Polished learning route with vertical continuity.
   ================================================================ */

type LessonProgressMap = Record<string, { completed: boolean; current: boolean }>

function CoursePicker({
  courseId,
  onNavigate,
}: {
  courseId: string
  onNavigate: (path: string) => void
}) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; course: CourseDetail; progress: LessonProgressMap }
  >({ kind: 'loading' })

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState({ kind: 'loading' })
      try {
        const course = await fetchCourseDetail(courseId, signal)
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
          message:
            'Не удалось загрузить курс. Проверьте, что backend запущен и каталог синхронизирован.',
        })
      }
    },
    [courseId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') {
    return <LoadingBlock label="Загрузка курса…" rows={5} />
  }
  if (state.kind === 'error') {
    return (
      <ErrorState title="Курс недоступен" message={state.message} onRetry={() => void load()} />
    )
  }

  const { course, progress } = state
  const allLessons = course.modules.flatMap((m) => m.lessons)
  const completedCount = allLessons.filter((l) => progress[l.id]?.completed).length
  const currentLessonId = allLessons.find((l) => progress[l.id]?.current)?.id ?? null

  const visual = getCourseVisual(course.id)
  const coursePercent = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Link
          to="/learn"
          className="mb-4 inline-flex text-sm font-medium"
          style={{ color: 'var(--dp-text-muted)' }}
        >
          ← Все направления
        </Link>
        <header
          className="dp-course-hero"
          style={
            { '--course-accent': visual.accent, '--course-tint': visual.tint } as CSSProperties
          }
        >
          <div className="relative z-10 max-w-xl">
            <p className="dp-eyebrow">Учебный маршрут</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3.35rem)] font-bold leading-[1.04] tracking-[-0.04em]">
              {course.title}
            </h1>
            <p
              className="mt-3 max-w-lg text-[15px] leading-relaxed"
              style={{ color: 'var(--dp-text-secondary)' }}
            >
              {visual.description}
            </p>
            <div
              className="mt-6 flex flex-wrap items-center gap-3 text-xs"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              <span>{formatCount(allLessons.length, 'урок', 'урока', 'уроков')}</span>
              <span>·</span>
              <span>{course.estimated_hours ?? '—'} часов</span>
              <span>·</span>
              <span>{course.modules.length} модулей</span>
            </div>
            <button
              onClick={() => onNavigate(`/focus/${currentLessonId ?? course.first_lesson_id}`)}
              className={`${buttonClassNames('primary', 'lg')} mt-6`}
            >
              {currentLessonId
                ? 'Продолжить обучение'
                : completedCount
                  ? 'Вернуться к курсу'
                  : 'Начать курс'}{' '}
              →
            </button>
          </div>
          <div className="dp-course-hero-progress">
            <CourseArtwork courseId={course.id} />
            <ProgressRing value={coursePercent} label="курса" />
          </div>
        </header>

        <div className="mb-7 mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="dp-eyebrow">Путь курса</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">От основ к применению</h2>
          </div>
          <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            {completedCount} из {allLessons.length} завершено
          </span>
        </div>

        {/* Learning route */}
        <div className="relative">
          {/* Vertical route line */}
          <div className="dp-journey-line" />

          <div className="flex flex-col gap-6">
            {course.modules.map((module, index) => (
              <ModuleSection
                key={module.id}
                module={module}
                moduleIndex={index}
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
  moduleIndex,
  progress,
  currentLessonId,
  onNavigate,
}: {
  module: CourseDetail['modules'][number]
  moduleIndex: number
  progress: LessonProgressMap
  currentLessonId: string | null
  onNavigate: (path: string) => void
}) {
  const moduleCompleted = module.lessons.every((l) => progress[l.id]?.completed)
  const moduleActive = module.lessons.some(
    (l) => progress[l.id]?.current || l.id === currentLessonId,
  )

  return (
    <section
      className={`dp-journey-module ${moduleActive ? 'is-active' : ''} ${moduleCompleted ? 'is-complete' : ''}`}
    >
      <div className="dp-module-marker">
        {moduleCompleted ? '✓' : String(moduleIndex + 1).padStart(2, '0')}
      </div>
      {/* Module header */}
      <div className="mb-3 flex items-center gap-3">
        <h3
          className="text-lg font-bold tracking-tight"
          style={{ color: 'var(--dp-text-primary)' }}
        >
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
              className="dp-journey-lesson group relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150"
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
              {/* Progress marker */}
              <div
                className="mt-1 flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150"
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
                    <path
                      d="M1.5 4L3.5 6L6.5 2"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
    </section>
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
  const sceneElementsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const activeSceneIndexRef = useRef(0)
  const restoredLessonRef = useRef<string | null>(null)
  const activeLessonIdRef = useRef(lessonId)
  const completedSceneIdsRef = useRef(new Set<string>())
  const queuedSceneIdsRef = useRef(new Set<string>())
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingSaveCountRef = useRef(0)
  const navigationTargetIndexRef = useRef<number | null>(null)
  const lastScrollYRef = useRef<number | null>(null)
  const scrollFrameRef = useRef<number | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState({ kind: 'loading' })
      setProgress(null)
      activeLessonIdRef.current = lessonId
      activeSceneIndexRef.current = 0
      completedSceneIdsRef.current = new Set()
      queuedSceneIdsRef.current = new Set()
      saveQueueRef.current = Promise.resolve()
      pendingSaveCountRef.current = 0
      navigationTargetIndexRef.current = null
      lastScrollYRef.current = null
      restoredLessonRef.current = null
      try {
        const lesson = await fetchLesson(lessonId, signal)

        fetchReviewSummary(lessonId, signal)
          .then((summary) => setReviewCount(summary.active_items))
          .catch(() => setReviewCount(null))

        let savedProgress: LessonProgressDetail | null = null
        try {
          savedProgress = await fetchLessonProgress(lessonId, signal)
          if (savedProgress && savedProgress.current_scene_id && !savedProgress.completed_at) {
            const idx = lesson.scenes.findIndex(
              (scene) => scene.id === savedProgress?.current_scene_id,
            )
            if (idx >= 0) setSceneIndex(idx)
            else setSceneIndex(0)
          } else {
            setSceneIndex(0)
          }
        } catch {
          setSceneIndex(0)
        }
        if (signal?.aborted) return
        const savedSceneIds = new Set(savedProgress?.completed_scenes ?? [])
        completedSceneIdsRef.current = savedSceneIds
        queuedSceneIdsRef.current = new Set(savedSceneIds)
        setProgress(savedProgress)
        setState({ kind: 'ready', lesson })
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
    (index: number, outcome = 'completed'): Promise<void> => {
      if (state.kind !== 'ready') return Promise.resolve()
      const scene = state.lesson.scenes[index]
      if (!scene) return Promise.resolve()
      const sceneOrder = state.lesson.scenes.map((candidate) => candidate.id)
      const deduplicateVisit = outcome === 'completed'
      if (deduplicateVisit && queuedSceneIdsRef.current.has(scene.id)) {
        return saveQueueRef.current
      }
      if (deduplicateVisit) queuedSceneIdsRef.current.add(scene.id)

      const optimisticTime = new Date().toISOString()
      setProgress((previous) => ({
        lesson_id: lessonId,
        current_scene_id: scene.id,
        completed_scenes: mergeCompletedSceneIds(
          previous?.completed_scenes ?? [],
          [scene.id],
          sceneOrder,
        ),
        started_at: previous?.started_at ?? optimisticTime,
        completed_at: previous?.completed_at ?? null,
        updated_at: optimisticTime,
      }))
      pendingSaveCountRef.current += 1
      setSaveState('saving')

      const request = saveQueueRef.current.then(async () => {
        let failed = false
        try {
          const updated = await completeScene(lessonId, scene.id, {
            scene_type: scene.type,
            skill_id: state.lesson.skills[0] ?? undefined,
            outcome,
          })
          if (activeLessonIdRef.current !== lessonId) return
          completedSceneIdsRef.current.add(scene.id)
          setProgress((previous) => ({
            lesson_id: updated.lesson_id,
            current_scene_id: updated.current_scene_id ?? previous?.current_scene_id ?? scene.id,
            completed_scenes: mergeCompletedSceneIds(
              previous?.completed_scenes ?? [],
              updated.completed_scenes,
              sceneOrder,
            ),
            started_at: previous?.started_at ?? updated.started_at,
            completed_at: previous?.completed_at ?? updated.completed_at,
            updated_at: new Date().toISOString(),
          }))
        } catch {
          failed = true
          if (deduplicateVisit && !completedSceneIdsRef.current.has(scene.id)) {
            queuedSceneIdsRef.current.delete(scene.id)
            setProgress((previous) =>
              previous
                ? {
                    ...previous,
                    completed_scenes: previous.completed_scenes.filter(
                      (sceneId) => sceneId !== scene.id,
                    ),
                  }
                : previous,
            )
          }
          if (activeLessonIdRef.current === lessonId) setSaveState('error')
        } finally {
          pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1)
          if (
            activeLessonIdRef.current === lessonId &&
            pendingSaveCountRef.current === 0 &&
            !failed
          ) {
            setSaveState('saved')
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
            saveTimerRef.current = window.setTimeout(() => setSaveState('idle'), 1800)
          }
        }
      })
      saveQueueRef.current = request
      return request
    },
    [lessonId, state],
  )

  const visitScene = useCallback(
    (index: number) => {
      if (state.kind !== 'ready' || !canCompleteSceneByVisit(state.lesson.scenes[index])) return
      void saveScene(index)
    },
    [saveScene, state],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
      if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current)
    }
  }, [])

  const scrollToScene = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (state.kind !== 'ready') return
      const scene = state.lesson.scenes[index]
      if (!scene) return
      navigationTargetIndexRef.current = index
      lastScrollYRef.current = window.scrollY
      activeSceneIndexRef.current = index
      setSceneIndex(index)
      window.requestAnimationFrame(() => {
        sceneElementsRef.current[scene.id]?.scrollIntoView?.({ behavior, block: 'start' })
      })
    },
    [state],
  )

  const handleSelectScene = (index: number) => {
    visitScene(sceneIndex)
    scrollToScene(index)
  }

  const handleAssessmentAttempt = useCallback(
    async (attempt: AssessmentAttempt) => {
      if (state.kind !== 'ready') return
      const index = state.lesson.scenes.findIndex((scene) => scene.id === attempt.sceneId)
      if (index >= 0) await saveScene(index, attempt.outcome)
    },
    [saveScene, state],
  )

  const handleNext = () => {
    const next = Math.min(
      state.kind === 'ready' ? state.lesson.scenes.length - 1 : 0,
      sceneIndex + 1,
    )
    visitScene(sceneIndex)
    scrollToScene(next)
  }

  const handlePrev = () => {
    const next = Math.max(0, sceneIndex - 1)
    visitScene(sceneIndex)
    scrollToScene(next)
  }

  const handleCompleteLesson = async () => {
    setCompleting(true)
    try {
      await saveScene(sceneIndex)
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

  useEffect(() => {
    activeSceneIndexRef.current = sceneIndex
  }, [sceneIndex])

  useEffect(() => {
    if (state.kind !== 'ready' || sceneIndex <= 0 || restoredLessonRef.current === lessonId) return
    const scene = scenes[sceneIndex]
    if (!scene) return
    restoredLessonRef.current = lessonId
    navigationTargetIndexRef.current = sceneIndex
    lastScrollYRef.current = window.scrollY
    window.requestAnimationFrame(() => {
      sceneElementsRef.current[scene.id]?.scrollIntoView?.({ block: 'start' })
    })
  }, [lessonId, sceneIndex, scenes, state.kind])

  useEffect(() => {
    if (state.kind !== 'ready' || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        const navigationTarget = navigationTargetIndexRef.current
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.getAttribute('data-scene-index')))
          .filter((index) => Number.isFinite(index))
          .filter((index) => navigationTarget == null || index === navigationTarget)
          .sort((left, right) => left - right)
        for (const index of intersecting) visitScene(index)
        if (navigationTarget != null && intersecting.includes(navigationTarget)) {
          navigationTargetIndexRef.current = null
          lastScrollYRef.current = window.scrollY
        }
      },
      { rootMargin: '-8% 0px -8% 0px', threshold: 0 },
    )
    for (const scene of scenes) {
      const element = sceneElementsRef.current[scene.id]
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [scenes, state.kind, visitScene])

  useEffect(() => {
    if (state.kind !== 'ready') return

    const updateFromViewport = () => {
      scrollFrameRef.current = null
      const viewportHeight = Math.max(window.innerHeight, 1)
      const currentScrollY = window.scrollY
      const positions = scenes.flatMap((scene, index) => {
        const element = sceneElementsRef.current[scene.id]
        if (!element) return []
        const rect = element.getBoundingClientRect()
        return [{ index, top: rect.top, bottom: rect.bottom }]
      })
      // jsdom and hidden containers expose zero-sized rectangles. They are not evidence of a visit.
      if (!positions.some((position) => position.bottom > position.top)) return

      const documentHeight = document.documentElement.scrollHeight
      const atDocumentEnd =
        documentHeight > viewportHeight && currentScrollY + viewportHeight >= documentHeight - 8
      const navigationTarget = navigationTargetIndexRef.current
      const visited = collectVisitedSceneIndices({
        positions,
        scenes,
        previousScrollY: lastScrollYRef.current,
        currentScrollY,
        viewportHeight,
        navigationTargetIndex: navigationTarget,
        atDocumentEnd,
      })
      for (const index of visited) visitScene(index)

      if (navigationTarget != null) {
        if (visited.includes(navigationTarget)) {
          navigationTargetIndexRef.current = null
          activeSceneIndexRef.current = navigationTarget
          setSceneIndex(navigationTarget)
        }
      } else {
        const nextIndex = findActiveSceneIndex(
          positions,
          viewportHeight,
          activeSceneIndexRef.current,
          atDocumentEnd,
        )
        if (nextIndex !== activeSceneIndexRef.current) {
          activeSceneIndexRef.current = nextIndex
          setSceneIndex(nextIndex)
        }
      }
      lastScrollYRef.current = currentScrollY
    }

    const scheduleUpdate = () => {
      if (scrollFrameRef.current != null) return
      scrollFrameRef.current = window.requestAnimationFrame(updateFromViewport)
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    scheduleUpdate()
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
        scrollFrameRef.current = null
      }
    }
  }, [scenes, state.kind, visitScene])

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
  const visitedSceneCount = completedSceneCount(progress?.completed_scenes, scenes)
  const visitedPercent = scenes.length ? Math.round((visitedSceneCount / scenes.length) * 100) : 0
  const goToLesson = (id: string | null) => {
    if (id) onNavigate(`/focus/${id}`)
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Lesson header — separated: breadcrumbs, title, purpose, metadata */}
        <header className="dp-lesson-header mx-auto max-w-[920px]">
          <div
            className="flex flex-wrap items-center gap-2 text-xs"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            <Link to="/learn" className="hover:underline">
              Курсы
            </Link>
            <span>/</span>
            <Link
              to={`/focus?course=${encodeURIComponent(lesson.course?.id ?? DEFAULT_COURSE_ID)}`}
              className="hover:underline"
            >
              {lesson.course?.title ?? 'Курс'}
            </Link>
            {lesson.module && (
              <>
                <span>/</span>
                <span>{lesson.module.title}</span>
              </>
            )}
          </div>

          <h1 className="mt-4 max-w-[820px] text-[clamp(2.1rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            {lesson.title}
          </h1>

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
            <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
              {lesson.module?.title ?? lesson.course?.title}
            </span>
          </div>
        </header>

        {(lesson.prerequisites?.length ?? 0) > 0 && (
          <aside
            className="mx-auto mt-7 max-w-[920px] rounded-2xl border px-5 py-4"
            style={{
              borderColor: 'var(--dp-border-subtle)',
              background: 'var(--dp-surface-subtle)',
            }}
            aria-label="Необходимые знания"
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
              Перед началом
            </p>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--dp-text-muted)' }}>
              Этот урок опирается на материал ниже. Если термины незнакомы, сначала быстро повторите
              его — так в объяснении не останется скрытого шага.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(lesson.prerequisites ?? []).map((prerequisite) => (
                <Link
                  key={prerequisite.id}
                  to={`/focus/${encodeURIComponent(prerequisite.id)}`}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium dp-hover-interactive"
                  style={{
                    color: 'var(--dp-accent)',
                    background: 'var(--dp-accent-subtle)',
                  }}
                >
                  {prerequisite.title}
                </Link>
              ))}
            </div>
          </aside>
        )}

        <div
          className="mx-auto mt-7 flex max-w-[920px] items-center gap-3 text-xs"
          style={{ color: 'var(--dp-text-muted)' }}
        >
          <span>
            Раздел {sceneIndex + 1} из {scenes.length}
          </span>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: 'var(--dp-border-subtle)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${visitedPercent}%`,
                background: 'var(--dp-accent)',
              }}
            />
          </div>
          <span>{visitedPercent}%</span>
        </div>

        {/* Content area: reading column + sticky outline */}
        {scenes.length === 0 ? (
          <div
            className="mt-8 rounded-xl border border-dashed p-10 text-center text-sm"
            style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}
          >
            В уроке пока нет сцен.
          </div>
        ) : (
          <div className="mt-9 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,720px)_230px] lg:justify-center lg:items-start">
            <details className="rounded-xl lg:hidden dp-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3">
                <span className="dp-section-title">Содержание урока</span>
                <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                  {visitedSceneCount}/{scenes.length} · открыть
                </span>
              </summary>
              <div className="border-t p-3" style={{ borderColor: 'var(--dp-border-subtle)' }}>
                <LessonOutline
                  scenes={scenes}
                  currentIndex={sceneIndex}
                  completedScenes={progress?.completed_scenes}
                  onSelect={handleSelectScene}
                />
              </div>
            </details>
            {/* Main reading area */}
            <div className="min-w-0 dp-reading">
              <article aria-label="Материал урока" className="dp-lesson-document">
                {scenes.map((scene, index) => {
                  const proseLike = [
                    'markdown',
                    'formula',
                    'code',
                    'callout',
                    'table',
                    'visual',
                  ].includes(scene.type)
                  const sourceHeading = scene.source_heading?.trim() || null
                  const previousHeading =
                    index > 0 ? scenes[index - 1]?.source_heading?.trim() : null
                  const startsSourceSection =
                    proseLike && sourceHeading !== null && sourceHeading !== previousHeading
                  return (
                    <div
                      key={scene.id}
                      id={`lesson-${scene.id}`}
                      ref={(element) => {
                        sceneElementsRef.current[scene.id] = element
                      }}
                      data-scene-index={index}
                      className={proseLike ? 'dp-prose-flow' : 'dp-focus-surface'}
                    >
                      {startsSourceSection && (
                        <h2 className="dp-lesson-section-title">
                          <InlineMarkdownContent markdown={sourceHeading} />
                        </h2>
                      )}
                      <SceneView
                        scene={scene}
                        showTitle={!proseLike || scene.source_content_id == null}
                        onAssessmentAttempt={handleAssessmentAttempt}
                      />
                    </div>
                  )
                })}
              </article>

              <LessonNotes lessonId={lesson.id} />

              {/* Navigation */}
              <div className="dp-lesson-nav mt-10 flex items-center justify-between gap-3">
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
                <div className="dp-lesson-complete mt-6">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>Урок завершён</strong>
                    <p>Навыки обновлены, материал добавлен в расписание повторений.</p>
                  </div>
                </div>
              )}

              <div
                className="mt-6 flex flex-wrap items-center gap-3 pt-4"
                style={{ borderTop: '1px solid var(--dp-border-subtle)' }}
              >
                <button
                  onClick={() => goToLesson(lesson.previous_lesson_id)}
                  disabled={!lesson.previous_lesson_id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-30 dp-hover-interactive"
                  style={{ color: 'var(--dp-text-secondary)' }}
                >
                  ← Предыдущий урок
                </button>
                <button
                  onClick={() => goToLesson(lesson.next_lesson_id)}
                  disabled={!lesson.next_lesson_id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-30 dp-hover-interactive"
                  style={{ color: 'var(--dp-text-secondary)' }}
                >
                  Следующий урок →
                </button>
                <div className="flex-1" />
                {reviewCount != null && reviewCount > 0 && (
                  <Link
                    to="/review"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ color: 'var(--dp-accent)', background: 'var(--dp-accent-subtle)' }}
                  >
                    Повторить тему ({reviewCount}) →
                  </Link>
                )}
              </div>
            </div>

            {/* Outline rail — a quiet right-hand TOC */}
            <aside className="hidden lg:sticky lg:top-6 lg:block lg:w-[230px]">
              <div className="dp-outline-rail py-3 pl-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="dp-section-title">Содержание</span>
                  {progress && (
                    <span className="text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                      {visitedSceneCount}/{scenes.length}
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
          </div>
        )}
      </motion.div>
    </div>
  )
}

function SaveIndicator({ saveState }: { saveState: string }) {
  if (saveState === 'saving') {
    return (
      <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
        Сохранение…
      </span>
    )
  }
  if (saveState === 'saved') {
    return (
      <span className="text-xs" style={{ color: 'var(--dp-success)' }}>
        ✓ сохранено
      </span>
    )
  }
  if (saveState === 'error') {
    return (
      <span className="text-xs" style={{ color: 'var(--dp-error)' }}>
        Ошибка сохранения
      </span>
    )
  }
  return null
}
