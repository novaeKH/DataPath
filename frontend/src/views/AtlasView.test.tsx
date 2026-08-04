import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AtlasView } from './AtlasView'
import { buildRouteView, computeFit } from '../lib/atlasModel'
import type { AtlasData, ContentItem } from '../lib/api'

/**
 * Atlas: loading/error/empty/ready состояния, режимы «Маршрут»/«Весь атлас»,
 * fit-to-content, рендер узлов/рёбер, информационная панель узла.
 */

const itemPayload: ContentItem = {
  id: 'lesson.classic-ml.trees.tree',
  path: '05 Курсы/Классический ML/Уроки/07 Decision Tree.md',
  type: 'lesson',
  title: 'Decision Tree без магии',
  slug: '07-decision-tree',
  area: 'ml',
  status: 'active',
  language: 'ru',
  publish: true,
  rag: 'exclude',
  rag_collection: null,
  course_id: 'course.classic-ml',
  module_id: 'module.classic-ml.trees',
  module_order: 3,
  lesson_order: 1,
  content_path: '10 Знания/ML/01 Classical ML/Decision Trees.md',
  practice_kind: null,
  skill_ids: ['ml.tree_ensembles'],
  difficulty: 'core',
  estimated_minutes: 45,
  estimated_hours: null,
  accent: null,
  icon: null,
  aliases: null,
  tags: null,
  prerequisites: null,
  validation_status: 'ok',
  issues: [],
  links: { outgoing: [], incoming: [] },
}

function makeAtlas(): AtlasData {
  return {
    nodes: [
      {
        id: 'course.classic-ml',
        label: 'Классический ML',
        type: 'course',
        area: 'ml',
        publish: true,
        status: 'not_started',
        course_id: null,
        module_id: null,
        x: 60,
        y: 60,
      },
      {
        id: 'lesson.classic-ml.trees.tree',
        label: 'Decision Tree',
        type: 'lesson',
        area: 'ml',
        publish: true,
        status: 'not_started',
        course_id: 'course.classic-ml',
        module_id: 'module.classic-ml.trees',
        x: 280,
        y: 240,
      },
      {
        id: 'concept.ml.decision-trees',
        label: 'Decision Trees',
        type: 'concept',
        area: 'ml',
        publish: false,
        status: 'not_started',
        course_id: null,
        module_id: null,
        x: 900,
        y: 100,
      },
      {
        id: 'concept.ml.orphan',
        label: 'Orphan Concept',
        type: 'concept',
        area: 'ml',
        publish: false,
        status: 'not_started',
        course_id: null,
        module_id: null,
        x: 5000,
        y: 500,
      },
    ],
    edges: [
      {
        source: 'lesson.classic-ml.trees.tree',
        target: 'concept.ml.decision-trees',
        relation: 'link',
        kind: 'wiki',
      },
    ],
    prerequisites: [
      {
        source: 'course.classic-ml',
        target: 'lesson.classic-ml.trees.tree',
        relation: 'prerequisite',
        kind: 'implied',
      },
    ],
    areas: ['ml'],
    node_types: ['concept', 'course', 'lesson'],
    routes: {
      'course.classic-ml': {
        modules: ['module.classic-ml.trees'],
        lessons: { 'module.classic-ml.trees': ['lesson.classic-ml.trees.tree'] },
        cases: [],
      },
    },
    layout: { width: 5200, height: 600, mode: 'deterministic' },
  }
}

