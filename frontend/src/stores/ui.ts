import { create } from 'zustand'

/**
 * UI-состояние приложения.
 * Содержит только состояние интерфейса (тема) — без бизнес-логики.
 */

export type SectionId = 'today' | 'atlas' | 'focus' | 'studio' | 'system'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'datapath-theme'

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
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initial = initialTheme()
applyTheme(initial)

export const useUiStore = create<UiState>((set, get) => ({
  theme: initial,
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
}))
