import { tz } from '@date-fns/tz'
import { format } from 'date-fns'

/**
 * The zone used for the server render and the first client render. The site is
 * aimed at New Zealand, so those viewers see no change once the real zone is
 * known; everyone else gets a one-frame correction. It must be the same on the
 * server and in the browser, or hydration reports a text mismatch.
 */
export const DEFAULT_TIME_ZONE = 'Pacific/Auckland'

/** The viewer's IANA zone. Only meaningful in a browser. */
export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE
}

/**
 * Formats an instant in an explicit zone, never the zone of the process, so the
 * result is the same wherever it runs (date-fns' bare `format` uses the local
 * zone, which differs between a UTC server and a NZ browser).
 */
export function formatInTimeZone(
  date: Date | number | string,
  formatString: string,
  timeZone: string,
): string {
  return format(date, formatString, { in: tz(timeZone) })
}
