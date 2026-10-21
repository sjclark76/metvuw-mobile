import { act, render } from '@testing-library/react'

import { RefreshWhenStale, STALE_AFTER_MS } from './RefreshWhenStale'

const state = vi.hoisted(() => ({
  refresh: vi.fn(),
  pathname: '/regions/nz',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: state.refresh }),
  usePathname: () => state.pathname,
}))

const MINUTE = 60 * 1000

function setVisibility(value: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value,
    configurable: true,
  })
}
const comeBack = () => {
  setVisibility('visible')
  document.dispatchEvent(new Event('visibilitychange'))
}
const goAway = () => {
  setVisibility('hidden')
  document.dispatchEvent(new Event('visibilitychange'))
}
const restoredFromCache = () => {
  const event = new Event('pageshow') as PageTransitionEvent
  Object.defineProperty(event, 'persisted', { value: true })
  window.dispatchEvent(event)
}

describe('<RefreshWhenStale />', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T08:00:00Z'))
    state.refresh.mockClear()
    state.pathname = '/regions/nz'
    setVisibility('visible')
  })
  afterEach(() => vi.useRealTimers())

  test('refreshes when the visitor comes back after a long time', () => {
    render(<RefreshWhenStale />)
    goAway()
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))

    comeBack()

    expect(state.refresh).toHaveBeenCalledTimes(1)
  })

  test('does not refresh for a short break', () => {
    render(<RefreshWhenStale />)
    goAway()
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS - MINUTE))

    comeBack()

    expect(state.refresh).not.toHaveBeenCalled()
  })

  test('does not refresh when the app is only sent to the background', () => {
    render(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))

    goAway()

    expect(state.refresh).not.toHaveBeenCalled()
  })

  test('starts the time again after a refresh', () => {
    render(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))
    comeBack()
    expect(state.refresh).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(5 * MINUTE))
    comeBack()

    expect(state.refresh).toHaveBeenCalledTimes(1)
  })

  test('refreshes a page restored from the back and forward cache', () => {
    render(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))

    restoredFromCache()

    expect(state.refresh).toHaveBeenCalledTimes(1)
  })

  test('ignores a page shown for the first time', () => {
    render(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))

    const event = new Event('pageshow') as PageTransitionEvent
    Object.defineProperty(event, 'persisted', { value: false })
    window.dispatchEvent(event)

    expect(state.refresh).not.toHaveBeenCalled()
  })

  test('counts from the last page the visitor went to', () => {
    const { rerender } = render(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS - MINUTE))
    state.pathname = '/regions/nzsi'
    rerender(<RefreshWhenStale />)
    act(() => vi.advanceTimersByTime(5 * MINUTE))

    comeBack()

    expect(state.refresh).not.toHaveBeenCalled()
  })

  test('stops listening when it is removed', () => {
    const { unmount } = render(<RefreshWhenStale />)
    unmount()
    act(() => vi.advanceTimersByTime(STALE_AFTER_MS + MINUTE))

    comeBack()

    expect(state.refresh).not.toHaveBeenCalled()
  })
})
