import { rainCrop } from '@/shared/helpers/imageCompression/imageDimensions'

import {
  type Calibration,
  chartPixels,
  mercator,
  PLOT_LEFT,
  positionOnCrop,
} from './projection'

// A made-up map, so these tests are about the arithmetic and not about any chart:
// 10 pixels per degree of longitude, west edge (x 71) at 100E, and latitude 0 at
// y 300 with 400 pixels per unit of Mercator.
const map: Calibration = {
  x0: PLOT_LEFT - 10 * 100,
  perDegree: 10,
  y0: 300,
  perMercator: -400,
}

const inverseMercator = (m: number) =>
  ((2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180) / Math.PI

describe('mercator', () => {
  test('is zero on the equator and symmetric about it', () => {
    expect(mercator(0)).toBeCloseTo(0, 12)
    expect(mercator(-40)).toBeCloseTo(-mercator(40), 12)
  })

  test('stretches towards the poles: a degree is about twice as wide at 60 as at 10', () => {
    const near = mercator(11) - mercator(10)
    const far = mercator(61) - mercator(60)
    // The stretch at a latitude is 1/cos(latitude): 1.97 between these two.
    expect(far / near).toBeCloseTo(
      Math.cos((10.5 * Math.PI) / 180) / Math.cos((60.5 * Math.PI) / 180),
      2,
    )
  })

  test('matches the standard figure at 45 degrees', () => {
    expect(mercator(45)).toBeCloseTo(0.8813735870195, 10)
  })
})

describe('chartPixels', () => {
  test('puts longitude on a straight line in x', () => {
    expect(chartPixels(map, 0, 100).x).toBeCloseTo(PLOT_LEFT, 9)
    expect(chartPixels(map, 0, 110).x).toBeCloseTo(PLOT_LEFT + 100, 9)
  })

  test('puts latitude on a Mercator line in y: north is up', () => {
    expect(chartPixels(map, 0, 100).y).toBeCloseTo(300, 9)
    expect(chartPixels(map, 20, 100).y).toBeCloseTo(300 - 400 * mercator(20), 9)
    expect(chartPixels(map, 20, 100).y).toBeLessThan(300)
  })

  test('wraps a longitude past 180: 190E and 170W are the same place', () => {
    const wide: Calibration = { ...map, x0: PLOT_LEFT - 10 * 170 }
    const east = chartPixels(wide, 0, 190)
    const west = chartPixels(wide, 0, -170)

    expect(west.x).toBeCloseTo(east.x, 9)
    expect(east.x).toBeCloseTo(PLOT_LEFT + 200, 9)
  })

  test('wraps whole turns in either direction', () => {
    const base = chartPixels(map, 5, 120).x
    expect(chartPixels(map, 5, 120 + 360).x).toBeCloseTo(base, 9)
    expect(chartPixels(map, 5, 120 - 720).x).toBeCloseTo(base, 9)
  })

  test('puts a place into the 360 degrees that start at the west edge', () => {
    // West edge is 100E, so 99E is the far end of that turn, not just left of it.
    const x = chartPixels(map, 0, 99).x
    expect(x).toBeCloseTo(PLOT_LEFT + 10 * 359, 9)
  })
})

describe('positionOnCrop', () => {
  // Choose the place whose full-chart pixel is exactly (x, y): the inverse maps.
  const at = (x: number, y: number) => ({
    longitude: 100 + (x - PLOT_LEFT) / 10,
    latitude: inverseMercator((y - 300) / -400),
  })
  const position = (x: number, y: number) => {
    const place = at(x, y)
    return positionOnCrop(map, place.latitude, place.longitude)
  }

  test('is 0 at the crop top left and 1 at the bottom right', () => {
    // A hair inside each corner: exactly on an edge, rounding decides which side.
    const hair = 1e-6
    const topLeft = position(rainCrop.left + hair, rainCrop.top + hair)!
    const bottomRight = position(
      rainCrop.left + rainCrop.width - hair,
      rainCrop.top + rainCrop.height - hair,
    )!

    expect(topLeft.x).toBeCloseTo(0, 5)
    expect(topLeft.y).toBeCloseTo(0, 5)
    expect(bottomRight.x).toBeCloseTo(1, 5)
    expect(bottomRight.y).toBeCloseTo(1, 5)
  })

  test('is a fraction of the crop, not of the whole chart', () => {
    const middle = position(
      rainCrop.left + rainCrop.width / 2,
      rainCrop.top + rainCrop.height / 2,
    )!

    expect(middle.x).toBeCloseTo(0.5, 9)
    expect(middle.y).toBeCloseTo(0.5, 9)
  })

  test.each([
    ['left', rainCrop.left - 0.5, 300],
    ['right', rainCrop.left + rainCrop.width + 0.5, 300],
    ['top', 300, rainCrop.top - 0.5],
    ['bottom', 300, rainCrop.top + rainCrop.height + 0.5],
  ])('is undefined just past the crop on the %s', (_edge, x, y) => {
    expect(position(x, y)).toBeUndefined()
  })

  test.each([
    ['left', rainCrop.left + 0.5, 300],
    ['right', rainCrop.left + rainCrop.width - 0.5, 300],
    ['top', 300, rainCrop.top + 0.5],
    ['bottom', 300, rainCrop.top + rainCrop.height - 0.5],
  ])('is a position just inside the crop on the %s', (_edge, x, y) => {
    expect(position(x, y)).toBeDefined()
  })

  test('is undefined for something that is not a place', () => {
    expect(positionOnCrop(map, NaN, 120)).toBeUndefined()
    expect(positionOnCrop(map, 10, NaN)).toBeUndefined()
    expect(positionOnCrop(map, Infinity, 120)).toBeUndefined()
    expect(positionOnCrop(map, 10, -Infinity)).toBeUndefined()
  })

  test('is undefined beyond 85 degrees, where Mercator has no room', () => {
    expect(positionOnCrop(map, 90, 120)).toBeUndefined()
    expect(positionOnCrop(map, -85.5, 120)).toBeUndefined()
  })

  test('increases to the east and decreases to the north', () => {
    const here = position(300, 300)!
    const east = position(310, 300)!
    const north = position(300, 290)!

    expect(east.x).toBeGreaterThan(here.x)
    expect(north.y).toBeLessThan(here.y)
  })
})
