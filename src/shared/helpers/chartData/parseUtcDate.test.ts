import { parseUtcDate } from './parseUtcDate'

describe('parseUtcDate', () => {
  test('returns the UTC timestamp of a real date and hour', () => {
    expect(parseUtcDate(2026, 10, 13, 18)).toBe(Date.UTC(2026, 9, 13, 18))
  })

  test('accepts the first and last moments of a month, year and day', () => {
    expect(parseUtcDate(2026, 1, 1, 0)).toBe(Date.UTC(2026, 0, 1, 0))
    expect(parseUtcDate(2026, 12, 31, 23)).toBe(Date.UTC(2026, 11, 31, 23))
  })

  test('knows leap years', () => {
    expect(parseUtcDate(2028, 2, 29, 0)).toBe(Date.UTC(2028, 1, 29, 0))
    expect(parseUtcDate(2026, 2, 29, 0)).toBeUndefined()
    expect(parseUtcDate(2100, 2, 29, 0)).toBeUndefined()
  })

  // Date.UTC would quietly turn these into a different, real date.
  test.each([
    ['month 13', [2026, 13, 1, 0]],
    ['month 0', [2026, 0, 1, 0]],
    ['day 32', [2026, 1, 32, 0]],
    ['day 31 of a 30-day month', [2026, 4, 31, 0]],
    ['day 0', [2026, 1, 0, 0]],
    ['hour 24', [2026, 1, 1, 24]],
    ['a negative hour', [2026, 1, 1, -1]],
  ])('rejects %s instead of rolling it over', (_name, parts) => {
    expect(
      parseUtcDate(...(parts as [number, number, number, number])),
    ).toBeUndefined()
  })
})
