import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  buildRouteView,
  buildWeakView,
  clamp,
  computeFit,
  LABEL_MIN_SCALE,
  nodeScale,
  type AtlasMode,
  type ViewTransform,
} from '../lib/atlasModel'
import {
  fetchAtlas,
  fetchContentItem,
  type AtlasData,
  type AtlasNode,
  type ContentItem,
} from '../lib/api'
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '../components/ui/PageState'
import { formatCount } from '../lib/format'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: AtlasData }

type DisplayMode = 'graph' | 'list'

// Цвета узлов по типам (умеренная палитра, работает в обеих темах).
const TYPE_COLORS: Record<string, string> = {
  course: '#10b981',
  module: '#06b6d4',
  lesson: '#3b82f6',
  practice: '#8b5cf6',
  concept: '#f59e0b',
  interview: '#ec4899',
  project: '#64748b',
}

// Визуальные состояния узла (прогресс пользователя).
const STATE_META: Record<string, { label: string; color: string; ring: string }> = {
  not_started: { label: 'Не начато', color: '#94a3b8', ring: '#94a3b8' },
  exploring: { label: 'Изучается', color: '#f59e0b', ring: '#f59e0b' },
  developing: { label: 'Развивается', color: '#06b6d4', ring: '#06b6d4' },
  strong: { label: 'Уверенно', color: '#10b981', ring: '#10b981' },
  needs_attention: { label: 'Требует внимания', color: '#ef4444', ring: '#ef4444' },
}

const EDGE_COLORS: Record<string, string> = {
  link: '#94a3b8',
  applied_in: '#22d3ee',
  prerequisite: '#f97316',
}

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#94a3b8'
}

function stateColor(state: string): string {
  return STATE_META[state]?.color ?? '#94a3b8'
}

function stateRing(state: string): string {
  return STATE_META[state]?.ring ?? '#94a3b8'
}

function edgeColor(relation: string): string {
  return EDGE_COLORS[relation] ?? '#94a3b8'
}

