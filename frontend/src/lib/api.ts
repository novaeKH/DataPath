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
