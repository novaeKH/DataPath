import { create } from 'zustand'

/**
 * UI-состояние приложения.
 * Содержит только состояние интерфейса — без бизнес-логики.
 */

export type SectionId = 'today' | 'atlas' | 'focus' | 'studio' | 'system'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'datapath-theme'
const SIDEBAR_KEY = 'datapath-sidebar-collapsed'
const LEARNING_NAV_KEY = 'datapath-learning-nav-open'

function initialTheme(): Theme {
  if (typeof window === 'undefined' || !window.localStorage) return 'dark'
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.add('theme-transition')
}

interface UiState {
  theme: Theme
  sidebarCollapsed: boolean
  learningNavOpen: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  toggleLearningNav: () => void
}

const initial = initialTheme()
applyTheme(initial)

export const useUiStore = create<UiState>((set, get) => ({
  theme: initial,
  sidebarCollapsed:
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(SIDEBAR_KEY) === 'true'
      : false,
  learningNavOpen:
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(LEARNING_NAV_KEY) !== 'false'
      : true,
  setTheme: (theme) => {
    applyTheme(theme)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_KEY, theme)
    }
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    window.localStorage?.setItem(SIDEBAR_KEY, String(next))
    set({ sidebarCollapsed: next })
  },
  toggleLearningNav: () => {
    const next = !get().learningNavOpen
    window.localStorage?.setItem(LEARNING_NAV_KEY, String(next))
    set({ learningNavOpen: next })
  },
}))
