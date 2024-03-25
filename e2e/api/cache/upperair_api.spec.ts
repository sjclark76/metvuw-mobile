import { expect, test } from '@playwright/test'

test.describe('radar api spec', () => {
  test('requesting radar should return a 200 response', async ({ request }) => {
    const cacheResponse = await request.get(`/api/cache/upper-air`)
    expect(cacheResponse.ok()).toBeTruthy()

    expect(await cacheResponse.json()).toEqual(
      expect.objectContaining({
        success: true,
        bucket: 'metvuw-mobile-dev',
        fileName: 'upperair.json',
      }),
    )
  })
})
