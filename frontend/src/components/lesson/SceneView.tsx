import { lazy, Suspense, useState } from 'react'
import type { LessonScene } from '../../lib/api'
import { isPackagedRuntime } from '../../platform/localApi'
import { InlineMarkdownContent, MarkdownContent } from './MarkdownContent'
import { CheckpointScene, type AssessmentAttempt } from './CheckpointScene'

const LabHost = lazy(() =>
  import('../interactive/LabHost').then((module) => ({ default: module.LabHost })),
)
const VisualDemoHost = lazy(() =>
  import('../visual-demos/VisualDemoHost').then((module) => ({ default: module.VisualDemoHost })),
)

function InteractiveFallback() {
  return (
    <div
      className="min-h-48 animate-pulse rounded-xl dp-surface"
      aria-label="Загрузка интерактивного блока"
    />
  )
}

/** Пользовательский заголовок сцены: display_title (Фаза 6A) → title. */
function sceneTitle(scene: LessonScene): string | null {
  return scene.display_title ?? scene.title ?? null
}

function SceneHeading({ title, className }: { title: string; className: string }) {
  return (
    <h3 className={className} style={{ color: 'var(--dp-text-primary)' }}>
      <InlineMarkdownContent markdown={title} />
    </h3>
  )
}

/* ===============================================================
   Semantic scene renderers
   =============================================================== */

/** Scene role badges — quiet visual cues, not loud labels. */
function SceneRoleBadge({ role, type }: { role?: string | null; type: string }) {
  if (!role || role === type || role === 'theory') return null
  const label =
    role === 'motivation'
      ? 'Зачем'
      : role === 'objectives'
        ? 'Цели'
        : role === 'example'
          ? 'Пример'
          : role === 'pitfalls'
            ? 'Ошибки'
            : role === 'summary'
              ? 'Итог'
              : role === 'interview'
                ? 'Интервью'
                : role === 'intuition'
                  ? 'Интуиция'
                  : role === 'mechanism'
                    ? 'Механизм'
                    : null
  if (!label) return null
  return (
    <span
      className="mb-2 inline-block text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
      style={{ background: 'var(--dp-surface-interactive)', color: 'var(--dp-text-muted)' }}
    >
      {label}
    </span>
  )
}

/** Markdown theory scene with optional role badge. */
function MarkdownScene({ scene, showTitle }: { scene: LessonScene; showTitle: boolean }) {
  const title = sceneTitle(scene)
  return (
    <section className="dp-scene">
      <SceneRoleBadge role={scene.semantic_role} type={scene.type} />
      {showTitle && title && <SceneHeading title={title} className="mb-3 text-lg font-semibold" />}
      {scene.markdown && (
        <div className="dp-content">
          <MarkdownContent markdown={scene.markdown} />
        </div>
      )}
    </section>
  )
}

/** Formula scene with explanation — unescapes double-backslashes from backend. */
function FormulaScene({ scene, showTitle }: { scene: LessonScene; showTitle: boolean }) {
  const title = sceneTitle(scene)
  const formula = scene.formula ? scene.formula.replace(/\\\\/g, '\\') : null
  return (
    <section className="dp-scene">
      <SceneRoleBadge role={scene.semantic_role} type={scene.type} />
      {showTitle && title && <SceneHeading title={title} className="mb-2 text-lg font-semibold" />}
      {formula && (
        <div className="dp-formula-block">
          <div className="overflow-x-auto">
            <MarkdownContent markdown={'$$\n' + formula + '\n$$'} />
          </div>
        </div>
      )}
      {scene.explanation && (
        <div className="mt-3 dp-content">
          <MarkdownContent markdown={scene.explanation} />
        </div>
      )}
    </section>
  )
}

