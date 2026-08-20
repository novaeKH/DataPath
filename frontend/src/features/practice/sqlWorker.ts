/// <reference lib="webworker" />

import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'

interface WorkerRequest {
  id: number
  action: 'run' | 'check'
  query: string
  solution?: string
  ordered?: boolean
  assetBase: string
}

let enginePromise: Promise<SqlJsStatic> | null = null
let databasePromise: Promise<Database> | null = null

function validateReadOnly(query: string) {
  const normalized = query
    .replace(/--.*?$|\/\*.*?\*\//gms, ' ')
    .trim()
    .replace(/;\s*$/, '')
  if (!normalized) throw new Error('Напишите SQL-запрос перед запуском.')
  if (normalized.length > 30_000) throw new Error('Запрос слишком длинный для тренажёра.')
  if (!/^(select|with)\b/i.test(normalized)) {
    throw new Error('Разрешены только read-only SELECT или WITH запросы.')
  }
  if (
    /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|replace|truncate)\b/i.test(
      normalized,
    )
  ) {
    throw new Error('Запрос содержит запрещённую операцию.')
  }
  if (normalized.includes(';')) throw new Error('Запускайте один SQL statement за раз.')
  return normalized
}

async function getDatabase(assetBase: string) {
  enginePromise ??= initSqlJs({ locateFile: () => `${assetBase}vendor/sql-wasm.wasm` })
  databasePromise ??= Promise.all([
    enginePromise,
    fetch(`${assetBase}practice-data/olist-practice.sqlite`).then(async (response) => {
      if (!response.ok) throw new Error('Учебная база Olist недоступна.')
      return new Uint8Array(await response.arrayBuffer())
    }),
  ]).then(([SQL, bytes]) => new SQL.Database(bytes))
  return databasePromise
}

function execute(database: Database, query: string, maxRows: number) {
  const started = performance.now()
  const result = database.exec(validateReadOnly(query), { maxRows: maxRows + 1 })[0]
  const rows = result?.values ?? []
  return {
    columns: result?.columns ?? [],
    rows: rows.slice(0, maxRows),
    row_count: Math.min(rows.length, maxRows),
    truncated: rows.length > maxRows,
    elapsed_ms: Math.round((performance.now() - started) * 10) / 10,
  }
}

function normalize(rows: unknown[][], ordered: boolean) {
  const normalized = rows.map((row) =>
    row.map((value) => (typeof value === 'number' ? Math.round(value * 1e9) / 1e9 : value)),
  )
  return ordered
    ? normalized
    : normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, action, query, solution = '', ordered = false, assetBase } = event.data
  try {
    const database = await getDatabase(assetBase)
    const actual = execute(database, query, action === 'check' ? 200_000 : 500)
    if (action === 'run') {
      self.postMessage({ id, ok: true, result: actual })
      return
    }
    const expected = execute(database, solution, 200_000)
    const sameColumns =
      actual.columns.map((column) => column.toLowerCase()).join('\u0000') ===
      expected.columns.map((column) => column.toLowerCase()).join('\u0000')
    const sameRows =
      !actual.truncated &&
      !expected.truncated &&
      JSON.stringify(normalize(actual.rows, ordered)) ===
        JSON.stringify(normalize(expected.rows, ordered))
    const correct = sameColumns && sameRows
    self.postMessage({
      id,
      ok: true,
      result: {
        ...actual,
        correct,
        message: correct
          ? 'Отлично — результат совпал с эталоном.'
          : !sameColumns
            ? 'Структура результата отличается. Проверьте названия и порядок столбцов.'
            : 'Результат отличается. Проверьте grain, JOIN, фильтры, формулы и сортировку.',
        expected_columns: sameColumns ? undefined : expected.columns,
        actual_columns: sameColumns ? undefined : actual.columns,
        expected_rows: expected.rows.length,
        actual_rows: actual.rows.length,
      },
    })
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Ошибка SQLite',
    })
  }
}
