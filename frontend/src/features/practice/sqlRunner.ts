import { bundledAssetUrl } from '../../platform/paths'
import type { SqlCheckResult, SqlRunResult, SqlTask } from './types'

type WorkerReply<T> = { id: number; ok: true; result: T } | { id: number; ok: false; error: string }

let worker: Worker | null = null
let sequence = 0

function assetBase() {
  return new URL(bundledAssetUrl(''), window.location.href).href
}

function request<T>(payload: Record<string, unknown>, timeoutMs = 10_000): Promise<T> {
  worker ??= new Worker(new URL('./sqlWorker.ts', import.meta.url), { type: 'module' })
  const activeWorker = worker
  const id = ++sequence
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      activeWorker.terminate()
      if (worker === activeWorker) worker = null
      reject(
        new Error(
          'Запрос остановлен: выполнение заняло больше 8 секунд. Проверьте JOIN и фильтры.',
        ),
      )
    }, timeoutMs)
    const onMessage = (event: MessageEvent<WorkerReply<T>>) => {
      if (event.data.id !== id) return
      window.clearTimeout(timeout)
      activeWorker.removeEventListener('message', onMessage)
      if (event.data.ok) resolve(event.data.result)
      else reject(new Error(event.data.error))
    }
    activeWorker.addEventListener('message', onMessage)
    activeWorker.postMessage({ id, assetBase: assetBase(), ...payload })
  })
}

export function runSql(query: string) {
  return request<SqlRunResult>({ action: 'run', query })
}

export function checkSql(task: SqlTask, query: string) {
  return request<SqlCheckResult>(
    { action: 'check', query, solution: task.reference_sql, ordered: Boolean(task.ordered) },
    12_000,
  )
}

export function resetSqlRunnerForTests() {
  worker?.terminate()
  worker = null
}
