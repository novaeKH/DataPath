import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchAtlas, type AtlasData, type AtlasNode } from '../lib/api'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: AtlasData }

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Не начато',
  exploring: 'Знакомство',
  developing: 'В процессе',
  strong: 'Освоено',
  needs_attention: 'Нужно повторить',
}

const STATUS_COLOR: Record<string, string> = {
  not_started: 'var(--dp-text-muted)',
  exploring: '#60a5fa',
  developing: 'var(--dp-warning)',
  strong: 'var(--dp-success)',
  needs_attention: 'var(--dp-error)',
}

const RELEASE_COURSE_ORDER = [
  'course.python-ds',
  'course.math-ds',
  'course.data-analysis',
  'course.data-tools',
  'course.classic-ml',
  'course.deep-learning',
  'course.nlp',
  'course.llm-rag',
  'course.mlops',
]

export function AtlasView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [attentionOnly, setAttentionOnly] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'ready', data: await fetchAtlas(signal) })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({ kind: 'error', message: 'Не удалось загрузить карту знаний.' })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (state.kind === 'loading') return <LoadingBlock label="Загрузка карты знаний…" rows={6} />
  if (state.kind === 'error')
    return <ErrorState message={state.message} onRetry={() => void load()} />
  if (!Object.keys(state.data.routes).length) {
    return (
      <EmptyState
        title="Карта пока пуста"
        description="После синхронизации здесь появятся учебные маршруты."
      />
    )
  }

  return (
    <KnowledgeMap
      data={state.data}
      selectedCourse={selectedCourse}
      selectedLesson={selectedLesson}
      attentionOnly={attentionOnly}
      onCourse={(id) => {
        setSelectedCourse(id)
        setSelectedLesson(null)
      }}
      onLesson={setSelectedLesson}
      onBack={() => {
        setSelectedCourse(null)
        setSelectedLesson(null)
      }}
      onAttention={setAttentionOnly}
    />
  )
}

function KnowledgeMap({
  data,
  selectedCourse,
  selectedLesson,
  attentionOnly,
  onCourse,
  onLesson,
  onBack,
  onAttention,
}: {
  data: AtlasData
  selectedCourse: string | null
  selectedLesson: string | null
  attentionOnly: boolean
  onCourse: (id: string) => void
  onLesson: (id: string | null) => void
  onBack: () => void
  onAttention: (value: boolean) => void
}) {
  const byId = useMemo(() => new Map(data.nodes.map((node) => [node.id, node])), [data.nodes])
  const dueCount = data.nodes.filter(
    (node) => node.review_due || node.status === 'needs_attention',
  ).length

  if (selectedCourse) {
    return (
      <CourseMap
        data={data}
        courseId={selectedCourse}
        byId={byId}
        selectedLesson={selectedLesson}
        onLesson={onLesson}
        onBack={onBack}
      />
    )
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PageHeader
        eyebrow="Прогресс"
        title="Карта знаний"
        subtitle="Понятная карта маршрутов вместо графа: откройте направление, модуль и конкретный урок."
        actions={
          <button
            className="rounded-xl px-3 py-2 text-xs font-medium"
            style={{
              background: attentionOnly
                ? 'var(--dp-error-subtle)'
                : 'var(--dp-surface-interactive)',
              color: attentionOnly ? 'var(--dp-error)' : 'var(--dp-text-secondary)',
            }}
            onClick={() => onAttention(!attentionOnly)}
            aria-pressed={attentionOnly}
          >
            Нужно внимание · {dueCount}
          </button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(data.routes)
          .filter(([courseId]) => RELEASE_COURSE_ORDER.includes(courseId))
          .sort(
            ([left], [right]) =>
              RELEASE_COURSE_ORDER.indexOf(left) - RELEASE_COURSE_ORDER.indexOf(right),
          )
          .map(([courseId, route]) => {
            const lessons = Object.values(route.lessons).flat()
            const lessonNodes = lessons
              .map((id) => byId.get(id))
              .filter((node): node is AtlasNode => Boolean(node))
            const visible = attentionOnly
              ? lessonNodes.some((node) => node.review_due || node.status === 'needs_attention')
              : true
            if (!visible) return null
            const mastered = lessonNodes.filter((node) => node.status === 'strong').length
            const active = lessonNodes.filter((node) =>
              ['exploring', 'developing'].includes(node.status),
            ).length
            const due = lessonNodes.filter(
              (node) => node.review_due || node.status === 'needs_attention',
            ).length
            const mastery = lessonNodes.length
              ? Math.round(
                  lessonNodes.reduce((sum, node) => sum + (node.mastery_percent ?? 0), 0) /
                    lessonNodes.length,
                )
              : 0
            const course = byId.get(courseId)
            return (
              <button
                key={courseId}
                onClick={() => onCourse(courseId)}
                className="group rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'var(--dp-surface)',
                  border: '1px solid var(--dp-border-subtle)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: 'var(--dp-text-muted)' }}
                    >
                      {route.modules.length} модулей · {lessons.length} уроков
                    </p>
                    <h2
                      className="mt-2 text-base font-semibold"
                      style={{ color: 'var(--dp-text-primary)' }}
                    >
                      {course?.label ?? courseId}
                    </h2>
                  </div>
                  <span
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--dp-text-muted)' }}
                  >
                    →
                  </span>
                </div>
                <div
                  className="mt-5 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--dp-border-subtle)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${mastery}%`, background: 'var(--dp-accent)' }}
                  />
                </div>
                <div
                  className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]"
                  style={{ color: 'var(--dp-text-muted)' }}
                >
                  <span>{mastery}% mastery</span>
                  <span>{mastered} освоено</span>
                  <span>{active} в работе</span>
                  {due > 0 && <span style={{ color: 'var(--dp-error)' }}>{due} повторить</span>}
                </div>
              </button>
            )
          })}
      </div>
    </motion.div>
  )
}

