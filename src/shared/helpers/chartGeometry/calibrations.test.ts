import { regions } from '@/shared/types/region'

import { calibrations } from './calibrations'
import measurements from './measurements.json'
import { chartPixels, mercator } from './projection'

// `measurements.json` holds the tick marks measured on the real charts (pixel
// positions only: no images are committed). The calibrations were fitted to them
// by `scripts/chart-geometry/measure.mjs`, so this does not prove the charts are
// as measured; it proves the calibrations in the app still agree with what was
// measured, and catches a mistyped or half-edited number. The live check script
// (`scripts/chart-geometry/verify.mjs`) is what compares against the real charts.
const TICK_TOLERANCE_PX = 0.75

type Ticks = { latitude: [number, number][]; longitude: [number, number][] }
const ticks = measurements as unknown as Record<string, Ticks>

describe('calibrations', () => {
  test('has an entry for every region the app lists', () => {
    for (const region of regions) {
      expect(calibrations[region.code], region.code).toBeDefined()
    }
  })

  test('has no entry for a region the app does not list', () => {
    expect(Object.keys(calibrations).sort()).toEqual(
      regions.map((region) => region.code).sort(),
    )
  })

  test.each(regions.map((region) => region.code))(
    '%s is a Mercator map with north up and east to the right',
    (code) => {
      const { perDegree, perMercator } = calibrations[code]
      expect(perDegree).toBeGreaterThan(0)
      expect(perMercator).toBeLessThan(0)
      // The two scales agree to within 1%: Mercator keeps them equal, give or take
      // the fitting. A bigger gap means a wrong number, not a different map.
      const ratio = -perMercator / ((perDegree * 180) / Math.PI)
      expect(ratio).toBeGreaterThan(0.99)
      expect(ratio).toBeLessThan(1.01)
    },
  )
})

describe('measured tick marks', () => {
  test('exist for every region', () => {
    for (const region of regions) {
      expect(
        ticks[region.code]?.latitude.length,
        region.code,
      ).toBeGreaterThanOrEqual(3)
      expect(
        ticks[region.code]?.longitude.length,
        region.code,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  test.each(regions.map((region) => region.code))(
    `%s: every tick lands where it was measured, to within ${TICK_TOLERANCE_PX}px`,
    (code) => {
      const calibration = calibrations[code]
      for (const [latitude, y] of ticks[code].latitude) {
        const projected =
          calibration.y0 + calibration.perMercator * mercator(latitude)
        expect(
          Math.abs(projected - y),
          `${latitude} degrees latitude`,
        ).toBeLessThanOrEqual(TICK_TOLERANCE_PX)
      }
      for (const [longitude, x] of ticks[code].longitude) {
        // A tick written past 180 as a west longitude is the same place; chartPixels
        // wraps it.
        const projected = chartPixels(calibration, 0, longitude).x
        expect(
          Math.abs(projected - x),
          `${longitude} degrees longitude`,
        ).toBeLessThanOrEqual(TICK_TOLERANCE_PX)
      }
    },
  )
})
