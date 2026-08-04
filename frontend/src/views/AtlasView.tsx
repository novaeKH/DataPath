import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  buildRouteView,
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

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: AtlasData }

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

const EDGE_COLORS: Record<string, string> = {
  link: '#94a3b8',
  applied_in: '#22d3ee',
  prerequisite: '#f97316',
}

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#94a3b8'
}

function edgeColor(relation: string): string {
  return EDGE_COLORS[relation] ?? '#94a3b8'
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
    const minScale = mode === 'route' ? 0.45 : 0.12
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
      className="relative h-[calc(100vh-260px)] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
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
            return (
              <line
                key={`e-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edgeColor(edge.relation)}
                strokeWidth={edge.relation === 'link' ? 1 : 1.6}
                strokeDasharray={edge.relation === 'applied_in' ? '5 4' : undefined}
                markerEnd={
                  edge.relation === 'prerequisite' ? 'url(#arrow-prereq)' : 'url(#arrow-link)'
                }
                opacity={0.55}
              />
            )
          })}
          {/* Prerequisites поверх обычных рёбер */}
          {data.prerequisites.map((edge, i) => {
            const source = nodesById.get(edge.source)
            const target = nodesById.get(edge.target)
            if (!source || !target) return null
            return (
              <line
                key={`p-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={EDGE_COLORS.prerequisite}
                strokeWidth={2}
                markerEnd="url(#arrow-prereq)"
              />
            )
          })}

          {/* Узлы: counter-scale сохраняет минимальный видимый размер */}
          {data.nodes.map((node) => {
            const color = typeColor(node.type)
            const selected = node.id === selectedId
            return (
              <g
                key={node.id}
                transform={`translate(${node.x} ${node.y}) scale(${scale})`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(node)
                }}
                className="cursor-pointer"
                role="button"
                aria-label={node.label}
              >
                <circle
                  r={node.publish ? 17 : 13}
                  fill={color}
                  fillOpacity={selected ? 0.95 : 0.85}
                  stroke={selected ? '#ffffff' : color}
                  strokeWidth={selected ? 3 : 1.5}
                />
                {node.publish && (
                  <circle
                    r={21}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    opacity={0.7}
                  />
                )}
                {labelsVisible && (
                  <text
                    y={node.publish ? 34 : 30}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-200"
                    style={{
                      fontSize: node.publish ? 13 : 11,
                      fontWeight: node.publish ? 600 : 500,
                    }}
                  >
                    {node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Сброс вида */}
      <button
        onClick={fitView}
        aria-label="Сбросить вид"
        className="absolute right-3 top-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        ⟳ Сбросить вид
      </button>

      {/* Легенда */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/85 p-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mb-1 font-semibold text-slate-700 dark:text-slate-300">Типы узлов</div>
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

/**
 * Экран Atlas: загрузка данных с backend, режимы «Маршрут»/«Весь атлас»,
 * состояния loading/empty/error, информационная панель выбранного узла.
 */
export function AtlasView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [mode, setMode] = useState<AtlasMode>('route')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [item, setItem] = useState<ContentItem | null>(null)
  const [itemState, setItemState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

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
  const displayed = useMemo(
    () => (data && mode === 'route' ? buildRouteView(data) : data),
    [data, mode],
  )

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
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Atlas знаний</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Маршрут курса и связанная теория. Колесо — zoom, перетаскивание фона — pan.
            </p>
          </div>
          {displayed && (
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {displayed.nodes.length} узлов
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {displayed.edges.length + displayed.prerequisites.length} связей
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {displayed.areas.length} областей
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            {state.kind === 'loading' && (
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-500 dark:border-slate-800">
                Загрузка Atlas…
              </div>
            )}
            {state.kind === 'error' && (
              <div className="flex h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-800/60 dark:bg-rose-950/30">
                <div className="font-semibold text-rose-700 dark:text-rose-300">
                  Atlas недоступен
                </div>
                <p className="max-w-md text-sm text-rose-600 dark:text-rose-200/80">
                  {state.message}
                </p>
                <button
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-500/25 dark:text-rose-200"
                >
                  Попробовать снова
                </button>
              </div>
            )}
            {state.kind === 'ready' && displayed && displayed.nodes.length === 0 && (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 text-center dark:border-slate-700">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {state.data.nodes.length === 0
                    ? 'Atlas пуст'
                    : mode === 'route'
                      ? 'Нет курсов для маршрута'
                      : 'Atlas пуст'}
                </div>
                <p className="max-w-md text-sm text-slate-500">
                  {state.data.nodes.length === 0 ? (
                    'В каталоге нет материалов. Синхронизируйте vault:'
                  ) : (
                    <>
                      В каталоге нет курсов с маршрутами. Переключитесь в «Весь атлас» или
                      синхронизируйте vault:
                    </>
                  )}
                  <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">
                    PYTHONPATH= uv run python -m app.cli.content sync
                  </code>
                </p>
              </div>
            )}
            {state.kind === 'ready' && displayed && displayed.nodes.length > 0 && (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-3">
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
                  </div>
                  {mode === 'route' && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      MVP-маршрут и непосредственно связанные материалы
                    </span>
                  )}
                </div>
                <AtlasGraph
                  data={displayed}
                  mode={mode}
                  selectedId={selectedId}
                  onSelect={selectNode}
                />
              </>
            )}
          </div>

          <aside className="lg:h-[calc(100vh-260px)] lg:min-h-[420px]">
            {selectedId === null ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Выберите узел, чтобы увидеть информацию о материале
              </div>
            ) : (
              <NodePanel
                node={displayed?.nodes.find((n) => n.id === selectedId) ?? null}
                item={item}
                itemState={itemState}
                onClose={() => selectNode(null)}
              />
            )}
          </aside>
        </div>
      </motion.div>
    </div>
  )
}

function NodePanel({
  node,
  item,
  itemState,
  onClose,
}: {
  node: AtlasNode | null
  item: ContentItem | null
  itemState: 'idle' | 'loading' | 'ready' | 'error'
  onClose: () => void
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
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
        <code className="mt-1 block break-all font-mono text-[11px] text-slate-500">{node.id}</code>
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
