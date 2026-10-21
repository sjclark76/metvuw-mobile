import type { Place } from '@/shared/helpers/places'

import {
  compassDirection,
  formatCoordinates,
  LOCATION_KIND,
  placeForLocation,
} from './locationPin'

const hawea: Place = {
  name: 'Lake Hawea',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.61,
  longitude: 169.26,
}

describe('compassDirection', () => {
  test.each([
    [-44, 169, -43, 169, 'N'],
    [-44, 169, -45, 169, 'S'],
    [-44, 169, -44, 170, 'E'],
    [-44, 169, -44, 168, 'W'],
    [-44, 169, -43.3, 170, 'NE'],
    [-44, 169, -44.7, 168, 'SW'],
  ])('from %s,%s to %s,%s is %s', (a, b, c, d, expected) => {
    expect(compassDirection(a, b, c, d)).toBe(expected)
  })
})

describe('formatCoordinates', () => {
  test('writes south and east, to two decimals', () => {
    expect(formatCoordinates(-44.6123, 169.2678)).toBe('44.61°S 169.27°E')
  })

  test('writes north and west', () => {
    expect(formatCoordinates(51.5, -0.12)).toBe('51.50°N 0.12°W')
  })
})

describe('placeForLocation', () => {
  test('is the place itself when it is under a kilometre away', () => {
    expect(
      placeForLocation(-44.612, 169.262, {
        place: hawea,
        distanceKm: 0.3,
      }),
    ).toEqual({
      name: 'Lake Hawea',
      context: 'Otago',
      kind: LOCATION_KIND,
      latitude: -44.612,
      longitude: 169.262,
    })
  })

  test('is near the place, how far and which way, within 20 km', () => {
    // About 3 km north-east of Lake Hawea.
    const place = placeForLocation(-44.59, 169.285, {
      place: hawea,
      distanceKm: 2.96,
    })

    expect(place.name).toBe('Near Lake Hawea · 3 km NE')
    expect(place.context).toBe('Otago')
    expect(place.kind).toBe(LOCATION_KIND)
  })

  test('keeps where the person is, not where the place is', () => {
    const place = placeForLocation(-44.59, 169.285, {
      place: hawea,
      distanceKm: 2.96,
    })

    expect(place.latitude).toBe(-44.59)
    expect(place.longitude).toBe(169.285)
  })

  test('is the coordinates when nothing is within 20 km', () => {
    const place = placeForLocation(-46.5, 172.1, {
      place: hawea,
      distanceKm: 250,
    })

    expect(place.name).toBe('46.50°S 172.10°E')
    expect(place.kind).toBe(LOCATION_KIND)
  })

  test('is the coordinates when the place list could not be had', () => {
    expect(placeForLocation(-44.59, 169.286).name).toBe('44.59°S 169.29°E')
  })
})
