const CACHE_NAME = 'archero-stats-shell-v8';

const CORE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './loading-snohfo.png',
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

  /* Apps Script remains live and is never intercepted. */
  if (requestUrl.origin !== currentUrl.origin) {
    return;
  }

  /*
   * Stale-while-revalidate: return the local app shell instantly
   * when available, while refreshing the cached copy in the
   * background for the next launch.
   */
  event.respondWith(
    caches.match(request)
      .then(function(cachedResponse) {
        const networkResponse = fetch(request)
          .then(function(response) {
            if (
              response &&
              response.status === 200 &&
              response.type !== 'opaque'
            ) {
              const responseCopy = response.clone();

              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    return cache.put(
                      request,
                      responseCopy
                    );
                  })
              );
            }

            return response;
          })
          .catch(function() {
            return null;
          });

        if (cachedResponse) {
          return cachedResponse;
        }

        return networkResponse
          .then(function(response) {
            if (response) {
              return response;
            }

            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return Response.error();
          });
      })
  );
});
