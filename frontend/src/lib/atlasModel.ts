/**
 * Чистые функции представления Atlas (режим «Маршрут», fit-to-content).
 *
 * Это визуальная логика рендеринга: маршруты и связи приходят готовыми
 * с backend (GET /api/atlas), здесь только отбор и раскладка для отображения.
 * Всё детерминировано — одинаковые данные всегда дают одинаковые позиции.
 */

import type { AtlasData, AtlasNode } from './api'

export type AtlasMode = 'route' | 'all' | 'weak'

export interface ViewTransform {
  x: number
  y: number
  k: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Режим «Маршрут курса»: узлы маршрутов курсов (course/module/lesson/case)
 * + непосредственно связанные с ними материалы (1 hop по рёбрам).
 *
 * Детерминированная под-раскладка: курс сверху → колонки модулей → уроки,
 * связанные материалы (concepts, кейсы без module_id) — компактной сеткой
 * ниже маршрута. Никакой случайности: одинаковые данные → одинаковые позиции.
 */
export function buildRouteView(data: AtlasData): AtlasData {
  const route = data.routes
  const routeIds = new Set<string>()
  for (const courseId of Object.keys(route)) {
    routeIds.add(courseId)
    const r = route[courseId]
    for (const moduleId of r.modules) routeIds.add(moduleId)
    for (const lessonIds of Object.values(r.lessons)) {
      for (const id of lessonIds) routeIds.add(id)
    }
    for (const caseId of r.cases) routeIds.add(caseId)
  }

  // 1 hop: только непосредственные соседи маршрута.
  const inScope = new Set(routeIds)
  for (const edge of [...data.edges, ...data.prerequisites]) {
    if (routeIds.has(edge.source)) inScope.add(edge.target)
    if (routeIds.has(edge.target)) inScope.add(edge.source)
  }

  const nodes = data.nodes.filter((n) => inScope.has(n.id))
  const byId = new Map(nodes.map((n) => [n.id, n]))

  // Просторные шаги сетки: подписи не перекрываются.
  const COL_W = 250
  const ROW_H = 104
  const MOD_OFFSET_X = 170
  const LESSON_OFFSET_Y = 110
  const COURSE_Y = -190
  const EXTRAS_COLS = 6
  const EXTRAS_COL_W = 300
  const EXTRAS_TOP_OFFSET = 150
  const positions = new Map<string, [number, number]>()
  let maxY = 0

  for (const courseId of Object.keys(route)) {
    positions.set(courseId, [0, COURSE_Y])
    const r = route[courseId]
    for (let col = 0; col < r.modules.length; col++) {
      const moduleId = r.modules[col]
      const mx = MOD_OFFSET_X + col * COL_W
      positions.set(moduleId, [mx, 0])
      const lessonIds = r.lessons[moduleId] ?? []
      // Кейсы с явным module_id встают в свою колонку модуля.
      const caseIds = r.cases.filter((cid) => {
        const caseNode = byId.get(cid)
        return caseNode ? caseNode.module_id === moduleId : false
      })
      let row = 0
      for (const id of [...lessonIds, ...caseIds]) {
        positions.set(id, [mx, LESSON_OFFSET_Y + row * ROW_H])
        maxY = Math.max(maxY, LESSON_OFFSET_Y + row * ROW_H)
        row++
      }
    }
  }

  // Связанные материалы (concepts, кейсы без module_id и т.п.) — компактной
  // сеткой под маршрутом (не раздвигают ширину графа).
  const extras = nodes.filter((n) => !positions.has(n.id))
  if (extras.length > 0) {
    const baseX = 20
    const baseY = maxY + EXTRAS_TOP_OFFSET
    const sorted = [...extras].sort(
      (a, b) => Number(b.publish) - Number(a.publish) || a.id.localeCompare(b.id),
    )
    for (let i = 0; i < sorted.length; i++) {
      const x = baseX + (i % EXTRAS_COLS) * EXTRAS_COL_W
      const y = baseY + Math.floor(i / EXTRAS_COLS) * ROW_H
      positions.set(sorted[i].id, [x, y])
      maxY = Math.max(maxY, y)
    }
  }

  const maxX =
    Math.max(
      0,
      ...[...positions.values()].map(([x]) => x),
      MOD_OFFSET_X +
        (Math.max(0, ...Object.values(route).map((r) => r.modules.length)) - 1) * COL_W +
        COL_W,
    ) + 140
  const edges = data.edges.filter((e) => inScope.has(e.source) && inScope.has(e.target))
  const prerequisites = data.prerequisites.filter(
    (e) => inScope.has(e.source) && inScope.has(e.target),
  )

  // Применяем под-раскладку к узлам (ранее позиции вычислялись, но не назначались).
  const positionedNodes = nodes.map((node) => {
    const pos = positions.get(node.id)
    return pos ? { ...node, x: pos[0], y: pos[1] } : node
  })

  return {
    ...data,
    nodes: positionedNodes,
    edges,
    prerequisites,
    node_types: [...new Set(nodes.map((n) => n.type))].sort(),
    areas: [...new Set(nodes.map((n) => n.area).filter((a): a is string => Boolean(a)))].sort(),
    layout: {
      width: Math.max(maxX, 480),
      height: Math.max(maxY + 160, 420),
      mode: 'deterministic',
    },
  }
}

/**
 * Fit-to-content: вписывает фактические границы узлов (с учётом радиуса
 * и подписи) в доступную область контейнера, центрирует граф.
 */
export function computeFit(
  nodes: AtlasNode[],
  width: number,
  height: number,
  padding = 70,
  minScale = 0.12,
  maxScale = 1.8,
): ViewTransform {
  if (nodes.length === 0) return { x: 0, y: 0, k: 1 }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    const r = node.publish ? 24 : 20
    minX = Math.min(minX, node.x - r)
    maxX = Math.max(maxX, node.x + r)
    minY = Math.min(minY, node.y - r)
    maxY = Math.max(maxY, node.y + 44) // подпись под узлом
  }
  const w = Math.max(maxX - minX, 1)
  const h = Math.max(maxY - minY, 1)
  const k = clamp(
    Math.min((width - padding * 2) / w, (height - padding * 2) / h),
    minScale,
    maxScale,
  )
  const x = (width - w * k) / 2 - minX * k
  const y = (height - h * k) / 2 - minY * k
  return { x, y, k }
}

