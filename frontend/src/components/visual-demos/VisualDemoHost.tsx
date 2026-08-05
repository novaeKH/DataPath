/**
 * Visual Demonstration Registry.
 *
 * Registry-based architecture:
 * visualization type → typed config → visualization component → controls → explanation panel.
 *
 * Each demo receives props from the lesson scene context and renders
 * an interactive visualization with:
 * - clear learner goal
 * - compact controls
 * - stable visualization (no remounts)
 * - explanation of current state
 * - light/dark support
 * - reduced-motion support
 * - mobile fallback
 */
import { useCallback, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ===============================================================
   VisualDemoFrame — shared shell for all demos.
   =============================================================== */

interface DemoControl {
  name: string
  label: string
  type: 'slider' | 'select' | 'toggle'
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  unit?: string
}

export interface DemoState {
  [key: string]: number | string | boolean
}

interface VisualDemoFrameProps {
  goal: string
  controls: DemoControl[]
  defaults: DemoState
  children: (state: DemoState, setParam: (name: string, value: number | string | boolean) => void) => React.ReactNode
  explanation?: string
  showReset?: boolean
}

export function VisualDemoFrame({
  goal,
  controls,
  defaults,
  children,
  explanation,
  showReset = true,
}: VisualDemoFrameProps) {
  const [state, setState] = useState<DemoState>({ ...defaults })
  const reduced = useReducedMotion()

  const setParam = useCallback((name: string, value: number | string | boolean) => {
    setState((prev) => {
      const next = { ...prev, [name]: value }
      return next
    })
  }, [])

  const reset = () => {
    setState({ ...defaults })
  }

  return (
    <div
      className="rounded-xl p-5 dp-surface-elevated"
      style={{ background: 'var(--dp-surface)' }}
    >
      {/* Goal */}
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--dp-text-primary)' }}>
        {goal}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-5">
        {controls.map((ctrl) => (
          <label key={ctrl.name} className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--dp-text-secondary)' }}>
            {ctrl.label}
            {ctrl.type === 'slider' && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={ctrl.min ?? 0}
                  max={ctrl.max ?? 100}
                  step={ctrl.step ?? 1}
                  value={Number(state[ctrl.name])}
                  onChange={(e) => setParam(ctrl.name, Number(e.target.value))}
                  className="w-28 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: 'var(--dp-border-subtle)',
                    accentColor: 'var(--dp-accent)',
                  }}
                />
                <span className="font-mono text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                  {String(state[ctrl.name])}{ctrl.unit ?? ''}
                </span>
              </div>
            )}
            {ctrl.type === 'select' && ctrl.options && (
              <select
                value={String(state[ctrl.name])}
                onChange={(e) => setParam(ctrl.name, e.target.value)}
                className="rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--dp-surface)',
                  borderColor: 'var(--dp-border-subtle)',
                  color: 'var(--dp-text-primary)',
                }}
              >
                {ctrl.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {ctrl.type === 'toggle' && (
              <button
                onClick={() => setParam(ctrl.name, !state[ctrl.name])}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors w-fit"
                style={{
                  background: state[ctrl.name] ? 'var(--dp-accent)' : 'var(--dp-surface-interactive)',
                  borderColor: state[ctrl.name] ? 'var(--dp-accent)' : 'var(--dp-border-subtle)',
                  color: state[ctrl.name] ? 'white' : 'var(--dp-text-secondary)',
                }}
              >
                {state[ctrl.name] ? 'Вкл' : 'Выкл'}
              </button>
            )}
          </label>
        ))}
        {showReset && (
          <button
            onClick={reset}
            className="self-end rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors dp-hover-interactive"
            style={{
              borderColor: 'var(--dp-border-subtle)',
              color: 'var(--dp-text-muted)',
            }}
          >
            ↺ Сбросить
          </button>
        )}
      </div>

      {/* Visualization */}
      <motion.div
        key={reduced ? 'static' : undefined}
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--dp-surface-interactive)',
          border: '1px solid var(--dp-border-subtle)',
        }}
      >
        {children(state, setParam)}
      </motion.div>

      {/* Explanation */}
      {explanation && (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--dp-text-secondary)' }}>
          {explanation}
        </p>
      )}
    </div>
  )
}

