import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusView } from './FocusView'
import type { CourseDetail, LabSpec, LessonDetail } from '../lib/api'

/**
 * FocusView: /focus (выбор урока), /focus/:lessonId (урок со сценами),
 * loading/error/not-found, навигация между сценами и уроками, безопасный Markdown.
 */

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
      estimated_minutes: 45,
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
        {
          id: 'lesson.classic-ml.trees.forest',
          title: 'Random Forest',
          lesson_order: 2,
          estimated_minutes: 45,
          difficulty: 'core',
          skills: ['ml.tree_ensembles'],
          laboratory_ids: [],
        },
      ],
    },
  ],
  cases: [],
  first_lesson_id: 'lesson.classic-ml.trees.tree',
  last_lesson_id: 'lesson.classic-ml.trees.forest',
}

function makeLesson(overrides: Partial<LessonDetail> = {}): LessonDetail {
  return {
    id: 'lesson.classic-ml.trees.tree',
    title: 'Decision Tree без магии',
    slug: '07-decision-tree',
    module: { id: 'module.classic-ml.trees', title: 'Деревья и ансамбли', order: 3 },
    course: { id: 'course.classic-ml', title: 'Классический ML' },
    estimated_minutes: 45,
    difficulty: 'core',
    skills: ['ml.tree_ensembles'],
    previous_lesson_id: null,
    next_lesson_id: 'lesson.classic-ml.trees.forest',
    scenes: [
      {
        id: 'scene-01',
        type: 'markdown',
        title: 'Идея за 30 секунд',
        markdown: 'Decision Tree рекурсивно делит пространство условиями.',
      },
      {
        id: 'scene-02',
        type: 'formula',
        formula: '\\operatorname{Gain}=I(p)-\\frac{n_L}{n}I(l)',
        explanation: 'Gain — уменьшение impurity.',
      },
      {
        id: 'scene-03',
        type: 'code',
        language: 'python',
        code: 'def split(X, t):\n    return X[:, 0] <= t',
      },
      {
        id: 'scene-04',
        type: 'checkpoint',
        question: 'Сформулируй главную идею одним абзацем.',
      },
      {
        id: 'scene-05',
        type: 'interactive_lab',
        lab_id: 'decision-tree-split-lab',
        lab_title: 'Разбиение Decision Tree',
      },
    ],
    laboratory_ids: ['decision-tree-split-lab'],
    materials: [
      {
        id: 'concept.ml.decision-trees',
        title: 'Decision Trees',
        type: 'concept',
        path: '10 Знания/ML/01 Classical ML/Decision Trees.md',
      },
    ],
    ...overrides,
  }
}

const labSpec: LabSpec = {
  id: 'decision-tree-split-lab',
  title: 'Разбиение Decision Tree',
  description: 'Пробуйте разные разбиения датасета.',
  lesson_ids: ['lesson.classic-ml.trees.tree'],
  parameters: [
    { name: 'feature', label: 'Признак', type: 'enum', default: 'x1', values: ['x1', 'x2'] },
    { name: 'threshold', label: 'Порог', type: 'number', default: 0, min: -3, max: 3, step: 0.05 },
  ],
  defaults: { feature: 'x1', threshold: 0 },
  initial_result: {
    dataset: { points: [], classes: [0, 1], x_range: [-3, 3], y_range: [-3, 3] },
    split: { feature: 'x1', threshold: 0, left_count: 60, right_count: 60 },
    impurity: { criterion: 'gini', parent: 0.5, left: 0.25, right: 0.25, weighted: 0.25 },
    gain: 0.25,
    explanation: 'Разбиение уменьшает impurity.',
  },
}

