import { bundledAssetUrl } from '../../platform/paths'
import type { AlgorithmCatalog, SqlCatalog } from './types'

let sqlPromise: Promise<SqlCatalog> | null = null
let algorithmPromise: Promise<AlgorithmCatalog> | null = null

async function readCatalog<T>(file: string, expectedFormat: string): Promise<T> {
  const response = await fetch(bundledAssetUrl(`practice-data/${file}`))
  if (!response.ok) throw new Error(`Не удалось загрузить ${file}.`)
  const data = (await response.json()) as T & { format?: string }
  if (data.format !== expectedFormat) throw new Error(`Неверный формат ${file}.`)
  return data
}

export function loadSqlCatalog(): Promise<SqlCatalog> {
  sqlPromise ??= readCatalog<SqlCatalog>('sql-praktikum.json', 'datapath-sql-praktikum')
  return sqlPromise
}

export function loadAlgorithmCatalog(): Promise<AlgorithmCatalog> {
  algorithmPromise ??= readCatalog<AlgorithmCatalog>('algopath.json', 'datapath-algopath')
  return algorithmPromise
}

export function clearPracticeCatalogCacheForTests() {
  sqlPromise = null
  algorithmPromise = null
}
