import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useUiStore } from '../stores/ui'
import {
  AtlasIcon,
  FocusIcon,
  LearnIcon,
  MoonIcon,
  ReviewIcon,
  RoadmapIcon,
  StudioIcon,
  SunIcon,
  SystemIcon,
  TodayIcon,
} from './ui/icons'

const DIRECTIONS = [
  ['Python', 'course.python-ds'],
  ['NumPy & pandas', 'course.data-analysis'],
  ['SQL & sklearn', 'course.data-tools'],
  ['Математика', 'course.math-ds'],
  ['Classic ML', 'course.classic-ml'],
  ['Deep Learning', 'course.deep-learning'],
  ['NLP', 'course.nlp'],
  ['LLM / RAG', 'course.llm-rag'],
  ['MLOps', 'course.mlops'],
] as const

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
      className="flex h-9 w-9 items-center justify-center rounded-xl dp-hover-interactive"
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
      aria-label="DataPath — Сегодня"
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="shrink-0">
        <rect width="30" height="30" rx="9" fill="var(--dp-accent)" />
        <path d="M8 20V10l7 5-7 5z" fill="var(--dp-surface)" />
        <path d="M15 20V10l7 5-7 5z" fill="var(--dp-surface)" fillOpacity="0.55" />
      </svg>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">DataPath</div>
          <div className="text-[10px]" style={{ color: 'var(--dp-text-muted)' }}>
            локальное обучение
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
  end,
}: {
  to: string
  label: string
  Icon: typeof TodayIcon
  collapsed: boolean
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `dp-sidebar-link ${isActive ? 'is-active' : ''}`}
    >
      <Icon width={18} height={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const learningOpen = useUiStore((s) => s.learningNavOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleLearning = useUiStore((s) => s.toggleLearningNav)
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col transition-[width] duration-200 md:flex ${collapsed ? 'w-[72px]' : 'w-[248px]'}`}
        style={{
          background: 'var(--dp-sidebar-bg)',
          borderRight: '1px solid var(--dp-border-subtle)',
        }}
      >
        <div
          className={`flex items-center px-5 pb-4 pt-5 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
        >
          <Brand collapsed={collapsed} />
        </div>

        <nav aria-label="Основная навигация" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            <NavItem to="/today" label="Сегодня" Icon={TodayIcon} collapsed={collapsed} />
            <NavItem to="/learn" label="Курсы" Icon={LearnIcon} collapsed={collapsed} />
            <NavItem to="/roadmap" label="Мой путь" Icon={RoadmapIcon} collapsed={collapsed} />
            <NavItem to="/focus" label="Focus" Icon={FocusIcon} collapsed={collapsed} />
          </div>

          {!collapsed && (
            <div className="mt-5">
              <button
                onClick={toggleLearning}
                className="flex w-full items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'var(--dp-text-muted)' }}
                aria-expanded={learningOpen}
              >
                Обучение
                <span className={`transition-transform ${learningOpen ? 'rotate-90' : ''}`}>›</span>
              </button>
              {learningOpen && (
                <div
                  className="mt-2 space-y-0.5 border-l pl-3"
                  style={{ borderColor: 'var(--dp-border-subtle)' }}
                >
                  {DIRECTIONS.map(([label, id]) => (
                    <NavLink
                      key={id}
                      to={`/focus?course=${encodeURIComponent(id)}`}
                      className="block rounded-lg px-3 py-1.5 text-[12px] transition-colors dp-hover-interactive"
                      style={{ color: 'var(--dp-text-secondary)' }}
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 space-y-1">
            {!collapsed && <div className="dp-sidebar-group">Практика</div>}
            <NavItem to="/studio" label="Studio" Icon={StudioIcon} collapsed={collapsed} />
          </div>
          <div className="mt-5 space-y-1">
            {!collapsed && <div className="dp-sidebar-group">Повторение</div>}
            <NavItem to="/review" label="Review" Icon={ReviewIcon} collapsed={collapsed} />
          </div>
          <div className="mt-5 space-y-1">
            {!collapsed && <div className="dp-sidebar-group">Прогресс</div>}
            <NavItem to="/atlas" label="Карта знаний" Icon={AtlasIcon} collapsed={collapsed} />
          </div>
        </nav>

        <div
          className="flex items-center justify-between gap-2 border-t px-3 py-3"
          style={{ borderColor: 'var(--dp-border-subtle)' }}
        >
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className="flex h-9 w-9 items-center justify-center rounded-xl dp-hover-interactive"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            {collapsed ? '›' : '‹'}
          </button>
          {!collapsed && (
            <NavLink
              to="/system"
              className="flex flex-1 items-center gap-2 rounded-xl px-2 py-2 text-xs dp-hover-interactive"
              style={{ color: 'var(--dp-text-muted)' }}
            >
              <SystemIcon width={15} height={15} /> Настройки
            </NavLink>
          )}
          <ThemeToggle />
        </div>
      </aside>

      <header
        className="dp-mobile-header fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 backdrop-blur md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--dp-app-bg) 90%, transparent)',
          borderBottom: '1px solid var(--dp-border-subtle)',
        }}
      >
        <Brand collapsed={false} />
        <ThemeToggle />
      </header>

      <nav
        aria-label="Мобильная навигация"
        className="dp-mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 backdrop-blur md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--dp-app-bg) 94%, transparent)',
          borderTop: '1px solid var(--dp-border-subtle)',
        }}
      >
        <NavItem to="/today" label="Сегодня" Icon={TodayIcon} collapsed={false} />
        <NavItem to="/learn" label="Курсы" Icon={LearnIcon} collapsed={false} />
        <NavItem to="/studio" label="Studio" Icon={StudioIcon} collapsed={false} />
        <NavItem to="/review" label="Review" Icon={ReviewIcon} collapsed={false} />
        <button
          type="button"
          className="dp-sidebar-link flex-col justify-center gap-0.5 rounded-none px-1 text-[10px]"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <SystemIcon width={18} height={18} />
          Ещё
        </button>
      </nav>

      {moreOpen && (
        <div
          id="mobile-more-menu"
          className="dp-mobile-more fixed inset-x-3 z-50 rounded-2xl p-2 shadow-xl md:hidden dp-surface-elevated"
        >
          <NavLink to="/roadmap" className="dp-sidebar-link" onClick={() => setMoreOpen(false)}>
            <RoadmapIcon /> Мой путь
          </NavLink>
          <NavLink to="/focus" className="dp-sidebar-link" onClick={() => setMoreOpen(false)}>
            <FocusIcon /> Focus
          </NavLink>
          <NavLink to="/atlas" className="dp-sidebar-link" onClick={() => setMoreOpen(false)}>
            <AtlasIcon /> Карта знаний
          </NavLink>
          <NavLink to="/system" className="dp-sidebar-link" onClick={() => setMoreOpen(false)}>
            <SystemIcon /> Настройки и данные
          </NavLink>
        </div>
      )}
    </>
  )
}
