import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewView } from './ReviewView'
import type { ReviewQueueItem, ReviewRating, ReviewSubmitResult, ReviewSummary } from '../lib/api'

/**
 * Review (Фаза 5): summary, сессия, типы вопросов, submit, feedback,
 * Again/Hard/Good/Easy, защита от двойной отправки, итог сессии, ошибки.
 */

const summaryEmpty: ReviewSummary = {
  due_count: 0,
  overdue_count: 0,
  completed_today: 0,
  next_due_at: null,
  active_items: 0,
  stages: {},
  recommendation: 'Пройдите уроки — повторения появятся здесь.',
}

const summaryDue: ReviewSummary = {
  due_count: 2,
  overdue_count: 1,
  completed_today: 0,
  next_due_at: null,
  active_items: 2,
  stages: { learning: 2 },
  recommendation: 'Просрочено повторений: 1.',
}

function makeItem(overrides: Partial<ReviewQueueItem>): ReviewQueueItem {
  return {
    id: 1,
    template_id: 'rev.test.one',
    title: 'Тестовый вопрос',
    prompt: 'Какой вариант верный?',
    question_type: 'single_choice',
    options: ['Первый', 'Второй', 'Третий'],
    source_content_id: 'concept.ml.a',
    source_lesson_id: 'lesson.classic-ml.trees.tree',
    source_type: 'lesson',
    source_id: 'lesson.classic-ml.trees.tree',
    primary_skill_id: 'ml.tree_ensembles',
    difficulty: 'standard',
    objective: true,
    stage: 'learning',
    status: 'active',
    due_at: '2026-08-05T12:00:00+00:00',
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    lapses: 0,
    skill_state: null,
    skill_confidence: null,
    skill_evidence_count: null,
    ...overrides,
  }
}

function makeResult(overrides: Partial<ReviewSubmitResult>): ReviewSubmitResult {
  return {
    review_item_id: 1,
    template_id: 'rev.test.one',
    title: 'Тестовый вопрос',
    objective_score: 1,
    is_correct: true,
    user_rating: 'Good',
    effective_rating: 'Good',
    explanation: 'Объяснение правильного ответа.',
    correct_answer: '1. Первый',
    interval_days: 3,
    ease_factor: 2.5,
    stage: 'review',
    next_due_at: '2026-08-08T12:00:00+00:00',
    repetitions: 1,
    lapses: 0,
    knowledge_impact: [],
    skill_state: null,
    skill_axes: {},
    attempt_id: 1,
    deduplicated: false,
    ...overrides,
  }
}

interface FetchOpts {
  summary?: ReviewSummary
  items?: ReviewQueueItem[]
  failSubmit?: boolean
}

function makeFetch(opts: FetchOpts) {
  const submitCalls: { dedup_key: string; user_rating: ReviewRating; answer: unknown }[] = []
  const seenKeys = new Map<string, ReviewSubmitResult>()
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (url.includes('/api/reviews/summary')) {
      return Promise.resolve(
        new Response(JSON.stringify(opts.summary ?? summaryEmpty), { status: 200 }),
      )
    }
    if (url.includes('/api/reviews/queue')) {
      const items = opts.items ?? []
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items,
            returned: items.length,
            due_count: items.length,
            overdue_count: 0,
            next_due_at: null,
            limit: 10,
          }),
          { status: 200 },
        ),
      )
    }
    const submitMatch = url.match(/\/api\/reviews\/(\d+)\/submit$/)
    if (method === 'POST' && submitMatch) {
      if (opts.failSubmit) {
        return Promise.resolve(new Response('{"detail":"ошибка"}', { status: 500 }))
      }
      const body = JSON.parse(String(init?.body)) as {
        answer: unknown
        user_rating: ReviewRating
        dedup_key: string
      }
      submitCalls.push(body)
      if (seenKeys.has(body.dedup_key)) {
        return Promise.resolve(
          new Response(JSON.stringify({ ...seenKeys.get(body.dedup_key)!, deduplicated: true }), {
            status: 200,
          }),
        )
      }
      const item = (opts.items ?? []).find((i) => String(i.id) === submitMatch[1])
      const isReveal = item?.question_type === 'reveal_and_rate'
      const correct = item?.options?.length ? 0 : undefined
      const isCorrect = body.answer === correct
      const result = makeResult({
        review_item_id: Number(submitMatch[1]),
        template_id: item?.template_id ?? 'rev.test.one',
        title: item?.title ?? 'Тестовый вопрос',
        objective_score: isReveal ? null : isCorrect ? 1 : 0,
        is_correct: isReveal ? null : isCorrect,
        user_rating: body.user_rating,
        effective_rating: isReveal ? body.user_rating : isCorrect ? body.user_rating : 'Again',
      })
      seenKeys.set(body.dedup_key, result)
      return Promise.resolve(new Response(JSON.stringify(result), { status: 200 }))
    }
    const itemMatch = url.match(/\/api\/reviews\/(\d+)$/)
    if (itemMatch) {
      const item = (opts.items ?? []).find((i) => String(i.id) === itemMatch[1])
      return Promise.resolve(new Response(JSON.stringify(item), { status: 200 }))
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
  return { fn, submitCalls }
}

