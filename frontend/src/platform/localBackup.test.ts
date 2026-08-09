import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localPost, localRead } from './localApi'
import { emptyLocalState, loadLocalState, saveLocalState } from './releaseStore'

const snapshot = {
  format: 'datapath-release-snapshot',
  schema_version: 1,
  app_version: '1.0.0',
  generated_at: '2026-08-10T00:00:00Z',
  reads: {
    '/api/practice': { exercises: [] },
    '/api/reviews/queue?limit=30': { items: [] },
    '/api/atlas': { nodes: [] },
    '/api/today': {
      continue_lesson: null,
      next_lesson: null,
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
    },
    '/api/roadmap': {
      stages: [
        {
          id: 'stage-1',
          title: 'Ориентация',
          depth: 'foundation',
          modules: [
            {
              lessons: [
                {
                  id: 'lesson.test',
                  title: 'Тестовый урок',
                  estimated_minutes: 20,
                },
              ],
            },
          ],
        },
      ],
      total_lessons: 1,
      completed_lessons: 0,
      current_lesson: null,
      current_stage: null,
    },
    '/api/content/lessons/lesson.test': {
      id: 'lesson.test',
      title: 'Тестовый урок',
      estimated_minutes: 20,
      skills: ['python.basics'],
    },
  },
  practice_runtime: {},
  case_runtime: {},
}

const memory = new Map<string, string>()
const storage: Storage = {
  get length() {
    return memory.size
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => void memory.delete(key),
  setItem: (key, value) => void memory.set(key, value),
}

describe('local backup safety', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot))))
  })

  it('restores progress after an isolated export/reset/import cycle', async () => {
    const original = emptyLocalState()
    original.initialized_from_snapshot = true
    original.lesson_progress['lesson.test'] = {
      lesson_id: 'lesson.test',
      current_scene_id: 'scene-02',
      completed_scenes: ['scene-01'],
      started_at: '2026-08-10T00:00:00Z',
      completed_at: null,
      updated_at: '2026-08-10T00:05:00Z',
    }
    original.notes['lesson.test'] = 'Не забыть повторить формулу.'
    saveLocalState(original)

    const payload = await localRead<Record<string, unknown>>('/api/system/backup')
    saveLocalState(emptyLocalState())
    await localPost('/api/system/restore', payload)

    expect(loadLocalState().lesson_progress['lesson.test'].current_scene_id).toBe('scene-02')
    expect(loadLocalState().notes['lesson.test']).toBe('Не забыть повторить формулу.')
  })

  it('rejects a modified backup without replacing current state', async () => {
    const current = emptyLocalState()
    current.notes.safe = 'keep me'
    saveLocalState(current)
    const payload = await localRead<Record<string, unknown>>('/api/system/backup')
    const invalid = { ...payload, checksum: '00000000' }

    await expect(localPost('/api/system/restore', invalid)).rejects.toThrow(/Checksum/)
    expect(loadLocalState().notes.safe).toBe('keep me')
  })

  it('hydrates Today roadmap lessons with the full offline skill contract', async () => {
    const payload = await localRead<{
      next_lesson: { id: string; skills: string[]; estimated_minutes: number } | null
    }>('/api/today')

    expect(payload.next_lesson).toMatchObject({
      id: 'lesson.test',
      skills: ['python.basics'],
      estimated_minutes: 20,
    })
  })
})
