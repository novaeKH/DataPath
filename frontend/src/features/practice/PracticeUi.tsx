import type { ReactNode } from 'react'

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className="dp-practice-progress" aria-label={label ?? `Прогресс ${safe}%`}>
      <span style={{ width: `${safe}%` }} />
    </div>
  )
}

export function InlineCodeText({ children }: { children: string }) {
  return (
    <>
      {children.split(/(`[^`]*`)/g).map((part, index) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={`${part}-${index}`} className="dp-inline-code">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}

export function PracticeBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: string
}) {
  return <span className={`dp-practice-badge is-${tone}`}>{children}</span>
}

export function EditorTextarea({
  value,
  onChange,
  language,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  language: 'sql' | 'python'
  ariaLabel: string
}) {
  return (
    <div className="dp-code-editor">
      <div className="dp-code-editor-bar">
        <span>{language === 'sql' ? 'SQLite' : 'Python 3 · WASM'}</span>
        <span>⌘/Ctrl + Enter — запустить</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="dp-code-editor-input"
      />
    </div>
  )
}

export function ResultTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  if (columns.length === 0) return null
  return (
    <div className="dp-result-table-wrap">
      <table className="dp-result-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-${index}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, columnIndex) => (
                <td key={columnIndex}>
                  {value == null ? <span className="dp-null">NULL</span> : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