function CourseMap({
  data,
  courseId,
  byId,
  selectedLesson,
  onLesson,
  onBack,
}: {
  data: AtlasData
  courseId: string
  byId: Map<string, AtlasNode>
  selectedLesson: string | null
  onLesson: (id: string | null) => void
  onBack: () => void
}) {
  const route = data.routes[courseId]
  const course = byId.get(courseId)
  const selected = selectedLesson ? byId.get(selectedLesson) : null
  const relations = selected
    ? [...data.prerequisites, ...data.edges].filter(
        (edge) => edge.source === selected.id || edge.target === selected.id,
      )
    : []

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <button
        onClick={onBack}
        className="mb-4 text-xs font-medium hover:underline"
        style={{ color: 'var(--dp-accent)' }}
      >
        ← Все направления
      </button>
      <PageHeader
        eyebrow="Карта направления"
        title={course?.label ?? courseId}
        subtitle={`${route.modules.length} модулей · ${Object.values(route.lessons).flat().length} уроков`}
        actions={
          <Link
            to={`/focus?course=${encodeURIComponent(courseId)}`}
            className="rounded-xl px-4 py-2 text-xs font-semibold"
            style={{ background: 'var(--dp-accent)', color: '#07120f' }}
          >
            Открыть курс →
          </Link>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {route.modules.map((moduleId, moduleIndex) => {
            const module = byId.get(moduleId)
            const lessons = route.lessons[moduleId] ?? []
            return (
              <section
                key={moduleId}
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--dp-surface)',
                  border: '1px solid var(--dp-border-subtle)',
                }}
              >
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="font-mono text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                    {String(moduleIndex + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
                    {module?.label ?? moduleId}
                  </h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lessons.map((lessonId) => {
                    const lesson = byId.get(lessonId)
                    if (!lesson) return null
                    const active = lessonId === selectedLesson
                    return (
                      <button
                        key={lessonId}
                        onClick={() => onLesson(active ? null : lessonId)}
                        className="rounded-xl p-3 text-left transition-colors"
                        style={{
                          background: active
                            ? 'var(--dp-accent-subtle)'
                            : 'var(--dp-surface-interactive)',
                          border: `1px solid ${active ? 'var(--dp-accent-border)' : 'transparent'}`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <StatusDot node={lesson} />
                          <span
                            className="min-w-0 flex-1 text-xs font-medium leading-snug"
                            style={{ color: 'var(--dp-text-primary)' }}
                          >
                            {lesson.label}
                          </span>
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: 'var(--dp-text-muted)' }}
                          >
                            {lesson.mastery_percent ?? 0}%
                          </span>
                        </div>
                        <p
                          className="mt-2 pl-4 text-[10px]"
                          style={{ color: STATUS_COLOR[lesson.status] ?? 'var(--dp-text-muted)' }}
                        >
                          {lesson.review_due
                            ? 'Повторение просрочено'
                            : (STATUS_LABEL[lesson.status] ?? lesson.status)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'var(--dp-surface-elevated)',
                border: '1px solid var(--dp-border-subtle)',
              }}
            >
              <button
                onClick={() => onLesson(null)}
                aria-label="Закрыть детали"
                className="float-right text-sm"
                style={{ color: 'var(--dp-text-muted)' }}
              >
                ×
              </button>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: STATUS_COLOR[selected.status] ?? 'var(--dp-text-muted)' }}
              >
                {STATUS_LABEL[selected.status] ?? selected.status}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-snug">{selected.label}</h3>
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--dp-border-subtle)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${selected.mastery_percent ?? 0}%`,
                    background: 'var(--dp-accent)',
                  }}
                />
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
                Mastery: {selected.mastery_percent ?? 0}%
                {selected.review_due ? ' · повторение просрочено' : ''}
              </p>
              <h4
                className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--dp-text-muted)' }}
              >
                Связи и prerequisites
              </h4>
              <div className="mt-2 space-y-2">
                {relations.length ? (
                  relations.slice(0, 8).map((edge, index) => {
                    const otherId = edge.source === selected.id ? edge.target : edge.source
                    return (
                      <div
                        key={`${edge.source}-${edge.target}-${index}`}
                        className="text-xs leading-snug"
                        style={{ color: 'var(--dp-text-secondary)' }}
                      >
                        <span style={{ color: 'var(--dp-text-muted)' }}>{edge.relation}: </span>
                        {byId.get(otherId)?.label ?? otherId}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                    Явных связей пока нет.
                  </p>
                )}
              </div>
              <Link
                to={`/focus/${encodeURIComponent(selected.id)}`}
                className="mt-5 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold"
                style={{ background: 'var(--dp-accent)', color: '#07120f' }}
              >
                Открыть урок →
              </Link>
            </div>
          ) : (
            <div
              className="rounded-2xl border border-dashed p-5 text-xs leading-relaxed"
              style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}
            >
              Выберите урок, чтобы увидеть mastery, статус повторения и связи с другими темами.
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  )
}

function StatusDot({ node }: { node: AtlasNode }) {
  return (
    <span
      className="mt-1 h-2 w-2 shrink-0 rounded-full"
      style={{
        background: node.review_due
          ? 'var(--dp-error)'
          : (STATUS_COLOR[node.status] ?? 'var(--dp-text-muted)'),
      }}
      aria-hidden="true"
    />
  )
}
