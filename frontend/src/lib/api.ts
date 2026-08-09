/**
 * API-клиент DataPath.
 *
 * Frontend не содержит бизнес-логики: здесь только HTTP-запросы к backend.
 * По умолчанию запросы идут через /api (Vite/nginx проксируют в backend).
 * VITE_API_BASE_URL позволяет desktop/PWA-клиенту обращаться к отдельному backend.
 */

import { isPackagedRuntime, localPost, localRead } from '../platform/localApi'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const IS_RELEASE_BUILD = import.meta.env.MODE === 'production'

function usesLocalReleaseRuntime(): boolean {
  return isPackagedRuntime() || (IS_RELEASE_BUILD && API_BASE === '')
}

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

const OFFLINE_CACHE_PREFIX = 'datapath-read-cache:'

function canCacheRead(path: string): boolean {
  return (
    path.startsWith('/api/content/') ||
    path === '/api/atlas' ||
    path === '/api/roadmap' ||
    path.startsWith('/api/reviews/queue') ||
    path.startsWith('/api/reviews/summary')
  )
}

function reportApiConnectivity(online: boolean) {
  window.dispatchEvent(new CustomEvent('datapath-api-connectivity', { detail: { online } }))
}

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
  mastery_percent?: number
  review_due?: boolean
  review_due_count?: number
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
  if (usesLocalReleaseRuntime()) {
    reportApiConnectivity(true)
    return localRead<T>(path)
  }
  try {
    const response = await fetch(apiUrl(path), { signal })
    if (!response.ok) {
      throw new Error(`Backend вернул HTTP ${response.status}`)
    }
    const payload = (await response.json()) as T
    if (canCacheRead(path)) {
      window.localStorage?.setItem(
        `${OFFLINE_CACHE_PREFIX}${path}`,
        JSON.stringify({ cached_at: new Date().toISOString(), payload }),
      )
    }
    reportApiConnectivity(true)
    return payload
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (canCacheRead(path)) {
      const cached = window.localStorage?.getItem(`${OFFLINE_CACHE_PREFIX}${path}`)
      if (cached) {
        reportApiConnectivity(false)
        return (JSON.parse(cached) as { payload: T }).payload
      }
    }
    if (!IS_RELEASE_BUILD) throw error
    try {
      reportApiConnectivity(false)
      return await localRead<T>(path)
    } catch {
      throw error
    }
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (usesLocalReleaseRuntime()) return localPost<T>(path, body)
  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null
      throw new Error(payload?.detail ?? `Backend вернул HTTP ${response.status}`)
    }
    return (await response.json()) as T
  } catch (error) {
    if (!IS_RELEASE_BUILD) throw error
    try {
      return await localPost<T>(path, body)
    } catch {
      throw error
    }
  }
}

export async function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  return request<SystemStatus>('/api/system/status', signal)
}

export interface BackupPayload {
  format: 'datapath-learning-state'
  version: number
  exported_at: string
  checksum: string
  tables: Record<string, Record<string, unknown>[]>
}

export async function exportBackup(): Promise<BackupPayload> {
  return request<BackupPayload>('/api/system/backup')
}

