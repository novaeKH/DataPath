import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUiStore } from '../stores/ui'

const SECTIONS: { to: string; label: string; soon?: boolean }[] = [
  { to: '/today', label: 'Today' },
  { to: '/atlas', label: 'Atlas' },
  { to: '/focus', label: 'Focus' },
  { to: '/studio', label: 'Studio' },
  { to: '/system', label: 'Статус системы' },
]

export function Sidebar() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-slate-950">
          DP
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            DataPath
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-500">учебная платформа DS</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              `relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-slate-200/80 dark:bg-slate-800"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{section.label}</span>
                {section.soon && (
                  <span className="relative rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                    Фаза 2
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
        <span className="text-[11px] text-slate-500 dark:text-slate-600">
          Фаза 4 · знания и прогресс
        </span>
        <button
          onClick={toggleTheme}
          aria-label="Переключить тему"
          className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}
        </button>
      </div>
    </aside>
  )
}
