import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import 'katex/dist/katex.min.css'

// KaTeX позиционирует подстрочные/надстрочные символы и дроби через INLINE
// style (top/height/margin). rehype-sanitize по умолчанию вырезает style —
// без него n_L опускается на уровень знаменателя и читается как «n / L».
// Поэтому style разрешён на span/code (KaTeX создаёт только span; raw HTML
// из vault не исполняется, т.к. rehypeRaw не подключён). aria-hidden
// сохраняется, чтобы MathML-дубликат формулы не попадал в a11y-дерево.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'ariaHidden'],
    span: [...(defaultSchema.attributes?.span ?? []), ['className'], ['style']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className'], ['style']],
  },
}

/** Внешние ссылки открываются в новой вкладке, без передачи referrer. */
function SafeLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props
  const external = typeof href === 'string' && /^https?:\/\//.test(href)
  return (
    <a
      href={href}
      {...rest}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {children}
    </a>
  )
}

/** Достаёт первый текстовый фрагмент из React-детей (для callout-заголовка). */
function firstText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(firstText).join(' ')
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    return props.children ? firstText(props.children) : ''
  }
  return ''
}

const CALLOUT_TYPES: Record<string, { label: string; classes: string }> = {
  summary: {
    label: 'Итог',
    classes:
      'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
  },
  warning: {
    label: 'Внимание',
    classes:
      'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
  },
  tip: {
    label: 'Совет',
    classes:
      'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
  },
  note: {
    label: 'Заметка',
    classes:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
  },
  example: {
    label: 'Пример',
    classes:
      'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100',
  },
  hero: {
    label: '',
    classes:
      'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100',
  },
}

function CalloutBlockquote(props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  const { children, ...rest } = props
  const text = firstText(children)
  const match = text.match(/^\[!(\w+)\]\s*(.*)$/)
  const type = match ? match[1].toLowerCase() : 'note'
  const title = match && match[2].trim() ? match[2].trim() : CALLOUT_TYPES[type]?.label
  const style = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note

  // Убираем маркер callout из первого абзаца.
  const cleaned = React.Children.map(children, (child, index) => {
    if (index !== 0 || !React.isValidElement(child)) return child
    const inner = (child.props as { children?: React.ReactNode }).children
    const innerText = firstText(inner)
    const cleanedInner = innerText.replace(/^\[!(\w+)\]\s*/, '').trim()
    return React.cloneElement(child, {}, cleanedInner || inner)
  })

  return (
    <blockquote {...rest} className={`my-4 rounded-lg border-l-4 px-4 py-3 ${style.classes}`}>
      {title && (
        <div className="mb-1 text-xs font-bold uppercase tracking-wide opacity-70">{title}</div>
      )}
      {cleaned}
    </blockquote>
  )
}

/** Безопасный рендер Markdown из vault: GFM, LaTeX, callouts, код, ссылки. */
export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="datapath-markdown text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { throwOnError: false }],
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          a: SafeLink,
          blockquote: CalloutBlockquote,
          pre: (props) => (
            <pre
              {...props}
              className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-100 dark:border-slate-700"
            />
          ),
          code: (props) => {
            const { className, children, ...rest } = props
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code {...rest} className={className}>
                  {children}
                </code>
              )
            }
            return (
              <code
                {...rest}
                className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                {children}
              </code>
            )
          },
          // Tailwind v4 preflight сбрасывает list-style: none — маркеры
          // списков возвращаем явными классами.
          ul: (props) => (
            <ul {...props} className="my-3 list-disc space-y-1 pl-6 marker:text-slate-400" />
          ),
          ol: (props) => (
            <ol {...props} className="my-3 list-decimal space-y-1 pl-6 marker:text-slate-400" />
          ),
          li: (props) => <li {...props} className="leading-relaxed" />,
          table: (props) => (
            <div className="overflow-x-auto">
              <table
                {...props}
                className="my-3 w-full border-collapse text-sm [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-1.5 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-1.5 dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-800 dark:[&_td]:border-slate-700"
              />
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
