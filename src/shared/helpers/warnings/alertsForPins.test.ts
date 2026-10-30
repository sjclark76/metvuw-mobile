import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Pin } from '@/shared/helpers/pins/pins'

import { alertsForPins, nearestChartIndex } from './alertsForPins'
import { parseCapAlert } from './parseCapAlert'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
// Before either alert has started (the wind watch starts at 12:00 on 30 Oct, NZ).
const EARLY = Date.UTC(2026, 9, 29, 12)
const [wind] = parseCapAlert(fixture('wind-hawkes-bay.xml'), new Date(EARLY))
const [snow] = parseCapAlert(
  fixture('road-snow-lewis-pass.xml'),
  new Date(EARLY),
)

const pin = (name: string, latitude: number, longitude: number): Pin => ({
  id: name,
  name,
  context: 'New Zealand',
  kind: 'Town',
  latitude,
  longitude,
})
// Inside the wind watch's area (Tararua District, Hawke's Bay).
const dannevirke = pin('Dannevirke', -40.208, 176.102)
const waipukurau = pin('Waipukurau', -40.002, 176.557)
// Outside it.
const napier = pin('Napier', -39.49, 176.91)
// Inside the watch's bounding box, but outside its shape.
const cornerOfBox = pin('Corner', -39.7, 175.55)
// On the road corridor of the snow alert (a thin area).
const lewisPass = pin('Lewis Pass', -42.553, 172.352)

describe('alertsForPins', () => {
  test('finds the alert that covers a pin', () => {
    const found = alertsForPins([wind], [dannevirke], EARLY)

    expect(found).toHaveLength(1)
    expect(found[0].alert).toBe(wind)
    expect(found[0].pins).toEqual([dannevirke])
  })

  test('finds nothing for a pin outside the area', () => {
    expect(alertsForPins([wind], [napier], EARLY)).toEqual([])
  })

  test('tests the shape of the area, not only its bounding box', () => {
    expect(alertsForPins([wind], [cornerOfBox], EARLY)).toEqual([])
  })

  test('finds nothing without pins or alerts', () => {
    expect(alertsForPins([wind], [], EARLY)).toEqual([])
    expect(alertsForPins([], [dannevirke], EARLY)).toEqual([])
  })

  test('puts the pins an alert covers together, in the order they are given', () => {
    const found = alertsForPins([wind], [waipukurau, napier, dannevirke], EARLY)

    expect(found).toHaveLength(1)
    expect(found[0].pins).toEqual([waipukurau, dannevirke])
  })

  test('drops an alert that has ended', () => {
    const afterBoth = Date.UTC(2026, 9, 30, 10)

    expect(
      alertsForPins([wind, snow], [dannevirke, lewisPass], afterBoth),
    ).toEqual([])
  })

  test('says whether an alert has yet to start', () => {
    const during = Date.UTC(2026, 9, 30, 1)

    expect(alertsForPins([wind], [dannevirke], EARLY)[0].upcoming).toBe(true)
    expect(alertsForPins([wind], [dannevirke], during)[0].upcoming).toBe(false)
  })

  test('puts the worst first: orange before yellow', () => {
    const found = alertsForPins([wind, snow], [dannevirke, lewisPass], EARLY)

    expect(found.map((f) => f.alert.colour)).toEqual(['Orange', 'Yellow'])
  })

  test('puts a more severe alert before a milder one of the same colour', () => {
    const milder = { ...wind, id: 'milder', severity: 'Minor' as const }
    const worse = { ...wind, id: 'worse', severity: 'Severe' as const }

    const found = alertsForPins([milder, worse], [dannevirke], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual(['worse', 'milder'])
  })

  test('puts the one that starts first before another of the same kind', () => {
    const later = { ...wind, id: 'later', onsetUTC: wind.onsetUTC + 1000 }
    const sooner = { ...wind, id: 'sooner' }

    const found = alertsForPins([later, sooner], [dannevirke], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual(['sooner', 'later'])
  })

  test('puts an alert with no colour after the coloured ones', () => {
    const plain = { ...snow, id: 'plain', colour: undefined }

    const found = alertsForPins([plain, wind], [dannevirke, lewisPass], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual([wind.id, 'plain'])
  })

  describe('the time its map is for', () => {
    test('is the start, for an alert that has yet to start', () => {
      const [found] = alertsForPins([wind], [dannevirke], EARLY)

      expect(found.mapTimeUTC).toBe(wind.onsetUTC)
    })

    test('is now, for an alert already under way', () => {
      const during = Date.UTC(2026, 9, 30, 1)
      const [found] = alertsForPins([wind], [dannevirke], during)

      expect(found.mapTimeUTC).toBe(during)
    })
  })
})

describe('nearestChartIndex', () => {
  const hour = 60 * 60 * 1000
  const times = [0, 6 * hour, 12 * hour, 18 * hour]

  test('is the chart nearest the time', () => {
    expect(nearestChartIndex(times, 7 * hour)).toBe(1)
    expect(nearestChartIndex(times, 10 * hour)).toBe(2)
  })

  test('is the first or last chart for a time before or after them all', () => {
    expect(nearestChartIndex(times, -50 * hour)).toBe(0)
    expect(nearestChartIndex(times, 99 * hour)).toBe(3)
  })

  test('is the earlier chart for a time exactly between two', () => {
    expect(nearestChartIndex(times, 3 * hour)).toBe(0)
  })

  test('is nothing without charts', () => {
    expect(nearestChartIndex([], 5)).toBeUndefined()
  })
})
