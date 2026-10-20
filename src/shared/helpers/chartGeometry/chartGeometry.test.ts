import { regions } from '@/shared/types/region'

import { chartPosition, regionCovers, regionsCovering } from './index'

// Expected values were worked out separately from the code (a script that applies
// the same maths to the measured calibration), and the places themselves were seen
// to land on the right coast on the real charts.
describe('chartPosition', () => {
  test.each([
    ['nz', 'Wellington', -41.2865, 174.7762, 0.6159, 0.5246],
    ['nz', 'Auckland', -36.8485, 174.7633, 0.6156, 0.3257],
    ['nz', 'Bluff', -46.6, 168.36, 0.459, 0.7815],
    ['nzsi', 'Queenstown', -45.0312, 168.6626, 0.4319, 0.6262],
    ['europe', 'London', 51.5072, -0.1276, 0.3341, 0.5953],
    ['usa', 'New York', 40.7128, -74.006, 0.7998, 0.5485],
    ['world', 'Sydney', -33.8688, 151.2093, 0.8786, 0.7239],
    ['fiji', 'Suva', -18.1416, 178.4419, 0.4208, 0.6339],
  ])(
    'puts %s: %s where its chart shows it',
    (region, _place, lat, lon, x, y) => {
      const position = chartPosition(region as never, lat, lon)!

      expect(position.x).toBeCloseTo(x, 3)
      expect(position.y).toBeCloseTo(y, 3)
    },
  )

  test('is the same place whichever way the longitude is written', () => {
    // 178.44E is 181.56W: the Suva chart crosses 180.
    const east = chartPosition('fiji', -18.1416, 178.4419)!
    const west = chartPosition('fiji', -18.1416, 178.4419 - 360)!

    expect(west.x).toBeCloseTo(east.x, 9)
    expect(west.y).toBeCloseTo(east.y, 9)
  })

  test('shows places across 180 on the charts that cross it', () => {
    // The Chatham Islands, written either way.
    for (const lon of [183.45, -176.55]) {
      expect(chartPosition('nz', -43.95, lon)!.x).toBeCloseTo(0.8281, 3)
      expect(chartPosition('world', -43.95, lon)!.x).toBeCloseTo(0.9685, 3)
    }
  })

  test.each([
    ['north of the chart', 'nzsi', -36.8485, 174.7633],
    ['the other side of the world', 'nz', 51.5, -0.12],
    ['north of the chart, across 180', 'nz', -13.83, -171.76],
  ])('is undefined for a place %s', (_why, region, lat, lon) => {
    expect(chartPosition(region as never, lat, lon)).toBeUndefined()
  })

  test.each([
    ['not a number', NaN, 170],
    ['no longitude', -40, NaN],
    ['a pole', 90, 170],
    ['beyond the poles', -91, 170],
  ])('is undefined for %s', (_why, lat, lon) => {
    expect(chartPosition('nz', lat, lon)).toBeUndefined()
  })

  test('keeps every position between 0 and 1', () => {
    for (const region of regions) {
      for (let lat = -80; lat <= 80; lat += 10) {
        for (let lon = -180; lon < 180; lon += 15) {
          const position = chartPosition(region.code, lat, lon)
          if (position) {
            expect(position.x).toBeGreaterThanOrEqual(0)
            expect(position.x).toBeLessThanOrEqual(1)
            expect(position.y).toBeGreaterThanOrEqual(0)
            expect(position.y).toBeLessThanOrEqual(1)
          }
        }
      }
    }
  })
})

describe('regionCovers', () => {
  test('is whether chartPosition finds the place', () => {
    expect(regionCovers('nz', -41.2865, 174.7762)).toBe(true)
    expect(regionCovers('europe', -41.2865, 174.7762)).toBe(false)
  })
})

describe('regionsCovering', () => {
  test.each([
    [
      'Wellington',
      -41.2865,
      174.7762,
      ['nz', 'nzni', 'nzsi', 'swp', 'world', 'spacific'],
    ],
    [
      'Queenstown',
      -45.0312,
      168.6626,
      ['nz', 'nzsi', 'swp', 'world', 'spacific'],
    ],
    ['London', 51.5072, -0.1276, ['europe', 'uk', 'world', 'natlantic']],
    [
      'Suva',
      -18.1416,
      178.4419,
      ['swp', 'world', 'ocean', 'pacific', 'fiji', 'spacific'],
    ],
    [
      'Sydney',
      -33.8688,
      151.2093,
      ['nz', 'victoria', 'nsw', 'seaussie', 'swp', 'world'],
    ],
    ['Tokyo', 35.6762, 139.6503, ['world', 'japan']],
    ['New York', 40.7128, -74.006, ['world', 'usa', 'natlantic']],
  ])(
    'lists the charts that show %s, in the order regions are listed',
    (_place, lat, lon, expected) => {
      expect(regionsCovering(lat, lon)).toEqual(expected)
    },
  )

  test('is empty for a place no chart shows', () => {
    expect(regionsCovering(89, 0)).toEqual([])
    expect(regionsCovering(NaN, 0)).toEqual([])
  })
})
