import { expect, test } from '@playwright/test'

test.describe('region api spec', () => {
  test('requesting for a valid region should return a 200 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/cache/rain/nz`)
    expect(cacheResponse.ok()).toBeTruthy()

    expect(await cacheResponse.json()).toEqual(
      expect.objectContaining({
        success: true,
        bucket: expect.stringMatching(/metvuw-mobile-dev|metvuw-mobile-prev/),
        fileName: 'nz.json',
      }),
    )
  })

  test('requesting for an invalid region should return a 404 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/cache/rain/foobaa`)
    expect(cacheResponse.status()).toBe(404)

    expect(await cacheResponse.text()).toEqual('invalid region code: foobaa')
  })

  test('requesting with no region should return a 404 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/cache`)
    expect(cacheResponse.status()).toBe(404)
  })
})
