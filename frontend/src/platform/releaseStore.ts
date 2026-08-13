export const LOCAL_STATE_SCHEMA_VERSION = 3
const STORAGE_KEY = 'datapath.local-state'

/** Legacy IDs changed by the canonical 100-lesson DataPath v2 corpus. */
export const CONTENT_V2_LESSON_ID_MIGRATION: Record<string, string> = {
  'lesson.python-ds.01': 'lesson.python-ds.02',
  'lesson.python-ds.08': 'lesson.python-ds.04',
  'lesson.python-ds.10': 'lesson.python-ds.07',
  'lesson.python-ds.12': 'lesson.python-ds.11',
  'lesson.data-analysis.07': 'lesson.data-analysis.09',
  'lesson.data-analysis.08': 'lesson.data-analysis.09',
  'lesson.data-analysis.10': 'lesson.data-analysis.04',
  'lesson.data-analysis.11': 'lesson.data-analysis.06',
  'lesson.data-analysis.12': 'lesson.data-analysis.09',
  'lesson.data-tools.sql-foundations': 'lesson.sql.select-where',
  'lesson.data-tools.sql-analytics': 'lesson.sql.patterns',
  'lesson.math-ds.svd': 'lesson.math.linear-transformations',
  'lesson.math-ds.ab-testing': 'lesson.math-ds.hypothesis',
  'lesson.deep-learning.11': 'lesson.deep-learning.10',
  'lesson.nlp.attention': 'lesson.nlp.bert-evaluation',
}

const MERGED_COMPLETION_REQUIREMENTS: Record<string, string[]> = {
  'lesson.python-ds.02': ['lesson.python-ds.02'],
  'lesson.python-ds.04': ['lesson.python-ds.04', 'lesson.python-ds.08'],
  'lesson.python-ds.07': ['lesson.python-ds.07', 'lesson.python-ds.10'],
  'lesson.python-ds.11': ['lesson.python-ds.11'],
  'lesson.data-analysis.04': ['lesson.data-analysis.04', 'lesson.data-analysis.10'],
  'lesson.data-analysis.06': ['lesson.data-analysis.06'],
  'lesson.data-analysis.09': ['lesson.data-analysis.09', 'lesson.data-analysis.12'],
  'lesson.math-ds.hypothesis': ['lesson.math-ds.hypothesis', 'lesson.math-ds.ab-testing'],
  'lesson.deep-learning.10': ['lesson.deep-learning.10', 'lesson.deep-learning.11'],
  'lesson.nlp.bert-evaluation': ['lesson.nlp.bert-evaluation'],
}

const PARTIAL_ONLY_TARGETS = new Set(['lesson.sql.patterns', 'lesson.math.linear-transformations'])

function mappedLessonId(lessonId: string): string | null {
  if (lessonId.startsWith('lesson.algorithms.')) return null
  return CONTENT_V2_LESSON_ID_MIGRATION[lessonId] ?? lessonId
}

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
  const state: LocalReleaseState = {
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
  if ((source.schema_version ?? 1) < 3) migrateContentV2State(state)
  return state
}

function mergeProgress(
  current: LocalLessonProgress | undefined,
  incoming: LocalLessonProgress,
  lessonId: string,
): LocalLessonProgress {
  if (!current) return { ...incoming, lesson_id: lessonId }
  const incomingIsNewer = incoming.updated_at > current.updated_at
  return {
    lesson_id: lessonId,
    current_scene_id: incomingIsNewer ? incoming.current_scene_id : current.current_scene_id,
    completed_scenes: [...new Set([...current.completed_scenes, ...incoming.completed_scenes])],
    started_at: current.started_at < incoming.started_at ? current.started_at : incoming.started_at,
    completed_at:
      current.completed_at && incoming.completed_at
        ? current.completed_at > incoming.completed_at
          ? current.completed_at
          : incoming.completed_at
        : (current.completed_at ?? incoming.completed_at),
    updated_at: incomingIsNewer ? incoming.updated_at : current.updated_at,
  }
}

