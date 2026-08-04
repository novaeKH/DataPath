import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchSystemStatus, type SystemStatus } from '../lib/api'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: SystemStatus }

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-sm text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${ok ? 'text-slate-100' : 'text-rose-300'}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

/**
 * Техническая страница Фазы 1: статус backend, SQLite, vault и счётчик
 * Markdown-файлов. Никаких бизнес-расчётов — только отображение данных API.
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
            <h1 className="text-2xl font-bold text-slate-100">Статус системы</h1>
            <p className="mt-1 text-sm text-slate-400">
              Техническая страница Фазы 1 — проверка соединения frontend ↔ backend
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
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
          <div className="mt-10 rounded-xl border border-rose-800/60 bg-rose-950/40 p-6">
            <div className="flex items-center gap-2 text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="font-semibold">Backend недоступен</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-rose-200/80">{state.message}</p>
            <button
              onClick={() => void load()}
              className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/30"
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