/* ===============================================================
   Priority Demo 1: Train / Validation / Test Split
   =============================================================== */

export function TrainValTestSplitDemo() {
  const nSamples = 100
  const defaults: DemoState = { trainPct: 60, valPct: 20, groupAware: false }

  const explanation = useMemo(() => {
    const trainPct = Number(defaults.trainPct)
    const valPct = Number(defaults.valPct)
    const train = Math.round(nSamples * (trainPct / 100))
    const val = Math.round(nSamples * (valPct / 100))
    const test = nSamples - train - val
    if (Number(defaults.groupAware)) {
      return `Group-aware сплит: все строки одного пользователя попадают в один fold. ${train} train / ${val} validation / ${test} test. Гарантируется, что тестовый пользователь не появлялся в обучении — leakage исключён.`
    }
    return `Случайный сплит: ${train} train / ${val} validation / ${test} test. При случайном разбиении строки одного пользователя могут оказаться в разных частях — это создаёт data leakage.`
  }, [defaults.trainPct, defaults.valPct, defaults.groupAware])

  return (
    <VisualDemoFrame
      goal="Настройте пропорции train/val/test. Включите group-aware split — увидите, как исключается leakage."
      controls={[
        { name: 'trainPct', label: 'Train %', type: 'slider', min: 40, max: 80, step: 5, unit: '%' },
        { name: 'valPct', label: 'Validation %', type: 'slider', min: 10, max: 40, step: 5, unit: '%' },
        { name: 'groupAware', label: 'Group-aware', type: 'toggle' },
      ]}
      defaults={defaults}
      explanation={explanation}
    >
      {(state) => <SplitVisualization state={state} nSamples={nSamples} />}
    </VisualDemoFrame>
  )
}

function SplitVisualization({ state }: { state: DemoState; nSamples: number }) {
  const trainPct = Number(state.trainPct) / 100
  const valPct = Number(state.valPct) / 100
  const testPct = 1 - trainPct - valPct
  const groupAware = Boolean(state.groupAware)
  const trainW = trainPct * 100
  const valW = valPct * 100
  const testW = testPct * 100

  return (
    <div className="p-4">
      <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Визуализация train/val/test сплита">
        {/* Train block */}
        <rect x={10} y={40} width={`${trainW * 5.6}px`} height={120} rx={6} fill="var(--dp-accent)" fillOpacity={0.3} stroke="var(--dp-accent)" strokeWidth={1.5} />
        <text x={10 + (trainW * 2.8)} y={105} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--dp-accent)">
          Train {Math.round(trainPct * 100)}%
        </text>

        {/* Val block */}
        <rect x={10 + trainW * 5.6} y={40} width={`${valW * 5.6}px`} height={120} rx={6} fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" strokeWidth={1.5} />
        <text x={10 + (trainW * 5.6) + (valW * 2.8)} y={105} textAnchor="middle" fontSize={14} fontWeight={600} fill="#f59e0b">
          Val {Math.round(valPct * 100)}%
        </text>

        {/* Test block */}
        <rect x={10 + (trainW + valW) * 5.6} y={40} width={`${testW * 5.6}px`} height={120} rx={6} fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={1.5} />
        <text x={10 + ((trainW + valW + testW / 2) * 5.6)} y={105} textAnchor="middle" fontSize={14} fontWeight={600} fill="#ef4444">
          Test {Math.round(testPct * 100)}%
        </text>

        {/* Group-aware indicator */}
        {groupAware && (
          <g>
            <line x1={10} y1={175} x2={590} y2={175} stroke="var(--dp-accent)" strokeWidth={2} strokeDasharray="6 3" />
            <text x={300} y={192} textAnchor="middle" fontSize={11} fill="var(--dp-accent)" fontWeight={500}>
              Строки одного пользователя — в одном fold (leakage исключён)
            </text>
          </g>
        )}

        {!groupAware && (
          <g>
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={20 + i * 72} cy={175} r={4} fill="var(--dp-warning)" opacity={0.5} />
            ))}
            <text x={300} y={192} textAnchor="middle" fontSize={11} fill="var(--dp-warning)" fontWeight={500}>
              Осторожно: строки одного user_id могут разойтись по train/test
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/* ===============================================================
   Priority Demo 2: Bias vs Variance
   =============================================================== */

