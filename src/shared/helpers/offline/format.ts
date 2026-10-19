const KB = 1024
const MB = 1024 * KB

/** A size for people: kilobytes below a megabyte, then megabytes. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < MB)
    return `${Math.max(1, Math.round(bytes / KB)).toLocaleString('en-NZ')} KB`
  const megabytes = bytes / MB
  return `${megabytes < 100 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const plural = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? '' : 's'} ago`

/** How long ago something was, from a duration in milliseconds. */
export function formatAge(ms: number): string {
  if (ms < MINUTE) return 'just now'
  if (ms < HOUR) return plural(Math.floor(ms / MINUTE), 'minute')
  if (ms < DAY) return plural(Math.floor(ms / HOUR), 'hour')
  return plural(Math.floor(ms / DAY), 'day')
}
