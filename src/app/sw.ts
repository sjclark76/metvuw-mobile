import { defaultCache } from '@serwist/next/worker'
import { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `self.__SW_MANIFEST`.
// See https://serwist.pages.dev/docs/next/configuring
declare global {
  // eslint-disable-next-line no-unused-vars
  interface WorkerGlobalScope extends SerwistGlobalConfig {
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
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // runtimeCaching: [
  //   // {
  //   //   matcher({ request }) {
  //   //     return request.mode === 'navigate'
  //   //   },
  //   //   handler: new NetworkFirst({
  //   //     cacheName: 'pages',
  //   //     matchOptions: {
  //   //       ignoreSearch: true,
  //   //     },
  //   //   }),
  //   // },
  //   ...defaultCache,
  // ],
})
//
serwist.setCatchHandler(async ({ request }) => {
  // eslint-disable-next-line no-console
  console.log('Service Worker:', request)
  // const url = new URL(request.url)
  // url.search = '' // Normalize URL by removing search parameters
  //
  // if (
  //   request.destination === 'document' ||
  //   request.destination === '' ||
  //   request.destination === 'script'
  // ) {
  //   const cachedResponse = await caches.match(url.toString(), {
  //     ignoreSearch: true,
  //   })
  //   if (cachedResponse) {
  //     return cachedResponse
  //   }
  // }
  //
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
