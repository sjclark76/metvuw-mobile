/**
 * The upstream page could not be fetched, or no longer looks like what the
 * scrapers expect. Thrown instead of returning an empty list so that callers
 * can tell "metvuw is down or changed" apart from "metvuw has no charts".
 */
export class ScrapeError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ScrapeError'
  }
}
