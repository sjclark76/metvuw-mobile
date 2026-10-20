import { RAIN_BANDS } from '@/shared/helpers/rainBands'
import type { RainReading } from '@/shared/helpers/rainStrip/readRain'

/** What a chart shows at a place, in words. `reading` is undefined until it is read. */
export function describeRain(reading: RainReading | undefined): string {
  if (!reading) return 'not read yet'
  switch (reading.kind) {
    case 'offChart':
      return 'not on this chart'
    case 'clear':
      return 'under 1 mm'
    case 'rain': {
      const { fromMm } = RAIN_BANDS[reading.band]
      const last = reading.band === RAIN_BANDS.length - 1
      return last
        ? `${fromMm}+ mm in 6 hr`
        : `${fromMm}–${fromMm + 1} mm in 6 hr`
    }
  }
}

/** Which pins the strip shows, given what was chosen in its selector. */
export const ALL_PINS = 'all'

export function chosenPins<T extends { id: string }>(
  pins: readonly T[],
  choice: string,
): T[] {
  if (choice === ALL_PINS) return [...pins]
  const chosen = pins.find((pin) => pin.id === choice)
  return chosen ? [chosen] : pins.slice(0, 1)
}
