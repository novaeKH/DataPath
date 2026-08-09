import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayView } from './TodayView'
import type { TodayData } from '../lib/api'

/**
 * Today (Фаза 4): стартовый сценарий, главная карточка, слабые темы,
 * недавняя активность, рекомендуемый кейс, ошибки API.
 */

const emptyToday: TodayData = {
  continue_lesson: null,
  next_lesson: {
    id: 'lesson.classic-ml.trees.tree',
    title: 'Decision Tree',
    skills: ['ml.tree_ensembles'],
  },
  weak_skills: [],
  recent_activity: [],
  suggested_case: null,
  progress_summary: {
    lessons_started: 0,
    lessons_completed: 0,
    labs_completed: 0,
    cases_completed: 0,
    skill_distribution: {},
    recent_events: [],
    recommended_action: {
      action: 'next_lesson',
      lesson_id: 'lesson.classic-ml.trees.tree',
      title: 'Decision Tree',
    },
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

const withActivity: TodayData = {
  continue_lesson: {
    lesson_id: 'lesson.classic-ml.trees.forest',
    title: 'Bagging и Random Forest',
    current_scene_id: 'scene-03',
    completed_scenes: ['scene-01', 'scene-02', 'scene-03'],
    started_at: '2026-08-05T10:00:00+00:00',
  },
  next_lesson: null,
  weak_skills: [
    {
      skill_id: 'ml.bias_variance_regularization',
      state: 'needs_attention',
      evidence_count: 3,
      axes: { theory: { alpha: 1, beta: 3, evidence_count: 3, score: 0.4 } },
    },
  ],
  recent_activity: [
    {
      id: 1,
      event_type: 'lab_recorded',
      source_type: 'lab',
      source_id: 'tree-depth-overfitting-lab',
      skill_id: 'ml.bias_variance_regularization',
      outcome: 'completed',
      score: 1,
      hints_used: 0,
      attempts: 1,
      error_code: null,
      created_at: '2026-08-05T10:05:00+00:00',
    },
  ],
  suggested_case: {
    case_id: 'case.classic-ml.tree-ensemble-choice',
    title: 'Мини-кейс: выбор ансамбля для оттока',
  },
  progress_summary: {
    lessons_started: 1,
    lessons_completed: 1,
    labs_completed: 1,
    cases_completed: 0,
    skill_distribution: { exploring: 1, needs_attention: 1 },
    recent_events: [
      {
        id: 1,
        event_type: 'lab_recorded',
        source_type: 'lab',
        source_id: 'tree-depth-overfitting-lab',
        skill_id: 'ml.bias_variance_regularization',
        outcome: 'completed',
        score: 1,
        hints_used: 0,
        attempts: 1,
        error_code: null,
        created_at: '2026-08-05T10:05:00+00:00',
      },
    ],
    recommended_action: {
      action: 'continue_lesson',
      lesson_id: 'lesson.classic-ml.trees.forest',
      current_scene_id: 'scene-03',
    },
  },
  review_summary: {
    due_count: 0,
    overdue_count: 0,
    completed_today: 0,
    next_due_at: '2026-08-08T10:00:00+00:00',
    active_items: 3,
    stages: { review: 3 },
    recommendation: 'На сегодня всё.',
  },
  due_reviews: 0,
  overdue_reviews: 0,
  next_review_at: '2026-08-08T10:00:00+00:00',
  review_action: null,
}

const withDueReviews: TodayData = {
  ...withActivity,
  review_summary: {
    due_count: 5,
    overdue_count: 2,
    completed_today: 1,
    next_due_at: null,
    active_items: 5,
    stages: { review: 3, relearning: 2 },
    recommendation: 'Просрочено повторений: 2.',
  },
  due_reviews: 5,
  overdue_reviews: 2,
  next_review_at: null,
  review_action: 'review_session',
}

function stubFetch(payload: TodayData) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/today')) {
      return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }))
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
}

function renderToday() {
  return render(
    <MemoryRouter>
      <TodayView />
    </MemoryRouter>,
  )
}

describe('TodayView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', stubFetch(emptyToday))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('empty state: предлагает первый урок маршрута', async () => {
    renderToday()
    expect(await screen.findByRole('heading', { name: /Сегодня/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Decision Tree/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Начать урок/ })).toBeInTheDocument()
  })

  it('empty state: слабых тем нет и не показывает фиктивную аналитику', async () => {
    renderToday()
    expect(await screen.findByRole('heading', { name: /Decision Tree/ })).toBeInTheDocument()
    expect(screen.queryByText(/Нужно усилить/)).not.toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))) as unknown as typeof fetch,
    )
    renderToday()
    expect(await screen.findByText(/Не удалось загрузить «Сегодня»/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Попробовать снова/ })).toBeInTheDocument()
  })
})

describe('TodayView with activity', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', stubFetch(withActivity))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('continue lesson card is the main action', async () => {
    renderToday()
    expect(
      await screen.findByRole('heading', { name: /Bagging и Random Forest/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Продолжить урок/ })).toBeInTheDocument()
  })

  it('weak skills shown when evidence is sufficient', async () => {
    renderToday()
    expect(await screen.findByText(/ml.bias_variance_regularization/)).toBeInTheDocument()
    expect(screen.getByText(/Нужно усилить/)).toBeInTheDocument()
  })

  it('suggested case is available in the compact secondary section', async () => {
    renderToday()
    expect(await screen.findByText(/Mini-case/)).toBeInTheDocument()
    expect(screen.queryByText(/Недавняя активность/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Открыть в Studio/ })).toBeInTheDocument()
  })

  it('keeps the daily route focused on lesson, practice and review', async () => {
    renderToday()
    expect(await screen.findByRole('link', { name: /Продолжить урок/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Studio/ }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /К повторениям/ })).toBeInTheDocument()
  })

  it('shows review card with «на сегодня всё» when queue is empty but items exist', async () => {
    renderToday()
    expect(await screen.findByText(/На сегодня всё/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /К повторениям/ })).toBeInTheDocument()
  })
})

describe('TodayView with due reviews', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', stubFetch(withDueReviews))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('review session is the primary action with counts', async () => {
    renderToday()
    expect(
      await screen.findByRole('heading', { name: /5 повторений на сегодня/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/2 просрочено/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Начать повторение/ })).toBeInTheDocument()
  })

  it('continue lesson remains available as a secondary action', async () => {
    renderToday()
    expect(
      await screen.findByRole('heading', { name: /Bagging и Random Forest/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Продолжить урок/ })).toBeInTheDocument()
  })
})
