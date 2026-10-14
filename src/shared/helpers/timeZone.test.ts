import { DEFAULT_TIME_ZONE, formatInTimeZone } from './timeZone'

// 2026-10-15 07:00 UTC
const instant = Date.UTC(2026, 9, 15, 7)

describe('formatInTimeZone', () => {
  test('formats the same instant differently per zone', () => {
    expect(formatInTimeZone(instant, 'PPPPp', 'UTC')).toBe(
      'Thursday, October 15th, 2026 at 7:00 AM',
    )
    expect(formatInTimeZone(instant, 'PPPPp', 'Pacific/Auckland')).toBe(
      'Thursday, October 15th, 2026 at 8:00 PM',
    )
    expect(formatInTimeZone(instant, 'PPPPp', 'America/New_York')).toBe(
      'Thursday, October 15th, 2026 at 3:00 AM',
    )
  })

  test('rolls the day over when the zone is on the other side of midnight', () => {
    const lateUtc = Date.UTC(2026, 9, 15, 14)

    expect(formatInTimeZone(lateUtc, 'EEEE dd/MM/yyyy hh:mm a', 'UTC')).toBe(
      'Thursday 15/10/2026 02:00 PM',
    )
    expect(
      formatInTimeZone(lateUtc, 'EEEE dd/MM/yyyy hh:mm a', 'Pacific/Auckland'),
    ).toBe('Friday 16/10/2026 03:00 AM')
  })

  test('applies daylight saving per date, not per process', () => {
    // NZDT (+13) in October, NZST (+12) in June.
    expect(
      formatInTimeZone(Date.UTC(2026, 9, 15, 0), 'HH:mm', 'Pacific/Auckland'),
    ).toBe('13:00')
    expect(
      formatInTimeZone(Date.UTC(2026, 5, 15, 0), 'HH:mm', 'Pacific/Auckland'),
    ).toBe('12:00')
  })

  test('accepts a Date or an ISO string as well as a timestamp', () => {
    const expected = formatInTimeZone(instant, 'HH:mm', 'Pacific/Auckland')

    expect(
      formatInTimeZone(new Date(instant), 'HH:mm', 'Pacific/Auckland'),
    ).toBe(expected)
    expect(
      formatInTimeZone('2026-10-15T07:00:00.000Z', 'HH:mm', 'Pacific/Auckland'),
    ).toBe(expected)
  })

  test('does not depend on the timezone of the process', () => {
    const original = process.env.TZ
    try {
      const results = ['UTC', 'Pacific/Auckland', 'America/Los_Angeles'].map(
        (processZone) => {
          process.env.TZ = processZone
          return formatInTimeZone(instant, 'PPPPp', 'Australia/Sydney')
        },
      )

      expect(new Set(results).size).toBe(1)
    } finally {
      process.env.TZ = original
    }
  })

  test('defaults to the zone of the site audience', () => {
    expect(DEFAULT_TIME_ZONE).toBe('Pacific/Auckland')
  })
})
