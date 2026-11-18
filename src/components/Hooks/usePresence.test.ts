import { act, renderHook } from '@testing-library/react'

import { usePresence } from './usePresence'

describe('usePresence', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('is gone while closed, and shown at once when opened', () => {
    const { result, rerender } = renderHook(
      ({ show }) => usePresence(show, 300),
      { initialProps: { show: false } },
    )
    expect(result.current).toBe('gone')

    rerender({ show: true })

    expect(result.current).toBe('shown')
  })

  test('is leaving for the exit time after it closes, then gone', () => {
    const { result, rerender } = renderHook(
      ({ show }) => usePresence(show, 300),
      { initialProps: { show: true } },
    )

    rerender({ show: false })
    expect(result.current).toBe('leaving')

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('leaving')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('gone')
  })

  test('is shown again, and stays, if reopened while leaving', () => {
    const { result, rerender } = renderHook(
      ({ show }) => usePresence(show, 300),
      { initialProps: { show: true } },
    )
    rerender({ show: false })
    act(() => vi.advanceTimersByTime(100))

    rerender({ show: true })
    act(() => vi.advanceTimersByTime(500))

    expect(result.current).toBe('shown')
  })
})
