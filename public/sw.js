const CACHE_NAME = 'metvuw-mobile-cache-v17';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];

// On install, cache the app shell and all its critical assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Service Worker: Caching App Shell and Critical Assets');

      // 1. Cache the basic HTML pages.
      await cache.addAll(APP_SHELL_URLS);

      // 2. Fetch the build manifest to find the hashed CSS/JS files.
      try {
        const manifestResponse = await fetch('/_next/build-manifest.json');
        const manifest = await manifestResponse.json();
        
        const criticalAssets = new Set();
        // Extract assets for the main app and the offline page.
        const mainAppAssets = manifest.pages['/'] || [];
        const offlinePageAssets = manifest.pages['/offline'] || [];

        mainAppAssets.forEach(asset => criticalAssets.add(asset));
        offlinePageAssets.forEach(asset => criticalAssets.add(asset));

        // Add the unique asset paths to the cache.
        const assetUrlsToCache = Array.from(criticalAssets).map(asset => 
          asset.startsWith('/') ? asset : '/' + asset
        );
        console.log('Service Worker: Caching the following critical assets:', assetUrlsToCache);
        await cache.addAll(assetUrlsToCache);
      } catch (error) {
        console.error('Service Worker: Failed to fetch or cache build manifest assets.', error);
      }
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
      fetch(request)
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
  // Stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(response => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok || networkResponse.type === 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});