function renderReview() {
  return render(
    <MemoryRouter>
      <ReviewView />
    </MemoryRouter>,
  )
}

describe('ReviewView', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => 'uuid-test' })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('empty: показывает честный пустой экран', async () => {
    vi.stubGlobal('fetch', makeFetch({ summary: summaryEmpty, items: [] }).fn)
    renderReview()
    expect(await screen.findByText(/Пока пусто/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /К урокам/ })).toBeInTheDocument()
  })

  it('error: показывает состояние ошибки', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))) as unknown as typeof fetch,
    )
    renderReview()
    expect(await screen.findByText(/Не удалось загрузить повторения/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Попробовать снова/ })).toBeInTheDocument()
  })

  it('loading: показывает загрузку до ответа API', async () => {
    let resolveSummary!: (r: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveSummary = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/reviews/summary')) return pending
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
        return Promise.resolve(new Response('{}', { status: 404 }))
      }) as unknown as typeof fetch,
    )
    renderReview()
    expect(await screen.findByText(/Загрузка повторений/)).toBeInTheDocument()
    resolveSummary(new Response(JSON.stringify(summaryEmpty), { status: 200 }))
    expect(await screen.findByText(/Пока пусто/)).toBeInTheDocument()
  })

  it('summary: показывает счётчики и кнопку начала сессии', async () => {
    vi.stubGlobal('fetch', makeFetch({ summary: summaryDue, items: [makeItem({ id: 1 })] }).fn)
    renderReview()
    expect(await screen.findByText(/На сегодня/)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Начать повторение/ })).toBeInTheDocument()
  })

  it('session: single_choice с отправкой и объяснением', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [
        makeItem({
          id: 1,
          question_type: 'single_choice',
          options: ['Первый', 'Второй', 'Третий'],
        }),
      ],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    expect(await screen.findByText(/Какой вариант верный/)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Первый/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    expect(await screen.findByText(/Объяснение правильного ответа/)).toBeInTheDocument()
    expect(screen.getByText(/1\. Первый/)).toBeInTheDocument()
    expect(mock.submitCalls.length).toBe(1)
  })

  it('session: правильный ответ показывает оценки Again/Hard/Good/Easy', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1 })],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    expect(await screen.findByRole('button', { name: /Again/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hard/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Good/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Easy/ })).toBeInTheDocument()
  })

  it('session: неправильный ответ не позволяет отправить Easy', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1, options: ['Первый', 'Второй'] })],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Второй/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    expect(await screen.findByText(/Требует повторения/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Easy/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Далее/ })).toBeInTheDocument()
  })

  it('session: переход к следующему элементу', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [
        makeItem({ id: 1, prompt: 'Первый вопрос' }),
        makeItem({ id: 2, template_id: 'rev.test.two', prompt: 'Второй вопрос' }),
      ],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    await user.click(await screen.findByRole('button', { name: /Далее/ }))
    expect(await screen.findByText(/Второй вопрос/)).toBeInTheDocument()
  })

  it('session: защита от двойной отправки (один запрос при двойном клике)', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1 })],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    const checkButton = screen.getByRole('button', { name: /Проверить/ })
    await user.dblClick(checkButton)
    await waitFor(() => expect(mock.submitCalls.length).toBe(1))
  })

  it('session: клавиатура — Enter проверяет, 1 оценивает Again', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1 })],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    await user.keyboard('{Enter}')
    expect(await screen.findByText(/Объяснение правильного ответа/)).toBeInTheDocument()
    await user.keyboard('1')
    await waitFor(() =>
      expect(mock.submitCalls.some((call) => call.user_rating === 'Again')).toBe(true),
    )
  })

  it('session: итог сессии после последнего элемента', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1 })],
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    await user.click(await screen.findByRole('button', { name: /Далее/ }))
    expect(await screen.findByRole('heading', { name: /Сессия завершена/ })).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2) // выполнено + верно
    expect(screen.getByRole('link', { name: /Сегодня/ })).toBeInTheDocument()
  })

  it('session: API error при submit показывает сообщение', async () => {
    const mock = makeFetch({
      summary: summaryDue,
      items: [makeItem({ id: 1 })],
      failSubmit: true,
    })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    await user.click(await screen.findByRole('radio', { name: /Первый/ }))
    await user.click(screen.getByRole('button', { name: /Проверить/ }))
    expect(await screen.findByText(/ошибка/)).toBeInTheDocument()
  })
})

