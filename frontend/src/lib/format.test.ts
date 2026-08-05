import { describe, expect, it } from 'vitest'
import { activityLabel, formatCount, pluralize, shortId } from './format'

describe('pluralize (русская плюрализация)', () => {
  it('корректные формы для урока', () => {
    expect(pluralize(1, 'урок', 'урока', 'уроков')).toBe('урок')
    expect(pluralize(2, 'урок', 'урока', 'уроков')).toBe('урока')
    expect(pluralize(5, 'урок', 'урока', 'уроков')).toBe('уроков')
    expect(pluralize(21, 'урок', 'урока', 'уроков')).toBe('урок')
    expect(pluralize(12, 'урок', 'урока', 'уроков')).toBe('уроков')
  })

  it('formatCount добавляет число', () => {
    expect(formatCount(1, 'повторение', 'повторения', 'повторений')).toBe('1 повторение')
    expect(formatCount(3, 'повторение', 'повторения', 'повторений')).toBe('3 повторения')
    expect(formatCount(5, 'повторение', 'повторения', 'повторений')).toBe('5 повторений')
  })
})

describe('shortId', () => {
  it('берёт последний сегмент составного id', () => {
    expect(shortId('lesson.classic-ml.trees.tree')).toBe('tree')
    expect(shortId('rev.dt.split-gain')).toBe('split-gain')
    expect(shortId('simple')).toBe('simple')
  })
})

describe('activityLabel', () => {
  it('переводит типы событий в читаемые метки', () => {
    expect(activityLabel('review_answer')).toBe('Повторение')
    expect(activityLabel('lesson_complete')).toBe('Урок завершён')
    expect(activityLabel('lab_recorded')).toBe('Лаборатория')
  })

  it('не падает на неизвестных типах', () => {
    expect(activityLabel('some_future_event')).toBe('some future event')
  })
})
