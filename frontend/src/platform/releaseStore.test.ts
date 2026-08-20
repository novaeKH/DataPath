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
    expect(migrated.project_practice).toEqual({ sql: {}, algorithms: {} })
  })

  it('сохраняет прогресс интегрированных тренажёров в общей backup-схеме', () => {
    const state = emptyLocalState()
    state.project_practice.sql.start_01 = {
      status: 'solved',
      attempts: 2,
      draft: 'SELECT * FROM orders LIMIT 10',
      help_level: 0,
      solution_revealed: false,
      last_outcome: 'passed',
      updated_at: '2026-08-20T12:00:00Z',
    }
    expect(migrateLocalState(state).project_practice.sql.start_01).toMatchObject({
      status: 'solved',
      attempts: 2,
    })
  })

  it('не открывает state из будущей версии', () => {
    expect(() => migrateLocalState({ schema_version: 999 })).toThrow(/более новой версией/)
  })

  it('консервативно переносит merged progress и сохраняет notes', () => {
    const migrated = migrateLocalState({
      schema_version: 2,
      lesson_progress: {
        'lesson.python-ds.04': {
          lesson_id: 'lesson.python-ds.04',
          current_scene_id: 'scene-04',
          completed_scenes: ['scene-01', 'scene-02'],
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      },
      notes: {
        'lesson.python-ds.04': 'Функции',
        'lesson.python-ds.08': 'Decorators',
      },
    })
    expect(migrated.lesson_progress['lesson.python-ds.04'].completed_at).toBeNull()
    expect(migrated.lesson_progress['lesson.python-ds.04'].completed_scenes).toEqual([])
    expect(migrated.notes['lesson.python-ds.04']).toContain('Функции')
    expect(migrated.notes['lesson.python-ds.04']).toContain('Decorators')
  })

  it('переписывает Review references и удаляет Algorithms из active queue', () => {
    const migrated = migrateLocalState({
      schema_version: 2,
      review_items: {
        '1': {
          source_lesson_id: 'lesson.data-tools.sql-foundations',
          source_id: 'lesson.data-tools.sql-foundations',
          template_id: 'lesson.data-tools.sql-foundations:scene-01:self',
        },
        '2': { source_lesson_id: 'lesson.algorithms.dp' },
      },
      current_roadmap_position: 'lesson.data-tools.sql-foundations',
    })
    expect(migrated.review_items['1'].source_lesson_id).toBe('lesson.sql.select-where')
    expect(migrated.review_items['2']).toBeUndefined()
    expect(migrated.current_roadmap_position).toBe('lesson.sql.select-where')
  })
})
