import { act, renderHook } from '@testing-library/react'

import { useNow } from './useNow'

const MINUTE = 60 * 1000

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 20, 12, 0, 30))
  })
  afterEach(() => vi.useRealTimers())

  test('is the time, rounded down to the minute', () => {
    const { result } = renderHook(() => useNow())

    expect(result.current).toBe(Date.UTC(2026, 9, 20, 12, 0, 0))
  })

  test('moves on as time passes', () => {
    const { result } = renderHook(() => useNow())

    act(() => {
      vi.advanceTimersByTime(2 * MINUTE)
    })

    expect(result.current).toBe(Date.UTC(2026, 9, 20, 12, 2, 0))
  })

  test('rounds to the interval it is given', () => {
    const { result } = renderHook(() => useNow(60 * MINUTE))

    expect(result.current).toBe(Date.UTC(2026, 9, 20, 12, 0, 0))
  })

  test('stops its timer when it is gone', () => {
    const { unmount } = renderHook(() => useNow())

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
