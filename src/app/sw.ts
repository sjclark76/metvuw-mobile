import { defaultCache } from '@serwist/next/worker'
import { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `self.__SW_MANIFEST`.
// See https://serwist.pages.dev/docs/next/configuring
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// eslint-disable-next-line no-console
console.log('Service worker script loaded.')

const serwist = new Serwist({
  precacheEntries: (self.__SW_MANIFEST || []).concat(
    {
      url: '/offline',
      revision: null,
    },
    {
      url: '/',
      revision: null,
    },
    {
      url: '/nz',
      revision: null,
    },
  ),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
})
//
serwist.setCatchHandler(async ({ request }) => {
  // Fallback for document requests to the offline page
  if (request.destination === 'document') {
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
  }

  return Response.error()
})

serwist.addEventListeners()
