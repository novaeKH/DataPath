import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudioView } from './StudioView'
import type { CaseSpec, CaseSubmitResult } from '../lib/api'

/**
 * Studio (Фаза 4): список кейсов, режимы, подсказки Guided,
 * прохождение, результат, ошибки API.
 */

const miniCase: CaseSpec = {
  id: 'case.classic-ml.tree-ensemble-choice',
  title: 'Мини-кейс: выбор ансамбля для оттока',
  content_id: 'case.classic-ml.tree-ensemble-choice',
  description: 'Сравнить DT, RF и CatBoost.',
  practice_kind: 'mini-case',
  lesson_ids: ['lesson.classic-ml.trees.tree'],
  skill_ids: ['ml.tree_ensembles', 'ml.bias_variance_regularization'],
  estimated_minutes: 60,
  difficulty: 'standard',
  intro: 'Задача: предсказать отток клиентов.',
  conclusion: 'Итог: RF — разумный дефолт.',
  mode: 'guided',
  questions: [
    {
      id: 'q1',
      type: 'single',
      prompt: 'Глубокое дерево: train 0.99, val 0.78. Что это?',
      options: ['Случайный шум', 'Переобучение', 'Недообучение'],
      weight: 1,
      topic: 'overfitting',
      hint: 'Сравните train и val.',
    },
    {
      id: 'q2',
      type: 'numeric',
      prompt: 'На сколько п.п. RF отстаёт от CatBoost (0.86 vs 0.87)?',
      options: [],
      weight: 1,
      topic: 'interpret',
      hint: 'Разница 0.01.',
    },
  ],
}

const submitResult: CaseSubmitResult = {
  case_id: miniCase.id,
  mode: 'guided',
  total_score: 1,
  passed: true,
  question_results: [
    {
      question_id: 'q1',
      topic: 'overfitting',
      type: 'single',
      score: 1,
      correct: true,
      explanation: 'Это переобучение.',
      your_answer: 1,
    },
    {
      question_id: 'q2',
      topic: 'interpret',
      type: 'numeric',
      score: 1,
      correct: true,
      explanation: 'Разница 1 п.п.',
      your_answer: 1,
    },
  ],
  error_codes: [],
  summary: 'Кейс выполнен: 100% правильных ответов.',
  conclusion: 'RF — дефолт.',
  attempt_id: 7,
  evidence: [
    {
      skill_id: 'ml.tree_ensembles',
      state: 'exploring',
      state_reason: 'x',
      evidence_count: 1,
      deduplicated: false,
    },
  ],
}

function stubFetch() {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/cases?mode=') || url === '/api/cases?mode=standard') {
      return Promise.resolve(new Response(JSON.stringify({ cases: [miniCase] }), { status: 200 }))
    }
    if (url.includes('/api/cases/case.classic-ml.tree-ensemble-choice?mode=guided')) {
      return Promise.resolve(new Response(JSON.stringify(miniCase), { status: 200 }))
    }
    if (url.includes('/api/cases/case.classic-ml.tree-ensemble-choice/attempts')) {
      return Promise.resolve(
        new Response(JSON.stringify({ case_id: miniCase.id, attempts: [] }), { status: 200 }),
      )
    }
    if (url.includes('/api/cases/case.classic-ml.tree-ensemble-choice/submit')) {
      return Promise.resolve(new Response(JSON.stringify(submitResult), { status: 200 }))
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
}

describe('StudioView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', stubFetch())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows case list', async () => {
    render(
      <MemoryRouter>
        <StudioView />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: /Studio/i })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /Мини-кейс: выбор ансамбля для оттока/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Пройти кейс/ })).toBeInTheDocument()
  })

  it('runs a case: guided hints, submit, result', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/studio?case=case.classic-ml.tree-ensemble-choice']}>
        <StudioView />
      </MemoryRouter>,
    )

    // Guided: подсказка видна в вопросе.
    expect(await screen.findByText(/Глубокое дерево: train 0.99, val 0.78/)).toBeInTheDocument()
    expect(await screen.findByText(/Сравните train и val/)).toBeInTheDocument()

    // Отвечаем на оба вопроса (клик по label, чтобы гарантировать выбор).
    await user.click(await screen.findByLabelText(/2\. Переобучение/))
    const numeric = await screen.findByPlaceholderText(/Введите число/)
    await user.type(numeric, '1')

    const submitButton = await screen.findByRole('button', { name: /Отправить и проверить/ })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    await user.click(submitButton)

    expect(await screen.findAllByText(/100%/)).not.toHaveLength(0)
    expect(screen.getByText(/Пройдено/)).toBeInTheDocument()
    expect(screen.getByText(/Это переобучение/)).toBeInTheDocument()
    expect(screen.getByText(/✓ Попытка сохранена/)).toBeInTheDocument()
  })

  it('shows error state when case not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/cases?mode=')) {
          return Promise.resolve(
            new Response(JSON.stringify({ cases: [miniCase] }), { status: 200 }),
          )
        }
        if (url.includes('/api/cases/case.nope?mode=guided')) {
          return Promise.resolve(new Response('{}', { status: 404 }))
        }
        if (url.includes('/api/cases/case.nope/attempts')) {
          return Promise.resolve(new Response('{}', { status: 404 }))
        }
        return Promise.resolve(new Response('{}', { status: 404 }))
      }) as unknown as typeof fetch,
    )
    render(
      <MemoryRouter initialEntries={['/studio?case=case.nope']}>
        <StudioView />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Кейс не найден/)).toBeInTheDocument()
  })

  it('runs SQL practice and renders the result table', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url === '/api/practice') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                exercises: [
                  {
                    id: 'sql.select-filter',
                    track: 'sql',
                    kind: 'sql',
                    title: 'SELECT и WHERE',
                    difficulty: 'foundation',
                    estimated_minutes: 8,
                    prompt: 'Найдите оплаченные заказы дороже 100.',
                    starter_code: "SELECT order_id FROM orders WHERE status = 'paid';",
                    hint: 'Добавьте фильтр amount.',
                    completed: false,
                    schema: { orders: ['order_id', 'status', 'amount'] },
                  },
                ],
                completed_count: 0,
                total_count: 1,
              }),
              { status: 200 },
            ),
          )
        }
        if (url === '/api/practice/sql/run') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                columns: ['order_id'],
                rows: [[104], [101]],
                row_count: 2,
                passed: true,
                feedback: 'Результат совпал с эталонным набором.',
                solution: null,
                evidence: [{ skill_id: 'sql.select-where', state: 'exploring', evidence_count: 1 }],
              }),
              { status: 200 },
            ),
          )
        }
        return Promise.resolve(new Response('{}', { status: 404 }))
      }) as unknown as typeof fetch,
    )

    render(
      <MemoryRouter initialEntries={['/studio?practice=sql.select-filter']}>
        <StudioView />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /SELECT и WHERE/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Run и проверить/ }))
    expect(await screen.findByText(/Решение принято/)).toBeInTheDocument()
    expect(screen.getByText('104')).toBeInTheDocument()
  })
})