// Минимальный видимый размер узлов: при дальнем zoom узлы не сжимаются в точки
// (counter-scale ограничен сверху, чтобы не было наложений).
const MIN_VISUAL_CAP = 3

export function nodeScale(k: number): number {
  return k < 1 ? Math.min(1 / k, MIN_VISUAL_CAP) : 1
}

// Ниже этого масштаба подписи скрываются (режим «Весь атлас» в обзоре).
export const LABEL_MIN_SCALE = 0.3

/**
 * Режим «Слабые темы»: узлы со статусом needs_attention + их соседи
 * (1 hop), чтобы было видно контекст. Если слабых узлов нет — пустой
 * список (фронтенд показывает честное сообщение).
 */
export function buildWeakView(data: AtlasData): AtlasData {
  const weakIds = new Set(
    data.nodes.filter((node) => node.status === 'needs_attention').map((node) => node.id),
  )
  if (weakIds.size === 0) {
    return { ...data, nodes: [], edges: [], prerequisites: [] }
  }
  const inScope = new Set(weakIds)
  for (const edge of [...data.edges, ...data.prerequisites]) {
    if (weakIds.has(edge.source)) inScope.add(edge.target)
    if (weakIds.has(edge.target)) inScope.add(edge.source)
  }
  return {
    ...data,
    nodes: data.nodes.filter((node) => inScope.has(node.id)),
    edges: data.edges.filter((edge) => inScope.has(edge.source) && inScope.has(edge.target)),
    prerequisites: data.prerequisites.filter(
      (edge) => inScope.has(edge.source) && inScope.has(edge.target),
    ),
  }
}
