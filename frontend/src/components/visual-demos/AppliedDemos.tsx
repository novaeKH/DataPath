import type React from 'react'
import { VisualDemoFrame } from './VisualDemoHost'

const BLUE = '#60a5fa'
const AMBER = '#f59e0b'
const RED = '#ef6a6a'
const GREEN = '#45b88a'
const VIOLET = '#a78bfa'

function Readout({
  label,
  value,
  tone = 'var(--dp-text-primary)',
}: {
  label: string
  value: React.ReactNode
  tone?: string
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--dp-surface)' }}>
      <div
        className="text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--dp-text-muted)' }}
      >
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold" style={{ color: tone }}>
        {value}
      </div>
    </div>
  )
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="border-t px-4 py-3 text-xs leading-relaxed"
      style={{ borderColor: 'var(--dp-border-subtle)', color: 'var(--dp-text-secondary)' }}
    >
      {children}
    </p>
  )
}

export function ProblemFramingDemo() {
  return (
    <VisualDemoFrame
      goal="Сформулируйте задачу до выбора модели: unit, target, горизонт и схема split должны описывать одно решение."
      controls={[
        {
          name: 'horizon',
          label: 'Горизонт прогноза',
          type: 'slider',
          min: 1,
          max: 30,
          step: 1,
          unit: ' дн.',
        },
        { name: 'timeSplit', label: 'Временной split', type: 'toggle' },
        { name: 'leaky', label: 'Признак после события', type: 'toggle' },
      ]}
      defaults={{ horizon: 14, timeSplit: true, leaky: false }}
    >
      {(s) => {
        const leakage = Boolean(s.leaky)
        return (
          <div>
            <div className="grid gap-3 p-4 sm:grid-cols-4">
              <Readout label="Unit" value="клиент × дата" />
              <Readout label="Target" value={`churn ≤ ${s.horizon} дн.`} />
              <Readout
                label="Split"
                value={s.timeSplit ? 'past → future' : 'random rows'}
                tone={s.timeSplit ? GREEN : AMBER}
              />
              <Readout
                label="Leakage"
                value={leakage ? 'обнаружен' : 'нет'}
                tone={leakage ? RED : GREEN}
              />
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                {['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'].map((m, i) => (
                  <div
                    key={m}
                    className="rounded py-3"
                    style={{
                      background: i < 4 || !s.timeSplit ? `${BLUE}24` : `${AMBER}2a`,
                      color: 'var(--dp-text-secondary)',
                    }}
                  >
                    {m}
                    <br />
                    {i < 4 || !s.timeSplit ? 'train' : 'test'}
                  </div>
                ))}
              </div>
              {leakage && (
                <p
                  className="mt-3 rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'var(--dp-error-subtle)', color: 'var(--dp-error)' }}
                >
                  last_cancel_reason появился после churn — удалите его до обучения.
                </p>
              )}
            </div>
            <Footer>
              Хороший framing фиксирует момент предсказания. Всё, чего в этот момент ещё нет, нельзя
              превращать в feature.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function RegularizationPathDemo() {
  return (
    <VisualDemoFrame
      goal="Увеличивайте λ и следите, как коэффициенты сжимаются, а validation error сначала уменьшается, затем растёт."
      controls={[{ name: 'lambda', label: 'λ', type: 'slider', min: 0, max: 10, step: 0.5 }]}
      defaults={{ lambda: 2 }}
    >
      {(s) => {
        const l = Number(s.lambda)
        const coefs = [4.2, -3.1, 1.8, 0.7].map((v, i) => v / (1 + l * (0.16 + i * 0.06)))
        const val = 0.42 + (l - 3.5) ** 2 * 0.007
        return (
          <div>
            <svg
              viewBox="0 0 560 220"
              className="w-full"
              role="img"
              aria-label="Путь коэффициентов регуляризации"
            >
              {[4.2, -3.1, 1.8, 0.7].map((v, i) => (
                <polyline
                  key={v}
                  fill="none"
                  stroke={[BLUE, RED, GREEN, VIOLET][i]}
                  strokeWidth="2"
                  points={Array.from(
                    { length: 21 },
                    (_, x) =>
                      `${30 + x * 25},${110 - (v / (1 + x * 0.5 * (0.16 + i * 0.06))) * 20}`,
                  ).join(' ')}
                />
              ))}
              <line
                x1={30 + l * 50}
                x2={30 + l * 50}
                y1="15"
                y2="205"
                stroke={AMBER}
                strokeWidth="2"
              />
            </svg>
            <div className="grid grid-cols-3 gap-2 p-4 pt-0">
              <Readout label="Ненулевых" value={coefs.filter((x) => Math.abs(x) > 0.35).length} />
              <Readout
                label="||w||₂"
                value={Math.sqrt(coefs.reduce((a, x) => a + x * x, 0)).toFixed(2)}
              />
              <Readout label="Validation MSE" value={val.toFixed(3)} tone={l > 7 ? RED : GREEN} />
            </div>
            <Footer>
              Регуляризация уменьшает variance ценой bias. Лучшее λ выбирают на validation/CV, не на
              test.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

const anomalyScores = [0.08, 0.12, 0.16, 0.2, 0.24, 0.3, 0.36, 0.41, 0.55, 0.67, 0.82, 0.94]
export function AnomalyDemo() {
  return (
    <VisualDemoFrame
      goal="Меняйте threshold anomaly score: больше найденных случаев означает больше ложных тревог для проверки."
      controls={[
        { name: 'threshold', label: 'Threshold', type: 'slider', min: 0.1, max: 0.95, step: 0.05 },
      ]}
      defaults={{ threshold: 0.7 }}
    >
      {(s) => {
        const t = Number(s.threshold)
        const flagged = anomalyScores.filter((x) => x >= t).length
        return (
          <div>
            <div className="flex min-h-48 items-end gap-2 p-5">
              {anomalyScores.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${20 + v * 130}px`,
                    background: v >= t ? RED : BLUE,
                    opacity: v >= t ? 1 : 0.45,
                  }}
                  title={String(v)}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 pt-0">
              <Readout label="Flagged" value={`${flagged} / ${anomalyScores.length}`} tone={RED} />
              <Readout label="Проверок/день" value={flagged * 18} />
              <Readout
                label="Recall proxy"
                value={`${Math.min(99, Math.round((1 - t) * 120 + 35))}%`}
              />
            </div>
            <Footer>
              Anomaly score не является доказательством fraud: threshold превращает ranking в
              очередь ручной проверки.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function CategoricalEncodingDemo() {
  return (
    <VisualDemoFrame
      goal="Сравните encoding и обработку неизвестной категории, которая встречается только после fit на train."
      controls={[
        {
          name: 'encoding',
          label: 'Encoding',
          type: 'select',
          options: [
            { value: 'onehot', label: 'One-hot' },
            { value: 'ordinal', label: 'Ordinal' },
            { value: 'target', label: 'Target mean' },
          ],
        },
        { name: 'unknown', label: 'Новая категория', type: 'toggle' },
      ]}
      defaults={{ encoding: 'onehot', unknown: true }}
    >
      {(s) => {
        const cats = s.unknown ? ['Moscow', 'Kazan', 'Sochi'] : ['Moscow', 'Kazan', 'Moscow']
        const encode = (c: string) =>
          s.encoding === 'onehot'
            ? c === 'Moscow'
              ? '1 0'
              : c === 'Kazan'
                ? '0 1'
                : '0 0'
            : s.encoding === 'ordinal'
              ? c === 'Moscow'
                ? '0'
                : c === 'Kazan'
                  ? '1'
                  : '−1'
              : c === 'Moscow'
                ? '.31'
                : c === 'Kazan'
                  ? '.44'
                  : '.37'
        return (
          <div>
            <div className="grid grid-cols-2 gap-2 p-5 text-xs">
              <div className="font-semibold">city (input)</div>
              <div className="font-semibold">{String(s.encoding)} (output)</div>
              {cats.map((c, i) => (
                <>
                  <div
                    key={`${c}-${i}`}
                    className="rounded p-2"
                    style={{ background: 'var(--dp-surface)' }}
                  >
                    {c}
                  </div>
                  <div
                    key={`e-${i}`}
                    className="rounded p-2 font-mono"
                    style={{
                      background: c === 'Sochi' ? 'var(--dp-warning-subtle)' : 'var(--dp-surface)',
                      color: c === 'Sochi' ? 'var(--dp-warning)' : 'var(--dp-text-primary)',
                    }}
                  >
                    {encode(c)}
                  </div>
                </>
              ))}
            </div>
            <Footer>
              Encoder обучается только на train. Для неизвестных значений нужна явная политика:
              ignore, unknown index или global mean.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

const clusterPoints = [
  [18, 32],
  [26, 45],
  [35, 28],
  [44, 52],
  [54, 38],
  [145, 45],
  [158, 30],
  [166, 57],
  [180, 39],
  [232, 22],
  [210, 104],
]
export function DensityClusteringDemo() {
  return (
    <VisualDemoFrame
      goal="Настройте ε и min_samples: увидьте core points, два плотностных кластера и шум."
      controls={[
        { name: 'eps', label: 'ε', type: 'slider', min: 12, max: 48, step: 2 },
        { name: 'minPts', label: 'min samples', type: 'slider', min: 2, max: 6, step: 1 },
      ]}
      defaults={{ eps: 30, minPts: 3 }}
    >
      {(s) => {
        const eps = Number(s.eps),
          m = Number(s.minPts)
        return (
          <div>
            <svg viewBox="0 0 260 130" className="w-full p-4">
              {clusterPoints.map(([x, y], i) => {
                const neighbours = clusterPoints.filter(
                  ([a, b]) => Math.hypot(a - x, b - y) <= eps,
                ).length
                const core = neighbours >= m
                const clustered =
                  core ||
                  clusterPoints.some(
                    ([a, b], j) =>
                      j !== i &&
                      Math.hypot(a - x, b - y) <= eps &&
                      clusterPoints.filter(([c, d]) => Math.hypot(c - a, d - b) <= eps).length >= m,
                  )
                return (
                  <g key={i}>
                    {core && (
                      <circle
                        cx={x}
                        cy={y}
                        r={eps}
                        fill="none"
                        stroke={x < 100 ? BLUE : GREEN}
                        opacity=".13"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={core ? 5 : 4}
                      fill={!clustered ? RED : x < 100 ? BLUE : GREEN}
                      stroke={core ? 'white' : 'none'}
                    />
                  </g>
                )
              })}
            </svg>
            <Footer>
              Кольца показывают ε-neighbourhood core points. Красные точки не достижимы из плотной
              области и считаются noise.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function HyperparameterSearchDemo() {
  return (
    <VisualDemoFrame
      goal="Открывайте больше CV trials и наблюдайте, как search уточняет лучшую область без обращения к test."
      controls={[
        { name: 'trials', label: 'Показать trials', type: 'slider', min: 1, max: 16, step: 1 },
      ]}
      defaults={{ trials: 6 }}
    >
      {(s) => {
        const n = Number(s.trials)
        const pts = Array.from({ length: 16 }, (_, i) => ({
          x: 25 + ((i * 67) % 240),
          y: 25 + ((i * 43) % 130),
          score: 0.68 + ((i * 37) % 22) / 100,
        })).slice(0, n)
        const best = pts.reduce((a, b) => (a.score > b.score ? a : b))
        return (
          <div>
            <svg viewBox="0 0 300 180" className="w-full p-4">
              {pts.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={4 + (p.score - 0.68) * 35}
                    fill={p === best ? AMBER : BLUE}
                  />
                  <text x={p.x + 7} y={p.y + 4} fontSize="8" fill="var(--dp-text-muted)">
                    {p.score.toFixed(2)}
                  </text>
                </g>
              ))}
            </svg>
            <div className="grid grid-cols-2 gap-2 p-4 pt-0">
              <Readout label="CV trials" value={n} />
              <Readout label="Best CV score" value={best.score.toFixed(2)} tone={GREEN} />
            </div>
            <Footer>
              Поиск выбирает параметры по CV, затем refit обучает лучший pipeline на полном train.
              Test остаётся одноразовой проверкой.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function InterpretationDemo() {
  return (
    <VisualDemoFrame
      goal="Сравните global permutation importance с вкладом признака в одну prediction."
      controls={[
        {
          name: 'method',
          label: 'Метод',
          type: 'select',
          options: [
            { value: 'global', label: 'Permutation (global)' },
            { value: 'local', label: 'Local contributions' },
          ],
        },
        { name: 'age', label: 'Возраст клиента', type: 'slider', min: 20, max: 70, step: 5 },
      ]}
      defaults={{ method: 'local', age: 45 }}
    >
      {(s) => {
        const local = s.method === 'local'
        const vals = local
          ? [0.24, (Number(s.age) - 45) / 100, -0.16, 0.08]
          : [0.31, 0.22, 0.14, 0.07]
        const labels = ['tenure', 'age', 'contract', 'support']
        return (
          <div>
            <div className="space-y-3 p-5">
              {vals.map((v, i) => (
                <div
                  key={labels[i]}
                  className="grid grid-cols-[70px_1fr_45px] items-center gap-2 text-xs"
                >
                  <span>{labels[i]}</span>
                  <div className="h-3 rounded" style={{ background: 'var(--dp-border-subtle)' }}>
                    <div
                      className="h-full rounded"
                      style={{
                        marginLeft: v < 0 ? `${50 + v * 100}%` : '50%',
                        width: `${Math.abs(v) * 100}%`,
                        background: v < 0 ? GREEN : RED,
                      }}
                    />
                  </div>
                  <span className="font-mono">
                    {v >= 0 ? '+' : ''}
                    {v.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <Footer>
              {local
                ? 'Local contributions объясняют одну prediction относительно baseline. Это не причинный эффект.'
                : 'Permutation показывает падение качества после перемешивания признака; коррелированные features делят importance.'}
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function NaiveBayesDemo() {
  return (
    <VisualDemoFrame
      goal="Включайте наблюдаемые слова и следите, как prior × likelihoods превращаются в posterior."
      controls={[
        { name: 'prior', label: 'Prior spam', type: 'slider', min: 0.1, max: 0.9, step: 0.1 },
        { name: 'free', label: 'Слово free', type: 'toggle' },
        { name: 'meeting', label: 'Слово meeting', type: 'toggle' },
      ]}
      defaults={{ prior: 0.3, free: true, meeting: false }}
    >
      {(s) => {
        const prior = Number(s.prior)
        let a = prior,
          b = 1 - prior
        if (s.free) {
          a *= 0.72
          b *= 0.08
        }
        if (s.meeting) {
          a *= 0.06
          b *= 0.48
        }
        const post = a / (a + b)
        return (
          <div>
            <div className="p-6">
              <div className="mb-3 flex h-10 overflow-hidden rounded-lg">
                <div style={{ width: `${post * 100}%`, background: RED }} />
                <div style={{ width: `${(1 - post) * 100}%`, background: GREEN }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Readout
                  label="P(spam | evidence)"
                  value={`${(post * 100).toFixed(1)}%`}
                  tone={RED}
                />
                <Readout
                  label="P(ham | evidence)"
                  value={`${((1 - post) * 100).toFixed(1)}%`}
                  tone={GREEN}
                />
              </div>
            </div>
            <Footer>
              Naive Bayes перемножает conditional likelihoods, предполагая условную независимость
              признаков. Нормализация превращает веса в posterior.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

type PipelineVariant = 'preprocess' | 'sklearn' | 'cleaning' | 'eda' | 'eda-ml'
function PipelineDemo({ variant }: { variant: PipelineVariant }) {
  const config = {
    preprocess: ['age: null', 'impute → 42', 'scale → 0.18', 'model score'],
    sklearn: ['raw train', 'ColumnTransformer.fit', 'Estimator.fit', 'CV score'],
    cleaning: ['"42" / NA', 'dtype + impute', 'constraints', 'clean table'],
    eda: ['schema', 'quality flags', 'relations', 'hypotheses'],
    'eda-ml': ['EDA finding', 'policy', 'Pipeline', 'CV evidence'],
  }[variant]
  return (
    <VisualDemoFrame
      goal="Изменяйте этап и train-only режим: результат показывает реальное преобразование одной строки и контроль leakage."
      controls={[
        { name: 'step', label: 'Этап', type: 'slider', min: 0, max: 3, step: 1 },
        { name: 'trainOnly', label: 'Fit только на train', type: 'toggle' },
      ]}
      defaults={{ step: 1, trainOnly: true }}
    >
      {(s) => {
        const step = Number(s.step)
        return (
          <div>
            <div className="flex min-h-44 flex-wrap items-center justify-center gap-2 p-5">
              {config.map((x, i) => (
                <div key={x} className="flex items-center gap-2">
                  <div
                    className="min-w-28 rounded-lg border px-3 py-3 text-center text-xs"
                    style={{
                      borderColor:
                        i === step ? (s.trainOnly ? GREEN : RED) : 'var(--dp-border-subtle)',
                      background: i === step ? 'var(--dp-accent-subtle)' : 'var(--dp-surface)',
                      opacity: i <= step ? 1 : 0.35,
                    }}
                  >
                    {x}
                  </div>
                  {i < 3 && <span style={{ color: 'var(--dp-text-muted)' }}>→</span>}
                </div>
              ))}
            </div>
            {!s.trainOnly && (
              <p
                className="mx-4 mb-4 rounded-lg px-3 py-2 text-xs"
                style={{ background: 'var(--dp-error-subtle)', color: 'var(--dp-error)' }}
              >
                Leakage: transform statistics увидели validation/test.
              </p>
            )}
            <Footer>
              Текущий результат: <strong>{config[step]}</strong>. Fit вычисляет параметры только на
              train; transform применяет уже сохранённые параметры.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export const PreprocessingDemo = () => <PipelineDemo variant="preprocess" />
export const SklearnPipelineDemo = () => <PipelineDemo variant="sklearn" />
export const DataCleaningDemo = () => <PipelineDemo variant="cleaning" />
export const EdaWorkflowDemo = () => <PipelineDemo variant="eda" />
export const EdaToPipelineDemo = () => <PipelineDemo variant="eda-ml" />

export function SvmDemo() {
  return (
    <VisualDemoFrame
      goal="Меняйте C и kernel: ширина margin и число support vectors меняют границу решения."
      controls={[
        { name: 'c', label: 'C', type: 'slider', min: 0.2, max: 5, step: 0.2 },
        {
          name: 'kernel',
          label: 'Kernel',
          type: 'select',
          options: [
            { value: 'linear', label: 'Linear' },
            { value: 'rbf', label: 'RBF' },
          ],
        },
      ]}
      defaults={{ c: 1, kernel: 'linear' }}
    >
      {(s) => {
        const margin = 32 / Math.sqrt(Number(s.c))
        return (
          <div>
            <svg viewBox="0 0 320 190" className="w-full">
              <path
                d={s.kernel === 'linear' ? 'M55 175 L260 15' : 'M35 160 Q165 40 285 165'}
                fill="none"
                stroke={VIOLET}
                strokeWidth="3"
              />
              <path
                d={
                  s.kernel === 'linear'
                    ? `M${55 - margin} 175 L${260 - margin} 15`
                    : 'M25 145 Q165 15 295 145'
                }
                fill="none"
                stroke={VIOLET}
                opacity=".35"
                strokeDasharray="5 4"
              />
              <path
                d={
                  s.kernel === 'linear'
                    ? `M${55 + margin} 175 L${260 + margin} 15`
                    : 'M45 178 Q165 64 275 178'
                }
                fill="none"
                stroke={VIOLET}
                opacity=".35"
                strokeDasharray="5 4"
              />
              {[
                [60, 50],
                [95, 70],
                [105, 35],
                [215, 130],
                [245, 145],
                [225, 105],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i === 1 || i === 3 ? 7 : 5}
                  fill={i < 3 ? BLUE : AMBER}
                  stroke={i === 1 || i === 3 ? 'white' : 'none'}
                  strokeWidth="2"
                />
              ))}
            </svg>
            <Footer>
              C ↑ сильнее штрафует ошибки и обычно сужает margin. Обведённые точки — support
              vectors: именно они задают границу.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function TensorShapeDemo() {
  return (
    <VisualDemoFrame
      goal="Проследите форму tensor через Linear layer и проверьте число параметров."
      controls={[
        { name: 'batch', label: 'Batch', type: 'slider', min: 1, max: 8, step: 1 },
        { name: 'features', label: 'Input features', type: 'slider', min: 2, max: 12, step: 1 },
        { name: 'output', label: 'Output features', type: 'slider', min: 1, max: 8, step: 1 },
      ]}
      defaults={{ batch: 4, features: 6, output: 3 }}
    >
      {(s) => (
        <div>
          <div className="flex min-h-48 items-center justify-center gap-4 p-5 text-center">
            <div className="rounded-xl p-4" style={{ background: `${BLUE}20` }}>
              <b>
                [{s.batch}, {s.features}]
              </b>
              <br />
              <span className="text-xs">input</span>
            </div>
            <span>×</span>
            <div className="rounded-xl p-4" style={{ background: `${VIOLET}20` }}>
              <b>
                [{s.features}, {s.output}]
              </b>
              <br />
              <span className="text-xs">weights</span>
            </div>
            <span>→</span>
            <div className="rounded-xl p-4" style={{ background: `${GREEN}20` }}>
              <b>
                [{s.batch}, {s.output}]
              </b>
              <br />
              <span className="text-xs">output</span>
            </div>
          </div>
          <Footer>
            Параметров: {Number(s.features) * Number(s.output) + Number(s.output)} = weights + bias.
            Batch dimension не входит в число параметров.
          </Footer>
        </div>
      )}
    </VisualDemoFrame>
  )
}

export function RnnStateDemo() {
  return (
    <VisualDemoFrame
      goal="Двигайтесь по tokens и меняйте forget/input gates: cell state хранит и забывает информацию."
      controls={[
        { name: 'step', label: 'Token', type: 'slider', min: 0, max: 3, step: 1 },
        { name: 'forget', label: 'Forget gate', type: 'slider', min: 0, max: 1, step: 0.1 },
        { name: 'input', label: 'Input gate', type: 'slider', min: 0, max: 1, step: 0.1 },
      ]}
      defaults={{ step: 1, forget: 0.8, input: 0.5 }}
    >
      {(s) => {
        const tokens = ['very', 'not', 'good', 'today']
        let cell = 0.2
        for (let i = 0; i <= Number(s.step); i++)
          cell = cell * Number(s.forget) + [0.3, -0.8, 0.7, 0.1][i] * Number(s.input)
        return (
          <div>
            <div className="flex min-h-40 items-center justify-center gap-2 p-5">
              {tokens.map((t, i) => (
                <div
                  key={t}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background:
                      i === Number(s.step) ? 'var(--dp-accent-subtle)' : 'var(--dp-surface)',
                    opacity: i <= Number(s.step) ? 1 : 0.35,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 pt-0">
              <Readout label="f × old state" value={(cell * Number(s.forget)).toFixed(2)} />
              <Readout label="i × candidate" value={Number(s.input).toFixed(2)} />
              <Readout label="Cell state" value={cell.toFixed(2)} tone={cell < 0 ? RED : GREEN} />
            </div>
            <Footer>
              Forget gate сохраняет долю прошлого state, input gate записывает новую candidate
              information.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function FineTuningDemo() {
  return (
    <VisualDemoFrame
      goal="Соберите parameter budget: full fine-tuning, frozen backbone или LoRA должны соответствовать объёму данных и памяти."
      controls={[
        {
          name: 'frozen',
          label: 'Заморожено',
          type: 'slider',
          min: 0,
          max: 100,
          step: 10,
          unit: '%',
        },
        { name: 'rank', label: 'LoRA rank', type: 'slider', min: 0, max: 32, step: 4 },
      ]}
      defaults={{ frozen: 90, rank: 8 }}
    >
      {(s) => {
        const base = 110,
          full = base * (1 - Number(s.frozen) / 100),
          lora = Number(s.rank) * 0.08,
          total = full + lora + 0.4
        return (
          <div>
            <div className="p-6">
              <div className="mb-3 flex h-9 overflow-hidden rounded-lg">
                <div
                  style={{ width: `${Number(s.frozen)}%`, background: 'var(--dp-border-strong)' }}
                />
                <div style={{ flex: 1, background: VIOLET }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Readout label="Frozen" value={`${Number(s.frozen) * 1.1}M`} />
                <Readout label="Trainable" value={`${total.toFixed(1)}M`} tone={VIOLET} />
                <Readout label="Optimizer memory" value={`~${(total * 8).toFixed(0)} MB`} />
              </div>
            </div>
            <Footer>
              LoRA добавляет малые trainable matrices; rank повышает capacity и memory. Task head
              остаётся обучаемым.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function DlDebuggingDemo() {
  return (
    <VisualDemoFrame
      goal="Выберите симптом и выполните диагностику в правильном порядке — от маленького batch к градиентам."
      controls={[
        {
          name: 'symptom',
          label: 'Симптом',
          type: 'select',
          options: [
            { value: 'flat', label: 'Loss не падает' },
            { value: 'nan', label: 'NaN loss' },
            { value: 'gap', label: 'Train/val gap' },
          ],
        },
        { name: 'step', label: 'Проверка', type: 'slider', min: 0, max: 3, step: 1 },
      ]}
      defaults={{ symptom: 'flat', step: 0 }}
    >
      {(s) => {
        const fixes = {
          flat: ['overfit 32 samples', 'check labels', 'inspect gradients', 'raise learning rate'],
          nan: [
            'check input finite',
            'lower learning rate',
            'clip gradients',
            'inspect unstable loss',
          ],
          gap: ['verify split', 'add augmentation', 'regularize', 'early stop'],
        }[String(s.symptom)]!
        return (
          <div>
            <div className="space-y-2 p-5">
              {fixes.map((x, i) => (
                <div
                  key={x}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background:
                      i === Number(s.step) ? 'var(--dp-accent-subtle)' : 'var(--dp-surface)',
                    color: i <= Number(s.step) ? 'var(--dp-text-primary)' : 'var(--dp-text-muted)',
                  }}
                >
                  {i < Number(s.step) ? '✓ ' : i === Number(s.step) ? '→ ' : ''}
                  {x}
                </div>
              ))}
            </div>
            <Footer>
              Текущая проверка: <strong>{fixes[Number(s.step)]}</strong>. Меняйте одну причину за
              раз и фиксируйте результат.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
]
export function NumpyArrayDemo() {
  return (
    <VisualDemoFrame
      goal="Выберите axis и увидьте, какие элементы сворачиваются и какая shape остаётся."
      controls={[
        {
          name: 'axis',
          label: 'Axis',
          type: 'select',
          options: [
            { value: '0', label: 'axis=0 (по строкам)' },
            { value: '1', label: 'axis=1 (по столбцам)' },
          ],
        },
        {
          name: 'op',
          label: 'Операция',
          type: 'select',
          options: [
            { value: 'sum', label: 'sum' },
            { value: 'mean', label: 'mean' },
          ],
        },
      ]}
      defaults={{ axis: '0', op: 'sum' }}
    >
      {(s) => {
        const axis = Number(s.axis)
        const vals = axis === 0 ? [5, 7, 9] : [6, 15]
        const out = s.op === 'mean' ? vals.map((v) => v / (axis === 0 ? 2 : 3)) : vals
        return (
          <div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-6">
              <div className="grid grid-cols-3 gap-1">
                {matrix.flat().map((v, i) => (
                  <div
                    key={i}
                    className="rounded p-3 text-center font-mono"
                    style={{
                      background: axis === (i < 3 ? 1 : 0) ? `${BLUE}25` : 'var(--dp-surface)',
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
              <span>→</span>
              <div className={`grid gap-1 ${axis === 0 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {out.map((v) => (
                  <div
                    key={v}
                    className="rounded p-3 font-mono"
                    style={{ background: `${GREEN}25` }}
                  >
                    {Number(v).toFixed(s.op === 'mean' ? 1 : 0)}
                  </div>
                ))}
              </div>
            </div>
            <Footer>
              Input shape (2, 3) → output shape ({out.length},). Axis — измерение, которое исчезает
              при aggregation.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function BroadcastingDemo() {
  return (
    <VisualDemoFrame
      goal="Добавьте vector к matrix: NumPy выравнивает trailing axes и виртуально расширяет размер 1."
      controls={[
        {
          name: 'orientation',
          label: 'Vector',
          type: 'select',
          options: [
            { value: 'row', label: 'shape (3,)' },
            { value: 'col', label: 'shape (2, 1)' },
          ],
        },
        { name: 'scale', label: 'Значение', type: 'slider', min: 1, max: 5, step: 1 },
      ]}
      defaults={{ orientation: 'row', scale: 2 }}
    >
      {(s) => {
        const row = s.orientation === 'row'
        const k = Number(s.scale)
        const result = matrix.map((r, i) => r.map((v, j) => v + (row ? (j + 1) * k : (i + 1) * k)))
        return (
          <div>
            <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-3 p-5 font-mono text-xs">
              <span>
                [[1,2,3],
                <br /> [4,5,6]]
              </span>
              <b>+</b>
              <span>{row ? `[${k},${k * 2},${k * 3}]` : `[[${k}],[${k * 2}]]`}</span>
              <b>=</b>
              <span>
                [[{result[0].join(',')}],
                <br /> [{result[1].join(',')}]]
              </span>
            </div>
            <Footer>
              {row ? '(2, 3) + (3,) → (2, 3)' : '(2, 3) + (2, 1) → (2, 3)'}. Размеры совместимы,
              если равны или один из них равен 1.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function DataframeSelectionDemo() {
  const rows = [
    ['Anna', 34, 1],
    ['Boris', 19, 0],
    ['Chen', 42, 1],
    ['Dina', 27, 0],
  ]
  return (
    <VisualDemoFrame
      goal="Сравните loc, iloc и boolean mask: selection должна сохранять ожидаемый grain результата."
      controls={[
        {
          name: 'method',
          label: 'Selection',
          type: 'select',
          options: [
            { value: 'loc', label: 'loc[:, name:age]' },
            { value: 'iloc', label: 'iloc[:2, :2]' },
            { value: 'mask', label: 'age >= threshold' },
          ],
        },
        { name: 'age', label: 'Age threshold', type: 'slider', min: 20, max: 45, step: 5 },
      ]}
      defaults={{ method: 'mask', age: 30 }}
    >
      {(s) => (
        <div>
          <div className="grid grid-cols-4 gap-px p-5 text-xs">
            {['index', 'name', 'age', 'churn'].map((x) => (
              <b key={x} className="p-2">
                {x}
              </b>
            ))}
            {rows.flatMap((r, i) =>
              [i, ...r].map((v, j) => {
                const selected =
                  s.method === 'loc'
                    ? j > 0 && j < 3
                    : s.method === 'iloc'
                      ? i < 2 && j < 3
                      : Number(r[1]) >= Number(s.age)
                return (
                  <span
                    key={`${i}-${j}`}
                    className="p-2"
                    style={{ background: selected ? `${GREEN}25` : 'var(--dp-surface)' }}
                  >
                    {v}
                  </span>
                )
              }),
            )}
          </div>
          <Footer>
            {s.method === 'mask'
              ? `Mask оставил ${rows.filter((r) => Number(r[1]) >= Number(s.age)).length} строк.`
              : s.method === 'loc'
                ? 'loc выбирает по labels включительно.'
                : 'iloc выбирает по integer positions, правая граница исключается.'}
          </Footer>
        </div>
      )}
    </VisualDemoFrame>
  )
}

export function GroupbyMergeDemo() {
  return (
    <VisualDemoFrame
      goal="Поменяйте aggregation и cardinality join: результат должен иметь предсказуемый grain."
      controls={[
        {
          name: 'agg',
          label: 'Aggregation',
          type: 'select',
          options: [
            { value: 'sum', label: 'sum(revenue)' },
            { value: 'mean', label: 'mean(revenue)' },
          ],
        },
        { name: 'duplicate', label: 'Дубликат в right table', type: 'toggle' },
      ]}
      defaults={{ agg: 'sum', duplicate: false }}
    >
      {(s) => {
        const values = s.agg === 'sum' ? [180, 80] : [90, 80]
        return (
          <div>
            <div className="grid grid-cols-3 gap-3 p-5 text-center text-xs">
              <Readout label="Input rows" value="3 orders" />
              <Readout label="After groupby" value={`A: ${values[0]}, B: ${values[1]}`} />
              <Readout
                label="After merge"
                value={s.duplicate ? '4 rows ⚠' : '2 rows ✓'}
                tone={s.duplicate ? RED : GREEN}
              />
            </div>
            <Footer>
              {s.duplicate
                ? 'Join стал many-to-many и размножил строки. Проверьте validate="many_to_one".'
                : 'Ключ right table уникален: grain результата сохранён.'}
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

export function TimeWindowDemo() {
  const seq = [10, 14, 13, 19, 22, 18, 25]
  return (
    <VisualDemoFrame
      goal="Меняйте rolling window и lag: feature для момента t должна использовать только прошлое."
      controls={[
        { name: 'window', label: 'Window', type: 'slider', min: 2, max: 5, step: 1 },
        { name: 'shift', label: 'shift(1)', type: 'toggle' },
      ]}
      defaults={{ window: 3, shift: true }}
    >
      {(s) => {
        const w = Number(s.window)
        const out = seq.map((_, i) => {
          const end = i - (s.shift ? 1 : 0)
          const a = seq.slice(Math.max(0, end - w + 1), end + 1)
          return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null
        })
        return (
          <div>
            <div className="flex items-end gap-2 p-5">
              {seq.map((v, i) => (
                <div key={i} className="flex-1 text-center text-[10px]">
                  <div className="rounded-t" style={{ height: v * 4, background: BLUE }} />
                  <span>{out[i]?.toFixed(1) ?? '—'}</span>
                </div>
              ))}
            </div>
            <Footer>
              {s.shift
                ? 'shift(1) включён: rolling feature не видит текущий target.'
                : 'Leakage: окно включает значение текущего момента.'}
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

type PlotVariant = 'design' | 'selector' | 'relationship'
function PlotDemo({ variant }: { variant: PlotVariant }) {
  return (
    <VisualDemoFrame
      goal="Выберите аналитический вопрос и группировку: форма графика и вывод должны меняться вместе."
      controls={[
        {
          name: 'question',
          label: 'Вопрос',
          type: 'select',
          options: [
            { value: 'distribution', label: 'Распределение' },
            { value: 'relation', label: 'Связь x–y' },
            { value: 'trend', label: 'Тренд во времени' },
          ],
        },
        { name: 'groups', label: 'Показать группы', type: 'toggle' },
      ]}
      defaults={{
        question: variant === 'relationship' ? 'relation' : 'distribution',
        groups: true,
      }}
    >
      {(s) => {
        const q = String(s.question)
        return (
          <div>
            <svg viewBox="0 0 320 180" className="w-full p-4">
              {q === 'distribution' ? (
                Array.from({ length: 10 }, (_, i) => (
                  <rect
                    key={i}
                    x={20 + i * 27}
                    y={150 - (i < 5 ? i + 2 : 12 - i) * 13}
                    width="20"
                    height={(i < 5 ? i + 2 : 12 - i) * 13}
                    fill={s.groups && i % 2 ? AMBER : BLUE}
                  />
                ))
              ) : q === 'trend' ? (
                <>
                  <polyline
                    points="20,145 70,120 120,132 170,82 220,68 285,32"
                    fill="none"
                    stroke={BLUE}
                    strokeWidth="3"
                  />
                  {s.groups && (
                    <polyline
                      points="20,120 70,128 120,96 170,104 220,54 285,62"
                      fill="none"
                      stroke={AMBER}
                      strokeWidth="3"
                    />
                  )}
                </>
              ) : (
                Array.from({ length: 18 }, (_, i) => (
                  <circle
                    key={i}
                    cx={25 + i * 15}
                    cy={145 - i * 5 + (i % 4) * 10}
                    r="4"
                    fill={s.groups && i % 2 ? AMBER : BLUE}
                  />
                ))
              )}
            </svg>
            <Footer>
              {q === 'distribution'
                ? 'Histogram показывает форму и хвосты; цвет помогает сравнить группы.'
                : q === 'trend'
                  ? 'Line chart сохраняет порядок времени; сравнивайте уровни и slope.'
                  : 'Scatter показывает relation, но группировка может раскрыть Simpson’s paradox.'}
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}
export const PlotDesignDemo = () => <PlotDemo variant="design" />
export const SeabornSelectorDemo = () => <PlotDemo variant="selector" />
export const RelationshipPlotDemo = () => <PlotDemo variant="relationship" />

export function MissingOutlierDemo() {
  return (
    <VisualDemoFrame
      goal="Сравните политику missing values и threshold выбросов — distribution и число строк меняются."
      controls={[
        {
          name: 'policy',
          label: 'Missing policy',
          type: 'select',
          options: [
            { value: 'median', label: 'Median impute' },
            { value: 'drop', label: 'Drop rows' },
          ],
        },
        { name: 'z', label: 'Outlier threshold', type: 'slider', min: 1, max: 4, step: 0.5 },
      ]}
      defaults={{ policy: 'median', z: 2.5 }}
    >
      {(s) => {
        const raw = [12, 13, 14, 15, null, 16, 17, 18, 39]
        const filled = raw
          .map((x) => x ?? (s.policy === 'median' ? 15 : null))
          .filter((x): x is number => x !== null)
        const kept = filled.filter((x) => Math.abs(x - 17) < Number(s.z) * 7)
        return (
          <div>
            <div className="flex min-h-40 items-end gap-3 p-5">
              {raw.map((v, i) => {
                const val = v ?? 15
                const removed = (v === null && s.policy === 'drop') || !kept.includes(val)
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: val * 3,
                      background: v === null ? AMBER : removed ? RED : BLUE,
                      opacity: removed ? 0.25 : 1,
                    }}
                  />
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 pt-0">
              <Readout label="Rows kept" value={`${kept.length} / ${raw.length}`} />
              <Readout
                label="Median"
                value={kept.sort((a, b) => a - b)[Math.floor(kept.length / 2)] ?? '—'}
              />
            </div>
            <Footer>
              Оранжевый столбец — missing, красный — outlier. Проверяйте sensitivity: вывод не
              должен зависеть от одного произвольного threshold.
            </Footer>
          </div>
        )
      }}
    </VisualDemoFrame>
  )
}

// Registry data intentionally lives beside its tightly-coupled components.
// eslint-disable-next-line react-refresh/only-export-components
export const APPLIED_DEMOS: Record<string, React.ComponentType> = {
  'problem-framing-canvas': ProblemFramingDemo,
  'regularization-path-lab': RegularizationPathDemo,
  'anomaly-methods-lab': AnomalyDemo,
  'categorical-encoding-lab': CategoricalEncodingDemo,
  'density-hierarchy-clustering-lab': DensityClusteringDemo,
  'hyperparameter-search-landscape': HyperparameterSearchDemo,
  'interpretation-methods-lab': InterpretationDemo,
  'naive-bayes-evidence-lab': NaiveBayesDemo,
  'preprocessing-pipeline-builder': PreprocessingDemo,
  'pipeline-builder-lab': SklearnPipelineDemo,
  'svm-margin-kernel-lab': SvmDemo,
  'tensor-shape-tracer': TensorShapeDemo,
  'rnn-state-gates-lab': RnnStateDemo,
  'fine-tuning-parameter-budget': FineTuningDemo,
  'dl-debugging-decision-tree': DlDebuggingDemo,
  'numpy-array-lab': NumpyArrayDemo,
  'numpy-broadcasting-lab': BroadcastingDemo,
  'dataframe-selection-lab': DataframeSelectionDemo,
  'data-cleaning-lab': DataCleaningDemo,
  'groupby-merge-lab': GroupbyMergeDemo,
  'time-window-lab': TimeWindowDemo,
  'plot-design-lab': PlotDesignDemo,
  'seaborn-plot-selector': SeabornSelectorDemo,
  'eda-workflow-board': EdaWorkflowDemo,
  'missing-outlier-lab': MissingOutlierDemo,
  'relationship-plot-lab': RelationshipPlotDemo,
  'eda-to-pipeline-builder': EdaToPipelineDemo,
}
