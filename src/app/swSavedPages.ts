import {
  SAVED_CHARTS_CACHE,
  SAVED_PAGES_CACHE,
} from '@/shared/helpers/offline/savedPages'

// Kept apart from sw.ts so it can be unit tested without a worker scope.

/**
 * A chart the visitor saved for offline use. A chart's address names the exact
 * image (and its variant), so only an exact match will do.
 */
export async function savedChart(
  request: Request,
  caches: CacheStorage,
): Promise<Response | undefined> {
  return (await caches.open(SAVED_CHARTS_CACHE)).match(request)
}

/**
 * A page the visitor saved. A link may carry a query string (a campaign tag, say)
 * that does not change which page it is, so that is ignored.
 */
export async function savedPage(
  request: Request,
  caches: CacheStorage,
): Promise<Response | undefined> {
  return (await caches.open(SAVED_PAGES_CACHE)).match(request, {
    ignoreSearch: true,
  })
}
