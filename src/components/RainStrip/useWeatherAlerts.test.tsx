import { renderHook, waitFor } from '@testing-library/react'

import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { useWeatherAlerts } from './useWeatherAlerts'

const alert: WeatherAlert = {
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  onsetUTC: 1,
  expiresUTC: 2,
  web: 'https://metservice.com/warnings/home',
  areas: [
    {
      description: 'Somewhere',
      polygons: [
        [
          [0, 0],
          [0, 1],
          [1, 0],
        ],
      ],
    },
  ],
}
const fetchMock = vi.fn()

describe('useWeatherAlerts', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('fetches the alerts once, when it is enabled', async () => {
    fetchMock.mockResolvedValue(Response.json({ alerts: [alert] }))

    const { result, rerender } = renderHook(
      ({ enabled }) => useWeatherAlerts(enabled),
      { initialProps: { enabled: true } },
    )
    await waitFor(() => expect(result.current).toEqual([alert]))
    rerender({ enabled: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/warnings')
  })

  test('does not ask while it is not enabled', () => {
    renderHook(() => useWeatherAlerts(false))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('has no alerts when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })

  test('has no alerts when the answer is an error', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: false }, { status: 502 }))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })

  test('has no alerts when the answer is not a list of them', async () => {
    fetchMock.mockResolvedValue(Response.json({ alerts: 'soon' }))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })
})