function stubFetch(atlas: AtlasData) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/atlas')) {
      return Promise.resolve(new Response(JSON.stringify(atlas), { status: 200 }))
    }
    if (url.includes('/api/content/items/')) {
      return Promise.resolve(new Response(JSON.stringify(itemPayload), { status: 200 }))
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('buildRouteView (режим «Маршрут»)', () => {
  it('оставляет только маршрут и непосредственных соседей', () => {
    const view = buildRouteView(makeAtlas())
    const ids = view.nodes.map((n) => n.id).sort()
    // orphan не связан с маршрутом → исключён; concept связан рёбрами с lesson → остаётся
    expect(ids).toEqual([
      'concept.ml.decision-trees',
      'course.classic-ml',
      'lesson.classic-ml.trees.tree',
    ])
  })

  it('детерминирован: одинаковые данные дают одинаковые позиции', () => {
    const atlas = makeAtlas()
    const first = buildRouteView(atlas)
    const second = buildRouteView(atlas)
    const pos1 = new Map(first.nodes.map((n) => [n.id, `${n.x},${n.y}`]))
    const pos2 = new Map(second.nodes.map((n) => [n.id, `${n.x},${n.y}`]))
    expect(pos1).toEqual(pos2)
  })

  it('не расширяет граф дальше 1 hop', () => {
    const atlas = makeAtlas()
    atlas.nodes.push({
      id: 'concept.ml.distant',
      label: 'Distant',
      type: 'concept',
      area: 'ml',
      publish: false,
      status: 'not_started',
      course_id: null,
      module_id: null,
      x: 2000,
      y: 300,
    })
    atlas.edges.push({
      source: 'concept.ml.decision-trees',
      target: 'concept.ml.distant',
      relation: 'link',
      kind: 'wiki',
    })
    const view = buildRouteView(atlas)
    expect(view.nodes.some((n) => n.id === 'concept.ml.distant')).toBe(false)
  })
})

describe('computeFit (fit-to-content)', () => {
  it('центрирует граф и вписывает его в контейнер', () => {
    const atlas = makeAtlas()
    const view = buildRouteView(atlas)
    const fit = computeFit(view.nodes, 1000, 700, 70, 0.45, 1.8)
    // масштаб в разумных пределах и граф центрирован
    expect(fit.k).toBeGreaterThanOrEqual(0.45)
    expect(fit.k).toBeLessThanOrEqual(1.8)
    expect(Number.isFinite(fit.x)).toBe(true)
    expect(Number.isFinite(fit.y)).toBe(true)
  })

  it('пустой набор не ломается', () => {
    expect(computeFit([], 1000, 700)).toEqual({ x: 0, y: 0, k: 1 })
  })
})

describe('AtlasView', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1000 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 700 })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows loading state first', () => {
    let resolveAtlas: (value: Response) => void
    const fetchMock = vi.fn(
      () => new Promise<Response>((resolve) => (resolveAtlas = resolve)),
    ) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    render(<AtlasView />)
    expect(screen.getByText(/Загрузка Atlas/)).toBeInTheDocument()
    resolveAtlas!(new Response(JSON.stringify(makeAtlas()), { status: 200 }))
  })

  it('shows error state when backend fails', async () => {
    const fetchMock = vi.fn(() =>
      Promise.reject(new Error('network down')),
    ) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    render(<AtlasView />)
    expect(await screen.findByText(/Atlas недоступен/)).toBeInTheDocument()
  })

  it('shows empty state when atlas has no nodes', async () => {
    const atlas = makeAtlas()
    atlas.nodes = []
    stubFetch(atlas)
    render(<AtlasView />)
    expect(await screen.findByText(/Atlas пуст/)).toBeInTheDocument()
  })

  it('default mode is route: disconnected node is not rendered', async () => {
    stubFetch(makeAtlas())
    render(<AtlasView />)
    await screen.findByRole('img', { name: /Атлас знаний/ })
    expect(screen.getByRole('button', { name: 'Decision Tree' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Orphan Concept' })).not.toBeInTheDocument()
    // режим «Маршрут» выбран по умолчанию
    expect(screen.getByRole('button', { name: 'Маршрут' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to full atlas mode', async () => {
    const user = userEvent.setup()
    stubFetch(makeAtlas())
    render(<AtlasView />)
    await screen.findByRole('img', { name: /Атлас знаний/ })
    await user.click(screen.getByRole('button', { name: 'Весь атлас' }))
    expect(screen.getByRole('button', { name: 'Весь атлас' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(await screen.findByRole('button', { name: 'Orphan Concept' })).toBeInTheDocument()
    // статистика обновилась: 4 узла
    expect(screen.getByText(/4 узлов/)).toBeInTheDocument()
  })

  it('renders nodes and edges from backend data in route mode', async () => {
    stubFetch(makeAtlas())
    render(<AtlasView />)
    const graph = await screen.findByRole('img', { name: /Атлас знаний/ })
    expect(graph).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decision Tree' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Классический ML' })).toBeInTheDocument()
    // подписи узлов отображаются в режиме маршрута (fit → k >= 0.45)
    expect(screen.getByText('Decision Trees')).toBeInTheDocument()
    expect(await screen.findByText(/3 узлов/)).toBeInTheDocument()
  })

  it('fit-to-content applies a readable scale in route mode', async () => {
    stubFetch(makeAtlas())
    render(<AtlasView />)
    await screen.findByRole('img', { name: /Атлас знаний/ })
    const g = document.querySelector('svg g')
    const transform = g?.getAttribute('transform') ?? ''
    const match = transform.match(/scale\(([\d.]+)\)/)
    const scale = match ? Number(match[1]) : 0
    expect(scale).toBeGreaterThanOrEqual(0.45)
  })

  it('reset view button re-fits the graph', async () => {
    const user = userEvent.setup()
    stubFetch(makeAtlas())
    render(<AtlasView />)
    await screen.findByRole('img', { name: /Атлас знаний/ })
    const readScale = () => {
      const g = document.querySelector('svg g')
      const m = g?.getAttribute('transform')?.match(/scale\(([\d.]+)\)/)
      return m ? Number(m[1]) : 0
    }
    const before = readScale()
    await user.click(screen.getByRole('button', { name: /Сбросить вид/ }))
    await waitFor(() => {
      expect(readScale()).toBeGreaterThanOrEqual(0.45)
    })
    expect(readScale()).toBeGreaterThan(0)
    expect(before).toBeGreaterThan(0)
  })

  it('opens node info panel on click', async () => {
    const user = userEvent.setup()
    stubFetch(makeAtlas())
    render(<AtlasView />)
    const node = await screen.findByRole('button', { name: 'Decision Tree' })
    await user.click(node)
    expect(await screen.findByText(/Decision Tree без магии/)).toBeInTheDocument()
    expect(screen.getByText(/ml.tree_ensembles/)).toBeInTheDocument()
    expect(screen.getByText(/45 мин/)).toBeInTheDocument()
  })

  it('closes node panel', async () => {
    const user = userEvent.setup()
    stubFetch(makeAtlas())
    render(<AtlasView />)
    const node = await screen.findByRole('button', { name: 'Decision Tree' })
    await user.click(node)
    await screen.findByText(/Decision Tree без магии/)
    await user.click(screen.getByRole('button', { name: /Закрыть панель/ }))
    await waitFor(() => {
      expect(screen.queryByText(/Decision Tree без магии/)).not.toBeInTheDocument()
    })
  })
})
