import { config } from '@/config'

function allowedHosts() {
  return new Set([
    new URL(config.metvuwBaseUrl).hostname,
    new URL(config.cloudFrontUrl).hostname,
  ])
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
    allowedHosts().has(url.hostname) &&
    url.port === '' &&
    url.username === '' &&
    url.password === ''
  )
}
