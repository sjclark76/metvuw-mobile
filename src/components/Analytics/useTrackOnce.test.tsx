import { renderHook } from '@testing-library/react'

import { useTrackOnce } from './useTrackOnce'

describe('useTrackOnce', () => {
  beforeEach(() => {
    window.gtag = vi.fn()
  })
  afterEach(() => {
    delete window.gtag
  })

  test('sends an event the first time only', () => {
    const { result } = renderHook(() => useTrackOnce())

    result.current('slider_used')
    result.current('slider_used')
    result.current('slider_used')

    expect(window.gtag).toHaveBeenCalledTimes(1)
  })

  test('counts each event on its own', () => {
    const { result } = renderHook(() => useTrackOnce())

    result.current('slider_used')
    result.current('rain_strip_shown')

    expect(window.gtag).toHaveBeenCalledTimes(2)
  })

  test('counts again for a new page', () => {
    const first = renderHook(() => useTrackOnce())
    first.result.current('slider_used')
    first.unmount()

    const second = renderHook(() => useTrackOnce())
    second.result.current('slider_used')

    expect(window.gtag).toHaveBeenCalledTimes(2)
  })
})
