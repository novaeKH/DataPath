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
const MAX_LABEL_LENGTH = 68

type OutlineEntry = { scene: LessonScene; index: number; label: string }

function compactLabel(value: string): string {
  const clean = value
    .replace(/^#{1,4}\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\to/g, '→')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > MAX_LABEL_LENGTH
    ? `${clean.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`
    : clean
}

function specialLabel(scene: LessonScene, checkpointNumber: number): string {
  if (scene.type === 'interactive_lab') return scene.lab_title ?? 'Лаборатория'
  if (scene.type === 'visual_demo') return scene.title ?? 'Интерактивная визуализация'
  if (scene.type === 'checkpoint') return `Проверка ${checkpointNumber}`
  return scene.source_heading ?? scene.display_title ?? scene.title ?? 'Материал'
}

function outlineEntries(scenes: LessonScene[]): OutlineEntry[] {
  const seenLabels = new Set<string>()
  const hasAuthoredSections = scenes.some((scene) => Boolean(scene.source_heading))
  let checkpointNumber = 0
  const candidates = scenes.flatMap((scene, index) => {
    if (SPECIAL_TYPES.has(scene.type)) {
      if (scene.type === 'checkpoint') checkpointNumber += 1
      return [{ scene, index, label: specialLabel(scene, checkpointNumber) }]
    }
    // В canonical-уроках source_heading соответствует настоящему H2 автора. Не добавляем
    // в содержание подписи, сгенерированные из первого предложения соседней сцены: они
    // выглядят как обрезанные дубли и вытесняют полезные разделы. Первый scene остаётся
    // точкой входа («После урока вы сможете»); для старых уроков без H2 сохраняем fallback.
    if (hasAuthoredSections && index > 0 && !scene.source_heading) return []
    const label = scene.source_heading ?? scene.display_title ?? scene.title ?? null
    if (!label || seenLabels.has(label)) return []
    seenLabels.add(label)
    return [{ scene, index, label }]
  })
  if (candidates.length <= MAX_OUTLINE_ENTRIES) return candidates

  const special = candidates.filter(({ scene }) => SPECIAL_TYPES.has(scene.type))
  const prose = candidates.filter(({ scene }) => !SPECIAL_TYPES.has(scene.type))
  const slots = Math.max(2, MAX_OUTLINE_ENTRIES - special.length)
  const selected = new Map<number, OutlineEntry>()
  for (let position = 0; position < slots; position += 1) {
    // Сохраняем и вводную, и первый настоящий раздел. Остальные позиции равномерно
    // распределяем до конца урока, чтобы оглавление отражало маршрут, а не случайную выборку.
    const prosePosition =
      position === 0
        ? 0
        : slots === 2
          ? prose.length - 1
          : Math.round(1 + ((position - 1) * (prose.length - 2)) / (slots - 2))
    const candidate = prose[prosePosition]
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
  const entries = outlineEntries(scenes)
  return (
    <nav aria-label="Разделы урока" className="flex flex-col gap-1">
      {entries.map(({ scene, index, label: fullLabel }) => {
        const meta = TYPE_META[scene.type] ?? { label: scene.type, dot: 'bg-slate-400' }
        const currentScene = scenes[currentIndex]
        const sourceHeading = scene.source_heading ?? null
        const active =
          index === currentIndex ||
          (!SPECIAL_TYPES.has(scene.type) &&
            sourceHeading !== null &&
            sourceHeading === currentScene?.source_heading)
        const sectionScenes = sourceHeading
          ? scenes.filter((candidate) => candidate.source_heading === sourceHeading)
          : [scene]
        const done = sectionScenes.every((candidate) => completed.has(candidate.id))
        const label = compactLabel(fullLabel || meta.label)
        return (
          <button
            key={scene.id}
            onClick={() => onSelect(index)}
            title={fullLabel}
            aria-current={active ? 'step' : undefined}
            className={`dp-outline-link flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition ${active ? 'is-active font-semibold' : ''}`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-emerald-500' : meta.dot}`}
            />
            <span
              className="line-clamp-2 min-w-0 leading-snug"
              style={{ color: done ? 'var(--dp-success)' : undefined }}
            >
              {label}
            </span>
            {done && (
              <span className="ml-auto text-[10px]" style={{ color: 'var(--dp-success)' }}>
                ✓
              </span>
            )}
            {scene.type === 'interactive_lab' && <span className="ml-auto text-[10px]">⚡</span>}
          </button>
        )
      })}
    </nav>
  )
}