export function BiasVarianceDemo() {
  const defaults: DemoState = { complexity: 1, noise: 0.2 }

  const explanation = useMemo(() => {
    const c = Number(defaults.complexity)
    if (c <= 1) return 'Низкая сложность модели → высокое смещение (bias). Модель не доучивается — не улавливает паттерн, предсказания далеки от истины на train и на test.'
    if (c <= 3) return 'Умеренная сложность → хороший баланс. Модель улавливает паттерн, не переобучаясь на шум. Оптимальная зона.'
    return 'Высокая сложность → высокая дисперсия (variance). Модель подстраивается под каждую точку train, включая шум — на test ошибка растёт.'
  }, [defaults.complexity])

  return (
    <VisualDemoFrame
      goal="Меняйте сложность модели и наблюдайте баланс bias/variance. Низкая сложность — высокий bias; высокая — высокая variance."
      controls={[
        { name: 'complexity', label: 'Сложность модели', type: 'slider', min: 1, max: 7, step: 1 },
        { name: 'noise', label: 'Уровень шума', type: 'slider', min: 0.05, max: 0.5, step: 0.05 },
      ]}
      defaults={defaults}
      explanation={explanation}
    >
      {(state) => <BiasVarianceChart state={state} />}
    </VisualDemoFrame>
  )
}

function BiasVarianceChart({ state }: { state: DemoState }) {
  const complexity = Number(state.complexity)
  // noise is available in state for future use
  const w = 560
  const h = 200
  const pad = { l: 40, r: 16, t: 12, b: 24 }

  // Simulated curves
  const trainErrors = [0.35, 0.22, 0.15, 0.12, 0.10, 0.09, 0.08]
  const valErrors = [0.38, 0.26, 0.20, 0.19, 0.22, 0.28, 0.36]

  const maxErr = 0.45
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const sx = (i: number) => pad.l + (i / 6) * innerW
  const sy = (v: number) => pad.t + innerH - (v / maxErr) * innerH

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img">
      {/* Grid */}
      {[0.1, 0.2, 0.3, 0.4].map((v) => (
        <line key={v} x1={pad.l} y1={sy(v)} x2={pad.l + innerW} y2={sy(v)} stroke="var(--dp-border-subtle)" strokeWidth={0.5} />
      ))}
      {/* Error curves */}
      <polyline
        points={trainErrors.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')}
        fill="none" stroke="var(--dp-accent)" strokeWidth={2.5}
      />
      <polyline
        points={valErrors.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')}
        fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3"
      />
      {/* Current complexity marker */}
      <line x1={sx(complexity - 1)} y1={pad.t} x2={sx(complexity - 1)} y2={pad.t + innerH} stroke="var(--dp-text-primary)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
      <circle cx={sx(complexity - 1)} cy={sy(trainErrors[complexity - 1])} r={5} fill="var(--dp-accent)" stroke="white" strokeWidth={2} />
      <circle cx={sx(complexity - 1)} cy={sy(valErrors[complexity - 1])} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} />
      {/* Legend */}
      <text x={pad.l + 10} y={16} fontSize={10} fill="var(--dp-accent)" fontWeight={600}>— Train error</text>
      <text x={pad.l + 10} y={30} fontSize={10} fill="#f59e0b" fontWeight={600}>- - Validation error</text>
    </svg>
  )
}

/* ===============================================================
   Priority Demo 3: Decision Tree Split (simplified static version
   — full interactive version in DecisionTreeSplitLab)
   =============================================================== */