export async function restoreBackup(
  payload: BackupPayload,
): Promise<{ status: string; rows: Record<string, number> }> {
  return postJson('/api/system/restore', payload)
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

export type RoadmapLessonStatus = 'available' | 'learning' | 'completed'

export interface RoadmapLesson {
  id: string
  title: string
  estimated_minutes: number | null
  status: RoadmapLessonStatus
  mastery_percent: number
}

export interface RoadmapModule {
  id: string
  title: string
  course_id: string
  course_title: string
  source_provider: string
  order: number
  lessons: RoadmapLesson[]
}

export interface RoadmapStage {
  id: 'orientation' | 'understanding' | 'application'
  number: number
  title: string
  short_title: string
  description: string
  depth: 'orientation' | 'understanding' | 'application'
  modules: RoadmapModule[]
  lesson_count: number
  completed_lessons: number
  progress_percent: number
  status: RoadmapLessonStatus
}

export interface RoadmapData {
  stages: RoadmapStage[]
  total_lessons: number
  completed_lessons: number
  current_lesson: RoadmapLesson | null
  current_stage: Pick<RoadmapStage, 'id' | 'number' | 'title' | 'depth' | 'progress_percent'> | null
}

export async function fetchRoadmap(signal?: AbortSignal): Promise<RoadmapData> {
  return request<RoadmapData>('/api/roadmap', signal)
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
  type:
    | 'markdown'
    | 'formula'
    | 'code'
    | 'callout'
    | 'checkpoint'
    | 'interactive_lab'
    | 'visual_demo'
    | 'table'
    | 'visual'
  title?: string | null
  display_title?: string | null
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
  demo_id?: string | null
  checkpoint_kind?: 'retrieval' | 'application' | 'interview' | null
  assessment_type?:
    | 'self_assessment'
    | 'single_choice_quiz'
    | 'multiple_choice_quiz'
    | 'free_response'
    | 'reflection'
    | null
  // Фаза 6A: метаданные сцены
  word_count?: number
  source_content_id?: string | null
  source_heading?: string | null
  semantic_role?: string | null
  contains_formula?: boolean
  contains_code?: boolean
  contains_visual?: boolean
}

export interface HeadingResolution {
  requested_heading?: string | null
  status: string
  selected_heading?: string | null
  known_alias?: string | null
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
  heading_resolution?: HeadingResolution[]
  source_content_id?: string | null
  source_path?: string | null
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
    estimated_minutes?: number | null
  } | null
  next_lesson: {
    id: string
    title: string
    skills: string[]
    estimated_minutes?: number | null
    course_id?: string | null
  } | null
  weak_skills: WeakSkill[]
  recent_activity: RecentEvent[]
  suggested_case: SuggestedCase | null
  progress_summary: ProgressSummary
  // Фаза 5: повторения.
  review_summary: ReviewSummary
  due_reviews: number
  overdue_reviews: number
  next_review_at: string | null
  review_action: 'review_session' | null
  suggested_practice?: {
    exercise_id: string
    title: string
    track: string
    estimated_minutes: number
  } | null
  roadmap_context?: {
    current_stage: RoadmapData['current_stage']
    current_lesson: RoadmapLesson | null
    completed_lessons: number
    total_lessons: number
  }
}

export interface PracticeExercise {
  id: string
  track: 'sql' | 'pandas' | 'numpy' | 'sklearn' | 'algorithms' | 'deep-learning'
  kind: 'sql' | 'code'
  title: string
  difficulty: string
  estimated_minutes: number
  prompt: string
  starter_code: string
  hint: string
  completed: boolean
  schema?: Record<string, string[]>
}

export interface PracticeCatalog {
  exercises: PracticeExercise[]
  completed_count: number
  total_count: number
}

