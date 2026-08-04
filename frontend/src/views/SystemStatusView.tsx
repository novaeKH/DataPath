import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchSystemStatus, type SystemStatus } from '../lib/api'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: SystemStatus }

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        ok
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {label}
    </span>
  )
}

function StatusCard({
  title,
  value,
  ok,
  hint,
}: {
  title: string
  value: string
  ok: boolean
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
      <div
        className={`mt-2 text-2xl font-semibold ${
          ok ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-300'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

/**
 * Техническая страница: статус backend, SQLite, vault и счётчик Markdown-файлов.
 * Никаких бизнес-расчётов — только отображение данных API.
 */
export function SystemStatusView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const data = await fetchSystemStatus(signal)
      setState({ kind: 'ready', data })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({
        kind: 'error',
        message:
          'Backend недоступен. Убедитесь, что сервер запущен: в папке backend выполните ' +
          '`uv run python -m uvicorn app.main:app --reload` (порт 8000).',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Статус системы
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Техническая страница — проверка соединения frontend ↔ backend
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Обновить
          </button>
        </div>

        {state.kind === 'loading' && (
          <div className="mt-10 text-center text-sm text-slate-500">
            Проверка соединения с backend…
          </div>
        )}

        {state.kind === 'error' && (
          <div className="mt-10 rounded-xl border border-rose-300 bg-rose-50 p-6 dark:border-rose-800/60 dark:bg-rose-950/40">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold">Backend недоступен</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-rose-600 dark:text-rose-200/80">
              {state.message}
            </p>
            <button
              onClick={() => void load()}
              className="mt-4 rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-500/25 dark:text-rose-200"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {state.kind === 'ready' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill ok={state.data.status === 'ok'} label="Backend" />
              <StatusPill ok={state.data.database.available} label="SQLite" />
              <StatusPill ok={state.data.vault.exists} label="Vault" />
              <StatusPill ok={state.data.ollama === 'not_configured'} label="Ollama: не настроен" />
              <StatusPill
                ok={state.data.chromadb === 'not_configured'}
                label="ChromaDB: не настроен"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatusCard
                title="Backend"
                value={state.data.status === 'ok' ? 'работает' : state.data.status}
                ok={state.data.status === 'ok'}
                hint={`DataPath v${state.data.version} · ${state.data.environment}`}
              />
              <StatusCard
                title="SQLite"
                value={state.data.database.available ? 'доступна' : 'недоступна'}
                ok={state.data.database.available}
              />
              <StatusCard
                title="content/vault"
                value={state.data.vault.exists ? 'найден' : 'не найден'}
                ok={state.data.vault.exists}
              />
              <StatusCard
                title="Markdown-файлы"
                value={String(state.data.vault.markdown_files)}
                ok
                hint="без учёта служебных каталогов Obsidian"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
