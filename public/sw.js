const CACHE_NAME = 'metvuw-mobile-cache-v20';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// --- EVENT LISTENERS ---

// On install, pre-cache the fundamental app shell pages. This is a simple, robust install step.
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

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Strategy 1: Navigation Requests (HTML pages)
  // Network falling back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the network request is successful, cache the response before returning it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, try to get the page from the cache.
          // If it's not in the cache, serve the offline page.
          return caches.match(request).then(response => {
            return response || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Strategy 2: All Other Requests (CSS, JS, Images, API)
  // Stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        // Fetch in the background to update the cache for next time.
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        // Return the cached version immediately (if available), otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});













