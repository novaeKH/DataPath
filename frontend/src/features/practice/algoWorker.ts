/// <reference lib="webworker" />

import { loadPyodide, type PyodideInterface } from 'pyodide'

interface WorkerRequest {
  id: number
  assetBase: string
  payload: Record<string, unknown>
}

let runtimePromise: Promise<PyodideInterface> | null = null

async function runtime(assetBase: string) {
  runtimePromise ??= (async () => {
    const pyodide = await loadPyodide({ indexURL: `${assetBase}assets/pyodide/` })
    const response = await fetch(`${assetBase}practice-data/algopath-runner.py`)
    if (!response.ok) throw new Error('Python-раннер AlgoPath недоступен.')
    await pyodide.runPythonAsync(await response.text())
    return pyodide
  })()
  return runtimePromise
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, assetBase, payload } = event.data
  try {
    const pyodide = await runtime(assetBase)
    pyodide.globals.set('__datapath_payload_json', JSON.stringify(payload))
    const raw = await pyodide.runPythonAsync(
      'json.dumps(execute_payload(json.loads(__datapath_payload_json)), ensure_ascii=False)',
    )
    pyodide.globals.delete('__datapath_payload_json')
    self.postMessage({ id, ok: true, result: JSON.parse(String(raw)) })
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Ошибка Python/WASM',
    })
  }
}
