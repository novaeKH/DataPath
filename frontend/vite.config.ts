/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://localhost:8000'

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'datapath-offline-asset-manifest',
        generateBundle(_options, bundle) {
          this.emitFile({
            type: 'asset',
            fileName: 'asset-manifest.json',
            source: JSON.stringify({
              files: Object.keys(bundle)
                .filter((fileName) => fileName.startsWith('assets/'))
                .sort(),
            }),
          })
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        // Dev uses FastAPI through /api; packaged targets use the local platform adapter.
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