function truncateLabel(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

/** Обёртка SMIL-анимации: не запускается при prefers-reduced-motion. */
function PulsingAnimate({ values, dur }: { values: string; dur: string }) {
  const reduced = useReducedMotion()
  if (reduced) return null
  return <animate attributeName="opacity" values={values} dur={dur} repeatCount="indefinite" />
}

/**
 * Интерактивный SVG-Atlas.
 * Координаты узлов приходят из backend (детерминированная раскладка);
 * режим «Маршрут» использует детерминированную под-раскладку frontend
 * (чисто визуальную). Здесь только zoom/pan и выделение — без бизнес-логики.
 */
export function AtlasGraph({
  data,
  mode,
  selectedId,
  onSelect,
}: {
  data: AtlasData
  mode: AtlasMode
  selectedId: string | null
  onSelect: (node: AtlasNode | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(
    null,
  )

  const [view, setView] = useState<ViewTransform>({ x: 20, y: 40, k: 0.75 })

  const nodesById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes])

  // Fit-to-content при первом открытии и при смене режима/данных.
  const fitView = useCallback(() => {
    const container = containerRef.current
    if (!container || data.nodes.length === 0) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    if (cw === 0 || ch === 0) return
    const minScale = mode === 'route' ? 0.5 : 0.12
    setView(computeFit(data.nodes, cw, ch, 70, minScale, 1.8))
  }, [data.nodes, mode])

  useEffect(() => {
    fitView()
  }, [fitView])

  // Zoom колесом (passive:false, чтобы работал preventDefault).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setView((v) => {
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
        const k = clamp(v.k * factor, 0.08, 4)
        const cx = container.clientWidth / 2
        const cy = container.clientHeight / 2
        const x = cx - ((cx - v.x) / v.k) * k
        const y = cy - ((cy - v.y) / v.k) * k
        return { x, y, k }
      })
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = useCallback((factor: number) => {
    const container = containerRef.current
    if (!container) return
    setView((v) => {
      const k = clamp(v.k * factor, 0.08, 4)
      const cx = container.clientWidth / 2
      const cy = container.clientHeight / 2
      const x = cx - ((cx - v.x) / v.k) * k
      const y = cy - ((cy - v.y) / v.k) * k
      return { x, y, k }
    })
  }, [])

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.target !== svgRef.current) return // перетаскивание только за фон
    dragRef.current = { startX: event.clientX, startY: event.clientY, viewX: view.x, viewY: view.y }
    ;(event.target as Element).setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    setView((v) => ({
      ...v,
      x: dragRef.current!.viewX + (event.clientX - dragRef.current!.startX),
      y: dragRef.current!.viewY + (event.clientY - dragRef.current!.startY),
    }))
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  const labelsVisible = view.k >= LABEL_MIN_SCALE
  const scale = nodeScale(view.k)

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl dp-surface"
    >
      <svg
        ref={svgRef}
        className="h-full w-full touch-none select-none"
        viewBox={`0 0 ${data.layout.width} ${data.layout.height}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label="Атлас знаний"
      >
        <defs>
          <marker
            id="arrow-prereq"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLORS.prerequisite} />
          </marker>
          <marker
            id="arrow-link"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLORS.link} />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* Рёбра */}
          {data.edges.map((edge, i) => {
            const source = nodesById.get(edge.source)
            const target = nodesById.get(edge.target)
            if (!source || !target) return null
            const active = selectedId === edge.source || selectedId === edge.target
            return (
              <line
                key={`e-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edgeColor(edge.relation)}
                strokeWidth={active ? 2.4 : edge.relation === 'link' ? 1 : 1.6}
                strokeDasharray={edge.relation === 'applied_in' ? '5 4' : undefined}
                markerEnd={
                  edge.relation === 'prerequisite' ? 'url(#arrow-prereq)' : 'url(#arrow-link)'
                }
                opacity={active ? 0.95 : 0.5}
              />
            )
          })}
          {/* Prerequisites поверх обычных рёбер */}
          {data.prerequisites.map((edge, i) => {
            const source = nodesById.get(edge.source)
            const target = nodesById.get(edge.target)
            if (!source || !target) return null
            const active = selectedId === edge.source || selectedId === edge.target
            return (
              <line
                key={`p-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={EDGE_COLORS.prerequisite}
                strokeWidth={active ? 3 : 2}
                markerEnd="url(#arrow-prereq)"
                opacity={active ? 1 : 0.75}
              />
            )
          })}

          {/* Узлы: counter-scale сохраняет минимальный видимый размер */}
          {data.nodes.map((node) => {
            const color = typeColor(node.type)
            const selected = node.id === selectedId
            const status = node.status ?? 'not_started'
            const stateFill = stateColor(status)
            const published = node.publish
            return (
              <g
                key={node.id}
                transform={`translate(${node.x} ${node.y}) scale(${scale})`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(node)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(node)
                  }
                }}
                className="cursor-pointer outline-none"
                role="button"
                tabIndex={0}
                aria-label={node.label}
              >
                <title>{`${node.label} — ${STATE_META[status]?.label ?? status}`}</title>
                {/* Гало выделенного узла */}
                {selected && (
                  <circle
                    r={30}
                    fill="none"
                    stroke={stateFill}
                    strokeWidth={2}
                    strokeOpacity={0.55}
                  />
                )}
                {/* Кольцо состояния для опубликованных узлов */}
                {published && status !== 'not_started' && (
                  <circle
                    r={25}
                    fill="none"
                    stroke={stateRing(status)}
                    strokeWidth={3}
                    strokeDasharray={status === 'needs_attention' ? '4 3' : undefined}
                    opacity={0.9}
                  >
                    {status === 'needs_attention' && (
                      <PulsingAnimate values="0.4;1;0.4" dur="2.2s" />
                    )}
                  </circle>
                )}
                {published && (
                  <circle
                    r={21}
                    fill="none"
                    stroke={stateFill}
                    strokeWidth={1.4}
                    strokeDasharray="3 3"
                    opacity={0.75}
                  />
                )}
                <circle
                  r={published ? 17 : 13}
                  fill={color}
                  fillOpacity={selected ? 0.95 : published ? 0.85 : 0.6}
                  stroke={status === 'needs_attention' ? '#ef4444' : selected ? '#ffffff' : color}
                  strokeWidth={status === 'needs_attention' ? 2.5 : selected ? 3.5 : 1.5}
                />
                {/* Индикатор просроченного повторения (Фаза 5, реальные данные) */}
                {node.review_due && (
                  <g>
                    <title>{`${node.label} — ${node.review_due_count ?? 0} просроченных повторений`}</title>
                    <circle
                      cx={published ? 17 : 13}
                      cy={published ? -17 : -13}
                      r={5.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.2}
                    >
                      <PulsingAnimate values="0.5;1;0.5" dur="1.8s" />
                    </circle>
                  </g>
                )}
                {labelsVisible && (
                  <text
                    y={published ? 34 : 30}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-200"
                    style={{
                      fontSize: published ? 13 : 11,
                      fontWeight: published ? 600 : 500,
                    }}
                  >
                    {truncateLabel(node.label)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Zoom-контролы */}
      <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5">
        <button
          onClick={() => zoomBy(1.25)}
          aria-label="Приблизить"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-semibold shadow-sm transition-colors dp-hover-interactive dp-surface-elevated"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1 / 1.25)}
          aria-label="Отдалить"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-semibold shadow-sm transition-colors dp-hover-interactive dp-surface-elevated"
        >
          −
        </button>
        <button
          onClick={fitView}
          aria-label="Сбросить вид"
          className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⟳
        </button>
      </div>

      {/* Легенда */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/85 p-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mb-1 font-semibold text-slate-700 dark:text-slate-300">Состояния</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-600 dark:text-slate-400">
          {(['not_started', 'exploring', 'developing', 'strong', 'needs_attention'] as const).map(
            (state) => (
              <span key={state} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: stateColor(state) }}
                />
                {STATE_META[state].label}
              </span>
            ),
          )}
        </div>
        <div className="mb-1 mt-2 font-semibold text-slate-700 dark:text-slate-300">Типы узлов</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-600 dark:text-slate-400">
          {data.node_types.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: typeColor(type) }}
              />
              {type}
            </span>
          ))}
        </div>
        <div className="mb-1 mt-2 font-semibold text-slate-700 dark:text-slate-300">Связи</div>
        <div className="flex flex-col gap-0.5 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-slate-400" /> link
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: EDGE_COLORS.applied_in }}
            />{' '}
            applied_in
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: EDGE_COLORS.prerequisite }}
            />{' '}
            prerequisite
          </span>
        </div>
      </div>
    </div>
  )
}

/** Компактное представление маршрута списком (для узких экранов и клавиатуры). */
function RouteListView({
  data,
  mode,
  onOpenLesson,
  onSelectNode,
}: {
  data: AtlasData
  mode: AtlasMode
  onOpenLesson: (lessonId: string) => void
  onSelectNode: (node: AtlasNode) => void
}) {
  const byId = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes])

  const dot = (id: string) => {
    const status = byId.get(id)?.status ?? 'not_started'
    return (
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: stateColor(status) }}
        title={STATE_META[status]?.label ?? status}
      />
    )
  }

  // «Весь атлас» и «Слабые темы» — плоский список по типам (для route не нужен).
  const grouped = useMemo(() => {
    if (mode === 'route') return []
    const groups = new Map<string, AtlasNode[]>()
    for (const node of data.nodes) {
      const list = groups.get(node.type) ?? []
      list.push(node)
      groups.set(node.type, list)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [data.nodes, mode])

  if (mode === 'route') {
    const courseId = Object.keys(data.routes)[0] ?? null
    const course = courseId ? data.routes[courseId] : null
    const routeIds = new Set<string>()
    if (course) {
      routeIds.add(courseId)
      course.modules.forEach((id) => routeIds.add(id))
      Object.values(course.lessons)
        .flat()
        .forEach((id) => routeIds.add(id))
      course.cases.forEach((id) => routeIds.add(id))
    }
    const extras = data.nodes.filter((n) => !routeIds.has(n.id))

    return (
      <div className="flex flex-col gap-4">
        {course && (
          <div className="flex flex-col gap-3">
            {course.modules.map((moduleId) => {
              const moduleNode = byId.get(moduleId)
              const lessons = course.lessons[moduleId] ?? []
              return (
                <section
                  key={moduleId}
                  className="rounded-xl p-4 dp-surface"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {dot(moduleId)}
                    {moduleNode?.label ?? moduleId}
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    {lessons.map((lessonId) => {
                      const node = byId.get(lessonId)
                      return (
                        <button
                          key={lessonId}
                          onClick={() => onOpenLesson(lessonId)}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        >
                          {dot(lessonId)}
                          <span className="min-w-0 flex-1 truncate">{node?.label ?? lessonId}</span>
                          <span aria-hidden className="text-slate-400">
                            →
                          </span>
                        </button>
                      )
                    })}
                    {lessons.length === 0 && (
                      <div className="px-2 py-1 text-xs text-slate-400">Уроки ещё не добавлены</div>
                    )}
                  </div>
                </section>
              )
            })}
            {course.cases.length > 0 && (
              <section className="rounded-xl p-4 dp-surface">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Кейсы
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {course.cases.map((caseId) => (
                    <button
                      key={caseId}
                      onClick={() => {
                        const node = byId.get(caseId)
                        if (node) onSelectNode(node)
                      }}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      {dot(caseId)}
                      <span className="min-w-0 flex-1 truncate">
                        {byId.get(caseId)?.label ?? caseId}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        {extras.length > 0 && (
          <section className="rounded-xl p-4 dp-surface">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Связанные материалы
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {extras.map((node) => (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                >
                  {dot(node.id)}
                  <span className="min-w-0 flex-1 truncate">{node.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(([type, nodes]) => (
        <section
          key={type}
          className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: typeColor(type) }}
            />
            {type} · {nodes.length}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  if (node.type === 'lesson') onOpenLesson(node.id)
                  else onSelectNode(node)
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                {dot(node.id)}
                <span className="min-w-0 flex-1 truncate">{node.label}</span>
                {node.type === 'lesson' && <span className="text-slate-400">→</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return mobile
}

/**
 * Экран Atlas: загрузка данных с backend, режимы «Маршрут»/«Весь атлас»,
 * состояния loading/empty/error, информационная панель выбранного узла.
 * На узких экранах по умолчанию показывается маршрут списком.
 */
export function AtlasView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [mode, setMode] = useState<AtlasMode>('route')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('graph')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [item, setItem] = useState<ContentItem | null>(null)
  const [itemState, setItemState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // На узких экранах карта непрактична — по умолчанию список маршрута.
  useEffect(() => {
    if (isMobile) setDisplayMode('list')
  }, [isMobile])

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const data = await fetchAtlas(signal)
      setState({ kind: 'ready', data })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({
        kind: 'error',
        message:
          'Не удалось загрузить Atlas. Проверьте, что backend запущен и каталог синхронизирован ' +
          '(PYTHONPATH= uv run python -m app.cli.content sync).',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const data = state.kind === 'ready' ? state.data : null
  const displayed = useMemo(() => {
    if (!data) return null
    if (mode === 'route') return buildRouteView(data)
    if (mode === 'weak') return buildWeakView(data)
    return data
  }, [data, mode])

  const selectNode = useCallback((node: AtlasNode | null) => {
    setSelectedId(node?.id ?? null)
    if (!node) {
      setItem(null)
      setItemState('idle')
      return
    }
    setItemState('loading')
    const controller = new AbortController()
    fetchContentItem(node.id, controller.signal)
      .then((fetched) => {
        setItem(fetched)
        setItemState('ready')
      })
      .catch(() => setItemState('error'))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Atlas знаний"
        subtitle="Маршрут курса и связанная теория. Колесо — zoom, перетаскивание фона — pan."
        actions={
          displayed ? (
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formatCount(displayed.nodes.length, 'узел', 'узла', 'узлов')}
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formatCount(
                  displayed.edges.length + displayed.prerequisites.length,
                  'связь',
                  'связи',
                  'связей',
                )}
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formatCount(displayed.areas.length, 'область', 'области', 'областей')}
              </span>
            </div>
          ) : null
        }
      />

      {state.kind === 'ready' && displayed && (
        <div className="mb-3 mt-4 flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Режим Atlas"
            className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              onClick={() => setMode('route')}
              aria-pressed={mode === 'route'}
              className={`rounded-md px-3.5 py-1.5 font-medium transition ${
                mode === 'route'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Маршрут
            </button>
            <button
              onClick={() => setMode('all')}
              aria-pressed={mode === 'all'}
              className={`rounded-md px-3.5 py-1.5 font-medium transition ${
                mode === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Весь атлас
            </button>
            <button
              onClick={() => setMode('weak')}
              aria-pressed={mode === 'weak'}
              className={`rounded-md px-3.5 py-1.5 font-medium transition ${
                mode === 'weak'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Слабые темы
            </button>
          </div>
          <div
            role="group"
            aria-label="Представление Atlas"
            className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              onClick={() => setDisplayMode('graph')}
              aria-pressed={displayMode === 'graph'}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                displayMode === 'graph'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Карта
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              aria-pressed={displayMode === 'list'}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                displayMode === 'list'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Список
            </button>
          </div>
          {mode === 'route' && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              MVP-маршрут и непосредственно связанные материалы
            </span>
          )}
          {mode === 'weak' && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Узлы со статусом «требует внимания» — только при достаточном evidence
            </span>
          )}
        </div>
      )}

      {state.kind === 'loading' && <LoadingBlock label="Загрузка Atlas…" rows={5} />}
      {state.kind === 'error' && (
        <ErrorState title="Atlas недоступен" message={state.message} onRetry={() => void load()} />
      )}

      {state.kind === 'ready' && displayed && displayed.nodes.length === 0 && (
        <EmptyState
          title={
            state.data.nodes.length === 0
              ? 'Atlas пуст'
              : mode === 'route'
                ? 'Нет курсов для маршрута'
                : mode === 'weak'
                  ? 'Слабых тем пока нет'
                  : 'Atlas пуст'
          }
          description={
            state.data.nodes.length === 0 ? (
              <>
                В каталоге нет материалов. Синхронизируйте vault:
                <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">
                  PYTHONPATH= uv run python -m app.cli.content sync
                </code>
              </>
            ) : mode === 'weak' ? (
              'Недостаточно evidence: слабые темы появляются после 2+ измерений с низкой оценкой или повторяющихся ошибок. Пройдите уроки и лаборатории.'
            ) : (
              <>
                В каталоге нет курсов с маршрутами. Переключитесь в «Весь атлас» или синхронизируйте
                vault:
                <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">
                  PYTHONPATH= uv run python -m app.cli.content sync
                </code>
              </>
            )
          }
        />
      )}

      {state.kind === 'ready' && displayed && displayed.nodes.length > 0 && (
        <div className="relative h-[calc(100dvh-260px)] min-h-[420px]">
          {displayMode === 'graph' ? (
            <AtlasGraph
              data={displayed}
              mode={mode}
              selectedId={selectedId}
              onSelect={selectNode}
            />
          ) : (
            <div className="h-full overflow-y-auto pr-1">
              <RouteListView
                data={displayed}
                mode={mode}
                onOpenLesson={(lessonId) => navigate(`/focus/${lessonId}`)}
                onSelectNode={selectNode}
              />
            </div>
          )}

          {/* Подсказка, когда ничего не выбрано */}
          {selectedId === null && displayMode === 'graph' && (
            <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-400">
              Выберите узел, чтобы увидеть информацию о материале
            </div>
          )}

          {/* Панель узла: оверлей поверх карты (на мобильном — нижний лист) */}
          {selectedId !== null && (
            <div className="absolute inset-x-3 bottom-3 z-20 max-h-[55%] overflow-y-auto rounded-xl shadow-lg md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-[340px]">
              <NodePanel
                node={displayed.nodes.find((n) => n.id === selectedId) ?? null}
                item={item}
                itemState={itemState}
                onOpenLesson={(lessonId) => navigate(`/focus/${lessonId}`)}
                onClose={() => selectNode(null)}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function NodePanel({
  node,
  item,
  itemState,
  onOpenLesson,
  onClose,
}: {
  node: AtlasNode | null
  item: ContentItem | null
  itemState: 'idle' | 'loading' | 'ready' | 'error'
  onOpenLesson: (lessonId: string) => void
  onClose: () => void
}) {
  // Для concept-узла: уроки, которые используют эту заметку (applied_in).
  const relatedLessons = useMemo(() => {
    if (!item || node?.type !== 'concept') return []
    return (item.links.incoming ?? [])
      .filter((link) => link.relation === 'applied_in' && link.source_id)
      .map((link) => link.source_id as string)
  }, [item, node?.type])

  const isLesson = node?.type === 'lesson'

  return (
    <div className="flex max-h-full flex-col rounded-xl border border-slate-200 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: typeColor(node?.type ?? '') }}
          >
            {node?.type ?? '—'}
          </span>
          {node?.area && <span className="ml-1.5 text-[11px] text-slate-500">{node.area}</span>}
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть панель"
          className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {item?.title ?? node?.label ?? ''}
      </h3>
      {node && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <code className="block break-all font-mono text-[11px] text-slate-500">{node.id}</code>
          {node.status && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: `${stateColor(node.status)}22`,
                color: stateColor(node.status),
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: stateColor(node.status) }}
              />
              {STATE_META[node.status]?.label ?? node.status}
            </span>
          )}
        </div>
      )}

      {isLesson && (
        <button
          onClick={() => onOpenLesson(node.id)}
          className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Открыть урок →
        </button>
      )}

      {node?.type === 'concept' && relatedLessons.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-500">Уроки, где используется</div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {relatedLessons.map((lessonId) => (
              <button
                key={lessonId}
                onClick={() => onOpenLesson(lessonId)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                {lessonId} →
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-3 text-sm">
        {itemState === 'loading' && <div className="text-slate-500">Загрузка данных…</div>}
        {itemState === 'error' && (
          <div className="text-rose-600 dark:text-rose-300">Не удалось загрузить детали</div>
        )}
        {itemState === 'ready' && item && (
          <>
            {item.content_path && <InfoRow label="Источник" value={item.content_path} />}
            {item.practice_kind && <InfoRow label="Формат" value={item.practice_kind} />}
            {item.difficulty && <InfoRow label="Сложность" value={item.difficulty} />}
            {item.estimated_minutes != null && (
              <InfoRow label="Длительность" value={`${item.estimated_minutes} мин`} />
            )}
            {item.skill_ids && item.skill_ids.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500">Навыки</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.skill_ids.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.links && (
              <div>
                <div className="text-xs font-semibold text-slate-500">Связи</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  исходящих: {item.links.outgoing.length} · входящих: {item.links.incoming.length}
                </div>
              </div>
            )}
            {item.issues && item.issues.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                {item.issues.length} предупреждений валидации
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
        {node?.publish ? 'Опубликован' : 'Источник'} · статус: {node?.status ?? '—'}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-0.5 break-all text-slate-700 dark:text-slate-300">{value}</div>
    </div>
  )
}
