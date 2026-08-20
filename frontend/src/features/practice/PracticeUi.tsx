import { useMemo, useRef } from 'react'
import type { KeyboardEvent, ReactNode, UIEvent } from 'react'

type EditorLanguage = 'sql' | 'python'

const PYTHON_KEYWORDS = new Set(
  'and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield'.split(
    ' ',
  ),
)
const PYTHON_CONSTANTS = new Set(['True', 'False', 'None', 'NotImplemented', 'Ellipsis'])
const PYTHON_TYPES = new Set(
  'Any Callable Dict FrozenSet Generator Iterable Iterator List Literal Mapping Optional Sequence Set Tuple Type Union bool bytes bytearray complex dict float frozenset int list memoryview object range set slice str tuple'.split(
    ' ',
  ),
)
const PYTHON_BUILTINS = new Set(
  'abs all any bin callable chr divmod enumerate filter format getattr hasattr hash help hex id input isinstance issubclass iter len map max min next oct open ord pow print property repr reversed round sorted sum super type vars zip'.split(
    ' ',
  ),
)
const SQL_KEYWORDS = new Set(
  'all alter and as asc attach between by case cast collate column create cross current_date current_time current_timestamp delete desc distinct drop else end escape except exists filter first following from full glob group groups having if in index inner insert intersect into is isnull join last left like limit match natural no not notnull null nulls offset on or order outer over partition pragma preceding primary range recursive references regexp replace right row rows select set table then ties trigger unbounded union unique update using values view when where window with without'.split(
    ' ',
  ),
)
const SQL_CONSTANTS = new Set(['null', 'true', 'false', 'current_date', 'current_time'])

interface SourceToken {
  value: string
  kind: 'comment' | 'string' | 'number' | 'identifier' | 'operator' | 'space' | 'plain'
}

const PYTHON_TOKEN =
  /(#[^\n]*|'''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$)|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\b|[A-Za-z_]\w*|==|!=|<=|>=|:=|->|\*\*|\/\/|<<|>>|[-+*/%@&|^~<>]=?|[()[\]{},.:;]|\s+|.)/gi
const SQL_TOKEN =
  /(--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\b(?:\d+(?:\.\d*)?|\.\d+)\b|[A-Za-z_]\w*|<>|!=|<=|>=|\|\||[-+*/%=<>]|[()[\]{},.:;]|\s+|.)/gi

function tokenizeSource(value: string, language: EditorLanguage): SourceToken[] {
  const pattern = language === 'python' ? PYTHON_TOKEN : SQL_TOKEN
  pattern.lastIndex = 0
  return [...value.matchAll(pattern)].map(({ 0: token }) => {
    if (/^\s+$/.test(token)) return { value: token, kind: 'space' }
    if (/^(#|--|\/\*)/.test(token)) return { value: token, kind: 'comment' }
    if (/^['"`]/.test(token)) return { value: token, kind: 'string' }
    if (/^(?:\d|\.\d)/.test(token)) return { value: token, kind: 'number' }
    if (/^[A-Za-z_]\w*$/.test(token)) return { value: token, kind: 'identifier' }
    if (/^(?:==|!=|<>|<=|>=|:=|->|\*\*|\/\/|<<|>>|\|\||[-+*/%@&|^~<>=])/.test(token)) {
      return { value: token, kind: 'operator' }
    }
    return { value: token, kind: 'plain' }
  })
}

function significantToken(tokens: SourceToken[], start: number, step: -1 | 1) {
  for (let index = start; index >= 0 && index < tokens.length; index += step) {
    if (tokens[index].kind !== 'space' && tokens[index].kind !== 'comment')
      return tokens[index].value
  }
  return ''
}

function tokenClass(tokens: SourceToken[], index: number, language: EditorLanguage) {
  const token = tokens[index]
  if (token.kind !== 'identifier')
    return token.kind === 'plain' || token.kind === 'space' ? '' : token.kind
  const normalized = language === 'sql' ? token.value.toLocaleLowerCase('en-US') : token.value
  const previous = significantToken(tokens, index - 1, -1)
  const next = significantToken(tokens, index + 1, 1)

  if (language === 'python') {
    if (PYTHON_KEYWORDS.has(normalized)) return 'keyword'
    if (PYTHON_CONSTANTS.has(token.value)) return 'constant'
    if (previous === 'def' || previous === 'class') return 'definition'
    if (previous === '.') return 'method'
    if (next === '(') return 'function'
    if (PYTHON_TYPES.has(token.value)) return 'type'
    if (PYTHON_BUILTINS.has(token.value)) return 'builtin'
    return ''
  }

  if (SQL_CONSTANTS.has(normalized)) return 'constant'
  if (SQL_KEYWORDS.has(normalized)) return 'keyword'
  if (next === '(') return 'function'
  if (previous === '.') return 'method'
  return ''
}

function HighlightedSource({ value, language }: { value: string; language: EditorLanguage }) {
  const tokens = useMemo(() => tokenizeSource(value, language), [language, value])
  return (
    <>
      {tokens.map((token, index) => {
        const className = tokenClass(tokens, index, language)
        return (
          <span
            className={className ? `tok-${className}` : undefined}
            key={`${index}-${token.value}`}
          >
            {token.value}
          </span>
        )
      })}
      {value.endsWith('\n') ? '\n ' : null}
    </>
  )
}

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
  language: EditorLanguage
  ariaLabel: string
}) {
  const highlightRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCount = Math.max(1, value.split('\n').length)

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
    if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const input = event.currentTarget
    const start = input.selectionStart
    const end = input.selectionEnd
    const indent = language === 'python' ? '    ' : '  '
    const next = `${value.slice(0, start)}${indent}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(start + indent.length, start + indent.length)
    })
  }

  return (
    <div className="dp-code-editor" data-language={language}>
      <div className="dp-code-editor-bar">
        <span className="dp-code-runtime">
          <i />
          <strong>{language === 'sql' ? 'SQLite' : 'Python'}</strong>
          <em>{language === 'sql' ? 'локальная база' : '3 · WASM'}</em>
        </span>
        <span className="dp-code-shortcut">
          <kbd>⌘/Ctrl</kbd>
          <kbd>Enter</kbd>
          <span>запустить</span>
        </span>
      </div>
      <div className="dp-code-editor-body">
        <div className="dp-code-line-numbers" aria-hidden="true" ref={gutterRef}>
          {Array.from({ length: lineCount }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <div className="dp-code-editor-stack">
          <pre className="dp-code-highlight" aria-hidden="true" ref={highlightRef}>
            <code>
              <HighlightedSource value={value} language={language} />
            </code>
          </pre>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabel}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            className="dp-code-editor-input"
          />
        </div>
      </div>
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
