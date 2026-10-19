import { expect, test } from '@playwright/test'

const proxy = (params: Record<string, string>) =>
  `/api/fallback-image?${new URLSearchParams(params)}`

const rainChart =
  'https://metvuw.com/forecast/2026101518/rain-nz-thumb-2026101518-006.gif'

test.describe('GET /api/fallback-image', () => {
  test('serves a chart as compressed webp, cacheable', async ({ request }) => {
    const response = await request.get(
      proxy({ url: rainChart, chartType: 'Rain', variant: 'primary' }),
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/webp')
    expect(response.headers()['cache-control']).toContain('max-age=')
    expect((await response.body()).length).toBeGreaterThan(0)
  })

  test('serves a small variant where the chart type has one', async ({
    request,
  }) => {
    const response = await request.get(
      proxy({
        url: 'https://metvuw.com/satellite/big/2026101512.jpg',
        chartType: 'Satellite',
        variant: 'small',
      }),
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/webp')
  })

  test('is a 400 without its parameters', async ({ request }) => {
    expect((await request.get('/api/fallback-image')).status()).toBe(400)
  })

  test('is a 400 for an unknown chart type or variant', async ({ request }) => {
    expect(
      (
        await request.get(
          proxy({ url: rainChart, chartType: 'Tide', variant: 'primary' }),
        )
      ).status(),
    ).toBe(400)
    expect(
      (
        await request.get(
          proxy({ url: rainChart, chartType: 'Rain', variant: 'huge' }),
        )
      ).status(),
    ).toBe(400)
  })

  test('is a 400 for a url that cannot be parsed', async ({ request }) => {
    expect(
      (
        await request.get(
          proxy({ url: 'not a url', chartType: 'Rain', variant: 'primary' }),
        )
      ).status(),
    ).toBe(400)
  })

  test('is a 403 for any host that is not metvuw.com', async ({ request }) => {
    for (const url of [
      'https://evil.example/forecast/a.gif',
      'https://metvuw.com.evil.example/a.gif',
      'http://metvuw.com/forecast/a.gif',
      'https://metvuw.com:8443/forecast/a.gif',
      'https://user:pass@metvuw.com/forecast/a.gif',
    ]) {
      const response = await request.get(
        proxy({ url, chartType: 'Rain', variant: 'primary' }),
      )
      expect(response.status(), url).toBe(403)
    }
  })

  test('is a 502 when metvuw.com has no such image', async ({ request }) => {
    const response = await request.get(
      proxy({
        url: 'https://metvuw.com/forecast/2026101518/missing.txt',
        chartType: 'Rain',
        variant: 'primary',
      }),
    )

    expect(response.status()).toBe(502)
  })
})
