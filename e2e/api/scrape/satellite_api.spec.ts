import { expect, test } from '@playwright/test'

test.describe('satellite api spec', () => {
  test('requesting satellite should return a 200 response', async ({
    request,
  }) => {
    const cacheResponse = await request.get(`/api/scrape/satellite`)
    expect(cacheResponse.ok()).toBeTruthy()
  })
})
