/* eslint-disable no-unused-vars */
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `self.__SW_MANIFEST`.
// See https://serwist.pages.dev/docs/next/configuring
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// eslint-disable-next-console
console.log('Service worker script loaded.')

// Custom runtime caching that excludes images to prevent Vercel image optimization issues
const customRuntimeCaching = [
  {
    urlPattern: /^https?.*\.(html|css|js)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-resources',
    },
  },
  {
    urlPattern: /^https?.*\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
    },
  },
  // Explicitly exclude image files to prevent interference with Vercel optimization
  // Images will be handled directly by the browser without service worker intervention
]

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST || []),
    { url: '/offline', revision: null },
    // { url: '/', revision: null },
    // { url: '/regions/nz', revision: null },
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: customRuntimeCaching,
})

serwist.setCatchHandler(async ({ request }) => {
  // Fallback for document requests to the offline page.
  if (request.destination === 'document') {
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
  }

  // For any other request, return a standard network error.
  return Response.error()
})

serwist.addEventListeners()
