import { describeFreshness, freshness, ISSUE_INTERVAL_MS } from './freshness'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 21, 12)

describe('freshness', () => {
  test('is current until the next forecast is due', () => {
    expect(freshness(NOW - 1 * HOUR, NOW)).toEqual({ state: 'current' })
    expect(freshness(NOW - ISSUE_INTERVAL_MS, NOW)).toEqual({
      state: 'current',
    })
  })

  test('is out of date once the next is due, with how long ago it was issued', () => {
    expect(freshness(NOW - 17 * HOUR, NOW)).toEqual({
      state: 'outOfDate',
      ageMs: 17 * HOUR,
    })
  })

  test('is current for a forecast issued in the future (a clock out of step)', () => {
    expect(freshness(NOW + 3 * HOUR, NOW)).toEqual({ state: 'current' })
  })

  test('is unknown without an issue time, or before the time is known', () => {
    expect(freshness(undefined, NOW)).toBeUndefined()
    expect(freshness(NOW, 0)).toBeUndefined()
  })
})

describe('describeFreshness', () => {
  test('says up to date', () => {
    expect(describeFreshness({ state: 'current' })).toBe('up to date')
  })

  test('says how long ago the forecast was issued', () => {
    expect(describeFreshness({ state: 'outOfDate', ageMs: 17 * HOUR })).toBe(
      'issued 17 hours ago',
    )
    expect(describeFreshness({ state: 'outOfDate', ageMs: 60 * HOUR })).toBe(
      'issued 2 days ago',
    )
  })

  test('says nothing when it is not known', () => {
    expect(describeFreshness(undefined)).toBeUndefined()
  })
})
