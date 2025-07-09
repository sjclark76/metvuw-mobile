const CACHE_NAME = 'metvuw-mobile-cache-v15';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// --- Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        const assetsToCache = event.data.payload.map((asset) => 
          asset.startsWith('/') ? asset : '/' + asset
        );
        console.log('Service Worker: Caching critical assets from client:', assetsToCache);
        return cache.addAll(assetsToCache);
      }).catch(error => {
        console.error('Service Worker: Failed to cache critical assets:', error);
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(response => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // --- START DEBUG LOGGING ---
          if (request.destination === 'image') {
            console.log(
              'SW: Fetched image:', request.url, 
              '| Status:', networkResponse.status, 
              '| Type:', networkResponse.type,
              '| OK:', networkResponse.ok
            );
          }
          // --- END DEBUG LOGGING ---
          // We will now cache the image even if it's an opaque response.
          if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});









