import { config } from '@/config'

// hostname -> origin, built only from our own config.
function allowedOrigins() {
  return new Map(
    [config.metvuwBaseUrl, config.cloudFrontUrl].map((base) => {
      const { hostname, origin } = new URL(base)
      return [hostname, origin] as const
    }),
  )
}

/**
 * Whether a URL may be fetched on our behalf: https on a metvuw host only, with
 * no embedded credentials and no non-default port. Shared by the image proxy,
 * its redirect handling and the scraper so every fetch is pinned to the same
 * hosts.
 */
export function isAllowedSourceUrl(url: URL): boolean {
  return (
    url.protocol === 'https:' &&
    allowedOrigins().has(url.hostname) &&
    url.port === '' &&
    url.username === '' &&
    url.password === ''
  )
}

/**
 * The configured origin for an allowed URL, or undefined if it isn't allowed.
 * Callers build the request URL from this origin plus only the path and query
 * of the caller-supplied URL, so the host being fetched is always ours.
 */
export function allowedOriginFor(url: URL): string | undefined {
  return isAllowedSourceUrl(url)
    ? allowedOrigins().get(url.hostname)
    : undefined
}
