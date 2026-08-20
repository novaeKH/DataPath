import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageState'
import { loadAlgorithmCatalog, loadSqlCatalog } from '../features/practice/catalog'
import { PRACTICE_PROGRESS_EVENT, projectSummary } from '../features/practice/progress'
import { ProgressBar } from '../features/practice/PracticeUi'

interface HubData {
  sql: ReturnType<typeof projectSummary>
  algorithms: ReturnType<typeof projectSummary>
  sqlFirst: string
  algorithmFirst: string
}

export function PracticeHubView() {
  const [data, setData] = useState<HubData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [sql, algorithms] = await Promise.all([loadSqlCatalog(), loadAlgorithmCatalog()])
        if (!active) return
        setData({
          sql: projectSummary(
            'sql',
            sql.tasks.map((task) => task.id),
          ),
          algorithms: projectSummary(
            'algorithms',
            algorithms.problems.map((problem) => problem.slug),
          ),
          sqlFirst: sql.tasks[0]?.id ?? '',
          algorithmFirst: algorithms.problems[0]?.slug ?? '',
        })
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : 'Практика недоступна.')
      }
    }
    void load()
    window.addEventListener(PRACTICE_PROGRESS_EVENT, load)
    return () => {
      active = false
      window.removeEventListener(PRACTICE_PROGRESS_EVENT, load)
    }
  }, [])

  return (
    <motion.div
      className="mx-auto w-full max-w-[1180px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <section className="dp-studio-hero dp-practice-hero">
        <PageHeader
          eyebrow="Практика"
          title="Два тренажёра. Один прогресс."
          subtitle="SQL на реальной локальной базе и Python-алгоритмы с настоящим выполнением тестов — прямо внутри DataPath, включая установленную PWA."
        />
        <div className="dp-practice-hero-mark" aria-hidden="true">
          <span>SQL</span>
          <i />
          <span>PY</span>
        </div>
      </section>

      {error && <div className="dp-practice-alert is-error mt-6">{error}</div>}
      {!data && !error && <div className="dp-practice-loading mt-8">Подготавливаем тренажёры…</div>}

      {data && (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ProjectCard
            index="01"
            accent="sql"
            eyebrow="SQL Praktikum v3.1"
            title="SQL для аналитики и Data Science"
            description="76 задач на Olist: от первого SELECT до оконных функций, финансовых метрик, feature engineering и защиты от leakage."
            facts={['76 задач', '9 разделов', 'SQLite · offline']}
            solved={data.sql.solved}
            total={data.sql.total}
            to={`/studio/sql/${encodeURIComponent(data.sql.recent ?? data.sqlFirst)}`}
            action={data.sql.recent ? 'Продолжить SQL' : 'Начать SQL'}
          />
          <ProjectCard
            index="02"
            accent="python"
            eyebrow="AlgoPath"
            title="Python-алгоритмы для DS/ML интервью"
            description="71 отобранная задача: массивы, hash map, sliding window, деревья, графы, heap, backtracking и dynamic programming."
            facts={['71 задача', '14 тем', 'Python/WASM · offline']}
            solved={data.algorithms.solved}
            total={data.algorithms.total}
            to={`/studio/algorithms/${encodeURIComponent(data.algorithms.recent ?? data.algorithmFirst)}`}
            action={data.algorithms.recent ? 'Продолжить AlgoPath' : 'Начать AlgoPath'}
          />
        </div>
      )}

      <section className="dp-practice-principles mt-10">
        <div>
          <span>01</span>
          <strong>Без внешнего API</strong>
          <p>SQLite и Python выполняются локально. Решения и черновики не покидают устройство.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Никаких учебных заглушек</strong>
          <p>
            SQL сравнивается с эталонным результатом, Python проходит публичные и скрытые тесты.
          </p>
        </div>
        <div>
          <span>03</span>
          <strong>С места остановки</strong>
          <p>Прогресс, помощь и код сохраняются в общей локальной копии состояния DataPath.</p>
        </div>
      </section>
    </motion.div>
  )
}

function ProjectCard({
  index,
  accent,
  eyebrow,
  title,
  description,
  facts,
  solved,
  total,
  to,
  action,
}: {
  index: string
  accent: 'sql' | 'python'
  eyebrow: string
  title: string
  description: string
  facts: string[]
  solved: number
  total: number
  to: string
  action: string
}) {
  const percent = total ? Math.round((solved / total) * 100) : 0
  return (
    <article className={`dp-project-card is-${accent}`}>
      <div className="dp-project-card-topline">
        <span>{index}</span>
        <span>{eyebrow}</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="dp-project-facts">
        {facts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
      <div className="dp-project-progress-copy">
        <span>{solved} решено</span>
        <strong>{percent}%</strong>
      </div>
      <ProgressBar value={percent} label={`${title}: ${solved} из ${total}`} />
      <Link to={to} className="dp-project-action">
        {action} <span>→</span>
      </Link>
    </article>
  )
}
