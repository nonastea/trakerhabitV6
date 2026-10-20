/* ============================================================
   Service Worker — TRACKEADOR_HABITOS_V8
   - Cachea el shell de la app (HTML, manifest, iconos, fuentes)
   - Estrategia: network-first para HTML (siempre intenta lo nuevo),
     cache-first para el resto (rápido)
   - V7: los archivos propios (JS/CSS/JSON) van network-first, así una versión
     nueva de un módulo llega sin tener que cambiar CACHE_VERSION; offline usa la copia
   - Nunca cachea la nube (GitHub/Gist, JSONBin), el dólar ni el clima
   ============================================================ */

const CACHE_VERSION = 'habitos-v8-2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Archivos que componen el shell de la app
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './core/core.css',
  './core/modules.css',
  './core/core.js',
  './core/app.js',
  './core/sync.js',
  './modules/hoy/hoy.js',
  './modules/piel/piel.js',
  './modules/piel/piel.css',
  './modules/gym/gym.js',
  './modules/gym/gym.css',
  './modules/plata/plata.js',
  './modules/plata/plata.css',
  './modules/datos/datos.js',
  './modules/datos/datos.css',
  './data/piel-historial.json',
  './game2/core.js',
  './game2/audio.js',
  './game2/player.js',
  './game2/boss_rasquina.js',
  './game2/boss_pantallon.js',
  './game2/boss_gaston.js',
  './game2/boss_flojera.js',
  './game2/screens.js',
  './game/game.css',
  './game/game.js',
  './game/assets/milo_front.png',
  './game/assets/milo_back.png',
  './game/assets/milo_startled.png',
  './game/assets/monster.png',
  './game/assets/icon_mapa.png',
  './game/assets/icon_tienda.png',
  './game/assets/icon_logros.png',
  './game/assets/icon_mochila.png',
  './game/assets/icon_salir.png'
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
  if (url.hostname.endsWith('github.com') || url.hostname.endsWith('githubusercontent.com')) return;
  if (url.hostname === 'mindicador.cl') return;

  // NUNCA cachear Open-Meteo (clima en tiempo real)
  if (url.hostname.includes('open-meteo.com')) return;

  // HTML y archivos propios → network-first (siempre intenta lo último, cae a cache si falla)
  if (req.mode === 'navigate' || req.destination === 'document' || url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        if (res.ok) caches.open(SHELL_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
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
