import { useState } from 'react'
import type { LessonScene } from '../../lib/api'
import { MarkdownContent } from './MarkdownContent'
import { LabHost } from '../interactive/LabHost'

/** Сцена-маркдаун: заголовок секции + связный текст. */
function MarkdownScene({ scene }: { scene: LessonScene }) {
  return (
    <section className="datapath-scene">
      {scene.title && (
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {scene.title}
        </h3>
      )}
      {scene.markdown && <MarkdownContent markdown={scene.markdown} />}
    </section>
  )
}

/** Сцена-формула: LaTeX через KaTeX (remark-math + rehype-katex). */
function FormulaScene({ scene }: { scene: LessonScene }) {
  return (
    <section className="datapath-scene rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Формула
      </div>
      {scene.formula && (
        <div className="overflow-x-auto py-2">
          <MarkdownContent markdown={`$$\n${scene.formula}\n$$`} />
        </div>
      )}
      {scene.explanation && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{scene.explanation}</p>
      )}
    </section>
  )
}

/** Сцена-код: язык, код, подпись. */
function CodeScene({ scene }: { scene: LessonScene }) {
  return (
    <section className="datapath-scene">
      {scene.title && (
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {scene.title}
        </h3>
      )}
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-1.5 text-xs text-slate-300">
          <span className="font-mono">{scene.language ?? 'code'}</span>
        </div>
        <pre className="overflow-x-auto bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-100">
          <code>{scene.code}</code>
        </pre>
      </div>
      {scene.caption && (
        <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">{scene.caption}</p>
      )}
    </section>
  )
}

/** Сцена-callout: важная мысль/предупреждение/пример. */
function CalloutScene({ scene }: { scene: LessonScene }) {
  return (
    <section className="datapath-scene">
      {scene.title && (
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {scene.title}
        </h3>
      )}
      {scene.markdown && (
        <MarkdownContent markdown={`> [${scene.callout_type ?? 'note'}] ${scene.markdown}`} />
      )}
    </section>
  )
}

/** Сцена-checkpoint: самопроверка без сохранения оценки. */
function CheckpointScene({ scene }: { scene: LessonScene }) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  return (
    <section className="datapath-scene rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
        Проверь себя
      </div>
      <p className="text-[15px] font-medium text-slate-800 dark:text-slate-100">{scene.question}</p>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Сформулируй ответ своими словами (нигде не сохраняется)"
        rows={3}
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
      />
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setRevealed((value) => !value)}
          className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {revealed ? 'Скрыть подсказку' : 'Показать подсказку'}
        </button>
        {revealed && (
          <span className="text-indigo-600 dark:text-indigo-300">
            Ключевые слова из урока: вспомни термины, которые только что прочитал, и проверь, что
            можешь объяснить каждый.
          </span>
        )}
      </div>
    </section>
  )
}

/** Точка входа рендера сцены. */
export function SceneView({ scene }: { scene: LessonScene }) {
  switch (scene.type) {
    case 'markdown':
      return <MarkdownScene scene={scene} />
    case 'formula':
      return <FormulaScene scene={scene} />
    case 'code':
      return <CodeScene scene={scene} />
    case 'callout':
      return <CalloutScene scene={scene} />
    case 'checkpoint':
      return <CheckpointScene scene={scene} />
    case 'interactive_lab':
      return scene.lab_id ? <LabHost labId={scene.lab_id} title={scene.lab_title ?? null} /> : null
    default:
      return null
  }
}
