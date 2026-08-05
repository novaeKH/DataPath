import { NavLink } from 'react-router-dom'
import { useUiStore } from '../stores/ui'
import {
  AtlasIcon,
  FocusIcon,
  MoonIcon,
  ReviewIcon,
  StudioIcon,
  SunIcon,
  SystemIcon,
  TodayIcon,
} from './ui/icons'

const MAIN_NAV: { to: string; label: string; Icon: typeof TodayIcon }[] = [
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/focus', label: 'Focus', Icon: FocusIcon },
  { to: '/review', label: 'Review', Icon: ReviewIcon },
  { to: '/studio', label: 'Studio', Icon: StudioIcon },
  { to: '/atlas', label: 'Atlas', Icon: AtlasIcon },
]

const SECONDARY_NAV = [
  { to: '/system', label: 'Статус', Icon: SystemIcon },
]

function ThemeToggle() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'
  const label = isDark ? 'Светлая тема' : 'Тёмная тема'
  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors dp-hover-interactive"
      style={{ color: 'var(--dp-text-muted)' }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden w-[220px] shrink-0 flex-col md:flex"
        style={{
          background: 'var(--dp-surface)',
          borderRight: '1px solid var(--dp-border-subtle)',
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="var(--dp-accent)" />
              <path d="M7 19V9l7 5-7 5z" fill="var(--dp-surface)" />
              <path d="M14 19V9l7 5-7 5z" fill="var(--dp-surface)" fillOpacity="0.6" />
            </svg>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--dp-text-primary)' }}>
                DataPath
              </div>
              <div className="text-[10px]" style={{ color: 'var(--dp-text-muted)' }}>
                DS learning
              </div>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <nav aria-label="Основная навигация" className="flex-1 px-3 py-1 space-y-0.5">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive ? '' : 'dp-hover-interactive'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                background: isActive ? 'var(--dp-accent-subtle)' : 'transparent',
              })}
            >
              <item.Icon
                width={18}
                height={18}
                className="shrink-0"
                style={{ opacity: 0.9 }}
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Secondary items */}
        <div className="px-3 pb-1 space-y-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 dp-hover-interactive"
              style={({ isActive }) => ({
                color: isActive ? 'var(--dp-text-primary)' : 'var(--dp-text-muted)',
              })}
            >
              <item.Icon width={16} height={16} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--dp-border-subtle)' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--dp-text-muted)' }}>
            v0.1
          </span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between px-4 backdrop-blur md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--dp-surface) 94%, transparent)',
          borderBottom: '1px solid var(--dp-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="var(--dp-accent)" />
            <path d="M7 19V9l7 5-7 5z" fill="var(--dp-surface)" />
            <path d="M14 19V9l7 5-7 5z" fill="var(--dp-surface)" fillOpacity="0.6" />
          </svg>
          <span className="text-sm font-bold" style={{ color: 'var(--dp-text-primary)' }}>
            DataPath
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Навигация"
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch backdrop-blur md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--dp-surface) 96%, transparent)',
          borderTop: '1px solid var(--dp-border-subtle)',
        }}
      >
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
            style={({ isActive }) => ({
              color: isActive ? 'var(--dp-accent)' : 'var(--dp-text-muted)',
            })}
          >
            <item.Icon width={20} height={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
