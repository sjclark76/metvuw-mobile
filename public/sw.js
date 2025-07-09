const CACHE_NAME = 'metvuw-mobile-cache-v13';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];
const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;

// --- Cache Cleanup Function ---
const cleanupCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  console.log('Running cache cleanup for items older than 10 days...');

  for (const request of keys) {
    // Don't clean up the app shell or critical assets
    if (APP_SHELL_URLS.includes(request.url) || request.url.includes('/_next/static/')) {
      continue;
    }
    
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
        const assetsToCache = event.data.payload.map((asset) => 
          asset.startsWith('/') ? asset : '/' + asset
        );
        console.log('Caching critical assets:', assetsToCache);
        return cache.addAll(assetsToCache);
      }).catch(error => {
        console.error('Failed to cache critical assets:', error);
      })
    );
  } else if (event.data && event.data.type === 'CLEANUP_CACHE') {
    console.log('Received cleanup message from client.');
    event.waitUntil(cleanupCache());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then(response => response || caches.match(OFFLINE_URL));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchResponse => {
        if (fetchResponse.ok) {
          const responseToCache = fetchResponse.clone();
          // Add timestamp to non-critical assets for cleanup
          if (!request.url.includes('/_next/static/')) {
            const headers = new Headers(fetchResponse.headers);
            headers.set('x-cache-timestamp', Date.now());
            const timestampedResponse = new Response(fetchResponse.clone().body, {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              headers: headers
            });
            caches.open(CACHE_NAME).then(cache => cache.put(request, timestampedResponse));
          } else {
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          }
        }
        return fetchResponse;
      });
    })
  );
});







