import { NavLink } from 'react-router-dom'
import { useUiStore } from '../stores/ui'
import {
  AtlasIcon,
  LearnIcon,
  MoonIcon,
  ReviewIcon,
  RoadmapIcon,
  StudioIcon,
  SunIcon,
  SystemIcon,
  TodayIcon,
} from './ui/icons'

function ThemeToggle() {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'
  const label = isDark ? 'Светлая тема' : 'Тёмная тема'
  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl dp-hover-interactive"
      style={{ color: 'var(--dp-text-muted)' }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <NavLink
      to="/today"
      className="flex min-w-0 items-center gap-3"
      aria-label="DataPath — Главная"
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="shrink-0">
        <rect width="34" height="34" rx="11" fill="var(--dp-accent)" />
        <path
          d="M9 23c2-7 5-12 9-12 3 0 3 6 7 6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="9" cy="23" r="2.4" fill="white" />
        <circle cx="18" cy="11" r="2.4" fill="white" />
        <circle cx="25" cy="17" r="2.4" fill="white" />
      </svg>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-[16px] font-bold tracking-[-0.025em]">DataPath</div>
          <div
            className="mt-0.5 text-[10px] font-medium tracking-wide"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            путь в Data Science
          </div>
        </div>
      )}
    </NavLink>
  )
}

function NavItem({
  to,
  label,
  Icon,
  collapsed,
}: {
  to: string
  label: string
  Icon: typeof TodayIcon
  collapsed: boolean
}) {
  const accessibleLabel =
    label === 'Учиться'
      ? 'Учиться · Курсы'
      : label === 'Практика'
        ? 'Практика · Studio'
        : label === 'Прогресс'
          ? 'Прогресс · Мой путь'
          : label
  return (
    <NavLink
      to={to}
      aria-label={accessibleLabel}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `dp-sidebar-link ${isActive ? 'is-active' : ''}`}
    >
      <Icon width={19} height={19} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

const PRIMARY_NAV = [
  ['/today', 'Главная', TodayIcon],
  ['/learn', 'Учиться', LearnIcon],
  ['/studio', 'Практика', StudioIcon],
  ['/review', 'Повторение', ReviewIcon],
  ['/roadmap', 'Прогресс', RoadmapIcon],
] as const

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  return (
    <>
      <aside
        className={`dp-sidebar hidden shrink-0 flex-col transition-[width] duration-200 md:flex ${collapsed ? 'w-[76px]' : 'w-[226px]'}`}
      >
        <div
          className={`flex items-center px-5 pb-8 pt-6 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Brand collapsed={collapsed} />
        </div>
        <nav aria-label="Основная навигация" className="flex-1 px-3">
          <div className="space-y-1">
            {PRIMARY_NAV.map(([to, label, Icon]) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} />
            ))}
          </div>
          <div className="mt-8 border-t pt-5" style={{ borderColor: 'var(--dp-border-subtle)' }}>
            {!collapsed && <p className="dp-sidebar-group">Дополнительно</p>}
            <NavItem to="/atlas" label="Карта знаний" Icon={AtlasIcon} collapsed={collapsed} />
          </div>
        </nav>
        <div
          className="flex items-center gap-1 border-t px-3 py-3"
          style={{ borderColor: 'var(--dp-border-subtle)' }}
        >
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className="flex h-10 w-10 items-center justify-center rounded-xl dp-hover-interactive"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            {collapsed ? '›' : '‹'}
          </button>
          {!collapsed && (
            <NavLink
              to="/system"
              className="flex h-10 flex-1 items-center gap-2 rounded-xl px-2 text-xs dp-hover-interactive"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              <SystemIcon width={16} height={16} /> Настройки
            </NavLink>
          )}
          <ThemeToggle />
        </div>
      </aside>
      <header className="dp-mobile-header fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 backdrop-blur-xl md:hidden">
        <Brand collapsed={false} />
        <ThemeToggle />
      </header>
      <nav
        aria-label="Мобильная навигация"
        className="dp-mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 backdrop-blur-xl md:hidden"
      >
        {PRIMARY_NAV.map(([to, label, Icon]) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={false} />
        ))}
      </nav>
    </>
  )
}
