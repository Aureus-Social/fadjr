const CACHE = 'fadjr-v2'
const STATIC = ['/app', '/manifest.json', '/favicon.ico']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(()=>{})))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Network-first for APIs
  if(['aladhan.com','alquran.cloud','supabase.co','nominatim.openstreetmap.org'].some(h => url.hostname.includes(h))){
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(self.registration.showNotification(data.title || '🕌 FADJR', {
    body: data.body || "C'est l'heure de la prière",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 100, 300]
  }))
})