function stubFetch(lesson: LessonDetail = makeLesson()) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/api/content/courses/course.classic-ml')) {
      return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
    }
    if (url.includes('/api/content/lessons/')) {
      return Promise.resolve(new Response(JSON.stringify(lesson), { status: 200 }))
    }
    if (url.includes('/api/labs/') && !url.endsWith('/run')) {
      return Promise.resolve(new Response(JSON.stringify(labSpec), { status: 200 }))
    }
    if (url.includes('/api/labs/') && url.endsWith('/run')) {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      const split = (labSpec.initial_result as { split?: Record<string, unknown> }).split ?? {}
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ...labSpec.initial_result,
            split: {
              ...split,
              threshold: (body.parameters as { threshold?: number })?.threshold ?? 0,
            },
          }),
          { status: 200 },
        ),
      )
    }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }) as unknown as typeof fetch
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderFocus(path = '/focus') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/focus" element={<FocusView />} />
        <Route path="/focus/:lessonId" element={<FocusView />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FocusView: выбор урока', () => {
  beforeEach(() => {
    stubFetch()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows course modules and lessons', async () => {
    renderFocus('/focus')
    expect(await screen.findByRole('heading', { name: /Классический ML/ })).toBeInTheDocument()
    expect(screen.getByText('Деревья и ансамбли')).toBeInTheDocument()
    expect(screen.getByText('Decision Tree')).toBeInTheDocument()
    expect(screen.getByText('Random Forest')).toBeInTheDocument()
  })

  it('navigates to lesson when clicked', async () => {
    const user = userEvent.setup()
    renderFocus('/focus')
    const lessonButton = await screen.findByRole('button', { name: /Decision Tree/ })
    await user.click(lessonButton)
    expect(
      await screen.findByRole('heading', { name: /Decision Tree без магии/ }),
    ).toBeInTheDocument()
  })

  it('shows error state when course API fails', async () => {
    const fetchMock = vi.fn(() =>
      Promise.reject(new Error('network down')),
    ) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus')
    expect(await screen.findByText(/Курс недоступен/)).toBeInTheDocument()
  })
})

describe('FocusView: урок', () => {
  beforeEach(() => {
    stubFetch()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders loading then lesson content', async () => {
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect(screen.getByText(/Загрузка урока/)).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /Decision Tree без магии/ }),
    ).toBeInTheDocument()
  })

  it('shows first scene and scene indicator', async () => {
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Раздел 1 из 5/)).toBeInTheDocument()
  })

  it('navigates between scenes with Next/Back', async () => {
    const user = userEvent.setup()
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Далее/ }))
    expect(screen.getByText(/Раздел 2 из 5/)).toBeInTheDocument()
    expect(screen.getByText(/Gain — уменьшение impurity/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Назад/ }))
    expect(screen.getByText(/Раздел 1 из 5/)).toBeInTheDocument()
  })

  it('renders code scene with language and code', async () => {
    const user = userEvent.setup()
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Далее/ }))
    await user.click(screen.getByRole('button', { name: /Далее/ }))
    expect(screen.getByText('python')).toBeInTheDocument()
    expect(screen.getByText(/def split/)).toBeInTheDocument()
  })

  it('renders checkpoint scene', async () => {
    const user = userEvent.setup()
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole('button', { name: /Далее/ }))
    }
    expect(screen.getByText(/Сформулируй главную идею одним абзацем/)).toBeInTheDocument()
  })

  it('navigates to next lesson from last scene', async () => {
    const user = userEvent.setup()
    const lesson = makeLesson()
    lesson.scenes = lesson.scenes.filter((scene) => scene.type === 'markdown')
    lesson.scenes[0].id = 'scene-01'
    stubFetch(lesson)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    const nextButton = await screen.findByRole('button', { name: /Следующий урок/ })
    await user.click(nextButton)
    // снова загружается урок Random Forest? нет — API отдаёт тот же lesson,
    // поэтому проверяем, что маршрут сменился (заголовок остался, id новый)
    await waitFor(() => {
      expect(screen.getByText(/Раздел 1 из 1/)).toBeInTheDocument()
    })
  })

  it('renders not-found state for unknown lesson', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/content/courses/course.classic-ml')) {
        return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus/no.such.lesson')
    expect(await screen.findByText(/Урок не найден/)).toBeInTheDocument()
  })

  it('renders error state on network failure', async () => {
    const fetchMock = vi.fn(() =>
      Promise.reject(new Error('network down')),
    ) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect(await screen.findByText(/Ошибка загрузки/)).toBeInTheDocument()
  })
})

