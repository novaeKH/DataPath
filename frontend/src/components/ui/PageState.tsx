import type { ReactNode } from 'react'
import { Button } from './Button'

/**
 * Общие состояния страниц: loading (скелетон со стабильными размерами),
 * empty (объяснение + одно действие), error (понятное сообщение + retry).
 */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="dp-page-title">{title}</h1>
        {subtitle && <p className="dp-page-subtitle mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Скелетон загрузки: стабильная высота, лёгкое мерцание, без скачков layout. */
export function LoadingBlock({
  label = 'Загрузка…',
  rows = 3,
  className = '',
}: {
  label?: string
  rows?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex min-h-[200px] flex-col justify-center gap-3 rounded-xl p-6 dp-surface ${className}`}
    >
      <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800/50"
          style={{ width: `${[92, 78, 85][i % 3]}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
      <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

/** Пустое состояние. */
export function EmptyState({
  title,
  description,
  action,
  className = '',
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center ${className}`}
      style={{
        borderColor: 'var(--dp-border-strong)',
        color: 'var(--dp-text-secondary)',
      }}
    >
      <div className="text-base font-semibold" style={{ color: 'var(--dp-text-primary)' }}>
        {title}
      </div>
      {description && (
        <div className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--dp-text-secondary)' }}>
          {description}
        </div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Ошибка: что именно не получилось + retry. */
export function ErrorState({
  title = 'Не удалось загрузить',
  message,
  onRetry,
  className = '',
}: {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl p-8 text-center ${className}`}
      style={{
        background: 'var(--dp-error-subtle)',
        border: '1px solid var(--dp-error)',
        borderColor: 'color-mix(in srgb, var(--dp-error) 30%, transparent)',
      }}
    >
      <div className="text-base font-semibold" style={{ color: 'var(--dp-error)' }}>
        {title}
      </div>
      <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--dp-error)' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" className="mt-1" onClick={onRetry}>
          Попробовать снова
        </Button>
      )}
    </div>
  )
}
