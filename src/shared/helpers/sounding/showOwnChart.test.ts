import { showOwnChart } from './showOwnChart'

const launch = Date.UTC(2026, 9, 29, 12)
const HOUR = 60 * 60 * 1000

describe('showOwnChart', () => {
  test("is true when metvuw's newest chart is over 2 hours older than the balloon", () => {
    expect(showOwnChart([launch - 3 * HOUR, launch - 4 * HOUR], launch)).toBe(
      true,
    )
  })

  test("is false when metvuw's chart is for the same balloon, named an hour earlier", () => {
    expect(showOwnChart([launch - HOUR], launch)).toBe(false)
  })

  test("is false when metvuw's newest chart is as recent as the balloon", () => {
    expect(showOwnChart([launch - 1, launch], launch)).toBe(false)
  })

  test('is true when metvuw has no charts', () => {
    expect(showOwnChart([], launch)).toBe(true)
  })
})
