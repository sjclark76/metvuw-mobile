import { RAIN_BANDS } from '@/shared/helpers/rainBands'
import type { RainReading } from '@/shared/helpers/rainStrip/readRain'

/** Charts in a day: the charts are six hours apart. */
const CHARTS_IN_A_DAY = 4

/** NIWA counts a day with over 25 mm as a heavy rainfall day. */
export const HEAVY_DAY_MM = 25

/** The top of metvuw's scale: 20+ mm in 6 hours. */
const TOP_BAND = RAIN_BANDS.length - 1

export type HeavyRain =
  | {
      level: 'veryHeavy'
      /** The chart showing it (the six hours to its time). */
      from: number
      to: number
    }
  | {
      level: 'heavy'
      /** The first and last of the four charts that add up to a heavy day. */
      from: number
      to: number
      /** At least this much fell over them: each band at its lower figure. */
      atLeastMm: number
    }

/** The least rain a reading stands for, in mm: a band's lower figure, or none. */
const leastMm = (reading: RainReading | undefined) =>
  reading?.kind === 'rain' ? RAIN_BANDS[reading.band].fromMm : 0

/**
 * Whether heavy rain is ahead at a place, from what each chart shows there (in
 * chart order, undefined for a chart not read yet), and the times of the charts.
 * Only charts valid after `now` count. Very heavy rain (the top of the scale in any
 * six hours) wins over heavy rain (25 mm or more in any 24 hours), and each is the
 * earliest of its kind.
 *
 * Our own heads-up from metvuw's model charts, well below MetService's warning
 * levels, which these charts cannot measure (their scale stops at 20+ mm).
 */
export function heavyRainAhead(
  readings: readonly (RainReading | undefined)[],
  times: readonly number[],
  now: number,
): HeavyRain | undefined {
  const ahead = (index: number) => times[index] > now

  for (let index = 0; index < readings.length; index++) {
    const reading = readings[index]
    if (ahead(index) && reading?.kind === 'rain' && reading.band === TOP_BAND) {
      return { level: 'veryHeavy', from: index, to: index }
    }
  }

  for (let from = 0; from + CHARTS_IN_A_DAY <= readings.length; from++) {
    if (!ahead(from)) continue
    const to = from + CHARTS_IN_A_DAY - 1
    let atLeastMm = 0
    for (let index = from; index <= to; index++) {
      atLeastMm += leastMm(readings[index])
    }
    if (atLeastMm >= HEAVY_DAY_MM)
      return { level: 'heavy', from, to, atLeastMm }
  }

  return undefined
}
