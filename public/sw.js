const CACHE_NAME = 'metvuw-mobile-cache-v1';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache;
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isImage = IMAGE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));

  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else if (event.request.url.startsWith(SUPABASE_URL)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
