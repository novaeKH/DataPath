import { describe, expect, it } from 'vitest'
import { LOCAL_STATE_SCHEMA_VERSION, emptyLocalState, migrateLocalState } from './releaseStore'

describe('release storage migrations', () => {
  it('создаёт валидное пустое состояние', () => {
    expect(migrateLocalState(null)).toEqual(emptyLocalState())
  })

  it('мигрирует legacy state без потери progress', () => {
    const migrated = migrateLocalState({
      schema_version: 0,
      lesson_progress: {
        lesson: { lesson_id: 'lesson', completed_scenes: ['scene-01'] },
      },
      completed_practice: ['sql.one', 'sql.one'],
    })
    expect(migrated.schema_version).toBe(LOCAL_STATE_SCHEMA_VERSION)
    expect(migrated.lesson_progress.lesson.completed_scenes).toEqual(['scene-01'])
    expect(migrated.completed_practice).toEqual(['sql.one'])
    expect(migrated.notes).toEqual({})
    expect(migrated.mastery).toEqual({})
    expect(migrated.assessment_attempts).toEqual({})
  })

  it('не открывает state из будущей версии', () => {
    expect(() => migrateLocalState({ schema_version: 999 })).toThrow(/более новой версией/)
  })
})
