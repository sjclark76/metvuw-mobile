import { expect, test } from '@playwright/test'

test.describe.skip('radar api spec', () => {
  test('requesting radar should return a 200 response', async ({ request }) => {
    const cacheResponse = await request.get(`/api/scrape/radar`)
    expect(cacheResponse.ok()).toBeTruthy()
  })
})
