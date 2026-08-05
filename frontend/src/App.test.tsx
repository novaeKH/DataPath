import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { AtlasData, CourseDetail, CourseSummary, SystemStatus } from './lib/api'

/**
 * Роутинг: маршруты /, /today, /atlas, /focus, /studio, /system.
 * API замокан, чтобы тесты не ходили в сеть.
 */

const systemStatus: SystemStatus = {
  status: 'ok',
  version: '0.1.0',
  environment: 'test',
  database: { available: true },
  vault: { exists: true, markdown_files: 3 },
  ollama: 'not_configured',
  chromadb: 'not_configured',
}

const atlas: AtlasData = {
  nodes: [],
  edges: [],
  prerequisites: [],
  areas: ['ml'],
  node_types: ['course'],
  routes: {},
  layout: { width: 800, height: 600, mode: 'deterministic' },
}

const courses: CourseSummary[] = []

const courseDetail: CourseDetail = {
  id: 'course.classic-ml',
  title: 'Классический ML',
  slug: 'klassicheskij-ml',
  area: 'ml',
  difficulty: 'beginner-intermediate',
  estimated_hours: 10,
  accent: 'emerald',
  icon: 'route',
  modules: [
    {
      id: 'module.classic-ml.trees',
      title: 'Деревья и ансамбли',
      order: 3,
      estimated_minutes: null,
      lessons: [
        {
          id: 'lesson.classic-ml.trees.tree',
          title: 'Decision Tree',
          lesson_order: 1,
          estimated_minutes: 45,
          difficulty: 'core',
          skills: ['ml.tree_ensembles'],
          laboratory_ids: ['decision-tree-split-lab'],
        },
      ],
    },
  ],
  cases: [],
  first_lesson_id: 'lesson.classic-ml.trees.tree',
  last_lesson_id: 'lesson.classic-ml.trees.tree',
}

const todayPayload = {
  continue_lesson: null,
  next_lesson: { id: 'lesson.classic-ml.trees.tree', title: 'Decision Tree', skills: [] },
  weak_skills: [],
  recent_activity: [],
  suggested_case: null,
  progress_summary: {
    lessons_started: 0,
    lessons_completed: 0,
    labs_completed: 0,
    cases_completed: 0,
    skill_distribution: {},
  },
  review_summary: {
    due_count: 0,
    overdue_count: 0,
    completed_today: 0,
    next_due_at: null,
    active_items: 0,
    stages: {},
    recommendation: 'Пройдите уроки — повторения появятся здесь.',
  },
  due_reviews: 0,
  overdue_reviews: 0,
  next_review_at: null,
  review_action: null,
}

function mockFetch() {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/system/status')) {
      return Promise.resolve(new Response(JSON.stringify(systemStatus), { status: 200 }))
    }
    if (url.includes('/api/atlas')) {
      return Promise.resolve(new Response(JSON.stringify(atlas), { status: 200 }))
    }
    if (url.includes('/api/today')) {
      return Promise.resolve(new Response(JSON.stringify(todayPayload), { status: 200 }))
    }
    if (url.includes('/api/reviews/summary')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            due_count: 0,
            overdue_count: 0,
            completed_today: 0,
            next_due_at: null,
            active_items: 0,
            stages: {},
            recommendation: 'Пройдите уроки — повторения появятся здесь.',
          }),
          { status: 200 },
        ),
      )
    }
    if (url.includes('/api/reviews/queue')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [],
            returned: 0,
            due_count: 0,
            overdue_count: 0,
            next_due_at: null,
            limit: 10,
          }),
          { status: 200 },
        ),
      )
    }
    if (url.includes('/api/cases')) {
      return Promise.resolve(new Response(JSON.stringify({ cases: [] }), { status: 200 }))
    }
    if (url.includes('/api/progress/lessons')) {
      return Promise.resolve(new Response('{}', { status: 404 }))
    }
    if (url.includes('/api/content/courses/course.classic-ml')) {
      return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
    }
    if (url.includes('/api/content/courses')) {
      return Promise.resolve(new Response(JSON.stringify({ courses }), { status: 200 }))
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
}

describe('App routing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
  }

  it('redirects / to /today', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: /Сегодня/i })).toBeInTheDocument()
  })

  it('renders Today at /today', async () => {
    renderAt('/today')
    expect(await screen.findByRole('heading', { name: /Сегодня/i })).toBeInTheDocument()
  })

  it('renders Atlas at /atlas', async () => {
    renderAt('/atlas')
    expect(await screen.findByRole('heading', { name: /Atlas знаний/i })).toBeInTheDocument()
  })

  it('renders Focus at /focus', async () => {
    renderAt('/focus')
    expect(await screen.findByRole('heading', { name: /Классический ML/ })).toBeInTheDocument()
  })

  it('renders Review at /review', async () => {
    renderAt('/review')
    expect(await screen.findByRole('heading', { name: /Повторение/ })).toBeInTheDocument()
  })

  it('renders Studio at /studio', async () => {
    renderAt('/studio')
    expect(await screen.findByRole('heading', { name: /Studio/i })).toBeInTheDocument()
  })

  it('renders system status at /system', async () => {
    renderAt('/system')
    expect(await screen.findByText(/DataPath v0.1.0/)).toBeInTheDocument()
  })

  it('unknown route redirects to /today', async () => {
    renderAt('/no-such-route')
    expect(await screen.findByRole('heading', { name: /Сегодня/i })).toBeInTheDocument()
  })

  it('sidebar navigation links exist', async () => {
    renderAt('/today')
    // Навигация дублируется для desktop и mobile — ищем все вхождения.
    expect(await screen.findByRole('heading', { name: /Сегодня/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Atlas/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Focus/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Studio/i }).length).toBeGreaterThan(0)
  })
})