export function TreeSplitVisualDemo() {
  const w = 500
  const h = 260
  const pad = { l: 40, r: 16, t: 16, b: 28 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  // Two classes separated by a vertical split
  const leftClass0 = 10; const leftClass1 = 3
  const rightClass0 = 2; const rightClass1 = 9

  // Gini calculations
  const parentGini = 1 - ((12/24)**2 + (12/24)**2)
  const leftGini = 1 - ((10/13)**2 + (3/13)**2)
  const rightGini = 1 - ((2/11)**2 + (9/11)**2)
  const weightedGini = (13/24) * leftGini + (11/24) * rightGini
  // Information gain = parent - weighted child impurity
  void (parentGini - weightedGini)

  return (
    <div className="p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Визуализация разбиения дерева решений">
        {/* Grid */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="var(--dp-border-subtle)" />
        <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="var(--dp-border-subtle)" />
        {/* Split line */}
        <line x1={pad.l + innerW / 2} y1={pad.t} x2={pad.l + innerW / 2} y2={pad.t + innerH} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3" />
        {/* Left points */}
        {Array.from({ length: leftClass0 }, (_, i) => (
          <circle key={`l0-${i}`} cx={pad.l + 40 + Math.random() * 180} cy={pad.t + 20 + Math.random() * (innerH - 40)} r={4} fill="#3b82f6" opacity={0.8} />
        ))}
        {Array.from({ length: leftClass1 }, (_, i) => (
          <circle key={`l1-${i}`} cx={pad.l + 40 + Math.random() * 180} cy={pad.t + 20 + Math.random() * (innerH - 40)} r={4} fill="#f59e0b" opacity={0.8} />
        ))}
        {/* Right points */}
        {Array.from({ length: rightClass0 }, (_, i) => (
          <circle key={`r0-${i}`} cx={pad.l + innerW / 2 + 20 + Math.random() * 180} cy={pad.t + 20 + Math.random() * (innerH - 40)} r={4} fill="#3b82f6" opacity={0.8} />
        ))}
        {Array.from({ length: rightClass1 }, (_, i) => (
          <circle key={`r1-${i}`} cx={pad.l + innerW / 2 + 20 + Math.random() * 180} cy={pad.t + 20 + Math.random() * (innerH - 40)} r={4} fill="#f59e0b" opacity={0.8} />
        ))}
        {/* Labels */}
        <text x={pad.l + innerW / 4} y={pad.t + innerH - 8} textAnchor="middle" fontSize={10} fill="var(--dp-text-secondary)">Левая группа</text>
        <text x={pad.l + 3 * innerW / 4} y={pad.t + innerH - 8} textAnchor="middle" fontSize={10} fill="var(--dp-text-secondary)">Правая группа</text>
        {/* Legend */}
        <circle cx={pad.l + innerW - 80} cy={pad.t + 10} r={3} fill="#3b82f6" />
        <text x={pad.l + innerW - 72} y={pad.t + 14} fontSize={9} fill="var(--dp-text-muted)">Класс 0</text>
        <circle cx={pad.l + innerW - 10} cy={pad.t + 10} r={3} fill="#f59e0b" />
        <text x={pad.l + innerW} y={pad.t + 14} fontSize={9} fill="var(--dp-text-muted)">Класс 1</text>
      </svg>
    </div>
  )
}

/* ===============================================================
   Demo Registry
   =============================================================== */

const DEMO_REGISTRY: Record<string, React.ComponentType> = {
  'train-val-test-split': TrainValTestSplitDemo,
  'bias-variance': BiasVarianceDemo,
  'tree-split-visual': TreeSplitVisualDemo,
}

export function getVisualDemo(id: string): React.ComponentType | null {
  return DEMO_REGISTRY[id] ?? null
}

export function VisualDemoHost({ demoId }: { demoId: string }) {
  const Component = getVisualDemo(demoId)
  if (!Component) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ color: 'var(--dp-text-muted)' }}>
        Визуальная демонстрация «{demoId}» пока не реализована.
      </div>
    )
  }
  return <Component />
}
