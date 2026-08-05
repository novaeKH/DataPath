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

/** Выбор урока (список модулей и уроков курса). */
function CoursePicker({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; course: CourseDetail }
  >({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const course = await fetchCourseDetail(DEFAULT_COURSE_ID, signal)
      setState({ kind: 'ready', course })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState({
        kind: 'error',
        message:
          'Не удалось загрузить курс. Проверьте, что backend запущен и каталог синхронизирован.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') {
    return <Centered>Загрузка курса…</Centered>
  }
  if (state.kind === 'error') {
    return (
      <Centered>
        <div className="font-semibold text-rose-600 dark:text-rose-300">Курс недоступен</div>
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

  const { course } = state
  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {course.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {course.difficulty} · {course.estimated_hours ?? '—'} часов ·{' '}
              {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)} уроков
            </p>
          </div>
          <Link
            to="/atlas"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Atlas
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {course.modules.map((module) => (
            <section
              key={module.id}
              className="rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {module.title}
                </h2>
                {module.estimated_minutes != null && (
                  <span className="text-xs text-slate-500">{module.estimated_minutes} мин</span>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {module.lessons.length === 0 && (
                  <div className="text-sm text-slate-400">Уроки ещё не добавлены</div>
                )}
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => onNavigate(`/focus/${lesson.id}`)}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-center font-mono text-xs text-slate-400">
                        {String(lesson.lesson_order ?? '').padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-medium text-slate-800 group-hover:text-slate-900 dark:text-slate-200">
                          {lesson.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                          {lesson.estimated_minutes != null && (
                            <span>{lesson.estimated_minutes} мин</span>
                          )}
                          {lesson.difficulty && <span>· {lesson.difficulty}</span>}
                          {lesson.laboratory_ids.length > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              · ⚡ лаборатория
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {course.cases.length > 0 && (
          <section className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Кейсы курса
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.cases.map((caseItem) => (
                <span
                  key={caseItem.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {caseItem.title} · {caseItem.practice_kind}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Кейсы станут доступны в Studio в следующих фазах.
            </p>
          </section>
        )}
      </motion.div>
    </div>
  )
}

/** Урок: сцены, outline, навигация между сценами и уроками. */
function LessonView({
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

        // Число активных повторений урока (для ссылки «Повторить тему»).
        fetchReviewSummary(lessonId, signal)
          .then((summary) => setReviewCount(summary.active_items))
          .catch(() => setReviewCount(null))

        // Восстановление позиции: последняя незавершённая сцена.
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

  // Сохранение текущей сцены при навигации.
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
      // После завершения урока материал попадает в расписание повторений.
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
    return <Centered>Загрузка урока…</Centered>
  }
  if (state.kind === 'not-found') {
    return (
      <Centered>
        <div className="font-semibold text-slate-700 dark:text-slate-300">Урок не найден</div>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Урок {lessonId} не существует или не опубликован в каталоге.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onNavigate('/focus')}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
          >
            К списку уроков
          </button>
          <button
            onClick={() => onNavigate('/atlas')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            В Atlas
          </button>
        </div>
      </Centered>
    )
  }
  if (state.kind === 'error') {
    return (
      <Centered>
        <div className="font-semibold text-rose-600 dark:text-rose-300">Ошибка загрузки</div>
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
        {/* Шапка урока */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link to="/atlas" className="hover:text-slate-700 dark:hover:text-slate-300">
                Atlas
              </Link>
              <span>/</span>
              <Link to="/focus" className="hover:text-slate-700 dark:hover:text-slate-300">
                {lesson.course?.title ?? 'Курс'}
              </Link>
              {lesson.module && (
                <>
                  <span>/</span>
                  <span>{lesson.module.title}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {lesson.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {lesson.estimated_minutes != null && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  ~{lesson.estimated_minutes} мин
                </span>
              )}
              {lesson.difficulty && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {lesson.difficulty}
                </span>
              )}
              {lesson.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/atlas"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Atlas
          </Link>
        </div>

        {/* Контент урока */}
        {scenes.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
            В уроке пока нет сцен.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Содержание урока
                  </div>
                  {progress && (
                    <span className="text-[11px] text-slate-400">
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
                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Навигация по курсу
                    </div>
                    <SaveIndicator saveState={saveState} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToLesson(lesson.previous_lesson_id)}
                      disabled={!lesson.previous_lesson_id}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:enabled:hover:bg-slate-800"
                    >
                      ← Пред. урок
                    </button>
                    <button
                      onClick={() => goToLesson(lesson.next_lesson_id)}
                      disabled={!lesson.next_lesson_id}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:enabled:hover:bg-slate-800"
                    >
                      След. урок →
                    </button>
                  </div>
                  <button
                    onClick={() => void handleCompleteLesson()}
                    disabled={completing || progress?.completed_at != null}
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition enabled:hover:bg-emerald-500 disabled:opacity-40"
                  >
                    {progress?.completed_at
                      ? '✓ Урок завершён'
                      : completing
                        ? 'Завершаем…'
                        : 'Завершить урок'}
                  </button>
                  {completedFlash && (
                    <div className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      ✓ Урок завершён — навыки обновлены, материал добавлен в расписание повторений.
                    </div>
                  )}
                  {reviewCount != null && reviewCount > 0 && (
                    <Link
                      to="/review"
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-300/70 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800/60 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
                    >
                      Повторить тему ({reviewCount}) →
                    </Link>
                  )}
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Сцена {sceneIndex + 1} из {scenes.length}
                </span>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((sceneIndex + 1) / scenes.length) * 100}%` }}
                  />
                </div>
              </div>

              {currentScene && (
                <motion.div
                  key={currentScene.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <SceneView scene={currentScene} />
                </motion.div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={handlePrev}
                  disabled={sceneIndex === 0}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition enabled:hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:enabled:hover:bg-slate-800"
                >
                  ← Назад
                </button>
                {sceneIndex === scenes.length - 1 ? (
                  <button
                    onClick={() => goToLesson(lesson.next_lesson_id)}
                    disabled={!lesson.next_lesson_id}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                  >
                    Следующий урок →
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Далее →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">{children}</div>
  )
}

function SaveIndicator({ saveState }: { saveState: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (saveState === 'saving') {
    return <span className="text-[11px] text-slate-400">сохраняем…</span>
  }
  if (saveState === 'saved') {
    return (
      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        ✓ сохранено
      </span>
    )
  }
  if (saveState === 'error') {
    return <span className="text-[11px] font-medium text-rose-500">ошибка сохранения</span>
  }
  return null
}
