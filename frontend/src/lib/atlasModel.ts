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
 * Детерминированная под-раскладка: курс → колонки модулей → уроки,
 * связанные материалы (concepts, кейсы без module_id и пр.) — справа,
 * по областям (порядок по id). Никакой случайности.
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

  const COL_W = 260
  const ROW_H = 92
  const MOD_OFFSET_X = 200
  const LESSON_OFFSET_Y = 120
  const KNOWLEDGE_COL_W = 300
  const positions = new Map<string, [number, number]>()
  let maxY = 0

  for (const courseId of Object.keys(route)) {
    positions.set(courseId, [0, 0])
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

  // Связанные материалы (concepts, кейсы без module_id и т.п.) — справа, по областям.
  const extras = nodes.filter((n) => !positions.has(n.id))
  if (extras.length > 0) {
    const byArea = new Map<string, AtlasNode[]>()
    for (const node of extras) {
      const key = node.area ?? 'other'
      const list = byArea.get(key)
      if (list) list.push(node)
      else byArea.set(key, [node])
    }
    const moduleColumns = Math.max(0, ...Object.values(route).map((r) => r.modules.length))
    const baseX = MOD_OFFSET_X + (moduleColumns + 1) * COL_W + 40
    const areaKeys = [...byArea.keys()].sort()
    for (let col = 0; col < areaKeys.length; col++) {
      const x = baseX + col * KNOWLEDGE_COL_W
      // Сначала опубликованные (кейсы), затем источники; внутри — по id.
      const list = [...byArea.get(areaKeys[col])!].sort(
        (a, b) => Number(b.publish) - Number(a.publish) || a.id.localeCompare(b.id),
      )
      for (let row = 0; row < list.length; row++) {
        positions.set(list[row].id, [x, 20 + row * ROW_H])
        maxY = Math.max(maxY, 20 + row * ROW_H)
      }
    }
  }

  const maxX = Math.max(0, ...[...positions.values()].map(([x]) => x)) + 140
  const edges = data.edges.filter((e) => inScope.has(e.source) && inScope.has(e.target))
  const prerequisites = data.prerequisites.filter(
    (e) => inScope.has(e.source) && inScope.has(e.target),
  )

  return {
    ...data,
    nodes,
    edges,
    prerequisites,
    node_types: [...new Set(nodes.map((n) => n.type))].sort(),
    areas: [...new Set(nodes.map((n) => n.area).filter((a): a is string => Boolean(a)))].sort(),
    layout: {
      width: Math.max(maxX, 480),
      height: Math.max(maxY + 120, 360),
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
