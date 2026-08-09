import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { bundledAssetUrl, bundledBaseUrl } from './platform/paths'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(bundledAssetUrl('sw.js'), { scope: bundledBaseUrl().pathname })
      .catch(() => {
        // The app remains fully usable online when registration is unavailable.
      })
  })
}
