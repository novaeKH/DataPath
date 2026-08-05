import type { LessonScene } from '../../lib/api'

const TYPE_META: Record<string, { label: string; dot: string }> = {
  markdown: { label: 'Теория', dot: 'bg-slate-400' },
  formula: { label: 'Формула', dot: 'bg-violet-400' },
  code: { label: 'Код', dot: 'bg-sky-400' },
  callout: { label: 'Важно', dot: 'bg-amber-400' },
  checkpoint: { label: 'Проверка', dot: 'bg-indigo-400' },
  interactive_lab: { label: 'Лаборатория', dot: 'bg-emerald-400' },
}

/** Компактный outline сцен урока с навигацией. */
export function LessonOutline({
  scenes,
  currentIndex,
  onSelect,
}: {
  scenes: LessonScene[]
  currentIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <nav aria-label="Сцены урока" className="flex flex-col gap-1">
      {scenes.map((scene, index) => {
        const meta = TYPE_META[scene.type] ?? { label: scene.type, dot: 'bg-slate-400' }
        const active = index === currentIndex
        const label =
          scene.type === 'interactive_lab'
            ? (scene.lab_title ?? 'Лаборатория')
            : scene.type === 'checkpoint'
              ? `Вопрос ${index + 1}`
              : (scene.title ?? meta.label)
        return (
          <button
            key={scene.id}
            onClick={() => onSelect(index)}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
              active
                ? 'bg-slate-200 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            <span className="truncate">{label}</span>
            {scene.type === 'interactive_lab' && <span className="ml-auto text-[10px]">⚡</span>}
          </button>
        )
      })}
    </nav>
  )
}
