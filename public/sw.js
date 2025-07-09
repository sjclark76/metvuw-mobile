const CACHE_NAME = 'metvuw-mobile-cache-v18';
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', OFFLINE_URL];
const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;

// --- Helper Functions ---

const cleanupCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  console.log('Service Worker: Running cache cleanup...');

  for (const request of keys) {
    // Don't clean up the app shell or critical assets
    const isAppShell = APP_SHELL_URLS.some(url => request.url.endsWith(url));
    const isCriticalAsset = request.url.includes('/_next/static/');
    
    if (isAppShell || isCriticalAsset) {
      continue;
    }
    
    const response = await cache.match(request);
    if (response) {
      const timestampHeader = response.headers.get('x-cache-timestamp');
      if (timestampHeader) {
        const timestamp = parseInt(timestampHeader, 10);
        if (Date.now() - timestamp > TEN_DAYS_IN_MS) {
          console.log('Service Worker: Deleting expired cache entry:', request.url);
          await cache.delete(request);
        }
      }
    }
  }
};

// --- Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Service Worker: Caching App Shell and Critical Assets');
      await cache.addAll(APP_SHELL_URLS);

      try {
        const manifestResponse = await fetch('/_next/build-manifest.json');
        const manifest = await manifestResponse.json();
        const criticalAssets = new Set();
        const mainAppAssets = manifest.pages['/'] || [];
        const offlinePageAssets = manifest.pages['/offline'] || [];
        mainAppAssets.forEach(asset => criticalAssets.add(asset));
        offlinePageAssets.forEach(asset => criticalAssets.add(asset));
        const assetUrlsToCache = Array.from(criticalAssets).map(asset => asset.startsWith('/') ? asset : '/' + asset);
        console.log('Service Worker: Caching the following critical assets:', assetUrlsToCache);
        await cache.addAll(assetUrlsToCache);
      } catch (error) {
        console.error('Service Worker: Failed to fetch or cache build manifest assets.', error);
      }
    })()
  );
});

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCache());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then(response => response || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok || networkResponse.type === 'opaque') {
          caches.open(CACHE_NAME).then(cache => {
            const responseToCache = networkResponse.clone();
            // Add a timestamp to non-critical assets for cleanup
            if (!request.url.includes('/_next/static/')) {
              const headers = new Headers(networkResponse.headers);
              headers.set('x-cache-timestamp', Date.now());
              const timestampedResponse = new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: headers
              });
              cache.put(request, timestampedResponse);
            } else {
              cache.put(request, responseToCache);
            }
          });
        }
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});











