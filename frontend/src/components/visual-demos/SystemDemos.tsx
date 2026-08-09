import type React from 'react'
import { VisualDemoFrame } from './VisualDemoHost'

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--dp-surface)' }}>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--dp-text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  )
}

function Flow({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="flex min-w-[520px] items-center gap-2 p-4">
      {labels.map((label, index) => (
        <div key={label} className="contents">
          <div
            className="flex min-h-16 flex-1 items-center justify-center rounded-xl border p-2 text-center text-xs font-semibold"
            style={{
              borderColor: index === active ? 'var(--dp-accent)' : 'var(--dp-border-subtle)',
              background: index === active ? 'var(--dp-accent-subtle)' : 'var(--dp-surface)',
              color: index === active ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
            }}
          >
            {label}
          </div>
          {index < labels.length - 1 && <span style={{ color: 'var(--dp-text-muted)' }}>→</span>}
        </div>
      ))}
    </div>
  )
}

export function RetrievalRankingDemo() {
  const documents = [
    { title: 'Настройка threshold', bm25: 0.92, dense: 0.55 },
    { title: 'Precision и recall', bm25: 0.58, dense: 0.9 },
    { title: 'Обучение дерева', bm25: 0.08, dense: 0.22 },
  ]
  return (
    <VisualDemoFrame
      goal="Смешайте lexical и semantic signal и проследите, почему меняется ranking документов."
      controls={[
        { name: 'denseWeight', label: 'Вес dense', type: 'slider', min: 0, max: 1, step: 0.1 },
        { name: 'chunkSize', label: 'Chunk size', type: 'slider', min: 100, max: 600, step: 100 },
      ]}
      defaults={{ denseWeight: 0.5, chunkSize: 300 }}
    >
      {(state) => {
        const weight = Number(state.denseWeight)
        const ranked = documents
          .map((doc) => ({ ...doc, score: (1 - weight) * doc.bm25 + weight * doc.dense }))
          .sort((a, b) => b.score - a.score)
        return (
          <div className="p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {ranked.map((doc, index) => (
                <div
                  key={doc.title}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--dp-surface)' }}
                >
                  <p className="text-xs font-semibold">
                    #{index + 1} {doc.title}
                  </p>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--dp-border-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${doc.score * 100}%`, background: 'var(--dp-accent)' }}
                    />
                  </div>
                  <p
                    className="mt-2 font-mono text-[10px]"
                    style={{ color: 'var(--dp-text-muted)' }}
                  >
                    hybrid={doc.score.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
              При chunk size {state.chunkSize} документ на 1200 символов даст примерно{' '}
              {Math.ceil(1200 / Number(state.chunkSize))} кандидата. Меньше chunk — точнее фрагмент,
              но больше конкурирующих записей.
            </p>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function RagPipelineDemo() {
  const labels = ['Вопрос', 'Retrieval', 'Rerank', 'Контекст', 'Ответ', 'Evaluation']
  return (
    <VisualDemoFrame
      goal="Пройдите RAG по стадиям и разделите ошибку поиска от ошибки генерации."
      controls={[
        { name: 'step', label: 'Стадия', type: 'slider', min: 0, max: 5, step: 1 },
        { name: 'relevant', label: 'Релевантный chunk найден', type: 'toggle' },
        { name: 'grounded', label: 'Ответ опирается на context', type: 'toggle' },
      ]}
      defaults={{ step: 0, relevant: true, grounded: true }}
    >
      {(state) => {
        const retrieval = state.relevant ? 1 : 0
        const faithfulness = state.relevant && state.grounded ? 1 : 0
        return (
          <div className="overflow-x-auto">
            <Flow labels={labels} active={Number(state.step)} />
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-4">
              <Metric label="Recall@k" value={retrieval ? '1.00' : '0.00'} />
              <Metric label="Context precision" value={retrieval ? '0.67' : '0.00'} />
              <Metric label="Faithfulness" value={faithfulness ? '1.00' : '0.00'} />
              <Metric
                label="Диагноз"
                value={!retrieval ? 'retrieval' : !faithfulness ? 'generation' : 'ok'}
              />
            </div>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function TfidfDemo() {
  const stats: Record<string, { tf: number[]; df: number }> = {
    модель: { tf: [2, 0, 1], df: 2 },
    клиент: { tf: [0, 2, 1], df: 2 },
    редкий: { tf: [0, 0, 1], df: 1 },
  }
  return (
    <VisualDemoFrame
      goal="Выберите слово и увидьте, как term frequency и document frequency формируют TF‑IDF."
      controls={[
        {
          name: 'term',
          label: 'Термин',
          type: 'select',
          options: Object.keys(stats).map((term) => ({ value: term, label: term })),
        },
      ]}
      defaults={{ term: 'модель' }}
    >
      {(state) => {
        const item = stats[String(state.term)]
        const idf = Math.log(3 / item.df) + 1
        return (
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {item.tf.map((tf, index) => (
              <Metric
                key={index}
                label={`Документ ${index + 1}`}
                value={`tf=${tf} · tf-idf=${(tf * idf).toFixed(2)}`}
              />
            ))}
            <p className="sm:col-span-3 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
              df={item.df}/3, idf={idf.toFixed(2)}. Редкое слово получает больший вес, но само по
              себе не понимает смысл и порядок слов.
            </p>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function SqlJoinDemo() {
  type JoinedRow = { id: number; name: string; amount: number | null }
  const customers = [
    { id: 1, name: 'Аня' },
    { id: 2, name: 'Борис' },
    { id: 3, name: 'Вера' },
  ]
  const orders = [
    { customer_id: 1, amount: 900 },
    { customer_id: 1, amount: 400 },
    { customer_id: 3, amount: 700 },
  ]
  return (
    <VisualDemoFrame
      goal="Смените тип JOIN и проследите гранулярность: одна строка клиента может превратиться в несколько заказов."
      controls={[
        {
          name: 'join',
          label: 'JOIN',
          type: 'select',
          options: [
            { value: 'inner', label: 'INNER JOIN' },
            { value: 'left', label: 'LEFT JOIN' },
          ],
        },
      ]}
      defaults={{ join: 'inner' }}
    >
      {(state) => {
        const rows: JoinedRow[] = customers.flatMap<JoinedRow>((customer) => {
          const matches = orders.filter((order) => order.customer_id === customer.id)
          if (matches.length) return matches.map((order) => ({ ...customer, amount: order.amount }))
          return state.join === 'left' ? [{ ...customer, amount: null }] : []
        })
        return (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead>
                <tr>
                  <th className="p-2">customer_id</th>
                  <th className="p-2">name</th>
                  <th className="p-2">amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.id}-${index}`}>
                    <td className="border-t p-2">{row.id}</td>
                    <td className="border-t p-2">{row.name}</td>
                    <td className="border-t p-2">{row.amount ?? 'NULL'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
              Получено {rows.length} строк из {customers.length} клиентов. Дубликат Ани — не ошибка
              JOIN: у неё два заказа.
            </p>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function ReproducibilityDemo() {
  return (
    <VisualDemoFrame
      goal="Зафиксируйте части эксперимента и увидьте, достаточно ли данных, чтобы воспроизвести run."
      controls={[
        { name: 'seed', label: 'Seed', type: 'toggle' },
        { name: 'data', label: 'Data version', type: 'toggle' },
        { name: 'code', label: 'Code revision', type: 'toggle' },
      ]}
      defaults={{ seed: true, data: false, code: false }}
    >
      {(state) => {
        const count = [state.seed, state.data, state.code].filter(Boolean).length
        return (
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Metric label="Parameters" value={state.seed ? 'logged' : 'missing'} />
            <Metric label="Artifacts" value={state.data ? 'data:v12' : 'unknown'} />
            <Metric label="Code" value={state.code ? 'git:a41d' : 'unknown'} />
            <p
              className="sm:col-span-3 text-xs"
              style={{ color: count === 3 ? 'var(--dp-success)' : 'var(--dp-warning)' }}
            >
              {count === 3
                ? 'Run можно идентично повторить.'
                : `Не зафиксировано частей: ${3 - count}. Одинаковая metric ещё не доказывает воспроизводимость.`}
            </p>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function MonitoringDemo() {
  return (
    <VisualDemoFrame
      goal="Разделите data drift, задержку labels и фактическое падение model quality."
      controls={[
        { name: 'drift', label: 'PSI', type: 'slider', min: 0, max: 0.5, step: 0.05 },
        { name: 'quality', label: 'F1', type: 'slider', min: 0.4, max: 0.9, step: 0.05 },
      ]}
      defaults={{ drift: 0.1, quality: 0.78 }}
    >
      {(state) => {
        const drift = Number(state.drift)
        const quality = Number(state.quality)
        const action =
          quality < 0.65
            ? 'проверить incident/retrain'
            : drift > 0.25
              ? 'исследовать сегменты'
              : 'наблюдать'
        return (
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Metric label="Data drift (PSI)" value={drift.toFixed(2)} />
            <Metric label="Delayed F1" value={quality.toFixed(2)} />
            <Metric label="Действие" value={action} />
            <p className="sm:col-span-3 text-xs" style={{ color: 'var(--dp-text-secondary)' }}>
              Drift — сигнал расследования, а не автоматическое доказательство деградации.
              Retraining запускается после проверки quality, сегментов и причины изменения.
            </p>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const SYSTEM_DEMOS: Record<string, React.ComponentType> = {
  'retrieval-ranking-lab': RetrievalRankingDemo,
  'rag-pipeline-evaluation-lab': RagPipelineDemo,
  'tfidf-weight-lab': TfidfDemo,
  'sql-join-grain-lab': SqlJoinDemo,
  'experiment-reproducibility-lab': ReproducibilityDemo,
  'monitoring-drift-quality-lab': MonitoringDemo,
}
