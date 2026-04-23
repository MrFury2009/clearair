// ClearAir service worker — caches app shell (HTML, JS, CSS) only.
// Map tiles and external API calls are intentionally NOT cached.

const CACHE_NAME = 'clearair-shell-v1';

// On install: pre-cache the app shell entry point
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/index.html']))
  );
  // Activate immediately without waiting for old clients to close
  self.skipWaiting();
});

// On activate: delete stale caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// On fetch: serve same-origin HTML/JS/CSS from cache, fall back to network.
// All other requests (tiles, Nominatim, FAA GeoJSON, Protomaps) pass through.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore cross-origin requests (tiles, CDNs, APIs)
  if (url.origin !== self.location.origin) return;

  // Only cache navigations and same-origin JS/CSS assets
  const cacheable = (
    request.destination === 'document' ||
    request.destination === 'script'  ||
    request.destination === 'style'
  );
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
