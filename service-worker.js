const CACHE_NAME = 'elidir-stats-shell-v1';

const CORE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './TKborder.png',
  './FDborder.png',
  './FDEborder.png',
  './SNborder.png',
  './SGborder.png',
  './CMborder.png',
  './SMborder.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(CORE_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches
      .keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(cacheName) {
              return cacheName !== CACHE_NAME;
            })
            .map(function(cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  const currentUrl = new URL(self.location.href);

  /*
   * Leave the Apps Script API and all other cross-origin
   * requests completely alone. This keeps stats live.
   */
  if (requestUrl.origin !== currentUrl.origin) {
    return;
  }

  /*
   * Network-first means normal online use always checks GitHub
   * for the newest frontend file. Cached files are only used if
   * the network fails.
   */
  event.respondWith(
    fetch(request)
      .then(function(response) {
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'opaque'
        ) {
          return response;
        }

        const responseCopy = response.clone();

        caches
          .open(CACHE_NAME)
          .then(function(cache) {
            cache.put(request, responseCopy);
          });

        return response;
      })
      .catch(function() {
        return caches
          .match(request)
          .then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }

            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return Response.error();
          });
      })
  );
});
