import { formatInTimeZone } from '@/shared/helpers/timeZone'

import { dayBoundaries, nowPosition, visibleTicks } from './axisGeometry'

const HOUR = 36e5
const zone = 'Pacific/Auckland'
const dayOf = (t: number) => formatInTimeZone(t, 'yyyy-MM-dd', zone)
const labelOf = (t: number) => formatInTimeZone(t, 'EEE', zone)

// Six-hourly charts from 18Z on 18 Oct 2026. New Zealand is on NZDT (+13), so
// the first chart (00Z, 19 Oct) is 13:00 Monday.
const run = Date.UTC(2026, 9, 18, 18)
const sixHourly = Array.from({ length: 12 }, (_, i) => run + (i + 1) * 6 * HOUR)

describe('dayBoundaries', () => {
  test('puts a tick at each local midnight, between the charts either side', () => {
    const boundaries = dayBoundaries(sixHourly, { dayOf, labelOf })

    // Charts at 13:00 (Mon), 19:00, 01:00 (Tue): midnight is 5/6 of the way
    // from the second chart to the third.
    expect(boundaries[0].position).toBeCloseTo(1 + 5 / 6, 1)
    expect(boundaries[0].label).toBe('Tue')
  })

  test('labels each new day', () => {
    const labels = dayBoundaries(sixHourly, { dayOf, labelOf }).map(
      (b) => b.label,
    )

    expect(labels).toEqual(['Tue', 'Wed', 'Thu'])
  })

  test('has one boundary per day change, in order', () => {
    const positions = dayBoundaries(sixHourly, { dayOf, labelOf }).map(
      (b) => b.position,
    )

    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(new Set(positions).size).toBe(positions.length)
  })

  test('uses the zone it is told, not the machine it runs on', () => {
    const inUtc = dayBoundaries(sixHourly, {
      dayOf: (t) => formatInTimeZone(t, 'yyyy-MM-dd', 'UTC'),
      labelOf: (t) => formatInTimeZone(t, 'EEE', 'UTC'),
    })

    // In UTC the first chart is 00:00 Monday itself: the day changes between
    // the run's last chart and the first, which is before the axis starts.
    expect(inUtc[0].label).toBe('Tue')
    expect(inUtc[0].position).not.toBeCloseTo(
      dayBoundaries(sixHourly, { dayOf, labelOf })[0].position,
      1,
    )
  })

  test('finds nothing when every chart is on the same day', () => {
    const morning = [0, 1, 2, 3].map((h) => Date.UTC(2026, 9, 19, h))

    expect(
      dayBoundaries(morning, {
        dayOf: (t) => formatInTimeZone(t, 'yyyy-MM-dd', 'UTC'),
        labelOf,
      }),
    ).toEqual([])
  })

  test('copes with one chart, none, and charts at the same instant', () => {
    expect(dayBoundaries([], { dayOf, labelOf })).toEqual([])
    expect(dayBoundaries([run], { dayOf, labelOf })).toEqual([])
    expect(() => dayBoundaries([run, run], { dayOf, labelOf })).not.toThrow()
  })

  test('works for charts ten minutes apart (radar)', () => {
    const radar = Array.from({ length: 12 }, (_, i) =>
      Date.UTC(2026, 9, 19, 10, 30 + i * 10),
    )

    // 10:30Z-12:20Z is 23:30 Mon - 01:20 Tue in NZDT.
    const [boundary] = dayBoundaries(radar, { dayOf, labelOf })

    expect(boundary.label).toBe('Tue')
    expect(boundary.position).toBeCloseTo(3, 0)
  })
})

describe('nowPosition', () => {
  test('is the fractional chart index of the current moment', () => {
    // Halfway between the first and second chart.
    const now = (sixHourly[0] + sixHourly[1]) / 2

    expect(nowPosition(sixHourly, now)).toBeCloseTo(0.5, 5)
  })

  test('is exactly the index when now is a chart time', () => {
    expect(nowPosition(sixHourly, sixHourly[4])).toBeCloseTo(4, 5)
  })

  // Charts are not always evenly spaced (a missing run leaves a gap), so the
  // position is measured within the pair of charts either side of now.
  test('measures within the two charts either side, however unevenly spaced', () => {
    const uneven = [0, 10 * HOUR, 100 * HOUR]

    expect(nowPosition(uneven, 5 * HOUR)).toBeCloseTo(0.5, 5)
    expect(nowPosition(uneven, 55 * HOUR)).toBeCloseTo(1.5, 5)
  })

  test('is undefined before the first chart and after the last', () => {
    expect(nowPosition(sixHourly, sixHourly[0] - 1)).toBeUndefined()
    expect(nowPosition(sixHourly, sixHourly.at(-1)! + 1)).toBeUndefined()
  })

  test('is undefined when there is nothing to place it between', () => {
    expect(nowPosition([], run)).toBeUndefined()
    expect(nowPosition([run], run)).toBeUndefined()
  })

  test('does not divide by zero for charts at the same instant', () => {
    expect(nowPosition([run, run, run + HOUR], run)).not.toBeNaN()
  })
})

describe('visibleTicks', () => {
  const spacing = (ticks: number[], count: number, width: number) =>
    (width / (count - 1)) *
    Math.min(...ticks.slice(1).map((t, i) => t - ticks[i]))

  test('draws every tick when they all fit', () => {
    expect(visibleTicks(10, 300, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  // 40 charts on a phone-width axis put ticks 6px apart: a barcode.
  test('draws only as many as fit, however many charts there are', () => {
    const ticks = visibleTicks(40, 250, 10)

    expect(ticks.length).toBeLessThan(40)
    expect(spacing(ticks, 40, 250)).toBeGreaterThanOrEqual(10)
  })

  test('thins out evenly, keeping the first chart', () => {
    const ticks = visibleTicks(40, 250, 10)
    const gaps = ticks.slice(1).map((t, i) => t - ticks[i])

    expect(ticks[0]).toBe(0)
    expect(new Set(gaps).size).toBe(1)
  })

  test('draws more as the axis gets wider', () => {
    expect(visibleTicks(40, 700, 10).length).toBeGreaterThan(
      visibleTicks(40, 250, 10).length,
    )
  })

  test('keeps the last chart when there is room, and drops it when it would crowd', () => {
    // 11 charts over 100px: every tick is 10px apart, so all fit and the last stays.
    expect(visibleTicks(11, 100, 10).at(-1)).toBe(10)

    // 40 charts over 250px: stride 2 hits 38, and 39 would sit 6px from it.
    expect(visibleTicks(40, 250, 10).at(-1)).not.toBe(39)
  })

  test('copes with nothing, one chart, and a zero width', () => {
    expect(visibleTicks(0, 300, 10)).toEqual([])
    expect(visibleTicks(1, 300, 10)).toEqual([0])
    expect(visibleTicks(5, 0, 10)).toEqual([0])
  })
})
