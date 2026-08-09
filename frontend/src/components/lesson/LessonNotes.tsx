import { useEffect, useState } from 'react'
import { localNote, saveLocalNote } from '../../platform/releaseStore'

/** Private notes stored with the local release state and included in backup. */
export function LessonNotes({ lessonId }: { lessonId: string }) {
  const [note, setNote] = useState(() => localNote(lessonId))

  useEffect(() => {
    setNote(localNote(lessonId))
  }, [lessonId])

  return (
    <details className="mt-8 rounded-xl dp-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">Мои заметки</span>
        <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
          сохраняется локально
        </span>
      </summary>
      <div className="border-t p-4" style={{ borderColor: 'var(--dp-border-subtle)' }}>
        <textarea
          value={note}
          onChange={(event) => {
            const value = event.target.value
            setNote(value)
            saveLocalNote(lessonId, value)
          }}
          rows={6}
          aria-label="Заметки к уроку"
          placeholder="Ключевая идея, формула, ошибка или вопрос для повторения…"
          className="w-full resize-y rounded-lg p-3 text-sm outline-none"
          style={{
            color: 'var(--dp-text-primary)',
            background: 'var(--dp-surface-interactive)',
            border: '1px solid var(--dp-border-subtle)',
          }}
        />
      </div>
    </details>
  )
}
