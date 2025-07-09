const CACHE_NAME = 'metvuw-mobile-cache-v7'; // Updated cache name
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
      await cleanupCache(); // Also run on activation as a fallback
    })()
  );
});

// Listen for messages from the client to trigger cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    console.log('Received cleanup message from client.');
    event.waitUntil(cleanupCache());
  }
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation requests: Network-first, falling back to the cached app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails, always serve the main app shell.
        // The client-side router will handle rendering the correct page.
        return caches.match('/');
      })
    );
  } 
  // 2. Other requests (JS, CSS, JSON, images, API): Stale-while-revalidate
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


