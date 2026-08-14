const VERSION = 'datapath-v14-complete-lesson-visuals'
const SHELL_CACHE = `${VERSION}-shell`
const STATIC_CACHE = `${VERSION}-static`
const DATA_CACHE = `${VERSION}-data`
const SCOPE_PATH = new URL(self.registration.scope).pathname
const scoped = (path = '') => `${SCOPE_PATH}${path.replace(/^\/+/, '')}`
const CONTENT_FIGURES = [
  '42_logistic_regression.png',
  '43_knn.png',
  '45_svm.png',
  '46_decision_tree.png',
  '47_random_forest.png',
  '48_gradient_boosting.png',
  '52_class_imbalance.png',
  '53_probability_calibration.png',
  '56_pca.png',
  '61_neuron.png',
  '62_mlp.png',
  '63_backpropagation.png',
  '64_optimizers.png',
  '65_dropout.png',
  '66_cnn_convolution.png',
  '67_max_pooling.png',
  '68_rnn_unrolled.png',
  '69_lstm_gates.png',
  '70_embeddings.png',
  '71_attention.png',
  '72_transformer.png',
].map((file) => scoped(`content-assets/datapath-v2/figures/${file}`))
const SHELL = [
  scoped(),
  scoped('index.html'),
  scoped('manifest.webmanifest'),
  scoped('asset-manifest.json'),
  scoped('datapath-icon.svg'),
  scoped('data/release-snapshot.json'),
  scoped('vendor/sql-wasm.wasm'),
  ...CONTENT_FIGURES,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await cache.addAll(SHELL)
      const index = await cache.match(scoped('index.html'))
      const html = index ? await index.text() : ''
      const assets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map(
        (match) => new URL(match[1], self.registration.scope).pathname,
      )
      const manifestResponse = await cache.match(scoped('asset-manifest.json'))
      const manifest = manifestResponse ? await manifestResponse.json() : { files: [] }
      const releaseAssets = Array.isArray(manifest.files)
        ? manifest.files.map((file) => scoped(file))
        : []
      await Promise.all(
        [...new Set([...assets, ...releaseAssets])].map((asset) => cache.add(asset)),
      )
      await self.skipWaiting()
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

function isCacheableApi(url) {
  const pathname = url.pathname.startsWith(SCOPE_PATH)
    ? `/${url.pathname.slice(SCOPE_PATH.length)}`
    : url.pathname
  return (
    pathname.startsWith('/api/content/') ||
    pathname === '/api/atlas' ||
    pathname === '/api/roadmap' ||
    pathname.startsWith('/api/reviews/queue') ||
    pathname.startsWith('/api/reviews/summary')
  )
}

async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    if (fallback) {
      const shell = await caches.open(SHELL_CACHE)
      const fallbackResponse = await shell.match(fallback)
      if (fallbackResponse) return fallbackResponse
    }
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE, scoped('index.html')))
    return
  }
  if (isCacheableApi(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE))
    return
  }
  if (
    url.pathname === scoped('data/release-snapshot.json') ||
    url.pathname === scoped('vendor/sql-wasm.wasm')
  ) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
    return
  }
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(cacheFirst(request))
  }
})
