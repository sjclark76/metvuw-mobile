const CACHE_NAME = 'metvuw-mobile-cache-v14';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// --- Event Listeners ---

// On install, cache the fundamental app shell pages.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// On activate, delete old caches to prevent conflicts.
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

// Listen for messages from the client to pre-cache critical assets.
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

  // 1. Navigation Requests: Network falling back to Cache, then Offline page.
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
            // If it's in the cache, serve it. Otherwise, serve the offline page.
            return response || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // 2. All Other Requests (CSS, JS, Images, API): Stale-While-Revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(response => {
        // Fetch in the background to update the cache for next time.
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
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