/** Code scene with language label, copy button, line wrapping. */
function CodeSceneComponent({ scene, showTitle }: { scene: LessonScene; showTitle: boolean }) {
  const title = sceneTitle(scene)
  const [copied, setCopied] = useState(false)
  const languageLabel = scene.language && scene.language !== 'text' ? scene.language : null

  const handleCopy = () => {
    if (scene.code) {
      navigator.clipboard.writeText(scene.code).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section className="dp-scene">
      <SceneRoleBadge role={scene.semantic_role} type={scene.type} />
      {showTitle && title && <SceneHeading title={title} className="mb-2 text-lg font-semibold" />}
      <div className="dp-code-block">
        <div
          className="flex items-center justify-between px-4 py-1.5 text-xs"
          style={{ background: 'var(--dp-surface-interactive)', color: 'var(--dp-text-secondary)' }}
        >
          {languageLabel ? (
            <span className="font-mono font-semibold">{languageLabel}</span>
          ) : (
            <span>код</span>
          )}
          <button
            onClick={handleCopy}
            className="rounded px-2 py-0.5 text-[11px] font-medium transition-colors dp-hover-interactive"
            style={{ color: 'var(--dp-text-muted)' }}
          >
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
        <pre
          className="overflow-x-auto p-4 text-[13px] leading-relaxed"
          style={{ color: 'var(--dp-text-primary)' }}
        >
          <code>{scene.code}</code>
        </pre>
      </div>
      {scene.caption && (
        <div className="mt-2 text-sm dp-content">
          <MarkdownContent markdown={scene.caption} />
        </div>
      )}
    </section>
  )
}

/** Callout scene: warning, tip, important note. */
function CalloutScene({ scene, showTitle }: { scene: LessonScene; showTitle: boolean }) {
  const title = sceneTitle(scene)
  const type = scene.callout_type ?? 'note'
  const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    warning: { bg: 'var(--dp-warning-subtle)', border: 'var(--dp-warning)', icon: '⚠️' },
    tip: { bg: 'var(--dp-success-subtle)', border: 'var(--dp-success)', icon: '💡' },
    important: { bg: 'var(--dp-accent-subtle)', border: 'var(--dp-accent)', icon: '📌' },
    note: { bg: 'var(--dp-surface-interactive)', border: 'var(--dp-border-strong)', icon: '📝' },
  }
  const style = typeStyles[type] ?? typeStyles.note

  return (
    <section className="dp-scene">
      {showTitle && title && <SceneHeading title={title} className="mb-2 text-lg font-semibold" />}
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{
          background: style.bg,
          borderLeft: `3px solid ${style.border}`,
          color: 'var(--dp-text-secondary)',
        }}
      >
        {scene.markdown && (
          <div className="dp-content">
            <MarkdownContent markdown={scene.markdown} />
          </div>
        )}
      </div>
    </section>
  )
}

/* ===============================================================
   Entry point: routes scene type to the correct renderer.
   =============================================================== */

export function SceneView({
  scene,
  showTitle = true,
  onAssessmentAttempt,
}: {
  scene: LessonScene
  showTitle?: boolean
  onAssessmentAttempt?: (attempt: AssessmentAttempt) => void | Promise<void>
}) {
  switch (scene.type) {
    case 'markdown':
      return <MarkdownScene scene={scene} showTitle={showTitle} />
    case 'formula':
      return <FormulaScene scene={scene} showTitle={showTitle} />
    case 'code':
      return <CodeSceneComponent scene={scene} showTitle={showTitle} />
    case 'callout':
      return <CalloutScene scene={scene} showTitle={showTitle} />
    case 'checkpoint':
      return <CheckpointScene scene={scene} onAttempt={onAssessmentAttempt} />
    case 'interactive_lab':
      if (!scene.lab_id) return null
      {
        const localDemo = {
          'decision-tree-split-lab': 'decision-tree-split-lab',
          'tree-depth-overfitting-lab': 'bias-variance',
          'ensemble-comparison-lab': 'bootstrap-forest-lab',
        }[scene.lab_id]
        return localDemo && isPackagedRuntime() ? (
          <Suspense fallback={<InteractiveFallback />}>
            <VisualDemoHost demoId={localDemo} />
          </Suspense>
        ) : (
          <Suspense fallback={<InteractiveFallback />}>
            <LabHost labId={scene.lab_id} title={scene.lab_title ?? null} />
          </Suspense>
        )
      }
    case 'visual_demo':
      return scene.demo_id ? (
        <Suspense fallback={<InteractiveFallback />}>
          <VisualDemoHost demoId={scene.demo_id} />
        </Suspense>
      ) : null
    case 'table':
      return <MarkdownScene scene={scene} showTitle={showTitle} />
    case 'visual':
      return <MarkdownScene scene={scene} showTitle={showTitle} />
    default:
      return null
  }
}
