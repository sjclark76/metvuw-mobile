import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
} from 'serwist'

import { chartImageCache } from './swChartImages'
import { savedChart, savedPage } from './swSavedPages'

// This declares the value of `self.__SW_MANIFEST`.
// See https://serwist.pages.dev/docs/next/configuring
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const viewedChart = new CacheFirst({
  cacheName: chartImageCache.name,
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({
      maxEntries: chartImageCache.maxEntries,
      maxAgeSeconds: chartImageCache.maxAgeSeconds,
      maxAgeFrom: 'last-used',
    }),
  ],
})

const serwist = new Serwist({
  // `/offline` is added with a per-build revision in next.config.ts, so it is
  // re-fetched after every deploy.
  precacheEntries: self.__SW_MANIFEST,
  // No skipWaiting: a new worker waits until the visitor accepts the update
  // (see UpdateNotification), so open tabs keep the JS chunks they loaded.
  // Claiming only matters for a first visit, which has no worker to replace.
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // A chart's URL names the image it shows, so its bytes never change and it
    // can be served from the cache, which is also what makes it viewable offline.
    // Charts the visitor saved come first: they are kept for a week, where the
    // ones simply seen are kept for a day and may be evicted.
    {
      matcher: chartImageCache.matcher,
      handler: {
        handle: async (options) =>
          (await savedChart(options.request, caches)) ??
          viewedChart.handle(options),
      },
    },
    // A page is never kept as it was seen. A kept page points at the files of the
    // build it came from, and once the app has updated those are gone; on an
    // iPhone the browser does not hold on to them either, so the page opened with
    // no connection as bare text. With no connection a page is one the visitor
    // saved (below) or the offline page, both of which have what they need.
    {
      matcher: ({ request }) => request.destination === 'document',
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
})

serwist.setCatchHandler(async ({ request }) => {
  // Fallback for document requests to the offline page.
  if (request.destination === 'document') {
    // A page the visitor saved for offline use opens as it was saved.
    const saved = await savedPage(request, caches)
    if (saved) {
      return saved
    }
    // Precache keys carry the revision, so a plain caches.match would miss it.
    const offlinePage = await serwist.matchPrecache('/offline')
    if (offlinePage) {
      return offlinePage
    }
  }

  // For any other request, return a standard network error.
  return Response.error()
})

// Pages kept by earlier versions of the worker (as pages, or among the others)
// are not used any more.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([caches.delete('pages'), caches.delete('others')]),
  )
})

serwist.addEventListeners()
