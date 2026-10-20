import { act, renderHook, waitFor } from '@testing-library/react'

import { pinFromPlace } from '@/shared/helpers/pins/pins'
import { decodeChart } from '@/shared/helpers/rainStrip/readRain'

import { useRainReadings } from './useRainReadings'

vi.mock('@/shared/helpers/rainStrip/readRain', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/shared/helpers/rainStrip/readRain')
  >()),
  decodeChart: vi.fn(),
}))

const wanaka = pinFromPlace({
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
})
const tekapo = pinFromPlace({
  name: 'Tekapo',
  context: 'Canterbury',
  kind: 'Town',
  latitude: -44.0,
  longitude: 170.48,
})

// A chart that is all background.
const clearChart = () =>
  Promise.resolve({
    width: 10,
    height: 10,
    data: new Uint8ClampedArray(10 * 10 * 4).fill(255),
  })

const urls = ['/a', '/b', '/c']
const props = (over = {}) => ({
  region: 'nzsi' as const,
  chartUrls: urls,
  current: 0,
  pins: [wanaka],
  ...over,
})

describe('useRainReadings', () => {
  beforeEach(() => {
    vi.mocked(decodeChart).mockReset()
    vi.mocked(decodeChart).mockImplementation(clearChart)
  })

  test('reads nothing until there is a pin', async () => {
    const { result } = renderHook(() => useRainReadings(props({ pins: [] })))

    await act(() => new Promise((r) => setTimeout(r, 120)))

    expect(decodeChart).not.toHaveBeenCalled()
    expect(result.current.size).toBe(0)
  })

  test('reads each chart at each pin, filling in as they are read', async () => {
    const { result } = renderHook(() => useRainReadings(props()))

    await waitFor(() => expect(result.current.size).toBe(3))

    expect(result.current.get('/b')?.[wanaka.id]).toEqual({ kind: 'clear' })
  })

  test('reads the chart being looked at first, then the nearest', async () => {
    renderHook(() => useRainReadings(props({ current: 2 })))

    await waitFor(() => expect(decodeChart).toHaveBeenCalledTimes(3))

    expect(vi.mocked(decodeChart).mock.calls.map(([url]) => url)).toEqual([
      '/c',
      '/b',
      '/a',
    ])
  })

  test('reads nothing until the page is ready', async () => {
    const { result, rerender } = renderHook((p) => useRainReadings(p), {
      initialProps: props({ ready: false }),
    })

    await act(() => new Promise((r) => setTimeout(r, 120)))
    expect(decodeChart).not.toHaveBeenCalled()

    rerender(props({ ready: true }))
    await waitFor(() => expect(result.current.size).toBe(3))
  })

  test('reads three charts at a time, and no more', async () => {
    let running = 0
    let most = 0
    vi.mocked(decodeChart).mockImplementation(async () => {
      most = Math.max(most, ++running)
      await new Promise((r) => setTimeout(r, 30))
      running--
      return clearChart()
    })
    const { result } = renderHook(() =>
      useRainReadings(
        props({ chartUrls: ['/a', '/b', '/c', '/d', '/e', '/f', '/g'] }),
      ),
    )

    await waitFor(() => expect(result.current.size).toBe(7))

    expect(most).toBe(3)
  })

  test('says off the chart for a pin the region’s chart does not show', async () => {
    const paris = pinFromPlace({
      name: 'Paris',
      context: 'France',
      kind: 'Town',
      latitude: 48.85,
      longitude: 2.35,
    })
    const { result } = renderHook(() =>
      useRainReadings(props({ pins: [paris] })),
    )

    await waitFor(() => expect(result.current.size).toBe(3))

    expect(result.current.get('/a')?.[paris.id]).toEqual({ kind: 'offChart' })
  })

  test('leaves a chart that cannot be read out, and carries on', async () => {
    vi.mocked(decodeChart).mockImplementation((url) =>
      url === '/b' ? Promise.reject(new Error('offline')) : clearChart(),
    )
    const { result } = renderHook(() => useRainReadings(props()))

    await waitFor(() => expect(result.current.size).toBe(2))

    expect(result.current.has('/b')).toBe(false)
    expect(result.current.has('/c')).toBe(true)
  })

  test('adding a pin reads only the pin that is new', async () => {
    const { result, rerender } = renderHook((p) => useRainReadings(p), {
      initialProps: props(),
    })
    await waitFor(() => expect(result.current.size).toBe(3))
    expect(decodeChart).toHaveBeenCalledTimes(3)

    rerender(props({ pins: [wanaka, tekapo] }))
    await waitFor(() =>
      expect(result.current.get('/c')?.[tekapo.id]).toBeDefined(),
    )

    expect(decodeChart).toHaveBeenCalledTimes(6)
    expect(result.current.get('/a')?.[wanaka.id]).toEqual({ kind: 'clear' })
  })

  test('does not read again when nothing has changed', async () => {
    const { result, rerender } = renderHook((p) => useRainReadings(p), {
      initialProps: props(),
    })
    await waitFor(() => expect(result.current.size).toBe(3))

    rerender(props({ current: 1 }))
    await act(() => new Promise((r) => setTimeout(r, 120)))

    expect(decodeChart).toHaveBeenCalledTimes(3)
  })
})
