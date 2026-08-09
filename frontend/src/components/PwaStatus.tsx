import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [apiOnline, setApiOnline] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const onApiConnectivity = (event: Event) => {
      setApiOnline((event as CustomEvent<{ online: boolean }>).detail.online)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeinstallprompt', onInstall)
    window.addEventListener('datapath-api-connectivity', onApiConnectivity)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onInstall)
      window.removeEventListener('datapath-api-connectivity', onApiConnectivity)
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let disposed = false
    navigator.serviceWorker.ready.then((registration) => {
      if (disposed) return
      if (registration.waiting) setUpdateWorker(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateWorker(worker)
          }
        })
      })
    })
    return () => {
      disposed = true
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  if (!online || !apiOnline) {
    return (
      <div role="status" className="dp-connectivity-banner">
        Offline · учебные материалы и локальный прогресс доступны
      </div>
    )
  }

  if (updateWorker) {
    return (
      <div role="status" className="dp-connectivity-banner">
        Доступно обновление DataPath
        <button
          type="button"
          onClick={() => {
            navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
              once: true,
            })
            updateWorker.postMessage({ type: 'SKIP_WAITING' })
          }}
        >
          Обновить
        </button>
      </div>
    )
  }

  if (installPrompt && !installDismissed) {
    return (
      <div role="status" className="dp-install-card">
        <span>Установить DataPath как локальное приложение?</span>
        <button type="button" onClick={() => void install()}>
          Установить
        </button>
        <button
          type="button"
          aria-label="Закрыть предложение установки"
          onClick={() => setInstallDismissed(true)}
        >
          ×
        </button>
      </div>
    )
  }

  return null
}
