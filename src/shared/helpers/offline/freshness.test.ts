import {
  describeFreshness,
  formatBehind,
  freshness,
  ISSUE_INTERVAL_MS,
} from './freshness'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 21, 12)

describe('freshness', () => {
  test('is current until the next forecast is due', () => {
    expect(freshness(NOW - 1 * HOUR, NOW)).toEqual({ state: 'current' })
    expect(freshness(NOW - ISSUE_INTERVAL_MS, NOW)).toEqual({
      state: 'current',
    })
  })

  test('is out of date by how long the next one has been due', () => {
    expect(freshness(NOW - 17 * HOUR, NOW)).toEqual({
      state: 'outOfDate',
      behindMs: 5 * HOUR,
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

describe('formatBehind', () => {
  test('says under an hour, then hours, then days', () => {
    expect(formatBehind(10 * 60 * 1000)).toBe('under an hour')
    expect(formatBehind(1 * HOUR)).toBe('1 hour')
    expect(formatBehind(5 * HOUR + 59 * 60 * 1000)).toBe('5 hours')
    expect(formatBehind(24 * HOUR)).toBe('1 day')
    expect(formatBehind(60 * HOUR)).toBe('2 days')
  })
})

describe('describeFreshness', () => {
  test('says up to date', () => {
    expect(describeFreshness({ state: 'current' }, true)).toBe('up to date')
    expect(describeFreshness({ state: 'current' }, false)).toBe('up to date')
  })

  test('says how far out of date, online', () => {
    expect(
      describeFreshness({ state: 'outOfDate', behindMs: 5 * HOUR }, true),
    ).toBe('5 hours out of date')
  })

  test('says only probably, with no connection to look for a newer one', () => {
    expect(
      describeFreshness({ state: 'outOfDate', behindMs: 5 * HOUR }, false),
    ).toBe('probably 5 hours out of date')
  })

  test('says nothing when it is not known', () => {
    expect(describeFreshness(undefined, true)).toBeUndefined()
  })
})
