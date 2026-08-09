export const LOCAL_STATE_SCHEMA_VERSION = 2
const STORAGE_KEY = 'datapath.local-state'

export interface LocalLessonProgress {
  lesson_id: string
  current_scene_id: string | null
  completed_scenes: string[]
  started_at: string
  completed_at: string | null
  updated_at: string
}

export interface LocalReleaseState {
  schema_version: number
  initialized_from_snapshot: boolean
  lesson_progress: Record<string, LocalLessonProgress>
  assessment_attempts: Record<string, { outcome: string; created_at: string }>
  mastery: Record<string, { score: number; evidence_count: number; updated_at: string }>
  completed_practice: string[]
  practice_history: Record<string, unknown>[]
  case_attempts: Record<string, unknown[]>
  review_items: Record<string, Record<string, unknown>>
  review_history: Record<string, unknown>[]
  notes: Record<string, string>
  settings: Record<string, string | number | boolean>
  current_roadmap_position: string | null
  today_state: Record<string, unknown>
}

export function emptyLocalState(): LocalReleaseState {
  return {
    schema_version: LOCAL_STATE_SCHEMA_VERSION,
    initialized_from_snapshot: false,
    lesson_progress: {},
    assessment_attempts: {},
    mastery: {},
    completed_practice: [],
    practice_history: [],
    case_attempts: {},
    review_items: {},
    review_history: [],
    notes: {},
    settings: {},
    current_roadmap_position: null,
    today_state: {},
  }
}

export function migrateLocalState(value: unknown): LocalReleaseState {
  if (!value || typeof value !== 'object') return emptyLocalState()
  const source = value as Partial<LocalReleaseState>
  if ((source.schema_version ?? 1) > LOCAL_STATE_SCHEMA_VERSION) {
    throw new Error('Backup создан более новой версией DataPath.')
  }
  return {
    schema_version: LOCAL_STATE_SCHEMA_VERSION,
    initialized_from_snapshot: Boolean(source.initialized_from_snapshot),
    lesson_progress:
      source.lesson_progress && typeof source.lesson_progress === 'object'
        ? source.lesson_progress
        : {},
    assessment_attempts:
      source.assessment_attempts && typeof source.assessment_attempts === 'object'
        ? source.assessment_attempts
        : {},
    mastery: source.mastery && typeof source.mastery === 'object' ? source.mastery : {},
    completed_practice: Array.isArray(source.completed_practice)
      ? [...new Set(source.completed_practice.filter((id): id is string => typeof id === 'string'))]
      : [],
    practice_history: Array.isArray(source.practice_history) ? source.practice_history : [],
    case_attempts:
      source.case_attempts && typeof source.case_attempts === 'object' ? source.case_attempts : {},
    review_items:
      source.review_items && typeof source.review_items === 'object' ? source.review_items : {},
    review_history: Array.isArray(source.review_history) ? source.review_history : [],
    notes: source.notes && typeof source.notes === 'object' ? source.notes : {},
    settings: source.settings && typeof source.settings === 'object' ? source.settings : {},
    current_roadmap_position:
      typeof source.current_roadmap_position === 'string' ? source.current_roadmap_position : null,
    today_state:
      source.today_state && typeof source.today_state === 'object' ? source.today_state : {},
  }
}

export function loadLocalState(): LocalReleaseState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const state = migrateLocalState(raw ? JSON.parse(raw) : null)
    const theme = window.localStorage.getItem('datapath-theme')
    if (theme === 'light' || theme === 'dark') state.settings.theme = theme
    state.settings.sidebar_collapsed =
      window.localStorage.getItem('datapath-sidebar-collapsed') === 'true'
    state.settings.learning_nav_open =
      window.localStorage.getItem('datapath-learning-nav-open') !== 'false'
    return state
  } catch {
    return emptyLocalState()
  }
}

export function saveLocalState(state: LocalReleaseState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  const theme = state.settings.theme
  if (theme === 'light' || theme === 'dark') window.localStorage.setItem('datapath-theme', theme)
  if (typeof state.settings.sidebar_collapsed === 'boolean') {
    window.localStorage.setItem(
      'datapath-sidebar-collapsed',
      String(state.settings.sidebar_collapsed),
    )
  }
  if (typeof state.settings.learning_nav_open === 'boolean') {
    window.localStorage.setItem(
      'datapath-learning-nav-open',
      String(state.settings.learning_nav_open),
    )
  }
  window.dispatchEvent(new CustomEvent('datapath-local-state-changed'))
}

export function localNote(contentId: string): string {
  return loadLocalState().notes[contentId] ?? ''
}

export function saveLocalNote(contentId: string, note: string): void {
  mutateLocalState((state) => {
    const value = note.trimEnd()
    if (value) state.notes[contentId] = value
    else delete state.notes[contentId]
  })
}

export function replaceLocalState(value: unknown): LocalReleaseState {
  const state = migrateLocalState(value)
  saveLocalState(state)
  return state
}

export function mutateLocalState(mutator: (state: LocalReleaseState) => void): LocalReleaseState {
  const state = loadLocalState()
  mutator(state)
  saveLocalState(state)
  return state
}
