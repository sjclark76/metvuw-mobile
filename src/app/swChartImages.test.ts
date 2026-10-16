import { buildFallbackImageProxyUrl } from '@/shared/helpers/v2/dataSource/fallbackImageProxyUrl'

import { chartImageCache } from './swChartImages'

const matches = (href: string, sameOrigin = true) =>
  chartImageCache.matcher({ url: new URL(href), sameOrigin })

describe('chart image cache', () => {
  test('matches the chart image proxy', () => {
    const path = buildFallbackImageProxyUrl({
      sourceUrl: 'https://metvuw.com/forecast/rain-nz.gif',
      chartType: 'Rain',
    })

    expect(matches(`https://metvuw.test${path}`)).toBe(true)
  })

  test.each([
    'https://metvuw.test/',
    'https://metvuw.test/api/other',
    'https://metvuw.test/_next/image?url=%2Fapi%2Ffallback-image',
  ])('leaves %s alone', (href) => {
    expect(matches(href)).toBe(false)
  })

  test('never caches a proxy of another origin', () => {
    expect(
      matches('https://elsewhere.test/api/fallback-image?x=1', false),
    ).toBe(false)
  })

  test('keeps a day of charts, and does not keep them forever', () => {
    expect(chartImageCache.maxAgeSeconds).toBe(24 * 60 * 60)
    expect(chartImageCache.maxEntries).toBeGreaterThan(40)
  })
})
