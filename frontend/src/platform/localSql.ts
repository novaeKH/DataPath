import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { bundledAssetUrl } from './paths'

const SEED_SQL = `
CREATE TABLE customers(customer_id INTEGER PRIMARY KEY, name TEXT, city TEXT, signup_date TEXT);
CREATE TABLE orders(order_id INTEGER PRIMARY KEY, customer_id INTEGER, created_at TEXT, status TEXT, amount REAL);
CREATE TABLE events(event_id INTEGER PRIMARY KEY, customer_id INTEGER, event_time TEXT, event_name TEXT);
INSERT INTO customers VALUES
  (1,'Анна','Москва','2026-01-10'),(2,'Борис','Казань','2026-01-12'),
  (3,'Вера','Москва','2026-02-01'),(4,'Глеб','Тула','2026-02-14'),(5,'Дина',NULL,'2026-03-03');
INSERT INTO orders VALUES
  (101,1,'2026-04-01 10:00','paid',120),(102,1,'2026-04-03 12:00','paid',80),
  (103,2,'2026-04-01 09:00','cancelled',200),(104,2,'2026-04-04 11:00','paid',230),
  (105,3,'2026-04-02 15:00','refunded',90),(106,3,'2026-04-05 08:00','paid',160),
  (107,3,'2026-04-05 08:00','paid',45),(108,5,'2026-04-06 18:00','paid',70);
INSERT INTO events VALUES
  (1,1,'2026-04-01 08:00','open'),(2,1,'2026-04-02 09:00','open'),
  (3,1,'2026-04-04 09:00','open'),(4,2,'2026-04-01 10:00','open'),
  (5,2,'2026-04-02 10:00','buy'),(6,3,'2026-04-02 11:00','open'),
  (7,3,'2026-04-03 11:00','open'),(8,4,'2026-04-03 12:00','open');
`

let enginePromise: Promise<SqlJsStatic> | null = null

function engine() {
  enginePromise ??= initSqlJs({ locateFile: () => bundledAssetUrl('vendor/sql-wasm.wasm') })
  return enginePromise
}

function validateReadOnly(query: string) {
  const normalized = query.replace(/--.*?$|\/\*.*?\*\//gms, ' ').trim()
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
  if (normalized.slice(0, -1).includes(';')) {
    throw new Error('Выполните один SQL statement за раз.')
  }
  return normalized
}

function execute(database: Database, query: string) {
  const result = database.exec(validateReadOnly(query), { maxRows: 101 })[0]
  const columns = result?.columns ?? []
  const rows = result?.values ?? []
  if (rows.length > 100) throw new Error('Результат превышает лимит 100 строк.')
  return { columns, rows }
}

function normalizedRows(rows: unknown[][], ordered: boolean) {
  const normalized = rows.map((row) => row.map((value) => (value == null ? 'NULL' : String(value))))
  return ordered
    ? normalized
    : normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

export async function runLocalSql(query: string, solution: string, ordered = true) {
  const SQL = await engine()
  const database = new SQL.Database()
  try {
    database.run(SEED_SQL)
    const actual = execute(database, query)
    const expected = execute(database, solution)
    const passed =
      JSON.stringify(actual.columns) === JSON.stringify(expected.columns) &&
      JSON.stringify(normalizedRows(actual.rows, ordered)) ===
        JSON.stringify(normalizedRows(expected.rows, ordered))
    return {
      ...actual,
      row_count: actual.rows.length,
      passed,
      feedback: passed
        ? 'Результат совпал с эталонным набором.'
        : 'Запрос выполнился, но набор строк или имена колонок отличаются. Проверьте grain, фильтры и сортировку.',
      solution: passed ? null : solution,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? `SQLite: ${error.message}` : 'Ошибка SQLite')
  } finally {
    database.close()
  }
}
