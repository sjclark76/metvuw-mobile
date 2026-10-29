/**
 * Whether our chart replaces metvuw's: when metvuw has nothing as recent as the
 * balloon we have (metvuw stopped publishing upper air charts on 12 Oct 2026).
 */
export function showOwnChart(
  metvuwTimesUTC: number[],
  launchUTC: number,
): boolean {
  return metvuwTimesUTC.length === 0 || Math.max(...metvuwTimesUTC) < launchUTC
}