function mapAttemptKey(key: string): string {
  const legacyId = Object.keys(CONTENT_V2_LESSON_ID_MIGRATION).find(
    (candidate) => key === candidate || key.startsWith(`${candidate}:`),
  )
  if (!legacyId) return key
  return `${CONTENT_V2_LESSON_ID_MIGRATION[legacyId]}${key.slice(legacyId.length)}`
}

function migrateObjectReferences(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(migrateObjectReferences)
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    const direct = mappedLessonId(value)
    if (direct !== value) return direct
    let rewritten = value
    for (const [legacyId, canonicalId] of Object.entries(CONTENT_V2_LESSON_ID_MIGRATION)) {
      rewritten = rewritten.replaceAll(legacyId, canonicalId)
    }
    return rewritten
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      migrateObjectReferences(item),
    ]),
  )
}

/** Conservative, idempotent old-content → canonical-content migration. */
function migrateContentV2State(state: LocalReleaseState): void {
  const oldProgress = state.lesson_progress
  const completedLegacy = new Set(
    Object.entries(oldProgress)
      .filter(([, progress]) => Boolean(progress.completed_at))
      .map(([lessonId]) => lessonId),
  )
  const lessonProgress: Record<string, LocalLessonProgress> = {}
  for (const [legacyId, progress] of Object.entries(oldProgress)) {
    const canonicalId = mappedLessonId(legacyId)
    if (!canonicalId) continue
    lessonProgress[canonicalId] = mergeProgress(lessonProgress[canonicalId], progress, canonicalId)
  }
  for (const [canonicalId, requirements] of Object.entries(MERGED_COMPLETION_REQUIREMENTS)) {
    const progress = lessonProgress[canonicalId]
    if (!progress || requirements.every((lessonId) => completedLegacy.has(lessonId))) continue
    progress.completed_at = null
    progress.completed_scenes = []
    progress.current_scene_id = 'scene-01'
  }
  for (const canonicalId of PARTIAL_ONLY_TARGETS) {
    const progress = lessonProgress[canonicalId]
    if (!progress) continue
    progress.completed_at = null
    progress.completed_scenes = []
    progress.current_scene_id = 'scene-01'
  }
  state.lesson_progress = lessonProgress

  const notes: Record<string, string> = {}
  for (const [legacyId, note] of Object.entries(state.notes)) {
    const canonicalId = mappedLessonId(legacyId) ?? legacyId
    if (!notes[canonicalId]) notes[canonicalId] = note
    else if (notes[canonicalId] !== note) {
      notes[canonicalId] += `\n\n---\nПеренесено из ${legacyId}:\n${note}`
    }
  }
  state.notes = notes

  state.assessment_attempts = Object.fromEntries(
    Object.entries(state.assessment_attempts).map(([key, attempt]) => [
      mapAttemptKey(key),
      attempt,
    ]),
  )
  state.review_items = Object.fromEntries(
    Object.entries(state.review_items)
      .filter(([, item]) => {
        const sourceId = String(item.source_lesson_id ?? item.source_content_id ?? '')
        return !sourceId.startsWith('lesson.algorithms.')
      })
      .map(([key, item]) => [key, migrateObjectReferences(item) as Record<string, unknown>]),
  )
  state.review_history = state.review_history.map(
    (item) => migrateObjectReferences(item) as Record<string, unknown>,
  )
  state.current_roadmap_position = state.current_roadmap_position
    ? mappedLessonId(state.current_roadmap_position)
    : null
  state.today_state = migrateObjectReferences(state.today_state) as Record<string, unknown>
}

export function loadLocalState(): LocalReleaseState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const state = migrateLocalState(parsed)
    const theme = window.localStorage.getItem('datapath-theme')
    if (theme === 'light' || theme === 'dark') state.settings.theme = theme
    state.settings.sidebar_collapsed =
      window.localStorage.getItem('datapath-sidebar-collapsed') === 'true'
    state.settings.learning_nav_open =
      window.localStorage.getItem('datapath-learning-nav-open') !== 'false'
    if (raw && parsed?.schema_version !== LOCAL_STATE_SCHEMA_VERSION) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
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
