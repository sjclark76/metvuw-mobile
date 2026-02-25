import {
  buildFallbackImageProxyUrl,
  isFallbackImageProxyUrl,
  withFallbackImageProxyVariant,
} from '@/shared/helpers/v2/dataSource/fallbackImageProxyUrl'

describe('fallbackImageProxyUrl helpers', () => {
  test('builds proxy url with encoded source and defaults to primary variant', () => {
    const url = buildFallbackImageProxyUrl({
      sourceUrl: 'https://metvuw.com/forecast/2026022500/rain-nz-thumb-2026022500-042.gif',
      chartType: 'Rain',
    })

    expect(url).toContain('/api/fallback-image?')
    expect(url).toContain('chartType=Rain')
    expect(url).toContain('variant=primary')
    expect(url).toContain('url=https%3A%2F%2Fmetvuw.com%2Fforecast%2F2026022500')
  })

  test('identifies fallback proxy urls and rewrites variant', () => {
    const primaryUrl = buildFallbackImageProxyUrl({
      sourceUrl: 'https://metvuw.com/satellite/big/2026022500.jpg',
      chartType: 'Satellite',
    })
    const smallUrl = withFallbackImageProxyVariant(primaryUrl, 'small')

    expect(isFallbackImageProxyUrl(primaryUrl)).toBeTruthy()
    expect(smallUrl).toContain('variant=small')
  })

  test('returns undefined when rewriting non-proxy urls', () => {
    expect(
      withFallbackImageProxyVariant('https://metvuw.com/satellite/big/2026022500.jpg', 'small'),
    ).toBeUndefined()
  })
})
