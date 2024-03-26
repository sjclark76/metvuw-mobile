import { expect, test } from '@playwright/test'

test.describe('satellite api spec', () => {
  test('requesting satellite should return a 200 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/cache/satellite`)
    expect(cacheResponse.ok()).toBeTruthy()

    expect(await cacheResponse.json()).toEqual(
      expect.objectContaining({
        success: true,
        bucket: expect.stringMatching(/metvuw-mobile-dev|metvuw-mobile-prev/),
        fileName: 'satellite.json',
      }),
    )
  })
})