describe('ReviewView question types', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => 'uuid-test' })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function startSession(items: ReviewQueueItem[]) {
    const mock = makeFetch({ summary: summaryDue, items })
    vi.stubGlobal('fetch', mock.fn)
    renderReview()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Начать повторение/ }))
    return { user, mock }
  }

  it('multiple_choice рендерит чекбоксы', async () => {
    const { user } = await startSession([
      makeItem({ id: 1, question_type: 'multiple_choice', options: ['A', 'B', 'C'] }),
    ])
    expect(await screen.findByRole('checkbox', { name: /A/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /B/ })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /A/ }))
    expect(screen.getByRole('checkbox', { name: /A/ })).toBeChecked()
  })

  it('ordering рендерит последовательный выбор', async () => {
    const { user } = await startSession([
      makeItem({ id: 1, question_type: 'ordering', options: ['Шаг A', 'Шаг B', 'Шаг C'] }),
    ])
    const first = await screen.findByRole('button', { name: /Шаг A/ })
    await user.click(first)
    expect(await screen.findByText(/Шаг A/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Шаг A/ })).not.toBeInTheDocument()
  })

  it('numeric рендерит числовой ввод', async () => {
    const { user } = await startSession([
      makeItem({ id: 1, question_type: 'numeric', options: [] }),
    ])
    const input = (await screen.findByPlaceholderText(/Введите число/)) as HTMLInputElement
    await user.type(input, '42')
    expect(input.value).toBe('42')
  })

  it('error_diagnosis рендерит варианты', async () => {
    await startSession([
      makeItem({ id: 1, question_type: 'error_diagnosis', options: ['Ошибочно?', 'Верно?'] }),
    ])
    expect(await screen.findByRole('radio', { name: /Ошибочно/ })).toBeInTheDocument()
  })

  it('reveal_and_rate показывает разбор без объективной проверки', async () => {
    const { user } = await startSession([
      makeItem({ id: 1, question_type: 'reveal_and_rate', objective: false, options: [] }),
    ])
    expect(await screen.findByPlaceholderText(/Объясните своими словами/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Показать разбор/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Показать разбор/ }))
    expect(await screen.findByText(/Объяснение правильного ответа/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Easy/ })).toBeInTheDocument()
  })
})
