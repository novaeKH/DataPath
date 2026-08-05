/**
 * API-клиент DataPath.
 *
 * Frontend не содержит бизнес-логики: здесь только HTTP-запросы к backend.
 * Все запросы идут через относительный путь /api (Vite/nginx проксируют в backend).
 */

export interface SystemStatus {
  status: string
  version: string
  environment: string
  database: {
    available: boolean
  }
  vault: {
    exists: boolean
    markdown_files: number
  }
  ollama: string
  chromadb: string
}

export interface ContentStatus {
  vault_files: number
  total_catalogued: number
  published: number
  by_type: Record<string, number>
  last_sync_at: string | null
  errors: number
  warnings: number
}

export interface CourseSummary {
  id: string
  title: string
  slug: string
  area: string | null
  difficulty: string | null
  estimated_hours: number | null
  accent: string | null
  icon: string | null
  module_count: number
  lesson_count: number
  practice_count: number
}

export interface AtlasNode {
  id: string
  label: string
  type: string
  area: string | null
  publish: boolean
  status: string
  course_id: string | null
  module_id: string | null
  x: number
  y: number
}

export interface AtlasEdge {
  source: string
  target: string
  relation: string
  kind: string
}

export interface AtlasData {
  nodes: AtlasNode[]
  edges: AtlasEdge[]
  prerequisites: AtlasEdge[]
  areas: string[]
  node_types: string[]
  routes: Record<string, { modules: string[]; lessons: Record<string, string[]>; cases: string[] }>
  layout: {
    width: number
    height: number
    mode: string
  }
}

export interface ContentItem {
  id: string
  path: string
  type: string
  title: string
  slug: string
  area: string | null
  status: string | null
  language: string | null
  publish: boolean
  rag: string | null
  rag_collection: string | null
  course_id: string | null
  module_id: string | null
  module_order: number | null
  lesson_order: number | null
  content_path: string | null
  practice_kind: string | null
  skill_ids: string[] | null
  difficulty: string | null
  estimated_minutes: number | null
  estimated_hours: number | null
  accent: string | null
  icon: string | null
  aliases: string[] | null
  tags: string[] | null
  prerequisites: string[] | null
  validation_status: string
  issues: { severity: string; code: string; message: string }[]
  links: {
    outgoing: { target_id: string; relation: string; kind: string }[]
    incoming: { source_id: string; relation: string; kind: string }[]
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal })
  if (!response.ok) {
    throw new Error(`Backend вернул HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Backend вернул HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  return request<SystemStatus>('/api/system/status', signal)
}

export async function fetchContentStatus(signal?: AbortSignal): Promise<ContentStatus> {
  return request<ContentStatus>('/api/content/status', signal)
}

export async function fetchCourses(signal?: AbortSignal): Promise<CourseSummary[]> {
  const data = await request<{ courses: CourseSummary[] }>('/api/content/courses', signal)
  return data.courses
}

export async function fetchContentItem(id: string, signal?: AbortSignal): Promise<ContentItem> {
  return request<ContentItem>(`/api/content/items/${encodeURIComponent(id)}`, signal)
}

export async function fetchAtlas(signal?: AbortSignal): Promise<AtlasData> {
  return request<AtlasData>('/api/atlas', signal)
}

// --- Фаза 3: курсы, уроки, сцены, лаборатории ---

export interface LessonRef {
  id: string
  title: string
  lesson_order: number | null
  estimated_minutes: number | null
  difficulty: string | null
  skills: string[]
  laboratory_ids: string[]
}

export interface CourseModule {
  id: string
  title: string
  order: number | null
  estimated_minutes: number | null
  lessons: LessonRef[]
}

export interface CourseCaseRef {
  id: string
  title: string
  practice_kind: string | null
  estimated_minutes: number | null
  difficulty: string | null
}

export interface CourseDetail {
  id: string
  title: string
  slug: string
  area: string | null
  difficulty: string | null
  estimated_hours: number | null
  accent: string | null
  icon: string | null
  modules: CourseModule[]
  cases: CourseCaseRef[]
  first_lesson_id: string | null
  last_lesson_id: string | null
}

export interface LessonScene {
  id: string
  type: 'markdown' | 'formula' | 'code' | 'callout' | 'checkpoint' | 'interactive_lab'
  title?: string | null
  markdown?: string | null
  formula?: string | null
  explanation?: string | null
  language?: string | null
  code?: string | null
  caption?: string | null
  callout_type?: string | null
  question?: string | null
  lab_id?: string | null
  lab_title?: string | null
}

export interface LessonMaterialRef {
  id: string
  title: string
  type: string
  path: string
}

export interface LessonDetail {
  id: string
  title: string
  slug: string
  module: { id: string; title: string; order: number | null } | null
  course: { id: string; title: string } | null
  estimated_minutes: number | null
  difficulty: string | null
  skills: string[]
  previous_lesson_id: string | null
  next_lesson_id: string | null
  scenes: LessonScene[]
  laboratory_ids: string[]
  materials: LessonMaterialRef[]
}

export interface LabParameter {
  name: string
  label: string
  type: 'number' | 'enum'
  default: string | number
  min?: number
  max?: number
  step?: number
  values?: string[]
  unit?: string
}

export interface LabSpec {
  id: string
  title: string
  description: string
  lesson_ids: string[]
  parameters: LabParameter[]
  defaults: Record<string, string | number>
  initial_result: Record<string, unknown>
}

export interface LabRunResult {
  [key: string]: unknown
}

export async function fetchCourseDetail(
  courseId: string,
  signal?: AbortSignal,
): Promise<CourseDetail> {
  return request<CourseDetail>(`/api/content/courses/${encodeURIComponent(courseId)}`, signal)
}

export async function fetchLesson(lessonId: string, signal?: AbortSignal): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/content/lessons/${encodeURIComponent(lessonId)}`, signal)
}

