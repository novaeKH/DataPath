import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { DatabaseIcon } from '../components/ui/icons'
import { EmptyState, LoadingBlock } from '../components/ui/PageState'
import { loadSqlCatalog } from '../features/practice/catalog'
import {
  getPracticeProgress,
  getProjectProgress,
  updatePracticeProgress,
} from '../features/practice/progress'
import {
  EditorTextarea,
  PracticeBadge,
  ProgressBar,
  ResultTable,
} from '../features/practice/PracticeUi'
import { checkSql, runSql } from '../features/practice/sqlRunner'
import type { SqlCatalog, SqlCheckResult, SqlRunResult, SqlTask } from '../features/practice/types'

type ResultState = (SqlRunResult & { correct?: boolean; message?: string }) | null

export function SqlPracticeView() {
  const { taskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<SqlCatalog | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ResultState>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [running, setRunning] = useState<'run' | 'check' | null>(null)
  const [helpLevel, setHelpLevel] = useState(0)
  const [schemaOpen, setSchemaOpen] = useState(false)

  useEffect(() => {
    let active = true
    void loadSqlCatalog()
      .then((value) => active && setCatalog(value))
      .catch(
        (error) =>
          active &&
          setLoadError(error instanceof Error ? error.message : 'SQL-практикум недоступен.'),
      )
    return () => {
      active = false
    }
  }, [])

  const task = useMemo(
    () => catalog?.tasks.find((item) => item.id === taskId) ?? null,
    [catalog, taskId],
  )
  const taskIndex = task && catalog ? catalog.tasks.indexOf(task) : -1

  useEffect(() => {
    if (!catalog) return
    if (!taskId) {
      navigate(`/studio/sql/${encodeURIComponent(catalog.tasks[0].id)}`, { replace: true })
      return
    }
    if (!task) return
    const progress = getPracticeProgress('sql', task.id)
    setQuery(progress?.draft || task.starter_sql || '')
    setHelpLevel(progress?.help_level ?? 0)
    setResult(null)
    setRuntimeError(null)
  }, [catalog, navigate, task, taskId])

  const saveDraft = (value: string) => {
    if (!task) return
    setQuery(value)
    updatePracticeProgress('sql', task.id, {
      draft: value,
      status: getPracticeProgress('sql', task.id)?.status ?? 'started',
    })
  }

  const execute = async (mode: 'run' | 'check') => {
    if (!task || !query.trim() || running) return
    setRunning(mode)
    setRuntimeError(null)
    setResult(null)
    try {
      const next = mode === 'run' ? await runSql(query) : await checkSql(task, query)
      setResult(next)
      const correct = mode === 'check' && Boolean((next as SqlCheckResult).correct)
      const current = getPracticeProgress('sql', task.id)
      updatePracticeProgress('sql', task.id, {
        attempts: (current?.attempts ?? 0) + 1,
        draft: query,
        status: correct ? 'solved' : (current?.status ?? 'started'),
        last_outcome: correct ? 'passed' : 'failed',
      })
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Не удалось выполнить SQL.')
    } finally {
      setRunning(null)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void execute('run')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (loadError) return <EmptyState title="SQL-практикум недоступен" description={loadError} />
  if (!catalog || !task) return <LoadingBlock label="Загрузка SQL Praktikum…" rows={5} />

  const progressRows = getProjectProgress('sql')
  const solved = catalog.tasks.filter((item) => progressRows[item.id]?.status === 'solved').length
  const percent = Math.round((solved / catalog.tasks.length) * 100)
  const section = catalog.sections.find((item) => item.id === task.section)
  const nextTask = catalog.tasks[taskIndex + 1]

  const revealHelp = () => {
    const next = Math.min(3, helpLevel + 1)
    setHelpLevel(next)
    updatePracticeProgress('sql', task.id, {
      help_level: next,
      solution_revealed: next >= 3,
      draft: query,
    })
  }

  return (
    <div className="dp-practice-workspace mx-auto w-full max-w-[1440px]">
      <header className="dp-practice-workspace-header">
        <div>
          <Link to="/studio" className="dp-practice-back">
            ← Практика
          </Link>
          <h1>SQL Praktikum</h1>
          <p>Реальная SQLite-база Olist · 76 задач · всё выполняется локально</p>
        </div>
        <div className="dp-practice-total-progress">
          <span>
            {solved}/{catalog.tasks.length}
          </span>
          <ProgressBar value={percent} label={`SQL: решено ${solved} из ${catalog.tasks.length}`} />
        </div>
      </header>

      <div className="dp-practice-mobile-select">
        <label htmlFor="sql-task-select">Задача</label>
        <select
          id="sql-task-select"
          value={task.id}
          onChange={(event) => navigate(`/studio/sql/${encodeURIComponent(event.target.value)}`)}
        >
          {catalog.tasks.map((item, index) => (
            <option value={item.id} key={item.id}>
              {index + 1}. {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="dp-sql-layout">
        <TaskNavigator
          catalog={catalog}
          currentId={task.id}
          onSelect={(id) => navigate(`/studio/sql/${encodeURIComponent(id)}`)}
        />

        <main className="dp-practice-main">
          <div className="dp-task-heading">
            <div className="dp-task-kicker">
              Задача {taskIndex + 1} из {catalog.tasks.length} · {task.section}
            </div>
            <h2>{task.title}</h2>
            <div className="dp-task-badges">
              <PracticeBadge
                tone={task.difficulty === 1 ? 'easy' : task.difficulty === 2 ? 'medium' : 'hard'}
              >
                Уровень {task.difficulty}
              </PracticeBadge>
              <PracticeBadge tone="sql">
                {task.kind === 'demo'
                  ? 'Разобранный пример'
                  : task.kind === 'guided'
                    ? 'С поддержкой'
                    : task.kind === 'checkpoint'
                      ? 'Контрольная'
                      : 'Самостоятельно'}
              </PracticeBadge>
              {progressRows[task.id]?.status === 'solved' && (
                <PracticeBadge tone="success">Решено ✓</PracticeBadge>
              )}
            </div>
          </div>

          <section className="dp-task-brief">
            <div>
              <span>Ситуация</span>
              <p>{task.scenario}</p>
            </div>
            <div>
              <span>Задание</span>
              <p>{task.task}</p>
            </div>
            <div className="dp-task-grain">
              <span>Гранулярность</span>
              <p>{task.grain}</p>
            </div>
          </section>

          <details className="dp-section-theory">
            <summary>Коротко о теме: {section?.subtitle}</summary>
            <p>{section?.theory}</p>
            <pre>
              <code>{section?.syntax}</code>
            </pre>
          </details>

          <div className="dp-editor-context">
            <button
              className={`dp-schema-trigger ${schemaOpen ? 'is-open' : ''}`}
              onClick={() => setSchemaOpen((value) => !value)}
              aria-expanded={schemaOpen}
              aria-controls="sql-schema-panel"
            >
              <DatabaseIcon width={20} height={20} />
              <span>
                <strong>{schemaOpen ? 'Скрыть схему' : 'Схема базы'}</strong>
                <small>Поля, типы и связи таблиц</small>
              </span>
              <i aria-hidden="true">⌄</i>
            </button>
            <div className="dp-current-tables">
              <span>Таблицы задачи</span>
              <div>
                {task.tables.map((table) => (
                  <code key={table}>{table}</code>
                ))}
              </div>
            </div>
          </div>
          {schemaOpen && (
            <SchemaPanel id="sql-schema-panel" catalog={catalog} tables={task.tables} />
          )}

          <EditorTextarea
            value={query}
            onChange={saveDraft}
            language="sql"
            ariaLabel="SQL-редактор"
          />

          <div className="dp-practice-actions">
            <Button
              variant="outline"
              onClick={() => void execute('run')}
              disabled={Boolean(running) || !query.trim()}
            >
              {running === 'run' ? 'Выполняем…' : '▶ Запустить'}
            </Button>
            <Button
              onClick={() => void execute('check')}
              disabled={Boolean(running) || !query.trim()}
            >
              {running === 'check' ? 'Проверяем…' : 'Проверить решение'}
            </Button>
            <button className="dp-help-button" onClick={revealHelp} disabled={helpLevel >= 3}>
              {helpLevel === 0
                ? 'Нужна подсказка'
                : helpLevel === 1
                  ? 'Показать план'
                  : helpLevel === 2
                    ? 'Показать решение'
                    : 'Вся помощь открыта'}
            </button>
          </div>

          <HelpPanel task={task} level={helpLevel} />
          {runtimeError && <div className="dp-practice-alert is-error">{runtimeError}</div>}
          {result && <SqlResult result={result} />}

          <section className="dp-task-checklist">
            <h3>Перед проверкой результата</h3>
            <ul>
              {task.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </section>

          {nextTask && (
            <Link
              className="dp-next-practice-task"
              to={`/studio/sql/${encodeURIComponent(nextTask.id)}`}
            >
              <span>Следующая задача</span>
              <strong>{nextTask.title}</strong>
              <i>→</i>
            </Link>
          )}
        </main>
      </div>
    </div>
  )
}

function TaskNavigator({
  catalog,
  currentId,
  onSelect,
}: {
  catalog: SqlCatalog
  currentId: string
  onSelect: (id: string) => void
}) {
  const progress = getProjectProgress('sql')
  return (
    <aside className="dp-task-navigator" aria-label="Задачи SQL Praktikum">
      {catalog.sections.map((section) => {
        const tasks = catalog.tasks.filter((task) => task.section === section.id)
        const active = tasks.some((task) => task.id === currentId)
        return (
          <details key={section.id} open={active}>
            <summary>
              <span>{section.id}</span>
              <small>
                {tasks.filter((task) => progress[task.id]?.status === 'solved').length}/
                {tasks.length}
              </small>
            </summary>
            <div>
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  className={task.id === currentId ? 'is-active' : ''}
                >
                  <i
                    className={
                      progress[task.id]?.status === 'solved'
                        ? 'is-solved'
                        : progress[task.id]
                          ? 'is-started'
                          : ''
                    }
                  />
                  <span>{task.title}</span>
                </button>
              ))}
            </div>
          </details>
        )
      })}
    </aside>
  )
}

function SchemaPanel({
  id,
  catalog,
  tables,
}: {
  id: string
  catalog: SqlCatalog
  tables: string[]
}) {
  return (
    <section className="dp-schema-panel" id={id} aria-label="Схема таблиц текущей задачи">
      {tables.map((name) => {
        const table = catalog.schema[name]
        if (!table) return null
        return (
          <details key={name} open={tables.length === 1}>
            <summary>
              <code>{name}</code>
              <span>{table.row_count.toLocaleString('ru-RU')} строк</span>
            </summary>
            <p>{table.description}</p>
            <small>{table.grain}</small>
            <dl>
              {Object.entries(table.columns).map(([column, description]) => (
                <div key={column}>
                  <dt>{column}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </details>
        )
      })}
    </section>
  )
}

function HelpPanel({ task, level }: { task: SqlTask; level: number }) {
  if (level === 0) return null
  return (
    <section className="dp-help-panel">
      {level >= 1 && (
        <div>
          <span>Подсказка</span>
          <p>{task.hint_levels?.[0] ?? task.hint}</p>
        </div>
      )}
      {level >= 2 && (
        <div>
          <span>План / каркас</span>
          {task.hint_levels?.[1] && <p>{task.hint_levels[1]}</p>}
          <pre>
            <code>
              {task.scaffold_sql ||
                'Сформулируйте промежуточные CTE и соедините их на нужной гранулярности.'}
            </code>
          </pre>
        </div>
      )}
      {level >= 3 && (
        <div>
          <span>Эталонное решение</span>
          <pre>
            <code>{task.reference_sql}</code>
          </pre>
          <p>{task.takeaway}</p>
        </div>
      )}
    </section>
  )
}

function SqlResult({ result }: { result: ResultState }) {
  if (!result) return null
  return (
    <section
      className={`dp-practice-result ${result.correct === true ? 'is-success' : result.correct === false ? 'is-wrong' : ''}`}
    >
      <div className="dp-result-heading">
        <strong>
          {result.correct === true
            ? 'Решение принято'
            : result.correct === false
              ? 'Пока не совпало'
              : 'Запрос выполнен'}
        </strong>
        <span>
          {result.row_count} строк · {result.elapsed_ms} мс
          {result.truncated ? ' · показаны первые 500' : ''}
        </span>
      </div>
      {result.message && <p>{result.message}</p>}
      <ResultTable columns={result.columns} rows={result.rows.slice(0, 100)} />
    </section>
  )
}
