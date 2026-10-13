import { renderToString } from 'react-dom/server'

import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

import WeatherChartsWithAnimation from './WeatherChartsWithAnimation'

const region = findRegionByCode('nz')!

const charts: SkinnyRainChartData[] = [0, 1, 2, 3].map((day) => ({
  forecastDate: `2026-10-0${day + 1}T00:00:00.000Z`,
  imageDateUTC: Date.UTC(2026, 9, 1),
  url: `https://example.com/chart-${day}.webp`,
}))

describe('<WeatherChartsWithAnimation />', () => {
  // Chrome ignores invisible elements as LCP candidates, so the charts in the
  // initial HTML must not start hidden and wait for hydration to animate in.
  test('renders every chart in the initial HTML, not at opacity 0', () => {
    const html = renderToString(
      <WeatherChartsWithAnimation region={region} charts={charts} />,
    )

    expect(html).not.toMatch(/opacity:\s*0/)
    expect(html.match(/<li[\s>]/g)).toHaveLength(charts.length)
    expect(html.match(/<img/g)).toHaveLength(charts.length)
  })
})
