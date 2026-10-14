/**
 * UTC timestamp for a date given as parts, or undefined if the parts aren't a
 * real date and hour (month 13, day 99, hour 25, ...). Date.UTC would silently
 * roll those over into a different date.
 */
export function parseUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number,
): number | undefined {
  const timestamp = Date.UTC(year, month - 1, day, hour)
  const date = new Date(timestamp)

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour
    ? timestamp
    : undefined
}
