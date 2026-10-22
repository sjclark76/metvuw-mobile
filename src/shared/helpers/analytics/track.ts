type Params = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Params) => void
  }
}

/**
 * Counts one use of a feature in Google Analytics, so the page views can be read
 * alongside what people do. Nothing is sent where there is no analytics tag (a
 * preview, an ad blocker, a test), and a failure here is never the feature's
 * problem.
 *
 * Only what was done goes in: never a place name, coordinates, a label, the
 * visitor's location, or which chart they are looking at.
 */
export function track(name: string, params?: Params): void {
  try {
    if (typeof window === 'undefined') return
    window.gtag?.('event', name, params)
  } catch {
    // Analytics must never break the feature that called it.
  }
}
