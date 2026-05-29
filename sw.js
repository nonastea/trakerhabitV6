/* ============================================================
   Service Worker — TRACKEADOR_HABITOS_V6
   - Cachea el shell de la app (HTML, manifest, iconos, fuentes)
   - Estrategia: network-first para HTML (siempre intenta lo nuevo),
     cache-first para el resto (rápido)
   - Nunca cachea api.jsonbin.io (los datos deben ser siempre frescos)
   ============================================================ */

const CACHE_VERSION = 'habitos-v6-1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Archivos que componen el shell de la app
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// INSTALACIÓN: pre-cachea el shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN: limpia caches viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// FETCH: estrategia híbrida
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca interceptar requests no-GET
  if (req.method !== 'GET') return;

  // NUNCA cachear la API de JSONBin (los datos siempre van frescos a la red)
  if (url.hostname === 'api.jsonbin.io') return;

  // NUNCA cachear Open-Meteo (clima en tiempo real)
  if (url.hostname.includes('open-meteo.com')) return;

  // HTML / navegación → network-first (siempre intenta lo último, cae a cache si falla)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Fuentes de Google → cache-first (cambian poco, hay que ser amable con la red)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Resto → cache-first con fallback a red
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // Solo cachea si la respuesta es válida
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});

// MENSAJE: permite forzar actualización desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
