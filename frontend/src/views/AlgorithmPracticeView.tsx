import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState, LoadingBlock } from '../components/ui/PageState'
import { runAlgorithm } from '../features/practice/algoRunner'
import { loadAlgorithmCatalog } from '../features/practice/catalog'
import {
  getPracticeProgress,
  getProjectProgress,
  updatePracticeProgress,
} from '../features/practice/progress'
import {
  EditorTextarea,
  InlineCodeText,
  PracticeBadge,
  ProgressBar,
} from '../features/practice/PracticeUi'
import type {
  AlgorithmCatalog,
  AlgorithmProblem,
  AlgorithmRunResult,
} from '../features/practice/types'

const DIFFICULTY = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' } as const
const PRIORITY = { core: 'Core для DS', important: 'Важно', stretch: 'Stretch' } as const

export function AlgorithmPracticeView() {
  const { problemSlug } = useParams<{ problemSlug?: string }>()
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<AlgorithmCatalog | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<AlgorithmRunResult | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [running, setRunning] = useState<'run' | 'submit' | null>(null)
  const [solutionOpen, setSolutionOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)

  useEffect(() => {
    let active = true
    void loadAlgorithmCatalog()
      .then((value) => active && setCatalog(value))
      .catch(
        (error) =>
          active && setLoadError(error instanceof Error ? error.message : 'AlgoPath недоступен.'),
      )
    return () => {
      active = false
    }
  }, [])

  const problem = useMemo(
    () => catalog?.problems.find((item) => item.slug === problemSlug) ?? null,
    [catalog, problemSlug],
  )
  const problemIndex = problem && catalog ? catalog.problems.indexOf(problem) : -1

  useEffect(() => {
    if (!catalog) return
    if (!problemSlug) {
      navigate(`/studio/algorithms/${encodeURIComponent(catalog.problems[0].slug)}`, {
        replace: true,
      })
      return
    }
    if (!problem) return
    const progress = getPracticeProgress('algorithms', problem.slug)
    setCode(progress?.draft || problem.starter_code)
    setSolutionOpen(Boolean(progress?.solution_revealed))
    setResult(null)
    setRuntimeError(null)
    setCatalogOpen(false)
  }, [catalog, navigate, problem, problemSlug])

  const saveDraft = (value: string) => {
    if (!problem) return
    setCode(value)
    updatePracticeProgress('algorithms', problem.slug, {
      draft: value,
      status: getPracticeProgress('algorithms', problem.slug)?.status ?? 'started',
    })
  }

  const execute = async (submit: boolean) => {
    if (!problem || !code.trim() || running) return
    setRunning(submit ? 'submit' : 'run')
    setRuntimeError(null)
    setResult(null)
    try {
      const next = await runAlgorithm(problem, code, submit)
      setResult(next)
      const accepted = submit && next.verdict === 'Accepted'
      const current = getPracticeProgress('algorithms', problem.slug)
      updatePracticeProgress('algorithms', problem.slug, {
        attempts: (current?.attempts ?? 0) + 1,
        draft: code,
        status: accepted ? 'solved' : (current?.status ?? 'started'),
        last_outcome:
          next.verdict === 'Accepted' || next.verdict === 'Completed' ? 'passed' : 'failed',
      })
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Не удалось выполнить Python.')
    } finally {
      setRunning(null)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void execute(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (loadError) return <EmptyState title="AlgoPath недоступен" description={loadError} />
  if (!catalog || !problem) return <LoadingBlock label="Загрузка AlgoPath…" rows={5} />

  const progressRows = getProjectProgress('algorithms')
  const solved = catalog.problems.filter(
    (item) => progressRows[item.slug]?.status === 'solved',
  ).length
  const percent = Math.round((solved / catalog.problems.length) * 100)
  const next = catalog.problems[problemIndex + 1]

  const revealSolution = () => {
    setSolutionOpen(true)
    updatePracticeProgress('algorithms', problem.slug, {
      solution_revealed: true,
      help_level: 3,
      draft: code,
    })
  }

  return (
    <div className="dp-practice-workspace mx-auto w-full max-w-[1540px]">
      <header className="dp-practice-workspace-header">
        <div>
          <Link to="/studio" className="dp-practice-back">
            ← Практика
          </Link>
          <h1>AlgoPath</h1>
          <p>Python-алгоритмы для DS/ML интервью · локальный Python/WASM runner</p>
        </div>
        <div className="dp-practice-total-progress">
          <span>
            {solved}/{catalog.problems.length}
          </span>
          <ProgressBar
            value={percent}
            label={`AlgoPath: решено ${solved} из ${catalog.problems.length}`}
          />
        </div>
      </header>

      <div className="dp-algo-mobile-nav">
        <button onClick={() => setCatalogOpen((value) => !value)}>
          {catalogOpen
            ? 'Скрыть каталог'
            : `Каталог · ${problemIndex + 1}/${catalog.problems.length}`}
        </button>
        <select
          aria-label="Задача AlgoPath"
          value={problem.slug}
          onChange={(event) =>
            navigate(`/studio/algorithms/${encodeURIComponent(event.target.value)}`)
          }
        >
          {catalog.problems.map((item, index) => (
            <option key={item.slug} value={item.slug}>
              {index + 1}. {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="dp-algo-layout">
        <AlgorithmNavigator
          catalog={catalog}
          currentSlug={problem.slug}
          open={catalogOpen}
          onSelect={(slug) => navigate(`/studio/algorithms/${encodeURIComponent(slug)}`)}
        />

        <main className="dp-algo-problem">
          <ProblemStatement
            problem={problem}
            index={problemIndex}
            solved={progressRows[problem.slug]?.status === 'solved'}
          />
        </main>

        <section className="dp-algo-code-pane">
          <div className="dp-algo-code-heading">
            <div>
              <span>Решение</span>
              <small>{progressRows[problem.slug]?.attempts ?? 0} запусков</small>
            </div>
            <button onClick={() => saveDraft(problem.starter_code)}>Сбросить код</button>
          </div>
          <EditorTextarea
            value={code}
            onChange={saveDraft}
            language="python"
            ariaLabel="Python-редактор"
          />
          <div className="dp-practice-actions">
            <Button
              variant="outline"
              onClick={() => void execute(false)}
              disabled={Boolean(running) || !code.trim()}
            >
              {running === 'run' ? 'Запускаем Python…' : '▶ Запустить примеры'}
            </Button>
            <Button onClick={() => void execute(true)} disabled={Boolean(running) || !code.trim()}>
              {running === 'submit' ? 'Проверяем все тесты…' : 'Отправить решение'}
            </Button>
          </div>
          {!result && !runtimeError && (
            <div className="dp-runtime-note">
              <strong>Первый запуск может занять несколько секунд.</strong>
              <p>
                DataPath один раз загружает локальный Python runtime. Следующие запуски будут
                быстрее.
              </p>
            </div>
          )}
          {runtimeError && <div className="dp-practice-alert is-error">{runtimeError}</div>}
          {result && <AlgorithmResult result={result} publicCount={problem.public_tests.length} />}

          <div className="dp-solution-actions">
            {!solutionOpen ? (
              <button onClick={revealSolution}>Показать разбор и эталон</button>
            ) : (
              <section className="dp-algo-solution">
                <span>Разбор</span>
                <p>
                  <InlineCodeText>{problem.explanation_ru}</InlineCodeText>
                </p>
                <pre>
                  <code>{problem.canonical_solution}</code>
                </pre>
                <div>
                  <strong>Time: {problem.time_complexity}</strong>
                  <strong>Space: {problem.space_complexity}</strong>
                </div>
              </section>
            )}
          </div>

          {next && (
            <Link
              className="dp-next-practice-task"
              to={`/studio/algorithms/${encodeURIComponent(next.slug)}`}
            >
              <span>Следующая задача</span>
              <strong>{next.title}</strong>
              <i>→</i>
            </Link>
          )}
        </section>
      </div>
    </div>
  )
}

function AlgorithmNavigator({
  catalog,
  currentSlug,
  open,
  onSelect,
}: {
  catalog: AlgorithmCatalog
  currentSlug: string
  open: boolean
  onSelect: (slug: string) => void
}) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const progress = getProjectProgress('algorithms')
  const topics = [...new Set(catalog.problems.map((problem) => problem.topic))]
  const filtered = catalog.problems.filter(
    (problem) =>
      (topic === 'all' || problem.topic === topic) &&
      `${problem.title} ${problem.pattern}`
        .toLocaleLowerCase('ru')
        .includes(query.toLocaleLowerCase('ru')),
  )
  return (
    <aside className={`dp-algo-navigator ${open ? 'is-open' : ''}`} aria-label="Каталог AlgoPath">
      <div className="dp-algo-filters">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти задачу…"
          aria-label="Поиск задач AlgoPath"
        />
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          aria-label="Тема AlgoPath"
        >
          <option value="all">Все темы</option>
          {topics.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="dp-algo-task-list">
        {filtered.map((problem) => (
          <button
            key={problem.slug}
            onClick={() => onSelect(problem.slug)}
            className={problem.slug === currentSlug ? 'is-active' : ''}
          >
            <i
              className={
                progress[problem.slug]?.status === 'solved'
                  ? 'is-solved'
                  : progress[problem.slug]
                    ? 'is-started'
                    : ''
              }
            />
            <span>
              <strong>{problem.title}</strong>
              <small>
                {problem.topic} · {problem.pattern}
              </small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function ProblemStatement({
  problem,
  index,
  solved,
}: {
  problem: AlgorithmProblem
  index: number
  solved: boolean
}) {
  return (
    <article>
      <div className="dp-task-kicker">Задача {index + 1}</div>
      <h2>{problem.title}</h2>
      <div className="dp-task-badges">
        <PracticeBadge tone={problem.difficulty}>{DIFFICULTY[problem.difficulty]}</PracticeBadge>
        <PracticeBadge tone={problem.interview_priority}>
          {PRIORITY[problem.interview_priority]}
        </PracticeBadge>
        <PracticeBadge>{problem.pattern}</PracticeBadge>
        {solved && <PracticeBadge tone="success">Решено ✓</PracticeBadge>}
      </div>
      {problem.why_relevant_ru && (
        <div className="dp-why-interview">
          <span>Зачем на DS-собеседовании</span>
          <p>
            <InlineCodeText>{problem.why_relevant_ru}</InlineCodeText>
          </p>
        </div>
      )}
      <section className="dp-problem-copy">
        <p>
          <InlineCodeText>{problem.statement_ru}</InlineCodeText>
        </p>
      </section>
      <h3>Что нужно реализовать</h3>
      <pre>
        <code>{problem.function_signature}</code>
      </pre>
      <h3>Вход и результат</h3>
      <p>
        <InlineCodeText>{problem.input_description_ru}</InlineCodeText>
      </p>
      <p>
        <InlineCodeText>{problem.output_description_ru}</InlineCodeText>
      </p>
      <h3>Ограничения</h3>
      <ul>
        {problem.constraints_ru.map((item) => (
          <li key={item}>
            <InlineCodeText>{item}</InlineCodeText>
          </li>
        ))}
      </ul>
      {problem.edge_cases_ru && problem.edge_cases_ru.length > 0 && (
        <>
          <h3>Крайние случаи</h3>
          <ul>
            {problem.edge_cases_ru.map((item) => (
              <li key={item}>
                <InlineCodeText>{item}</InlineCodeText>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Примеры</h3>
      {problem.examples.map((example, index) => (
        <div className="dp-problem-example" key={index}>
          <div>
            <span>Вход</span>
            <code>{prettyJson(example.input_json)}</code>
          </div>
          <div>
            <span>Выход</span>
            <code>{prettyJson(example.output_json)}</code>
          </div>
          <p>
            <InlineCodeText>{example.explanation_ru}</InlineCodeText>
          </p>
        </div>
      ))}
      <h3>Типичные ошибки</h3>
      <ul>
        {problem.common_mistakes_ru.map((item) => (
          <li key={item}>
            <InlineCodeText>{item}</InlineCodeText>
          </li>
        ))}
      </ul>
    </article>
  )
}

function AlgorithmResult({
  result,
  publicCount,
}: {
  result: AlgorithmRunResult
  publicCount: number
}) {
  const success = result.verdict === 'Accepted' || result.verdict === 'Completed'
  return (
    <section className={`dp-practice-result ${success ? 'is-success' : 'is-wrong'}`}>
      <div className="dp-result-heading">
        <strong>{verdictLabel(result.verdict)}</strong>
        <span>
          {result.passed}/{result.total} тестов · {Math.round(result.total_time_ms)} мс
        </span>
      </div>
      {result.error && (
        <pre className="dp-runtime-error">
          <code>{result.error}</code>
        </pre>
      )}
      {result.stdout && (
        <details>
          <summary>stdout</summary>
          <pre>
            <code>{result.stdout}</code>
          </pre>
        </details>
      )}
      <div className="dp-test-results">
        {result.details.map((detail) => {
          const hidden = detail.test_index >= publicCount
          return (
            <details key={detail.test_index} open={!detail.passed}>
              <summary>
                <span className={detail.passed ? 'is-pass' : 'is-fail'}>
                  {detail.passed ? '✓' : '×'}
                </span>
                {hidden
                  ? `Скрытый тест ${detail.test_index - publicCount + 1}`
                  : `Публичный тест ${detail.test_index + 1}`}
                <small>{Math.round(detail.elapsed_ms * 10) / 10} мс</small>
              </summary>
              {!hidden && (
                <div>
                  <p>
                    <span>Вход</span>
                    <code>{formatValue(detail.input)}</code>
                  </p>
                  <p>
                    <span>Получено</span>
                    <code>{formatValue(detail.actual)}</code>
                  </p>
                  <p>
                    <span>Ожидалось</span>
                    <code>{formatValue(detail.expected)}</code>
                  </p>
                </div>
              )}
              {detail.error && (
                <pre>
                  <code>{detail.error}</code>
                </pre>
              )}
              {detail.diagnostic && <p>{detail.diagnostic}</p>}
            </details>
          )
        })}
      </div>
    </section>
  )
}

function prettyJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
function formatValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}
function verdictLabel(verdict: string) {
  return (
    (
      {
        Accepted: 'Решение принято',
        Completed: 'Выполнено',
        'Wrong Answer': 'Неверный ответ',
        'Compilation Error': 'Ошибка в коде',
        'Runtime Error': 'Ошибка выполнения',
        'Invalid Function Signature': 'Проверьте сигнатуру',
      } as Record<string, string>
    )[verdict] ?? verdict
  )
}
