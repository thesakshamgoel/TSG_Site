/**
 * Minimal, safe service worker — just enough to make the site installable as an
 * app and resilient offline, without ever serving stale content.
 *
 * Strategy:
 *  • Navigations (HTML): network-first, fall back to the cached shell offline.
 *    → always fresh when online; still opens when the network is gone.
 *  • Hashed build assets (/assets/*, images, fonts): cache-first (they're
 *    content-hashed, so a new deploy = new URLs; the cache can't go stale).
 *  • Everything cross-origin (YouTube, Firebase, fonts CDN): left to the network.
 */
const VERSION = 'sg-v1'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // only handle same-origin; let YouTube / Firebase / fonts hit the network
  if (url.origin !== self.location.origin) return

  // HTML navigations → network-first with offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put('/', copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/').then((r) => r || caches.match('/index.html')))
    )
    return
  }

  // static assets → cache-first (hashed filenames make this always-fresh)
  if (/\/assets\/|\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(ASSETS).then((c) => c.put(request, copy)).catch(() => {})
            return res
          })
      )
    )
  }
})
