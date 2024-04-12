import { expect, test } from '@playwright/test'

import { regions } from '@/shared/types/region'

test.describe.skip('region api spec', () => {
  test('requesting for a valid region should return a 200 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/scrape/rain/nz`)
    expect(cacheResponse.ok()).toBeTruthy()
  })

  for (const region of regions) {
    test(`requesting for region ${region.code} should return a 200 response `, async ({
      request,
    }) => {
      const cacheResponse = await request.get(`/api/scrape/rain/${region.code}`)
      expect(cacheResponse.ok()).toBeTruthy()
    })
  }

  test('requesting for an invalid region should return a 404 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/scrape/rain/foobaa`)
    expect(cacheResponse.status()).toBe(404)

    expect(await cacheResponse.text()).toEqual('invalid region code: foobaa')
  })

  test('requesting with no region should return a 404 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/scrape`)
    expect(cacheResponse.status()).toBe(404)
  })
})
