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
    expect(
      await screen.findByText(/Пока недостаточно данных, чтобы выделить слабые темы/i),
    ).toBeInTheDocument()
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
    expect(screen.getByText(/3 измерений/)).toBeInTheDocument()
  })

  it('recent activity and suggested case are rendered', async () => {
    renderToday()
    expect(await screen.findByText(/Недавняя активность/)).toBeInTheDocument()
    expect(screen.getByText(/tree-depth-overfitting-lab/)).toBeInTheDocument()
    expect(screen.getByText(/Рекомендуемый кейс/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Открыть в Studio/ })).toBeInTheDocument()
  })

  it('links to Focus, Atlas and Studio exist', async () => {
    renderToday()
    expect(await screen.findByRole('link', { name: /Уроки/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Atlas$/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Studio/ }).length).toBeGreaterThan(0)
  })
})
