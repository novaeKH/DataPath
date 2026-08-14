/**
 * Классы кнопок DataPath для элементов-ссылок (Link), чтобы не вкладывать
 * <button> в <a>. Единый источник стилей с компонентом Button.
 *
 * Все варианты имеют явные default/hover/active/disabled состояния;
 * тёмная тема использует семантические токены, не инвертирует светлые классы.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: 'dp-button-primary disabled:opacity-40',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:active:bg-slate-200',
  outline: 'dp-button-outline disabled:opacity-40',
  ghost: 'dp-button-ghost disabled:opacity-40',
  danger:
    'bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200/70 disabled:opacity-40 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-900/40 dark:active:bg-rose-900/60',
}

export const BUTTON_SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-[15px]',
}

export function buttonClassNames(
  variant: Variant = 'outline',
  size: Size = 'md',
  extra = '',
): string {
  return `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`
}
