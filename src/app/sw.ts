import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { CacheFirst, StaleWhileRevalidate } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `self.__SW_MANIFEST`.
// See https://serwist.pages.dev/docs/next/configuring
declare global {
  // eslint-disable-next-line no-unused-vars
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: PrecacheEntry[] | undefined
  }
}

declare const self: WorkerGlobalScope

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
  ),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      handler: new CacheFirst(),
      matcher({ request }) {
        return request.destination === 'document'
      },
    },
    {
      handler: new StaleWhileRevalidate(),
      matcher({ request }) {
        return request.mode === 'navigate'
      },
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          const isNavigate = request.mode === 'navigate'
          // eslint-disable-next-line no-console
          console.log(
            `[SW] Matching fallback for ${request.url}. Mode: ${request.mode}. Is navigation? ${isNavigate}`,
          )
          return isNavigate
        },
      },
    ],
  },
})

serwist.addEventListeners()
