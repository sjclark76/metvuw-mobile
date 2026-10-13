import { renderToString } from 'react-dom/server'

import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

import RadarAndSatelliteImages from './RadarAndSatelliteImages'

const images: SkinnyChartData[] = [0, 1, 2].map((hour) => ({
  imageDateUTC: Date.UTC(2026, 9, 1, hour),
  url: `https://example.com/radar-${hour}.webp`,
}))

describe('<RadarAndSatelliteImages />', () => {
  // Chrome ignores invisible elements as LCP candidates, so the images in the
  // initial HTML must not start hidden and wait for hydration to animate in.
  test('renders every image in the initial HTML, not at opacity 0', () => {
    const html = renderToString(
      <RadarAndSatelliteImages images={images} chartType="Radar" />,
    )

    expect(html).not.toMatch(/opacity:\s*0/)
    expect(html.match(/<li[\s>]/g)).toHaveLength(images.length)
    expect(html.match(/<img/g)).toHaveLength(images.length)
  })

  test('fades in only the first three images, staggered', () => {
    const many = [0, 1, 2, 3, 4].map((hour) => ({
      imageDateUTC: Date.UTC(2026, 9, 1, hour),
      url: `https://example.com/radar-${hour}.webp`,
    }))
    const html = renderToString(
      <RadarAndSatelliteImages images={many} chartType="Radar" />,
    )

    const items = html.match(/<li[\s>][^>]*>/g)!
    expect(items.map((li) => li.includes('animate-fade-in-up'))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    expect(items[1]).toContain('animation-delay:100ms')
  })
})
