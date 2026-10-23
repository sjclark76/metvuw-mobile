import type { RainReading } from '@/shared/helpers/rainStrip/readRain'

import { heavyRainAhead } from '.'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 23, 0)
// Ten charts, six hours apart, the first six hours after now.
const times = Array.from({ length: 10 }, (_, i) => NOW + (i + 1) * 6 * HOUR)

const clear: RainReading = { kind: 'clear' }
const off: RainReading = { kind: 'offChart' }
// A band by its lower figure in mm: 1 mm is band 0, 20+ is band 19.
const mm = (fromMm: number): RainReading => ({ kind: 'rain', band: fromMm - 1 })
const readings = (...values: (RainReading | undefined)[]) => {
  const all = Array<RainReading | undefined>(10).fill(clear)
  values.forEach((value, index) => (all[index] = value))
  return all
}

describe('heavyRainAhead', () => {
  test('finds nothing when it stays dry', () => {
    expect(heavyRainAhead(readings(), times, NOW)).toBeUndefined()
  })

  test('finds very heavy rain: the top of the scale in any six hours', () => {
    const r = readings(clear, clear, mm(20))

    expect(heavyRainAhead(r, times, NOW)).toEqual({
      level: 'veryHeavy',
      from: 2,
      to: 2,
    })
  })

  test('does not call a chart below the top of the scale very heavy', () => {
    expect(heavyRainAhead(readings(mm(19)), times, NOW)).toBeUndefined()
  })

  test('finds heavy rain: 25 mm or more over four charts in a row, at their lower figures', () => {
    const r = readings(clear, mm(6), mm(7), mm(5), mm(8))

    expect(heavyRainAhead(r, times, NOW)).toEqual({
      level: 'heavy',
      from: 1,
      to: 4,
      atLeastMm: 26,
    })
  })

  test('does not count 24 mm over a day as heavy', () => {
    const r = readings(mm(6), mm(6), mm(6), mm(6))

    expect(heavyRainAhead(r, times, NOW)).toBeUndefined()
  })

  test('counts exactly 25 mm as heavy', () => {
    const r = readings(mm(7), mm(6), mm(6), mm(6))

    expect(heavyRainAhead(r, times, NOW)?.level).toBe('heavy')
  })

  test('does not add rain that falls more than a day apart', () => {
    // 13 mm, then three dry charts, then 13 mm: never 25 in four in a row.
    const r = readings(mm(13), clear, clear, clear, mm(13))

    expect(heavyRainAhead(r, times, NOW)).toBeUndefined()
  })

  test('takes the earliest heavy day', () => {
    const r = readings(clear, mm(13), mm(13), clear, clear, mm(13), mm(13))

    expect(heavyRainAhead(r, times, NOW)).toMatchObject({
      level: 'heavy',
      from: 0,
    })
  })

  test('prefers very heavy rain to heavy, even when the heavy day comes first', () => {
    const r = readings(mm(13), mm(13), clear, clear, clear, clear, mm(20))

    expect(heavyRainAhead(r, times, NOW)).toEqual({
      level: 'veryHeavy',
      from: 6,
      to: 6,
    })
  })

  test('ignores charts that are already past', () => {
    const past = times.map((time) => time - 3 * 6 * HOUR)
    const r = readings(mm(20), mm(20), clear)

    // Charts 0 and 1 are now in the past; chart 2 onward is dry.
    expect(heavyRainAhead(r, past, NOW)).toBeUndefined()
  })

  test('counts a chart not read yet as nothing, until it is read', () => {
    const r = readings(mm(13), undefined, mm(13))

    expect(heavyRainAhead(r, times, NOW)).toMatchObject({ level: 'heavy' })
    expect(
      heavyRainAhead(readings(mm(13), undefined, mm(11)), times, NOW),
    ).toBeUndefined()
  })

  test('finds nothing for a place the chart does not show', () => {
    expect(
      heavyRainAhead(readings(off, off, off, off), times, NOW),
    ).toBeUndefined()
  })
})
