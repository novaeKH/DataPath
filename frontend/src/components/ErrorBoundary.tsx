import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Глобальный error boundary: вместо белого экрана показывает понятное
 * сообщение и даёт перезагрузить приложение.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Намеренно не показываем стек пользователю; логируем в консоль.
    console.error('DataPath render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-6 dark:bg-slate-950">
          <div className="max-w-md rounded-xl border border-rose-300 bg-white/70 p-8 text-center dark:border-rose-800/60 dark:bg-slate-900/60">
            <div className="text-base font-semibold text-rose-700 dark:text-rose-300">
              Что-то пошло не так
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Интерфейс не смог отрисовать страницу. Перезагрузите приложение — ваши прогресс и
              повторения сохранены на сервере.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