export interface PracticeCheckResult {
  passed: boolean
  feedback: string
  solution: string | null
  evidence: { skill_id: string; state: string; evidence_count: number }[]
  columns?: string[]
  rows?: unknown[][]
  row_count?: number
  missing_count?: number
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

export async function fetchPractice(signal?: AbortSignal): Promise<PracticeCatalog> {
  return request<PracticeCatalog>('/api/practice', signal)
}

export async function runSqlPractice(
  exerciseId: string,
  query: string,
): Promise<PracticeCheckResult> {
  return postJson<PracticeCheckResult>('/api/practice/sql/run', {
    exercise_id: exerciseId,
    query,
  })
}

export async function checkCodePractice(
  exerciseId: string,
  code: string,
): Promise<PracticeCheckResult> {
  return postJson<PracticeCheckResult>('/api/practice/code/check', {
    exercise_id: exerciseId,
    code,
  })
}

// --- Фаза 5: интервальное повторение ---

export type ReviewRating = 'Again' | 'Hard' | 'Good' | 'Easy'
export type ReviewQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'ordering'
  | 'numeric'
  | 'parameter_selection'
  | 'error_diagnosis'
  | 'reveal_and_rate'

export interface ReviewStageDistribution {
  learning?: number
  review?: number
  relearning?: number
}

export interface ReviewSummary {
  due_count: number
  overdue_count: number
  completed_today: number
  next_due_at: string | null
  active_items: number
  stages: ReviewStageDistribution
  recommendation: string
}

export interface ReviewQueueItem {
  id: number
  template_id: string
  title: string
  prompt: string
  question_type: ReviewQuestionType
  options: string[]
  source_content_id: string
  source_lesson_id: string
  source_type: string
  source_id: string
  primary_skill_id: string
  difficulty: string
  objective: boolean
  stage: string
  status: string
  due_at: string
  interval_days: number
  ease_factor: number
  repetitions: number
  lapses: number
  skill_state: string | null
  skill_confidence: number | null
  skill_evidence_count: number | null
}

export interface ReviewQueueData {
  items: ReviewQueueItem[]
  returned: number
  due_count: number
  overdue_count: number
  next_due_at: string | null
  limit: number
}

export interface ReviewItemDetail extends ReviewQueueItem {
  numeric_tolerance?: number
}

export interface KnowledgeImpactRow {
  skill_id: string
  axis: string
  score_before: number | null
  score_after: number
  weight: number
  event_id: number
}

export interface ReviewSubmitResult {
  review_item_id: number
  template_id: string
  title: string
  objective_score: number | null
  is_correct: boolean | null
  user_rating: ReviewRating | null
  effective_rating: ReviewRating
  explanation: string
  correct_answer: string | null
  interval_days: number
  ease_factor: number
  stage: string
  next_due_at: string
  repetitions: number
  lapses: number
  knowledge_impact: KnowledgeImpactRow[]
  skill_state: string | null
  skill_axes: Record<string, SkillAxisState>
  attempt_id: number
  deduplicated: boolean
}

export interface ReviewHistoryRow {
  id: number
  review_item_id: number
  template_id: string | null
  title: string | null
  objective_score: number | null
  is_correct: boolean | null
  user_rating: ReviewRating | null
  effective_rating: ReviewRating
  hints_used: number
  deduplicated: boolean
  created_at: string
}

export interface ReviewHistoryData {
  attempts: ReviewHistoryRow[]
  count: number
}

export async function fetchReviewSummary(
  lessonId?: string,
  signal?: AbortSignal,
): Promise<ReviewSummary> {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : ''
  return request<ReviewSummary>(`/api/reviews/summary${query}`, signal)
}

export async function fetchReviewQueue(
  params: { limit?: number; skill_id?: string; lesson_id?: string } = {},
  signal?: AbortSignal,
): Promise<ReviewQueueData> {
  const search = new URLSearchParams()
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.skill_id) search.set('skill_id', params.skill_id)
  if (params.lesson_id) search.set('lesson_id', params.lesson_id)
  const qs = search.toString()
  return request<ReviewQueueData>(`/api/reviews/queue${qs ? `?${qs}` : ''}`, signal)
}

export async function fetchReviewItem(
  reviewItemId: number,
  signal?: AbortSignal,
): Promise<ReviewItemDetail> {
  return request<ReviewItemDetail>(`/api/reviews/${reviewItemId}`, signal)
}

export async function submitReview(
  reviewItemId: number,
  body: {
    answer: unknown
    user_rating: ReviewRating
    hints_used?: number
    response_time_ms?: number
    dedup_key?: string
  },
): Promise<ReviewSubmitResult> {
  return postJson<ReviewSubmitResult>(`/api/reviews/${reviewItemId}/submit`, body)
}

export async function skipReview(
  reviewItemId: number,
): Promise<{ skipped: boolean; due_at: string }> {
  return postJson(`/api/reviews/${reviewItemId}/skip`, {})
}

export async function fetchReviewHistory(
  limit = 20,
  signal?: AbortSignal,
): Promise<ReviewHistoryData> {
  return request<ReviewHistoryData>(`/api/reviews/history?limit=${limit}`, signal)
}