export async function fetchLabSpec(labId: string, signal?: AbortSignal): Promise<LabSpec> {
  return request<LabSpec>(`/api/labs/${encodeURIComponent(labId)}`, signal)
}

export async function runLab(
  labId: string,
  parameters: Record<string, string | number>,
): Promise<LabRunResult> {
  return postJson<LabRunResult>(`/api/labs/${encodeURIComponent(labId)}/run`, { parameters })
}

// --- Фаза 4: прогресс, Today, кейсы ---

export interface SkillAxisState {
  alpha: number
  beta: number
  evidence_count: number
  score: number
}

export interface SkillOverview {
  skill_id: string
  state: SkillState
  confidence: number
  evidence_count: number
  axes: Record<string, SkillAxisState>
  weak: boolean
  level?: string
}

export type SkillState = 'not_started' | 'exploring' | 'developing' | 'strong' | 'needs_attention'

export interface SkillDetail extends SkillOverview {
  state_reason: string
  levels: Record<string, string>
  typical_errors: {
    error_code: string
    axis: string | null
    count: number
    examples: string[]
  }[]
  recent_events: RecentEvent[]
}

export interface RecentEvent {
  id: number
  event_type: string
  source_type: string
  source_id: string
  skill_id: string | null
  outcome: string | null
  score: number | null
  hints_used: number
  attempts: number
  error_code: string | null
  created_at: string
}

export interface LessonProgressDetail {
  lesson_id: string
  current_scene_id: string | null
  completed_scenes: string[]
  started_at: string
  completed_at: string | null
  updated_at: string
}

export interface SceneCompleteResult {
  lesson_id: string
  scene_id: string
  current_scene_id: string | null
  completed_scenes: string[]
  started_at: string
  completed_at: string | null
  event_id: number
}

export interface LabRecordResult {
  lab_id: string
  lesson_id: string | null
  score: number
  created_at: string
  deduplicated: boolean
  evidence: { skill_id: string; state: string; evidence_count: number }[]
}

export interface RecommendedAction {
  action: 'continue_lesson' | 'next_lesson' | 'weak_skill' | 'explore'
  lesson_id?: string
  current_scene_id?: string | null
  title?: string
  skill_id?: string
  message?: string
}

export interface ProgressSummary {
  lessons_started: number
  lessons_completed: number
  labs_completed: number
  cases_completed: number
  skill_distribution: Record<string, number>
  recent_events: RecentEvent[]
  recommended_action: RecommendedAction
}

export interface WeakSkill {
  skill_id: string
  state: SkillState
  evidence_count: number
  axes: Record<string, SkillAxisState>
}

export interface SuggestedCase {
  case_id: string
  title: string
}

export interface TodayData {
  continue_lesson: {
    lesson_id: string
    title: string
    current_scene_id: string | null
    completed_scenes: string[]
    started_at: string
  } | null
  next_lesson: { id: string; title: string; skills: string[] } | null
  weak_skills: WeakSkill[]
  recent_activity: RecentEvent[]
  suggested_case: SuggestedCase | null
  progress_summary: ProgressSummary
}

