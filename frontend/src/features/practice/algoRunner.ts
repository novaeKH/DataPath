import { bundledAssetUrl } from '../../platform/paths'
import type { AlgorithmProblem, AlgorithmRunResult } from './types'

type WorkerReply =
  { id: number; ok: true; result: AlgorithmRunResult } | { id: number; ok: false; error: string }

let worker: Worker | null = null
let sequence = 0
let warmedUp = false

function assetBase() {
  return new URL(bundledAssetUrl(''), window.location.href).href
}

export function runAlgorithm(
  problem: AlgorithmProblem,
  code: string,
  submit: boolean,
): Promise<AlgorithmRunResult> {
  worker ??= new Worker(new URL('./algoWorker.ts', import.meta.url), { type: 'module' })
  const activeWorker = worker
  const id = ++sequence
  const timeoutMs = warmedUp ? 11_000 : 30_000
  const tests = submit ? [...problem.public_tests, ...problem.hidden_tests] : problem.public_tests
  const payload = {
    code,
    function_name: problem.function_name,
    tests,
    runner_config: problem.runner_config ?? {},
    compare_expected: true,
  }
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      activeWorker.terminate()
      if (worker === activeWorker) worker = null
      warmedUp = false
      reject(new Error('Выполнение остановлено по таймауту. Проверьте циклы и рекурсию.'))
    }, timeoutMs)
    const onMessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data.id !== id) return
      window.clearTimeout(timeout)
      activeWorker.removeEventListener('message', onMessage)
      warmedUp = true
      if (event.data.ok) resolve(event.data.result)
      else reject(new Error(event.data.error))
    }
    activeWorker.addEventListener('message', onMessage)
    activeWorker.postMessage({ id, assetBase: assetBase(), payload })
  })
}

export function resetAlgorithmRunnerForTests() {
  worker?.terminate()
  worker = null
  warmedUp = false
}
