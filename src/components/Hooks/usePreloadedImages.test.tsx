import { renderHook } from '@testing-library/react'

import { preloadImage } from '@/shared/helpers/images'
import { SkinnyChartData } from '@/shared/types/chartData'

import { usePreloadedImages } from './usePreloadedImages'

vi.mock('@/shared/helpers/images', () => ({ preloadImage: vi.fn() }))

const chart = (url: string): SkinnyChartData => ({
  url,
  imageDateUTC: Date.UTC(2026, 9, 1),
})

describe('usePreloadedImages', () => {
  test('starts loading every chart image', () => {
    renderHook(() =>
      usePreloadedImages([chart('/a'), chart('/b'), chart('/c')]),
    )

    expect(vi.mocked(preloadImage).mock.calls.map(([url]) => url)).toEqual([
      '/a',
      '/b',
      '/c',
    ])
  })

  test('skips a chart with no url', () => {
    renderHook(() => usePreloadedImages([chart('/a'), chart('')]))

    expect(preloadImage).toHaveBeenCalledTimes(1)
  })

  test('does nothing for an empty list', () => {
    renderHook(() => usePreloadedImages([]))

    expect(preloadImage).not.toHaveBeenCalled()
  })

  test('does not start again when it re-renders with the same charts', () => {
    const charts = [chart('/a')]
    const { rerender } = renderHook(() => usePreloadedImages(charts))

    rerender()
    rerender()

    expect(preloadImage).toHaveBeenCalledTimes(1)
  })

  test('loads the new images when the charts change', () => {
    const { rerender } = renderHook(
      ({ charts }) => usePreloadedImages(charts),
      {
        initialProps: { charts: [chart('/a')] },
      },
    )

    rerender({ charts: [chart('/b')] })

    expect(vi.mocked(preloadImage).mock.calls.map(([url]) => url)).toEqual([
      '/a',
      '/b',
    ])
  })
})
