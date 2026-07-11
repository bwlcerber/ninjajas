const CACHE_NAME = 'ninjapromo-portal-cache-v1';

// We want to cache specific image requests to ensure they don't load from zero next time
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // We only cache images (e.g., creatives thumbnails)
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately, then update cache in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // If not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }).catch((error) => {
          // You could return a fallback image here if needed
          throw error;
        });
      })
    );
  } else {
    // For non-image requests, just do normal fetch
    event.respondWith(fetch(request));
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
