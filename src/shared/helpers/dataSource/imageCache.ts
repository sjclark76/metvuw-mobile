const DAY = 24 * 60 * 60

/**
 * A processed chart image. Its URL names the model run and forecast hour (or the
 * timestamp), and metvuw publishes each file once, so the content for a given
 * URL does not change. Every request is a CDN miss that downloads from
 * metvuw.com and recompresses with sharp, so the CDN keeps it for a week (a run's
 * images are only relevant for a few days).
 *
 * The browser keeps it for a day, deliberately shorter than the CDN, and it is
 * not marked immutable, so a bad image can still be corrected. The query string
 * (source URL, chart type, variant) is part of the cache key, so the primary and
 * small variants are cached separately.
 */
export const IMAGE_CACHE_CONTROL = `public, max-age=${DAY}, s-maxage=${7 * DAY}, stale-while-revalidate=${DAY}`

/**
 * A failure fetching or processing the source image. Long enough that an outage
 * does not hammer metvuw.com on every request, short enough to recover quickly.
 */
export const UPSTREAM_ERROR_CACHE_CONTROL = 'public, max-age=0, s-maxage=30'