export interface CaseQuestion {
  id: string
  type: 'single' | 'multiple' | 'numeric' | 'select' | 'order'
  prompt: string
  options: string[]
  weight: number
  topic: string | null
  hint?: string
  interview_prompt?: string
}

export interface CaseSpec {
  id: string
  title: string
  content_id: string
  description: string
  practice_kind: string
  lesson_ids: string[]
  skill_ids: string[]
  estimated_minutes: number | null
  difficulty: string | null
  intro: string
  conclusion: string
  mode: string
  questions: CaseQuestion[]
}

export interface CaseQuestionResult {
  question_id: string
  topic: string | null
  type: string
  score: number
  correct: boolean
  explanation: string
  your_answer: unknown
}

export interface CaseSubmitResult {
  case_id: string
  mode: string
  total_score: number
  passed: boolean
  question_results: CaseQuestionResult[]
  error_codes: string[]
  summary: string
  conclusion: string
  attempt_id: number
  evidence: {
    skill_id: string
    state: string
    state_reason: string
    evidence_count: number
    deduplicated: boolean
  }[]
}

export interface CaseAttemptRow {
  id: number
  case_id: string
  mode: string
  answers: Record<string, unknown>
  result: CaseSubmitResult
  completed_at: string
}

export async function fetchProgressSummary(signal?: AbortSignal): Promise<ProgressSummary> {
  return request<ProgressSummary>('/api/progress/summary', signal)
}

export async function fetchSkills(signal?: AbortSignal): Promise<SkillOverview[]> {
  const data = await request<{ skills: SkillOverview[] }>('/api/progress/skills', signal)
  return data.skills
}

export async function fetchSkill(skillId: string, signal?: AbortSignal): Promise<SkillDetail> {
  return request<SkillDetail>(`/api/progress/skills/${encodeURIComponent(skillId)}`, signal)
}

export async function fetchLessonProgress(
  lessonId: string,
  signal?: AbortSignal,
): Promise<LessonProgressDetail | null> {
  try {
    return await request<LessonProgressDetail>(
      `/api/progress/lessons/${encodeURIComponent(lessonId)}`,
      signal,
    )
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null
    throw err
  }
}

export async function completeScene(
  lessonId: string,
  sceneId: string,
  body: { skill_id?: string; scene_type?: string; outcome?: string } = {},
): Promise<SceneCompleteResult> {
  return postJson<SceneCompleteResult>(
    `/api/progress/lessons/${encodeURIComponent(lessonId)}/scenes/${encodeURIComponent(sceneId)}/complete`,
    body,
  )
}

export async function completeLesson(
  lessonId: string,
): Promise<{ lesson_id: string; completed_at: string; skills: unknown[] }> {
  return postJson(`/api/progress/lessons/${encodeURIComponent(lessonId)}/complete`, {})
}

export async function recordLab(
  labId: string,
  body: {
    lesson_id?: string
    parameters: Record<string, unknown>
    result_summary?: Record<string, unknown>
    score?: number
  },
): Promise<LabRecordResult> {
  return postJson<LabRecordResult>(`/api/progress/labs/${encodeURIComponent(labId)}/record`, body)
}

export async function fetchToday(signal?: AbortSignal): Promise<TodayData> {
  return request<TodayData>('/api/today', signal)
}

export async function fetchCases(mode = 'standard', signal?: AbortSignal): Promise<CaseSpec[]> {
  const data = await request<{ cases: CaseSpec[] }>(`/api/cases?mode=${mode}`, signal)
  return data.cases
}

export async function fetchCase(
  caseId: string,
  mode = 'standard',
  signal?: AbortSignal,
): Promise<CaseSpec> {
  return request<CaseSpec>(
    `/api/cases/${encodeURIComponent(caseId)}?mode=${encodeURIComponent(mode)}`,
    signal,
  )
}

export async function submitCase(
  caseId: string,
  mode: string,
  answers: Record<string, unknown>,
): Promise<CaseSubmitResult> {
  return postJson<CaseSubmitResult>(`/api/cases/${encodeURIComponent(caseId)}/submit`, {
    mode,
    answers,
  })
}

export async function fetchCaseAttempts(
  caseId: string,
  signal?: AbortSignal,
): Promise<CaseAttemptRow[]> {
  const data = await request<{ case_id: string; attempts: CaseAttemptRow[] }>(
    `/api/cases/${encodeURIComponent(caseId)}/attempts`,
    signal,
  )
  return data.attempts
}
