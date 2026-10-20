const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * How often metvuw issues a new forecast: twice a day. A forecast older than this
 * has been followed by another (or should have been).
 */
export const ISSUE_INTERVAL_MS = 12 * HOUR

export type Freshness =
  | { state: 'current' }
  /** `behindMs` is how long a newer forecast should have been out. */
  | { state: 'outOfDate'; behindMs: number }

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
  const behindMs = now - issued - ISSUE_INTERVAL_MS
  return behindMs > 0 ? { state: 'outOfDate', behindMs } : { state: 'current' }
}

const plural = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? '' : 's'}`

/** A length of time for people: under an hour, then hours, then days. */
export function formatBehind(ms: number): string {
  if (ms < HOUR) return 'under an hour'
  if (ms < DAY) return plural(Math.floor(ms / HOUR), 'hour')
  return plural(Math.floor(ms / DAY), 'day')
}

/**
 * In words: "up to date", or how far out of date. Without a connection a newer
 * forecast cannot be looked for, so it says only that it is probably out of date.
 */
export function describeFreshness(
  value: Freshness | undefined,
  online: boolean,
): string | undefined {
  if (!value) return undefined
  if (value.state === 'current') return 'up to date'
  const behind = formatBehind(value.behindMs)
  return online ? `${behind} out of date` : `probably ${behind} out of date`
}
