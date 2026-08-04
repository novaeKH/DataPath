import { create } from 'zustand'

/**
 * UI-состояние приложения.
 * Содержит только состояние интерфейса (активный раздел) — без бизнес-логики.
 */

export type SectionId = 'system' | 'today' | 'atlas' | 'focus' | 'studio'

interface UiState {
  activeSection: SectionId
  setActiveSection: (section: SectionId) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeSection: 'system',
  setActiveSection: (activeSection) => set({ activeSection }),
}))
