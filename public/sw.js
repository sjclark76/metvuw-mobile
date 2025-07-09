const CACHE_NAME = 'metvuw-mobile-cache-v16';
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

  // Strategy 1: Navigation Requests (HTML pages)
  // Network falling back to cache. Tries network first, then cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If network is available, cache the response for offline use.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          // If network fails, try to get the page from the cache.
          return caches.match(request).then(response => {
            return response || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Strategy 2: All Other Requests (CSS, JS, Images, API)
  // Stale-while-revalidate. Serves from cache first, then updates cache in background.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(response => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If the network request is successful (including opaque responses for images),
          // update the cache.
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        // Return the cached version immediately (if available), otherwise wait for the network.
        return response || fetchPromise;
      });
    })
  );
});










