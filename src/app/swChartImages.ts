import { isFallbackImageProxyUrl } from '@/shared/helpers/v2/dataSource/fallbackImageProxyUrl'

// Kept apart from sw.ts so it can be unit tested without a worker scope.
export const chartImageCache = {
  name: 'chart-images',
  // A day of charts: about 40 images per page, a few pages revisited.
  maxEntries: 120,
  maxAgeSeconds: 24 * 60 * 60,
  matcher: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
    sameOrigin && isFallbackImageProxyUrl(url.href),
}
