const CACHE_NAME = 'metvuw-mobile-cache-v10'; // Updated cache name
const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;
const APP_SHELL_URLS = ['/', '/offline'];

// --- Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    console.log('Received cleanup message from client.');
    event.waitUntil(cleanupCache());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Navigation requests: Cache-first, then network, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request).then(fetchResponse => {
          if (fetchResponse.ok) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          }
          return fetchResponse;
        }))
        .catch(() => caches.match('/offline'))
    );
    return;
  }

  // 2. Asset requests (CSS, JS, Fonts, etc.): Stale-while-revalidate.
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => 
        cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // 3. Image and API requests: Stale-while-revalidate with timestamping.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const headers = new Headers(networkResponse.headers);
          headers.set('x-cache-timestamp', Date.now());
          const responseToCache = new Response(networkResponse.clone().body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: headers
          });
          cache.put(request, responseToCache);
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// --- Cache Cleanup Function (remains the same) ---
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





