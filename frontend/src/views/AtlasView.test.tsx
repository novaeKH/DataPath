import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AtlasView } from './AtlasView'
import type { AtlasData } from '../lib/api'

function makeAtlas(): AtlasData {
  return {
    nodes: [
      {
        id: 'course.classic-ml',
        label: 'Классический ML',
        type: 'course',
        area: 'ml',
        publish: true,
        status: 'developing',
        mastery_percent: 42,
        course_id: null,
        module_id: null,
        x: 0,
        y: 0,
      },
      {
        id: 'module.classic-ml.trees',
        label: 'Деревья и ансамбли',
        type: 'module',
        area: 'ml',
        publish: true,
        status: 'developing',
        course_id: 'course.classic-ml',
        module_id: null,
        x: 0,
        y: 0,
      },
      {
        id: 'lesson.classic-ml.tree',
        label: 'Decision Tree',
        type: 'lesson',
        area: 'ml',
        publish: true,
        status: 'needs_attention',
        mastery_percent: 72,
        review_due: true,
        course_id: 'course.classic-ml',
        module_id: 'module.classic-ml.trees',
        x: 0,
        y: 0,
      },
      {
        id: 'lesson.classic-ml.forest',
        label: 'Random Forest',
        type: 'lesson',
        area: 'ml',
        publish: true,
        status: 'strong',
        mastery_percent: 86,
        course_id: 'course.classic-ml',
        module_id: 'module.classic-ml.trees',
        x: 0,
        y: 0,
      },
      {
        id: 'concept.ml.impurity',
        label: 'Impurity',
        type: 'concept',
        area: 'ml',
        publish: false,
        status: 'not_started',
        course_id: null,
        module_id: null,
        x: 0,
        y: 0,
      },
    ],
    edges: [
      {
        source: 'lesson.classic-ml.tree',
        target: 'concept.ml.impurity',
        relation: 'explains',
        kind: 'wiki',
      },
    ],
    prerequisites: [
      {
        source: 'concept.ml.impurity',
        target: 'lesson.classic-ml.tree',
        relation: 'prerequisite',
        kind: 'explicit',
      },
    ],
    areas: ['ml'],
    node_types: ['course', 'module', 'lesson', 'concept'],
    routes: {
      'course.classic-ml': {
        modules: ['module.classic-ml.trees'],
        lessons: {
          'module.classic-ml.trees': ['lesson.classic-ml.tree', 'lesson.classic-ml.forest'],
        },
        cases: [],
      },
    },
    layout: { width: 4000, height: 1000, mode: 'deterministic' },
  }
}

function stub(atlas: AtlasData = makeAtlas()) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(atlas), { status: 200 })),
    ) as unknown as typeof fetch,
  )
}

function renderAtlas() {
  return render(
    <MemoryRouter initialEntries={['/atlas']}>
      <Routes>
        <Route path="/atlas" element={<AtlasView />} />
        <Route path="/focus/:lessonId" element={<div>FOCUS VIEW</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('AtlasView knowledge map', () => {
  it('shows a stable loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)) as unknown as typeof fetch)
    renderAtlas()
    expect(screen.getByLabelText(/Загрузка карты знаний/)).toBeInTheDocument()
  })

  it('shows a recoverable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    renderAtlas()
    expect(await screen.findByText(/Не удалось загрузить карту знаний/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Попробовать снова/ })).toBeInTheDocument()
  })

  it('shows an empty state without routes', async () => {
    const atlas = makeAtlas()
    atlas.routes = {}
    stub(atlas)
    renderAtlas()
    expect(await screen.findByText(/Карта пока пуста/)).toBeInTheDocument()
  })

  it('renders course blocks with real mastery and due counts', async () => {
    stub()
    renderAtlas()
    expect(await screen.findByRole('heading', { name: 'Карта знаний' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Классический ML/ })).toHaveTextContent('79% mastery')
    expect(screen.getByRole('button', { name: /Классический ML/ })).toHaveTextContent('1 повторить')
  })

  it('filters overview to courses needing attention', async () => {
    const user = userEvent.setup()
    stub()
    renderAtlas()
    const filter = await screen.findByRole('button', { name: /Нужно внимание/ })
    await user.click(filter)
    expect(filter).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Классический ML/ })).toBeInTheDocument()
  })

  it('drills down from course to module and lessons', async () => {
    const user = userEvent.setup()
    stub()
    renderAtlas()
    await user.click(await screen.findByRole('button', { name: /Классический ML/ }))
    expect(screen.getByRole('heading', { name: 'Деревья и ансамбли' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decision Tree/ })).toHaveTextContent(
      'Повторение просрочено',
    )
    expect(screen.getByRole('button', { name: /Random Forest/ })).toHaveTextContent('Освоено')
  })

  it('opens an inline lesson panel with mastery and relations', async () => {
    const user = userEvent.setup()
    stub()
    renderAtlas()
    await user.click(await screen.findByRole('button', { name: /Классический ML/ }))
    await user.click(screen.getByRole('button', { name: /Decision Tree/ }))
    expect(screen.getByText(/Mastery: 72%/)).toBeInTheDocument()
    expect(screen.getAllByText(/Impurity/)).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Открыть урок/ })).toHaveAttribute(
      'href',
      '/focus/lesson.classic-ml.tree',
    )
  })

  it('closes lesson details and returns to all directions', async () => {
    const user = userEvent.setup()
    stub()
    renderAtlas()
    await user.click(await screen.findByRole('button', { name: /Классический ML/ }))
    await user.click(screen.getByRole('button', { name: /Decision Tree/ }))
    await user.click(screen.getByRole('button', { name: /Закрыть детали/ }))
    expect(screen.queryByText(/Mastery: 72%/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Все направления/ }))
    expect(screen.getByRole('heading', { name: 'Карта знаний' })).toBeInTheDocument()
  })
})
