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
})
