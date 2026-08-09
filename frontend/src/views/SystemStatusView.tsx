import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  exportBackup,
  fetchSystemStatus,
  restoreBackup,
  type BackupPayload,
  type SystemStatus,
} from '../lib/api'

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

/** Настройки локальных данных, диагностика и backup. */
export function SystemStatusView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [backupState, setBackupState] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' })
    try {
      const data = await fetchSystemStatus(signal)
      setState({ kind: 'ready', data })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState({
        kind: 'error',
        message: 'Локальное хранилище временно недоступно. Перезапустите DataPath и повторите.',
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const downloadBackup = async () => {
    try {
      const payload = await exportBackup()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const filename = `datapath-backup-${new Date().toISOString().slice(0, 10)}.json`
      const file = new File([blob], filename, { type: 'application/json' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'DataPath backup' })
        setBackupState('Backup передан в выбранное приложение или папку.')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      setBackupState('Backup сохранён.')
    } catch {
      setBackupState('Не удалось создать backup.')
    }
  }

  const uploadBackup = async (file: File | undefined) => {
    if (!file) return
    try {
      const payload = JSON.parse(await file.text()) as BackupPayload
      if (!window.confirm('Заменить текущий учебный progress данными из backup?')) return
      await restoreBackup(payload)
      setBackupState('Progress восстановлен. Обновите страницы обучения.')
    } catch (error) {
      setBackupState(error instanceof Error ? error.message : 'Не удалось восстановить backup.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Настройки</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Локальные данные, резервная копия и диагностика приложения
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
          <div className="mt-10 text-center text-sm text-slate-500">Проверка локальных данных…</div>
        )}

        {state.kind === 'error' && (
          <div className="mt-10 rounded-xl border border-rose-300 bg-rose-50 p-6 dark:border-rose-800/60 dark:bg-rose-950/40">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold">Данные недоступны</span>
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
              <StatusPill ok={state.data.status === 'ok'} label="Приложение готово" />
              <StatusPill ok={state.data.database.available} label="Прогресс доступен" />
              <StatusPill ok={state.data.vault.exists} label="Уроки доступны" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatusCard
                title="Версия"
                value={`DataPath ${state.data.version}`}
                ok={state.data.status === 'ok'}
                hint="Stable local-first release"
              />
              <StatusCard
                title="Учебный прогресс"
                value={state.data.database.available ? 'сохраняется' : 'недоступен'}
                ok={state.data.database.available}
              />
              <StatusCard
                title="Учебный контент"
                value={state.data.vault.exists ? 'доступен offline' : 'не найден'}
                ok={state.data.vault.exists}
              />
              <StatusCard
                title="Материалы"
                value={String(state.data.vault.markdown_files)}
                ok
                hint="локальных source-backed файлов"
              />
            </div>

            <section className="rounded-xl p-5 dp-surface">
              <h2 className="text-base font-semibold">Backup учебного состояния</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                Экспорт содержит progress, mastery, попытки и Review. Храните файл в надёжном месте
                — его можно импортировать после обновления или переустановки.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void downloadBackup()}
                  className="min-h-11 rounded-xl px-4 text-sm font-semibold"
                  style={{ background: 'var(--dp-accent)', color: 'var(--dp-surface)' }}
                >
                  Скачать backup
                </button>
                <label
                  className="flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold"
                  style={{ borderColor: 'var(--dp-border-strong)' }}
                >
                  Восстановить из файла
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(event) => void uploadBackup(event.target.files?.[0])}
                  />
                </label>
              </div>
              {backupState && (
                <p
                  role="status"
                  className="mt-3 text-xs"
                  style={{ color: 'var(--dp-text-secondary)' }}
                >
                  {backupState}
                </p>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  )
}
