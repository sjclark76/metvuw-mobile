const CACHE_NAME = 'metvuw-mobile-cache-v11';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// --- Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      // Also cache the Next.js build manifest to get asset URLs
      return Promise.all([
        cache.addAll(APP_SHELL_URLS),
        fetch('/_next/build-manifest.json')
          .then(res => res.json())
          .then(manifest => {
            const cssFiles = Object.values(manifest.pages['/'] || []);
            console.log('Caching critical CSS:', cssFiles);
            return cache.addAll(cssFiles);
          })
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Navigation requests: Network-first, then cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If we get a good response, cache it.
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // If network fails, try the cache.
          return caches.match(request).then(response => response || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // 2. All other requests (CSS, JS, images, API): Stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => 
      cache.match(request).then(response => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        // Return cached response immediately, and update cache in background.
        return response || fetchPromise;
      })
    )
  );
});






