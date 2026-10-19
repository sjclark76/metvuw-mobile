import { formatAge, formatBytes } from './format'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatBytes', () => {
  test.each([
    [0, '0 KB'],
    [1, '1 KB'],
    [512, '1 KB'],
    [1024, '1 KB'],
    [340 * 1024, '340 KB'],
    [1024 * 1024 - 1, '1,024 KB'],
    [1024 * 1024, '1.0 MB'],
    [2.14 * 1024 * 1024, '2.1 MB'],
    [2.16 * 1024 * 1024, '2.2 MB'],
    [250 * 1024 * 1024, '250 MB'],
  ])('%d bytes is %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text)
  })

  test('copes with nonsense', () => {
    expect(formatBytes(NaN)).toBe('0 KB')
    expect(formatBytes(-5)).toBe('0 KB')
  })
})

describe('formatAge', () => {
  test.each([
    [0, 'just now'],
    [59_000, 'just now'],
    [MINUTE, '1 minute ago'],
    [5 * MINUTE, '5 minutes ago'],
    [59 * MINUTE, '59 minutes ago'],
    [HOUR, '1 hour ago'],
    [2.5 * HOUR, '2 hours ago'],
    [23 * HOUR + 59 * MINUTE, '23 hours ago'],
    [DAY, '1 day ago'],
    [3.9 * DAY, '3 days ago'],
    [30 * DAY, '30 days ago'],
  ])('%d ms is %s', (ms, text) => {
    expect(formatAge(ms)).toBe(text)
  })

  test('a time in the future is just now, not a negative age', () => {
    expect(formatAge(-5 * MINUTE)).toBe('just now')
  })
})
