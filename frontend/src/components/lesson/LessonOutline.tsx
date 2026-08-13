import type { LessonScene } from '../../lib/api'

const TYPE_META: Record<string, { label: string; dot: string }> = {
  markdown: { label: 'Теория', dot: 'bg-slate-400' },
  formula: { label: 'Формула', dot: 'bg-violet-400' },
  code: { label: 'Код', dot: 'bg-sky-400' },
  callout: { label: 'Важно', dot: 'bg-amber-400' },
  checkpoint: { label: 'Проверка', dot: 'bg-indigo-400' },
  interactive_lab: { label: 'Лаборатория', dot: 'bg-emerald-400' },
  visual_demo: { label: 'Визуализация', dot: 'bg-violet-400' },
  visual: { label: 'Иллюстрация', dot: 'bg-violet-400' },
  table: { label: 'Таблица', dot: 'bg-cyan-400' },
}

const SPECIAL_TYPES = new Set(['checkpoint', 'interactive_lab', 'visual_demo'])
const MAX_OUTLINE_ENTRIES = 12

function outlineEntries(scenes: LessonScene[]): { scene: LessonScene; index: number }[] {
  const seenLabels = new Set<string>()
  const candidates = scenes.flatMap((scene, index) => {
    const label = scene.display_title ?? scene.source_heading ?? scene.title ?? null
    if (SPECIAL_TYPES.has(scene.type)) return [{ scene, index }]
    if (!label || seenLabels.has(label)) return []
    seenLabels.add(label)
    return [{ scene, index }]
  })
  if (candidates.length <= MAX_OUTLINE_ENTRIES) return candidates

  const special = candidates.filter(({ scene }) => SPECIAL_TYPES.has(scene.type))
  const prose = candidates.filter(({ scene }) => !SPECIAL_TYPES.has(scene.type))
  const slots = Math.max(2, MAX_OUTLINE_ENTRIES - special.length)
  const selected = new Map<number, { scene: LessonScene; index: number }>()
  for (let position = 0; position < slots; position += 1) {
    const candidate = prose[Math.round((position * (prose.length - 1)) / (slots - 1))]
    if (candidate) selected.set(candidate.index, candidate)
  }
  for (const candidate of special) selected.set(candidate.index, candidate)
  return [...selected.values()].sort((left, right) => left.index - right.index).slice(0, 12)
}

/** Компактное содержание разделов урока с навигацией и прогрессом. */
export function LessonOutline({
  scenes,
  currentIndex,
  completedScenes,
  onSelect,
}: {
  scenes: LessonScene[]
  currentIndex: number
  completedScenes?: string[]
  onSelect: (index: number) => void
}) {
  const completed = new Set(completedScenes ?? [])
  let checkpointNumber = 0
  const entries = outlineEntries(scenes)
  return (
    <nav aria-label="Разделы урока" className="flex flex-col gap-1">
      {entries.map(({ scene, index }) => {
        const meta = TYPE_META[scene.type] ?? { label: scene.type, dot: 'bg-slate-400' }
        const active = index === currentIndex
        const done = completed.has(scene.id)
        const label =
          scene.type === 'interactive_lab'
            ? (scene.lab_title ?? 'Лаборатория')
            : scene.type === 'visual_demo'
              ? (scene.title ?? 'Интерактивная визуализация')
              : scene.type === 'checkpoint'
                ? `Проверка ${++checkpointNumber}`
                : (scene.display_title ?? scene.title ?? meta.label)
        return (
          <button
            key={scene.id}
            onClick={() => onSelect(index)}
            title={label}
            aria-current={active ? 'step' : undefined}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
              active
                ? 'bg-slate-200 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-emerald-500' : meta.dot}`}
            />
            <span
              className={`line-clamp-2 min-w-0 leading-snug ${done ? 'text-emerald-700 dark:text-emerald-300' : ''}`}
            >
              {label}
            </span>
            {done && <span className="ml-auto text-[10px] text-emerald-500">✓</span>}
            {scene.type === 'interactive_lab' && <span className="ml-auto text-[10px]">⚡</span>}
          </button>
        )
      })}
    </nav>
  )
}
