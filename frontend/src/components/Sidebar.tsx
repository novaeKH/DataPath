import { motion } from 'framer-motion'
import { useUiStore, type SectionId } from '../stores/ui'

const SECTIONS: { id: SectionId; label: string; soon?: boolean }[] = [
  { id: 'system', label: 'Статус системы' },
  { id: 'today', label: 'Today', soon: true },
  { id: 'atlas', label: 'Atlas', soon: true },
  { id: 'focus', label: 'Focus', soon: true },
  { id: 'studio', label: 'Studio', soon: true },
]

export function Sidebar() {
  const activeSection = useUiStore((s) => s.activeSection)
  const setActiveSection = useUiStore((s) => s.setActiveSection)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/50">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-slate-950">
          DP
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-slate-100">DataPath</div>
          <div className="text-[11px] text-slate-500">учебная платформа DS</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {SECTIONS.map((section) => {
          const active = section.id === activeSection
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-slate-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{section.label}</span>
              {section.soon && (
                <span className="relative rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Фаза 2
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4 text-[11px] text-slate-600">
        Фаза 1 · каркас
      </div>
    </aside>
  )
}
