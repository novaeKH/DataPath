import { useState } from 'react'
import type { LessonScene } from '../../lib/api'
import { MarkdownContent } from './MarkdownContent'
import { LabHost } from '../interactive/LabHost'
import { CheckpointScene } from './CheckpointScene'

/** Пользовательский заголовок сцены: display_title (Фаза 6A) → title. */
function sceneTitle(scene: LessonScene): string | null {
  return scene.display_title ?? scene.title ?? null
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
function MarkdownScene({ scene }: { scene: LessonScene }) {
  const title = sceneTitle(scene)
  return (
    <section className="dp-scene">
      <SceneRoleBadge role={scene.semantic_role} type={scene.type} />
      {title && (
        <h3
          className="mb-3 text-lg font-semibold"
          style={{ color: 'var(--dp-text-primary)' }}
        >
          {title}
        </h3>
      )}
      {scene.markdown && (
        <div className="dp-content">
          <MarkdownContent markdown={scene.markdown} />
        </div>
      )}
    </section>
  )
}

/** Formula scene with explanation. */
function FormulaScene({ scene }: { scene: LessonScene }) {
  const title = sceneTitle(scene)
  return (
    <section className="dp-scene">
      <SceneRoleBadge role={scene.semantic_role} type={scene.type} />
      {title && (
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: 'var(--dp-text-primary)' }}
        >
          {title}
        </h3>
      )}
      {scene.formula && (
        <div className="dp-formula-block">
          <div className="overflow-x-auto">
            <MarkdownContent markdown={`$$\\n${scene.formula}\\n$$`} />
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
function CodeSceneComponent({ scene }: { scene: LessonScene }) {
  const title = sceneTitle(scene)
  const [copied, setCopied] = useState(false)
  const languageLabel =
    scene.language && scene.language !== 'text' ? scene.language : null

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
      {title && (
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: 'var(--dp-text-primary)' }}
        >
          {title}
        </h3>
      )}
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
function CalloutScene({ scene }: { scene: LessonScene }) {
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
      {title && (
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: 'var(--dp-text-primary)' }}
        >
          {title}
        </h3>
      )}
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

export function SceneView({ scene }: { scene: LessonScene }) {
  switch (scene.type) {
    case 'markdown':
      return <MarkdownScene scene={scene} />
    case 'formula':
      return <FormulaScene scene={scene} />
    case 'code':
      return <CodeSceneComponent scene={scene} />
    case 'callout':
      return <CalloutScene scene={scene} />
    case 'checkpoint':
      return <CheckpointScene scene={scene} />
    case 'interactive_lab':
      return scene.lab_id ? <LabHost labId={scene.lab_id} title={scene.lab_title ?? null} /> : null
    case 'table':
      return <MarkdownScene scene={scene} />
    case 'visual':
      return <MarkdownScene scene={scene} />
    default:
      return null
  }
}
