/**
 * Форматирование для UI (чисто презентационное, без бизнес-логики).
 * Русская плюрализация и компактное отображение идентификаторов.
 */

/** Русская плюрализация: 1 урок, 2 урока, 5 уроков. */
export function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** «3 урока», «1 повторение», «5 кейсов». */
export function formatCount(n: number, one: string, few: string, many: string): string {
  return `${n} ${pluralize(n, one, few, many)}`
}

/** Последний сегмент составного id: lesson.classic-ml.trees.tree → tree. */
export function shortId(id: string): string {
  const segments = id.split('.')
  return segments[segments.length - 1] ?? id
}

/** Читаемая метка события активности (только отображение, не бизнес-правила). */
export function activityLabel(eventType: string): string {
  const map: Record<string, string> = {
    scene_complete: 'Сцена урока',
    lesson_complete: 'Урок завершён',
    lab_recorded: 'Лаборатория',
    case_submitted: 'Кейс',
    checkpoint: 'Проверка',
    review_answer: 'Повторение',
    review_skipped: 'Повторение пропущено',
  }
  return map[eventType] ?? eventType.replace(/_/g, ' ')
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export function formatInterval(days: number): string {
  if (days < 1 / 24) return 'через минуты'
  if (days < 1) return `через ${Math.max(1, Math.round(days * 24))} ч`
  if (days < 30) return `через ${Math.round(days)} дн`
  return `через ${Math.round(days / 30)} мес`
}
