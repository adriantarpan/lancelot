/* ==========================================================================
   SERVICE WORKER — hace la app instalable y que abra sin conexión.
   Estrategia "primero la red": siempre se carga la última versión publicada;
   la copia guardada solo se usa si no hay conexión. Así, al volver a publicar,
   los cambios se ven sin tener que reinstalar nada.
   ========================================================================== */

const CACHE = 'lancelot-v7';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.url.startsWith(self.location.origin) || req.url.includes('cdnjs.cloudflare.com'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))),
  );
});
