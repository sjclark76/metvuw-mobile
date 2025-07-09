const CACHE_NAME = 'metvuw-mobile-cache-v12';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// --- Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell HTML');
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    console.log('Received asset list from client, pre-caching...');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        // Add a leading slash to the assets if they don't have one
        const assetsToCache = event.data.payload.map((asset) => 
          asset.startsWith('/') ? asset : '/' + asset
        );
        console.log('Caching critical assets:', assetsToCache);
        return cache.addAll(assetsToCache);
      }).catch(error => {
        console.error('Failed to cache critical assets:', error);
      })
    );
  }
  // Note: The cleanup logic can be removed from here if it's not needed,
  // or kept if you want to trigger it from the client. For simplicity,
  // I'm focusing on the asset caching fix.
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Navigation requests: Network-first, then cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails, try the cache for the specific page.
          return caches.match(request).then(response => response || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // 2. All other requests (CSS, JS, images, API): Cache-first, then network.
  // This is fast and reliable for assets that have been pre-cached.
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchResponse => {
        if (fetchResponse.ok) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return fetchResponse;
      });
    })
  );
});






