import { render } from '@testing-library/react'

import { preloadImage } from '@/shared/helpers/images'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

import { AnimatedWeatherChart } from './animated-weather-chart'

vi.mock('@/shared/helpers/images', () => ({ preloadImage: vi.fn() }))

const charts: SkinnyRainChartData[] = [0, 1, 2].map((day) => ({
  forecastDate: `2026-10-0${day + 1}T00:00:00.000Z`,
  imageDateUTC: Date.UTC(2026, 9, 1),
  url: `https://example.com/chart-${day}.webp`,
}))

describe('<AnimatedWeatherChart />', () => {
  // Charts are no longer preloaded when the page mounts; the animated viewer
  // preloads them when it opens so playback doesn't wait on the network.
  test('preloads every chart when the viewer opens', () => {
    render(
      <AnimatedWeatherChart region={findRegionByCode('nz')!} charts={charts} />,
    )

    expect(preloadImage).toHaveBeenCalledTimes(charts.length)
    charts.forEach((chart) => {
      expect(preloadImage).toHaveBeenCalledWith(chart.url)
    })
  })

  test('keeps the visible chart eager', () => {
    const { container } = render(
      <AnimatedWeatherChart region={findRegionByCode('nz')!} charts={charts} />,
    )

    expect(container.querySelector('img')).not.toHaveAttribute('loading')
  })
})
