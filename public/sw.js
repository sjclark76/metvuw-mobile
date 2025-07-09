const CACHE_NAME = 'metvuw-mobile-cache-v19';
const OFFLINE_URL = '/offline';

// On install, pre-cache the app shell and its critical assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Service Worker: Caching app shell and critical assets...');
      
      // Fetch the build manifest to find the exact asset URLs.
      const manifestResponse = await fetch('/_next/build-manifest.json');
      const manifest = await manifestResponse.json();
      
      const criticalAssets = new Set([
        '/',
        OFFLINE_URL,
      ]);
      
      // Add assets for the main app and the offline page.
      const mainAppAssets = manifest.pages['/'] || [];
      const offlinePageAssets = manifest.pages['/offline'] || [];
      mainAppAssets.forEach(asset => criticalAssets.add(asset));
      offlinePageAssets.forEach(asset => criticalAssets.add(asset));

      const assetUrlsToCache = Array.from(criticalAssets).map(asset => 
        asset.startsWith('/') ? asset : '/' + asset
      );
      
      console.log('Service Worker: Pre-caching the following:', assetUrlsToCache);
      // Use addAll, which is atomic. If one asset fails, the entire install fails.
      // This is safer for ensuring the app is in a consistent state.
      await cache.addAll(assetUrlsToCache);
    })()
  );
});

// On activate, delete old caches.
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
      fetch(request).catch(() => {
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
        const fetchPromise = fetch(request).then(networkResponse => {
          // This is a critical change: ensure the cache.put() is part of the promise chain.
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return cached response immediately if available, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});