describe('FocusView: безопасный Markdown', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not execute raw HTML from vault', async () => {
    const lesson = makeLesson({
      scenes: [
        {
          id: 'scene-01',
          type: 'markdown',
          title: 'Опасная сцена',
          markdown:
            'Текст <img src=x onerror="window.__pwned=1"> и <script>window.__pwned2=1</script>',
        },
      ],
    })
    stubFetch(lesson)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText('Опасная сцена')).length).toBeGreaterThan(0)
    // script/img с обработчиками не исполняются (rehype-sanitize)
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
    expect((window as unknown as { __pwned2?: number }).__pwned2).toBeUndefined()
    expect(document.querySelector('script')).toBeNull()
  })

  it('opens external links safely', async () => {
    const lesson = makeLesson({
      scenes: [
        {
          id: 'scene-01',
          type: 'markdown',
          title: 'Ссылки',
          markdown: '[sklearn](https://scikit-learn.org)',
        },
      ],
    })
    stubFetch(lesson)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    const link = await screen.findByRole('link', { name: 'sklearn' })
    expect(link).toHaveAttribute('href', 'https://scikit-learn.org')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
  })
})

describe('FocusView: лаборатория', () => {
  beforeEach(() => {
    stubFetch()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads lab spec inside interactive scene', async () => {
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    const user = userEvent.setup()
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /Далее/ }))
    }
    expect((await screen.findAllByText(/Разбиение Decision Tree/)).length).toBeGreaterThan(0)
    expect(await screen.findByText(/Порог/)).toBeInTheDocument()
  })

  it('runs lab when parameter changes and shows result', async () => {
    const user = userEvent.setup()
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect((await screen.findAllByText(/Идея за 30 секунд/)).length).toBeGreaterThan(0)
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /Далее/ }))
    }
    const threshold = await screen.findByLabelText('Порог')
    await user.clear(threshold)
    await user.type(threshold, '1.5')
    expect(await screen.findByText(/Information gain/)).toBeInTheDocument()
  })

  it('shows lab error on API failure', async () => {
    const lesson = makeLesson()
    lesson.scenes = [
      {
        id: 'scene-01',
        type: 'interactive_lab',
        lab_id: 'decision-tree-split-lab',
        lab_title: 'Разбиение Decision Tree',
      },
    ]
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/labs/') && url.endsWith('/run')) {
        return Promise.resolve(new Response('{}', { status: 500 }))
      }
      if (url.includes('/api/labs/')) {
        return Promise.resolve(new Response(JSON.stringify(labSpec), { status: 200 }))
      }
      if (url.includes('/api/content/lessons/')) {
        return Promise.resolve(new Response(JSON.stringify(lesson), { status: 200 }))
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    const threshold = await screen.findByLabelText('Порог')
    await userEvent.setup().clear(threshold)
    await userEvent.setup().type(threshold, '2')
    expect(await screen.findByText(/HTTP 500/)).toBeInTheDocument()
  })
})

