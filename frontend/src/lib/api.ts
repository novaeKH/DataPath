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
