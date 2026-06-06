const CACHE = 'emof-v1'

// Instala o service worker e faz cache dos assets principais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/manifest.json'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Rede primeiro; cache como fallback (app precisa do backend online de qualquer forma)
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/uploads/')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
