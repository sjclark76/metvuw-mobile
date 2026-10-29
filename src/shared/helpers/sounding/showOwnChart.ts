const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/**
 * Whether our chart replaces metvuw's: when metvuw's newest chart is more than
 * 2 hours older than the balloon we have (metvuw stopped publishing upper air
 * charts on 12 Oct 2026). The margin is because metvuw names a chart at the
 * actual launch time (11 and 23 UTC) while Wyoming uses the nominal 00 and 12,
 * so metvuw's chart for the same balloon is an hour earlier.
 */
export function showOwnChart(
  metvuwTimesUTC: number[],
  launchUTC: number,
): boolean {
  return (
    metvuwTimesUTC.length === 0 ||
    Math.max(...metvuwTimesUTC) < launchUTC - TWO_HOURS_MS
  )
}
