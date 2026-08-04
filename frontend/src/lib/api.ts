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

export async function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  const response = await fetch('/api/system/status', { signal })
  if (!response.ok) {
    throw new Error(`Backend вернул HTTP ${response.status}`)
  }
  return (await response.json()) as SystemStatus
}
