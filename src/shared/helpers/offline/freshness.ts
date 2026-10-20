import { formatAge } from './format'

const HOUR = 60 * 60 * 1000

/**
 * How often metvuw issues a new forecast: twice a day. A forecast older than this
 * has been followed by another (or should have been).
 */
export const ISSUE_INTERVAL_MS = 12 * HOUR

export type Freshness =
  | { state: 'current' }
  /** `ageMs` is how long ago it was issued. */
  | { state: 'outOfDate'; ageMs: number }

/**
 * Whether a forecast issued at `issued` is still the newest, as far as can be told
 * without asking metvuw: it is until the next one is due, twelve hours after.
 * Undefined if it is not known when it was issued.
 */
export function freshness(
  issued: number | undefined,
  now: number,
): Freshness | undefined {
  if (issued === undefined || now <= 0) return undefined
  const ageMs = now - issued
  return ageMs > ISSUE_INTERVAL_MS
    ? { state: 'outOfDate', ageMs }
    : { state: 'current' }
}

/**
 * In words: "up to date", or how long ago the forecast was issued once a newer one
 * is due. That is a fact whether or not there is a connection to look for the newer
 * one, so it says the same either way.
 */
export function describeFreshness(
  value: Freshness | undefined,
): string | undefined {
  if (!value) return undefined
  return value.state === 'current'
    ? 'up to date'
    : `issued ${formatAge(value.ageMs)}`
}
