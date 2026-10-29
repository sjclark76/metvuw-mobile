import { showOwnChart } from './showOwnChart'

const launch = Date.UTC(2026, 9, 29, 12)

describe('showOwnChart', () => {
  test("is true when metvuw's newest chart is older than the balloon", () => {
    expect(showOwnChart([launch - 1, launch - 2], launch)).toBe(true)
  })

  test("is false when metvuw's newest chart is as recent as the balloon", () => {
    expect(showOwnChart([launch - 1, launch], launch)).toBe(false)
  })

  test('is true when metvuw has no charts', () => {
    expect(showOwnChart([], launch)).toBe(true)
  })
})
