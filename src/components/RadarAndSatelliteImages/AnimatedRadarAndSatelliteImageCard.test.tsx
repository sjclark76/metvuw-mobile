import { render } from '@testing-library/react'

import { preloadImage } from '@/shared/helpers/images'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

import { AnimatedRadarAndSatelliteImageCard } from './AnimatedRadarAndSatelliteImageCard'

vi.mock('@/shared/helpers/images', () => ({ preloadImage: vi.fn() }))

const images: SkinnyChartData[] = [0, 1, 2].map((hour) => ({
  imageDateUTC: Date.UTC(2026, 9, 1, hour),
  url: `https://example.com/radar-${hour}.webp`,
}))

describe('<AnimatedRadarAndSatelliteImageCard />', () => {
  test('preloads every image when the viewer opens', () => {
    render(
      <AnimatedRadarAndSatelliteImageCard images={images} chartType="Radar" />,
    )

    expect(preloadImage).toHaveBeenCalledTimes(images.length)
    images.forEach((image) => {
      expect(preloadImage).toHaveBeenCalledWith(image.url)
    })
  })
})