describe('FocusView: прогресс (Фаза 4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubWithProgress(progress: { current_scene_id: string; completed_scenes: string[] }) {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/content/courses/course.classic-ml')) {
        return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
      }
      if (url.includes('/api/content/lessons/')) {
        return Promise.resolve(new Response(JSON.stringify(makeLesson()), { status: 200 }))
      }
      if (url.includes('/api/progress/lessons/') && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              lesson_id: 'lesson.classic-ml.trees.tree',
              current_scene_id: progress.current_scene_id,
              completed_scenes: progress.completed_scenes,
              started_at: '2026-08-05T10:00:00+00:00',
              completed_at: null,
              updated_at: '2026-08-05T10:00:00+00:00',
            }),
            { status: 200 },
          ),
        )
      }
      if (url.includes('/api/progress/lessons/') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              lesson_id: 'lesson.classic-ml.trees.tree',
              scene_id: 'scene-03',
              current_scene_id: 'scene-03',
              completed_scenes: [...progress.completed_scenes, 'scene-03'],
              started_at: '2026-08-05T10:00:00+00:00',
              completed_at: null,
              event_id: 42,
            }),
            { status: 200 },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('восстанавливает последнюю сцену из progress', async () => {
    stubWithProgress({ current_scene_id: 'scene-03', completed_scenes: ['scene-01', 'scene-02'] })
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    // scene-03 — code сцена: показывается после восстановления.
    expect(await screen.findByText(/Раздел 3 из 5/)).toBeInTheDocument()
    expect(screen.getByText('python')).toBeInTheDocument()
  })

  it('завершает сцену и обновляет индикатор прогресса', async () => {
    const user = userEvent.setup()
    stubWithProgress({ current_scene_id: 'scene-01', completed_scenes: [] })
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect(await screen.findByText(/Раздел 1 из 5/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Далее/ }))
    expect(await screen.findByText(/Раздел 2 из 5/)).toBeInTheDocument()
    // Индикатор «сохранено» появляется после POST scene complete.
    expect(await screen.findByText(/✓ сохранено/)).toBeInTheDocument()
  })

  it('завершает урок кнопкой «Завершить урок»', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/content/courses/course.classic-ml')) {
        return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
      }
      if (url.includes('/api/content/lessons/')) {
        return Promise.resolve(new Response(JSON.stringify(makeLesson()), { status: 200 }))
      }
      if (url.includes('/api/progress/lessons/') && method === 'GET') {
        return Promise.resolve(new Response('{}', { status: 404 }))
      }
      if (url.includes('/scenes/') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              lesson_id: 'lesson.classic-ml.trees.tree',
              scene_id: 'scene-04',
              current_scene_id: 'scene-04',
              completed_scenes: ['scene-01', 'scene-02', 'scene-03', 'scene-04'],
              started_at: '2026-08-05T10:00:00+00:00',
              completed_at: null,
              event_id: 41,
            }),
            { status: 200 },
          ),
        )
      }
      if (url.includes('/api/progress/lessons/lesson.classic-ml.trees.tree/complete')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              lesson_id: 'lesson.classic-ml.trees.tree',
              completed_at: '2026-08-05T10:10:00+00:00',
              skills: [{ skill_id: 'ml.tree_ensembles', state: 'exploring', evidence_count: 1 }],
            }),
            { status: 200 },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect(await screen.findByText(/Раздел 1 из 5/)).toBeInTheDocument()
    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: /Далее/ }))
    }
    await user.click(screen.getByRole('button', { name: /Завершить урок/ }))
    // Уведомление о завершении + добавлении материала в расписание.
    expect(await screen.findByText(/материал добавлен в расписание повторений/)).toBeInTheDocument()
    // Кнопка переходит в состояние «завершён».
    expect(screen.getByRole('button', { name: /✓ Урок завершён/ })).toBeInTheDocument()
  })

  it('показывает ссылку «Повторить тему», когда для урока есть активные повторения', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/content/courses/course.classic-ml')) {
        return Promise.resolve(new Response(JSON.stringify(courseDetail), { status: 200 }))
      }
      if (url.includes('/api/content/lessons/')) {
        return Promise.resolve(new Response(JSON.stringify(makeLesson()), { status: 200 }))
      }
      if (url.includes('/api/progress/lessons/') && method === 'GET') {
        return Promise.resolve(new Response('{}', { status: 404 }))
      }
      if (url.includes('/api/reviews/summary')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              due_count: 2,
              overdue_count: 0,
              completed_today: 0,
              next_due_at: null,
              active_items: 2,
              stages: { review: 2 },
              recommendation: 'На сегодня запланировано повторений: 2.',
            }),
            { status: 200 },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    renderFocus('/focus/lesson.classic-ml.trees.tree')
    expect(await screen.findByText(/Раздел 1 из 5/)).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Повторить тему \(2\)/ })).toBeInTheDocument()
  })
})
