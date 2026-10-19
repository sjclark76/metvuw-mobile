import { act, renderHook } from '@testing-library/react'

import { useOnline } from './useOnline'

const setOnline = (online: boolean) =>
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)

describe('useOnline', () => {
  afterEach(() => vi.restoreAllMocks())

  test('is true when the browser has a connection', () => {
    setOnline(true)

    expect(renderHook(() => useOnline()).result.current).toBe(true)
  })

  test('is false when it has none', () => {
    setOnline(false)

    expect(renderHook(() => useOnline()).result.current).toBe(false)
  })

  test('follows the connection going and coming back', () => {
    setOnline(true)
    const { result } = renderHook(() => useOnline())

    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })

  test('stops listening when it is gone', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnline())

    unmount()

    expect(remove).toHaveBeenCalledWith('online', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
