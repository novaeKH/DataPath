import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRoadmap, type RoadmapData } from './api'

const roadmap: RoadmapData = {
  stages: [],
  total_lessons: 103,
  completed_lessons: 2,
  current_lesson: null,
  current_stage: null,
}

describe('offline read cache', () => {
  const memory = new Map<string, string>()
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size
    },
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    memory.clear()
  })

  it('returns a previously opened Roadmap when backend is unavailable', async () => {
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(roadmap), { status: 200 })),
    )
    expect((await fetchRoadmap()).total_lessons).toBe(103)

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network unavailable')))
    expect((await fetchRoadmap()).completed_lessons).toBe(2)
  })
})
