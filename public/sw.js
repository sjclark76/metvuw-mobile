const CACHE_NAME = 'metvuw-mobile-cache-v4'; // Updated cache name
const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;
const APP_SHELL_URLS = ['/'];

// --- Cache Cleanup Function ---
const cleanupCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  console.log('Running cache cleanup for items older than 10 days...');

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const timestampHeader = response.headers.get('x-cache-timestamp');
      if (timestampHeader) {
        const timestamp = parseInt(timestampHeader, 10);
        if (Date.now() - timestamp > TEN_DAYS_IN_MS) {
          console.log('Deleting expired cache entry:', request.url);
          await cache.delete(request);
        }
      }
    }
  }
};

// --- Event Listeners ---

// On install, cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// On activate, clean up old cache versions and run the new cleanup routine
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete old versions of the cache
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      // 2. Clean up expired items in the current cache
      await cleanupCache();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation requests: Network-first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we get a valid response, cache it and return it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, serve the main app shell from cache
          return caches.match('/');
        })
    );
  }
  // 2. Other requests (images, API): Stale-while-revalidate with timestamping
  else {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const headers = new Headers(networkResponse.headers);
            headers.set('x-cache-timestamp', Date.now());
            const responseToCache = new Response(networkResponse.clone().body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers: headers
            });
            cache.put(event.request, responseToCache);
          }
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});



